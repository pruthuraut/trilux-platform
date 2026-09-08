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
  MoreHorizontal,
  Play,
  Network,
  ArrowUpRight,
  ShieldAlert,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useRouter } from 'next/navigation';
import NewReconScanDialog from '@/components/NewReconScanDialog';
import NewApiScanDialog from '@/components/NewApiScanDialog';

const API = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface ScanRun {
  id: number;
  run_uuid: string;
  scan_type: string;
  target: string;
  status: string;
  total_findings: number;
  critical_count: number;
  high_count: number;
  medium_count?: number;
  low_count?: number;
  created_at: string;
  finished_at: string | null;
}

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

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const ReconDashboard = () => {
  const router = useRouter();
  const [runs, setRuns] = useState<ScanRun[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDialog, setShowDialog] = useState(false);
  const [showApiDialog, setShowApiDialog] = useState(false);

  const fetchRuns = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/recon/scan/`, {
        headers: {
          Authorization: `Bearer ${getAccessTokenForAPI()}`,
          'ngrok-skip-browser-warning': 'true',
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRuns(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to fetch dynamic testing runs. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  // Auto-refresh while any run is in progress.
  useEffect(() => {
    const active = runs.some((r) => ['queued', 'running'].includes(r.status?.toLowerCase()));
    if (!active) return;
    const t = setInterval(fetchRuns, 5000);
    return () => clearInterval(t);
  }, [runs, fetchRuns]);

  const filtered = runs.filter((r) => {
    const matchesSearch = !searchQuery || r.target.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status?.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statuses = Array.from(new Set(runs.map((r) => r.status?.toLowerCase()).filter(Boolean)));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Network className="h-8 w-8 text-primary" />
            Dynamic Testing
          </h1>
          <p className="text-muted-foreground mt-1">
            Run the 12-step dynamic testing pipeline (subdomains → live hosts → ports → nuclei → more)
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" onClick={fetchRuns} disabled={isLoading}>
            <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setShowApiDialog(true)}>
            <ShieldAlert className="h-4 w-4" />
            API Scan
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
          { title: 'Total Runs', icon: Layers, value: runs.length, desc: 'Recon pipeline executions' },
          { title: 'Completed', icon: CheckCircle2, value: runs.filter((r) => r.status === 'completed').length, desc: 'Finished runs', color: 'text-green-500' },
          { title: 'Running', icon: Play, value: runs.filter((r) => ['running', 'queued'].includes(r.status)).length, desc: 'In progress', color: 'text-blue-500' },
          { title: 'Total Findings', icon: ShieldAlert, value: runs.reduce((a, r) => a + (r.total_findings || 0), 0), desc: 'Across all runs', color: 'text-orange-500' },
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
            placeholder="Search by target domain..."
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
          <span className="ml-4 text-lg">Loading runs...</span>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Network className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No dynamic testing runs yet</h3>
              <p className="text-muted-foreground mt-1 max-w-md">
                Start a dynamic test to enumerate the attack surface and find vulnerabilities.
              </p>
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Target</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Findings</TableHead>
                      <TableHead>Critical / High</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((run) => (
                      <TableRow
                        key={run.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/recon/${run.run_uuid}`)}
                      >
                        <TableCell className="font-medium max-w-[220px] truncate">{run.target}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-500">
                            {run.scan_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={statusColor(run.status)}>
                            <span className="flex items-center gap-1">
                              {statusIcon(run.status)}
                              {run.status}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>{run.total_findings ?? 0}</TableCell>
                        <TableCell>
                          <span className="text-red-500 font-medium">{run.critical_count ?? 0}</span>
                          {' / '}
                          <span className="text-orange-500 font-medium">{run.high_count ?? 0}</span>
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{fmt(run.created_at)}</TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="flex items-center gap-2"
                                onClick={() => router.push(`/recon/${run.run_uuid}`)}
                              >
                                <ArrowUpRight className="h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <NewReconScanDialog open={showDialog} onOpenChange={setShowDialog} onScanCreated={fetchRuns} />
      <NewApiScanDialog open={showApiDialog} onOpenChange={setShowApiDialog} onScanCreated={fetchRuns} />
    </div>
  );
};

export default withAuth(ReconDashboard);
