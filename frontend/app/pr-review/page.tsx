'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  GitPullRequest,
  GitMerge,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Github,
  Shield,
  Zap,
  Brain,
  Code,
  Bug,
  Lock,
  Users,
  Calendar,
  ArrowRight,
  ExternalLink,
  PlayCircle,
  PauseCircle,
  Settings
} from "lucide-react";

interface PullRequest {
  id: string;
  number: number;
  title: string;
  description: string;
  author: {
    name: string;
    avatar: string;
  };
  repository: string;
  branch: {
    source: string;
    target: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'analyzing' | 'needs_changes';
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'feature' | 'bugfix' | 'hotfix' | 'docs' | 'refactor';
  createdAt: string;
  updatedAt: string;
  filesChanged: number;
  linesAdded: number;
  linesDeleted: number;
  reviewScore: number;
  securityScore: number;
  qualityScore: number;
  analysisResults: {
    intent: string;
    fulfillsRequirement: boolean;
    issues: Array<{
      type: 'security' | 'quality' | 'performance' | 'best-practices';
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      file?: string;
      line?: number;
      suggestion?: string;
    }>;
    recommendations: string[];
    allowMerge: boolean;
  };
}

// Mock data for demonstration
const mockPRs: PullRequest[] = [
  {
    id: '1',
    number: 123,
    title: 'Add user authentication system',
    description: 'Implement JWT-based authentication with role-based access control',
    author: { name: 'John Doe', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face' },
    repository: 'trilux-app',
    branch: { source: 'feature/auth-system', target: 'main' },
    status: 'analyzing',
    priority: 'high',
    type: 'feature',
    createdAt: '2026-02-05T10:30:00Z',
    updatedAt: '2026-02-05T11:15:00Z',
    filesChanged: 12,
    linesAdded: 450,
    linesDeleted: 23,
    reviewScore: 85,
    securityScore: 92,
    qualityScore: 88,
    analysisResults: {
      intent: 'Add comprehensive authentication system with JWT tokens and RBAC',
      fulfillsRequirement: true,
      issues: [
        {
          type: 'security',
          severity: 'medium',
          message: 'JWT secret should be stored in environment variables',
          file: 'auth/jwt.ts',
          line: 15,
          suggestion: 'Move JWT_SECRET to .env file and use process.env.JWT_SECRET'
        }
      ],
      recommendations: [
        'Add rate limiting for authentication endpoints',
        'Implement password strength validation',
        'Add audit logging for authentication events'
      ],
      allowMerge: false
    }
  },
  {
    id: '2',
    number: 124,
    title: 'Fix memory leak in data processing',
    description: 'Resolve memory leak causing performance degradation in large datasets',
    author: { name: 'Jane Smith', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face' },
    repository: 'trilux-core',
    branch: { source: 'bugfix/memory-leak', target: 'develop' },
    status: 'approved',
    priority: 'critical',
    type: 'bugfix',
    createdAt: '2026-01-30T09:00:00Z',
    updatedAt: '2026-01-30T10:45:00Z',
    filesChanged: 3,
    linesAdded: 45,
    linesDeleted: 78,
    reviewScore: 95,
    securityScore: 98,
    qualityScore: 94,
    analysisResults: {
      intent: 'Fix critical memory leak in data processing pipeline',
      fulfillsRequirement: true,
      issues: [],
      recommendations: [
        'Add memory usage monitoring',
        'Implement garbage collection optimization'
      ],
      allowMerge: true
    }
  }
];

export default function PRReviewPage() {
  const [prs, setPRs] = useState<PullRequest[]>(mockPRs);
  const [filteredPRs, setFilteredPRs] = useState<PullRequest[]>(mockPRs);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedPR, setSelectedPR] = useState<PullRequest | null>(null);

  // Filter PRs based on search and filters
  useEffect(() => {
    let filtered = prs;

    if (searchTerm) {
      filtered = filtered.filter(pr =>
        pr.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pr.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pr.author.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(pr => pr.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(pr => pr.priority === priorityFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(pr => pr.type === typeFilter);
    }

    setFilteredPRs(filtered);
  }, [prs, searchTerm, statusFilter, priorityFilter, typeFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'analyzing': return 'bg-blue-500';
      case 'needs_changes': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const handleAnalyzePR = async (prId: string) => {
    setIsAnalyzing(true);
    // Simulate AI analysis
    setTimeout(() => {
      setPRs(prev => prev.map(pr =>
        pr.id === prId
          ? { ...pr, status: 'analyzing' as const }
          : pr
      ));
      setIsAnalyzing(false);
    }, 2000);
  };

  const handleApprovePR = (prId: string) => {
    setPRs(prev => prev.map(pr =>
      pr.id === prId
        ? { ...pr, status: 'approved' as const }
        : pr
    ));
  };

  const handleRejectPR = (prId: string) => {
    setPRs(prev => prev.map(pr =>
      pr.id === prId
        ? { ...pr, status: 'rejected' as const }
        : pr
    ));
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PR Review Agent</h1>
          <p className="text-muted-foreground">
            Autonomous pull request analysis and security review system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Github className="h-4 w-4 mr-2" />
            Connect Repository
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active PRs</CardTitle>
            <GitPullRequest className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prs.length}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prs.filter(pr => pr.status === 'approved').length}</div>
            <p className="text-xs text-muted-foreground">
              Ready for merge
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analyzing</CardTitle>
            <Brain className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prs.filter(pr => pr.status === 'analyzing').length}</div>
            <p className="text-xs text-muted-foreground">
              AI review in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {prs.reduce((acc, pr) => acc + pr.analysisResults.issues.filter(issue => issue.severity === 'critical').length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search PRs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="analyzing">Analyzing</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="needs_changes">Needs Changes</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="feature">Feature</SelectItem>
                <SelectItem value="bugfix">Bug Fix</SelectItem>
                <SelectItem value="hotfix">Hotfix</SelectItem>
                <SelectItem value="docs">Documentation</SelectItem>
                <SelectItem value="refactor">Refactor</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setPriorityFilter('all');
              setTypeFilter('all');
            }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* PR List */}
      <div className="space-y-4">
        {filteredPRs.map((pr) => (
          <Card key={pr.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">#{pr.number}</Badge>
                    <Badge className={`${getStatusColor(pr.status)} text-white`}>
                      {pr.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <Badge className={`${getPriorityColor(pr.priority)} text-white`}>
                      {pr.priority.toUpperCase()}
                    </Badge>
                    <Badge variant="secondary">{pr.type}</Badge>
                  </div>
                  <CardTitle className="text-lg">{pr.title}</CardTitle>
                  <CardDescription>{pr.description}</CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <Image
                      src={pr.author.avatar}
                      alt={pr.author.name}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                    <span className="text-sm text-muted-foreground">{pr.author.name}</span>
                  </div>
                  <div className="flex gap-1">
                    {pr.status === 'analyzing' ? (
                      <Button size="sm" disabled>
                        <Brain className="h-4 w-4 mr-2 animate-pulse" />
                        Analyzing...
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAnalyzePR(pr.id)}
                          disabled={isAnalyzing}
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          Re-analyze
                        </Button>
                        {pr.analysisResults.allowMerge ? (
                          <Button
                            size="sm"
                            onClick={() => handleApprovePR(pr.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectPR(pr.id)}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Branch Info */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Code className="h-4 w-4" />
                  <span>{pr.branch.source}</span>
                  <ArrowRight className="h-3 w-3" />
                  <span>{pr.branch.target}</span>
                  <span className="ml-4">📁 {pr.repository}</span>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 text-sm">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    +{pr.linesAdded}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    -{pr.linesDeleted}
                  </span>
                  <span>{pr.filesChanged} files changed</span>
                </div>

                {/* Scores */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Quality</span>
                      <span>{pr.qualityScore}%</span>
                    </div>
                    <Progress value={pr.qualityScore} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Security</span>
                      <span>{pr.securityScore}%</span>
                    </div>
                    <Progress value={pr.securityScore} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Review</span>
                      <span>{pr.reviewScore}%</span>
                    </div>
                    <Progress value={pr.reviewScore} className="h-2" />
                  </div>
                </div>

                {/* Analysis Results */}
                {pr.analysisResults.issues.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Issues Found</AlertTitle>
                    <AlertDescription>
                      <ul className="mt-2 space-y-1">
                        {pr.analysisResults.issues.slice(0, 2).map((issue, index) => (
                          <li key={index} className="text-sm">
                            <Badge variant="destructive" className="mr-2">{issue.severity}</Badge>
                            {issue.message}
                          </li>
                        ))}
                        {pr.analysisResults.issues.length > 2 && (
                          <li className="text-sm text-muted-foreground">
                            +{pr.analysisResults.issues.length - 2} more issues
                          </li>
                        )}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Intent Analysis */}
                <div className="bg-muted p-3 rounded-lg">
                  <div className="text-sm font-medium mb-1">AI Intent Analysis:</div>
                  <div className="text-sm text-muted-foreground">{pr.analysisResults.intent}</div>
                  <div className="mt-2 flex items-center gap-2">
                    {pr.analysisResults.fulfillsRequirement ? (
                      <Badge className="bg-green-600">Fulfills Requirement</Badge>
                    ) : (
                      <Badge variant="destructive">Does Not Fulfill Requirement</Badge>
                    )}
                  </div>
                </div>

                {/* Timestamps */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Created {new Date(pr.createdAt).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Updated {new Date(pr.updatedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPRs.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <GitPullRequest className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Pull Requests Found</h3>
            <p className="text-muted-foreground">
              No pull requests match your current filters. Try adjusting your search criteria.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
