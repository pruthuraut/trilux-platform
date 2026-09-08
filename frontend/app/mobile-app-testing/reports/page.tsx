'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  Activity,
  Download,
  Eye,
  FileText,
  BarChart3,
  PieChart,
  TrendingUp,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Smartphone,
  Calendar,
  Target,
  RefreshCw,
  Plus,
  Filter,
  MoreVertical,
  Share2,
  Printer,
  Mail,
  Archive,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Users,
  Clock,
  Star
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function MobileAppTestingReports() {
  const [selectedPeriod, setSelectedPeriod] = useState('30days')

  // Mock analytics data
  const analyticsData = {
    totalAppsAnalyzed: 47,
    vulnerabilitiesFound: 142,
    averageRiskScore: 6.8,
    complianceRate: 73,
    criticalIssues: 8,
    highRiskApps: 12,
    platformDistribution: {
      android: 62,
      ios: 38
    },
    riskLevelDistribution: {
      critical: 8,
      high: 12,
      medium: 18,
      low: 9
    },
    monthlyTrends: [
      { month: 'Jan', apps: 12, vulnerabilities: 45 },
      { month: 'Feb', apps: 15, vulnerabilities: 38 },
      { month: 'Mar', apps: 20, vulnerabilities: 59 }
    ],
    topVulnerabilities: [
      { type: 'Insecure Data Storage', count: 23, severity: 'High' },
      { type: 'Weak Cryptography', count: 18, severity: 'Critical' },
      { type: 'Insecure Communication', count: 15, severity: 'Medium' },
      { type: 'Code Tampering', count: 12, severity: 'High' },
      { type: 'Reverse Engineering', count: 10, severity: 'Medium' }
    ]
  }

  const recentReports = [
    {
      id: 'RPT-001',
      title: 'Monthly Security Assessment - March 2024',
      type: 'Monthly Report',
      generatedDate: '2026-02-06',
      appsAnalyzed: 20,
      criticalFindings: 3,
      status: 'completed'
    },
    {
      id: 'RPT-002',
      title: 'Banking Apps Security Analysis',
      type: 'Custom Report',
      generatedDate: '2026-02-02',
      appsAnalyzed: 8,
      criticalFindings: 5,
      status: 'completed'
    },
    {
      id: 'RPT-003',
      title: 'Quarterly Compliance Report - Q1 2024',
      type: 'Compliance Report',
      generatedDate: '2026-01-28',
      appsAnalyzed: 35,
      criticalFindings: 2,
      status: 'completed'
    }
  ]

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BarChart3 className="h-7 w-7 text-primary" />
            </div>
            Mobile App Analysis Reports
          </h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and insights for mobile application security assessments
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Time Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Apps Analyzed</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalAppsAnalyzed}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-500" />
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vulnerabilities Found</CardTitle>
            <Shield className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{analyticsData.vulnerabilitiesFound}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <ArrowDownRight className="h-3 w-3 text-green-500" />
              -8% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Risk Score</CardTitle>
            <Target className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{analyticsData.averageRiskScore}/10</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3 text-orange-500" />
              +0.3 from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analyticsData.complianceRate}%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-500" />
              +5% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="reports">Generated Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Platform Distribution */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <PieChart className="h-5 w-5 text-primary" />
                  Platform Distribution
                </CardTitle>
                <CardDescription>Apps analyzed by operating system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                        <Smartphone className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Android</p>
                        <p className="text-sm text-muted-foreground">{Math.round(analyticsData.totalAppsAnalyzed * analyticsData.platformDistribution.android / 100)} apps</p>
                      </div>
                    </div>
                    <span className="text-xl font-bold">{analyticsData.platformDistribution.android}%</span>
                  </div>
                  <Progress value={analyticsData.platformDistribution.android} className="h-2.5" />

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                        <Smartphone className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">iOS</p>
                        <p className="text-sm text-muted-foreground">{Math.round(analyticsData.totalAppsAnalyzed * analyticsData.platformDistribution.ios / 100)} apps</p>
                      </div>
                    </div>
                    <span className="text-xl font-bold">{analyticsData.platformDistribution.ios}%</span>
                  </div>
                  <Progress value={analyticsData.platformDistribution.ios} className="h-2.5" />
                </div>
              </CardContent>
            </Card>

            {/* Risk Level Distribution */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Risk Level Distribution
                </CardTitle>
                <CardDescription>Applications categorized by risk severity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analyticsData.riskLevelDistribution).map(([level, count]) => (
                    <div key={level} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <Badge className={cn(
                              "font-semibold",
                              level === 'critical' ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200' :
                                level === 'high' ? 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200' :
                                  level === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200' :
                                    'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200'
                            )} variant="outline">
                              {level.toUpperCase()}
                            </Badge>
                          </div>
                          <span className="text-sm font-semibold">{count} apps</span>
                        </div>
                        <Progress
                          value={(count / analyticsData.totalAppsAnalyzed) * 100}
                          className={cn(
                            "h-2",
                            level === 'critical' ? '[&>div]:bg-red-500' :
                              level === 'high' ? '[&>div]:bg-orange-500' :
                                level === 'medium' ? '[&>div]:bg-yellow-500' :
                                  '[&>div]:bg-green-500'
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Critical Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-red-600">{analyticsData.criticalIssues}</div>
                  <AlertTriangle className="h-8 w-8 text-red-500 opacity-50" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Require immediate attention</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">High Risk Apps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-orange-600">{analyticsData.highRiskApps}</div>
                  <Zap className="h-8 w-8 text-orange-500 opacity-50" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Need security improvements</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Issues per App</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-blue-600">
                    {(analyticsData.vulnerabilitiesFound / analyticsData.totalAppsAnalyzed).toFixed(1)}
                  </div>
                  <Activity className="h-8 w-8 text-blue-500 opacity-50" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Vulnerabilities detected</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vulnerabilities" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Top Vulnerability Types
              </CardTitle>
              <CardDescription>Most common security issues found across analyzed applications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.topVulnerabilities.map((vuln, index) => (
                  <div key={index} className="relative p-4 border rounded-lg hover:border-primary/50 hover:shadow-md transition-all group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                            vuln.severity === 'Critical' ? 'bg-red-100 text-red-600 dark:bg-red-900/20' :
                              vuln.severity === 'High' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/20' :
                                'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20'
                          )}>
                            #{index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-base">{vuln.type}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={cn(
                                "text-xs",
                                vuln.severity === 'Critical' ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200' :
                                  vuln.severity === 'High' ? 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200' :
                                    'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200'
                              )} variant="outline">
                                {vuln.severity} Severity
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {((vuln.count / analyticsData.vulnerabilitiesFound) * 100).toFixed(1)}% of total
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Occurrence rate</span>
                            <span className="font-semibold">{vuln.count} instances</span>
                          </div>
                          <Progress value={(vuln.count / 25) * 100} className="h-2.5" />
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold">{vuln.count}</div>
                        <div className="text-xs text-muted-foreground mt-1">occurrences</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Monthly Analysis Trends
              </CardTitle>
              <CardDescription>Application analysis and vulnerability discovery trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.monthlyTrends.map((month, index) => (
                  <div key={index} className="p-5 border rounded-lg hover:border-primary/50 hover:shadow-md transition-all">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="text-xl font-bold">{month.month}</div>
                          <div className="text-sm text-muted-foreground">2024</div>
                        </div>
                      </div>

                      <div className="text-center md:text-left">
                        <div className="text-sm text-muted-foreground mb-1">Apps Analyzed</div>
                        <div className="flex items-center gap-2">
                          <div className="text-2xl font-bold text-blue-600">{month.apps}</div>
                          {index > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {month.apps > analyticsData.monthlyTrends[index - 1].apps ? (
                                <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                              ) : (
                                <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                              )}
                              {Math.abs(((month.apps - analyticsData.monthlyTrends[index - 1].apps) / analyticsData.monthlyTrends[index - 1].apps) * 100).toFixed(0)}%
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="text-center md:text-left">
                        <div className="text-sm text-muted-foreground mb-1">Vulnerabilities</div>
                        <div className="flex items-center gap-2">
                          <div className="text-2xl font-bold text-red-600">{month.vulnerabilities}</div>
                          {index > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {month.vulnerabilities > analyticsData.monthlyTrends[index - 1].vulnerabilities ? (
                                <ArrowUpRight className="h-3 w-3 text-red-500 mr-1" />
                              ) : (
                                <ArrowDownRight className="h-3 w-3 text-green-500 mr-1" />
                              )}
                              {Math.abs(((month.vulnerabilities - analyticsData.monthlyTrends[index - 1].vulnerabilities) / analyticsData.monthlyTrends[index - 1].vulnerabilities) * 100).toFixed(0)}%
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="text-center md:text-left">
                        <div className="text-sm text-muted-foreground mb-1">Avg. per App</div>
                        <div className="text-2xl font-bold text-orange-600">
                          {(month.vulnerabilities / month.apps).toFixed(1)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="space-y-4">
            {recentReports.map((report) => (
              <Card key={report.id} className="shadow-sm hover:shadow-md transition-all group">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-1">{report.title}</h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {report.type}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {report.id}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {new Date(report.generatedDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                        <div>
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Smartphone className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">Apps Covered</span>
                          </div>
                          <p className="text-xl font-bold">{report.appsAnalyzed}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">Critical Findings</span>
                          </div>
                          <p className="text-xl font-bold text-red-600">{report.criticalFindings}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Clock className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">Status</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium capitalize">{report.status}</span>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Target className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">Avg. Risk</span>
                          </div>
                          <p className="text-xl font-bold text-orange-600">
                            {(report.criticalFindings / report.appsAnalyzed * 10).toFixed(1)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Report
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share Report
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Printer className="h-4 w-4 mr-2" />
                          Print
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Mail className="h-4 w-4 mr-2" />
                          Email Report
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Star className="h-4 w-4 mr-2" />
                          Add to Favorites
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Report
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State or Load More */}
          {recentReports.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="p-4 bg-muted/50 rounded-full mb-4">
                  <FileText className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No reports generated yet</h3>
                <p className="text-muted-foreground text-center max-w-sm mb-6">
                  Generate your first security assessment report to get started with comprehensive analytics.
                </p>
                <Button>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate First Report
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
