"""
Cross-file, repo-wide taint analysis for Python (stdlib `ast`).

Unlike a per-file scanner, this builds a *project* model:

  1. Parse every .py file → module map keyed by dotted module name.
  2. Resolve imports per module → alias table mapping local names to global
     function ids (only project-defined functions; stdlib/3rd-party ignored).
  3. Index every function by a global id ("pkg.mod.func" / "pkg.mod.Class.method").
  4. Compute per-function *summaries* with a project-wide fixpoint:
       - return_taint_params: param indices whose taint reaches the return value
       - (used so a caller can propagate taint through a callee's return)
  5. Propagate taint from entry points (framework handlers / request sources)
     through the GLOBAL call graph with a bounded worklist, crossing file
     boundaries via resolved callee ids, recording a source→sink path with
     file:line hops.

Output: list[Flow] — each a proven source→sink path, possibly spanning files.

The sink/source/sanitizer knowledge lives in knowledge.py.
"""
from __future__ import annotations

import ast
import os
from dataclasses import dataclass, field

from .knowledge import (
    DOTTED_SINKS, METHOD_SINKS, SANITIZERS, SANITIZER_METHODS,
    SOURCE_ATTRS, SOURCE_CONTAINERS, ENTRYPOINT_DECORATORS, ENTRYPOINT_FUNC_NAMES,
    SinkSpec,
)

MAX_DEPTH = 6  # cross-file call hops from an entry point


# --------------------------------------------------------------------------- #
# Result shape
# --------------------------------------------------------------------------- #
@dataclass
class Flow:
    sink_name: str
    cwe: str
    label: str
    source_desc: str
    source_file: str
    source_line: int
    sink_file: str
    sink_line: int
    function: str                       # global id of the sink's function
    path: list[str] = field(default_factory=list)   # human-readable hops
    sanitized: bool = False
    interprocedural: bool = False
    cross_file: bool = False
    confidence: float = 0.9


# --------------------------------------------------------------------------- #
# Project model
# --------------------------------------------------------------------------- #
@dataclass
class FuncInfo:
    gid: str                            # global id, e.g. "api.views.SCA.post"
    node: ast.FunctionDef | ast.AsyncFunctionDef
    module: str                         # dotted module name
    file_rel: str
    params: list[str]                   # positional param names (self/cls dropped)
    decorators: list[str]
    is_method: bool


@dataclass
class ModuleInfo:
    module: str
    file_rel: str
    tree: ast.Module
    # local name -> global module name (for `import x`, `import x.y as z`)
    import_modules: dict[str, str] = field(default_factory=dict)
    # local name -> global function id (for `from m import f [as g]`)
    import_names: dict[str, str] = field(default_factory=dict)


def _dotted(node: ast.AST) -> str | None:
    if isinstance(node, ast.Name):
        return node.id
    if isinstance(node, ast.Attribute):
        base = _dotted(node.value)
        return f"{base}.{node.attr}" if base else node.attr
    return None


def _place(node: ast.AST) -> str | None:
    """Canonical key for a taintable place: variable, const-keyed dict field, or
    attribute. e.g. x -> 'x', ctx['cmd'] -> "ctx['cmd']", self.q -> 'self.q'."""
    if isinstance(node, ast.Name):
        return node.id
    if isinstance(node, ast.Attribute):
        base = _place(node.value)
        return f"{base}.{node.attr}" if base else None
    if isinstance(node, ast.Subscript) and isinstance(node.slice, ast.Constant):
        base = _place(node.value)
        return f"{base}[{node.slice.value!r}]" if base else None
    return None


def _path_to_module(rel_path: str) -> str:
    """api/views.py -> api.views ; pkg/__init__.py -> pkg"""
    p = rel_path[:-3] if rel_path.endswith(".py") else rel_path
    p = p.replace(os.sep, "/")
    if p.endswith("/__init__"):
        p = p[: -len("/__init__")]
    return p.strip("/").replace("/", ".")


# --------------------------------------------------------------------------- #
# Build the project index
# --------------------------------------------------------------------------- #
class ProjectIndex:
    def __init__(self) -> None:
        self.modules: dict[str, ModuleInfo] = {}
        self.funcs: dict[str, FuncInfo] = {}        # gid -> FuncInfo
        self.module_funcs: dict[str, list[str]] = {}  # module -> [gid]

    def add_file(self, rel_path: str, content: str) -> None:
        try:
            tree = ast.parse(content)
        except SyntaxError:
            return
        module = _path_to_module(rel_path)
        mi = ModuleInfo(module=module, file_rel=rel_path, tree=tree)
        self._resolve_imports(mi)
        self.modules[module] = mi
        self._index_functions(mi)

    def _resolve_imports(self, mi: ModuleInfo) -> None:
        for node in mi.tree.body:
            if isinstance(node, ast.Import):
                for alias in node.names:
                    local = alias.asname or alias.name.split(".")[0]
                    mi.import_modules[local] = alias.asname or alias.name
            elif isinstance(node, ast.ImportFrom):
                # Resolve relative imports against this module's package.
                if node.level:
                    pkg_parts = mi.module.split(".")
                    base_parts = pkg_parts[: len(pkg_parts) - node.level] if node.level <= len(pkg_parts) else []
                    base = ".".join(base_parts)
                    mod = f"{base}.{node.module}" if node.module else base
                else:
                    mod = node.module or ""
                for alias in node.names:
                    local = alias.asname or alias.name
                    # Could be a function, class, or submodule; store both a
                    # name-level candidate ("mod.name") and treat "mod" as module.
                    mi.import_names[local] = f"{mod}.{alias.name}" if mod else alias.name
                    mi.import_modules.setdefault(local, f"{mod}.{alias.name}" if mod else alias.name)

    def _index_functions(self, mi: ModuleInfo) -> None:
        gids: list[str] = []

        def visit(node: ast.AST, prefix: str, in_class: bool) -> None:
            for child in ast.iter_child_nodes(node):
                if isinstance(child, ast.ClassDef):
                    visit(child, f"{prefix}.{child.name}", True)
                elif isinstance(child, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    gid = f"{prefix}.{child.name}"
                    params = [a.arg for a in child.args.args if a.arg not in ("self", "cls")]
                    decos = [_dotted(d) or "" for d in child.decorator_list]
                    self.funcs[gid] = FuncInfo(
                        gid=gid, node=child, module=mi.module, file_rel=mi.file_rel,
                        params=params, decorators=decos, is_method=in_class,
                    )
                    gids.append(gid)
                    # nested functions/classes
                    visit(child, gid, False)

        visit(mi.tree, mi.module, False)
        self.module_funcs[mi.module] = gids

    def resolve_call_target(self, mi: ModuleInfo, call_dotted: str) -> str | None:
        """Map a call target (as written in `mi`) to a project function gid, or
        None if it's external/unresolvable. Handles:
          foo()            -> same-module or imported function
          mod.foo()        -> imported-module function
        """
        if not call_dotted:
            return None
        head, _, rest = call_dotted.partition(".")

        # from-imports: `foo` bound directly to a global id
        if not rest and call_dotted in mi.import_names:
            cand = mi.import_names[call_dotted]
            return cand if cand in self.funcs else None

        # same-module function: module.foo
        same = f"{mi.module}.{call_dotted}"
        if same in self.funcs:
            return same

        # imported module alias: `svc.get` where svc -> services.user
        if head in mi.import_modules:
            base = mi.import_modules[head]
            cand = f"{base}.{rest}" if rest else base
            if cand in self.funcs:
                return cand
            # `import services.user as svc; svc.get_user()` where base already full
            cand2 = f"{mi.import_modules[head]}.{rest}" if rest else mi.import_modules[head]
            if cand2 in self.funcs:
                return cand2

        # from-import of a module then attribute: `from services import user; user.get()`
        if head in mi.import_names:
            base = mi.import_names[head]
            cand = f"{base}.{rest}" if rest else base
            if cand in self.funcs:
                return cand
        return None


# --------------------------------------------------------------------------- #
# Intra-procedural taint visitor
# --------------------------------------------------------------------------- #
@dataclass
class _CallHop:
    callee_gid: str
    tainted_arg_positions: tuple[int, ...]
    line: int


class _FuncTaint(ast.NodeVisitor):
    """Analyze one function body with a given set of seeded-tainted param places.

    Produces:
      - self.flows: sinks reached by tainted data (line + spec + sanitized)
      - self.return_tainted: whether a tainted value reaches a `return`
      - self.call_hops: calls into project functions carrying tainted args
    Field-sensitive over simple places (Name / const-keyed subscript / attribute).
    """

    def __init__(self, fi: FuncInfo, index: ProjectIndex, mi: ModuleInfo,
                 seeded: set[str], return_taint_params: dict[str, set[int]]):
        self.fi = fi
        self.index = index
        self.mi = mi
        self.tainted: set[str] = set(seeded)
        self.return_taint_params = return_taint_params
        self.flows: list[tuple[SinkSpec, int, bool, str]] = []  # spec, line, sanitized, source_desc
        self.return_tainted = False
        self.call_hops: list[_CallHop] = []
        # remember which seeded place seeded which param, for path text
        self._seed_desc = "tainted parameter"

    # ---- expression taint ------------------------------------------------- #
    def _expr_tainted(self, node: ast.AST) -> bool:
        if node is None:
            return False
        if isinstance(node, ast.Constant):
            return False
        # A place we currently consider tainted
        pl = _place(node)
        if pl and pl in self.tainted:
            return True
        # Reading a request source attribute/subscript: request.GET, request.data["x"]
        if isinstance(node, ast.Attribute) and node.attr in SOURCE_ATTRS:
            return True
        if isinstance(node, ast.Subscript):
            if self._expr_tainted(node.value):
                return True
        if isinstance(node, ast.Attribute):
            if self._expr_tainted(node.value):
                return True
        if isinstance(node, ast.BinOp):
            return self._expr_tainted(node.left) or self._expr_tainted(node.right)
        if isinstance(node, ast.BoolOp):
            return any(self._expr_tainted(v) for v in node.values)
        if isinstance(node, (ast.JoinedStr,)):  # f-strings
            return any(self._expr_tainted(v.value) for v in node.values
                       if isinstance(v, ast.FormattedValue))
        if isinstance(node, ast.FormattedValue):
            return self._expr_tainted(node.value)
        if isinstance(node, (ast.List, ast.Tuple, ast.Set)):
            return any(self._expr_tainted(e) for e in node.elts)
        if isinstance(node, ast.Dict):
            return any(self._expr_tainted(v) for v in node.values if v)
        if isinstance(node, ast.Starred):
            return self._expr_tainted(node.value)
        if isinstance(node, ast.IfExp):
            return self._expr_tainted(node.body) or self._expr_tainted(node.orelse)
        if isinstance(node, ast.Call):
            return self._call_returns_taint(node)
        return False

    def _is_sanitized_call(self, node: ast.Call) -> bool:
        target = _dotted(node.func)
        if target and (target in SANITIZERS or target.split(".")[-1] in SANITIZERS):
            return True
        if isinstance(node.func, ast.Attribute) and node.func.attr in SANITIZER_METHODS:
            return True
        # ".format()" / ".join()" propagate taint (handled in _call_returns_taint);
        # here we only treat explicit sanitizers as cleansing.
        return False

    def _call_returns_taint(self, node: ast.Call) -> bool:
        # Sanitizer strips taint.
        if self._is_sanitized_call(node):
            return False
        target = _dotted(node.func)
        # str methods that carry taint from receiver: "x".format(tainted), tainted.strip()
        if isinstance(node.func, ast.Attribute):
            if node.func.attr in ("format", "join", "strip", "lower", "upper",
                                   "replace", "decode", "encode", "get"):
                if self._expr_tainted(node.func.value):
                    return True
                if any(self._expr_tainted(a) for a in node.args):
                    return True
        # project function whose return is tainted by a tainted arg
        if target:
            gid = self.index.resolve_call_target(self.mi, target)
            if gid and gid in self.return_taint_params:
                rp = self.return_taint_params[gid]
                for i, a in enumerate(node.args):
                    if i in rp and self._expr_tainted(a):
                        return True
        # generic: a tainted arg to an unknown call does NOT propagate (conservative
        # to limit FPs), except the str-method cases above.
        return False

    # ---- statement handling ---------------------------------------------- #
    def visit_Assign(self, node: ast.Assign) -> None:
        self.generic_visit(node)
        tainted = self._expr_tainted(node.value)
        for tgt in node.targets:
            self._assign_place(tgt, tainted)

    def visit_AnnAssign(self, node: ast.AnnAssign) -> None:
        self.generic_visit(node)
        if node.value is not None:
            self._assign_place(node.target, self._expr_tainted(node.value))

    def visit_AugAssign(self, node: ast.AugAssign) -> None:
        self.generic_visit(node)
        if self._expr_tainted(node.value) or self._expr_tainted(node.target):
            self._assign_place(node.target, True)

    def _assign_place(self, tgt: ast.AST, tainted: bool) -> None:
        pl = _place(tgt)
        if pl is None:
            # tuple unpacking: taint all names if RHS tainted
            if isinstance(tgt, (ast.Tuple, ast.List)):
                for e in tgt.elts:
                    self._assign_place(e, tainted)
            return
        if tainted:
            self.tainted.add(pl)
        else:
            self.tainted.discard(pl)

    def visit_Return(self, node: ast.Return) -> None:
        self.generic_visit(node)
        if node.value is not None and self._expr_tainted(node.value):
            self.return_tainted = True

    def visit_Call(self, node: ast.Call) -> None:
        self._check_sink(node)
        self._record_hop(node)
        self.generic_visit(node)

    # ---- sink detection --------------------------------------------------- #
    def _check_sink(self, node: ast.Call) -> None:
        sanitized = self._args_only_via_sanitizer(node)
        target = _dotted(node.func)

        spec: SinkSpec | None = None
        if target and target in DOTTED_SINKS:
            spec = DOTTED_SINKS[target]
        elif target and target.split(".")[-1] in DOTTED_SINKS:
            spec = DOTTED_SINKS[target.split(".")[-1]]
        elif isinstance(node.func, ast.Attribute) and node.func.attr in METHOD_SINKS:
            ms = METHOD_SINKS[node.func.attr]
            recv = _dotted(node.func.value) or ""
            if not ms.receiver_any_of or any(r in recv for r in ms.receiver_any_of):
                spec = ms.spec

        if spec is None:
            return
        if not self._sink_arg_tainted(node, spec):
            return
        self.flows.append((spec, node.lineno, sanitized, self._seed_desc))

    def _sink_arg_tainted(self, node: ast.Call, spec: SinkSpec) -> bool:
        # keyword args
        for kw in node.keywords:
            if kw.arg and kw.arg in spec.arg_keywords and self._expr_tainted(kw.value):
                return True
        if spec.any_arg and not spec.arg_positions and not spec.arg_keywords:
            if any(self._expr_tainted(a) for a in node.args):
                return True
            # SQL parameterization: first arg constant + later tainted -> safe
        # specific positions
        for i, a in enumerate(node.args):
            if spec.arg_positions and i not in spec.arg_positions:
                continue
            if not spec.arg_positions and not spec.any_arg:
                continue
            if self._expr_tainted(a):
                # parameterized SQL guard: .execute(CONST, tainted_params) is safe
                if spec.cwe == "CWE-89" and i > 0 and node.args and isinstance(node.args[0], ast.Constant):
                    continue
                return True
        # any_arg fallback for positional when positions unspecified
        if spec.any_arg and spec.arg_positions:
            for i, a in enumerate(node.args):
                if i in spec.arg_positions and self._expr_tainted(a):
                    return True
        return False

    def _args_only_via_sanitizer(self, node: ast.Call) -> bool:
        """True if the tainted value reaching this call passed through a sanitizer
        (best-effort: any direct arg is a sanitizer call wrapping taint)."""
        for a in node.args:
            if isinstance(a, ast.Call) and self._is_sanitized_call(a):
                if any(self._expr_tainted(x) for x in a.args):
                    return True
        return False

    # ---- inter-procedural hop recording ----------------------------------- #
    def _record_hop(self, node: ast.Call) -> None:
        target = _dotted(node.func)
        if not target:
            return
        gid = self.index.resolve_call_target(self.mi, target)
        if not gid:
            return
        positions = tuple(i for i, a in enumerate(node.args) if self._expr_tainted(a))
        # also treat tainted keyword args mapped by name later; keep positional here
        if positions:
            self.call_hops.append(_CallHop(gid, positions, node.lineno))


# --------------------------------------------------------------------------- #
# Public entry: analyze a whole project
# --------------------------------------------------------------------------- #
def _seed_for_params(fi: FuncInfo, positions: set[int]) -> set[str]:
    seeded: set[str] = set()
    for i in positions:
        if 0 <= i < len(fi.params):
            seeded.add(fi.params[i])
    return seeded


def _reads_request_source(node: ast.AST) -> bool:
    """True if the function body reads a request-like source directly, e.g.
    `request.args[...]`, `request.data`, `self.request.GET`. Catches handlers
    that take taint from a module-level `request` rather than a param."""
    for n in ast.walk(node):
        if isinstance(n, ast.Attribute) and n.attr in SOURCE_ATTRS:
            base = _dotted(n.value) or ""
            # base ends in a request-like container (request/req/self.request/...)
            if any(part in SOURCE_CONTAINERS for part in base.split(".")):
                return True
    return False


def _entry_seed(fi: FuncInfo) -> set[str] | None:
    """If fi is an attacker-facing entry point, return the set of param places to
    seed as tainted (its request-like params). None if not an entry point.

    Entry points are: framework-decorated handlers, well-known handler names,
    functions with request-like params, OR any function that reads a request
    source (request.args/data/GET/...) directly in its body."""
    deco_hit = any(d.split(".")[-1] in {x.split('.')[-1] for x in ENTRYPOINT_DECORATORS}
                   for d in fi.decorators if d)
    name_hit = fi.node.name in ENTRYPOINT_FUNC_NAMES
    # request-like params
    req_params = {p for p in fi.params if p in SOURCE_CONTAINERS}
    reads_src = _reads_request_source(fi.node)
    if deco_hit or name_hit or req_params or reads_src:
        seeded = set(req_params)
        # For handlers, also seed non-self params (query/body come through them).
        if deco_hit or name_hit:
            seeded |= set(fi.params)
        # A function that reads request sources directly is analyzed even with an
        # empty seed — the source read inside the body introduces the taint.
        if reads_src:
            return seeded  # may be empty; body-level source read still fires
        return seeded or set(fi.params)
    return None


def _compute_return_summaries(index: ProjectIndex) -> dict[str, set[int]]:
    """Project-wide fixpoint: for each function gid, which param indices' taint
    reaches its return value. Enables cross-file return-value propagation."""
    summ: dict[str, set[int]] = {gid: set() for gid in index.funcs}
    for _ in range(len(index.funcs) + 2):
        changed = False
        for gid, fi in index.funcs.items():
            mi = index.modules[fi.module]
            for idx in range(len(fi.params)):
                if idx in summ[gid]:
                    continue
                seeded = _seed_for_params(fi, {idx})
                v = _FuncTaint(fi, index, mi, seeded, summ)
                for stmt in fi.node.body:
                    v.visit(stmt)
                if v.return_tainted:
                    summ[gid].add(idx)
                    changed = True
        if not changed:
            break
    return summ


def analyze_project(files: dict[str, str]) -> list[Flow]:
    """
    Repo-wide cross-file taint analysis.

    files: {relative_path: file_content} for all .py files in the project.
    Returns proven source→sink Flows (deduped), each with a hop path that may
    span multiple files.
    """
    index = ProjectIndex()
    for rel, content in files.items():
        if rel.endswith(".py"):
            index.add_file(rel, content)

    if not index.funcs:
        return []

    return_summaries = _compute_return_summaries(index)

    flows: list[Flow] = []
    seen: set[tuple] = set()

    def record(fl: Flow) -> None:
        key = (fl.sink_file, fl.sink_line, fl.sink_name, fl.source_file, fl.source_line)
        if key not in seen:
            seen.add(key)
            flows.append(fl)

    # Worklist item: (gid, seeded_places, path_prefix, depth, origin_file, origin_line, origin_desc)
    worklist: list[tuple] = []
    for gid, fi in index.funcs.items():
        seed = _entry_seed(fi)
        if seed is not None:
            src_desc = f"entry point {fi.gid}() parameter"
            worklist.append((gid, seed, [f"source: {fi.gid}() [{fi.file_rel}:{fi.node.lineno}]"],
                             0, fi.file_rel, fi.node.lineno, src_desc))

    # (gid, frozenset(seed)) guard against re-analysis loops.
    visited: set[tuple[str, frozenset]] = set()

    while worklist:
        gid, seeded, prefix, depth, src_file, src_line, src_desc = worklist.pop()
        state = (gid, frozenset(seeded))
        if state in visited:
            continue
        visited.add(state)

        fi = index.funcs.get(gid)
        if fi is None:
            continue
        mi = index.modules[fi.module]
        v = _FuncTaint(fi, index, mi, set(seeded), return_summaries)
        for stmt in fi.node.body:
            v.visit(stmt)

        # sinks in this function
        for spec, line, sanitized, _ in v.flows:
            cross = fi.file_rel != src_file
            record(Flow(
                sink_name=spec.name, cwe=spec.cwe, label=spec.label,
                source_desc=src_desc, source_file=src_file, source_line=src_line,
                sink_file=fi.file_rel, sink_line=line, function=fi.gid,
                path=prefix + [f"sink: {spec.name} [{fi.file_rel}:{line}]"],
                sanitized=sanitized, interprocedural=depth > 0, cross_file=cross,
                confidence=0.6 if sanitized else (0.9 if not cross else 0.85),
            ))

        # cross-file / inter-procedural propagation
        if depth >= MAX_DEPTH:
            continue
        for hop in v.call_hops:
            callee = index.funcs.get(hop.callee_gid)
            if callee is None or hop.callee_gid == gid:
                continue
            callee_seed = _seed_for_params(callee, set(hop.tainted_arg_positions))
            if not callee_seed:
                continue
            hop_desc = (f"call: {fi.gid} -> {callee.gid}(...) "
                        f"[{fi.file_rel}:{hop.line}]")
            worklist.append((
                hop.callee_gid, callee_seed, prefix + [hop_desc],
                depth + 1, src_file, src_line, src_desc,
            ))

    return flows
