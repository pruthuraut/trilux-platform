'use client';
import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Shield, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Share2, 
  RefreshCw, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Activity, 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  LineChart, 
  Hash, 
  Tag, 
  Copy, 
  ExternalLink, 
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  Minus,
  Plus,
  Info,
  Bell,
  BellRing,
  Flag,
  Star,
  Bookmark,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Archive,
  Trash2,
  Edit,
  Play,
  Pause,
  Square,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  GitBranch,
  Workflow,
  MapPin,
  Navigation,
  Route,
  Gauge,
  Brain,
  Lightbulb,
  Sparkles,
  Container,
  Boxes,
  Package,
  Cog,
  Wrench,
  Hammer,
  Power,
  PowerOff,
  FileText,
  Folder,
  FolderOpen,
  File,
  Image,
  Video,
  Music,
  FileCheck,
  FileX,
  FileWarning,
  Server,
  Cloud,
  HardDrive,
  Monitor,
  Cpu,
  MemoryStick,
  Network,
  Globe,
  Users,
  User,
  UserCheck,
  UserX,
  UserPlus,
  Settings,
  Calendar,
  Building,
  Home,
  Layers,
  Target,
  Zap
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import withAuth from '@/utils/withAuth';

interface DataAsset {
  id: string;
  name: string;
  type: 'database' | 'file-share' | 'data-lake' | 'api-endpoint' | 'backup' | 'log-store' | 'cache' | 'stream';
  classification: 'public' | 'internal' | 'confidential' | 'restricted' | 'top-secret';
  sensitivity: 'low' | 'medium' | 'high' | 'critical';
  owner: string;
  location: string;
  environment: 'production' | 'staging' | 'development' | 'testing';
  size: {
    value: number;
    unit: 'KB' | 'MB' | 'GB' | 'TB' | 'PB';
  };
  recordCount?: number;
  lastAccessed: string;
  lastModified: string;
  encryption: {
    atRest: boolean;
    inTransit: boolean;
    algorithm?: string;
    keyManagement: 'aws-kms' | 'azure-key-vault' | 'gcp-kms' | 'hashicorp-vault' | 'manual';
  };
  access: {
    users: number;
    applications: number;
    lastLogin: string;
  };
  compliance: {
    frameworks: string[];
    status: 'compliant' | 'non-compliant' | 'under-review' | 'not-applicable';
    lastAudit: string;
  };
  security: {
    vulnerabilities: number;
    riskScore: number;
    incidents: number;
    alerts: number;
  };
  backup: {
    enabled: boolean;
    frequency: string;
    retention: string;
    lastBackup: string;
  };
  tags: string[];
}

interface DataFlow {
  id: string;
  source: string;
  destination: string;
  dataTypes: string[];
  frequency: 'real-time' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'on-demand';
  volume: {
    value: number;
    unit: 'KB' | 'MB' | 'GB' | 'TB';
    period: 'hour' | 'day' | 'week' | 'month';
  };
  encryption: boolean;
  authentication: boolean;
  monitoring: boolean;
  status: 'active' | 'inactive' | 'error' | 'paused';
  lastTransfer: string;
  errorRate: number;
  compliance: string[];
}

interface SecurityPolicy {
  id: string;
  name: string;
  category: 'access-control' | 'encryption' | 'classification' | 'retention' | 'backup' | 'monitoring';
  description: string;
  scope: string[];
  rules: {
    condition: string;
    action: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }[];
  status: 'active' | 'inactive' | 'draft';
  compliance: string[];
  lastUpdated: string;
  violations: number;
}

interface DataIncident {
  id: string;
  title: string;
  type: 'data-breach' | 'unauthorized-access' | 'data-loss' | 'policy-violation' | 'compliance-issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  affectedAssets: string[];
  recordsAffected?: number;
  detectedAt: string;
  resolvedAt?: string;
  assignee: string;
  description: string;
  impact: string;
  mitigation: string[];
}

const DataSecurityHub = () => {
  const [selectedClassification, setSelectedClassification] = useState('all');
  const [selectedEnvironment, setSelectedEnvironment] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [activeView, setActiveView] = useState('assets');

  const dataAssets: DataAsset[] = [
    {
      id: 'asset-1',
      name: 'Customer Database (Primary)',
      type: 'database',
      classification: 'restricted',
      sensitivity: 'critical',
      owner: 'John Smith',
      location: 'AWS RDS us-east-1',
      environment: 'production',
      size: { value: 2.5, unit: 'TB' },
      recordCount: 15000000,
      lastAccessed: '2025-09-09T10:30:00Z',
      lastModified: '2025-09-09T09:15:00Z',
      encryption: {
        atRest: true,
        inTransit: true,
        algorithm: 'AES-256',
        keyManagement: 'aws-kms'
      },
      access: {
        users: 25,
        applications: 8,
        lastLogin: '2025-09-09T10:25:00Z'
      },
      compliance: {
        frameworks: ['GDPR', 'PCI DSS', 'SOC 2'],
        status: 'compliant',
        lastAudit: '2025-08-15T00:00:00Z'
      },
      security: {
        vulnerabilities: 0,
        riskScore: 25,
        incidents: 0,
        alerts: 2
      },
      backup: {
        enabled: true,
        frequency: 'Daily',
        retention: '90 days',
        lastBackup: '2025-09-09T02:00:00Z'
      },
      tags: ['production', 'customer-data', 'encrypted', 'critical']
    },
    {
      id: 'asset-2',
      name: 'Application Logs Data Lake',
      type: 'data-lake',
      classification: 'internal',
      sensitivity: 'medium',
      owner: 'Sarah Johnson',
      location: 'AWS S3 us-west-2',
      environment: 'production',
      size: { value: 500, unit: 'GB' },
      lastAccessed: '2025-09-09T10:00:00Z',
      lastModified: '2025-09-09T09:45:00Z',
      encryption: {
        atRest: true,
        inTransit: true,
        algorithm: 'AES-256',
        keyManagement: 'aws-kms'
      },
      access: {
        users: 12,
        applications: 15,
        lastLogin: '2025-09-09T09:30:00Z'
      },
      compliance: {
        frameworks: ['SOC 2', 'ISO 27001'],
        status: 'compliant',
        lastAudit: '2025-08-20T00:00:00Z'
      },
      security: {
        vulnerabilities: 1,
        riskScore: 35,
        incidents: 0,
        alerts: 1
      },
      backup: {
        enabled: true,
        frequency: 'Weekly',
        retention: '365 days',
        lastBackup: '2025-09-08T02:00:00Z'
      },
      tags: ['logs', 'analytics', 'encrypted', 'compliant']
    },
    {
      id: 'asset-3',
      name: 'Development Environment DB',
      type: 'database',
      classification: 'internal',
      sensitivity: 'low',
      owner: 'Mike Chen',
      location: 'AWS RDS us-east-1',
      environment: 'development',
      size: { value: 50, unit: 'GB' },
      recordCount: 100000,
      lastAccessed: '2025-09-09T08:45:00Z',
      lastModified: '2025-09-08T16:30:00Z',
      encryption: {
        atRest: false,
        inTransit: true,
        keyManagement: 'manual'
      },
      access: {
        users: 8,
        applications: 3,
        lastLogin: '2025-09-09T08:45:00Z'
      },
      compliance: {
        frameworks: ['SOC 2'],
        status: 'non-compliant',
        lastAudit: '2025-07-10T00:00:00Z'
      },
      security: {
        vulnerabilities: 3,
        riskScore: 65,
        incidents: 1,
        alerts: 5
      },
      backup: {
        enabled: false,
        frequency: 'None',
        retention: 'None',
        lastBackup: 'Never'
      },
      tags: ['development', 'test-data', 'non-compliant']
    },
    {
      id: 'asset-4',
      name: 'User Sessions Cache',
      type: 'cache',
      classification: 'confidential',
      sensitivity: 'high',
      owner: 'Lisa Wang',
      location: 'Redis Cluster',
      environment: 'production',
      size: { value: 10, unit: 'GB' },
      lastAccessed: '2025-09-09T10:30:00Z',
      lastModified: '2025-09-09T10:30:00Z',
      encryption: {
        atRest: true,
        inTransit: true,
        algorithm: 'AES-256',
        keyManagement: 'hashicorp-vault'
      },
      access: {
        users: 5,
        applications: 12,
        lastLogin: '2025-09-09T10:25:00Z'
      },
      compliance: {
        frameworks: ['GDPR', 'SOC 2'],
        status: 'compliant',
        lastAudit: '2025-08-25T00:00:00Z'
      },
      security: {
        vulnerabilities: 0,
        riskScore: 20,
        incidents: 0,
        alerts: 0
      },
      backup: {
        enabled: false,
        frequency: 'None',
        retention: 'TTL-based',
        lastBackup: 'N/A'
      },
      tags: ['cache', 'session-data', 'high-performance']
    }
  ];

  const dataFlows: DataFlow[] = [
    {
      id: 'flow-1',
      source: 'Web Application',
      destination: 'Customer Database',
      dataTypes: ['Personal Information', 'Transaction Data', 'User Preferences'],
      frequency: 'real-time',
      volume: { value: 50, unit: 'MB', period: 'hour' },
      encryption: true,
      authentication: true,
      monitoring: true,
      status: 'active',
      lastTransfer: '2025-09-09T10:29:00Z',
      errorRate: 0.01,
      compliance: ['GDPR', 'PCI DSS']
    },
    {
      id: 'flow-2',
      source: 'Customer Database',
      destination: 'Analytics Platform',
      dataTypes: ['Aggregated Metrics', 'Usage Statistics'],
      frequency: 'daily',
      volume: { value: 2, unit: 'GB', period: 'day' },
      encryption: true,
      authentication: true,
      monitoring: true,
      status: 'active',
      lastTransfer: '2025-09-09T02:00:00Z',
      errorRate: 0.00,
      compliance: ['SOC 2']
    },
    {
      id: 'flow-3',
      source: 'Application Logs',
      destination: 'Data Lake',
      dataTypes: ['Access Logs', 'Error Logs', 'Performance Metrics'],
      frequency: 'hourly',
      volume: { value: 500, unit: 'MB', period: 'hour' },
      encryption: true,
      authentication: true,
      monitoring: false,
      status: 'error',
      lastTransfer: '2025-09-09T09:00:00Z',
      errorRate: 2.5,
      compliance: ['SOC 2']
    }
  ];

  const securityPolicies: SecurityPolicy[] = [
    {
      id: 'policy-1',
      name: 'Data Classification and Handling',
      category: 'classification',
      description: 'Defines how data should be classified and handled based on sensitivity levels',
      scope: ['All Data Assets'],
      rules: [
        {
          condition: 'Data contains PII',
          action: 'Mark as Confidential or higher',
          severity: 'high'
        },
        {
          condition: 'Data classification is Restricted',
          action: 'Require encryption at rest and in transit',
          severity: 'critical'
        }
      ],
      status: 'active',
      compliance: ['GDPR', 'PCI DSS', 'SOC 2'],
      lastUpdated: '2025-08-15T00:00:00Z',
      violations: 2
    },
    {
      id: 'policy-2',
      name: 'Encryption Requirements',
      category: 'encryption',
      description: 'Mandatory encryption standards for data protection',
      scope: ['Production Databases', 'Customer Data'],
      rules: [
        {
          condition: 'Environment is Production',
          action: 'Enable AES-256 encryption',
          severity: 'critical'
        },
        {
          condition: 'Data contains payment information',
          action: 'Use PCI DSS compliant encryption',
          severity: 'critical'
        }
      ],
      status: 'active',
      compliance: ['PCI DSS', 'GDPR'],
      lastUpdated: '2025-08-10T00:00:00Z',
      violations: 1
    }
  ];

  const dataIncidents: DataIncident[] = [
    {
      id: 'incident-1',
      title: 'Unauthorized Database Access Attempt',
      type: 'unauthorized-access',
      severity: 'high',
      status: 'investigating',
      affectedAssets: ['asset-1'],
      detectedAt: '2025-09-09T08:30:00Z',
      assignee: 'Security Team',
      description: 'Multiple failed login attempts detected on production database',
      impact: 'No data accessed, security monitoring triggered alerts',
      mitigation: [
        'Blocked suspicious IP addresses',
        'Enhanced monitoring enabled',
        'Password reset for affected accounts'
      ]
    },
    {
      id: 'incident-2',
      title: 'Development Database Missing Encryption',
      type: 'policy-violation',
      severity: 'medium',
      status: 'open',
      affectedAssets: ['asset-3'],
      detectedAt: '2025-09-08T14:00:00Z',
      assignee: 'Mike Chen',
      description: 'Development database found without encryption at rest',
      impact: 'Non-production data exposed, compliance violation',
      mitigation: [
        'Enable encryption for development database',
        'Review all development environments',
        'Update security policies'
      ]
    }
  ];

  const handleStartScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 5000);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'high': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case 'medium': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'low': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      default: return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800';
    }
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'public': return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'internal': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'confidential': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'restricted': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case 'top-secret': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800';
      default: return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': 
      case 'compliant': 
      case 'resolved': 
      case 'closed': return 'text-green-600 dark:text-green-400';
      case 'inactive': 
      case 'non-compliant': 
      case 'open': return 'text-red-600 dark:text-red-400';
      case 'error': 
      case 'investigating': 
      case 'under-review': return 'text-yellow-600 dark:text-yellow-400';
      case 'paused': 
      case 'draft': return 'text-gray-600 dark:text-gray-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getAssetTypeIcon = (type: string) => {
    switch (type) {
      case 'database': return <Database className="w-4 h-4" />;
      case 'file-share': return <Folder className="w-4 h-4" />;
      case 'data-lake': return <HardDrive className="w-4 h-4" />;
      case 'api-endpoint': return <Globe className="w-4 h-4" />;
      case 'backup': return <Archive className="w-4 h-4" />;
      case 'log-store': return <FileText className="w-4 h-4" />;
      case 'cache': return <Zap className="w-4 h-4" />;
      case 'stream': return <Activity className="w-4 h-4" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score <= 25) return 'text-green-600 dark:text-green-400';
    if (score <= 50) return 'text-yellow-600 dark:text-yellow-400';
    if (score <= 75) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffHours >= 24) {
      return date.toLocaleDateString();
    } else if (diffHours >= 1) {
      return `${diffHours}h ago`;
    } else {
      return `${diffMinutes}m ago`;
    }
  };

  const formatSize = (size: { value: number; unit: string }) => {
    return `${size.value.toLocaleString()} ${size.unit}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                <Database className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Data Security
                </h1>
                <p className="text-lg text-muted-foreground">
                  Comprehensive data protection, classification, and security management
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="px-3 py-1">
              <Shield className="w-3 h-3 mr-1" />
              {dataAssets.filter(a => a.compliance.status === 'compliant').length} Compliant Assets
            </Badge>
            <Button 
              onClick={handleStartScan}
              disabled={isScanning}
              className="gap-2"
            >
              <Shield className={`w-4 h-4 ${isScanning ? 'animate-pulse' : ''}`} />
              {isScanning ? 'Scanning...' : 'Security Scan'}
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              label: 'Total Data Assets',
              value: dataAssets.length,
              icon: Database,
              color: 'blue',
              change: '+5.2%'
            },
            {
              label: 'Critical Assets',
              value: dataAssets.filter(a => a.sensitivity === 'critical').length,
              icon: AlertTriangle,
              color: 'red',
              change: '+2'
            },
            {
              label: 'Compliance Score',
              value: Math.round((dataAssets.filter(a => a.compliance.status === 'compliant').length / dataAssets.length) * 100),
              unit: '%',
              icon: CheckCircle,
              color: 'green',
              change: '+12%'
            },
            {
              label: 'Active Incidents',
              value: dataIncidents.filter(i => i.status === 'open' || i.status === 'investigating').length,
              icon: AlertCircle,
              color: 'orange',
              change: '-1'
            }
          ].map((metric, index) => (
            <Card key={index} className={`bg-gradient-to-br ${
              metric.color === 'blue' ? 'from-blue-500/10 to-blue-600/10 border-blue-200 dark:border-blue-800' :
              metric.color === 'red' ? 'from-red-500/10 to-red-600/10 border-red-200 dark:border-red-800' :
              metric.color === 'green' ? 'from-green-500/10 to-green-600/10 border-green-200 dark:border-green-800' :
              'from-orange-500/10 to-orange-600/10 border-orange-200 dark:border-orange-800'
            }`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${
                      metric.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                      metric.color === 'red' ? 'text-red-600 dark:text-red-400' :
                      metric.color === 'green' ? 'text-green-600 dark:text-green-400' :
                      'text-orange-600 dark:text-orange-400'
                    }`}>
                      {metric.label}
                    </p>
                    <p className={`text-3xl font-bold ${
                      metric.color === 'blue' ? 'text-blue-700 dark:text-blue-300' :
                      metric.color === 'red' ? 'text-red-700 dark:text-red-300' :
                      metric.color === 'green' ? 'text-green-700 dark:text-green-300' :
                      'text-orange-700 dark:text-orange-300'
                    }`}>
                      {metric.value.toLocaleString()}{metric.unit || ''}
                    </p>
                    <p className="text-xs flex items-center gap-1">
                      <ArrowUp className="w-3 h-3 text-green-600" />
                      {metric.change}
                    </p>
                  </div>
                  <metric.icon className={`w-8 h-8 ${
                    metric.color === 'blue' ? 'text-blue-500' :
                    metric.color === 'red' ? 'text-red-500' :
                    metric.color === 'green' ? 'text-green-500' :
                    'text-orange-500'
                  }`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View Selector */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          {[
            { id: 'assets', label: 'Data Assets', icon: Database },
            { id: 'flows', label: 'Data Flows', icon: GitBranch },
            { id: 'policies', label: 'Security Policies', icon: Shield },
            { id: 'incidents', label: 'Incidents', icon: AlertTriangle }
          ].map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                activeView === view.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <view.icon className="w-4 h-4" />
              {view.label}
            </button>
          ))}
        </div>

        {/* Search and Filters */}
        <Card className="bg-gradient-to-r from-card to-card/80 border-border/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder={`Search ${activeView}... (e.g., database name, owner, classification)`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-3 text-lg bg-background/50 border-border/70 focus:border-primary"
                />
              </div>
              <div className="flex gap-2">
                <Select value={selectedClassification} onValueChange={setSelectedClassification}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Classification" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classifications</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="confidential">Confidential</SelectItem>
                    <SelectItem value="restricted">Restricted</SelectItem>
                    <SelectItem value="top-secret">Top Secret</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedEnvironment} onValueChange={setSelectedEnvironment}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Environment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Environments</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="staging">Staging</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="testing">Testing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content based on active view */}
        {activeView === 'assets' && (
          <div className="space-y-4">
            {dataAssets.map((asset) => (
              <Card key={asset.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card/80 border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="gap-1">
                          {getAssetTypeIcon(asset.type)}
                          {asset.type}
                        </Badge>
                        <Badge className={getClassificationColor(asset.classification)}>
                          {asset.classification}
                        </Badge>
                        <Badge className={getSeverityColor(asset.sensitivity)}>
                          {asset.sensitivity}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {asset.environment}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors">
                        {asset.name}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {asset.location} • {formatSize(asset.size)} • Owner: {asset.owner}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Risk Score: <span className={`font-medium ${getRiskScoreColor(asset.security.riskScore)}`}>
                          {asset.security.riskScore}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Last accessed: {formatTimestamp(asset.lastAccessed)}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {/* Encryption Status */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Encryption</h4>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">At Rest:</span>
                          {asset.encryption.atRest ? (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-500" />
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">In Transit:</span>
                          {asset.encryption.inTransit ? (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-500" />
                          )}
                        </div>
                        {asset.encryption.algorithm && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Algorithm:</span>
                            <span>{asset.encryption.algorithm}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Access Information */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Access</h4>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Users:</span>
                          <span>{asset.access.users}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Applications:</span>
                          <span>{asset.access.applications}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Last Login:</span>
                          <span>{formatTimestamp(asset.access.lastLogin)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Compliance Status */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Compliance</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${getStatusColor(asset.compliance.status)}`}>
                            {asset.compliance.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {asset.compliance.frameworks.map((framework, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {framework}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Security Metrics */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Security</h4>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Vulnerabilities:</span>
                          <span className={asset.security.vulnerabilities > 0 ? 'text-red-600' : 'text-green-600'}>
                            {asset.security.vulnerabilities}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Incidents:</span>
                          <span className={asset.security.incidents > 0 ? 'text-red-600' : 'text-green-600'}>
                            {asset.security.incidents}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Alerts:</span>
                          <span className={asset.security.alerts > 0 ? 'text-yellow-600' : 'text-green-600'}>
                            {asset.security.alerts}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Backup Information */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Backup & Recovery</h4>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Enabled:</span>
                        {asset.backup.enabled ? (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-500" />
                        )}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Frequency:</span>
                        <span>{asset.backup.frequency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Retention:</span>
                        <span>{asset.backup.retention}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Backup:</span>
                        <span>{asset.backup.lastBackup === 'Never' ? 'Never' : formatTimestamp(asset.backup.lastBackup)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {asset.tags.map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>

                <CardFooter className="pt-0">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="w-4 h-4" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Shield className="w-4 h-4" />
                        Security Scan
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Edit className="w-4 h-4" />
                        Configure
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Star className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {activeView === 'flows' && (
          <div className="space-y-4">
            {dataFlows.map((flow) => (
              <Card key={flow.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card/80 border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="gap-1">
                          <GitBranch className="w-3 h-3" />
                          {flow.frequency}
                        </Badge>
                        <Badge className={getStatusColor(flow.status)}>
                          {flow.status}
                        </Badge>
                        {flow.encryption && (
                          <Badge variant="secondary" className="text-xs">
                            <Lock className="w-3 h-3 mr-1" />
                            Encrypted
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors">
                        {flow.source} → {flow.destination}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {flow.volume.value} {flow.volume.unit}/{flow.volume.period} • Error Rate: {flow.errorRate}%
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Last Transfer: {formatTimestamp(flow.lastTransfer)}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Data Types */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Data Types</h4>
                      <div className="flex flex-wrap gap-1">
                        {flow.dataTypes.map((type, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Security Features */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Security</h4>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Encryption:</span>
                          {flow.encryption ? (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-500" />
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Authentication:</span>
                          {flow.authentication ? (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-500" />
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Monitoring:</span>
                          {flow.monitoring ? (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-500" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Compliance */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Compliance</h4>
                      <div className="flex flex-wrap gap-1">
                        {flow.compliance.map((framework, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {framework}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-0">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Activity className="w-4 h-4" />
                        Monitor
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Settings className="w-4 h-4" />
                        Configure
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Analytics
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Bookmark className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {activeView === 'policies' && (
          <div className="space-y-4">
            {securityPolicies.map((policy) => (
              <Card key={policy.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card/80 border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {policy.category.replace('-', ' ').toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(policy.status)}>
                          {policy.status}
                        </Badge>
                        {policy.violations > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {policy.violations} Violations
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors">
                        {policy.name}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {policy.description}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Updated: {formatTimestamp(policy.lastUpdated)}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Policy Rules</h4>
                    <div className="space-y-2">
                      {policy.rules.map((rule, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-background/50 border border-border/50">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{rule.condition}</p>
                              <p className="text-xs text-muted-foreground mt-1">{rule.action}</p>
                            </div>
                            <Badge className={getSeverityColor(rule.severity)}>
                              {rule.severity}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Scope</h4>
                      <div className="flex flex-wrap gap-1">
                        {policy.scope.map((item, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Compliance Frameworks</h4>
                      <div className="flex flex-wrap gap-1">
                        {policy.compliance.map((framework, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {framework}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-0">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Edit className="w-4 h-4" />
                        Edit Policy
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Validate
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <FileText className="w-4 h-4" />
                        Report
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Bookmark className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {activeView === 'incidents' && (
          <div className="space-y-4">
            {dataIncidents.map((incident) => (
              <Card key={incident.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card/80 border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getSeverityColor(incident.severity)}>
                          {incident.severity}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {incident.type.replace('-', ' ').toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(incident.status)}>
                          {incident.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors">
                        {incident.title}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {incident.description}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Detected: {formatTimestamp(incident.detectedAt)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Assignee: {incident.assignee}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Impact Assessment</h4>
                      <div className="p-3 rounded-lg bg-background/50 border border-border/50">
                        <p className="text-sm text-muted-foreground">{incident.impact}</p>
                        {incident.recordsAffected && (
                          <p className="text-xs text-red-600 mt-1">
                            Records Affected: {incident.recordsAffected.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Mitigation Steps</h4>
                      <div className="space-y-1">
                        {incident.mitigation.map((step, idx) => (
                          <div key={idx} className="p-2 rounded bg-background/50 border border-border/50">
                            <p className="text-xs text-muted-foreground">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Affected Assets</h4>
                    <div className="flex flex-wrap gap-1">
                      {incident.affectedAssets.map((assetId, idx) => {
                        const asset = dataAssets.find(a => a.id === assetId);
                        return asset ? (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {asset.name}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-0">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="w-4 h-4" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <MessageCircle className="w-4 h-4" />
                        Add Note
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Resolve
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Flag className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <Card className="bg-gradient-to-r from-muted/30 to-muted/10 border-border/30">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Data Security Management</h3>
                <p className="text-muted-foreground">
                  Comprehensive data protection, classification, and security policy management
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Data Asset
                </Button>
                <Button variant="outline" className="gap-2">
                  <FileText className="w-4 h-4" />
                  Compliance Report
                </Button>
                <Button className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  AI Classification
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default withAuth(DataSecurityHub);
