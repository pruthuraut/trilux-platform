'use client';
import React, { useState, useEffect, useCallback } from 'react';
import withAuth from '@/utils/withAuth';
import { getAccessTokenForAPI } from '@/utils/authUtils';
import {
  AlertCircle,
  Search,
  RefreshCcw,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  Boxes,
  ShieldAlert,
  Layers,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import NewSCAScanDialog from '@/components/NewSCAScanDialog';

const API = process.env.NEXT_PUBLIC_API_BASE_URL;

interface SCARun {
  id: number;
  scan_uuid: string;
  source_type?: string;
  source_url: string | null;
  source_file?: string | null;
  sca_analysis_status: string;
  total_dependencies: number;
  total_vulnerabilities: number;
  code_vulnerabilities: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  analysis_result?: any;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

const statusColor = (status: string) => {
  const map: Record<string, string> = {
    completed: 'bg-green-500/10 text-green-500 dark:bg-green-500/20',
    inprogress: 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/20',
    cloning: 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/20',
    waiting: 'bg-yellow-500/10 text-yellow-500 dark:bg-yellow-500/20',
    failed: 'bg-red-500/10 text-red-500 dark:bg-red-500/20',
  };
  return map[status?.toLowerCase()] || 'bg-gray-500/10 text-gray-500';
};

const statusIcon = (status: string) => {
  const map: Record<string, JSX.Element> = {
    completed: <CheckCircle2 className="h-4 w-4" />,
    inprogress: <Play className="h-4 w-4" />,
    cloning: <RefreshCcw className="h-4 w-4" />,
    waiting: <Clock className="h-4 w-4" />,
    failed: <XCircle className="h-4 w-4" />,
  };
  return map[status?.toLowerCase()] || <AlertCircle className="h-4 w-4" />;
};

const sevColor = (sev: string) => {
  const map: Record<string, string> = {
    critical: 'bg-red-500/10 text-red-500',
    high: 'bg-orange-500/10 text-orange-500',
    medium: 'bg-yellow-500/10 text-yellow-600',
    low: 'bg-blue-500/10 text-blue-500',
  };
  return map[sev?.toLowerCase()] || 'bg-gray-500/10 text-gray-500';
};

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

// Display label for a run's source (GitHub URL, or the uploaded archive name).
const sourceLabel = (r: { source_url?: string | null; source_file?: string | null; source_type?: string }) => {
  if (r.source_url) return r.source_url;
  if (r.source_file) return `Uploaded: ${r.source_file.split('/').pop()}`;
  return r.source_type === 'upload' ? 'Uploaded archive' : '—';
};

const SCADashboard = () => {
  const [runs, setRuns] = useState<SCARun[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDialog, setShowDialog] = useState(false);
  const [selected, setSelected] = useState<SCARun | null>(null);

  const fetchRuns = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/sca-analysis/`, {
        headers: {
          Authorization: `Bearer ${getAccessTokenForAPI()}`,
          'ngrok-skip-browser-warning': 'true',
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRuns(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to fetch SCA scans. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openDetail = async (run: SCARun) => {
    // Detail endpoint returns the full analysis_result JSON inline.
    try {
      const res = await fetch(`${API}/api/sca-analysis/${run.scan_uuid}/`, {
        headers: {
          Authorization: `Bearer ${getAccessTokenForAPI()}`,
          'ngrok-skip-browser-warning': 'true',
        },
      });
      const data = await res.json();
      setSelected(Array.isArray(data) ? data[0] : data);
    } catch (err) {
      console.error(err);
      setSelected(run);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  // Auto-refresh while any run is still processing.
  useEffect(() => {
    const active = runs.some((r) =>
      ['waiting', 'cloning', 'inprogress'].includes(r.sca_analysis_status?.toLowerCase())
    );
    if (!active) return;
    const t = setInterval(fetchRuns, 5000);
    return () => clearInterval(t);
  }, [runs, fetchRuns]);

  const filtered = runs.filter((r) => {
    const matchesSearch = !searchQuery || sourceLabel(r).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.sca_analysis_status?.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statuses = Array.from(new Set(runs.map((r) => r.sca_analysis_status?.toLowerCase()).filter(Boolean)));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Boxes className="h-8 w-8 text-primary" />
            Software Composition Analysis
          </h1>
          <p className="text-muted-foreground mt-1">
            Scan a repo&apos;s dependencies for known CVEs (OSV/NVD) plus a light static code pass.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" onClick={fetchRuns} disabled={isLoading}>
            <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="bg-primary hover:bg-primary/90 gap-2" onClick={() => setShowDialog(true)}>
            <Play className="h-4 w-4" />
            New Scan
          </Button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid gap-6 md:grid-cols-4">
        {[
          { title: 'Total Scans', icon: Layers, value: runs.length, desc: 'SCA executions' },
          { title: 'Completed', icon: CheckCircle2, value: runs.filter((r) => r.sca_analysis_status === 'Completed').length, desc: 'Finished scans', color: 'text-green-500' },
          { title: 'Dependencies', icon: Package, value: runs.reduce((a, r) => a + (r.total_dependencies || 0), 0), desc: 'Analyzed across scans', color: 'text-indigo-500' },
          { title: 'Vulnerabilities', icon: ShieldAlert, value: runs.reduce((a, r) => a + (r.total_vulnerabilities || 0) + (r.code_vulnerabilities || 0), 0), desc: 'CVEs + code issues', color: 'text-orange-500' },
        ].map((s) => (
          <Card key={s.title} className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{s.title}</CardTitle>
              <s.icon className={`h-4 w-4 ${s.color || 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-grow w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by repository URL..."
            className="pl-10 w-full"
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter} disabled={isLoading}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="bg-red-500/10 p-4 rounded-md flex items-center gap-2 text-red-500">
          <AlertCircle className="h-5 w-5" />
          {error}
          <Button variant="ghost" className="ml-auto" onClick={fetchRuns}>
            Retry
          </Button>
        </div>
      )}

      {isLoading && !error && (
        <div className="flex items-center justify-center h-64">
          <RefreshCcw className="h-12 w-12 text-primary animate-spin" />
          <span className="ml-4 text-lg">Loading scans...</span>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Boxes className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No SCA scans yet</h3>
              <p className="text-muted-foreground mt-1 max-w-md">
                Start a scan to check a repository&apos;s dependencies for known vulnerabilities.
              </p>
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Repository</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Deps</TableHead>
                      <TableHead>CVEs / Code</TableHead>
                      <TableHead>Critical / High</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((run) => (
                      <TableRow key={run.id} className="cursor-pointer" onClick={() => openDetail(run)}>
                        <TableCell className="font-medium max-w-[260px] truncate">{sourceLabel(run)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={statusColor(run.sca_analysis_status)}>
                            <span className="flex items-center gap-1">
                              {statusIcon(run.sca_analysis_status)}
                              {run.sca_analysis_status}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>{run.total_dependencies ?? 0}</TableCell>
                        <TableCell>
                          {run.total_vulnerabilities ?? 0} / {run.code_vulnerabilities ?? 0}
                        </TableCell>
                        <TableCell>
                          <span className="text-red-500 font-medium">{run.critical_count ?? 0}</span>
                          {' / '}
                          <span className="text-orange-500 font-medium">{run.high_count ?? 0}</span>
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{fmt(run.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <NewSCAScanDialog open={showDialog} onOpenChange={setShowDialog} onScanCreated={fetchRuns} />

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <Card className="w-full max-w-4xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Boxes className="h-5 w-5 text-primary" />
                    SCA Report
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1 break-all">{sourceLabel(selected)}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelected(null)}>
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {selected.error_message ? (
                <div className="bg-red-500/10 p-3 rounded-md text-red-500 text-sm">
                  {selected.error_message}
                </div>
              ) : null}

              {/* Dependencies */}
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Package className="h-4 w-4" /> Vulnerable Dependencies
                </h3>
                {(selected.analysis_result?.dependencies || []).filter((d: any) => (d.vulnerabilities || []).length).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No dependency CVEs found.</p>
                ) : (
                  <div className="space-y-3">
                    {(selected.analysis_result?.dependencies || [])
                      .filter((d: any) => (d.vulnerabilities || []).length)
                      .map((d: any, i: number) => (
                        <div key={i} className="border rounded-md p-3">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {d.name}@{d.version}{' '}
                              <Badge variant="secondary" className="ml-1">{d.package_manager}</Badge>
                            </span>
                            <span className="text-xs text-muted-foreground">risk {d.risk_score}</span>
                          </div>
                          <div className="mt-2 space-y-1">
                            {(d.vulnerabilities || []).map((v: any, j: number) => (
                              <div key={j} className="text-xs flex items-start gap-2">
                                <Badge variant="secondary" className={sevColor(v.severity)}>{v.severity}</Badge>
                                <span className="font-mono">{v.cve_id}</span>
                                <span className="text-muted-foreground">{v.description}</span>
                                {v.fixed_version ? (
                                  <span className="text-green-500">→ fix {v.fixed_version}</span>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Code vulnerabilities */}
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4" /> Code Findings (SAST)
                </h3>
                {(selected.analysis_result?.code_vulnerabilities || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No code findings.</p>
                ) : (
                  <div className="space-y-2">
                    {(selected.analysis_result?.code_vulnerabilities || []).map((c: any, i: number) => (
                      <div key={i} className="border rounded-md p-2 text-xs">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={sevColor(c.severity)}>{c.severity}</Badge>
                          <span className="font-medium">{c.rule_id}</span>
                          <span className="text-muted-foreground">
                            {c.file}:{c.line}
                          </span>
                        </div>
                        <p className="mt-1 text-muted-foreground">{c.description}</p>
                        {c.code_snippet ? (
                          <pre className="mt-1 bg-muted p-2 rounded overflow-x-auto">{c.code_snippet}</pre>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default withAuth(SCADashboard);
