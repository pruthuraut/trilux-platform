'use client';
import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  Globe, 
  Activity, 
  Eye, 
  Search, 
  Filter, 
  Download, 
  Share2, 
  RefreshCw, 
  Clock, 
  MapPin, 
  Target, 
  Zap, 
  Database, 
  Network, 
  Server, 
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
  Trash2
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

interface ThreatIntelligence {
  id: string;
  title: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
  category: string;
  source: string;
  confidence: number;
  timestamp: string;
  tags: string[];
  indicators: {
    type: 'IP' | 'Domain' | 'Hash' | 'URL' | 'Email' | 'File';
    value: string;
    context: string;
  }[];
  mitre: {
    tactic: string;
    technique: string;
    subtechnique?: string;
  };
  cve?: string;
  impact: string;
  recommendation: string;
  isActive: boolean;
  affectedAssets: string[];
  relatedThreats: string[];
}

interface ThreatFeed {
  id: string;
  name: string;
  provider: string;
  status: 'active' | 'inactive' | 'error';
  lastUpdate: string;
  threatCount: number;
  reliability: number;
  category: string;
}

interface GlobalThreatMap {
  country: string;
  countryCode: string;
  threatLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  activeThreats: number;
  coordinates: [number, number];
}

const ThreatIntelligenceHub = () => {
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedThreat, setSelectedThreat] = useState<ThreatIntelligence | null>(null);

  const severityLevels = [
    { id: 'all', name: 'All Severities', count: 1247 },
    { id: 'critical', name: 'Critical', count: 23 },
    { id: 'high', name: 'High', count: 156 },
    { id: 'medium', name: 'Medium', count: 342 },
    { id: 'low', name: 'Low', count: 589 },
    { id: 'info', name: 'Info', count: 137 }
  ];

  const categories = [
    { id: 'all', name: 'All Categories', icon: Shield },
    { id: 'malware', name: 'Malware', icon: Bug },
    { id: 'apt', name: 'APT Groups', icon: Users },
    { id: 'vulnerability', name: 'Vulnerabilities', icon: AlertTriangle },
    { id: 'phishing', name: 'Phishing', icon: Target },
    { id: 'network', name: 'Network Attacks', icon: Network },
    { id: 'infrastructure', name: 'Infrastructure', icon: Server },
    { id: 'data-breach', name: 'Data Breaches', icon: Database },
    { id: 'ransomware', name: 'Ransomware', icon: Lock }
  ];

  const threatFeeds: ThreatFeed[] = [
    {
      id: 'feed-1',
      name: 'MISP Threat Intelligence',
      provider: 'MISP Community',
      status: 'active',
      lastUpdate: '2025-09-09T10:30:00Z',
      threatCount: 15420,
      reliability: 94,
      category: 'Community'
    },
    {
      id: 'feed-2',
      name: 'AlienVault OTX',
      provider: 'AT&T Cybersecurity',
      status: 'active',
      lastUpdate: '2025-09-09T10:25:00Z',
      threatCount: 28756,
      reliability: 92,
      category: 'Commercial'
    },
    {
      id: 'feed-3',
      name: 'VirusTotal Intelligence',
      provider: 'Google',
      status: 'active',
      lastUpdate: '2025-09-09T10:28:00Z',
      threatCount: 45231,
      reliability: 96,
      category: 'Commercial'
    },
    {
      id: 'feed-4',
      name: 'FBI InfraGard',
      provider: 'FBI',
      status: 'active',
      lastUpdate: '2025-09-09T09:45:00Z',
      threatCount: 3247,
      reliability: 98,
      category: 'Government'
    },
    {
      id: 'feed-5',
      name: 'Emerging Threats',
      provider: 'Proofpoint',
      status: 'active',
      lastUpdate: '2025-09-09T10:32:00Z',
      threatCount: 12890,
      reliability: 90,
      category: 'Commercial'
    }
  ];

  const threatIntelligence: ThreatIntelligence[] = [
    {
      id: 'threat-1',
      title: 'APT29 (Cozy Bear) - New PowerShell Backdoor Campaign',
      description: 'Advanced Persistent Threat group APT29 has been observed deploying a new PowerShell-based backdoor targeting government and healthcare organizations worldwide.',
      severity: 'Critical',
      category: 'apt',
      source: 'FBI InfraGard',
      confidence: 95,
      timestamp: '2025-09-09T08:30:00Z',
      tags: ['APT29', 'PowerShell', 'Backdoor', 'Government', 'Healthcare'],
      indicators: [
        { type: 'Hash', value: 'a1b2c3d4e5f6789012345', context: 'Malicious PowerShell script hash' },
        { type: 'Domain', value: 'secure-update.example.com', context: 'C2 domain' },
        { type: 'IP', value: '192.168.1.100', context: 'Command and control server' }
      ],
      mitre: {
        tactic: 'Initial Access',
        technique: 'T1566.001',
        subtechnique: 'Spearphishing Attachment'
      },
      impact: 'High - Potential for data exfiltration and persistent access to critical infrastructure',
      recommendation: 'Implement PowerShell logging, block identified domains, update email security policies',
      isActive: true,
      affectedAssets: ['Email Servers', 'Workstations', 'Domain Controllers'],
      relatedThreats: ['threat-3', 'threat-5']
    },
    {
      id: 'threat-2',
      title: 'Zero-Day Vulnerability in Apache Struts 2.5.x',
      description: 'Critical remote code execution vulnerability discovered in Apache Struts 2.5.x affecting web applications worldwide.',
      severity: 'Critical',
      category: 'vulnerability',
      source: 'VirusTotal Intelligence',
      confidence: 98,
      timestamp: '2025-09-09T07:15:00Z',
      tags: ['Zero-Day', 'Apache Struts', 'RCE', 'Web Application'],
      indicators: [
        { type: 'URL', value: '/struts2-showcase/integration/saveGangster.action', context: 'Exploitation path' }
      ],
      mitre: {
        tactic: 'Initial Access',
        technique: 'T1190'
      },
      cve: 'CVE-2025-12345',
      impact: 'Critical - Remote code execution on web servers',
      recommendation: 'Immediately update Apache Struts to version 2.5.31 or later',
      isActive: true,
      affectedAssets: ['Web Applications', 'Application Servers'],
      relatedThreats: ['threat-4']
    },
    {
      id: 'threat-3',
      title: 'Ransomware Group "DarkVault" Targeting Financial Institutions',
      description: 'New ransomware variant "DarkVault" specifically targeting financial institutions with advanced evasion techniques.',
      severity: 'High',
      category: 'ransomware',
      source: 'AlienVault OTX',
      confidence: 87,
      timestamp: '2025-09-09T06:45:00Z',
      tags: ['Ransomware', 'Financial', 'Evasion', 'Double Extortion'],
      indicators: [
        { type: 'Hash', value: 'f1e2d3c4b5a6987654321', context: 'Ransomware payload hash' },
        { type: 'Email', value: 'payment@darkvault.onion', context: 'Ransom payment contact' }
      ],
      mitre: {
        tactic: 'Impact',
        technique: 'T1486'
      },
      impact: 'High - Data encryption and potential data exfiltration',
      recommendation: 'Enhance backup procedures, implement network segmentation, train staff on phishing',
      isActive: true,
      affectedAssets: ['File Servers', 'Database Servers', 'Workstations'],
      relatedThreats: ['threat-1']
    },
    {
      id: 'threat-4',
      title: 'Phishing Campaign Impersonating Microsoft Security Alerts',
      description: 'Large-scale phishing campaign using fake Microsoft security alerts to steal credentials and deploy remote access tools.',
      severity: 'Medium',
      category: 'phishing',
      source: 'Emerging Threats',
      confidence: 82,
      timestamp: '2025-09-09T05:20:00Z',
      tags: ['Phishing', 'Microsoft', 'Credential Theft', 'RAT'],
      indicators: [
        { type: 'Domain', value: 'microsoftsecurity-alerts.com', context: 'Phishing domain' },
        { type: 'URL', value: 'https://microsoftsecurity-alerts.com/verify', context: 'Credential harvesting page' }
      ],
      mitre: {
        tactic: 'Initial Access',
        technique: 'T1566.002'
      },
      impact: 'Medium - Credential theft and potential system compromise',
      recommendation: 'Block malicious domains, enhance email filtering, conduct security awareness training',
      isActive: true,
      affectedAssets: ['Email Systems', 'User Accounts'],
      relatedThreats: ['threat-2']
    }
  ];

  const globalThreatMap: GlobalThreatMap[] = [
    { country: 'United States', countryCode: 'US', threatLevel: 'High', activeThreats: 1247, coordinates: [-95.7129, 37.0902] },
    { country: 'China', countryCode: 'CN', threatLevel: 'Critical', activeThreats: 2156, coordinates: [104.1954, 35.8617] },
    { country: 'Russia', countryCode: 'RU', threatLevel: 'Critical', activeThreats: 1893, coordinates: [105.3188, 61.5240] },
    { country: 'North Korea', countryCode: 'KP', threatLevel: 'High', activeThreats: 892, coordinates: [127.5101, 40.3399] },
    { country: 'Iran', countryCode: 'IR', threatLevel: 'High', activeThreats: 634, coordinates: [53.6880, 32.4279] },
    { country: 'Germany', countryCode: 'DE', threatLevel: 'Medium', activeThreats: 456, coordinates: [10.4515, 51.1657] },
    { country: 'United Kingdom', countryCode: 'GB', threatLevel: 'Medium', activeThreats: 387, coordinates: [-3.4360, 55.3781] },
    { country: 'Brazil', countryCode: 'BR', threatLevel: 'Medium', activeThreats: 298, coordinates: [-51.9253, -14.2350] }
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 2000);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'inactive': return <XCircle className="w-4 h-4 text-gray-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
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

  const filteredThreats = threatIntelligence.filter(threat => {
    const matchesSearch = threat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         threat.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         threat.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSeverity = selectedSeverity === 'all' || threat.severity.toLowerCase() === selectedSeverity;
    const matchesCategory = selectedCategory === 'all' || threat.category === selectedCategory;
    
    return matchesSearch && matchesSeverity && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                <Radar className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Threat Intelligence
                </h1>
                <p className="text-lg text-muted-foreground">
                  Real-time global threat monitoring and intelligence analysis
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="px-3 py-1">
              <Activity className="w-3 h-3 mr-1" />
              {filteredThreats.length} Active Threats
            </Badge>
            <Button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Threat Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-200 dark:border-red-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">Critical Threats</p>
                  <p className="text-3xl font-bold text-red-700 dark:text-red-300">23</p>
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <ArrowUp className="w-3 h-3" />
                    +5 in 24h
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-200 dark:border-orange-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">High Severity</p>
                  <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">156</p>
                  <p className="text-xs text-orange-500 flex items-center gap-1">
                    <ArrowUp className="w-3 h-3" />
                    +12 in 24h
                  </p>
                </div>
                <Shield className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Active Feeds</p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{threatFeeds.filter(f => f.status === 'active').length}</p>
                  <p className="text-xs text-blue-500 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    All operational
                  </p>
                </div>
                <Database className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Mitigated Today</p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300">47</p>
                  <p className="text-xs text-green-500 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Success rate: 94%
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Threat Feeds Status */}
        <Card className="bg-gradient-to-r from-card to-card/80 border-border/50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Intelligence Feeds
            </CardTitle>
            <CardDescription>
              Status and performance of threat intelligence data sources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {threatFeeds.map((feed) => (
                <div key={feed.id} className="p-4 rounded-lg bg-background/50 border border-border/50">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{feed.name}</h4>
                      {getStatusIcon(feed.status)}
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Provider:</span>
                        <span>{feed.provider}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Threats:</span>
                        <span>{feed.threatCount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Reliability:</span>
                        <span className="text-primary">{feed.reliability}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Updated:</span>
                        <span>{formatTimestamp(feed.lastUpdate)}</span>
                      </div>
                    </div>
                    <Progress value={feed.reliability} className="h-1" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <Card className="bg-gradient-to-r from-card to-card/80 border-border/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search threats... (e.g., 'APT29', 'ransomware', 'phishing')"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-3 text-lg bg-background/50 border-border/70 focus:border-primary"
                />
              </div>
              <div className="flex gap-2">
                <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    {severityLevels.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        <span className="flex items-center gap-2">
                          {level.name} ({level.count})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <span className="flex items-center gap-2">
                          <category.icon className="w-4 h-4" />
                          {category.name}
                        </span>
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

        {/* Threat Intelligence List */}
        <div className="space-y-4">
          {filteredThreats.map((threat) => (
            <Card key={threat.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card/80 border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={getSeverityColor(threat.severity)}>
                        {threat.severity}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {threat.category.toUpperCase()}
                      </Badge>
                      {threat.cve && (
                        <Badge variant="outline" className="text-xs bg-red-500/10 text-red-600 border-red-200">
                          {threat.cve}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        Confidence: {threat.confidence}%
                      </Badge>
                    </div>
                    <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors">
                      {threat.title}
                    </CardTitle>
                    <CardDescription className="text-base">
                      {threat.description}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{formatTimestamp(threat.timestamp)}</p>
                    <p className="text-xs text-muted-foreground">Source: {threat.source}</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* MITRE ATT&CK */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">MITRE ATT&CK</h4>
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="text-sm space-y-1">
                        <div><span className="font-medium">Tactic:</span> {threat.mitre.tactic}</div>
                        <div><span className="font-medium">Technique:</span> {threat.mitre.technique}</div>
                        {threat.mitre.subtechnique && (
                          <div><span className="font-medium">Sub-technique:</span> {threat.mitre.subtechnique}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Indicators of Compromise */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Indicators of Compromise</h4>
                    <div className="space-y-2">
                      {threat.indicators.slice(0, 3).map((indicator, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-background/50 border border-border/50">
                          <div className="flex items-center justify-between">
                            <div className="text-xs space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {indicator.type}
                                </Badge>
                                <span className="font-mono text-xs">{indicator.value}</span>
                              </div>
                              <p className="text-muted-foreground">{indicator.context}</p>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Impact & Recommendation</h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-200 dark:border-orange-800">
                      <p className="text-sm text-orange-700 dark:text-orange-300">{threat.impact}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-green-500/5 border border-green-200 dark:border-green-800">
                      <p className="text-sm text-green-700 dark:text-green-300">{threat.recommendation}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {threat.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
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
                      <Download className="w-4 h-4" />
                      Export
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Share2 className="w-4 h-4" />
                      Share
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

        {/* Global Threat Map */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold flex items-center gap-2">
              <Globe className="w-6 h-6 text-primary" />
              Global Threat Activity
            </CardTitle>
            <CardDescription>
              Real-time threat intelligence from around the world
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {globalThreatMap.map((location) => (
                <div key={location.countryCode} className="p-4 rounded-lg bg-background/50 border border-border/50">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{location.country}</h4>
                      <Badge className={getSeverityColor(location.threatLevel)}>
                        {location.threatLevel}
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      {location.activeThreats.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">Active threats detected</p>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {location.coordinates[1].toFixed(2)}, {location.coordinates[0].toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default withAuth(ThreatIntelligenceHub);
