'use client'

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  History,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  Calendar,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Globe,
  Play,
  Zap,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  RefreshCw,
  Plus,
  Settings,
  BarChart3,
  Activity,
  Target,
  ChevronDown,
  ExternalLink,
  Copy,
  Archive,
  ArrowUpDown,
  BarChart2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface ApiAnalysisRecord {
  id: string
  endpointName: string
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  analysisDate: Date
  status: 'completed' | 'in-progress' | 'failed'
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  vulnerabilitiesFound: number
  responseTime: number
  statusCode: number
  testsRun: number
  securityScore: number
  analyst: string
  tags?: string[]
  duration?: number
}

type SortField = 'endpointName' | 'analysisDate' | 'riskLevel' | 'vulnerabilitiesFound' | 'status' | 'securityScore'
type SortOrder = 'asc' | 'desc'

export default function ApiTestingHistory() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [riskFilter, setRiskFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [sortField, setSortField] = useState<SortField>('analysisDate')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // Enhanced mock data for API analysis history
  const analysisHistory = useMemo<ApiAnalysisRecord[]>(() => [
    {
      id: 'API-001',
      endpointName: 'User Authentication API',
      url: 'https://api.bank.com/auth/login',
      method: 'POST',
      analysisDate: new Date('2026-02-05'),
      status: 'completed',
      riskLevel: 'high',
      vulnerabilitiesFound: 8,
      responseTime: 245,
      statusCode: 200,
      testsRun: 15,
      securityScore: 65,
      analyst: 'John Doe',
      tags: ['Authentication', 'Banking', 'Critical'],
      duration: 180
    },
    {
      id: 'API-002',
      endpointName: 'Product Catalog',
      url: 'https://api.shop.com/products',
      method: 'GET',
      analysisDate: new Date('2026-02-02'),
      status: 'completed',
      riskLevel: 'medium',
      vulnerabilitiesFound: 3,
      responseTime: 120,
      statusCode: 200,
      testsRun: 12,
      securityScore: 78,
      analyst: 'Jane Smith',
      tags: ['E-commerce', 'Public'],
      duration: 95
    },
    {
      id: 'API-003',
      endpointName: 'User Profile Update',
      url: 'https://api.social.com/user/profile',
      method: 'PUT',
      analysisDate: new Date('2026-01-31'),
      status: 'in-progress',
      riskLevel: 'medium',
      vulnerabilitiesFound: 0,
      responseTime: 0,
      statusCode: 0,
      testsRun: 0,
      securityScore: 0,
      analyst: 'Mike Johnson',
      tags: ['Social Media', 'User Data'],
      duration: 0
    },
    {
      id: 'API-004',
      endpointName: 'Payment Processing',
      url: 'https://api.payment.com/process',
      method: 'POST',
      analysisDate: new Date('2026-01-28'),
      status: 'failed',
      riskLevel: 'critical',
      vulnerabilitiesFound: 0,
      responseTime: 0,
      statusCode: 500,
      testsRun: 5,
      securityScore: 0,
      analyst: 'Sarah Wilson',
      tags: ['Payment', 'Financial', 'PCI'],
      duration: 45
    },
    {
      id: 'API-005',
      endpointName: 'Data Export',
      url: 'https://api.data.com/export',
      method: 'GET',
      analysisDate: new Date('2026-01-26'),
      status: 'completed',
      riskLevel: 'critical',
      vulnerabilitiesFound: 15,
      responseTime: 890,
      statusCode: 200,
      testsRun: 20,
      securityScore: 35,
      analyst: 'David Brown',
      tags: ['Data Export', 'GDPR', 'Sensitive'],
      duration: 320
    },
    {
      id: 'API-006',
      endpointName: 'File Upload Service',
      url: 'https://api.storage.com/upload',
      method: 'POST',
      analysisDate: new Date('2026-01-25'),
      status: 'completed',
      riskLevel: 'low',
      vulnerabilitiesFound: 1,
      responseTime: 1200,
      statusCode: 201,
      testsRun: 18,
      securityScore: 92,
      analyst: 'Emma Davis',
      tags: ['File Upload', 'Storage'],
      duration: 150
    }
  ], [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'in-progress': return <Clock className="h-4 w-4 animate-pulse" />
      case 'failed': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30'
      case 'in-progress': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30'
      case 'failed': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30'
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950/30'
    }
  }

  const getRiskBadge = (risk: string) => {
    const variants = {
      low: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-800',
      critical: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800'
    }

    return (
      <Badge className={cn('font-semibold border', variants[risk as keyof typeof variants])} variant="outline">
        {risk.toUpperCase()}
      </Badge>
    )
  }

  const getMethodBadge = (method: string) => {
    const variants = {
      GET: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800',
      POST: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800',
      PUT: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-800',
      DELETE: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800',
      PATCH: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800'
    }
    return (
      <Badge variant="outline" className={cn('font-mono text-xs font-semibold', variants[method as keyof typeof variants])}>
        {method}
      </Badge>
    )
  }

  const getSecurityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    if (score >= 40) return 'text-orange-600 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getSecurityScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-500 to-green-600'
    if (score >= 60) return 'from-yellow-500 to-yellow-600'
    if (score >= 40) return 'from-orange-500 to-orange-600'
    return 'from-red-500 to-red-600'
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const filteredAndSortedHistory = useMemo(() => {
    let filtered = analysisHistory.filter(record => {
      const matchesSearch = record.endpointName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.analyst.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || record.status === statusFilter
      const matchesRisk = riskFilter === 'all' || record.riskLevel === riskFilter
      const matchesMethod = methodFilter === 'all' || record.method === methodFilter

      return matchesSearch && matchesStatus && matchesRisk && matchesMethod
    })

    // Sort the filtered results
    filtered.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'endpointName':
          comparison = a.endpointName.localeCompare(b.endpointName)
          break
        case 'analysisDate':
          comparison = a.analysisDate.getTime() - b.analysisDate.getTime()
          break
        case 'vulnerabilitiesFound':
          comparison = a.vulnerabilitiesFound - b.vulnerabilitiesFound
          break
        case 'riskLevel':
          const riskOrder = { low: 1, medium: 2, high: 3, critical: 4 }
          comparison = riskOrder[a.riskLevel] - riskOrder[b.riskLevel]
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        case 'securityScore':
          comparison = a.securityScore - b.securityScore
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [analysisHistory, searchTerm, statusFilter, riskFilter, methodFilter, sortField, sortOrder])

  const stats = useMemo(() => {
    const total = analysisHistory.length
    const completed = analysisHistory.filter(r => r.status === 'completed').length
    const inProgress = analysisHistory.filter(r => r.status === 'in-progress').length
    const failed = analysisHistory.filter(r => r.status === 'failed').length
    const totalVulnerabilities = analysisHistory.reduce((sum, r) => sum + r.vulnerabilitiesFound, 0)
    const highRiskApis = analysisHistory.filter(r => r.riskLevel === 'critical' || r.riskLevel === 'high').length
    const avgScore = Math.round(analysisHistory.filter(r => r.securityScore > 0).reduce((sum, r) => sum + r.securityScore, 0) / analysisHistory.filter(r => r.securityScore > 0).length) || 0
    const avgResponseTime = Math.round(analysisHistory.filter(r => r.responseTime > 0).reduce((sum, r) => sum + r.responseTime, 0) / analysisHistory.filter(r => r.responseTime > 0).length) || 0

    return { total, completed, inProgress, failed, totalVulnerabilities, highRiskApis, avgScore, avgResponseTime }
  }, [analysisHistory])

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <History className="h-7 w-7 text-primary" />
            </div>
            API Testing History
          </h1>
          <p className="text-muted-foreground">
            Track and analyze your API security testing results
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => window.location.href = '/api-testing'}>
            <Plus className="h-4 w-4 mr-2" />
            New Analysis
          </Button>
        </div>
      </div>

      {/* Summary Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All time records
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% success rate
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vulnerabilities</CardTitle>
            <Shield className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.totalVulnerabilities}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.highRiskApis} high-risk APIs
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Security Score</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", getSecurityScoreColor(stats.avgScore))}>{stats.avgScore}/100</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.avgResponseTime}ms avg response
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Filters</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setRiskFilter('all')
                setMethodFilter('all')
              }}
            >
              Clear all
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search endpoints, URLs, or analysts..."
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
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risks</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>

            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          Showing <span className="font-medium text-foreground">{filteredAndSortedHistory.length}</span> of{' '}
          <span className="font-medium text-foreground">{analysisHistory.length}</span> analyses
        </p>
      </div>

      {/* Analysis Records Table */}
      <Card>
        <CardContent className="p-0">
          {filteredAndSortedHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="p-4 bg-muted/50 rounded-full mb-4">
                <History className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No analyses found</h3>
              <p className="text-muted-foreground text-center max-w-sm mb-6">
                {searchTerm || statusFilter !== 'all' || riskFilter !== 'all' || methodFilter !== 'all'
                  ? 'Try adjusting your filters or search criteria to find what you\'re looking for.'
                  : 'Get started by running your first API security analysis.'}
              </p>
              {!searchTerm && statusFilter === 'all' && riskFilter === 'all' && methodFilter === 'all' && (
                <Button onClick={() => window.location.href = '/api-testing'}>
                  <Plus className="h-4 w-4 mr-2" />
                  Start New Analysis
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[280px]">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 font-semibold"
                        onClick={() => handleSort('endpointName')}
                      >
                        Endpoint
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 font-semibold"
                        onClick={() => handleSort('status')}
                      >
                        Status
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 font-semibold"
                        onClick={() => handleSort('riskLevel')}
                      >
                        Risk Level
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 font-semibold"
                        onClick={() => handleSort('vulnerabilitiesFound')}
                      >
                        Vulnerabilities
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 font-semibold"
                        onClick={() => handleSort('securityScore')}
                      >
                        Security Score
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 font-semibold"
                        onClick={() => handleSort('analysisDate')}
                      >
                        Analysis Date
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedHistory.map((record) => (
                    <TableRow key={record.id} className="group">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{record.endpointName}</div>
                          <div className="text-xs text-muted-foreground font-mono truncate max-w-[260px]">
                            {record.url}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs text-muted-foreground">{record.id}</span>
                            {record.tags && record.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getMethodBadge(record.method)}</TableCell>
                      <TableCell>
                        <Badge className={cn('gap-1.5 font-medium', getStatusColor(record.status))} variant="secondary">
                          {getStatusIcon(record.status)}
                          {record.status === 'in-progress' ? 'In Progress' : record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{getRiskBadge(record.riskLevel)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-semibold">{record.vulnerabilitiesFound}</span>
                          {record.vulnerabilitiesFound > 0 && (
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {record.securityScore > 0 ? (
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={cn('h-full transition-all duration-300 bg-gradient-to-r', getSecurityScoreGradient(record.securityScore))}
                                style={{ width: `${record.securityScore}%` }}
                              />
                            </div>
                            <span className={cn('text-sm font-bold min-w-[3ch]', getSecurityScoreColor(record.securityScore))}>
                              {record.securityScore}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {record.analysisDate.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
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
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Download Report
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <BarChart3 className="h-4 w-4 mr-2" />
                              View Analytics
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy URL
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Analysis
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Analytics Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Analytics Overview
          </CardTitle>
          <CardDescription>
            Comprehensive insights from your API security testing history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Success Rate</span>
                <span className="text-lg font-bold text-green-600">
                  {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                </span>
              </div>
              <Progress value={stats.total > 0 ? (stats.completed / stats.total) * 100 : 0} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {stats.completed} of {stats.total} analyses completed successfully
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Risk Distribution</span>
                <span className="text-lg font-bold text-orange-600">{stats.highRiskApis}</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Critical/High</span>
                  <span>{stats.total > 0 ? Math.round((stats.highRiskApis / stats.total) * 100) : 0}%</span>
                </div>
                <Progress value={stats.total > 0 ? (stats.highRiskApis / stats.total) * 100 : 0} className="h-1.5" />
              </div>
              <p className="text-xs text-muted-foreground">
                High-risk endpoints requiring immediate attention
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg Performance</span>
                <span className="text-lg font-bold text-blue-600">{stats.avgResponseTime}ms</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Response Time</span>
                  <span className={stats.avgResponseTime < 500 ? 'text-green-600' : stats.avgResponseTime < 1000 ? 'text-yellow-600' : 'text-red-600'}>
                    {stats.avgResponseTime < 500 ? 'Excellent' : stats.avgResponseTime < 1000 ? 'Good' : 'Needs Improvement'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Average response time across all endpoints
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Security Health</span>
                <span className={cn("text-lg font-bold", getSecurityScoreColor(stats.avgScore))}>
                  {stats.avgScore}/100
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Overall Score</span>
                  <span>{stats.avgScore >= 80 ? 'Excellent' : stats.avgScore >= 60 ? 'Good' : stats.avgScore >= 40 ? 'Fair' : 'Poor'}</span>
                </div>
                <Progress value={stats.avgScore} className="h-1.5" />
              </div>
              <p className="text-xs text-muted-foreground">
                Average security score across completed analyses
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
