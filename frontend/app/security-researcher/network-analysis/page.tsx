'use client';
import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Activity, 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
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
  Server, 
  Globe, 
  Lock, 
  Unlock, 
  Bug, 
  Code, 
  FileText, 
  Calendar, 
  Users, 
  Building, 
  Wifi, 
  Smartphone, 
  Monitor, 
  HardDrive, 
  Cloud, 
  Radio, 
  Satellite, 
  Radar, 
  Crosshair, 
  Flag, 
  Star, 
  Bookmark, 
  ThumbsUp, 
  ThumbsDown, 
  MessageCircle, 
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
  Layers,
  BarChart3,
  PieChart,
  LineChart,
  Hash,
  Tag,
  Link,
  Copy,
  Archive,
  Trash2,
  Settings,
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
  Sparkles
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

interface NetworkNode {
  id: string;
  ip: string;
  hostname: string;
  type: 'server' | 'workstation' | 'router' | 'switch' | 'firewall' | 'gateway' | 'iot' | 'mobile' | 'unknown';
  os: string;
  services: {
    port: number;
    service: string;
    version: string;
    status: 'open' | 'closed' | 'filtered';
  }[];
  vulnerabilities: {
    cve: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    description: string;
  }[];
  lastSeen: string;
  location: string;
  department: string;
  riskScore: number;
  status: 'online' | 'offline' | 'suspicious' | 'compromised';
}

interface NetworkFlow {
  id: string;
  source: string;
  destination: string;
  protocol: string;
  port: number;
  bytes: number;
  packets: number;
  duration: number;
  timestamp: string;
  classification: 'normal' | 'suspicious' | 'malicious' | 'unknown';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  details: {
    application: string;
    country?: string;
    asn?: string;
  };
}

interface SecurityAlert {
  id: string;
  title: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
  category: 'intrusion' | 'malware' | 'anomaly' | 'policy-violation' | 'vulnerability';
  source: string;
  destination?: string;
  timestamp: string;
  status: 'new' | 'investigating' | 'resolved' | 'false-positive';
  evidence: string[];
  recommendations: string[];
  affectedAssets: string[];
}

interface NetworkSegment {
  id: string;
  name: string;
  cidr: string;
  type: 'production' | 'development' | 'dmz' | 'guest' | 'management' | 'iot';
  securityLevel: 'public' | 'internal' | 'restricted' | 'confidential';
  nodeCount: number;
  activeConnections: number;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  monitoring: boolean;
  policies: string[];
}

const NetworkAnalysisHub = () => {
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [activeView, setActiveView] = useState('topology');

  const networkSegments: NetworkSegment[] = [
    {
      id: 'prod-web',
      name: 'Production Web Tier',
      cidr: '10.1.0.0/24',
      type: 'production',
      securityLevel: 'restricted',
      nodeCount: 24,
      activeConnections: 1247,
      threatLevel: 'medium',
      monitoring: true,
      policies: ['DLP', 'IPS', 'WAF']
    },
    {
      id: 'prod-app',
      name: 'Production Application Tier',
      cidr: '10.2.0.0/24',
      type: 'production',
      securityLevel: 'confidential',
      nodeCount: 18,
      activeConnections: 892,
      threatLevel: 'low',
      monitoring: true,
      policies: ['DLP', 'IPS', 'Database Security']
    },
    {
      id: 'dmz',
      name: 'DMZ Network',
      cidr: '192.168.100.0/24',
      type: 'dmz',
      securityLevel: 'public',
      nodeCount: 12,
      activeConnections: 2156,
      threatLevel: 'high',
      monitoring: true,
      policies: ['IPS', 'WAF', 'DDoS Protection']
    },
    {
      id: 'dev',
      name: 'Development Network',
      cidr: '172.16.0.0/24',
      type: 'development',
      securityLevel: 'internal',
      nodeCount: 45,
      activeConnections: 634,
      threatLevel: 'medium',
      monitoring: true,
      policies: ['Code Scanning', 'Vulnerability Assessment']
    },
    {
      id: 'iot',
      name: 'IoT Devices',
      cidr: '10.100.0.0/24',
      type: 'iot',
      securityLevel: 'restricted',
      nodeCount: 156,
      activeConnections: 298,
      threatLevel: 'high',
      monitoring: false,
      policies: ['Network Segmentation', 'Traffic Monitoring']
    }
  ];

  const networkNodes: NetworkNode[] = [
    {
      id: 'node-1',
      ip: '10.1.0.10',
      hostname: 'web-server-01.company.com',
      type: 'server',
      os: 'Ubuntu 22.04 LTS',
      services: [
        { port: 80, service: 'HTTP', version: 'nginx/1.18.0', status: 'open' },
        { port: 443, service: 'HTTPS', version: 'nginx/1.18.0', status: 'open' },
        { port: 22, service: 'SSH', version: 'OpenSSH 8.9', status: 'open' }
      ],
      vulnerabilities: [
        { cve: 'CVE-2024-1234', severity: 'Medium', description: 'Nginx version vulnerability' }
      ],
      lastSeen: '2025-09-09T10:30:00Z',
      location: 'Data Center A',
      department: 'IT Operations',
      riskScore: 65,
      status: 'online'
    },
    {
      id: 'node-2',
      ip: '10.2.0.15',
      hostname: 'app-server-02.company.com',
      type: 'server',
      os: 'CentOS 8',
      services: [
        { port: 8080, service: 'HTTP', version: 'Apache Tomcat/9.0.65', status: 'open' },
        { port: 5432, service: 'PostgreSQL', version: '13.7', status: 'open' },
        { port: 22, service: 'SSH', version: 'OpenSSH 8.0', status: 'open' }
      ],
      vulnerabilities: [
        { cve: 'CVE-2024-5678', severity: 'High', description: 'PostgreSQL privilege escalation' },
        { cve: 'CVE-2024-9012', severity: 'Critical', description: 'Tomcat remote code execution' }
      ],
      lastSeen: '2025-09-09T10:25:00Z',
      location: 'Data Center B',
      department: 'Application Team',
      riskScore: 85,
      status: 'suspicious'
    },
    {
      id: 'node-3',
      ip: '192.168.100.5',
      hostname: 'firewall-01.company.com',
      type: 'firewall',
      os: 'pfSense 2.6.0',
      services: [
        { port: 443, service: 'HTTPS', version: 'nginx/1.20.1', status: 'open' },
        { port: 22, service: 'SSH', version: 'OpenSSH 8.8', status: 'open' }
      ],
      vulnerabilities: [],
      lastSeen: '2025-09-09T10:32:00Z',
      location: 'Network Operations Center',
      department: 'Network Team',
      riskScore: 25,
      status: 'online'
    },
    {
      id: 'node-4',
      ip: '10.100.0.42',
      hostname: 'iot-camera-lobby.company.com',
      type: 'iot',
      os: 'Linux (embedded)',
      services: [
        { port: 80, service: 'HTTP', version: 'lighttpd/1.4.55', status: 'open' },
        { port: 554, service: 'RTSP', version: 'Unknown', status: 'open' }
      ],
      vulnerabilities: [
        { cve: 'CVE-2024-3456', severity: 'High', description: 'Default credentials vulnerability' },
        { cve: 'CVE-2024-7890', severity: 'Medium', description: 'Buffer overflow in RTSP handler' }
      ],
      lastSeen: '2025-09-09T10:20:00Z',
      location: 'Main Lobby',
      department: 'Physical Security',
      riskScore: 78,
      status: 'compromised'
    }
  ];

  const networkFlows: NetworkFlow[] = [
    {
      id: 'flow-1',
      source: '10.1.0.10',
      destination: '10.2.0.15',
      protocol: 'TCP',
      port: 5432,
      bytes: 15420000,
      packets: 12456,
      duration: 3600,
      timestamp: '2025-09-09T10:00:00Z',
      classification: 'normal',
      riskLevel: 'low',
      details: {
        application: 'PostgreSQL'
      }
    },
    {
      id: 'flow-2',
      source: '203.0.113.50',
      destination: '192.168.100.5',
      protocol: 'TCP',
      port: 443,
      bytes: 2500000,
      packets: 3420,
      duration: 300,
      timestamp: '2025-09-09T09:45:00Z',
      classification: 'suspicious',
      riskLevel: 'high',
      details: {
        application: 'HTTPS',
        country: 'Unknown',
        asn: 'AS12345'
      }
    },
    {
      id: 'flow-3',
      source: '10.100.0.42',
      destination: '198.51.100.25',
      protocol: 'TCP',
      port: 80,
      bytes: 45000000,
      packets: 89234,
      duration: 7200,
      timestamp: '2025-09-09T08:30:00Z',
      classification: 'malicious',
      riskLevel: 'critical',
      details: {
        application: 'HTTP',
        country: 'Russia',
        asn: 'AS54321'
      }
    }
  ];

  const securityAlerts: SecurityAlert[] = [
    {
      id: 'alert-1',
      title: 'Suspicious Outbound Traffic from IoT Device',
      description: 'IoT camera device communicating with suspicious external IP address in Russia',
      severity: 'Critical',
      category: 'intrusion',
      source: '10.100.0.42',
      destination: '198.51.100.25',
      timestamp: '2025-09-09T08:30:00Z',
      status: 'new',
      evidence: [
        'Large volume data transfer (45MB) to external IP',
        'Communication with known malicious ASN',
        'Traffic patterns inconsistent with normal camera behavior'
      ],
      recommendations: [
        'Immediately isolate affected IoT device',
        'Analyze network traffic for data exfiltration',
        'Check for lateral movement indicators',
        'Update IoT device firmware and credentials'
      ],
      affectedAssets: ['10.100.0.42', 'IoT Network Segment']
    },
    {
      id: 'alert-2',
      title: 'Critical Vulnerability Detected on Application Server',
      description: 'Apache Tomcat server vulnerable to remote code execution exploit',
      severity: 'Critical',
      category: 'vulnerability',
      source: '10.2.0.15',
      timestamp: '2025-09-09T07:15:00Z',
      status: 'investigating',
      evidence: [
        'CVE-2024-9012 detected on Tomcat 9.0.65',
        'Server accessible from multiple network segments',
        'Contains sensitive customer data'
      ],
      recommendations: [
        'Immediately patch Apache Tomcat to latest version',
        'Implement additional network segmentation',
        'Review access controls and logs',
        'Conduct security assessment of application'
      ],
      affectedAssets: ['10.2.0.15', 'Customer Database', 'Application Network']
    },
    {
      id: 'alert-3',
      title: 'Anomalous Network Behavior Detected',
      description: 'Unusual traffic patterns suggesting potential lateral movement',
      severity: 'High',
      category: 'anomaly',
      source: '10.1.0.10',
      destination: '10.2.0.15',
      timestamp: '2025-09-09T06:45:00Z',
      status: 'resolved',
      evidence: [
        'Increased database queries during off-hours',
        'New connection patterns between web and app tiers',
        'Elevated privilege usage detected'
      ],
      recommendations: [
        'Review authentication logs for suspicious activity',
        'Implement additional monitoring on database queries',
        'Conduct user behavior analysis',
        'Enhance network segmentation controls'
      ],
      affectedAssets: ['10.1.0.10', '10.2.0.15', 'Production Network']
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
      case 'info': return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800';
      default: return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800';
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical': return 'text-red-600 dark:text-red-400';
      case 'high': return 'text-orange-600 dark:text-orange-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getNodeStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600 dark:text-green-400';
      case 'offline': return 'text-gray-600 dark:text-gray-400';
      case 'suspicious': return 'text-orange-600 dark:text-orange-400';
      case 'compromised': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getNodeTypeIcon = (type: string) => {
    switch (type) {
      case 'server': return <Server className="w-4 h-4" />;
      case 'workstation': return <Monitor className="w-4 h-4" />;
      case 'router': return <Network className="w-4 h-4" />;
      case 'switch': return <GitBranch className="w-4 h-4" />;
      case 'firewall': return <Shield className="w-4 h-4" />;
      case 'gateway': return <Globe className="w-4 h-4" />;
      case 'iot': return <Wifi className="w-4 h-4" />;
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      default: return <Network className="w-4 h-4" />;
    }
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                <Network className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Network Analysis
                </h1>
                <p className="text-lg text-muted-foreground">
                  Advanced network security monitoring and analysis platform
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="px-3 py-1">
              <Activity className="w-3 h-3 mr-1" />
              {networkNodes.filter(n => n.status === 'online').length} Online Nodes
            </Badge>
            <Button 
              onClick={handleStartScan}
              disabled={isScanning}
              className="gap-2"
            >
              <Radar className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? 'Scanning...' : 'Start Scan'}
            </Button>
          </div>
        </div>

        {/* Network Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Nodes</p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                    {networkNodes.length}
                  </p>
                  <p className="text-xs text-blue-500 flex items-center gap-1">
                    <ArrowUp className="w-3 h-3" />
                    +3 this week
                  </p>
                </div>
                <Network className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Active Flows</p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                    {networkFlows.length}
                  </p>
                  <p className="text-xs text-green-500 flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    Real-time
                  </p>
                </div>
                <Activity className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-200 dark:border-orange-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Security Alerts</p>
                  <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">
                    {securityAlerts.filter(a => a.status === 'new').length}
                  </p>
                  <p className="text-xs text-orange-500 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Needs attention
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-200 dark:border-red-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">Compromised</p>
                  <p className="text-3xl font-bold text-red-700 dark:text-red-300">
                    {networkNodes.filter(n => n.status === 'compromised').length}
                  </p>
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Critical
                  </p>
                </div>
                <Shield className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Network Segments Overview */}
        <Card className="bg-gradient-to-r from-card to-card/80 border-border/50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              Network Segments
            </CardTitle>
            <CardDescription>
              Security monitoring status across network segments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {networkSegments.map((segment) => (
                <div key={segment.id} className="p-4 rounded-lg bg-background/50 border border-border/50">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{segment.name}</h4>
                      <Badge className={getThreatLevelColor(segment.threatLevel)}>
                        {segment.threatLevel}
                      </Badge>
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">CIDR:</span>
                        <span className="font-mono">{segment.cidr}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nodes:</span>
                        <span>{segment.nodeCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Connections:</span>
                        <span>{segment.activeConnections.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Security Level:</span>
                        <Badge variant="outline" className="text-xs">
                          {segment.securityLevel}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Monitoring:</span>
                      {segment.monitoring ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {segment.policies.slice(0, 2).map((policy, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {policy}
                        </Badge>
                      ))}
                      {segment.policies.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{segment.policies.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* View Selector */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          {[
            { id: 'topology', label: 'Network Topology', icon: Network },
            { id: 'nodes', label: 'Network Nodes', icon: Server },
            { id: 'flows', label: 'Traffic Flows', icon: Activity },
            { id: 'alerts', label: 'Security Alerts', icon: AlertTriangle }
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
                  placeholder={`Search ${activeView}... (e.g., IP address, hostname, alert type)`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-3 text-lg bg-background/50 border-border/70 focus:border-primary"
                />
              </div>
              <div className="flex gap-2">
                <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Network Segment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Segments</SelectItem>
                    {networkSegments.map((segment) => (
                      <SelectItem key={segment.id} value={segment.id}>
                        {segment.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">Last Hour</SelectItem>
                    <SelectItem value="24h">Last 24h</SelectItem>
                    <SelectItem value="7d">Last Week</SelectItem>
                    <SelectItem value="30d">Last Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content based on active view */}
        {activeView === 'topology' && (
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold flex items-center gap-2">
                <Network className="w-6 h-6 text-primary" />
                Network Topology Visualization
              </CardTitle>
              <CardDescription>
                Interactive network topology with real-time security status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-background/30 rounded-lg border border-border/50 flex items-center justify-center relative overflow-hidden">
                <div className="text-center text-muted-foreground">
                  <Network className="w-24 h-24 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">Interactive Network Topology</h3>
                  <p className="text-sm mb-4">
                    Real-time visualization of network infrastructure, connections, and security status
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span>Secure Nodes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span>At Risk</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span>Suspicious</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span>Compromised</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeView === 'nodes' && (
          <div className="space-y-4">
            {networkNodes.map((node) => (
              <Card key={node.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card/80 border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="gap-1">
                          {getNodeTypeIcon(node.type)}
                          {node.type}
                        </Badge>
                        <Badge className={getNodeStatusColor(node.status)}>
                          {node.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Risk: {node.riskScore}%
                        </Badge>
                      </div>
                      <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors">
                        {node.hostname}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {node.ip} • {node.os} • {node.location}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Last Seen: {formatTimestamp(node.lastSeen)}</p>
                      <p className="text-xs text-muted-foreground">Dept: {node.department}</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Services */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Running Services</h4>
                      <div className="space-y-1">
                        {node.services.slice(0, 3).map((service, idx) => (
                          <div key={idx} className="p-2 rounded bg-background/50 border border-border/50">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-mono">{service.port}/{service.service}</span>
                              <Badge variant={service.status === 'open' ? 'destructive' : 'secondary'} className="text-xs">
                                {service.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{service.version}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Vulnerabilities */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Vulnerabilities</h4>
                      <div className="space-y-1">
                        {node.vulnerabilities.length > 0 ? (
                          node.vulnerabilities.slice(0, 2).map((vuln, idx) => (
                            <div key={idx} className="p-2 rounded bg-red-500/5 border border-red-200 dark:border-red-800">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-mono">{vuln.cve}</span>
                                <Badge className={getSeverityColor(vuln.severity)}>
                                  {vuln.severity}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{vuln.description}</p>
                            </div>
                          ))
                        ) : (
                          <div className="p-2 rounded bg-green-500/5 border border-green-200 dark:border-green-800">
                            <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                              <CheckCircle className="w-3 h-3" />
                              No known vulnerabilities
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Risk Assessment */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Risk Assessment</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Overall Risk:</span>
                          <span className="text-primary">{node.riskScore}%</span>
                        </div>
                        <Progress value={node.riskScore} className="h-2" />
                        <div className="text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Exposure:</span>
                            <span>{node.services.filter(s => s.status === 'open').length} open ports</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Vulnerabilities:</span>
                            <span>{node.vulnerabilities.length} CVEs</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-0">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="w-4 h-4" />
                        Details
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Shield className="w-4 h-4" />
                        Scan
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Settings className="w-4 h-4" />
                        Configure
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

        {activeView === 'flows' && (
          <div className="space-y-4">
            {networkFlows.map((flow) => (
              <Card key={flow.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card/80 border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {flow.protocol}:{flow.port}
                        </Badge>
                        <Badge className={getSeverityColor(flow.riskLevel)}>
                          {flow.riskLevel}
                        </Badge>
                        <Badge variant={flow.classification === 'normal' ? 'secondary' : 'destructive'} className="text-xs">
                          {flow.classification}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
                        {flow.source} → {flow.destination}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {flow.details.application} • {formatBytes(flow.bytes)} transferred
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{formatTimestamp(flow.timestamp)}</p>
                      <p className="text-xs text-muted-foreground">Duration: {Math.floor(flow.duration / 60)}m</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 text-sm">
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Bytes Transferred:</span>
                      <p className="font-medium">{formatBytes(flow.bytes)}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Packets:</span>
                      <p className="font-medium">{flow.packets.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Duration:</span>
                      <p className="font-medium">{Math.floor(flow.duration / 60)}m {flow.duration % 60}s</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Application:</span>
                      <p className="font-medium">{flow.details.application}</p>
                    </div>
                  </div>

                  {flow.details.country && (
                    <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        <span className="text-orange-700 dark:text-orange-300">
                          External connection to {flow.details.country} (ASN: {flow.details.asn})
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-0">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="w-4 h-4" />
                        Analyze
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Flag className="w-4 h-4" />
                        Block
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
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

        {activeView === 'alerts' && (
          <div className="space-y-4">
            {securityAlerts.map((alert) => (
              <Card key={alert.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card/80 border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {alert.category.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className={getNodeStatusColor(alert.status)}>
                          {alert.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors">
                        {alert.title}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {alert.description}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{formatTimestamp(alert.timestamp)}</p>
                      <p className="text-xs text-muted-foreground">
                        {alert.source} {alert.destination && `→ ${alert.destination}`}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Evidence */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Evidence</h4>
                      <div className="space-y-1">
                        {alert.evidence.slice(0, 3).map((evidence, idx) => (
                          <div key={idx} className="p-2 rounded bg-red-500/5 border border-red-200 dark:border-red-800">
                            <p className="text-xs text-red-700 dark:text-red-300">{evidence}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Recommendations</h4>
                      <div className="space-y-1">
                        {alert.recommendations.slice(0, 3).map((rec, idx) => (
                          <div key={idx} className="p-2 rounded bg-green-500/5 border border-green-200 dark:border-green-800">
                            <p className="text-xs text-green-700 dark:text-green-300">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Affected Assets</h4>
                    <div className="flex flex-wrap gap-1">
                      {alert.affectedAssets.map((asset, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {asset}
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
                        Investigate
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Resolve
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <XCircle className="w-4 h-4" />
                        Dismiss
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Share2 className="w-4 h-4" />
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
                <h3 className="text-lg font-semibold">Advanced Network Security Analysis</h3>
                <p className="text-muted-foreground">
                  Real-time network monitoring, threat detection, and security analysis
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="gap-2">
                  <Settings className="w-4 h-4" />
                  Configure Monitoring
                </Button>
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export Report
                </Button>
                <Button className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  AI Analysis
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default withAuth(NetworkAnalysisHub);
