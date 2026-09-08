"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Terminal, AlertCircle, Shield, Clock, RefreshCcw, FileWarning, Search, ChevronDown, ChevronUp, Filter, ArrowUpDown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useParams } from "next/navigation";
import withAuth from '@/utils/withAuth';
import { getAccessTokenForAPI } from '@/utils/authUtils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ScanResult {
  url: string;
  issue: string;
  severity: string;
  description: string;
  timestamp: string;
}

interface Analysis {
  id: number;
  dynamic_analysis_type: string;
  source_url: string;
  Nuclie_analysis_result: string;
  dynamic_analysis_status: string;
  error_message: string;
  created_at: string;
  updated_at: string;
  user_id: number;
  project: {
    id: number;
    project_name: string;
  };
  scan_results: ScanResult[];
}

function DynamicAnalysisPage() {
  const params = useParams();
  const scanUuid = params.id;
  const resultsRef = useRef<HTMLDivElement>(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedIssues, setExpandedIssues] = useState<{ [key: number]: boolean }>({});
  const [sortConfig, setSortConfig] = useState({ key: "severity", direction: "desc" });

  // Stats for summary
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0
  });

  // Fetch analysis data
  const fetchAnalysisData = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/dynamic-analysis/${scanUuid}/`, {
        headers: {
          'Authorization': `Bearer ${getAccessTokenForAPI()}`,
          'ngrok-skip-browser-warning': 'true',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        // The API returns an array with a single object
        setAnalysis(data[0]);
        
        // Extract scan results and add timestamps if missing
        const results = data[0].scan_results || [];
        const resultsWithTimestamps = results.map((result: ScanResult) => ({
          ...result,
          // Use creation time if timestamp is missing
          timestamp: result.timestamp || data[0].created_at
        }));
        
        setScanResults(resultsWithTimestamps);
        
        // Calculate stats
        const newStats = {
          total: results.length,
          critical: results.filter((r: { severity: string; }) => r.severity?.toLowerCase() === "critical").length,
          high: results.filter((r: { severity: string; }) => r.severity?.toLowerCase() === "high").length,
          medium: results.filter((r: { severity: string; }) => r.severity?.toLowerCase() === "medium").length,
          low: results.filter((r: { severity: string; }) => r.severity?.toLowerCase() === "low").length,
          info: results.filter((r: { severity: string; }) => r.severity?.toLowerCase() === "info").length
        };
        setStats(newStats);
      } else {
        setError("Invalid data format received from API");
        setScanResults([]);
      }
    } catch (err) {
      console.error("Error fetching analysis:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch analysis data");
      setScanResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysisData();
  }, [scanUuid]);

  const getSeverityColor = (severity: string | undefined) => {
    // Handle undefined or null severity
    if (!severity) return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    
    const colors = {
      critical: "bg-red-500/10 text-red-500 border-red-500/20",
      high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      low: "bg-green-500/10 text-green-500 border-green-500/20",
      info: "bg-blue-500/10 text-blue-500 border-blue-500/20"
    };
    return colors[severity.toLowerCase() as keyof typeof colors] || "bg-blue-500/10 text-blue-500 border-blue-500/20";
  };

  const getSeverityIcon = (severity: string | undefined) => {
    if (!severity) return <AlertCircle className="h-4 w-4 text-blue-500" />;
    
    const icons = {
      critical: <AlertCircle className="h-4 w-4 text-red-500" />,
      high: <AlertCircle className="h-4 w-4 text-orange-500" />,
      medium: <AlertCircle className="h-4 w-4 text-yellow-500" />,
      low: <AlertCircle className="h-4 w-4 text-green-500" />,
      info: <AlertCircle className="h-4 w-4 text-blue-500" />
    };
    return icons[severity.toLowerCase() as keyof typeof icons] || <AlertCircle className="h-4 w-4 text-blue-500" />;
  };

  // Helper function to get severity badge styles
  const getSeverityBadgeStyles = (severity: string | undefined) => {
    if (!severity) return "bg-blue-100/80 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300";
    
    const lowercaseSeverity = severity.toLowerCase();
    switch (lowercaseSeverity) {
      case "critical":
        return "bg-red-100/80 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300";
      case "high":
        return "bg-orange-100/80 border-orange-200 text-orange-800 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-300";
      case "medium":
        return "bg-yellow-100/80 border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-300";
      case "low":
        return "bg-green-100/80 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300";
      case "info":
        return "bg-blue-100/80 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300";
      default:
        return "bg-gray-100/80 border-gray-200 text-gray-800 dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-300";
    }
  };

  // Get severity border color
  const getSeverityBorderColor = (severity: string | undefined) => {
    if (!severity) return "border-l-blue-500";
    
    const lowercaseSeverity = severity.toLowerCase();
    switch (lowercaseSeverity) {
      case "critical":
        return "border-l-red-500";
      case "high":
        return "border-l-orange-500";
      case "medium":
        return "border-l-yellow-500";
      case "low":
        return "border-l-green-500";
      case "info":
        return "border-l-blue-500";
      default:
        return "border-l-gray-500";
    }
  };
  
  const formatTimestamp = (timestamp: string) => {
    return timestamp ? new Date(timestamp).toLocaleString() : "N/A";
  };

  const formatRelativeTime = (timestamp: string) => {
    if (!timestamp) return "N/A";
    
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
  };

  // Filter and sort data
  const processData = () => {
    let data = [...scanResults];
    
    // Apply severity filter
    if (filter !== "all") {
      data = data.filter(item => item.severity?.toLowerCase() === filter.toLowerCase());
    }
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      data = data.filter(item => 
        (item.issue?.toLowerCase().includes(query) || 
        item.url?.toLowerCase().includes(query) || 
        item.description?.toLowerCase().includes(query))
      );
    }
    
    // Sort data
    data.sort((a, b) => {
      const severityOrder = { critical: 5, high: 4, medium: 3, low: 2, info: 1 };
      const aValue = sortConfig.key === "severity" 
        ? severityOrder[(a.severity?.toLowerCase() || "info") as keyof typeof severityOrder]
        : sortConfig.key === "timestamp" ? new Date(a.timestamp || "").getTime() : a.issue || "";
        
      const bValue = sortConfig.key === "severity" 
        ? severityOrder[(b.severity?.toLowerCase() || "info") as keyof typeof severityOrder]
        : sortConfig.key === "timestamp" ? new Date(b.timestamp || "").getTime() : b.issue || "";
      
      return sortConfig.direction === "asc" 
        ? (aValue < bValue ? -1 : 1)
        : (aValue > bValue ? -1 : 1);
    });
    
    return data;
  };

  const filteredData = processData();

  const toggleSort = (key: string) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === "desc" ? "asc" : "desc"
    }));
  };

  const toggleExpand = (index: number) => {
    setExpandedIssues(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const toggleExpandAll = () => {
    const allExpanded = Object.keys(expandedIssues).length === filteredData.length;
    if (allExpanded) {
      setExpandedIssues({});
    } else {
      const newExpandedIssues: { [key: number]: boolean } = {};
      filteredData.forEach((_, index) => {
        newExpandedIssues[index] = true;
      });
      setExpandedIssues(newExpandedIssues);
    }
  };

  const startScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    
    // Simulated scan progress
    const interval = setInterval(() => {
      setScanProgress(prev => {
        const newProgress = prev + Math.random() * 15;
        if (newProgress >= 100) {
          clearInterval(interval);
          return 100;
        }
        return newProgress;
      });
    }, 500);
    
    // Simulate API call for a new scan
    setTimeout(() => {
      fetchAnalysisData();
      setIsScanning(false);
      clearInterval(interval);
      setScanProgress(100);
    }, 5000);
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
        <RefreshCcw className="h-12 w-12 text-primary animate-spin" />
        <div className="text-center">
          <span className="text-lg font-medium block">Loading scan results</span>
          <span className="text-sm text-muted-foreground">Please wait while we fetch the analysis data</span>
        </div>
      </div>
    );
  }

  // Render error state
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
          <div className="space-y-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Terminal className="h-6 w-6 text-primary" />
              Dynamic Analysis Results
            </h1>
            {analysis && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-x-2 gap-y-1 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    {analysis.dynamic_analysis_type}
                  </Badge>
                </div>
                <div className="hidden sm:block text-muted-foreground">•</div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1 max-w-[300px] truncate">
                      <ExternalLink className="h-4 w-4" />
                      <span className="truncate">{analysis.source_url}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{analysis.source_url}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div className="hidden sm:block text-muted-foreground">•</div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>{formatRelativeTime(analysis.created_at)}</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{formatTimestamp(analysis.created_at)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            )}
          </div>
          
          <Button 
            onClick={startScan} 
            disabled={isScanning || analysis?.dynamic_analysis_status !== "Completed"}
            className="gap-2"
          >
            <RefreshCcw className={`h-4 w-4 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Scanning...' : 'Start New Scan'}
          </Button>
        </div>

        {/* Active scan progress */}
        {isScanning && (
          <Card className="border border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Scan in progress</span>
                <span className="text-sm text-muted-foreground">{Math.floor(scanProgress)}%</span>
              </div>
              <Progress value={scanProgress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                Scanning for security vulnerabilities in {analysis?.source_url}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card 
            className={`bg-card/50 hover:bg-card/70 transition-colors ${filter === 'all' ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
            onClick={() => setFilter('all')}
          >
            <CardContent className="p-4 flex justify-between items-center cursor-pointer">
              <div>
                <p className="text-sm font-medium">All Issues</p>
                <h3 className="text-2xl font-semibold">{stats.total}</h3>
              </div>
              <Shield className="h-8 w-8 text-primary/50" />
            </CardContent>
          </Card>
          
          <Card 
            className={`bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors ${filter === 'critical' ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-background' : ''}`} 
            onClick={() => setFilter('critical')}
          >
            <CardContent className="p-4 flex justify-between items-center cursor-pointer">
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-400">Critical</p>
                <h3 className="text-2xl font-semibold text-red-700 dark:text-red-400">{stats.critical}</h3>
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
                <h3 className="text-2xl font-semibold text-orange-700 dark:text-orange-400">{stats.high}</h3>
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
                <h3 className="text-2xl font-semibold text-yellow-700 dark:text-yellow-400">{stats.medium}</h3>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500/50" />
            </CardContent>
          </Card>
          
          <Card 
            className={`bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-950/30 transition-colors ${filter === 'low' ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-background' : ''}`} 
            onClick={() => setFilter('low')}
          >
            <CardContent className="p-4 flex justify-between items-center cursor-pointer">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-400">Low</p>
                <h3 className="text-2xl font-semibold text-green-700 dark:text-green-400">{stats.low}</h3>
              </div>
              <AlertCircle className="h-8 w-8 text-green-500/50" />
            </CardContent>
          </Card>
          
          <Card 
            className={`bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors ${filter === 'info' ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-background' : ''}`} 
            onClick={() => setFilter('info')}
          >
            <CardContent className="p-4 flex justify-between items-center cursor-pointer">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Info</p>
                <h3 className="text-2xl font-semibold text-blue-700 dark:text-blue-400">{stats.info}</h3>
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
            placeholder="Search issues, URLs, descriptions..."
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
                Sort by: {
                  sortConfig.key === 'severity' ? 'Severity' : 
                  sortConfig.key === 'timestamp' ? 'Time' : 'Issue Name'
                }
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toggleSort("severity")} className="gap-2">
                <span>Severity</span>
                {sortConfig.key === "severity" && (
                  sortConfig.direction === "desc" ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleSort("issue")} className="gap-2">
                <span>Issue Name</span>
                {sortConfig.key === "issue" && (
                  sortConfig.direction === "desc" ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleSort("timestamp")} className="gap-2">
                <span>Time</span>
                {sortConfig.key === "timestamp" && (
                  sortConfig.direction === "desc" ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {filteredData.length > 0 && (
            <Button 
              variant="outline" 
              onClick={toggleExpandAll}
            >
              {Object.keys(expandedIssues).length === filteredData.length ? "Collapse All" : "Expand All"}
            </Button>
          )}
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-6 pb-8">
        {filteredData.length === 0 ? (
          <Card className="bg-background p-8">
            <CardContent className="flex flex-col items-center justify-center pt-6">
              <FileWarning className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-xl font-medium text-center mb-2">No issues found</p>
              <p className="text-muted-foreground text-center">
                {searchQuery 
                  ? `No results match your search for "${searchQuery}".` 
                  : filter !== "all" 
                    ? `No issues with ${filter} severity level were found.`
                    : "No security issues were detected in this scan."}
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
              Showing {filteredData.length} of {stats.total} issues
              {filter !== "all" ? ` with ${filter} severity` : ""}
              {searchQuery ? ` matching "${searchQuery}"` : ""}
            </p>
            
            {filteredData.map((item, index) => {
              const isExpanded = expandedIssues[index];
              const severityCapitalized = item.severity ? item.severity.charAt(0).toUpperCase() + item.severity.slice(1).toLowerCase() : "Info";
              
              return (
                <Card 
                  key={index} 
                  className={`bg-background border transition-all duration-200 ${
                    isExpanded 
                      ? 'shadow-md border-l-4' 
                      : 'hover:border-l-4 hover:shadow-sm'
                  } ${getSeverityBorderColor(item.severity)}`}
                >
                  <CardHeader 
                    className="cursor-pointer transition-colors hover:bg-muted/40" 
                    onClick={() => toggleExpand(index)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getSeverityIcon(item.severity)}
                        <div>
                          <CardTitle className="text-lg flex flex-wrap gap-2 items-center">
                            {item.issue}
                            <Badge className={`text-xs py-0 border ${getSeverityBadgeStyles(item.severity)}`}>
                              {severityCapitalized}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="mt-1 line-clamp-2">
                            {item.description || "No description available"}
                          </CardDescription>
                          <div className="flex items-center mt-2 text-xs text-muted-foreground">
                            <Clock className="h-3.5 w-3.5 mr-1" />
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>{formatRelativeTime(item.timestamp)}</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{formatTimestamp(item.timestamp)}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(index);
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
                      <CardContent className="space-y-4 pt-0">
                        {/* Description Section */}
                        <div className="bg-muted/30 p-4 rounded-lg border">
                          <h3 className="font-semibold text-sm mb-2">Description</h3>
                          <p className="text-sm text-muted-foreground">
                            {item.description || "No detailed description available for this issue."}
                          </p>
                        </div>
                        
                        {/* URL Section */}
                        <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-lg border border-primary/20">
                          <div className="flex flex-col gap-2">
                            <h3 className="font-semibold text-sm">Affected URL</h3>
                            <div className="flex items-center justify-between">
                              <code className="text-xs bg-muted p-1.5 rounded font-mono break-all flex-1 overflow-x-auto">
                                {item.url}
                              </code>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="ml-2 gap-1"
                                onClick={() => window.open(item.url, '_blank')}
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                Open
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </>
                  )}
                </Card>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

export default withAuth(DynamicAnalysisPage);