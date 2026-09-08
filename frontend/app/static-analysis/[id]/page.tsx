"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import {
  BugIcon, CodeSquare, ShieldAlert, Lightbulb, ChevronDown, ChevronUp,
  RefreshCcw, AlertCircle, Search, Filter, Copy, Check, ExternalLink, Clipboard, GitBranch
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useParams } from "next/navigation";
import withAuth from '@/utils/withAuth';
import { getAccessTokenForAPI } from '@/utils/authUtils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Interfaces for API response
interface Vulnerability {
  id: string;
  title: string;
  severity: string;
  description: string;
  location?: {
    filePath: string;
    lineNumber: number | null;
  };
  fix: string;
  tips: string | string[];
  vulnerableCode?: string;
}

interface TaintFinding {
  cwe: string;
  owasp: string;
  severity: string;
  sink: string;
  title: string;
  source_file: string;
  source_line: number;
  sink_file: string;
  sink_line: number;
  function: string;
  cross_file: boolean;
  interprocedural: boolean;
  sanitized: boolean;
  confidence: number;
  taint_path: string[];
  source_desc: string;
  fingerprint: string;
  sink_code?: string;
  occurrence_count?: number;
  occurrences?: { sink_file: string; sink_line: number }[];
  suppressed?: boolean;
  suppression_source?: string;
  triage_status?: string;
  triage_note?: string;
}

interface AnalysisResult {
  id: number;
  scan_uuid: string;
  static_analysis_type: string;
  source_url: string;
  LLM_analysis_result: Vulnerability[] | null;
  CVEscan_analysis_result: any | null;
  GitLeaks_analysis_result: any | null;
  Taint_analysis_result: {
    taint_findings?: TaintFinding[];
    summary?: Record<string, number>;
    total?: number;
    active_total?: number;
    suppressed_total?: number;
    cross_file?: number;
  } | null;
  repo_folder_name: string;
  static_analysis_status: string;
  analysis_count: number;
  error_message: string;
  created_at: string;
  updated_at: string;
  user_id: number;
  project: {
    id: number;
    project_name: string;
  };
}

interface SeverityCounts {
  all: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

function StaticAnalysisPage() {
  const params = useParams();
  const scanUuid = params.id;
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"severity" | "title">("severity");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [severityCounts, setSeverityCounts] = useState<SeverityCounts>({
    all: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalysisData();
  }, [scanUuid]);

  const fetchAnalysisData = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/static-analysis/${scanUuid}/`, {
        headers: {
          'Authorization': `Bearer ${getAccessTokenForAPI()}`,
          'ngrok-skip-browser-warning': 'true',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }

      const data = await response.json();

      // Handle API response (array with a single analysis object)
      if (Array.isArray(data) && data.length > 0) {
        setAnalysis(data[0]);

        // Extract vulnerabilities from different analysis results
        const allVulnerabilities: Vulnerability[] = [];

        if (data[0].LLM_analysis_result && Array.isArray(data[0].LLM_analysis_result)) {
          allVulnerabilities.push(...data[0].LLM_analysis_result);
        }

        if (data[0].CVEscan_analysis_result && Array.isArray(data[0].CVEscan_analysis_result)) {
          allVulnerabilities.push(...data[0].CVEscan_analysis_result);
        }

        if (data[0].GitLeaks_analysis_result && Array.isArray(data[0].GitLeaks_analysis_result)) {
          allVulnerabilities.push(...data[0].GitLeaks_analysis_result);
        }

        setVulnerabilities(allVulnerabilities);

        // Calculate severity counts
        const counts = {
          all: allVulnerabilities.length,
          critical: allVulnerabilities.filter(v => v.severity.toLowerCase() === "critical").length,
          high: allVulnerabilities.filter(v => v.severity.toLowerCase() === "high").length,
          medium: allVulnerabilities.filter(v => v.severity.toLowerCase() === "medium").length,
          low: allVulnerabilities.filter(v => v.severity.toLowerCase() === "low").length,
        };
        setSeverityCounts(counts);
      } else {
        setError("Invalid data format received from API");
      }
    } catch (err) {
      console.error("Error fetching analysis:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch analysis data");
    } finally {
      setIsLoading(false);
    }
  };

  // Persist a triage decision for a taint finding (survives future scans), then refetch.
  const setTriage = async (finding: TaintFinding, newStatus: string) => {
    if (!analysis?.project?.id) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/sast-triage/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessTokenForAPI()}`,
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          project: analysis.project.id,
          fingerprint: finding.fingerprint,
          status: newStatus,
          cwe: finding.cwe,
          sink: finding.sink,
          title: finding.title,
          scan_uuid: scanUuid,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchAnalysisData();  // stored result was repatched server-side
    } catch (e) {
      console.error("Triage failed:", e);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prevIds =>
      prevIds.includes(id)
        ? prevIds.filter(prevId => prevId !== id)
        : [...prevIds, id]
    );
  };

  const toggleExpandAll = () => {
    if (expandedIds.length === filteredAndSortedVulnerabilities.length) {
      setExpandedIds([]);
    } else {
      setExpandedIds(filteredAndSortedVulnerabilities.map(v => v.id));
    }
  };

  const handleSort = (by: "severity" | "title") => {
    if (sortBy === by) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(by);
      setSortOrder("desc");
    }
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter vulnerabilities based on severity and search query
  const filteredAndSortedVulnerabilities = vulnerabilities
    .filter(v => {
      // Filter by severity
      const severityMatch = filter === "all" || v.severity.toLowerCase() === filter.toLowerCase();

      // Filter by search query
      const searchMatch = searchQuery === "" ||
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.location?.filePath && v.location.filePath.toLowerCase().includes(searchQuery.toLowerCase()));

      return severityMatch && searchMatch;
    })
    .sort((a, b) => {
      // Sort by severity
      if (sortBy === "severity") {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const aValue = severityOrder[a.severity.toLowerCase() as keyof typeof severityOrder] || 0;
        const bValue = severityOrder[b.severity.toLowerCase() as keyof typeof severityOrder] || 0;
        return sortOrder === "desc" ? bValue - aValue : aValue - bValue;
      }

      // Sort by title
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();
      return sortOrder === "desc"
        ? bTitle.localeCompare(aTitle)
        : aTitle.localeCompare(bTitle);
    });

  // Format tips to handle both string and array formats
  const formatTips = (tips: string | string[]) => {
    if (Array.isArray(tips)) {
      return (
        <ul className="list-disc pl-5 space-y-1">
          {tips.map((tip, index) => (
            <li key={index}>{tip}</li>
          ))}
        </ul>
      );
    }
    return tips;
  };

  // Helper function to get severity color
  const getSeverityColor = (severity: string) => {
    const lowercaseSeverity = severity.toLowerCase();
    switch (lowercaseSeverity) {
      case "critical":
        return "text-red-500 dark:text-red-400";
      case "high":
        return "text-orange-500 dark:text-orange-400";
      case "medium":
        return "text-yellow-500 dark:text-yellow-400";
      case "low":
        return "text-blue-500 dark:text-blue-400";
      default:
        return "text-gray-500 dark:text-gray-400";
    }
  };

  // Helper function to get severity badge styles
  const getSeverityBadgeStyles = (severity: string) => {
    const lowercaseSeverity = severity.toLowerCase();
    switch (lowercaseSeverity) {
      case "critical":
        return "bg-red-100/80 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300";
      case "high":
        return "bg-orange-100/80 border-orange-200 text-orange-800 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-300";
      case "medium":
        return "bg-yellow-100/80 border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-300";
      case "low":
        return "bg-blue-100/80 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300";
      default:
        return "bg-gray-100/80 border-gray-200 text-gray-800 dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-300";
    }
  };

  // Get severity icon with color
  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "high":
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case "medium":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "low":
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
        <RefreshCcw className="h-12 w-12 text-primary animate-spin" />
        <div className="text-center">
          <h3 className="text-lg font-medium">Loading vulnerability data</h3>
          <p className="text-muted-foreground">Please wait while we fetch the analysis results</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center max-w-md mx-auto">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium">Error Loading Data</h3>
        <p className="text-muted-foreground mt-1 mb-4">{error}</p>
        <Button onClick={fetchAnalysisData} className="gap-2">
          <RefreshCcw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Header Section */}
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-primary" />
              Static Analysis Results
            </h1>
            {analysis && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="font-semibold text-sm">
                    {analysis.project.project_name}
                  </Badge>
                  <Badge variant={analysis.static_analysis_status === 'Completed' ? 'default' : 'secondary'} className="text-xs">
                    {analysis.static_analysis_status}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {analysis.static_analysis_type} Analysis
                  </Badge>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="flex items-center gap-1 max-w-[350px] truncate">
                        <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                        <a href={analysis.source_url} target="_blank" rel="noopener noreferrer" className="truncate hover:underline">
                          {analysis.source_url}
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{analysis.source_url}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <div className="hidden sm:block text-muted-foreground">•</div>
                  <span>Scanned: {formatDate(analysis.created_at)}</span>
                  <div className="hidden sm:block text-muted-foreground">•</div>
                  <span>Updated: {formatDate(analysis.updated_at)}</span>
                </div>
              </>
            )}
          </div>

          <Button onClick={fetchAnalysisData} variant="outline" className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Refresh Analysis
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className={`bg-card/50 hover:bg-card/70 transition-colors ${filter === 'all' ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`} onClick={() => setFilter('all')}>
            <CardContent className="p-4 flex justify-between items-center cursor-pointer">
              <div>
                <p className="text-sm font-medium">All Issues</p>
                <h3 className="text-2xl font-semibold">{severityCounts.all}</h3>
              </div>
              <ShieldAlert className="h-8 w-8 text-primary/50" />
            </CardContent>
          </Card>

          <Card
            className={`bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors ${filter === 'critical' ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-background' : ''}`}
            onClick={() => setFilter('critical')}
          >
            <CardContent className="p-4 flex justify-between items-center cursor-pointer">
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-400">Critical</p>
                <h3 className="text-2xl font-semibold text-red-700 dark:text-red-400">{severityCounts.critical}</h3>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500/50" />
            </CardContent>
          </Card>

          <Card
            className={`bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-950/30 transition-colors ${filter === 'high' ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-background' : ''}`}
            onClick={() => setFilter('high')}
          >
            <CardContent className="p-4 flex justify-between items-center cursor-pointer">
              <div>
                <p className="text-sm font-medium text-orange-700 dark:text-orange-400">High</p>
                <h3 className="text-2xl font-semibold text-orange-700 dark:text-orange-400">{severityCounts.high}</h3>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500/50" />
            </CardContent>
          </Card>

          <Card
            className={`bg-yellow-50 dark:bg-yellow-950/20 hover:bg-yellow-100 dark:hover:bg-yellow-950/30 transition-colors ${filter === 'medium' ? 'ring-2 ring-yellow-500 ring-offset-2 ring-offset-background' : ''}`}
            onClick={() => setFilter('medium')}
          >
            <CardContent className="p-4 flex justify-between items-center cursor-pointer">
              <div>
                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Medium</p>
                <h3 className="text-2xl font-semibold text-yellow-700 dark:text-yellow-400">{severityCounts.medium}</h3>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500/50" />
            </CardContent>
          </Card>

          <Card
            className={`bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors ${filter === 'low' ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-background' : ''}`}
            onClick={() => setFilter('low')}
          >
            <CardContent className="p-4 flex justify-between items-center cursor-pointer">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Low</p>
                <h3 className="text-2xl font-semibold text-blue-700 dark:text-blue-400">{severityCounts.low}</h3>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-500/50" />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Search and filter controls */}
      <div className="my-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-auto sm:min-w-[300px] lg:min-w-[400px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vulnerabilities, files..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Sort by: {sortBy === "severity" ? "Severity" : "Title"}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleSort("severity")} className="gap-2">
                <span>Severity</span>
                {sortBy === "severity" && (
                  sortOrder === "desc" ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("title")} className="gap-2">
                <span>Title</span>
                {sortBy === "title" && (
                  sortOrder === "desc" ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            onClick={toggleExpandAll}
          >
            {expandedIds.length === filteredAndSortedVulnerabilities.length ? "Collapse All" : "Expand All"}
          </Button>
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-6 pb-8">
        {filteredAndSortedVulnerabilities.length === 0 ? (
          <Card className="bg-background p-8">
            <CardContent className="flex flex-col items-center justify-center pt-6">
              <ShieldAlert className="h-12 w-12 text-green-500 mb-4" />
              <p className="text-xl font-medium text-center mb-2">No vulnerabilities found</p>
              <p className="text-muted-foreground text-center">
                {searchQuery
                  ? `No results match your search for "${searchQuery}"`
                  : filter !== "all"
                    ? `No ${filter} severity issues were found`
                    : "No security issues were detected in this analysis"}
              </p>
              {(searchQuery || filter !== "all") && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery("");
                    setFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Showing {filteredAndSortedVulnerabilities.length} of {severityCounts.all} vulnerabilities
              {filter !== "all" ? ` with ${filter} severity` : ""}
              {searchQuery ? ` matching "${searchQuery}"` : ""}
            </p>

            {filteredAndSortedVulnerabilities.map((vuln) => {
              const isExpanded = expandedIds.includes(vuln.id);
              const severityCapitalized = vuln.severity.charAt(0).toUpperCase() + vuln.severity.slice(1).toLowerCase();

              return (
                <Card
                  key={vuln.id}
                  className={`bg-background border transition-all duration-200 ${isExpanded
                      ? 'shadow-md border-l-4'
                      : 'hover:border-l-4 hover:shadow-sm'
                    } ${getSeverityBorderColor(vuln.severity)}`}
                >
                  <CardHeader
                    className="cursor-pointer transition-colors hover:bg-muted/40"
                    onClick={() => toggleExpand(vuln.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getSeverityIcon(vuln.severity)}
                        <div>
                          <CardTitle className="text-lg flex flex-wrap gap-2 items-center">
                            {vuln.title}
                            <Badge className={`text-xs py-0 border ${getSeverityBadgeStyles(vuln.severity)}`}>
                              {severityCapitalized}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {vuln.description}
                          </CardDescription>
                          {vuln.location && vuln.location.filePath && (
                            <div className="flex items-center mt-2 text-xs text-muted-foreground">
                              <CodeSquare className="h-3.5 w-3.5 mr-1" />
                              <span className="font-mono">
                                {vuln.location.filePath}
                                {vuln.location.lineNumber && `:${vuln.location.lineNumber}`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(vuln.id);
                        }}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <>
                      <CardContent className="space-y-6 pt-0">
                        {/* Code Fix */}
                        <div className="bg-muted rounded-lg overflow-hidden border">
                          <div className="bg-muted/70 px-4 py-2 text-sm font-medium flex justify-between items-center">
                            <span>Recommended Fix</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleCopyCode(vuln.id, vuln.fix)}
                            >
                              {copiedId === vuln.id ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <pre className="p-4 text-sm font-mono overflow-x-auto whitespace-pre-wrap break-words">
                            <code>{vuln.fix}</code>
                          </pre>
                        </div>

                        {/* Best Practices - only show if tips is not empty */}
                        {vuln.tips && (Array.isArray(vuln.tips) ? vuln.tips.length > 0 : vuln.tips.trim() !== '') && (
                          <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-lg border border-primary/20">
                            <div className="flex items-start gap-3">
                              <Lightbulb className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                              <div>
                                <h3 className="font-semibold text-sm mb-1">Best Practices</h3>
                                <div className="text-sm text-muted-foreground">
                                  {formatTips(vuln.tips)}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Vulnerable Code (if available) */}
                        {vuln.vulnerableCode && (
                          <div className="bg-red-50 dark:bg-red-950/20 rounded-lg overflow-hidden border border-red-200 dark:border-red-800/30">
                            <div className="bg-red-100 dark:bg-red-950/40 px-4 py-2 text-sm font-medium text-red-800 dark:text-red-300 flex justify-between items-center">
                              <span>Vulnerable Code</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleCopyCode(`vulnerable-${vuln.id}`, vuln.vulnerableCode!)}
                              >
                                {copiedId === `vulnerable-${vuln.id}` ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            <pre className="p-4 text-sm font-mono overflow-x-auto">
                              <code>{vuln.vulnerableCode}</code>
                            </pre>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="text-sm text-muted-foreground justify-between py-3 border-t">
                        <p className="flex items-center gap-1">
                          <Clipboard className="h-4 w-4" />
                          ID: {vuln.id}
                        </p>
                      </CardFooter>
                    </>
                  )}
                </Card>
              );
            })}
          </>
        )}

        {/* Cross-file taint analysis (deterministic SAST, runs alongside every scan) */}
        {analysis?.Taint_analysis_result && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-1">
              <GitBranch className="h-5 w-5 text-primary" />
              Taint Analysis
              <span className="text-sm font-normal text-muted-foreground">
                (cross-file data flow)
              </span>
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              <span className="text-foreground font-medium">{analysis.Taint_analysis_result.active_total ?? analysis.Taint_analysis_result.total ?? 0}</span> active
              {" · "}{analysis.Taint_analysis_result.suppressed_total ?? 0} suppressed/triaged
              {typeof analysis.Taint_analysis_result.cross_file === "number"
                ? ` · ${analysis.Taint_analysis_result.cross_file} cross-file`
                : ""}
              {" · "}{analysis.Taint_analysis_result.total ?? 0} total (deduped)
            </p>
            {(analysis.Taint_analysis_result.taint_findings || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tainted source→sink flows found.
              </p>
            ) : (
              <div className="space-y-3">
                {(analysis.Taint_analysis_result.taint_findings || []).map((t, i) => {
                  const inactive = t.suppressed || (t.triage_status && t.triage_status !== "open");
                  return (
                  <Card
                    key={t.fingerprint || i}
                    className={`border-l-4 ${getSeverityBorderColor(t.severity)} ${inactive ? "opacity-60" : ""}`}
                  >
                    <CardContent className="p-4 text-sm">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`text-xs py-0 border ${getSeverityBadgeStyles(t.severity)}`}>
                          {t.severity}
                        </Badge>
                        <span className="font-mono text-xs">{t.cwe}</span>
                        <span className="font-medium">{t.title}</span>
                        {t.cross_file && (
                          <Badge variant="secondary" className="bg-purple-500/10 text-purple-500">
                            cross-file
                          </Badge>
                        )}
                        {t.sanitized && (
                          <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                            sanitized
                          </Badge>
                        )}
                        {(t.occurrence_count ?? 1) > 1 && (
                          <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">
                            {t.occurrence_count}× occurrences
                          </Badge>
                        )}
                        {t.suppressed && (
                          <Badge variant="secondary" className="bg-gray-500/15 text-gray-500">
                            suppressed ({t.suppression_source})
                          </Badge>
                        )}
                        {t.triage_status && t.triage_status !== "open" && (
                          <Badge variant="secondary" className="bg-amber-500/15 text-amber-600">
                            {t.triage_status.replace("_", " ")}
                          </Badge>
                        )}
                        <span className="ml-auto text-xs text-muted-foreground">
                          confidence {t.confidence}
                        </span>
                      </div>
                      <p className="mt-2 text-muted-foreground">
                        Sink <span className="font-mono">{t.sink}</span> at{" "}
                        <span className="font-mono">{t.sink_file}:{t.sink_line}</span> · {t.owasp}
                      </p>
                      {(t.taint_path || []).length > 0 && (
                        <div className="mt-3 border-l-2 border-muted pl-3 space-y-1">
                          {t.taint_path.map((hop, j) => (
                            <div key={j} className="font-mono text-xs text-muted-foreground">
                              {j > 0 ? "↳ " : ""}{hop}
                            </div>
                          ))}
                        </div>
                      )}
                      {(t.occurrences || []).length > 1 && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Also at: {t.occurrences!.slice(1).map(o => `${o.sink_file}:${o.sink_line}`).join(", ")}
                        </div>
                      )}
                      {/* Triage controls */}
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">Triage:</span>
                        {[
                          { v: "open", label: "Open" },
                          { v: "false_positive", label: "False positive" },
                          { v: "accepted_risk", label: "Accepted risk" },
                          { v: "wont_fix", label: "Won't fix" },
                        ].map((opt) => (
                          <Button
                            key={opt.v}
                            type="button"
                            variant={(t.triage_status || "open") === opt.v ? "default" : "outline"}
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setTriage(t, opt.v)}
                          >
                            {opt.label}
                          </Button>
                        ))}
                        <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                          {t.fingerprint}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function for colored borders based on severity
const getSeverityBorderColor = (severity: string) => {
  const lowercaseSeverity = severity.toLowerCase();
  switch (lowercaseSeverity) {
    case "critical":
      return "border-l-red-500";
    case "high":
      return "border-l-orange-500";
    case "medium":
      return "border-l-yellow-500";
    case "low":
      return "border-l-blue-500";
    default:
      return "border-l-gray-500";
  }
};

export default withAuth(StaticAnalysisPage);