'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Heading, Paragraph } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import {
  FileText,
  ArrowRight,
  Plus,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  Calendar,
  Clock,
  Download,
  Eye,
  Sparkles,
  BarChart3,
  Shield,
  TrendingUp,
  Filter,
  Search,
  Grid3X3,
  List,
  ExternalLink
} from 'lucide-react';
import withAuth from '@/utils/withAuth';
import { getAccessTokenForAPI } from '@/utils/authUtils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Project {
  id: number;
  project_name: string;
  project_description: string;
  project_type: string;
  project_status: string;
  project_url: string;
  project_logo: string | null;
}

interface ReportData {
  id: number;
  report_uuid: string;
  report_url: string;
  created_at: string;
  updated_at: string;
  user_id: number;
  organization_id: number;
  project: Project;
}

const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [filteredReports, setFilteredReports] = useState<ReportData[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isProjectsLoading, setIsProjectsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // Filter and search functionality
  useEffect(() => {
    let filtered = reports;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(report =>
        report.project.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.project.project_type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType && filterType !== 'all') {
      filtered = filtered.filter(report => report.project.project_type === filterType);
    }

    setFilteredReports(filtered);
  }, [reports, searchQuery, filterType]);

  // Get unique project types for filter
  const projectTypes = Array.from(new Set(reports.map(report => report.project.project_type)));

  // Fetch reports data
  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/report/`, {
        headers: {
          'Authorization': `Bearer ${getAccessTokenForAPI()}`,
          'ngrok-skip-browser-warning': 'true',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch reports: ${response.status}`);
      }
      
      const data = await response.json();
      setReports(data);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load reports. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch projects for the form
  const fetchProjects = async () => {
    setIsProjectsLoading(true);
    setFormError(null);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/project/`, {
        headers: {
          'Authorization': `Bearer ${getAccessTokenForAPI()}`,
          'ngrok-skip-browser-warning': 'true',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.status}`);
      }
      
      const data = await response.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setFormError('Failed to load projects. Please try again.');
    } finally {
      setIsProjectsLoading(false);
    }
  };

  // Generate a report
  const generateReport = async () => {
    if (!selectedProjectId) {
      setFormError('Please select a project');
      return;
    }
    
    setIsGenerating(true);
    setFormError(null);
    setIsFormOpen(false);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/report/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessTokenForAPI()}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          project_id: selectedProjectId,
          organization_id: 1 // This should be dynamic in a real app
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate report: ${response.status}`);
      }
      
      await response.json();
      // Refresh the reports list after successful generation
      await fetchReports();
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchReports();
  }, []);

  // Get report file name from S3 URL
  const getReportName = (url: string) => {
    const parts = url.split('/');
    return parts[parts.length - 1].replace('_report.json', '');
  };

  // Calculate report statistics
  const reportStats = {
    total: reports.length,
    thisMonth: reports.filter(report => {
      const reportDate = new Date(report.created_at);
      const now = new Date();
      return reportDate.getMonth() === now.getMonth() && reportDate.getFullYear() === now.getFullYear();
    }).length,
    thisWeek: reports.filter(report => {
      const reportDate = new Date(report.created_at);
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return reportDate >= weekAgo;
    }).length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
                  <FileText className="h-7 w-7" />
                </div>
                <div>
                  <Heading size={1} className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Security Reports
                  </Heading>
                  <Paragraph className="text-muted-foreground text-lg">
                    Comprehensive security analysis and vulnerability reports
                  </Paragraph>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => {
                  fetchProjects();
                  setIsFormOpen(true);
                }}
                className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                disabled={isGenerating}
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Generate Report
                <Sparkles className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 shadow-md hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Reports</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{reportStats.total}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/30 shadow-md hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">This Month</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">{reportStats.thisMonth}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/30 shadow-md hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">This Week</p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{reportStats.thisWeek}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Search and Filter Section */}
        {reports.length > 0 && (
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                <Input
                  placeholder="Search reports by project name or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/80 backdrop-blur-sm border-primary/20 focus:border-primary/40 focus:bg-background"
                />
              </div>
              <div className="flex gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full sm:w-48 bg-background/80 backdrop-blur-sm border-primary/20 focus:border-primary/40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {projectTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* View Mode Toggle */}
                <div className="flex bg-background/80 backdrop-blur-sm border border-primary/20 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-8 w-8 p-0 transition-all duration-200"
                    title="Grid View"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className="h-8 w-8 p-0 transition-all duration-200"
                    title="Table View"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <Alert className="mb-6 border-destructive/20 bg-destructive/5" variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Report Generation Loading State */}
        {isGenerating && (
          <Card className="mb-8 border-0 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 shadow-lg">
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-primary/60 flex items-center justify-center">
                    <RefreshCcw className="h-8 w-8 text-primary-foreground animate-spin" />
                  </div>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-primary/60 animate-pulse opacity-20"></div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Generating Security Report</h3>
                  <p className="text-muted-foreground max-w-md">
                    Analyzing your project data and compiling comprehensive security findings. This may take a few moments.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <span>Processing security scan results...</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reports Display */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
              <p className="text-muted-foreground">Loading security reports...</p>
            </div>
          </div>
        ) : filteredReports.length === 0 ? (
          <Card className="border-0 bg-gradient-to-br from-muted/50 to-muted/30 shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="space-y-6">
                <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <FileText className="h-12 w-12 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold">
                    {searchQuery || filterType !== 'all' ? 'No reports match your criteria' : 'No reports found'}
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    {searchQuery || filterType !== 'all' 
                      ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
                      : 'Get started by generating your first comprehensive security report for any of your projects.'
                    }
                  </p>
                </div>
                {!searchQuery && filterType === 'all' && (
                  <Button 
                    onClick={() => {
                      fetchProjects();
                      setIsFormOpen(true);
                    }}
                    className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg hover:shadow-xl transition-all duration-300"
                    size="lg"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Generate Your First Report
                    <Sparkles className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <Card 
                key={report.id} 
                className="group border-0 bg-card/50 backdrop-blur-sm shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:bg-card/80 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <CardHeader className="relative pb-3">
                  <div className="flex justify-between items-start mb-3">
                    <Badge 
                      variant="secondary" 
                      className="bg-primary/10 text-primary border-primary/20 font-medium"
                    >
                      {report.project.project_type}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {new Date(report.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Heading size={3} className="text-lg font-semibold group-hover:text-primary transition-colors duration-200 line-clamp-1">
                      {report.project.project_name}
                    </Heading>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      <span>Security Report</span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="relative pb-4">
                  <div className="space-y-3">
                    <Paragraph className="text-sm text-muted-foreground line-clamp-2">
                      Comprehensive security analysis for {report.project.project_name}. 
                      Generated from vulnerability scans and security assessment data.
                    </Paragraph>
                    
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="font-mono text-xs text-muted-foreground truncate">
                        {getReportName(report.report_url)}
                      </span>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="relative pt-4">
                  <Link href={`/reports/${report.report_uuid}`} className="w-full">
                    <Button 
                      variant="default" 
                      className="w-full group-hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-md"
                      size="sm"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      <span>View Report</span>
                      <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          // Table View
          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-b bg-muted/30">
                    <TableHead className="font-semibold">Project</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">Created</TableHead>
                    <TableHead className="font-semibold">Report File</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => (
                    <TableRow 
                      key={report.id} 
                      className="border-b border-border/50 hover:bg-muted/20 transition-colors group"
                    >
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <Shield className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-semibold text-sm group-hover:text-primary transition-colors">
                              {report.project.project_name}
                            </div>
                            <div className="text-xs text-muted-foreground">Security Report</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge 
                          variant="secondary" 
                          className="bg-primary/10 text-primary border-primary/20 font-medium"
                        >
                          {report.project.project_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {new Date(report.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2 max-w-xs">
                          <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="font-mono text-xs text-muted-foreground truncate">
                            {getReportName(report.report_url)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="hover:bg-primary hover:text-primary-foreground transition-colors"
                          >
                            <a
                              href={report.report_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1"
                            >
                              <Download className="h-3 w-3" />
                              Download
                            </a>
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            asChild
                            className="bg-primary hover:bg-primary/90"
                          >
                            <Link href={`/reports/${report.report_uuid}`} className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              View
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Generate Report Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <DialogTitle className="text-xl">Generate Security Report</DialogTitle>
              </div>
            </DialogHeader>
            
            {formError && (
              <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label htmlFor="project" className="text-sm font-medium leading-none">
                  Select Project
                </label>
                {isProjectsLoading ? (
                  <div className="h-10 flex items-center pl-4 border rounded-md bg-muted/30">
                    <Loader2 className="h-4 w-4 text-primary animate-spin mr-2" />
                    <span className="text-muted-foreground text-sm">Loading projects...</span>
                  </div>
                ) : (
                  <Select
                    value={selectedProjectId?.toString() || ""}
                    onValueChange={(value) => setSelectedProjectId(parseInt(value))}
                  >
                    <SelectTrigger id="project" className="bg-background/50">
                      <SelectValue placeholder="Choose a project to analyze" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {project.project_type}
                            </Badge>
                            {project.project_name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Report Contents</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-primary rounded-full" />
                        Security vulnerabilities summary
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-primary rounded-full" />
                        Risk assessment and scoring
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-primary rounded-full" />
                        Detailed mitigation recommendations
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-primary rounded-full" />
                        Comprehensive scan findings
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter className="gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsFormOpen(false)}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button 
                onClick={generateReport}
                disabled={!selectedProjectId || isProjectsLoading}
                className="flex-1 sm:flex-none bg-gradient-to-r from-primary to-primary/90"
              >
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default withAuth(ReportsPage);