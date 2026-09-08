"""
Recon tool wrappers.

Importing this package registers every BaseTool subclass into the registry
(via the @register_tool decorator) so the pipeline and AI agent can discover
tools by their canonical key (see recon/constants.py).
"""
from recon.tools.base import (  # noqa: F401
    BaseTool,
    ToolResult,
    ToolStatus,
    register_tool,
    get_tool,
    all_tools,
    availability_report,
)

# Import wrapper modules for their registration side effects.
from recon.tools import projectdiscovery  # noqa: F401
from recon.tools import scanners          # noqa: F401
from recon.tools import scanners_extra    # noqa: F401
from recon.tools import custom            # noqa: F401
from recon.tools import ondemand          # noqa: F401
from recon.tools import api_scanner       # noqa: F401
