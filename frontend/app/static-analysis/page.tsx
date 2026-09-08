'use client';
import React, { useState, useEffect } from 'react';
import withAuth from '@/utils/withAuth';
import { getAccessTokenForAPI } from '@/utils/authUtils';
import {
  AlertCircle,
  Search,
  RefreshCcw,
  Code,
  Clock,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  FileCode,
  Play,
  Pause,
  Link,
  ArrowUpRight,
  RotateCcw,
  Shield,
  GitBranch,
  Brain,
  Folder,
  AlarmClock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from "next/navigation"
import NewStaticAnalysisDialog from "@/components/NewStaticAnalysisDialog";

interface Project {
  id: number;
  project_name: string;
}

interface Analysis {
  id: number;
  scan_uuid: string;
  static_analysis_type: string;
  source_url: string;
  LLM_analysis_result: string | null;
  CVEscan_analysis_result: string | null;
  GitLeaks_analysis_result: string | null;
  repo_folder_name: string;
  static_analysis_status: string;
  analysis_count: number;
  error_message: string;
  created_at: string;
  updated_at: string;
  user_id: number;
  project: Project;
}

const StaticAnalysisDashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table'); // Default to table
  const [showNewAnalysisDialog, setShowNewAnalysisDialog] = useState(false);

  // Load saved view mode preference on component mount
  useEffect(() => {
    const savedViewMode = localStorage.getItem('static-analysis-view-mode') as 'grid' | 'table' | null;
    if (savedViewMode) {
      setViewMode(savedViewMode);
    }
    fetchAnalyses();
  }, []);

  // Save view mode preference when it changes
  const handleViewModeChange = (mode: 'grid' | 'table') => {
    setViewMode(mode);
    localStorage.setItem('static-analysis-view-mode', mode);
  };

  useEffect(() => {
    // In a real app, this would be an actual API call
    fetchAnalyses();
  }, []);

  const router = useRouter();

  const fetchAnalyses = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/static-analysis/`, {
        headers: {
          'Authorization': `Bearer ${getAccessTokenForAPI()}`,
          'ngrok-skip-browser-warning': 'true',
        }
      });
      const data = await response.json();

      // Check if data is an array, otherwise look for results property or use empty array
      if (Array.isArray(data)) {
        setAnalyses(data);
      } else if (data && data.results && Array.isArray(data.results)) {
        setAnalyses(data.results);
      } else {
        console.error("API did not return an array of analyses:", data);
        setAnalyses([]);
      }
    } catch (error) {
      console.error("Error fetching analyses:", error);
      setAnalyses([]);
    } finally {
      setIsLoading(false);
    }
  };

  type StatusColorKey = 'Completed' | 'In Progress' | 'Waiting' | 'Failed';

  const getStatusColor = (status: string) => {
    const colors: Record<StatusColorKey, string> = {
      'Completed': 'bg-green-500/10 text-green-500 dark:bg-green-500/20',
      'In Progress': 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/20',
      'Waiting': 'bg-yellow-500/10 text-yellow-500 dark:bg-yellow-500/20',
      'Failed': 'bg-red-500/10 text-red-500 dark:bg-red-500/20'
    };
    return (status in colors ? colors[status as StatusColorKey] : 'bg-gray-500/10 text-gray-500');
  };

  type StatusIconKey = 'Completed' | 'In Progress' | 'Waiting' | 'Failed';

  const getStatusIcon = (status: string) => {
    const icons: Record<StatusIconKey, JSX.Element> = {
      'Completed': <CheckCircle2 className="h-4 w-4" />,
      'In Progress': <Play className="h-4 w-4" />,
      'Waiting': <Clock className="h-4 w-4" />,
      'Failed': <XCircle className="h-4 w-4" />
    };
    return (status in icons ? icons[status as StatusIconKey] : <AlertCircle className="h-4 w-4" />);
  };

  type AnalysisTypeKey = 'LLM' | 'CVEscan' | 'GitLeaks' | 'Combined';

  const getTypeColor = (type: string) => {
    const colors: Record<AnalysisTypeKey, string> = {
      'LLM': 'bg-purple-500/10 text-purple-500 dark:bg-purple-500/20',
      'CVEscan': 'bg-red-500/10 text-red-500 dark:bg-red-500/20',
      'GitLeaks': 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/20',
      'Combined': 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20'
    };
    return (type in colors ? colors[type as AnalysisTypeKey] : 'bg-gray-500/10 text-gray-500');
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<AnalysisTypeKey, JSX.Element> = {
      'LLM': <Brain className="h-4 w-4" />,
      'CVEscan': <Shield className="h-4 w-4" />,
      'GitLeaks': <GitBranch className="h-4 w-4" />,
      'Combined': <Code className="h-4 w-4" />
    };
    return (type in icons ? icons[type as AnalysisTypeKey] : <Code className="h-4 w-4" />);
  };

  const formatDateTime = (dateString: string | number | Date) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getResultSummary = (analysis: Analysis) => {
    const results = [];

    if (analysis.LLM_analysis_result) {
      results.push({
        type: 'LLM',
        icon: <Brain className="h-4 w-4" />,
        result: analysis.LLM_analysis_result,
        color: 'bg-purple-500/10 text-purple-500'
      });
    }

    if (analysis.CVEscan_analysis_result) {
      results.push({
        type: 'CVE Scan',
        icon: <Shield className="h-4 w-4" />,
        result: analysis.CVEscan_analysis_result,
        color: 'bg-red-500/10 text-red-500'
      });
    }

    if (analysis.GitLeaks_analysis_result) {
      results.push({
        type: 'GitLeaks',
        icon: <GitBranch className="h-4 w-4" />,
        result: analysis.GitLeaks_analysis_result,
        color: 'bg-blue-500/10 text-blue-500'
      });
    }

    return results;
  };

  const filteredAnalyses = analyses.filter(analysis => {
    const matchesSearch = searchQuery === '' ||
      analysis.source_url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      analysis.project.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (analysis.repo_folder_name && analysis.repo_folder_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = typeFilter === 'all' ||
      analysis.static_analysis_type.toLowerCase() === typeFilter.toLowerCase();

    const matchesStatus = statusFilter === 'all' ||
      analysis.static_analysis_status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesType && matchesStatus;
  });

  const analysisTypeOptions = Array.from(new Set(analyses.map(a => a.static_analysis_type)));
  const statusOptions = Array.from(new Set(analyses.map(a => a.static_analysis_status)));

  const getTotalAnalysisCount = () => {
    return analyses.reduce((total, analysis) => total + analysis.analysis_count, 0);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <FileCode className="h-8 w-8 text-primary" />
            Static Analysis Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor code quality, vulnerabilities, and secrets in your repositories
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" onClick={fetchAnalyses}>
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
          <Button className="bg-primary hover:bg-primary/90 gap-2" onClick={() => setShowNewAnalysisDialog(true)}>
            <Code className="h-4 w-4" />
            New Analysis
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
            <FileCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyses.length}</div>
            <p className="text-xs text-muted-foreground">
              Across {new Set(analyses.map(a => a.project.id)).size} projects
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Findings</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getTotalAnalysisCount()}
            </div>
            <p className="text-xs text-muted-foreground">
              Issues detected across all scans
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Play className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyses.filter(a => ['In Progress', 'Waiting'].includes(a.static_analysis_status)).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Analyses in progress or waiting
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyses.filter(a => a.static_analysis_status === 'Completed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully finished analyses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by repository URL, name, or project..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {analysisTypeOptions.map(type => (
              <SelectItem key={type} value={type.toLowerCase()}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statusOptions.map(status => (
              <SelectItem key={status} value={status.toLowerCase()}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center border rounded-md overflow-hidden">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            className="rounded-none px-3 h-10"
            onClick={() => handleViewModeChange('grid')}
          >
            Grid
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            className="rounded-none px-3 h-10"
            onClick={() => handleViewModeChange('table')}
          >
            Table
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCcw className="h-12 w-12 text-primary animate-spin" />
          <span className="ml-4 text-lg">Loading analyses...</span>
        </div>
      ) : (
        <>
          {/* Empty State */}
          {filteredAnalyses.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No analyses found</h3>
              <p className="text-muted-foreground mt-1 max-w-md">
                {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                  ? "Try adjusting your filters to see more results."
                  : "Start by creating a new static code analysis."}
              </p>
              {(searchQuery || typeFilter !== 'all' || statusFilter !== 'all') && (
                <Button variant="outline" className="mt-4" onClick={() => {
                  setSearchQuery('');
                  setTypeFilter('all');
                  setStatusFilter('all');
                }}>
                  Clear Filters
                </Button>
              )}
            </div>
          )}

          {/* Grid View */}
          {viewMode === 'grid' && filteredAnalyses.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredAnalyses.map((analysis) => (
                <Card key={analysis.id} className="bg-card hover:bg-accent/5 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                          <Badge variant="secondary" className={getTypeColor(analysis.static_analysis_type)}>
                            <span className="flex items-center gap-1">
                              {getTypeIcon(analysis.static_analysis_type)}
                              {analysis.static_analysis_type}
                            </span>
                          </Badge>
                          <Badge variant="secondary" className={getStatusColor(analysis.static_analysis_status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(analysis.static_analysis_status)}
                              {analysis.static_analysis_status}
                            </span>
                          </Badge>
                        </CardTitle>
                        <CardDescription className="mt-2">
                          <div className="flex items-center gap-1 text-sm">
                            <Link className="h-4 w-4" />
                            <a href={analysis.source_url} target="_blank" rel="noopener noreferrer"
                              className="text-primary hover:underline truncate max-w-xs flex items-center gap-1">
                              {analysis.source_url}
                              <ArrowUpRight className="h-3 w-3" />
                            </a>
                          </div>
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="flex items-center gap-2" onClick={() => router.push(`static-analysis/${analysis.scan_uuid}`)}>
                            <FileCode className="h-4 w-4" />View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center gap-2">
                            <RefreshCcw className="h-4 w-4" />Rerun Analysis
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="flex items-center gap-2 text-red-500">
                            <Pause className="h-4 w-4" />Stop Analysis
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">Project:</span> {analysis.project.project_name}
                        </div>
                        {analysis.repo_folder_name && (
                          <div className="flex items-center gap-1 text-sm">
                            <Folder className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{analysis.repo_folder_name}</span>
                          </div>
                        )}
                      </div>

                      {/* Analysis Results */}
                      {getResultSummary(analysis).length > 0 ? (
                        <div className="flex flex-col gap-2 mt-2">
                          {getResultSummary(analysis).map((result, idx) => (
                            <div key={idx} className={`${result.color} p-3 rounded-md text-sm`}>
                              <div className="flex items-center gap-1 font-medium mb-1">
                                {result.icon} {result.type} Results:
                              </div>
                              <div>{result.result}</div>
                            </div>
                          ))}
                        </div>
                      ) : analysis.static_analysis_status === 'Completed' ? (
                        <div className="bg-green-500/10 p-3 rounded-md text-sm text-green-500 mt-1">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" /> No issues detected
                          </span>
                        </div>
                      ) : null}

                      {analysis.error_message && (
                        <div className="bg-red-500/10 p-3 rounded-md text-sm text-red-500 mt-1">
                          <span className="font-medium">Error:</span> {analysis.error_message}
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <AlarmClock className="h-3 w-3" />
                          <span>Created: {formatDateTime(analysis.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>
                            {analysis.analysis_count > 0
                              ? `${analysis.analysis_count} ${analysis.analysis_count === 1 ? 'finding' : 'findings'}`
                              : 'No findings'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && filteredAnalyses.length > 0 && (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Repository</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Findings</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAnalyses.map((analysis) => (
                      <TableRow key={analysis.id}>
                        <TableCell>
                          <Badge variant="secondary" className={getTypeColor(analysis.static_analysis_type)}>
                            <span className="flex items-center gap-1">
                              {getTypeIcon(analysis.static_analysis_type)}
                              {analysis.static_analysis_type}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <a href={analysis.source_url} target="_blank" rel="noopener noreferrer"
                                  className="text-primary hover:underline flex items-center gap-1">
                                  {analysis.repo_folder_name || analysis.source_url}
                                  <ArrowUpRight className="h-3 w-3" />
                                </a>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{analysis.source_url}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>{analysis.project.project_name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getStatusColor(analysis.static_analysis_status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(analysis.static_analysis_status)}
                              {analysis.static_analysis_status}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {analysis.analysis_count > 0 ? (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-500">
                              {analysis.analysis_count}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">None</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">{formatDateTime(analysis.created_at)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="flex items-center gap-2" onClick={() => router.push(`static-analysis/${analysis.scan_uuid}`)}>
                                <FileCode className="h-4 w-4" />View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem className="flex items-center gap-2">
                                <RefreshCcw className="h-4 w-4" />Rerun Analysis
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="flex items-center gap-2 text-red-500">
                                <Pause className="h-4 w-4" />Stop Analysis
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

      {/* New Static Analysis Dialog */}
      <NewStaticAnalysisDialog 
        open={showNewAnalysisDialog}
        onOpenChange={setShowNewAnalysisDialog}
        onAnalysisCreated={fetchAnalyses}
      />
    </div>
  );
};

export default withAuth(StaticAnalysisDashboard);