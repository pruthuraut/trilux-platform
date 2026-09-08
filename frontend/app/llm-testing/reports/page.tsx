'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Brain,
  Shield,
  AlertTriangle,
  Clock,
  DollarSign,
  Activity,
  BarChart3,
  PieChart,
  Eye,
  Zap,
  Target,
  Users
} from 'lucide-react'

export default function LLMTestingReports() {
  const [timeRange, setTimeRange] = useState('7d')

  // Mock data for comprehensive reports
  const securityMetrics = {
    totalRequests: 15847,
    threatsDetected: 1247,
    requestsBlocked: 892,
    requestsFlagged: 355,
    detectionAccuracy: 94.2,
    falsePositiveRate: 3.1,
    averageResponseTime: 156,
    uptime: 99.8
  }

  const threatTrends = [
    { period: 'Mon', requests: 2340, threats: 187, blocked: 134, flagged: 53 },
    { period: 'Tue', requests: 2156, threats: 201, blocked: 156, flagged: 45 },
    { period: 'Wed', requests: 2567, threats: 178, blocked: 123, flagged: 55 },
    { period: 'Thu', requests: 2890, threats: 234, blocked: 178, flagged: 56 },
    { period: 'Fri', requests: 2445, threats: 198, blocked: 145, flagged: 53 },
    { period: 'Sat', requests: 1789, threats: 134, blocked: 89, flagged: 45 },
    { period: 'Sun', requests: 1660, threats: 115, blocked: 67, flagged: 48 }
  ]

  const providerStats = [
    { name: 'OpenAI GPT-4', requests: 6234, cost: 187.45, avgLatency: 145, threats: 456 },
    { name: 'Anthropic Claude', requests: 4567, cost: 123.67, avgLatency: 189, threats: 312 },
    { name: 'Azure OpenAI', requests: 3890, cost: 98.23, avgLatency: 167, threats: 289 },
    { name: 'Google Gemini', requests: 1156, cost: 34.56, avgLatency: 123, threats: 190 }
  ]

  const threatCategories = [
    { type: 'Prompt Injection', count: 345, severity: 'high', trend: 'up', change: 12 },
    { type: 'Jailbreak Attempts', count: 267, severity: 'critical', trend: 'down', change: -8 },
    { type: 'Data Extraction', count: 198, severity: 'high', trend: 'up', change: 15 },
    { type: 'Bias Detection', count: 156, severity: 'medium', trend: 'stable', change: 2 },
    { type: 'Harmful Content', count: 134, severity: 'high', trend: 'down', change: -5 },
    { type: 'System Leak', count: 87, severity: 'critical', trend: 'up', change: 18 },
    { type: 'Misinformation', count: 60, severity: 'medium', trend: 'down', change: -12 }
  ]

  const userBehaviorMetrics = [
    { metric: 'Active Users', value: 142, change: 8, trend: 'up' },
    { metric: 'Sessions per User', value: 3.4, change: -2, trend: 'down' },
    { metric: 'Avg Session Duration', value: '12m 34s', change: 15, trend: 'up' },
    { metric: 'Repeat Offenders', value: 23, change: -18, trend: 'down' }
  ]

  const complianceMetrics = {
    gdprCompliance: 98.5,
    dataRetention: 95.2,
    auditTrail: 100,
    accessControl: 97.8,
    encryption: 100
  }

  const costAnalysis = {
    totalCost: 443.91,
    costPerRequest: 0.028,
    costTrend: 5.2,
    budgetUtilization: 67.8,
    projectedMonthlyCost: 1876.34
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-800'
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700'
    }
  }

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === 'up') {
      return <TrendingUp className={`h-4 w-4 ${change > 0 ? 'text-red-500' : 'text-green-500'}`} />
    } else if (trend === 'down') {
      return <TrendingDown className={`h-4 w-4 ${change > 0 ? 'text-green-500' : 'text-red-500'}`} />
    }
    return <Activity className="h-4 w-4 text-gray-500" />
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            LLM Security Reports
          </h1>
          <p className="text-muted-foreground">Comprehensive analytics and insights for your LLM security gateway</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="security">Security Analysis</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{securityMetrics.totalRequests.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  +15% from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Threats Detected</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{securityMetrics.threatsDetected}</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <TrendingDown className="h-3 w-3 mr-1 text-green-500" />
                  -8% from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Detection Accuracy</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{securityMetrics.detectionAccuracy}%</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  +2.1% from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{securityMetrics.uptime}%</div>
                <p className="text-xs text-muted-foreground">
                  {securityMetrics.averageResponseTime}ms avg response
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Weekly Security Trends
              </CardTitle>
              <CardDescription>Daily breakdown of requests and threat detection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {threatTrends.map((day) => (
                  <div key={day.period} className="grid grid-cols-5 gap-4 p-3 border rounded-lg">
                    <div className="font-medium">{day.period}</div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{day.requests}</div>
                      <div className="text-xs text-muted-foreground">Requests</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">{day.threats}</div>
                      <div className="text-xs text-muted-foreground">Threats</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">{day.blocked}</div>
                      <div className="text-xs text-muted-foreground">Blocked</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-yellow-600">{day.flagged}</div>
                      <div className="text-xs text-muted-foreground">Flagged</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Provider Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Provider Performance Summary
              </CardTitle>
              <CardDescription>Performance metrics by LLM provider</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {providerStats.map((provider) => (
                  <div key={provider.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">{provider.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {provider.requests.toLocaleString()} requests • {provider.avgLatency}ms avg latency
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <div className="text-lg font-bold text-red-600">{provider.threats}</div>
                        <div className="text-xs text-muted-foreground">Threats</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold">${provider.cost.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">Cost</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Threat Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Threat Categories
                </CardTitle>
                <CardDescription>Breakdown of detected security threats</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {threatCategories.map((category) => (
                    <div key={category.type} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">{category.type}</div>
                        <Badge className={getSeverityColor(category.severity)}>
                          {category.severity}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-lg font-bold">{category.count}</div>
                          <div className="text-xs text-muted-foreground flex items-center">
                            {getTrendIcon(category.trend, category.change)}
                            {Math.abs(category.change)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Security Effectiveness */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Security Effectiveness
                </CardTitle>
                <CardDescription>Performance metrics for threat detection</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Detection Accuracy</span>
                      <span>{securityMetrics.detectionAccuracy}%</span>
                    </div>
                    <Progress value={securityMetrics.detectionAccuracy} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Block Rate</span>
                      <span>{((securityMetrics.requestsBlocked / securityMetrics.threatsDetected) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={(securityMetrics.requestsBlocked / securityMetrics.threatsDetected) * 100} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>False Positive Rate</span>
                      <span>{securityMetrics.falsePositiveRate}%</span>
                    </div>
                    <Progress value={securityMetrics.falsePositiveRate} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{securityMetrics.requestsBlocked}</div>
                      <div className="text-sm text-muted-foreground">Requests Blocked</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{securityMetrics.requestsFlagged}</div>
                      <div className="text-sm text-muted-foreground">Requests Flagged</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Behavior Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Behavior Analysis
              </CardTitle>
              <CardDescription>Insights into user interaction patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {userBehaviorMetrics.map((metric) => (
                  <div key={metric.metric} className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">{metric.value}</div>
                    <div className="text-sm text-muted-foreground">{metric.metric}</div>
                    <div className="text-xs flex items-center justify-center mt-1">
                      {getTrendIcon(metric.trend, metric.change)}
                      {Math.abs(metric.change)}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Response Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{securityMetrics.averageResponseTime}ms</div>
                <p className="text-xs text-muted-foreground">
                  Processing latency
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Requests per Second</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">23.4</div>
                <p className="text-xs text-muted-foreground">
                  Peak throughput
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{securityMetrics.uptime}%</div>
                <p className="text-xs text-muted-foreground">
                  Last 30 days
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Provider Performance Details */}
          <Card>
            <CardHeader>
              <CardTitle>Provider Performance Comparison</CardTitle>
              <CardDescription>Detailed performance metrics by LLM provider</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {providerStats.map((provider) => (
                  <div key={provider.name} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-medium">{provider.name}</h3>
                      <Badge variant="outline">{provider.requests.toLocaleString()} requests</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold">{provider.avgLatency}ms</div>
                        <div className="text-xs text-muted-foreground">Avg Latency</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">{provider.threats}</div>
                        <div className="text-xs text-muted-foreground">Threats Detected</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">${provider.cost.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">Total Cost</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${costAnalysis.totalCost}</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1 text-red-500" />
                  +{costAnalysis.costTrend}% from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cost per Request</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${costAnalysis.costPerRequest}</div>
                <p className="text-xs text-muted-foreground">
                  Average cost
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{costAnalysis.budgetUtilization}%</div>
                <Progress value={costAnalysis.budgetUtilization} className="h-2 mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Projected Monthly</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${costAnalysis.projectedMonthlyCost.toFixed(0)}</div>
                <p className="text-xs text-muted-foreground">
                  Based on current usage
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Cost by Provider */}
          <Card>
            <CardHeader>
              <CardTitle>Cost Analysis by Provider</CardTitle>
              <CardDescription>Detailed cost breakdown for each LLM provider</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {providerStats.map((provider) => (
                  <div key={provider.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{provider.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {provider.requests.toLocaleString()} requests
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">${provider.cost.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">
                        ${(provider.cost / provider.requests).toFixed(4)} per request
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Compliance Dashboard
              </CardTitle>
              <CardDescription>Security and compliance metrics overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(complianceMetrics).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span>{value}%</span>
                    </div>
                    <Progress value={value} className="h-3" />
                    <div className="text-xs text-muted-foreground">
                      {value >= 95 ? 'Excellent' : value >= 90 ? 'Good' : 'Needs Attention'}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Certifications</CardTitle>
                <CardDescription>Current security compliance status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span>SOC 2 Type II</span>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Compliant</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span>ISO 27001</span>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Compliant</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span>GDPR</span>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Compliant</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span>HIPAA</span>
                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pending</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Audit Trail</CardTitle>
                <CardDescription>Recent security audit activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm">
                    <div className="font-medium">Last Security Audit</div>
                    <div className="text-muted-foreground">January 15, 2024</div>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">Next Scheduled Audit</div>
                    <div className="text-muted-foreground">April 15, 2024</div>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">Compliance Score</div>
                    <div className="text-green-600 font-bold">97.2%</div>
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    <Eye className="h-4 w-4 mr-2" />
                    View Full Audit Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
