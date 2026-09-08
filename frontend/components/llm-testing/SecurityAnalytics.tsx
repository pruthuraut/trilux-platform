import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Zap,
  Brain,
  Eye,
  Clock,
  BarChart3
} from 'lucide-react'

interface ThreatMetrics {
  total: number
  blocked: number
  flagged: number
  byType: {
    injection: number
    jailbreak: number
    prompt_leak: number
    data_extraction: number
    bias: number
    harmful_content: number
  }
  bySeverity: {
    low: number
    medium: number
    high: number
    critical: number
  }
  trend: 'up' | 'down' | 'stable'
  changePercentage: number
}

interface PerformanceMetrics {
  averageLatency: number
  requestsPerSecond: number
  uptime: number
  errorRate: number
  throughput: number
}

interface SecurityAnalyticsProps {
  threatMetrics: ThreatMetrics
  performanceMetrics: PerformanceMetrics
  timeRange: string
}

export default function SecurityAnalytics({
  threatMetrics,
  performanceMetrics,
  timeRange
}: SecurityAnalyticsProps) {
  const blockRate = threatMetrics.total > 0 ? (threatMetrics.blocked / threatMetrics.total) * 100 : 0
  const flagRate = threatMetrics.total > 0 ? (threatMetrics.flagged / threatMetrics.total) * 100 : 0

  const getThreatTypeIcon = (type: string) => {
    switch (type) {
      case 'injection':
        return '💉'
      case 'jailbreak':
        return '🔓'
      case 'prompt_leak':
        return '🔍'
      case 'data_extraction':
        return '📊'
      case 'bias':
        return '⚖️'
      case 'harmful_content':
        return '⚠️'
      default:
        return '🚨'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-blue-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'high':
        return 'bg-orange-500'
      case 'critical':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
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
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Threats</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{threatMetrics.total}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              {getTrendIcon(threatMetrics.trend, threatMetrics.changePercentage)}
              {Math.abs(threatMetrics.changePercentage)}% from last {timeRange}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Block Rate</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{blockRate.toFixed(1)}%</div>
            <Progress value={blockRate} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceMetrics.averageLatency}ms</div>
            <p className="text-xs text-muted-foreground">
              {performanceMetrics.requestsPerSecond} req/sec
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{performanceMetrics.uptime.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Error rate: {performanceMetrics.errorRate.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Threat Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Threat Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Threat Types Distribution
            </CardTitle>
            <CardDescription>Breakdown of detected threat categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(threatMetrics.byType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getThreatTypeIcon(type)}</span>
                    <span className="font-medium capitalize">
                      {type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full" 
                        style={{ width: `${threatMetrics.total > 0 ? (count / threatMetrics.total) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Severity Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Severity Distribution
            </CardTitle>
            <CardDescription>Threats categorized by severity level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(threatMetrics.bySeverity).map(([severity, count]) => {
                const percentage = threatMetrics.total > 0 ? (count / threatMetrics.total) * 100 : 0
                return (
                  <div key={severity} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium capitalize">{severity}</span>
                      <span>{count} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`${getSeverityColor(severity)} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Security Actions Summary
          </CardTitle>
          <CardDescription>Overview of security actions taken during {timeRange}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-red-600">{threatMetrics.blocked}</div>
              <div className="text-sm text-muted-foreground">Requests Blocked</div>
              <div className="text-xs text-muted-foreground mt-1">
                {blockRate.toFixed(1)}% of total threats
              </div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-yellow-600">{threatMetrics.flagged}</div>
              <div className="text-sm text-muted-foreground">Requests Flagged</div>
              <div className="text-xs text-muted-foreground mt-1">
                {flagRate.toFixed(1)}% of total threats
              </div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                {((threatMetrics.blocked + threatMetrics.flagged) / threatMetrics.total * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Detection Rate</div>
              <div className="text-xs text-muted-foreground mt-1">
                Security effectiveness
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <Button className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              View Detailed Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
