"use client";

import { useState, useEffect, SetStateAction, AwaitedReactNode, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from "react";
import { X, Plus, Scan, RefreshCw, AlertTriangle, CheckCircle, Clock, Activity } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import DynamicLLMModelAdd from "@/components/DynamicLLMModelAdd";
import StaticLLMModelAdd from "@/components/StaticLLMModelAdd";
import withAuth from '@/utils/withAuth';
import { getAccessTokenForAPI } from '@/utils/authUtils';

function AnalysisPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showScanTypeDialog, setShowScanTypeDialog] = useState(false);
  const [showScanFormDialog, setShowScanFormDialog] = useState(false);
  const [scanType, setScanType] = useState<string | null>(null);
  // Define the Project type to fix type error
  interface Project {
    id: string | number;
    project_name: string;
    project_description: string;
    project_type: string;
    project_status: string;
    project_url: string;
    created_at: string;
    static_analyses?: any[];
    dynamic_analyses?: any[];
  }

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  // Fetch data from API
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/analyses/`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessTokenForAPI()}`,
          'ngrok-skip-browser-warning': 'true',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const data = await response.json();
      // If the API returns a single project, wrap it in an array
      const projectsArray = Array.isArray(data) ? data : [data];
      setProjects(projectsArray);
    } catch (err: unknown) {
      console.error('Error fetching projects:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddScan = (type: string) => {
    setScanType(type);
    setShowScanTypeDialog(false);
    setShowScanFormDialog(true);
  };

  const handleFormSubmit = () => {
    setShowScanFormDialog(false);
    // After form submission, refresh the data
    fetchProjects();
  };

  const handleViewAnalysis = (projectId: any) => {
    // Implementation for viewing analysis
    const project = projects.find(p => p.id === projectId);
    setSelectedProject(project);
  };

  // Get all analyses from all projects
  const getAllAnalyses = () => {
    const allAnalyses: any[] = [];

    projects.forEach(project => {
      // Add static analyses
      project.static_analyses?.forEach((analysis: { static_analysis_status: any; static_analysis_type: any; source_url: any; created_at: any; }) => {
        allAnalyses.push({
          ...analysis,
          projectName: project.project_name,
          analysisType: 'static',
          status: analysis.static_analysis_status,
          type: analysis.static_analysis_type,
          url: analysis.source_url,
          date: analysis.created_at
        });
      });

      // Add dynamic analyses
      project.dynamic_analyses?.forEach((analysis: { dynamic_analysis_status: any; dynamic_analysis_type: any; source_url: any; created_at: any; }) => {
        allAnalyses.push({
          ...analysis,
          projectName: project.project_name,
          analysisType: 'dynamic',
          status: analysis.dynamic_analysis_status,
          type: analysis.dynamic_analysis_type,
          url: analysis.source_url,
          date: analysis.created_at
        });
      });
    });

    return allAnalyses;
  };

  const getFilteredAnalyses = () => {
    const allAnalyses = getAllAnalyses();

    if (activeTab === 'all') return allAnalyses;
    if (activeTab === 'static') return allAnalyses.filter(a => a.analysisType === 'static');
    if (activeTab === 'dynamic') return allAnalyses.filter(a => a.analysisType === 'dynamic');
    if (activeTab === 'waiting') return allAnalyses.filter(a => a.status === 'Waiting');
    if (activeTab === 'completed') return allAnalyses.filter(a => a.status === 'Completed');

    return allAnalyses;
  };

  const getStatusIcon = (status: any) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Waiting':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'In Progress':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'Failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: any) => {
    switch (status) {
      case 'Completed':
        return "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-200";
      case 'Waiting':
        return "bg-amber-100 text-amber-800 dark:bg-amber-800/20 dark:text-amber-200";
      case 'In Progress':
        return "bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-200";
      case 'Failed':
        return "bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-200";
    }
  };

  const formatDate = (dateString: string | number | Date) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
              Security Analysis Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">Manage and monitor your security scans across all projects</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => fetchProjects()}
              variant="outline"
              className="flex items-center gap-2 hover:bg-accent/50 transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              onClick={() => setShowScanTypeDialog(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-6 py-3 dark:from-blue-800 dark:to-purple-800 dark:hover:from-blue-900 dark:hover:to-purple-900"
            >
              <Plus className="mr-2 h-5 w-5" />
              New Analysis
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : error ? (
          <Card className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Error Loading Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{error}</p>
              <Button
                onClick={fetchProjects}
                variant="outline"
                className="mt-4"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Project Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Total Projects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{projects.length}</div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">Active security projects</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-2">
                    <Scan className="h-5 w-5" />
                    Static Analyses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                    {projects.reduce((total, project) => total + (project.static_analyses?.length || 0), 0)}
                  </div>
                  <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">Code inspections completed</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-green-700 dark:text-green-300 flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Dynamic Analyses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                    {projects.reduce((total, project) => total + (project.dynamic_analyses?.length || 0), 0)}
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">Runtime scans performed</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/50 hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Waiting Analyses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                    {getAllAnalyses().filter(a => a.status === 'Waiting').length}
                  </div>
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">Pending execution</p>
                </CardContent>
              </Card>
            </div>

            {/* Analysis Tabs and Table */}
            <div className="bg-white dark:bg-card rounded-2xl shadow-lg border-0 overflow-hidden">
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-6 border-b">
                  <TabsList className="grid grid-cols-5 bg-white/80 dark:bg-card/80 backdrop-blur-sm shadow-md rounded-xl h-12">
                    <TabsTrigger
                      value="all"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-200 rounded-lg font-medium"
                    >
                      All Analyses
                    </TabsTrigger>
                    <TabsTrigger
                      value="static"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-200 rounded-lg font-medium"
                    >
                      Static
                    </TabsTrigger>
                    <TabsTrigger
                      value="dynamic"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-teal-600 data-[state=active]:text-white transition-all duration-200 rounded-lg font-medium"
                    >
                      Dynamic
                    </TabsTrigger>
                    <TabsTrigger
                      value="waiting"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-orange-600 data-[state=active]:text-white transition-all duration-200 rounded-lg font-medium"
                    >
                      Waiting
                    </TabsTrigger>
                    <TabsTrigger
                      value="completed"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-green-600 data-[state=active]:text-white transition-all duration-200 rounded-lg font-medium"
                    >
                      Completed
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value={activeTab} className="mt-0 p-0">
                  <div className="overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gradient-to-r from-accent/30 to-accent/10">
                        <TableRow className="border-b-0">
                          <TableHead className="font-semibold text-foreground/80 py-4">Project</TableHead>
                          <TableHead className="font-semibold text-foreground/80 py-4">Type</TableHead>
                          <TableHead className="font-semibold text-foreground/80 py-4">URL/Source</TableHead>
                          <TableHead className="font-semibold text-foreground/80 py-4">Status</TableHead>
                          <TableHead className="font-semibold text-foreground/80 py-4">Created</TableHead>
                          <TableHead className="font-semibold text-foreground/80 py-4 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getFilteredAnalyses().length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              No analyses found in this category
                            </TableCell>
                          </TableRow>
                        ) : (
                          getFilteredAnalyses().map((analysis) => (
                            <TableRow key={`${analysis.analysisType}-${analysis.id}`} className="hover:bg-accent/50">
                              <TableCell className="font-medium">{analysis.projectName}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {analysis.type}
                                  <span className="ml-1 text-xs">({analysis.analysisType})</span>
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-xs truncate">{analysis.url}</TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm ${getStatusColor(analysis.status)}`}>
                                  {getStatusIcon(analysis.status)}
                                  {analysis.status}
                                </span>
                              </TableCell>
                              <TableCell>{formatDate(analysis.date)}</TableCell>
                              <TableCell className="text-right">
                                {analysis.status === "Completed" ? (
                                  <Button
                                    onClick={() => handleViewAnalysis(analysis.project.id)}
                                    variant="ghost"
                                    className="text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                                  >
                                    View Report
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    className="text-gray-500"
                                    disabled
                                  >
                                    Pending
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}

        {/* Scan Type Selection Dialog */}
        <AlertDialog open={showScanTypeDialog} onOpenChange={setShowScanTypeDialog}>
          <AlertDialogContent className="rounded-xl max-w-md bg-card border border-border">
            <AlertDialogHeader className="pt-6 px-6">
              <AlertDialogTitle className="text-xl text-center">
                Select Analysis Type
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center text-muted-foreground">
                Choose the type of security analysis you want to perform
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="p-6 space-y-4">
              <Button
                onClick={() => handleAddScan("dynamic")}
                className="w-full h-24 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-xl flex flex-col items-center justify-center dark:bg-blue-900/20 dark:border-blue-800/50 dark:hover:bg-blue-900/30"
              >
                <Scan className="h-6 w-6 text-blue-600 mb-2 dark:text-blue-400" />
                <span className="text-blue-800 font-semibold dark:text-blue-200">Dynamic Analysis</span>
                <p className="text-sm text-blue-600 font-normal mt-1 dark:text-blue-300">
                  Real-time vulnerability scanning
                </p>
              </Button>

              <Button
                onClick={() => handleAddScan("static")}
                className="w-full h-24 bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 rounded-xl flex flex-col items-center justify-center dark:bg-purple-900/20 dark:border-purple-800/50 dark:hover:bg-purple-900/30"
              >
                <Scan className="h-6 w-6 text-purple-600 mb-2 dark:text-purple-400" />
                <span className="text-purple-800 font-semibold dark:text-purple-200">Static Analysis</span>
                <p className="text-sm text-purple-600 font-normal mt-1 dark:text-purple-300">
                  Code-level security inspection
                </p>
              </Button>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        {/* Scan Form Dialog */}
        <AlertDialog open={showScanFormDialog} onOpenChange={setShowScanFormDialog}>
          <AlertDialogContent className="rounded-xl max-w-2xl bg-card border border-border p-0">
            <div className="p-6">
              {scanType === "dynamic" ? (
                <DynamicLLMModelAdd />
              ) : (
                <StaticLLMModelAdd />
              )}
            </div>
          </AlertDialogContent>
        </AlertDialog>

        {/* Project Detail Dialog */}
        {selectedProject && (
          <AlertDialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
            <AlertDialogContent className="rounded-xl max-w-4xl bg-card border border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl">
                  {selectedProject.project_name}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {selectedProject.project_description}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Project Type</p>
                    <p className="font-medium">{selectedProject.project_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium">{selectedProject.project_status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">URL</p>
                    <p className="font-medium">{selectedProject.project_url}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">{formatDate(selectedProject.created_at)}</p>
                  </div>
                </div>

                <Tabs defaultValue="static" className="w-full">
                  <TabsList>
                    <TabsTrigger value="static">Static Analyses ({selectedProject.static_analyses?.length || 0})</TabsTrigger>
                    <TabsTrigger value="dynamic">Dynamic Analyses ({selectedProject.dynamic_analyses?.length || 0})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="static">
                    {selectedProject.static_analyses?.length ? (
                      <Table>
                        <TableHeader className="bg-accent">
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>URL</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedProject.static_analyses.map((analysis: { id: Key | null | undefined; static_analysis_type: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined; source_url: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined; static_analysis_status: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined; created_at: any; }) => (
                            <TableRow key={analysis.id}>
                              <TableCell>{analysis.static_analysis_type}</TableCell>
                              <TableCell>{analysis.source_url}</TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm ${getStatusColor(analysis.static_analysis_status)}`}>
                                  {getStatusIcon(analysis.static_analysis_status)}
                                  {analysis.static_analysis_status}
                                </span>
                              </TableCell>
                              <TableCell>{formatDate(analysis.created_at)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No static analyses for this project
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="dynamic">
                    {selectedProject.dynamic_analyses?.length ? (
                      <Table>
                        <TableHeader className="bg-accent">
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>URL</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedProject.dynamic_analyses.map((analysis: { id: Key | null | undefined; dynamic_analysis_type: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined; source_url: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined; dynamic_analysis_status: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined; created_at: any; }) => (
                            <TableRow key={analysis.id}>
                              <TableCell>{analysis.dynamic_analysis_type}</TableCell>
                              <TableCell>{analysis.source_url}</TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm ${getStatusColor(analysis.dynamic_analysis_status)}`}>
                                  {getStatusIcon(analysis.dynamic_analysis_status)}
                                  {analysis.dynamic_analysis_status}
                                </span>
                              </TableCell>
                              <TableCell>{formatDate(analysis.created_at)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No dynamic analyses for this project
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
              <AlertDialogFooter>
                <AlertDialogAction onClick={() => setSelectedProject(null)}>
                  Close
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}

export default withAuth(AnalysisPage);