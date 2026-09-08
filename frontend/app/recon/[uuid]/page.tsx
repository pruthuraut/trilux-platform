'use client';

import React, { useState, useEffect, useCallback } from 'react';
import withAuth from '@/utils/withAuth';
import { getAccessTokenForAPI } from '@/utils/authUtils';
import { useParams } from 'next/navigation';
import {
  AlertCircle,
  RefreshCcw,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  Network,
  Sparkles,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import type { ScanRun as BaseScanRun } from '@/app/recon/page';

const API = process.env.NEXT_PUBLIC_API_BASE_URL;

interface StepResult {
  step_number: number;
  step_key: string;
  tool: string;
  status: string;
  record_count: number;
  output_url: string | null;
  duration_s: number | null;
  error_message: string | null;
  created_at: string;
}

interface Finding {
  id: number;
  kind: string;
  severity: string;
  title: string;
  host: string | null;
  url: string | null;
  tool: string | null;
  data: Record<string, unknown> | null;
  created_at: string;
}

interface ScanRun extends BaseScanRun {
  options?: Record<string, unknown> | null;
  info_count?: number;
  summary?: string | null;
  summary_url?: string | null;
  error_message?: string | null;
  started_at?: string | null;
  updated_at?: string;
  steps?: StepResult[];
}

const KIND_OPTIONS = [
  'subdomain',
  'live_host',
  'port',
  'tech',
  'takeover',
  's3_bucket',
  'vulnerability',
  'secret',
  'url',
  'gf_match',
  'backup_file',
  'misconfig',
  'other',
];

const SEVERITY_OPTIONS = ['critical', 'high', 'medium', 'low', 'info'];

const statusColor = (status: string) => {
  const map: Record<string, string> = {
    completed: 'bg-green-500/10 text-green-500 dark:bg-green-500/20',
    running: 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/20',
    queued: 'bg-yellow-500/10 text-yellow-500 dark:bg-yellow-500/20',
    partial: 'bg-orange-500/10 text-orange-500 dark:bg-orange-500/20',
    failed: 'bg-red-500/10 text-red-500 dark:bg-red-500/20',
  };
  return map[status?.toLowerCase()] || 'bg-gray-500/10 text-gray-500';
};

const statusIcon = (status: string) => {
  const map: Record<string, JSX.Element> = {
    completed: <CheckCircle2 className="h-4 w-4" />,
    running: <Play className="h-4 w-4" />,
    queued: <Clock className="h-4 w-4" />,
    partial: <AlertCircle className="h-4 w-4" />,
    failed: <XCircle className="h-4 w-4" />,
  };
  return map[status?.toLowerCase()] || <AlertCircle className="h-4 w-4" />;
};

const stepStatusColor = (status: string) => {
  const map: Record<string, string> = {
    success: 'bg-green-500/10 text-green-500 dark:bg-green-500/20',
    running: 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/20',
    empty: 'bg-yellow-500/10 text-yellow-500 dark:bg-yellow-500/20',
    skipped: 'bg-gray-500/10 text-gray-500 dark:bg-gray-500/20',
    pending: 'bg-gray-500/10 text-gray-500 dark:bg-gray-500/20',
    failed: 'bg-red-500/10 text-red-500 dark:bg-red-500/20',
  };
  return map[status?.toLowerCase()] || 'bg-gray-500/10 text-gray-500';
};

const severityColor = (severity: string) => {
  const map: Record<string, string> = {
    critical: 'bg-red-500/10 text-red-500 dark:bg-red-500/20',
    high: 'bg-orange-500/10 text-orange-500 dark:bg-orange-500/20',
    medium: 'bg-yellow-500/10 text-yellow-500 dark:bg-yellow-500/20',
    low: 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/20',
    info: 'bg-gray-500/10 text-gray-500 dark:bg-gray-500/20',
  };
  return map[severity?.toLowerCase()] || 'bg-gray-500/10 text-gray-500';
};

const fmt = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const ReconRunDetail = () => {
  const params = useParams();
  const uuid = params?.uuid as string;

  const [run, setRun] = useState<ScanRun | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [kindFilter, setKindFilter] = useState('all');

  const fetchData = useCallback(async () => {
    if (!uuid) return;
    setError(null);
    try {
      const headers = {
        Authorization: `Bearer ${getAccessTokenForAPI()}`,
        'ngrok-skip-browser-warning': 'true',
      };
      const [runRes, findingsRes] = await Promise.all([
        fetch(`${API}/recon/scan/${uuid}/`, { headers }),
        fetch(`${API}/recon/scan/${uuid}/findings/`, { headers }),
      ]);

      if (runRes.status === 404) {
        setNotFound(true);
        return;
      }
      if (!runRes.ok) throw new Error(`HTTP ${runRes.status}`);

      const runData = await runRes.json();
      setRun(runData);

      if (findingsRes.ok) {
        const findingsData = await findingsRes.json();
        setFindings(Array.isArray(findingsData) ? findingsData : []);
      }
    } catch (err) {
      setError('Failed to fetch dynamic testing run. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [uuid]);

  useEffect(() => {
    setIsLoading(true);
    fetchData();
  }, [fetchData]);

  // Auto-refresh while the run is in progress.
  useEffect(() => {
    if (!run) return;
    const active = ['queued', 'running'].includes(run.status?.toLowerCase());
    if (!active) return;
    const t = setInterval(fetchData, 5000);
    return () => clearInterval(t);
  }, [run, fetchData]);

  const handleRunAiSummary = async () => {
    if (!uuid) return;
    setIsSummarizing(true);
    try {
      const res = await fetch(`${API}/recon/brain/${uuid}/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getAccessTokenForAPI()}`,
          'ngrok-skip-browser-warning': 'true',
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast({
        title: 'AI summary queued',
        description: 'The summary is being regenerated. It will appear shortly.',
      });
      fetchData();
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to queue AI summary.',
        variant: 'destructive',
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  const filteredFindings = findings.filter((f) => {
    const matchesSeverity = severityFilter === 'all' || f.severity?.toLowerCase() === severityFilter;
    const matchesKind = kindFilter === 'all' || f.kind?.toLowerCase() === kindFilter;
    return matchesSeverity && matchesKind;
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <RefreshCcw className="h-12 w-12 text-primary animate-spin" />
        <span className="ml-4 text-lg">Loading run...</span>
      </div>
    );
  }

  // Not-found state
  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center max-w-md mx-auto">
        <Network className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Run not found</h3>
        <p className="text-muted-foreground mt-1">
          We couldn&apos;t find a dynamic testing run for this identifier.
        </p>
      </div>
    );
  }

  // Error state
  if (error || !run) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center max-w-md mx-auto">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium">Error Loading Run</h3>
        <p className="text-muted-foreground mt-1 mb-4">{error || 'No data available.'}</p>
        <Button onClick={fetchData} className="gap-2">
          <RefreshCcw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  const steps = run.steps || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Network className="h-8 w-8 text-primary" />
            {run.target}
          </h1>
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <Badge variant="secondary" className={statusColor(run.status)}>
              <span className="flex items-center gap-1">
                {statusIcon(run.status)}
                {run.status}
              </span>
            </Badge>
            <span>•</span>
            <span>{run.scan_type}</span>
            <span>•</span>
            <Clock className="h-4 w-4" />
            <span>Created {fmt(run.created_at)}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" onClick={fetchData}>
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
          <Button className="gap-2" onClick={handleRunAiSummary} disabled={isSummarizing}>
            <Sparkles className={`h-4 w-4 ${isSummarizing ? 'animate-pulse' : ''}`} />
            {isSummarizing ? 'Queuing...' : 'Run AI Summary'}
          </Button>
        </div>
      </div>

      {run.error_message && (
        <div className="bg-red-500/10 p-4 rounded-md flex items-center gap-2 text-red-500">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {run.error_message}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid gap-6 md:grid-cols-5">
        {[
          { title: 'Total Findings', value: run.total_findings ?? 0, color: 'text-foreground' },
          { title: 'Critical', value: run.critical_count ?? 0, color: 'text-red-500' },
          { title: 'High', value: run.high_count ?? 0, color: 'text-orange-500' },
          { title: 'Medium', value: run.medium_count ?? 0, color: 'text-yellow-500' },
          { title: 'Low', value: run.low_count ?? 0, color: 'text-blue-500' },
        ].map((s) => (
          <Card key={s.title} className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{s.title}</CardTitle>
              <ShieldAlert className={`h-4 w-4 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI summary */}
      {run.summary && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{run.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Pipeline Steps */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Pipeline Steps</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {steps.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              No steps recorded yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">#</TableHead>
                  <TableHead>Step</TableHead>
                  <TableHead>Tool</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Output</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {steps
                  .slice()
                  .sort((a, b) => a.step_number - b.step_number)
                  .map((step) => (
                    <TableRow key={step.step_number}>
                      <TableCell className="font-medium">{step.step_number}</TableCell>
                      <TableCell className="font-medium">{step.step_key}</TableCell>
                      <TableCell>{step.tool}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={stepStatusColor(step.status)}>
                          {step.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{step.record_count ?? 0}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {step.duration_s != null ? `${step.duration_s}s` : '—'}
                      </TableCell>
                      <TableCell>
                        {step.output_url ? (
                          <a
                            href={step.output_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            View
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate text-red-500 text-xs">
                        {step.error_message || ''}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Findings */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          <CardTitle className="text-lg">Findings</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                {SEVERITY_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={kindFilter} onValueChange={setKindFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Kind" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Kinds</SelectItem>
                {KIND_OPTIONS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {k}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredFindings.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              No findings match the current filters.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kind</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead>Tool</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFindings.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>
                      <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-500">
                        {f.kind}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={severityColor(f.severity)}>
                        {f.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[320px] truncate font-medium">{f.title}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{f.host || '—'}</TableCell>
                    <TableCell>{f.tool || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default withAuth(ReconRunDetail);
