'use client'

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Activity,
  Download,
  Eye,
  FileText,
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Globe,
  Calendar,
  Target,
  Zap,
  Clock,
  Filter,
  Search,
  RefreshCw,
  Settings,
  Share2,
  Archive,
  MoreVertical,
  LineChart,
  Database,
  Server,
  Users,
  Bug,
  Gauge,
  Timer,
  AlertCircle,
  Info,
  Plus,
  ExternalLink,
  Copy,
  Star,
  Bookmark,
  Mail
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function ApiTestingReports() {
  const [selectedPeriod, setSelectedPeriod] = useState('30days')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Enhanced mock analytics data
  const analyticsData = {
    totalApisAnalyzed: 73,
    vulnerabilitiesFound: 89,
    averageResponseTime: 245,
    averageSecurityScore: 78,
    criticalIssues: 5,
    highRiskApis: 18,
    totalTestsRun: 1247,
    successRate: 94.2,
    methodDistribution: {
      GET: 35,
      POST: 28,
      PUT: 20,
      DELETE: 12,
      PATCH: 5
    },
    riskLevelDistribution: {
      critical: 5,
      high: 18,
      medium: 32,
      low: 18
    },
    monthlyTrends: [
      { month: 'Oct', apis: 18, vulnerabilities: 22, avgScore: 72, tests: 890 },
      { month: 'Nov', apis: 22, vulnerabilities: 28, avgScore: 76, tests: 1050 },
      { month: 'Dec', apis: 25, vulnerabilities: 31, avgScore: 78, tests: 1180 },
      { month: 'Jan', apis: 26, vulnerabilities: 30, avgScore: 80, tests: 1247 }
    ],
    topVulnerabilities: [
      { type: 'Authentication Bypass', count: 15, severity: 'Critical', trend: 'up', impact: 'High' },
      { type: 'SQL Injection', count: 12, severity: 'High', trend: 'down', impact: 'High' },
      { type: 'Cross-Site Scripting (XSS)', count: 11, severity: 'Medium', trend: 'stable', impact: 'Medium' },
      { type: 'Insecure Direct Object Reference', count: 9, severity: 'High', trend: 'up', impact: 'High' },
      { type: 'Security Misconfiguration', count: 8, severity: 'Medium', trend: 'down', impact: 'Medium' }
    ],
    performanceMetrics: {
      averageResponseTime: 245,
      slowestEndpoint: 'POST /api/reports/generate',
      fastestEndpoint: 'GET /api/users',
      timeoutRate: 3.2,
      errorRate: 1.8,
      p95ResponseTime: 890,
      uptime: 99.7
    },
    complianceMetrics: {
      owasp: 82,
      gdpr: 95,
      sox: 88,
      pci: 91
    }
  }

  const getMethodColor = (method: string) => {
    const variants = {
      GET: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
      POST: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
      PUT: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
      DELETE: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
      PATCH: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800'
    }
    return variants[method as keyof typeof variants] || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  const getRiskColor = (risk: string) => {
    const variants = {
      critical: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
      high: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
      medium: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800',
      low: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800'
    }
    return variants[risk as keyof typeof variants] || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-3 h-3 text-red-500" />
      case 'down': return <TrendingDown className="w-3 h-3 text-green-500" />
      default: return <div className="w-3 h-3 bg-gray-400 rounded-full" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    if (score >= 40) return 'text-orange-600 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400'
  }

  const filteredReports = useMemo(() => {
    const recentReports = [
      {
        id: 'API-RPT-001',
        title: 'Monthly API Security Assessment - January 2024',
        type: 'Monthly Report',
        generatedDate: '2026-02-06',
        apisAnalyzed: 26,
        criticalFindings: 2,
        status: 'completed',
        size: '2.4 MB',
        downloads: 12,
        category: 'security',
        priority: 'high'
      },
      {
        id: 'API-RPT-002',
        title: 'Payment Gateway Security Analysis',
        type: 'Custom Report',
        generatedDate: '2026-02-01',
        apisAnalyzed: 12,
        criticalFindings: 3,
        status: 'completed',
        size: '1.8 MB',
        downloads: 8,
        category: 'security',
        priority: 'critical'
      },
      {
        id: 'API-RPT-003',
        title: 'Quarterly API Compliance Report - Q4 2023',
        type: 'Compliance Report',
        generatedDate: '2026-01-28',
        apisAnalyzed: 58,
        criticalFindings: 1,
        status: 'completed',
        size: '4.2 MB',
        downloads: 25,
        category: 'compliance',
        priority: 'medium'
      },
      {
        id: 'API-RPT-004',
        title: 'API Performance Benchmark Analysis',
        type: 'Performance Report',
        generatedDate: '2026-01-25',
        apisAnalyzed: 35,
        criticalFindings: 0,
        status: 'processing',
        size: '3.1 MB',
        downloads: 0,
        category: 'performance',
        priority: 'low'
      }
    ]

    return recentReports.filter(report =>
      selectedCategory === 'all' || report.category === selectedCategory
    )
  }, [selectedCategory])

  return (
    <div className="w-full max-w-full overflow-hidden min-h-screen bg-background">
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Enhanced Header */}
        <div className="w-full border border-border/50 rounded-xl bg-card/80 backdrop-blur-md p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 border border-primary/30 shadow-inner">
                    <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                      API Analysis Reports
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      Comprehensive analytics, insights, and reporting for API security assessments
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-32 sm:w-40">
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">Last 7 days</SelectItem>
                    <SelectItem value="30days">Last 30 days</SelectItem>
                    <SelectItem value="90days">Last 90 days</SelectItem>
                    <SelectItem value="1year">Last year</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" size="sm" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">Export</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="gap-2">
                      <FileText className="h-4 w-4" />
                      Export as PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2">
                      <Database className="h-4 w-4" />
                      Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Export Charts
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button size="sm" className="gap-2 bg-gradient-to-r from-primary to-primary/90">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Generate Report</span>
                </Button>
              </div>
            </div>

            {/* Enhanced Key Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-3 text-center hover:bg-card/70 transition-colors">
                <div className="flex items-center justify-center mb-1">
                  <Globe className="w-4 h-4 text-primary" />
                </div>
                <div className="text-lg sm:text-xl font-bold text-primary">{analyticsData.totalApisAnalyzed}</div>
                <div className="text-xs text-muted-foreground">APIs Analyzed</div>
                <div className="text-xs text-green-600 mt-1">+15%</div>
              </div>

              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-3 text-center hover:bg-card/70 transition-colors">
                <div className="flex items-center justify-center mb-1">
                  <Shield className="w-4 h-4 text-red-500" />
                </div>
                <div className="text-lg sm:text-xl font-bold text-red-600">{analyticsData.vulnerabilitiesFound}</div>
                <div className="text-xs text-muted-foreground">Vulnerabilities</div>
                <div className="text-xs text-green-600 mt-1">-5%</div>
              </div>

              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-3 text-center hover:bg-card/70 transition-colors">
                <div className="flex items-center justify-center mb-1">
                  <Target className="w-4 h-4 text-green-500" />
                </div>
                <div className="text-lg sm:text-xl font-bold text-green-600">{analyticsData.averageSecurityScore}</div>
                <div className="text-xs text-muted-foreground">Avg Score</div>
                <div className="text-xs text-green-600 mt-1">+2</div>
              </div>

              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-3 text-center hover:bg-card/70 transition-colors">
                <div className="flex items-center justify-center mb-1">
                  <Clock className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-lg sm:text-xl font-bold text-blue-600">{analyticsData.averageResponseTime}ms</div>
                <div className="text-xs text-muted-foreground">Avg Response</div>
                <div className="text-xs text-green-600 mt-1">-12ms</div>
              </div>

              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-3 text-center hover:bg-card/70 transition-colors">
                <div className="flex items-center justify-center mb-1">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
                <div className="text-lg sm:text-xl font-bold text-red-600">{analyticsData.criticalIssues}</div>
                <div className="text-xs text-muted-foreground">Critical Issues</div>
                <div className="text-xs text-green-600 mt-1">-2</div>
              </div>

              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-3 text-center hover:bg-card/70 transition-colors">
                <div className="flex items-center justify-center mb-1">
                  <Zap className="w-4 h-4 text-purple-500" />
                </div>
                <div className="text-lg sm:text-xl font-bold text-purple-600">{analyticsData.totalTestsRun}</div>
                <div className="text-xs text-muted-foreground">Tests Run</div>
                <div className="text-xs text-green-600 mt-1">+67</div>
              </div>

              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-3 text-center hover:bg-card/70 transition-colors">
                <div className="flex items-center justify-center mb-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <div className="text-lg sm:text-xl font-bold text-green-600">{analyticsData.successRate}%</div>
                <div className="text-xs text-muted-foreground">Success Rate</div>
                <div className="text-xs text-green-600 mt-1">+0.5%</div>
              </div>

              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-3 text-center hover:bg-card/70 transition-colors">
                <div className="flex items-center justify-center mb-1">
                  <Server className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-lg sm:text-xl font-bold text-blue-600">{analyticsData.performanceMetrics.uptime}%</div>
                <div className="text-xs text-muted-foreground">Uptime</div>
                <div className="text-xs text-green-600 mt-1">+0.1%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Analytics Tabs */}
        <Tabs defaultValue="overview" className="w-full space-y-4 sm:space-y-6">
          <div className="w-full border border-border/50 rounded-xl bg-card/80 backdrop-blur-md p-4 shadow-sm">
            <TabsList className="w-full grid grid-cols-2 sm:grid-cols-5 gap-1 bg-muted/50">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
              <TabsTrigger value="vulnerabilities" className="text-xs sm:text-sm">Vulnerabilities</TabsTrigger>
              <TabsTrigger value="performance" className="text-xs sm:text-sm">Performance</TabsTrigger>
              <TabsTrigger value="trends" className="text-xs sm:text-sm">Trends</TabsTrigger>
              <TabsTrigger value="reports" className="text-xs sm:text-sm">Reports</TabsTrigger>
            </TabsList>
          </div>

          {/* Enhanced Overview Tab */}
          <TabsContent value="overview" className="w-full space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* HTTP Methods Distribution */}
              <Card className="border border-border/50 bg-card/80 backdrop-blur-md shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/20 border border-blue-500/30">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                    </div>
                    HTTP Methods Distribution
                  </CardTitle>
                  <CardDescription>API endpoint methods usage breakdown</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(analyticsData.methodDistribution).map(([method, count]) => (
                    <div key={method} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
                      <div className="flex items-center gap-3">
                        <Badge className={`${getMethodColor(method)} font-medium`}>{method}</Badge>
                        <span className="font-medium text-sm">{count} APIs</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={(count / Object.values(analyticsData.methodDistribution).reduce((a, b) => a + b, 0)) * 100} className="w-16 h-2" />
                        <span className="text-xs text-muted-foreground min-w-[3rem]">
                          {Math.round((count / Object.values(analyticsData.methodDistribution).reduce((a, b) => a + b, 0)) * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Risk Level Distribution */}
              <Card className="border border-border/50 bg-card/80 backdrop-blur-md shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-red-500/10 to-red-600/20 border border-red-500/30">
                      <PieChart className="h-4 w-4 text-red-600" />
                    </div>
                    Risk Level Distribution
                  </CardTitle>
                  <CardDescription>Security risk assessment breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(analyticsData.riskLevelDistribution).map(([level, count]) => (
                      <div key={level} className={`flex items-center justify-between p-4 rounded-lg border ${getRiskColor(level)} bg-opacity-50`}>
                        <div className="flex items-center gap-2">
                          {level === 'critical' && <XCircle className="h-4 w-4" />}
                          {level === 'high' && <AlertTriangle className="h-4 w-4" />}
                          {level === 'medium' && <AlertCircle className="h-4 w-4" />}
                          {level === 'low' && <CheckCircle className="h-4 w-4" />}
                          <span className="capitalize font-medium text-sm">{level}</span>
                        </div>
                        <span className="text-lg font-bold">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Compliance Metrics */}
            <Card className="border border-border/50 bg-card/80 backdrop-blur-md shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/20 border border-green-500/30">
                    <Shield className="h-4 w-4 text-green-600" />
                  </div>
                  Compliance Metrics
                </CardTitle>
                <CardDescription>Regulatory compliance status overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(analyticsData.complianceMetrics).map(([standard, score]) => (
                    <div key={standard} className="p-4 rounded-lg bg-background/50 border border-border/50 text-center">
                      <div className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}%</div>
                      <div className="text-sm font-medium uppercase tracking-wide">{standard}</div>
                      <Progress value={score} className="mt-2 h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enhanced Vulnerabilities Tab */}
          <TabsContent value="vulnerabilities" className="w-full space-y-4 sm:space-y-6">
            <Card className="border border-border/50 bg-card/80 backdrop-blur-md shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-red-500/10 to-red-600/20 border border-red-500/30">
                    <Shield className="h-4 w-4 text-red-600" />
                  </div>
                  Top Vulnerabilities by Type
                </CardTitle>
                <CardDescription>Most frequent security vulnerabilities discovered</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.topVulnerabilities.map((vuln, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-background/50 hover:bg-background/70 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="font-medium text-sm">{vuln.type}</div>
                          <Badge variant={vuln.severity === 'Critical' ? 'destructive' : vuln.severity === 'High' ? 'default' : 'secondary'} className="text-xs">
                            {vuln.severity}
                          </Badge>
                          {getTrendIcon(vuln.trend)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Impact Level: <span className="font-medium">{vuln.impact}</span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-xl font-bold text-red-600">{vuln.count}</div>
                        <div className="text-xs text-muted-foreground">occurrences</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enhanced Performance Tab */}
          <TabsContent value="performance" className="w-full space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Card className="border border-border/50 bg-card/80 backdrop-blur-md shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/20 border border-blue-500/30">
                      <Zap className="h-4 w-4 text-blue-600" />
                    </div>
                    Response Time Metrics
                  </CardTitle>
                  <CardDescription>API performance statistics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-background/50 border border-border/50">
                    <span className="text-sm">Average Response Time</span>
                    <span className="font-bold text-blue-600">{analyticsData.performanceMetrics.averageResponseTime}ms</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-background/50 border border-border/50">
                    <span className="text-sm">95th Percentile</span>
                    <span className="font-bold text-orange-600">{analyticsData.performanceMetrics.p95ResponseTime}ms</span>
                  </div>
                  <div className="p-3 rounded-lg bg-background/50 border border-border/50">
                    <div className="text-sm mb-1">Slowest Endpoint</div>
                    <div className="font-mono text-xs text-muted-foreground">{analyticsData.performanceMetrics.slowestEndpoint}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-background/50 border border-border/50">
                    <div className="text-sm mb-1">Fastest Endpoint</div>
                    <div className="font-mono text-xs text-muted-foreground">{analyticsData.performanceMetrics.fastestEndpoint}</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border/50 bg-card/80 backdrop-blur-md shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/20 border border-purple-500/30">
                      <Gauge className="h-4 w-4 text-purple-600" />
                    </div>
                    Error & Reliability Metrics
                  </CardTitle>
                  <CardDescription>System reliability statistics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-background/50 border border-border/50">
                    <span className="text-sm">Timeout Rate</span>
                    <span className="font-bold text-orange-600">{analyticsData.performanceMetrics.timeoutRate}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-background/50 border border-border/50">
                    <span className="text-sm">Error Rate</span>
                    <span className="font-bold text-red-600">{analyticsData.performanceMetrics.errorRate}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-background/50 border border-border/50">
                    <span className="text-sm">System Uptime</span>
                    <span className="font-bold text-green-600">{analyticsData.performanceMetrics.uptime}%</span>
                  </div>
                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">System Status: Operational</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Enhanced Trends Tab */}
          <TabsContent value="trends" className="w-full space-y-4 sm:space-y-6">
            <Card className="border border-border/50 bg-card/80 backdrop-blur-md shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/20 border border-green-500/30">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  Monthly Analytics Trends
                </CardTitle>
                <CardDescription>Historical performance and security metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.monthlyTrends.map((month, index) => (
                    <div key={index} className="grid grid-cols-2 sm:grid-cols-5 gap-4 p-4 rounded-lg border border-border/50 bg-background/50 hover:bg-background/70 transition-colors">
                      <div className="text-center">
                        <div className="font-bold text-lg">{month.month}</div>
                        <div className="text-xs text-muted-foreground">Month</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-lg text-blue-600">{month.apis}</div>
                        <div className="text-xs text-muted-foreground">APIs</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-lg text-red-600">{month.vulnerabilities}</div>
                        <div className="text-xs text-muted-foreground">Vulnerabilities</div>
                      </div>
                      <div className="text-center">
                        <div className={`font-bold text-lg ${getScoreColor(month.avgScore)}`}>{month.avgScore}</div>
                        <div className="text-xs text-muted-foreground">Avg Score</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-lg text-purple-600">{month.tests}</div>
                        <div className="text-xs text-muted-foreground">Tests</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enhanced Reports Tab */}
          <TabsContent value="reports" className="w-full space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-center justify-between mb-4">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="gap-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span className="hidden sm:inline">Grid</span>
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="gap-2"
                  >
                    <LineChart className="h-4 w-4" />
                    <span className="hidden sm:inline">List</span>
                  </Button>
                </div>
              </div>
            </div>

            <Card className="border border-border/50 bg-card/80 backdrop-blur-md shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/20 border border-blue-500/30">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  Generated Reports
                </CardTitle>
                <CardDescription>Download and manage analysis reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : 'space-y-3'}>
                  {filteredReports.map((report) => (
                    <div
                      key={report.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border/50 bg-background/50 hover:bg-background/70 transition-colors gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="font-medium text-sm">{report.title}</div>
                          <Badge
                            variant={
                              report.priority === 'critical' ? 'destructive' :
                                report.priority === 'high' ? 'default' :
                                  report.priority === 'medium' ? 'secondary' : 'outline'
                            }
                            className="text-xs"
                          >
                            {report.priority}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>{report.type} • Generated on {report.generatedDate}</div>
                          <div className="flex flex-wrap gap-4">
                            <span>{report.apisAnalyzed} APIs analyzed</span>
                            <span>{report.criticalFindings} critical findings</span>
                            <span>{report.size}</span>
                            <span>{report.downloads} downloads</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant={report.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                          {report.status}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2">
                              <Eye className="h-4 w-4" />
                              View Report
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <Download className="h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <Copy className="h-4 w-4" />
                              Copy Link
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="gap-2">
                              <Share2 className="h-4 w-4" />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <Mail className="h-4 w-4" />
                              Email
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="gap-2">
                              <Star className="h-4 w-4" />
                              Bookmark
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <Archive className="h-4 w-4" />
                              Archive
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredReports.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">No reports found for the selected category</p>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}