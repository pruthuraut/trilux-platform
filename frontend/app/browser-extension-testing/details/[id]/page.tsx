"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { 
  Puzzle, ShieldAlert, Lightbulb, ChevronDown, ChevronUp, 
  RefreshCcw, AlertCircle, Search, Filter, Copy, Check, ExternalLink, 
  CodeSquare, Clock, Bug, ArrowLeft, Download, FileText, Info, 
  Chrome, Globe, Key, Lock, Gauge
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useParams, useRouter } from "next/navigation";
import withAuth from '@/utils/withAuth';
import { getAccessTokenForAPI, redirectToLogin } from '@/utils/authUtils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

// Interfaces for API response
interface Vulnerability {
  type: string;
  severity: string;
  description: string;
  location: string;
  recommendation: string;
  file?: string;
  chunk?: string;
  cwe_id?: string;
  file_type?: string;
  permission?: string;
}

interface ExtensionInfo {
  name: string;
  version: string;
  description: string;
  permissions: string[];
  host_permissions: string[];
  content_scripts: any[];
  background: any;
  manifest_version: number;
}

interface AnalysisResult {
  extension_info?: ExtensionInfo;
  vulnerabilities: Vulnerability[];
  total_vulnerabilities: number;
  code_vulnerabilities: number;
  permission_issues: number;
  summary?: {
    by_severity: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    by_type: Record<string, number>;
    risk_score: number;
  };
}

interface Project {
  id: number;
  project_name: string;
}

interface BrowserExtensionAnalysis {
  id: number;
  scan_uuid: string;
  extension_name: string;
  extension_version: string;
  extension_type: string;
  extension_file: string;
  file_size: number;
  manifest_version: number | null;
  permissions: string[];
  analysis_result: AnalysisResult | null;
  browser_extension_analysis_status: string;
  total_vulnerabilities: number;
  code_vulnerabilities: number;
  permission_issues: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  risk_score: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  user_id: number;
  project: Project | number;
}

interface SeverityCounts {
  all: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

function BrowserExtensionAnalysisDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const scanUuid = params?.id as string;

  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"severity" | "type">("severity");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [analysis, setAnalysis] = useState<BrowserExtensionAnalysis | null>(null);
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
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    fetchAnalysisData();
  }, [scanUuid]);

  // Auto-refresh for in-progress analyses
  useEffect(() => {
    if (analysis?.browser_extension_analysis_status === "InProgress" || analysis?.browser_extension_analysis_status === "Waiting") {
      const interval = setInterval(fetchAnalysisData, 10000);
      return () => clearInterval(interval);
    }
  }, [analysis?.browser_extension_analysis_status]);

  const fetchAnalysisData = async () => {
    if (!scanUuid) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      const token = getAccessTokenForAPI();
      if (!token) {
        redirectToLogin(router);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/browser-extension-analysis/${scanUuid}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          redirectToLogin(router);
          return;
        }
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      
      const data: BrowserExtensionAnalysis = await response.json();
      setAnalysis(data);
      
      // Extract vulnerabilities from analysis result
      const allVulnerabilities: Vulnerability[] = [];
      
      if (data.analysis_result?.vulnerabilities && Array.isArray(data.analysis_result.vulnerabilities)) {
        allVulnerabilities.push(...data.analysis_result.vulnerabilities);
      }
      
      setVulnerabilities(allVulnerabilities);

      // Calculate severity counts
      const counts = {
        all: data.total_vulnerabilities || allVulnerabilities.length,
        critical: data.critical_count || allVulnerabilities.filter(v => v.severity?.toLowerCase() === "critical").length,
        high: data.high_count || allVulnerabilities.filter(v => v.severity?.toLowerCase() === "high").length,
        medium: data.medium_count || allVulnerabilities.filter(v => v.severity?.toLowerCase() === "medium").length,
        low: data.low_count || allVulnerabilities.filter(v => v.severity?.toLowerCase() === "low").length,
      };
      setSeverityCounts(counts);
    } catch (err) {
      console.error("Error fetching analysis:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch analysis data");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (index: number) => {
    setExpandedIds(prevIds =>
      prevIds.includes(index)
        ? prevIds.filter(prevId => prevId !== index)
        : [...prevIds, index]
    );
  };

  const toggleExpandAll = () => {
    if (expandedIds.length === filteredAndSortedVulnerabilities.length) {
      setExpandedIds([]);
    } else {
      setExpandedIds(filteredAndSortedVulnerabilities.map((_, i) => i));
    }
  };

  const handleSort = (by: "severity" | "type") => {
    if (sortBy === by) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(by);
      setSortOrder("desc");
    }
  };

  const handleCopyCode = (index: number, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(index);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter vulnerabilities based on severity and search query
  const filteredAndSortedVulnerabilities = vulnerabilities
    .filter(v => {
      const severityMatch = filter === "all" || v.severity?.toLowerCase() === filter.toLowerCase();
      const searchMatch = searchQuery === "" || 
        v.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.file?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.permission?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return severityMatch && searchMatch;
    })
    .sort((a, b) => {
      if (sortBy === "severity") {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
        const aValue = severityOrder[a.severity?.toLowerCase() as keyof typeof severityOrder] || 0;
        const bValue = severityOrder[b.severity?.toLowerCase() as keyof typeof severityOrder] || 0;
        return sortOrder === "desc" ? bValue - aValue : aValue - bValue;
      }
      
      const aType = a.type?.toLowerCase() || "";
      const bType = b.type?.toLowerCase() || "";
      return sortOrder === "desc"
        ? bType.localeCompare(aType)
        : aType.localeCompare(bType);
    });

  // Helper functions
  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
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

  const getSeverityBadgeStyles = (severity: string) => {
    switch (severity?.toLowerCase()) {
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

  const getSeverityBorderColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
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

  const getSeverityIcon = (severity: string) => {
    switch (severity?.toLowerCase()) {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800">Completed</Badge>;
      case "InProgress":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800">In Progress</Badge>;
      case "Waiting":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800">Waiting</Badge>;
      case "Failed":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getExtensionIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'CRX':
        return <Chrome className="h-6 w-6 text-primary" />;
      case 'XPI':
        return <Globe className="h-6 w-6 text-orange-500" />;
      default:
        return <Puzzle className="h-6 w-6 text-primary" />;
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600';
    if (score >= 60) return 'text-orange-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
        <RefreshCcw className="h-12 w-12 text-primary animate-spin" />
        <div className="text-center">
          <h3 className="text-lg font-medium">Loading analysis data</h3>
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/browser-extension-testing/history")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to History
          </Button>
          <Button onClick={fetchAnalysisData} className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center max-w-md mx-auto">
        <FileText className="h-12 w-12 text-gray-500 mb-4" />
        <h3 className="text-lg font-medium">Analysis Not Found</h3>
        <p className="text-muted-foreground mt-1 mb-4">The requested analysis could not be found.</p>
        <Button variant="outline" onClick={() => router.push("/browser-extension-testing/history")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to History
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
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push("/browser-extension-testing/history")}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {getExtensionIcon(analysis.extension_type)}
                {analysis.extension_name}
              </h1>
              {getStatusBadge(analysis.browser_extension_analysis_status)}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-x-2 gap-y-1 text-muted-foreground ml-12">
              <div className="flex items-center gap-1">
                <Badge variant="outline">{analysis.extension_type || "Extension"}</Badge>
                {analysis.extension_version && (
                  <Badge variant="secondary">v{analysis.extension_version}</Badge>
                )}
                {analysis.manifest_version && (
                  <Badge variant="secondary">MV{analysis.manifest_version}</Badge>
                )}
              </div>
              <div className="hidden sm:block text-muted-foreground">•</div>
              <div className="flex items-center gap-1">
                <span>{formatFileSize(analysis.file_size)}</span>
              </div>
              <div className="hidden sm:block text-muted-foreground">•</div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Last updated: {formatDate(analysis.updated_at)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={fetchAnalysisData} variant="outline" className="gap-2">
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Status Banner for In-Progress/Waiting */}
        {(analysis.browser_extension_analysis_status === "InProgress" || analysis.browser_extension_analysis_status === "Waiting") && (
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <RefreshCcw className="h-5 w-5 animate-spin text-blue-500" />
                <div>
                  <p className="text-blue-700 dark:text-blue-400 font-medium">
                    {analysis.browser_extension_analysis_status === "Waiting" 
                      ? "Analysis queued and waiting to start..." 
                      : "Analysis in progress..."}
                  </p>
                  <p className="text-muted-foreground text-sm">This page will automatically refresh when complete</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Banner */}
        {analysis.browser_extension_analysis_status === "Failed" && analysis.error_message && (
          <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-red-700 dark:text-red-400 font-medium">Analysis Failed</p>
                  <p className="text-muted-foreground text-sm">{analysis.error_message}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
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

          {/* Risk Score Card */}
          <Card className="bg-card/50">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">Risk Score</p>
                <h3 className={`text-2xl font-semibold ${getRiskScoreColor(analysis.risk_score)}`}>
                  {analysis.risk_score}/100
                </h3>
              </div>
              <Gauge className={`h-8 w-8 ${getRiskScoreColor(analysis.risk_score)} opacity-50`} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs for Overview, Vulnerabilities, Permissions, and Details */}
      <Tabs defaultValue="vulnerabilities" className="mt-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vulnerabilities">Vulnerabilities ({severityCounts.all})</TabsTrigger>
          <TabsTrigger value="permissions">Permissions ({analysis.permissions?.length || 0})</TabsTrigger>
          <TabsTrigger value="details">Scan Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Extension Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getExtensionIcon(analysis.extension_type)}
                  Extension Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Extension Name</span>
                  <span className="font-medium">{analysis.extension_name}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Version</span>
                  <span>{analysis.extension_version || "N/A"}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Extension Type</span>
                  <Badge variant="outline">{analysis.extension_type || "Unknown"}</Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Manifest Version</span>
                  <Badge variant="secondary">MV{analysis.manifest_version || "?"}</Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">File Size</span>
                  <span>{formatFileSize(analysis.file_size)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Project</span>
                  <span>{typeof analysis.project === 'object' ? analysis.project.project_name : analysis.project}</span>
                </div>
              </CardContent>
            </Card>

            {/* Scan Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Scan Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Started</span>
                  <span>{formatDate(analysis.created_at)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>{formatDate(analysis.updated_at)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status</span>
                  {getStatusBadge(analysis.browser_extension_analysis_status)}
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Code Vulnerabilities</span>
                  <span className="font-medium">{analysis.code_vulnerabilities}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Permission Issues</span>
                  <span className="font-medium">{analysis.permission_issues}</span>
                </div>
              </CardContent>
            </Card>

            {/* Vulnerability Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bug className="h-5 w-5 text-primary" />
                  Vulnerability Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Critical", count: severityCounts.critical, color: "bg-red-500" },
                  { label: "High", count: severityCounts.high, color: "bg-orange-500" },
                  { label: "Medium", count: severityCounts.medium, color: "bg-yellow-500" },
                  { label: "Low", count: severityCounts.low, color: "bg-blue-500" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span>{item.count}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} transition-all duration-500`}
                        style={{
                          width: `${severityCounts.all > 0 
                            ? (item.count / severityCounts.all) * 100 
                            : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vulnerabilities" className="mt-4">
          {/* Search and filter controls */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
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
                    Sort by: {sortBy === "severity" ? "Severity" : "Type"}
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
                  <DropdownMenuItem onClick={() => handleSort("type")} className="gap-2">
                    <span>Type</span>
                    {sortBy === "type" && (
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
          <div className="space-y-4 pb-8">
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
                        : analysis.browser_extension_analysis_status === "Completed"
                          ? "No security issues were detected in this analysis"
                          : "Vulnerabilities will appear here once analysis is complete"}
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
                
                {filteredAndSortedVulnerabilities.map((vuln, index) => {
                  const isExpanded = expandedIds.includes(index);
                  const severityCapitalized = vuln.severity ? vuln.severity.charAt(0).toUpperCase() + vuln.severity.slice(1).toLowerCase() : "Unknown";
                  
                  return (
                    <Card 
                      key={index} 
                      className={`bg-background border transition-all duration-200 ${
                        isExpanded 
                          ? 'shadow-md border-l-4' 
                          : 'hover:border-l-4 hover:shadow-sm'
                      } ${getSeverityBorderColor(vuln.severity)}`}
                    >
                      <CardHeader 
                        className="cursor-pointer transition-colors hover:bg-muted/40" 
                        onClick={() => toggleExpand(index)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            {getSeverityIcon(vuln.severity)}
                            <div>
                              <CardTitle className="text-lg flex flex-wrap gap-2 items-center">
                                {vuln.type}
                                <Badge className={`text-xs py-0 border ${getSeverityBadgeStyles(vuln.severity)}`}>
                                  {severityCapitalized}
                                </Badge>
                                {vuln.cwe_id && (
                                  <Badge variant="outline" className="text-xs">
                                    {vuln.cwe_id}
                                  </Badge>
                                )}
                              </CardTitle>
                              <CardDescription className="mt-1 line-clamp-2">
                                {vuln.description}
                              </CardDescription>
                              {(vuln.location || vuln.file) && (
                                <div className="flex items-center mt-2 text-xs text-muted-foreground">
                                  <CodeSquare className="h-3.5 w-3.5 mr-1" />
                                  <span className="font-mono">
                                    {vuln.file || vuln.location}
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
                          <CardContent className="space-y-6 pt-0">
                            {/* Description */}
                            <div>
                              <h4 className="text-sm font-medium mb-2">Description</h4>
                              <p className="text-sm text-muted-foreground">{vuln.description}</p>
                            </div>

                            {/* Location */}
                            {vuln.location && (
                              <div>
                                <h4 className="text-sm font-medium mb-2">Location</h4>
                                <div className="flex items-center gap-2">
                                  <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                                    {vuln.location}
                                  </code>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleCopyCode(index, vuln.location)}
                                  >
                                    {copiedId === index ? (
                                      <Check className="h-3 w-3 text-green-500" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* File */}
                            {vuln.file && (
                              <div>
                                <h4 className="text-sm font-medium mb-2">File</h4>
                                <div className="flex items-center gap-2">
                                  <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                                    {vuln.file}
                                  </code>
                                  {vuln.file_type && (
                                    <Badge variant="outline" className="text-xs">{vuln.file_type}</Badge>
                                  )}
                                  {vuln.chunk && (
                                    <Badge variant="secondary" className="text-xs">Chunk: {vuln.chunk}</Badge>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Permission (for permission-related issues) */}
                            {vuln.permission && (
                              <div>
                                <h4 className="text-sm font-medium mb-2">Permission</h4>
                                <div className="flex items-center gap-2">
                                  <Key className="h-4 w-4 text-muted-foreground" />
                                  <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                                    {vuln.permission}
                                  </code>
                                </div>
                              </div>
                            )}

                            {/* CWE ID */}
                            {vuln.cwe_id && (
                              <div>
                                <h4 className="text-sm font-medium mb-2">CWE Reference</h4>
                                <Badge variant="outline">{vuln.cwe_id}</Badge>
                              </div>
                            )}

                            {/* Recommendation */}
                            {vuln.recommendation && (
                              <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-lg border border-primary/20">
                                <div className="flex items-start gap-3">
                                  <Lightbulb className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                  <div>
                                    <h3 className="font-semibold text-sm mb-1">Recommendation</h3>
                                    <p className="text-sm text-muted-foreground">
                                      {vuln.recommendation}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </>
                      )}
                    </Card>
                  );
                })}
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                Extension Permissions
              </CardTitle>
              <CardDescription>
                Permissions requested by this extension
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analysis.permissions && analysis.permissions.length > 0 ? (
                <div className="space-y-3">
                  {analysis.permissions.map((permission, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Lock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{permission}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No permissions declared</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Scan Details</CardTitle>
              <CardDescription>Technical details about this scan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-muted-foreground text-sm">Scan UUID</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm bg-muted px-3 py-2 rounded border flex-1 font-mono">
                        {analysis.scan_uuid}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText(analysis.scan_uuid);
                          setCopiedId(-1);
                          setTimeout(() => setCopiedId(null), 2000);
                        }}
                      >
                        {copiedId === -1 ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-muted-foreground text-sm">Extension File</label>
                    <p className="mt-1 truncate">{analysis.extension_file}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground text-sm">File Size</label>
                    <p className="mt-1">{formatFileSize(analysis.file_size)}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-muted-foreground text-sm">Internal ID</label>
                    <p className="mt-1">{analysis.id}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground text-sm">User ID</label>
                    <p className="mt-1">{analysis.user_id}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground text-sm">Project</label>
                    <p className="mt-1">{typeof analysis.project === 'object' ? `${analysis.project.project_name} (ID: ${analysis.project.id})` : analysis.project}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default withAuth(BrowserExtensionAnalysisDetailsPage);
