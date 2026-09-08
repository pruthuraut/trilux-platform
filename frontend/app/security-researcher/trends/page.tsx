'use client';
import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Shield,
  Target,
  Activity,
  BarChart3,
  LineChart,
  Globe,
  Zap,
  Clock,
  Calendar,
  Eye,
  ArrowUp,
  ArrowDown,
  Minus,
  ExternalLink,
  Download,
  Share2,
  Filter,
  RefreshCw,
  Bell,
  Star,
  MapPin,
  Users,
  Database,
  Network,
  Code,
  Cloud,
  Smartphone,
  Laptop,
  Server,
  Lock,
  Unlock,
  Bug,
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Search,
  FileText,
  Image,
  Video,
  Headphones,
  Brain,
  Sparkles,
  Lightbulb
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import withAuth from '@/utils/withAuth';

interface TrendData {
  id: string;
  name: string;
  category: string;
  trend: 'up' | 'down' | 'stable';
  percentage: number;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
  description: string;
  impact: string;
  recommendations: string[];
  sources: number;
  lastUpdated: string;
  geography?: string[];
  industries?: string[];
  tags: string[];
}

interface ThreatIntelligence {
  id: string;
  title: string;
  type: 'apt' | 'malware' | 'vulnerability' | 'campaign' | 'technique';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  indicators: string[];
  mitigation: string[];
  attribution?: string;
  targetedSectors: string[];
  firstSeen: string;
  lastActivity: string;
  confidence: number;
}

const SecurityTrends = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const trendCategories = [
    { id: 'all', name: 'All Trends', icon: TrendingUp },
    { id: 'vulnerabilities', name: 'Vulnerabilities', icon: AlertTriangle },
    { id: 'threats', name: 'Threat Actors', icon: Target },
    { id: 'techniques', name: 'Attack Techniques', icon: Zap },
    { id: 'industries', name: 'Industry Targets', icon: Globe },
    { id: 'technologies', name: 'Technologies', icon: Database },
    { id: 'geography', name: 'Geographic', icon: MapPin }
  ];

  const securityTrends: TrendData[] = [
    {
      id: '1',
      name: 'AI-Powered Phishing Attacks',
      category: 'techniques',
      trend: 'up',
      percentage: 847,
      severity: 'Critical',
      description: 'Sophisticated phishing campaigns leveraging AI to create highly convincing social engineering attacks',
      impact: 'Organizations experiencing 8x increase in successful phishing attempts',
      recommendations: [
        'Implement advanced email security with AI detection',
        'Enhanced security awareness training',
        'Multi-factor authentication across all systems'
      ],
      sources: 156,
      lastUpdated: '2026-02-07T10:30:00Z',
      geography: ['North America', 'Europe', 'Asia-Pacific'],
      industries: ['Financial Services', 'Healthcare', 'Technology'],
      tags: ['AI', 'Phishing', 'Social Engineering', 'Email Security']
    },
    {
      id: '2',
      name: 'Supply Chain Attacks on Open Source',
      category: 'vulnerabilities',
      trend: 'up',
      percentage: 312,
      severity: 'High',
      description: 'Increased targeting of open source repositories and package managers',
      impact: 'Potential compromise of thousands of downstream applications',
      recommendations: [
        'Implement software composition analysis',
        'Regular dependency scanning',
        'Use trusted package repositories only'
      ],
      sources: 89,
      lastUpdated: '2026-02-05T09:45:00Z',
      geography: ['Global'],
      industries: ['Software Development', 'Technology', 'DevOps'],
      tags: ['Supply Chain', 'Open Source', 'Dependencies', 'SBOM']
    },
    {
      id: '3',
      name: 'Cloud Infrastructure Misconfigurations',
      category: 'vulnerabilities',
      trend: 'up',
      percentage: 156,
      severity: 'High',
      description: 'Growing number of exposed cloud resources due to misconfigurations',
      impact: 'Data breaches and unauthorized access to sensitive information',
      recommendations: [
        'Implement cloud security posture management',
        'Regular configuration audits',
        'Infrastructure as code with security templates'
      ],
      sources: 234,
      lastUpdated: '2026-02-03T08:20:00Z',
      geography: ['North America', 'Europe'],
      industries: ['Technology', 'Financial Services', 'Healthcare'],
      tags: ['Cloud Security', 'Misconfiguration', 'AWS', 'Azure', 'GCP']
    },
    {
      id: '4',
      name: 'Zero-Day Exploitation Frameworks',
      category: 'techniques',
      trend: 'up',
      percentage: 89,
      severity: 'Critical',
      description: 'Commercialization of zero-day exploits through automated frameworks',
      impact: 'Rapid exploitation of unpatched vulnerabilities across industries',
      recommendations: [
        'Implement advanced threat detection',
        'Accelerated patch management',
        'Network segmentation and monitoring'
      ],
      sources: 67,
      lastUpdated: '2026-01-31T07:15:00Z',
      geography: ['Global'],
      industries: ['Government', 'Critical Infrastructure', 'Technology'],
      tags: ['Zero-Day', 'Exploitation', 'APT', 'Frameworks']
    },
    {
      id: '5',
      name: 'Ransomware-as-a-Service Evolution',
      category: 'threats',
      trend: 'stable',
      percentage: 23,
      severity: 'Critical',
      description: 'Continued evolution of RaaS platforms with improved evasion techniques',
      impact: 'Persistent threat to organizations of all sizes',
      recommendations: [
        'Comprehensive backup and recovery plans',
        'Endpoint detection and response',
        'Employee training and awareness'
      ],
      sources: 145,
      lastUpdated: '2026-01-28T06:30:00Z',
      geography: ['Global'],
      industries: ['Healthcare', 'Education', 'Government', 'Manufacturing'],
      tags: ['Ransomware', 'RaaS', 'Encryption', 'Backup']
    },
    {
      id: '6',
      name: 'IoT Device Vulnerabilities',
      category: 'vulnerabilities',
      trend: 'down',
      percentage: -12,
      severity: 'Medium',
      description: 'Slight decrease in new IoT vulnerabilities due to improved security standards',
      impact: 'Reduced risk from connected device compromises',
      recommendations: [
        'Continue device inventory management',
        'Regular firmware updates',
        'Network segmentation for IoT devices'
      ],
      sources: 78,
      lastUpdated: '2026-01-25T05:45:00Z',
      geography: ['Global'],
      industries: ['Manufacturing', 'Smart Cities', 'Healthcare'],
      tags: ['IoT', 'Connected Devices', 'Firmware', 'Network Security']
    }
  ];

  const threatIntelligence: ThreatIntelligence[] = [
    {
      id: '1',
      title: 'APT-2026-001: ShadowNet Campaign',
      type: 'apt',
      severity: 'Critical',
      description: 'Advanced persistent threat group targeting financial institutions with novel AI-assisted reconnaissance',
      indicators: ['suspicious-domain.com', '192.168.1.100', 'SHA256:abc123...'],
      mitigation: ['Block listed IOCs', 'Enhanced monitoring', 'Patch CVE-2026-0001'],
      attribution: 'State-sponsored (High confidence)',
      targetedSectors: ['Financial Services', 'Cryptocurrency'],
      firstSeen: '2024-01-10',
      lastActivity: '2024-01-15',
      confidence: 92
    },
    {
      id: '2',
      title: 'CVE-2024-12345: Critical RCE in Popular Framework',
      type: 'vulnerability',
      severity: 'Critical',
      description: 'Remote code execution vulnerability in widely-used web application framework',
      indicators: ['Unusual HTTP requests', 'Unexpected process execution'],
      mitigation: ['Apply security patch immediately', 'Implement WAF rules', 'Monitor for exploitation attempts'],
      targetedSectors: ['Technology', 'E-commerce', 'SaaS'],
      firstSeen: '2024-01-12',
      lastActivity: '2024-01-15',
      confidence: 98
    }
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 2000);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUp className="w-4 h-4 text-red-500" />;
      case 'down': return <ArrowDown className="w-4 h-4 text-green-500" />;
      case 'stable': return <Minus className="w-4 h-4 text-yellow-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'High': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case 'Medium': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'Low': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      default: return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'apt': return Target;
      case 'malware': return Bug;
      case 'vulnerability': return AlertTriangle;
      case 'campaign': return Activity;
      case 'technique': return Zap;
      default: return Shield;
    }
  };

  const filteredTrends = securityTrends.filter(trend => {
    const matchesCategory = selectedCategory === 'all' || trend.category === selectedCategory;
    const matchesSearch = trend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trend.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trend.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Security Trends
                </h1>
                <p className="text-lg text-muted-foreground">
                  Real-time cybersecurity threat intelligence and trend analysis
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-card border rounded-lg">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                Last Updated: {currentTime.toLocaleTimeString()}
              </span>
            </div>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-200 dark:border-red-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">Critical Trends</p>
                  <p className="text-3xl font-bold text-red-700 dark:text-red-300">
                    {securityTrends.filter(t => t.severity === 'Critical').length}
                  </p>
                </div>
                <ShieldAlert className="w-8 h-8 text-red-500" />
              </div>
              <div className="flex items-center mt-2 text-sm">
                <TrendingUp className="w-4 h-4 text-red-500 mr-1" />
                <span className="text-red-600 dark:text-red-400">+3 from last week</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-200 dark:border-orange-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Emerging Threats</p>
                  <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">12</p>
                </div>
                <Target className="w-8 h-8 text-orange-500" />
              </div>
              <div className="flex items-center mt-2 text-sm">
                <TrendingUp className="w-4 h-4 text-orange-500 mr-1" />
                <span className="text-orange-600 dark:text-orange-400">+8 new this week</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Active Campaigns</p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">8</p>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
              <div className="flex items-center mt-2 text-sm">
                <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600 dark:text-green-400">-2 from last week</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Intelligence Sources</p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300">456</p>
                </div>
                <Database className="w-8 h-8 text-green-500" />
              </div>
              <div className="flex items-center mt-2 text-sm">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600 dark:text-green-400">Real-time updates</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="bg-gradient-to-r from-card to-card/80 border-border/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search security trends... (e.g., 'AI phishing', 'supply chain', 'zero-day')"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-3 text-lg bg-background/50 border-border/70 focus:border-primary"
                />
              </div>
              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {trendCategories.map((category) => (
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
                    <SelectValue placeholder="Timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">24 Hours</SelectItem>
                    <SelectItem value="7d">7 Days</SelectItem>
                    <SelectItem value="30d">30 Days</SelectItem>
                    <SelectItem value="90d">90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Security Trends */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-primary" />
                  Current Security Trends
                </CardTitle>
                <CardDescription>
                  Real-time analysis of cybersecurity threats and attack patterns
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredTrends.map((trend) => (
                  <div key={trend.id} className="p-4 rounded-lg border border-border/50 hover:border-primary/30 transition-colors bg-background/30">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={getSeverityColor(trend.severity)}>
                              {trend.severity}
                            </Badge>
                            <div className="flex items-center gap-1">
                              {getTrendIcon(trend.trend)}
                              <span className={`font-bold ${trend.trend === 'up' ? 'text-red-500' :
                                trend.trend === 'down' ? 'text-green-500' :
                                  'text-yellow-500'
                                }`}>
                                {trend.percentage > 0 ? '+' : ''}{trend.percentage}%
                              </span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {trend.sources} sources
                            </Badge>
                          </div>

                          <h4 className="font-semibold text-lg leading-tight">
                            {trend.name}
                          </h4>

                          <p className="text-sm text-muted-foreground">
                            {trend.description}
                          </p>

                          <div className="space-y-2">
                            <div className="text-sm">
                              <span className="font-medium text-orange-600 dark:text-orange-400">Impact: </span>
                              <span>{trend.impact}</span>
                            </div>

                            <div className="text-sm">
                              <span className="font-medium text-blue-600 dark:text-blue-400">Key Recommendations:</span>
                              <ul className="mt-1 ml-4 list-disc text-muted-foreground">
                                {trend.recommendations.slice(0, 2).map((rec, idx) => (
                                  <li key={idx}>{rec}</li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1 mt-3">
                            {trend.tags.map((tag, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/30">
                            <span>Updated: {new Date(trend.lastUpdated).toLocaleString()}</span>
                            <div className="flex items-center gap-4">
                              {trend.geography && (
                                <span>Regions: {trend.geography.slice(0, 2).join(', ')}</span>
                              )}
                              {trend.industries && (
                                <span>Industries: {trend.industries.slice(0, 2).join(', ')}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <div className="flex items-center gap-2 w-full">
                  <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Export Report
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Bell className="w-4 h-4" />
                    Set Alerts
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Share2 className="w-4 h-4" />
                    Share Analysis
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>

          {/* Threat Intelligence Sidebar */}
          <div className="space-y-6">
            {/* Live Threat Intel */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Live Threat Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {threatIntelligence.map((intel) => {
                  const TypeIcon = getTypeIcon(intel.type);
                  return (
                    <div key={intel.id} className="p-3 rounded-lg border border-border/50 bg-background/50">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <TypeIcon className="w-4 h-4 text-primary" />
                          <Badge className={getSeverityColor(intel.severity)}>
                            {intel.severity}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {intel.confidence}% confidence
                          </Badge>
                        </div>

                        <h4 className="font-medium text-sm line-clamp-2">
                          {intel.title}
                        </h4>

                        <p className="text-xs text-muted-foreground line-clamp-3">
                          {intel.description}
                        </p>

                        <div className="text-xs text-muted-foreground">
                          <div>First seen: {intel.firstSeen}</div>
                          <div>Last activity: {intel.lastActivity}</div>
                          <div>Targeted: {intel.targetedSectors.slice(0, 2).join(', ')}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <ExternalLink className="w-4 h-4" />
                  View Full Intel Feed
                </Button>
              </CardFooter>
            </Card>

            {/* AI Insights */}
            <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-600 mb-1">Predicted Trend</p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        AI models predict a 150% increase in supply chain attacks targeting open source packages over the next 30 days.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-200 dark:border-orange-800">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-orange-600 mb-1">Risk Assessment</p>
                      <p className="text-xs text-orange-700 dark:text-orange-300">
                        Current threat landscape poses elevated risk to financial services sector based on recent attack patterns.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-green-500/10 border border-green-200 dark:border-green-800">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-600 mb-1">Recommendation</p>
                      <p className="text-xs text-green-700 dark:text-green-300">
                        Prioritize implementing zero trust architecture and enhanced monitoring for API endpoints.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                  <Download className="w-4 h-4" />
                  Download Threat Report
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                  <Bell className="w-4 h-4" />
                  Configure Alerts
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                  <FileText className="w-4 h-4" />
                  Generate IOCs
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                  <Share2 className="w-4 h-4" />
                  Share with Team
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default withAuth(SecurityTrends);
