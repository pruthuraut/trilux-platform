'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Download,
  TrendingUp,
  TrendingDown,
  Activity,
  Shield,
  AlertTriangle,
  Chrome,
  Puzzle,
  Calendar,
  FileText,
  BarChart3,
  PieChart,
  Globe,
  Filter,
  Search,
  RefreshCw,
  Share2,
  Settings,
  Eye,
  ExternalLink,
  Clock,
  Target,
  Zap,
  Database,
  Users,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Layers,
  Code,
  Lock,
  Unlock,
  GitBranch,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react'

export default function ExtensionTestingReports() {
  const [timeRange, setTimeRange] = useState('7d')
  const [selectedMetric, setSelectedMetric] = useState<string>('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBrowser, setFilterBrowser] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('date')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Enhanced mock data for comprehensive reports
  const mockReportData = useMemo(() => ({
    securityTrends: [
      {
        period: 'Week 1',
        avgScore: 72,
        vulnerabilities: 15,
        extensions: 8,
        highRisk: 2,
        criticalIssues: 1,
        date: '2026-01-26'
      },
      {
        period: 'Week 2',
        avgScore: 68,
        vulnerabilities: 22,
        extensions: 12,
        highRisk: 4,
        criticalIssues: 2,
        date: '2026-01-30'
      },
      {
        period: 'Week 3',
        avgScore: 75,
        vulnerabilities: 18,
        extensions: 10,
        highRisk: 3,
        criticalIssues: 1,
        date: '2026-02-03'
      },
      {
        period: 'Week 4',
        avgScore: 78,
        vulnerabilities: 12,
        extensions: 15,
        highRisk: 2,
        criticalIssues: 0,
        date: '2026-02-07'
      },
    ],

    browserDistribution: [
      { browser: 'Chrome', count: 25, percentage: 62.5, avgScore: 76, vulnerabilities: 28 },
      { browser: 'Firefox', count: 10, percentage: 25, avgScore: 72, vulnerabilities: 12 },
      { browser: 'Safari', count: 5, percentage: 12.5, avgScore: 68, vulnerabilities: 5 },
      { browser: 'Edge', count: 3, percentage: 7.5, avgScore: 74, vulnerabilities: 3 },
    ],

    vulnerabilityTypes: [
      {
        type: 'Cross-Site Scripting (XSS)',
        count: 8,
        severity: 'high',
        trend: 'down',
        description: 'Potential XSS vulnerabilities in content scripts',
        affectedExtensions: ['AdBlock Plus', 'LastPass', 'Grammarly']
      },
      {
        type: 'Unsafe Permissions',
        count: 12,
        severity: 'medium',
        trend: 'stable',
        description: 'Extensions requesting unnecessary broad permissions',
        affectedExtensions: ['Social Media Helper', 'Tab Manager', 'PDF Viewer']
      },
      {
        type: 'Data Exposure',
        count: 6,
        severity: 'high',
        trend: 'up',
        description: 'Potential data leakage through insecure practices',
        affectedExtensions: ['Password Manager', 'Shopping Assistant']
      },
      {
        type: 'Manifest Issues',
        count: 15,
        severity: 'low',
        trend: 'stable',
        description: 'Manifest configuration problems and deprecated features',
        affectedExtensions: ['Old Extension', 'Legacy Tool', 'Simple Blocker']
      },
      {
        type: 'Content Security Policy',
        count: 4,
        severity: 'medium',
        trend: 'down',
        description: 'Missing or weak CSP configurations',
        affectedExtensions: ['Web Scraper', 'Data Collector']
      },
    ],

    riskDistribution: [
      { level: 'Low', count: 18, percentage: 45, color: 'bg-green-500', trend: 'stable' },
      { level: 'Medium', count: 14, percentage: 35, color: 'bg-yellow-500', trend: 'down' },
      { level: 'High', count: 7, percentage: 17.5, color: 'bg-orange-500', trend: 'down' },
      { level: 'Critical', count: 1, percentage: 2.5, color: 'bg-red-500', trend: 'down' },
    ],

    manifestVersions: [
      {
        version: 'Manifest v2',
        count: 15,
        percentage: 37.5,
        avgScore: 68,
        deprecationWarning: true,
        recommendedAction: 'Migrate to Manifest v3'
      },
      {
        version: 'Manifest v3',
        count: 25,
        percentage: 62.5,
        avgScore: 78,
        deprecationWarning: false,
        recommendedAction: 'Continue monitoring'
      },
    ],

    keyMetrics: {
      totalExtensions: 40,
      avgSecurityScore: 74,
      totalVulnerabilities: 45,
      highRiskExtensions: 8,
      activeThreats: 3,
      resolvedIssues: 23,
      trendsComparison: {
        extensions: { current: 40, previous: 36, change: 11.1 },
        avgScore: { current: 74, previous: 70, change: 5.7 },
        vulnerabilities: { current: 45, previous: 49, change: -8.2 },
        highRisk: { current: 8, previous: 11, change: -27.3 }
      }
    },

    topExtensions: [
      {
        name: 'AdBlock Plus',
        version: '3.15.2',
        browser: 'chrome',
        score: 92,
        vulnerabilities: 0,
        riskLevel: 'low',
        category: 'privacy',
        downloads: 10000000,
        rating: 4.5
      },
      {
        name: 'LastPass',
        version: '4.95.0',
        browser: 'chrome',
        score: 88,
        vulnerabilities: 1,
        riskLevel: 'low',
        category: 'security',
        downloads: 5000000,
        rating: 4.2
      },
      {
        name: 'Grammarly',
        version: '14.956.0',
        browser: 'chrome',
        score: 85,
        vulnerabilities: 2,
        riskLevel: 'medium',
        category: 'productivity',
        downloads: 8000000,
        rating: 4.6
      }
    ]
  }), [])

  const { securityTrends, browserDistribution, vulnerabilityTypes, riskDistribution, manifestVersions, keyMetrics, topExtensions } = mockReportData

  // Helper functions for enhanced UI
  const getBrowserIcon = (browser: string) => {
    switch (browser.toLowerCase()) {
      case 'chrome':
        return <Chrome className="h-4 w-4 text-blue-500" />
      case 'firefox':
        return <Globe className="h-4 w-4 text-orange-500" />
      case 'safari':
        return <Globe className="h-4 w-4 text-blue-600" />
      case 'edge':
        return <Globe className="h-4 w-4 text-blue-700" />
      default:
        return <Chrome className="h-4 w-4" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
      case 'critical':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
    }
  }

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low':
        return 'bg-green-500/10 text-green-600 border-green-500/30'
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30'
      case 'high':
        return 'bg-orange-500/10 text-orange-600 border-orange-500/30'
      case 'critical':
        return 'bg-red-500/10 text-red-600 border-red-500/30'
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/30'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="h-3 w-3 text-red-500" />
      case 'down':
        return <ArrowDownRight className="h-3 w-3 text-green-500" />
      case 'stable':
        return <Minus className="h-3 w-3 text-gray-500" />
      default:
        return <Minus className="h-3 w-3 text-gray-500" />
    }
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-3 w-3" />
    if (change < 0) return <TrendingDown className="h-3 w-3" />
    return <Minus className="h-3 w-3" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto p-6 space-y-6">
        {/* Enhanced Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border border-border/50 backdrop-blur-sm">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
          <div className="relative p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/30 border border-primary/30">
                    <BarChart3 className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                      Extension Security Reports
                    </h1>
                    <p className="text-muted-foreground text-sm sm:text-base">
                      Comprehensive analytics and insights from browser extension security testing
                    </p>
                  </div>
                </div>

                {/* Key Stats Summary */}
                <div className="flex flex-wrap gap-4 pt-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/60 backdrop-blur-sm border border-border/50">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{keyMetrics.totalExtensions} Extensions Analyzed</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/60 backdrop-blur-sm border border-border/50">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">{keyMetrics.avgSecurityScore}% Avg Security Score</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/60 backdrop-blur-sm border border-border/50">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium">{keyMetrics.totalVulnerabilities} Vulnerabilities Found</span>
                  </div>
                </div>
              </div>

              {/* Controls and Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex gap-2">
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-[160px] bg-background/80 backdrop-blur-sm border-border/50">
                      <Clock className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Time Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                      <SelectItem value="90d">Last 90 days</SelectItem>
                      <SelectItem value="1y">Last year</SelectItem>
                    </SelectContent>
                  </Select>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="bg-background/80 backdrop-blur-sm border-border/50">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2">
                        <FileText className="h-4 w-4" />
                        Export as PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Export as CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2">
                        <Code className="h-4 w-4" />
                        Export as JSON
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="gap-2">
                        <Share2 className="h-4 w-4" />
                        Share Report
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="bg-background/80 backdrop-blur-sm border-border/50">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button variant="outline" size="sm" className="bg-background/80 backdrop-blur-sm border-border/50">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Navigation Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm rounded-xl p-1">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 bg-transparent gap-1">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
              >
                <Shield className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
              <TabsTrigger
                value="trends"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Trends</span>
              </TabsTrigger>
              <TabsTrigger
                value="vulnerabilities"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Vulnerabilities</span>
              </TabsTrigger>
              <TabsTrigger
                value="extensions"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
              >
                <Puzzle className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Extensions</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            {/* Enhanced Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <Card className="border border-border/50 bg-gradient-to-br from-card/80 to-card backdrop-blur-md shadow-sm hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <div>
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Extensions</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="text-2xl font-bold text-primary">{keyMetrics.totalExtensions}</div>
                      <div className={`flex items-center gap-1 text-xs ${getChangeColor(keyMetrics.trendsComparison.extensions.change)}`}>
                        {getChangeIcon(keyMetrics.trendsComparison.extensions.change)}
                        {Math.abs(keyMetrics.trendsComparison.extensions.change).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/20 border border-blue-500/30">
                    <Puzzle className="h-5 w-5 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    From {keyMetrics.trendsComparison.extensions.previous} last period
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-border/50 bg-gradient-to-br from-card/80 to-card backdrop-blur-md shadow-sm hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <div>
                    <CardTitle className="text-sm font-medium text-muted-foreground">Avg Security Score</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="text-2xl font-bold text-green-600">{keyMetrics.avgSecurityScore}%</div>
                      <div className={`flex items-center gap-1 text-xs ${getChangeColor(keyMetrics.trendsComparison.avgScore.change)}`}>
                        {getChangeIcon(keyMetrics.trendsComparison.avgScore.change)}
                        {Math.abs(keyMetrics.trendsComparison.avgScore.change).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/20 border border-green-500/30">
                    <Shield className="h-5 w-5 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Progress value={keyMetrics.avgSecurityScore} className="h-2 mt-2" />
                </CardContent>
              </Card>

              <Card className="border border-border/50 bg-gradient-to-br from-card/80 to-card backdrop-blur-md shadow-sm hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <div>
                    <CardTitle className="text-sm font-medium text-muted-foreground">Vulnerabilities</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="text-2xl font-bold text-red-600">{keyMetrics.totalVulnerabilities}</div>
                      <div className={`flex items-center gap-1 text-xs ${getChangeColor(keyMetrics.trendsComparison.vulnerabilities.change)}`}>
                        {getChangeIcon(keyMetrics.trendsComparison.vulnerabilities.change)}
                        {Math.abs(keyMetrics.trendsComparison.vulnerabilities.change).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-gradient-to-br from-red-500/10 to-red-600/20 border border-red-500/30">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Active: {keyMetrics.activeThreats}</span>
                    <span>Resolved: {keyMetrics.resolvedIssues}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border/50 bg-gradient-to-br from-card/80 to-card backdrop-blur-md shadow-sm hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <div>
                    <CardTitle className="text-sm font-medium text-muted-foreground">High Risk</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="text-2xl font-bold text-orange-600">{keyMetrics.highRiskExtensions}</div>
                      <div className={`flex items-center gap-1 text-xs ${getChangeColor(keyMetrics.trendsComparison.highRisk.change)}`}>
                        {getChangeIcon(keyMetrics.trendsComparison.highRisk.change)}
                        {Math.abs(keyMetrics.trendsComparison.highRisk.change).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/10 to-orange-600/20 border border-orange-500/30">
                    <Activity className="h-5 w-5 text-orange-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Requiring immediate attention
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Analytics Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border border-border/50 bg-card/80 backdrop-blur-md shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/20 border border-blue-500/30">
                          <PieChart className="h-4 w-4 text-blue-600" />
                        </div>
                        Browser Distribution
                      </CardTitle>
                      <CardDescription>Extensions tested across different browser platforms</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Eye className="h-4 w-4" />
                      Details
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {browserDistribution.map((item) => (
                      <div key={item.browser} className="group">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            {getBrowserIcon(item.browser)}
                            <span className="font-medium">{item.browser}</span>
                            <Badge variant="outline" className="text-xs">
                              {item.count} extensions
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">{item.percentage}%</span>
                            <span className="text-muted-foreground">Avg: {item.avgScore}%</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Progress value={item.percentage} className="h-2" />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{item.vulnerabilities} vulnerabilities found</span>
                            <span>Security score: {item.avgScore}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border/50 bg-card/80 backdrop-blur-md shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/20 border border-purple-500/30">
                          <BarChart3 className="h-4 w-4 text-purple-600" />
                        </div>
                        Risk Level Distribution
                      </CardTitle>
                      <CardDescription>Extensions grouped by security risk assessment</CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2">
                          <Eye className="h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <Download className="h-4 w-4" />
                          Export Data
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {riskDistribution.map((item) => (
                      <div key={item.level} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Badge className={getRiskColor(item.level)} variant="outline">
                              {item.level} Risk
                            </Badge>
                            {getTrendIcon(item.trend)}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">{item.count} extensions</span>
                            <span className="text-muted-foreground">({item.percentage}%)</span>
                          </div>
                        </div>
                        <Progress value={item.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="text-lg font-bold text-green-600">
                          {riskDistribution.filter(r => r.level === 'Low').reduce((acc, r) => acc + r.count, 0)}
                        </div>
                        <div className="text-xs text-muted-foreground">Low Risk Total</div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="text-lg font-bold text-red-600">
                          {riskDistribution.filter(r => ['High', 'Critical'].includes(r.level)).reduce((acc, r) => acc + r.count, 0)}
                        </div>
                        <div className="text-xs text-muted-foreground">High Risk Total</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Distribution Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="border border-border/50 bg-card/80 backdrop-blur-md shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/20 border border-green-500/30">
                      <FileText className="h-4 w-4 text-green-600" />
                    </div>
                    Manifest Versions
                  </CardTitle>
                  <CardDescription>Extension manifest version distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {manifestVersions.map((item) => (
                      <div key={item.version} className="relative">
                        <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg bg-background/50 hover:bg-background/70 transition-colors">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="font-medium">{item.version}</div>
                              {item.deprecationWarning && (
                                <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50 dark:bg-orange-900/20">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Deprecated
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {item.percentage}% of extensions • Avg score: {item.avgScore}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {item.recommendedAction}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">{item.count}</div>
                            <div className="text-xs text-muted-foreground">extensions</div>
                          </div>
                        </div>
                        <Progress value={item.percentage} className="mt-2 h-1" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 border border-border/50 bg-card/80 backdrop-blur-md shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-yellow-500/10 to-yellow-600/20 border border-yellow-500/30">
                          <Star className="h-4 w-4 text-yellow-600" />
                        </div>
                        Top Performing Extensions
                      </CardTitle>
                      <CardDescription>Highest rated extensions by security score</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                      <ExternalLink className="h-4 w-4" />
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topExtensions.map((extension, index) => (
                      <div key={extension.name} className="flex items-center justify-between p-4 border border-border/50 rounded-lg bg-background/50 hover:bg-background/70 transition-all duration-200">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 border border-primary/30">
                            <span className="text-sm font-bold text-primary">#{index + 1}</span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{extension.name}</h3>
                              <Badge variant="outline" className="text-xs">v{extension.version}</Badge>
                              <div className="flex items-center gap-1">
                                {getBrowserIcon(extension.browser)}
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {(extension.downloads / 1000000).toFixed(1)}M downloads
                              </span>
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                {extension.rating}/5.0
                              </span>
                              <Badge className={getRiskColor(extension.riskLevel)} variant="outline">
                                {extension.riskLevel}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">{extension.score}%</div>
                          <div className="text-xs text-muted-foreground">Security Score</div>
                          <div className="flex items-center gap-1 mt-1">
                            {extension.vulnerabilities === 0 ? (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-3 w-3 text-orange-500" />
                            )}
                            <span className="text-xs">{extension.vulnerabilities} issues</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="extensions" className="space-y-6">
            {/* Extension Management and Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <Card className="lg:col-span-3 border border-border/50 bg-card/80 backdrop-blur-md shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/20 border border-purple-500/30">
                          <Database className="h-4 w-4 text-purple-600" />
                        </div>
                        Extension Inventory
                      </CardTitle>
                      <CardDescription>Complete list of analyzed browser extensions</CardDescription>
                    </div>

                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search extensions..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9 w-64"
                        />
                      </div>
                      <Select value={filterBrowser} onValueChange={setFilterBrowser}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Browser" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="chrome">Chrome</SelectItem>
                          <SelectItem value="firefox">Firefox</SelectItem>
                          <SelectItem value="safari">Safari</SelectItem>
                          <SelectItem value="edge">Edge</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topExtensions.map((extension) => (
                      <div key={extension.name} className="p-4 border border-border/50 rounded-lg bg-background/50 hover:bg-background/70 transition-all duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-muted/50">
                              {getBrowserIcon(extension.browser)}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{extension.name}</h3>
                                <Badge variant="outline" className="text-xs">v{extension.version}</Badge>
                                <Badge className={getRiskColor(extension.riskLevel)} variant="outline">
                                  {extension.riskLevel}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {(extension.downloads / 1000000).toFixed(1)}M downloads
                                </span>
                                <span className="flex items-center gap-1">
                                  <Star className="h-3 w-3" />
                                  {extension.rating}/5.0
                                </span>
                                <span className="capitalize">{extension.category}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="text-lg font-bold text-primary">{extension.score}%</div>
                              <div className="text-xs text-muted-foreground">Security</div>
                            </div>
                            <div className="text-center">
                              <div className={`text-lg font-bold ${extension.vulnerabilities === 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {extension.vulnerabilities}
                              </div>
                              <div className="text-xs text-muted-foreground">Issues</div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem className="gap-2">
                                  <Eye className="h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2">
                                  <Download className="h-4 w-4" />
                                  Export Report
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2">
                                  <RefreshCw className="h-4 w-4" />
                                  Re-analyze
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border/50 bg-card/80 backdrop-blur-md shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/20 border border-blue-500/30">
                      <Filter className="h-4 w-4 text-blue-600" />
                    </div>
                    Quick Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Risk Level</div>
                    <div className="space-y-1">
                      {['Low', 'Medium', 'High', 'Critical'].map((risk) => (
                        <div key={risk} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors cursor-pointer">
                          <span className="text-sm">{risk} Risk</span>
                          <Badge variant="outline" className={getRiskColor(risk)}>
                            {riskDistribution.find(r => r.level === risk)?.count || 0}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Categories</div>
                    <div className="space-y-1">
                      {['Productivity', 'Security', 'Privacy', 'Social'].map((category) => (
                        <div key={category} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors cursor-pointer">
                          <span className="text-sm">{category}</span>
                          <Badge variant="outline">
                            {Math.floor(Math.random() * 10) + 1}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Security Score Distribution</CardTitle>
                  <CardDescription>Extensions grouped by security score ranges</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Excellent (80-100%)</span>
                        <span>15 extensions</span>
                      </div>
                      <Progress value={37.5} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Good (60-79%)</span>
                        <span>18 extensions</span>
                      </div>
                      <Progress value={45} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Fair (40-59%)</span>
                        <span>5 extensions</span>
                      </div>
                      <Progress value={12.5} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Poor (0-39%)</span>
                        <span>2 extensions</span>
                      </div>
                      <Progress value={5} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Common Security Issues</CardTitle>
                  <CardDescription>Most frequent security problems found</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">Excessive Permissions</div>
                        <div className="text-sm text-muted-foreground">Found in 28 extensions</div>
                      </div>
                      <Badge className="bg-orange-100 text-orange-800 border-orange-200">Medium</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">Insecure Content Scripts</div>
                        <div className="text-sm text-muted-foreground">Found in 12 extensions</div>
                      </div>
                      <Badge className="bg-red-100 text-red-800 border-red-200">High</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">Missing CSP Headers</div>
                        <div className="text-sm text-muted-foreground">Found in 18 extensions</div>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Low</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Security Trends Over Time
                </CardTitle>
                <CardDescription>Weekly security score and vulnerability trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {securityTrends.map((trend, index) => (
                    <div key={trend.period} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">{trend.period}</h3>
                        <Badge variant="outline">{trend.extensions} extensions</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Avg Security Score</div>
                          <div className="text-2xl font-bold text-green-600">{trend.avgScore}%</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Vulnerabilities Found</div>
                          <div className="text-2xl font-bold text-red-600">{trend.vulnerabilities}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vulnerabilities" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Vulnerability Analysis
                </CardTitle>
                <CardDescription>Detailed breakdown of security vulnerabilities by type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vulnerabilityTypes.map((vuln) => (
                    <div key={vuln.type} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">{vuln.type}</div>
                        <div className="text-sm text-muted-foreground">
                          Found in {vuln.count} extensions
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-2xl font-bold">{vuln.count}</div>
                          <div className="text-xs text-muted-foreground">instances</div>
                        </div>
                        <Badge className={getSeverityColor(vuln.severity)}>
                          {vuln.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vulnerability Remediation Timeline</CardTitle>
                <CardDescription>Expected time to fix different types of vulnerabilities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">2-4 hours</div>
                      <div className="text-sm text-muted-foreground">Low severity fixes</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">1-2 days</div>
                      <div className="text-sm text-muted-foreground">Medium severity fixes</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-red-600">1-2 weeks</div>
                      <div className="text-sm text-muted-foreground">High severity fixes</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
