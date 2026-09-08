'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  History, 
  Search, 
  Download, 
  Eye, 
  Trash2, 
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Puzzle,
  MoreVertical,
  RefreshCw,
  Plus,
  Loader2,
  FileArchive,
  HardDrive,
  AlertCircle,
  Chrome,
  Globe,
  Gauge
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import withAuth from '@/utils/withAuth'
import { getAccessTokenForAPI } from '@/utils/authUtils'

interface Project {
  id: number
  project_name: string
}

interface BrowserExtensionAnalysis {
  id: number
  scan_uuid: string
  extension_name: string
  extension_version: string
  extension_type: string
  extension_file: string
  file_size: number
  manifest_version: number | null
  permissions: string[]
  analysis_result: string | object | null
  browser_extension_analysis_status: string
  total_vulnerabilities: number
  code_vulnerabilities: number
  permission_issues: number
  critical_count: number
  high_count: number
  medium_count: number
  low_count: number
  risk_score: number
  error_message: string
  created_at: string
  updated_at: string
  user_id: number
  project: Project
}

function BrowserExtensionTestingHistory() {
  const router = useRouter()
  const [analyses, setAnalyses] = useState<BrowserExtensionAnalysis[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchAnalyses = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true)
    else setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/browser-extension-analysis/`, {
        headers: {
          'Authorization': `Bearer ${getAccessTokenForAPI()}`,
          'ngrok-skip-browser-warning': 'true',
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch analyses: ${response.status}`)
      }

      const data = await response.json()
      setAnalyses(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching analyses:', err)
      setError('Failed to load analysis history. Please try again.')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAnalyses()
  }, [])

  // Auto-refresh for in-progress scans
  useEffect(() => {
    const hasInProgress = analyses.some(a => 
      a.browser_extension_analysis_status === 'InProgress' || 
      a.browser_extension_analysis_status === 'Waiting'
    )
    
    if (hasInProgress) {
      const interval = setInterval(() => fetchAnalyses(true), 10000)
      return () => clearInterval(interval)
    }
  }, [analyses])

  const filteredAnalyses = useMemo(() => {
    return analyses.filter(analysis => {
      const matchesSearch = !searchTerm || 
        analysis.extension_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        analysis.project.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        analysis.scan_uuid.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === 'all' || 
        analysis.browser_extension_analysis_status.toLowerCase() === statusFilter.toLowerCase()

      return matchesSearch && matchesStatus
    })
  }, [analyses, searchTerm, statusFilter])

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      case 'inprogress':
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            In Progress
          </Badge>
        )
      case 'waiting':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Waiting
          </Badge>
        )
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            {status}
          </Badge>
        )
    }
  }

  const getRiskBadge = (analysis: BrowserExtensionAnalysis) => {
    if (analysis.browser_extension_analysis_status !== 'Completed') {
      return <span className="text-muted-foreground">-</span>
    }
    
    if (analysis.critical_count > 0) {
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          Critical
        </Badge>
      )
    }
    if (analysis.high_count > 0) {
      return (
        <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
          High
        </Badge>
      )
    }
    if (analysis.medium_count > 0) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
          Medium
        </Badge>
      )
    }
    if (analysis.low_count > 0) {
      return (
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          Low
        </Badge>
      )
    }
    return (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
        Clean
      </Badge>
    )
  }

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600'
    if (score >= 60) return 'text-orange-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-green-600'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getExtensionIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'CRX':
        return <Chrome className="h-4 w-4 text-primary" />
      case 'XPI':
        return <Globe className="h-4 w-4 text-orange-500" />
      default:
        return <Puzzle className="h-4 w-4 text-primary" />
    }
  }

  // Stats
  const stats = useMemo(() => ({
    total: analyses.length,
    completed: analyses.filter(a => a.browser_extension_analysis_status === 'Completed').length,
    inProgress: analyses.filter(a => a.browser_extension_analysis_status === 'InProgress' || a.browser_extension_analysis_status === 'Waiting').length,
    failed: analyses.filter(a => a.browser_extension_analysis_status === 'Failed').length,
    totalVulnerabilities: analyses.reduce((sum, a) => sum + a.total_vulnerabilities, 0)
  }), [analyses])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading analysis history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <History className="h-7 w-7 text-primary" />
            </div>
            Extension Analysis History
          </h1>
          <p className="text-muted-foreground mt-2">
            View and manage all browser extension security analyses
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => fetchAnalyses(true)}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => router.push('/browser-extension-testing')} className="gap-2">
            <Plus className="h-4 w-4" />
            New Analysis
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Scans</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Puzzle className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vulnerabilities</p>
                <p className="text-2xl font-bold text-amber-600">{stats.totalVulnerabilities}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by extension name, project, or scan ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="inprogress">In Progress</SelectItem>
            <SelectItem value="waiting">Waiting</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <span className="text-destructive">{error}</span>
            <Button variant="outline" size="sm" onClick={() => fetchAnalyses()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-0">
          {filteredAnalyses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 rounded-full bg-muted/50 mb-4">
                <FileArchive className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No analyses found</h3>
              <p className="text-muted-foreground max-w-sm">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your filters to see more results.'
                  : 'Start by uploading a browser extension for security analysis.'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button onClick={() => router.push('/browser-extension-testing')} className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  New Analysis
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Extension Name</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead>Vulnerabilities</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAnalyses.map((analysis) => (
                  <TableRow 
                    key={analysis.scan_uuid} 
                    className="cursor-pointer hover:bg-muted/30"
                    onClick={() => router.push(`/browser-extension-testing/details/${analysis.scan_uuid}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          {getExtensionIcon(analysis.extension_type)}
                        </div>
                        <div>
                          <p className="font-medium">{analysis.extension_name}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {analysis.scan_uuid.slice(0, 8)}...
                            {analysis.extension_version && (
                              <span className="ml-2">v{analysis.extension_version}</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{analysis.project.project_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{analysis.extension_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatFileSize(analysis.file_size)}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(analysis.browser_extension_analysis_status)}</TableCell>
                    <TableCell>
                      {analysis.browser_extension_analysis_status === 'Completed' ? (
                        <div className="flex items-center gap-2">
                          <Gauge className={`h-4 w-4 ${getRiskScoreColor(analysis.risk_score)}`} />
                          <span className={`font-medium ${getRiskScoreColor(analysis.risk_score)}`}>
                            {analysis.risk_score}/100
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {analysis.browser_extension_analysis_status === 'Completed' ? (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{analysis.total_vulnerabilities}</span>
                          {analysis.total_vulnerabilities > 0 && (
                            <div className="flex gap-1">
                              {analysis.critical_count > 0 && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                  {analysis.critical_count}C
                                </span>
                              )}
                              {analysis.high_count > 0 && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                                  {analysis.high_count}H
                                </span>
                              )}
                              {analysis.medium_count > 0 && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                                  {analysis.medium_count}M
                                </span>
                              )}
                              {analysis.low_count > 0 && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                  {analysis.low_count}L
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(analysis.created_at)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/browser-extension-testing/details/${analysis.scan_uuid}`)
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {analysis.browser_extension_analysis_status === 'Completed' && (
                            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                              <Download className="h-4 w-4 mr-2" />
                              Download Report
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default withAuth(BrowserExtensionTestingHistory)
