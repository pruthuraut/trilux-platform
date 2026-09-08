import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Activity, 
  AlertTriangle, 
  Clock, 
  Filter,
  Search,
  Shield,
  CheckCircle,
  XCircle,
  Zap,
  Eye,
  Download
} from 'lucide-react'

interface LogEntry {
  id: string
  timestamp: string
  method: 'POST' | 'GET'
  endpoint: string
  prompt: string
  response: string
  status: 'allowed' | 'blocked' | 'flagged'
  threats: string[]
  latency: number
  tokens: number
  provider: string
  userId?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

interface LiveLogsProps {
  logs: LogEntry[]
  isRealTime: boolean
  onToggleRealTime: () => void
  onViewDetails: (logId: string) => void
}

export default function LiveLogs({
  logs,
  isRealTime,
  onToggleRealTime,
  onViewDetails
}: LiveLogsProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new logs arrive in real-time mode
  useEffect(() => {
    if (isRealTime && scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [logs, isRealTime])

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.provider.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter

    return matchesSearch && matchesStatus && matchesSeverity
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'allowed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'blocked':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'flagged':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'allowed':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800'
      case 'blocked':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800'
      case 'flagged':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800'
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

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const truncateText = (text: string, maxLength: number = 100) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Live Request Logs
              <Badge className={`${isRealTime ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}`}>
                {isRealTime ? 'Live' : 'Paused'}
              </Badge>
            </CardTitle>
            <CardDescription>
              Real-time monitoring of LLM requests and security analysis
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={isRealTime ? "default" : "outline"}
              size="sm"
              onClick={onToggleRealTime}
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              {isRealTime ? 'Pause' : 'Start'} Live
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs by prompt, endpoint, or provider..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="all">All Status</option>
              <option value="allowed">Allowed</option>
              <option value="blocked">Blocked</option>
              <option value="flagged">Flagged</option>
            </select>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="all">All Severity</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[600px] px-6" ref={scrollAreaRef}>
          <div className="space-y-2">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-4 border rounded-lg transition-all hover:shadow-md ${
                    log.status === 'blocked' ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20' :
                    log.status === 'flagged' ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20' :
                    'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(log.status)}
                        <Badge variant="outline" className="text-xs">
                          {log.method}
                        </Badge>
                        <span className="text-sm font-medium">{log.provider}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(log.timestamp)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {log.latency}ms
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">Prompt:</span>
                          <p className="text-sm text-foreground mt-1">
                            {truncateText(log.prompt)}
                          </p>
                        </div>

                        {log.threats.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            <span className="text-xs font-medium text-muted-foreground">Threats:</span>
                            {log.threats.map((threat, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {threat}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Badge className={getStatusColor(log.status)}>
                        {log.status}
                      </Badge>
                      <Badge className={getSeverityColor(log.severity)}>
                        {log.severity}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(log.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No logs found matching your criteria</p>
                <p className="text-sm">
                  {isRealTime ? 'Waiting for incoming requests...' : 'Start live monitoring to see real-time logs'}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
