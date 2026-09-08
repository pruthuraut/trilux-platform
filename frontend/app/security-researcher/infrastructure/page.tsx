'use client';
import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Cloud, 
  Shield, 
  AlertTriangle, 
  Activity, 
  Eye, 
  Search, 
  Filter, 
  Download, 
  Share2, 
  RefreshCw, 
  Clock, 
  Target, 
  Zap, 
  Database, 
  Network, 
  Globe, 
  Lock, 
  Unlock, 
  Bug, 
  Code, 
  FileText, 
  Calendar, 
  Users, 
  Building, 
  HardDrive, 
  Monitor, 
  Cpu, 
  MemoryStick, 
  Layers, 
  Settings, 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  LineChart, 
  Hash, 
  Tag, 
  Link, 
  Copy, 
  ExternalLink, 
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  Minus,
  Plus,
  Info,
  CheckCircle,
  XCircle,
  AlertCircle,
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
  PowerOff
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

interface InfrastructureAsset {
  id: string;
  name: string;
  type: 'server' | 'container' | 'vm' | 'database' | 'load-balancer' | 'storage' | 'network-device' | 'security-appliance';
  environment: 'production' | 'staging' | 'development' | 'testing' | 'disaster-recovery';
  provider: 'aws' | 'azure' | 'gcp' | 'on-premise' | 'hybrid';
  region: string;
  status: 'running' | 'stopped' | 'maintenance' | 'error' | 'unknown';
  healthScore: number;
  securityScore: number;
  lastUpdated: string;
  specifications: {
    cpu: string;
    memory: string;
    storage: string;
    network: string;
  };
  security: {
    encryption: boolean;
    backups: boolean;
    monitoring: boolean;
    accessControl: boolean;
    compliance: string[];
    vulnerabilities: number;
  };
  cost: {
    monthly: number;
    currency: string;
  };
  tags: string[];
  dependencies: string[];
}

interface SecurityConfiguration {
  id: string;
  name: string;
  category: 'access-control' | 'encryption' | 'monitoring' | 'compliance' | 'backup' | 'network-security';
  description: string;
  status: 'compliant' | 'non-compliant' | 'warning' | 'not-configured';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  affectedAssets: string[];
  lastChecked: string;
  recommendation: string;
  remediationSteps: string[];
  complianceFrameworks: string[];
}

interface InfrastructureMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  threshold: {
    warning: number;
    critical: number;
  };
  category: 'performance' | 'security' | 'cost' | 'availability';
  timestamp: string;
}

interface CloudResource {
  id: string;
  name: string;
  service: string;
  provider: 'aws' | 'azure' | 'gcp';
  region: string;
  resourceGroup?: string;
  status: 'active' | 'inactive' | 'error' | 'pending';
  cost: {
    daily: number;
    monthly: number;
    currency: string;
  };
  security: {
    publicAccess: boolean;
    encryption: boolean;
    iam: boolean;
    logging: boolean;
  };
  lastModified: string;
  tags: { [key: string]: string };
}

const InfrastructureSecurityHub = () => {
  const [selectedEnvironment, setSelectedEnvironment] = useState('all');
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [activeView, setActiveView] = useState('assets');

  const infrastructureAssets: InfrastructureAsset[] = [
    {
      id: 'asset-1',
      name: 'Production Web Server Cluster',
      type: 'server',
      environment: 'production',
      provider: 'aws',
      region: 'us-east-1',
      status: 'running',
      healthScore: 95,
      securityScore: 87,
      lastUpdated: '2025-09-09T10:30:00Z',
      specifications: {
        cpu: '8 vCPUs (Intel Xeon)',
        memory: '32 GB DDR4',
        storage: '500 GB SSD',
        network: '10 Gbps'
      },
      security: {
        encryption: true,
        backups: true,
        monitoring: true,
        accessControl: true,
        compliance: ['SOC 2', 'ISO 27001'],
        vulnerabilities: 2
      },
      cost: {
        monthly: 1247.50,
        currency: 'USD'
      },
      tags: ['production', 'web-tier', 'high-availability'],
      dependencies: ['asset-2', 'asset-3']
    },
    {
      id: 'asset-2',
      name: 'Customer Database Cluster',
      type: 'database',
      environment: 'production',
      provider: 'aws',
      region: 'us-east-1',
      status: 'running',
      healthScore: 98,
      securityScore: 92,
      lastUpdated: '2025-09-09T10:15:00Z',
      specifications: {
        cpu: '16 vCPUs (Intel Xeon)',
        memory: '128 GB DDR4',
        storage: '2 TB SSD (Encrypted)',
        network: '25 Gbps'
      },
      security: {
        encryption: true,
        backups: true,
        monitoring: true,
        accessControl: true,
        compliance: ['SOC 2', 'ISO 27001', 'PCI DSS'],
        vulnerabilities: 0
      },
      cost: {
        monthly: 3456.75,
        currency: 'USD'
      },
      tags: ['production', 'database', 'customer-data', 'encrypted'],
      dependencies: ['asset-4']
    },
    {
      id: 'asset-3',
      name: 'Container Orchestration Platform',
      type: 'container',
      environment: 'production',
      provider: 'aws',
      region: 'us-west-2',
      status: 'running',
      healthScore: 89,
      securityScore: 78,
      lastUpdated: '2025-09-09T09:45:00Z',
      specifications: {
        cpu: '64 vCPUs (distributed)',
        memory: '256 GB (distributed)',
        storage: '1 TB SSD (distributed)',
        network: 'Multi-AZ'
      },
      security: {
        encryption: true,
        backups: false,
        monitoring: true,
        accessControl: true,
        compliance: ['SOC 2'],
        vulnerabilities: 5
      },
      cost: {
        monthly: 2134.25,
        currency: 'USD'
      },
      tags: ['production', 'kubernetes', 'microservices'],
      dependencies: []
    },
    {
      id: 'asset-4',
      name: 'Security Monitoring Infrastructure',
      type: 'security-appliance',
      environment: 'production',
      provider: 'on-premise',
      region: 'data-center-a',
      status: 'running',
      healthScore: 94,
      securityScore: 96,
      lastUpdated: '2025-09-09T10:00:00Z',
      specifications: {
        cpu: '32 vCPUs (Intel Xeon)',
        memory: '64 GB DDR4',
        storage: '5 TB SSD',
        network: '40 Gbps'
      },
      security: {
        encryption: true,
        backups: true,
        monitoring: true,
        accessControl: true,
        compliance: ['SOC 2', 'ISO 27001', 'NIST'],
        vulnerabilities: 1
      },
      cost: {
        monthly: 5678.90,
        currency: 'USD'
      },
      tags: ['security', 'siem', 'monitoring', 'on-premise'],
      dependencies: []
    }
  ];

  const securityConfigurations: SecurityConfiguration[] = [
    {
      id: 'config-1',
      name: 'Multi-Factor Authentication Enforcement',
      category: 'access-control',
      description: 'Ensure all administrative access requires multi-factor authentication',
      status: 'compliant',
      severity: 'Critical',
      affectedAssets: ['asset-1', 'asset-2', 'asset-3', 'asset-4'],
      lastChecked: '2025-09-09T08:00:00Z',
      recommendation: 'MFA is properly configured across all systems',
      remediationSteps: ['Verify MFA enrollment', 'Test backup authentication methods'],
      complianceFrameworks: ['SOC 2', 'ISO 27001', 'NIST']
    },
    {
      id: 'config-2',
      name: 'Data Encryption at Rest',
      category: 'encryption',
      description: 'All sensitive data must be encrypted when stored',
      status: 'warning',
      severity: 'High',
      affectedAssets: ['asset-3'],
      lastChecked: '2025-09-09T07:30:00Z',
      recommendation: 'Enable encryption for container persistent volumes',
      remediationSteps: [
        'Enable storage encryption for Kubernetes persistent volumes',
        'Implement key rotation policies',
        'Verify encryption status across all containers'
      ],
      complianceFrameworks: ['SOC 2', 'PCI DSS', 'GDPR']
    },
    {
      id: 'config-3',
      name: 'Automated Security Patching',
      category: 'monitoring',
      description: 'Automated patching for critical security vulnerabilities',
      status: 'non-compliant',
      severity: 'Medium',
      affectedAssets: ['asset-3'],
      lastChecked: '2025-09-09T06:00:00Z',
      recommendation: 'Implement automated patching for container base images',
      remediationSteps: [
        'Set up automated vulnerability scanning',
        'Configure patch management pipeline',
        'Establish maintenance windows for updates'
      ],
      complianceFrameworks: ['ISO 27001', 'NIST']
    },
    {
      id: 'config-4',
      name: 'Network Segmentation Implementation',
      category: 'network-security',
      description: 'Proper network segmentation between environments and tiers',
      status: 'compliant',
      severity: 'High',
      affectedAssets: ['asset-1', 'asset-2', 'asset-3'],
      lastChecked: '2025-09-09T09:00:00Z',
      recommendation: 'Network segmentation is properly implemented',
      remediationSteps: ['Regular firewall rule review', 'Network access testing'],
      complianceFrameworks: ['SOC 2', 'ISO 27001']
    }
  ];

  const infrastructureMetrics: InfrastructureMetric[] = [
    {
      id: 'metric-1',
      name: 'Security Score Average',
      value: 88.25,
      unit: '%',
      trend: 'up',
      threshold: { warning: 80, critical: 70 },
      category: 'security',
      timestamp: '2025-09-09T10:30:00Z'
    },
    {
      id: 'metric-2',
      name: 'System Availability',
      value: 99.97,
      unit: '%',
      trend: 'stable',
      threshold: { warning: 99.5, critical: 99.0 },
      category: 'availability',
      timestamp: '2025-09-09T10:30:00Z'
    },
    {
      id: 'metric-3',
      name: 'Monthly Infrastructure Cost',
      value: 12517.40,
      unit: 'USD',
      trend: 'up',
      threshold: { warning: 15000, critical: 20000 },
      category: 'cost',
      timestamp: '2025-09-09T10:30:00Z'
    },
    {
      id: 'metric-4',
      name: 'Critical Vulnerabilities',
      value: 8,
      unit: 'count',
      trend: 'down',
      threshold: { warning: 10, critical: 20 },
      category: 'security',
      timestamp: '2025-09-09T10:30:00Z'
    }
  ];

  const cloudResources: CloudResource[] = [
    {
      id: 'cloud-1',
      name: 'Production S3 Bucket',
      service: 'S3',
      provider: 'aws',
      region: 'us-east-1',
      status: 'active',
      cost: { daily: 45.67, monthly: 1370.10, currency: 'USD' },
      security: {
        publicAccess: false,
        encryption: true,
        iam: true,
        logging: true
      },
      lastModified: '2025-09-09T08:15:00Z',
      tags: { Environment: 'Production', DataClassification: 'Confidential' }
    },
    {
      id: 'cloud-2',
      name: 'Application Load Balancer',
      service: 'ALB',
      provider: 'aws',
      region: 'us-east-1',
      status: 'active',
      cost: { daily: 12.34, monthly: 370.20, currency: 'USD' },
      security: {
        publicAccess: true,
        encryption: true,
        iam: true,
        logging: true
      },
      lastModified: '2025-09-09T07:30:00Z',
      tags: { Environment: 'Production', Service: 'LoadBalancer' }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': 
      case 'active': 
      case 'compliant': return 'text-green-600 dark:text-green-400';
      case 'stopped': 
      case 'inactive': 
      case 'non-compliant': return 'text-red-600 dark:text-red-400';
      case 'maintenance': 
      case 'pending': 
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      case 'not-configured': return 'text-gray-600 dark:text-gray-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getAssetTypeIcon = (type: string) => {
    switch (type) {
      case 'server': return <Server className="w-4 h-4" />;
      case 'container': return <Container className="w-4 h-4" />;
      case 'vm': return <Monitor className="w-4 h-4" />;
      case 'database': return <Database className="w-4 h-4" />;
      case 'load-balancer': return <Network className="w-4 h-4" />;
      case 'storage': return <HardDrive className="w-4 h-4" />;
      case 'network-device': return <Network className="w-4 h-4" />;
      case 'security-appliance': return <Shield className="w-4 h-4" />;
      default: return <Server className="w-4 h-4" />;
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'aws': return <Cloud className="w-4 h-4" />;
      case 'azure': return <Cloud className="w-4 h-4" />;
      case 'gcp': return <Cloud className="w-4 h-4" />;
      case 'on-premise': return <Building className="w-4 h-4" />;
      case 'hybrid': return <GitBranch className="w-4 h-4" />;
      default: return <Server className="w-4 h-4" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUp className="w-3 h-3 text-green-600" />;
      case 'down': return <ArrowDown className="w-3 h-3 text-red-600" />;
      case 'stable': return <Minus className="w-3 h-3 text-blue-600" />;
      default: return <Minus className="w-3 h-3 text-gray-600" />;
    }
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

  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 80) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 70) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                <Server className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Infrastructure Security
                </h1>
                <p className="text-lg text-muted-foreground">
                  Comprehensive infrastructure security monitoring and management
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="px-3 py-1">
              <Activity className="w-3 h-3 mr-1" />
              {infrastructureAssets.filter(a => a.status === 'running').length} Active Assets
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
          {infrastructureMetrics.map((metric) => (
            <Card key={metric.id} className={`bg-gradient-to-br ${
              metric.category === 'security' ? 'from-blue-500/10 to-blue-600/10 border-blue-200 dark:border-blue-800' :
              metric.category === 'availability' ? 'from-green-500/10 to-green-600/10 border-green-200 dark:border-green-800' :
              metric.category === 'cost' ? 'from-orange-500/10 to-orange-600/10 border-orange-200 dark:border-orange-800' :
              'from-gray-500/10 to-gray-600/10 border-gray-200 dark:border-gray-800'
            }`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${
                      metric.category === 'security' ? 'text-blue-600 dark:text-blue-400' :
                      metric.category === 'availability' ? 'text-green-600 dark:text-green-400' :
                      metric.category === 'cost' ? 'text-orange-600 dark:text-orange-400' :
                      'text-gray-600 dark:text-gray-400'
                    }`}>
                      {metric.name}
                    </p>
                    <p className={`text-3xl font-bold ${
                      metric.category === 'security' ? 'text-blue-700 dark:text-blue-300' :
                      metric.category === 'availability' ? 'text-green-700 dark:text-green-300' :
                      metric.category === 'cost' ? 'text-orange-700 dark:text-orange-300' :
                      'text-gray-700 dark:text-gray-300'
                    }`}>
                      {metric.value.toLocaleString()}{metric.unit}
                    </p>
                    <p className="text-xs flex items-center gap-1">
                      {getTrendIcon(metric.trend)}
                      {metric.trend} trend
                    </p>
                  </div>
                  <div className={`w-8 h-8 ${
                    metric.category === 'security' ? 'text-blue-500' :
                    metric.category === 'availability' ? 'text-green-500' :
                    metric.category === 'cost' ? 'text-orange-500' :
                    'text-gray-500'
                  }`}>
                    {metric.category === 'security' && <Shield className="w-8 h-8" />}
                    {metric.category === 'availability' && <CheckCircle className="w-8 h-8" />}
                    {metric.category === 'cost' && <BarChart3 className="w-8 h-8" />}
                    {metric.category === 'performance' && <Activity className="w-8 h-8" />}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View Selector */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          {[
            { id: 'assets', label: 'Infrastructure Assets', icon: Server },
            { id: 'configurations', label: 'Security Configurations', icon: Settings },
            { id: 'cloud', label: 'Cloud Resources', icon: Cloud },
            { id: 'compliance', label: 'Compliance Status', icon: Shield }
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
                  placeholder={`Search ${activeView}... (e.g., server name, configuration, compliance framework)`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-3 text-lg bg-background/50 border-border/70 focus:border-primary"
                />
              </div>
              <div className="flex gap-2">
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

                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Providers</SelectItem>
                    <SelectItem value="aws">AWS</SelectItem>
                    <SelectItem value="azure">Azure</SelectItem>
                    <SelectItem value="gcp">Google Cloud</SelectItem>
                    <SelectItem value="on-premise">On-Premise</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content based on active view */}
        {activeView === 'assets' && (
          <div className="space-y-4">
            {infrastructureAssets.map((asset) => (
              <Card key={asset.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card/80 border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="gap-1">
                          {getAssetTypeIcon(asset.type)}
                          {asset.type}
                        </Badge>
                        <Badge className={getStatusColor(asset.status)}>
                          {asset.status}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          {getProviderIcon(asset.provider)}
                          {asset.provider}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {asset.environment}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors">
                        {asset.name}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {asset.region} • ${asset.cost.monthly.toLocaleString()}/month
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Updated: {formatTimestamp(asset.lastUpdated)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="text-xs">
                          <span className="text-muted-foreground">Health:</span>
                          <span className={`ml-1 font-medium ${getHealthScoreColor(asset.healthScore)}`}>
                            {asset.healthScore}%
                          </span>
                        </div>
                        <div className="text-xs">
                          <span className="text-muted-foreground">Security:</span>
                          <span className={`ml-1 font-medium ${getHealthScoreColor(asset.securityScore)}`}>
                            {asset.securityScore}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Specifications */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Specifications</h4>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">CPU:</span>
                          <span>{asset.specifications.cpu}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Memory:</span>
                          <span>{asset.specifications.memory}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Storage:</span>
                          <span>{asset.specifications.storage}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Network:</span>
                          <span>{asset.specifications.network}</span>
                        </div>
                      </div>
                    </div>

                    {/* Security Status */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Security Status</h4>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Encryption:</span>
                          {asset.security.encryption ? (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-500" />
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Backups:</span>
                          {asset.security.backups ? (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-500" />
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Monitoring:</span>
                          {asset.security.monitoring ? (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-500" />
                          )}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Vulnerabilities:</span>
                          <span className={asset.security.vulnerabilities > 0 ? 'text-red-600' : 'text-green-600'}>
                            {asset.security.vulnerabilities}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Compliance & Cost */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Compliance & Cost</h4>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {asset.security.compliance.map((framework, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {framework}
                            </Badge>
                          ))}
                        </div>
                        <div className="text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Monthly Cost:</span>
                            <span className="font-medium">${asset.cost.monthly.toLocaleString()}</span>
                          </div>
                        </div>
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
                        <Settings className="w-4 h-4" />
                        Configure
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Shield className="w-4 h-4" />
                        Scan
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

        {activeView === 'configurations' && (
          <div className="space-y-4">
            {securityConfigurations.map((config) => (
              <Card key={config.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card/80 border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getSeverityColor(config.severity)}>
                          {config.severity}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {config.category.replace('-', ' ').toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(config.status)}>
                          {config.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors">
                        {config.name}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {config.description}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Last Checked: {formatTimestamp(config.lastChecked)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Affects {config.affectedAssets.length} assets
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Recommendation */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Current Status</h4>
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <p className="text-sm text-muted-foreground">{config.recommendation}</p>
                      </div>
                    </div>

                    {/* Remediation Steps */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Remediation Steps</h4>
                      <div className="space-y-1">
                        {config.remediationSteps.slice(0, 3).map((step, idx) => (
                          <div key={idx} className="p-2 rounded bg-background/50 border border-border/50">
                            <p className="text-xs text-muted-foreground">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Compliance Frameworks</h4>
                    <div className="flex flex-wrap gap-1">
                      {config.complianceFrameworks.map((framework, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {framework}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Affected Assets</h4>
                    <div className="flex flex-wrap gap-1">
                      {config.affectedAssets.map((assetId, idx) => {
                        const asset = infrastructureAssets.find(a => a.id === assetId);
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
                        <Settings className="w-4 h-4" />
                        Configure
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

        {activeView === 'cloud' && (
          <div className="space-y-4">
            {cloudResources.map((resource) => (
              <Card key={resource.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card/80 border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="gap-1">
                          <Cloud className="w-3 h-3" />
                          {resource.service}
                        </Badge>
                        <Badge className={getStatusColor(resource.status)}>
                          {resource.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {resource.provider.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {resource.region}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors">
                        {resource.name}
                      </CardTitle>
                      <CardDescription className="text-base">
                        ${resource.cost.monthly.toLocaleString()}/month • Last modified: {formatTimestamp(resource.lastModified)}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Security Configuration */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Security Configuration</h4>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Public Access:</span>
                          {resource.security.publicAccess ? (
                            <Badge variant="destructive" className="text-xs">Enabled</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Disabled</Badge>
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Encryption:</span>
                          {resource.security.encryption ? (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-500" />
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">IAM:</span>
                          {resource.security.iam ? (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-500" />
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Logging:</span>
                          {resource.security.logging ? (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-500" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Cost Breakdown */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Cost Analysis</h4>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Daily Cost:</span>
                          <span>${resource.cost.daily.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Monthly Cost:</span>
                          <span className="font-medium">${resource.cost.monthly.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Currency:</span>
                          <span>{resource.cost.currency}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Resource Tags</h4>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(resource.tags).map(([key, value], idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {key}: {value}
                        </Badge>
                      ))}
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
                        <Shield className="w-4 h-4" />
                        Security Check
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Cost Analysis
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Settings className="w-4 h-4" />
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

        {activeView === 'compliance' && (
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                Compliance Dashboard
              </CardTitle>
              <CardDescription>
                Infrastructure compliance status across security frameworks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {['SOC 2', 'ISO 27001', 'PCI DSS', 'NIST', 'GDPR', 'HIPAA'].map((framework) => {
                  const configsForFramework = securityConfigurations.filter(c => 
                    c.complianceFrameworks.includes(framework)
                  );
                  const compliantConfigs = configsForFramework.filter(c => c.status === 'compliant');
                  const compliancePercentage = configsForFramework.length > 0 
                    ? Math.round((compliantConfigs.length / configsForFramework.length) * 100)
                    : 0;

                  return (
                    <div key={framework} className="p-4 rounded-lg bg-background/50 border border-border/50">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{framework}</h4>
                          <Badge className={compliancePercentage >= 90 ? 'bg-green-500/10 text-green-600' : 
                                          compliancePercentage >= 70 ? 'bg-yellow-500/10 text-yellow-600' : 
                                          'bg-red-500/10 text-red-600'}>
                            {compliancePercentage}%
                          </Badge>
                        </div>
                        <Progress value={compliancePercentage} className="h-2" />
                        <div className="text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Controls:</span>
                            <span>{configsForFramework.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Compliant:</span>
                            <span className="text-green-600">{compliantConfigs.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Non-Compliant:</span>
                            <span className="text-red-600">
                              {configsForFramework.filter(c => c.status === 'non-compliant').length}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="bg-gradient-to-r from-muted/30 to-muted/10 border-border/30">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Infrastructure Security Management</h3>
                <p className="text-muted-foreground">
                  Comprehensive security monitoring, compliance tracking, and infrastructure management
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="gap-2">
                  <Settings className="w-4 h-4" />
                  Security Policies
                </Button>
                <Button variant="outline" className="gap-2">
                  <FileText className="w-4 h-4" />
                  Compliance Report
                </Button>
                <Button className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  AI Optimization
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default withAuth(InfrastructureSecurityHub);
