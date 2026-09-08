'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ClientOnly from "@/components/ui/client-only";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  GitPullRequest,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Bug,
  Zap,
  Users,
  Calendar,
  AlertTriangle,
  Target,
  Activity
} from "lucide-react";

// Mock data for analytics
const weeklyData = [
  { name: 'Mon', prs: 12, approved: 8, rejected: 2, pending: 2 },
  { name: 'Tue', prs: 15, approved: 11, rejected: 3, pending: 1 },
  { name: 'Wed', prs: 18, approved: 14, rejected: 2, pending: 2 },
  { name: 'Thu', prs: 22, approved: 16, rejected: 4, pending: 2 },
  { name: 'Fri', prs: 19, approved: 15, rejected: 3, pending: 1 },
  { name: 'Sat', prs: 8, approved: 6, rejected: 1, pending: 1 },
  { name: 'Sun', prs: 5, approved: 4, rejected: 0, pending: 1 }
];

const qualityTrends = [
  { month: 'Jan', quality: 82, security: 88, performance: 79 },
  { month: 'Feb', quality: 85, security: 90, performance: 82 },
  { month: 'Mar', quality: 87, security: 89, performance: 85 },
  { month: 'Apr', quality: 89, security: 92, performance: 87 },
  { month: 'May', quality: 91, security: 94, performance: 89 },
  { month: 'Jun', quality: 88, security: 91, performance: 86 }
];

const issueDistribution = [
  { name: 'Security', value: 35, color: '#ef4444' },
  { name: 'Quality', value: 28, color: '#f59e0b' },
  { name: 'Performance', value: 20, color: '#3b82f6' },
  { name: 'Best Practices', value: 17, color: '#10b981' }
];

const repositoryStats = [
  { repo: 'trilux-core', prs: 45, avgTime: 8.2, successRate: 94 },
  { repo: 'trilux-ui', prs: 32, avgTime: 6.5, successRate: 97 },
  { repo: 'trilux-auth', prs: 28, avgTime: 12.1, successRate: 89 },
  { repo: 'trilux-api', prs: 38, avgTime: 9.8, successRate: 92 },
  { repo: 'trilux-docs', prs: 15, avgTime: 4.2, successRate: 98 }
];

const topContributors = [
  { name: 'Alice Johnson', prs: 23, approved: 21, rejected: 2, avgScore: 92 },
  { name: 'Bob Smith', prs: 18, approved: 16, rejected: 2, avgScore: 89 },
  { name: 'Carol Davis', prs: 15, approved: 14, rejected: 1, avgScore: 94 },
  { name: 'David Wilson', prs: 12, approved: 10, rejected: 2, avgScore: 87 },
  { name: 'Eva Brown', prs: 10, approved: 9, rejected: 1, avgScore: 91 }
];

export default function PRAnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d');

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PR Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into pull request review performance and trends
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total PRs Reviewed</CardTitle>
            <GitPullRequest className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87.3%</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +2.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Review Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8.4m</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingDown className="h-3 w-3 mr-1 text-green-500" />
              -1.2m from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">91.2</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +3.4 from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="quality">Quality Trends</TabsTrigger>
          <TabsTrigger value="issues">Issue Analysis</TabsTrigger>
          <TabsTrigger value="repositories">Repositories</TabsTrigger>
          <TabsTrigger value="contributors">Contributors</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Weekly Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly PR Activity</CardTitle>
              <CardDescription>
                Pull request submissions and review outcomes over the past week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClientOnly fallback={<div className="w-full h-[300px] bg-muted rounded-md animate-pulse" />}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="approved" stackId="a" fill="#10b981" name="Approved" />
                    <Bar dataKey="rejected" stackId="a" fill="#ef4444" name="Rejected" />
                    <Bar dataKey="pending" stackId="a" fill="#f59e0b" name="Pending" />
                  </BarChart>
                </ResponsiveContainer>
              </ClientOnly>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Review Performance</CardTitle>
                <CardDescription>AI agent efficiency metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Accuracy Rate</span>
                    <span>94.2%</span>
                  </div>
                  <Progress value={94.2} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Processing Speed</span>
                    <span>87.8%</span>
                  </div>
                  <Progress value={87.8} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Issue Detection</span>
                    <span>91.5%</span>
                  </div>
                  <Progress value={91.5} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weekly Summary</CardTitle>
                <CardDescription>Key highlights from this week</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">99 PRs approved automatically</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">15 PRs flagged for manual review</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm">8 PRs rejected due to security issues</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Average analysis time: 8.4 minutes</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quality Trends Over Time</CardTitle>
              <CardDescription>
                Track improvement in code quality, security, and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClientOnly fallback={<div className="w-full h-[300px] bg-muted rounded-md animate-pulse" />}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={qualityTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[70, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="quality" stroke="#3b82f6" strokeWidth={2} name="Quality Score" />
                    <Line type="monotone" dataKey="security" stroke="#10b981" strokeWidth={2} name="Security Score" />
                    <Line type="monotone" dataKey="performance" stroke="#f59e0b" strokeWidth={2} name="Performance Score" />
                  </LineChart>
                </ResponsiveContainer>
              </ClientOnly>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Issue Distribution</CardTitle>
                <CardDescription>
                  Types of issues found during PR reviews
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ClientOnly fallback={<div className="w-full h-[250px] bg-muted rounded-md animate-pulse" />}>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={issueDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {issueDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </ClientOnly>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Issues Found</CardTitle>
                <CardDescription>Most common issues in recent PRs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Hardcoded secrets</span>
                    <Badge variant="destructive">Critical</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">SQL injection vulnerabilities</span>
                    <Badge variant="destructive">Critical</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Missing input validation</span>
                    <Badge className="bg-orange-500">High</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Inefficient database queries</span>
                    <Badge className="bg-yellow-500">Medium</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Missing error handling</span>
                    <Badge className="bg-yellow-500">Medium</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="repositories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Repository Performance</CardTitle>
              <CardDescription>
                PR review statistics by repository
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {repositoryStats.map((repo, index) => (
                  <div key={index} className="grid grid-cols-4 gap-4 items-center p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{repo.repo}</div>
                      <div className="text-sm text-muted-foreground">{repo.prs} PRs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{repo.avgTime}m</div>
                      <div className="text-xs text-muted-foreground">Avg Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{repo.successRate}%</div>
                      <div className="text-xs text-muted-foreground">Success Rate</div>
                    </div>
                    <div>
                      <Progress value={repo.successRate} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contributors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Contributors</CardTitle>
              <CardDescription>
                Most active contributors and their review success rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topContributors.map((contributor, index) => (
                  <div key={index} className="grid grid-cols-5 gap-4 items-center p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{contributor.name}</div>
                      <div className="text-sm text-muted-foreground">#{index + 1}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{contributor.prs}</div>
                      <div className="text-xs text-muted-foreground">Total PRs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{contributor.approved}</div>
                      <div className="text-xs text-muted-foreground">Approved</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">{contributor.rejected}</div>
                      <div className="text-xs text-muted-foreground">Rejected</div>
                    </div>
                    <div>
                      <div className="text-right font-bold">{contributor.avgScore}</div>
                      <Progress value={contributor.avgScore} className="h-2 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
