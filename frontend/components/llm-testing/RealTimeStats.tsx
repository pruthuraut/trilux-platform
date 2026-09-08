import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  AlertTriangle, 
  Shield, 
  Clock, 
  TrendingUp, 
  Activity,
  Zap
} from 'lucide-react'

interface ThreatDetection {
  id: string
  type: 'injection' | 'jailbreak' | 'prompt_leak' | 'data_extraction' | 'bias' | 'harmful_content'
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  description: string
  timestamp: string
  blocked: boolean
}

interface RealTimeStatsProps {
  totalRequests: number
  blockedRequests: number
  averageLatency: number
  threatDetections: ThreatDetection[]
  isActive: boolean
}

export default function RealTimeStats({
  totalRequests,
  blockedRequests,
  averageLatency,
  threatDetections,
  isActive
}: RealTimeStatsProps) {
  const blockRate = totalRequests > 0 ? (blockedRequests / totalRequests) * 100 : 0
  const recentThreats = threatDetections.slice(-5)

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

  const getThreatIcon = (type: string) => {
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* Real-time Status */}
      <Card className={`border-2 ${isActive ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-gray-300'}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Gateway Status</CardTitle>
          <div className={`h-3 w-3 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isActive ? 'Active' : 'Inactive'}
          </div>
          <p className="text-xs text-muted-foreground flex items-center mt-1">
            <Zap className="h-3 w-3 mr-1" />
            {isActive ? 'Monitoring in real-time' : 'Gateway offline'}
          </p>
        </CardContent>
      </Card>

      {/* Total Requests */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalRequests.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground flex items-center">
            <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
            +12% from last hour
          </p>
        </CardContent>
      </Card>

      {/* Blocked Requests */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Blocked Requests</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{blockedRequests}</div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-muted-foreground">
              {blockRate.toFixed(1)}% block rate
            </p>
          </div>
          <Progress value={blockRate} className="h-1 mt-2" />
        </CardContent>
      </Card>

      {/* Average Latency */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{averageLatency}ms</div>
          <p className="text-xs text-muted-foreground">
            Processing time
          </p>
        </CardContent>
      </Card>

      {/* Recent Threats - Full Width */}
      <Card className="lg:col-span-2 xl:col-span-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Recent Threat Detections
          </CardTitle>
          <CardDescription>Latest security threats detected and blocked</CardDescription>
        </CardHeader>
        <CardContent>
          {recentThreats.length > 0 ? (
            <div className="space-y-3">
              {recentThreats.map((threat) => (
                <div key={threat.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-lg">{getThreatIcon(threat.type)}</div>
                    <div>
                      <div className="font-medium capitalize">
                        {threat.type.replace('_', ' ')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {threat.description}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right text-xs text-muted-foreground">
                      {new Date(threat.timestamp).toLocaleTimeString()}
                    </div>
                    <Badge className={getSeverityColor(threat.severity)}>
                      {threat.severity}
                    </Badge>
                    <Badge className={threat.blocked ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}>
                      {threat.blocked ? 'Blocked' : 'Flagged'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No threats detected recently</p>
              <p className="text-sm">Your LLM gateway is secure</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
