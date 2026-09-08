'use client';
import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  Target, 
  Shield, 
  AlertTriangle, 
  Activity, 
  BarChart3, 
  PieChart, 
  LineChart, 
  Eye, 
  Search, 
  Filter, 
  Download, 
  Share2, 
  RefreshCw, 
  Clock, 
  Calendar, 
  Star, 
  Bookmark, 
  ThumbsUp, 
  ThumbsDown, 
  MessageCircle, 
  Lightbulb, 
  Database, 
  Network, 
  Server, 
  Globe, 
  Lock, 
  Unlock, 
  Bug, 
  Code, 
  FileText, 
  Users, 
  Building, 
  Layers, 
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
  Sparkles,
  Cpu,
  Workflow,
  GitBranch,
  Microscope,
  Radar,
  Crosshair,
  Gauge,
  Settings,
  Play,
  Pause,
  Square,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Minimize
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

interface AIInsight {
  id: string;
  title: string;
  description: string;
  category: 'predictive' | 'behavioral' | 'threat-hunting' | 'vulnerability' | 'compliance' | 'forensic';
  confidence: number;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
  timestamp: string;
  dataSource: string;
  analysis: {
    summary: string;
    details: string[];
    recommendations: string[];
    evidence: string[];
  };
  metrics: {
    accuracy: number;
    relevance: number;
    urgency: number;
  };
  tags: string[];
  affectedSystems: string[];
  relatedInsights: string[];
  status: 'new' | 'reviewing' | 'validated' | 'implemented' | 'dismissed';
}

interface AIModel {
  id: string;
  name: string;
  type: 'ML' | 'DL' | 'NLP' | 'CV' | 'RL' | 'Ensemble';
  status: 'active' | 'training' | 'maintenance' | 'offline';
  accuracy: number;
  lastTrained: string;
  predictions: number;
  category: string;
  description: string;
}

interface AnalysisWorkflow {
  id: string;
  name: string;
  description: string;
  steps: {
    id: string;
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: number;
    duration?: number;
  }[];
  status: 'queued' | 'running' | 'completed' | 'failed';
  totalProgress: number;
  estimatedTime: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

const AIInsightsHub = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null);
  const [activeWorkflows, setActiveWorkflows] = useState<AnalysisWorkflow[]>([]);

  const categories = [
    { id: 'all', name: 'All Categories', icon: Brain },
    { id: 'predictive', name: 'Predictive Analysis', icon: TrendingUp },
    { id: 'behavioral', name: 'Behavioral Analysis', icon: Activity },
    { id: 'threat-hunting', name: 'Threat Hunting', icon: Target },
    { id: 'vulnerability', name: 'Vulnerability Analysis', icon: Bug },
    { id: 'compliance', name: 'Compliance Analysis', icon: Shield },
    { id: 'forensic', name: 'Digital Forensics', icon: Microscope }
  ];

  const aiModels: AIModel[] = [
    {
      id: 'model-1',
      name: 'Advanced Threat Detection Engine',
      type: 'ML',
      status: 'active',
      accuracy: 96.8,
      lastTrained: '2025-09-08T14:30:00Z',
      predictions: 15420,
      category: 'Threat Detection',
      description: 'Machine learning model for real-time threat detection and classification'
    },
    {
      id: 'model-2',
      name: 'Behavioral Anomaly Detector',
      type: 'DL',
      status: 'active',
      accuracy: 94.2,
      lastTrained: '2025-09-07T09:15:00Z',
      predictions: 8756,
      category: 'Behavioral Analysis',
      description: 'Deep learning model for detecting anomalous user and system behavior'
    },
    {
      id: 'model-3',
      name: 'Vulnerability Risk Predictor',
      type: 'Ensemble',
      status: 'training',
      accuracy: 92.5,
      lastTrained: '2025-09-06T16:45:00Z',
      predictions: 12890,
      category: 'Risk Assessment',
      description: 'Ensemble model for predicting vulnerability exploitation likelihood'
    },
    {
      id: 'model-4',
      name: 'Malware Classification System',
      type: 'CV',
      status: 'active',
      accuracy: 98.1,
      lastTrained: '2025-09-08T11:20:00Z',
      predictions: 23456,
      category: 'Malware Analysis',
      description: 'Computer vision model for malware binary analysis and classification'
    },
    {
      id: 'model-5',
      name: 'Phishing Content Analyzer',
      type: 'NLP',
      status: 'active',
      accuracy: 97.3,
      lastTrained: '2025-09-08T13:10:00Z',
      predictions: 18234,
      category: 'Content Analysis',
      description: 'Natural language processing model for phishing email and content detection'
    }
  ];

  const aiInsights: AIInsight[] = [
    {
      id: 'insight-1',
      title: 'Predicted APT Campaign Targeting Financial Sector',
      description: 'AI models detect patterns indicating upcoming advanced persistent threat campaign targeting financial institutions.',
      category: 'predictive',
      confidence: 89,
      severity: 'Critical',
      timestamp: '2025-09-09T10:15:00Z',
      dataSource: 'Multiple Threat Intel Feeds + Behavioral Analysis',
      analysis: {
        summary: 'Machine learning models have identified convergent indicators suggesting a coordinated APT campaign will target financial institutions within the next 72 hours.',
        details: [
          'Increased reconnaissance activity against financial domain registrations',
          'Spike in phishing infrastructure provisioning with financial themes',
          'Pattern correlation with historical APT29 campaign signatures',
          'Behavioral anomalies in threat actor communication channels'
        ],
        recommendations: [
          'Enhance monitoring of email gateways and web application firewalls',
          'Implement additional authentication factors for critical financial systems',
          'Coordinate with industry threat sharing organizations',
          'Prepare incident response teams for potential coordinated attack'
        ],
        evidence: [
          'DNS registration patterns: 94% correlation with previous campaigns',
          'Infrastructure timing analysis: 87% match with APT historical behavior',
          'Communication metadata analysis: 91% confidence in threat actor attribution'
        ]
      },
      metrics: {
        accuracy: 89,
        relevance: 95,
        urgency: 92
      },
      tags: ['APT', 'Financial Sector', 'Predictive', 'Campaign Analysis'],
      affectedSystems: ['Banking Systems', 'Payment Processors', 'Financial APIs'],
      relatedInsights: ['insight-3', 'insight-5'],
      status: 'new'
    },
    {
      id: 'insight-2',
      title: 'Anomalous Network Behavior Indicating Lateral Movement',
      description: 'Behavioral analysis models detected unusual network traffic patterns consistent with lateral movement techniques.',
      category: 'behavioral',
      confidence: 92,
      severity: 'High',
      timestamp: '2025-09-09T09:45:00Z',
      dataSource: 'Network Traffic Analysis + User Behavior Analytics',
      analysis: {
        summary: 'Deep learning models identified anomalous network behavior patterns indicating potential lateral movement within corporate networks.',
        details: [
          'Unusual SMB traffic patterns between previously unconnected network segments',
          'Elevated privilege escalation attempts detected across multiple endpoints',
          'Suspicious PowerShell execution patterns with network connectivity',
          'Abnormal authentication patterns suggesting credential reuse'
        ],
        recommendations: [
          'Implement network segmentation controls immediately',
          'Review and rotate credentials for affected user accounts',
          'Deploy additional endpoint detection and response agents',
          'Conduct forensic analysis on identified compromised systems'
        ],
        evidence: [
          'Network traffic analysis: 92% deviation from baseline behavior',
          'Authentication log correlation: 88% indication of credential compromise',
          'Endpoint telemetry analysis: 94% confidence in lateral movement detection'
        ]
      },
      metrics: {
        accuracy: 92,
        relevance: 88,
        urgency: 85
      },
      tags: ['Lateral Movement', 'Network Analysis', 'Behavioral', 'Credential Compromise'],
      affectedSystems: ['Corporate Network', 'Domain Controllers', 'File Servers'],
      relatedInsights: ['insight-4', 'insight-6'],
      status: 'reviewing'
    },
    {
      id: 'insight-3',
      title: 'Zero-Day Vulnerability Exploitation Prediction',
      description: 'Vulnerability analysis models predict high likelihood of zero-day exploitation in popular web frameworks.',
      category: 'vulnerability',
      confidence: 85,
      severity: 'Critical',
      timestamp: '2025-09-09T08:30:00Z',
      dataSource: 'Vulnerability Intelligence + Code Analysis',
      analysis: {
        summary: 'AI analysis of vulnerability patterns and exploit development indicators suggests imminent zero-day exploitation in web application frameworks.',
        details: [
          'Code complexity analysis indicates potential memory corruption vulnerabilities',
          'Dark web intelligence suggests active exploit development discussions',
          'Framework adoption rate analysis shows widespread potential impact',
          'Historical vulnerability pattern matching indicates high exploitation probability'
        ],
        recommendations: [
          'Implement additional web application firewall rules',
          'Enhance input validation and sanitization procedures',
          'Conduct emergency security code reviews for critical applications',
          'Prepare emergency patching procedures for when patches become available'
        ],
        evidence: [
          'Code analysis confidence: 85% likelihood of exploitable vulnerabilities',
          'Dark web intelligence correlation: 78% match with exploit development patterns',
          'Impact assessment: 94% of analyzed applications potentially vulnerable'
        ]
      },
      metrics: {
        accuracy: 85,
        relevance: 97,
        urgency: 88
      },
      tags: ['Zero-Day', 'Web Applications', 'Vulnerability', 'Exploit Prediction'],
      affectedSystems: ['Web Applications', 'API Gateways', 'Application Servers'],
      relatedInsights: ['insight-1', 'insight-7'],
      status: 'validated'
    },
    {
      id: 'insight-4',
      title: 'Insider Threat Risk Assessment Alert',
      description: 'Behavioral analysis indicates elevated insider threat risk from specific user accounts with unusual access patterns.',
      category: 'behavioral',
      confidence: 78,
      severity: 'Medium',
      timestamp: '2025-09-09T07:20:00Z',
      dataSource: 'User Behavior Analytics + Access Control Logs',
      analysis: {
        summary: 'Machine learning models detected behavioral anomalies in user access patterns indicating potential insider threat activity.',
        details: [
          'Unusual file access patterns during non-business hours',
          'Elevated data download volumes compared to historical baseline',
          'Access to sensitive systems outside normal job responsibilities',
          'Communication pattern analysis suggests potential coordination with external entities'
        ],
        recommendations: [
          'Implement additional monitoring for flagged user accounts',
          'Review and restrict access permissions based on principle of least privilege',
          'Conduct confidential interviews with security personnel',
          'Enhance data loss prevention controls for identified risk areas'
        ],
        evidence: [
          'Behavioral deviation score: 78% above baseline for affected users',
          'Access pattern analysis: 82% correlation with known insider threat indicators',
          'Data access volume: 156% increase compared to peer group average'
        ]
      },
      metrics: {
        accuracy: 78,
        relevance: 71,
        urgency: 65
      },
      tags: ['Insider Threat', 'User Behavior', 'Access Control', 'Risk Assessment'],
      affectedSystems: ['File Systems', 'Database Servers', 'Email Systems'],
      relatedInsights: ['insight-2', 'insight-8'],
      status: 'reviewing'
    }
  ];

  const analysisWorkflows: AnalysisWorkflow[] = [
    {
      id: 'workflow-1',
      name: 'Comprehensive Threat Landscape Analysis',
      description: 'Full spectrum analysis of current threat landscape using multiple AI models',
      steps: [
        { id: 'step-1', name: 'Data Collection', status: 'completed', progress: 100, duration: 45 },
        { id: 'step-2', name: 'Threat Classification', status: 'completed', progress: 100, duration: 120 },
        { id: 'step-3', name: 'Pattern Analysis', status: 'running', progress: 67, duration: undefined },
        { id: 'step-4', name: 'Risk Assessment', status: 'pending', progress: 0, duration: undefined },
        { id: 'step-5', name: 'Report Generation', status: 'pending', progress: 0, duration: undefined }
      ],
      status: 'running',
      totalProgress: 54,
      estimatedTime: 180,
      priority: 'high'
    },
    {
      id: 'workflow-2',
      name: 'Network Behavior Anomaly Detection',
      description: 'Deep analysis of network traffic patterns for anomaly detection',
      steps: [
        { id: 'step-1', name: 'Traffic Parsing', status: 'completed', progress: 100, duration: 30 },
        { id: 'step-2', name: 'Baseline Comparison', status: 'completed', progress: 100, duration: 60 },
        { id: 'step-3', name: 'Anomaly Detection', status: 'completed', progress: 100, duration: 90 },
        { id: 'step-4', name: 'Risk Scoring', status: 'running', progress: 23, duration: undefined }
      ],
      status: 'running',
      totalProgress: 81,
      estimatedTime: 45,
      priority: 'medium'
    }
  ];

  const handleStartAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 3000);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 dark:text-green-400';
      case 'training': return 'text-blue-600 dark:text-blue-400';
      case 'maintenance': return 'text-yellow-600 dark:text-yellow-400';
      case 'offline': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getWorkflowStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 dark:text-green-400';
      case 'running': return 'text-blue-600 dark:text-blue-400';
      case 'pending': return 'text-yellow-600 dark:text-yellow-400';
      case 'failed': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
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

  const filteredInsights = aiInsights.filter(insight => {
    const matchesSearch = insight.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         insight.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         insight.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || insight.category === selectedCategory;
    const matchesSeverity = selectedSeverity === 'all' || insight.severity.toLowerCase() === selectedSeverity;
    
    return matchesSearch && matchesCategory && matchesSeverity;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                <Brain className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  AI Insights
                </h1>
                <p className="text-lg text-muted-foreground">
                  Advanced artificial intelligence for security analysis and prediction
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="px-3 py-1">
              <Sparkles className="w-3 h-3 mr-1" />
              {filteredInsights.length} AI Insights
            </Badge>
            <Button 
              onClick={handleStartAnalysis}
              disabled={isAnalyzing}
              className="gap-2"
            >
              <Zap className={`w-4 h-4 ${isAnalyzing ? 'animate-pulse' : ''}`} />
              {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
            </Button>
          </div>
        </div>

        {/* AI Models Status */}
        <Card className="bg-gradient-to-r from-card to-card/80 border-border/50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Cpu className="w-5 h-5 text-primary" />
              AI Models Status
            </CardTitle>
            <CardDescription>
              Real-time status and performance of AI/ML models
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {aiModels.map((model) => (
                <div key={model.id} className="p-4 rounded-lg bg-background/50 border border-border/50">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{model.name}</h4>
                      <Badge variant="outline" className={getStatusColor(model.status)}>
                        {model.status}
                      </Badge>
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <span>{model.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Accuracy:</span>
                        <span className="text-primary">{model.accuracy}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Predictions:</span>
                        <span>{model.predictions.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Trained:</span>
                        <span>{formatTimestamp(model.lastTrained)}</span>
                      </div>
                    </div>
                    <Progress value={model.accuracy} className="h-1" />
                    <p className="text-xs text-muted-foreground">{model.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Analysis Workflows */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Workflow className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Active Analysis Workflows
            </CardTitle>
            <CardDescription>
              Real-time AI analysis workflows and their progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysisWorkflows.map((workflow) => (
                <div key={workflow.id} className="p-4 rounded-lg bg-background/50 border border-border/50">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{workflow.name}</h4>
                        <p className="text-sm text-muted-foreground">{workflow.description}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={getWorkflowStatusColor(workflow.status)}>
                          {workflow.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          ETA: {workflow.estimatedTime}m
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Overall Progress</span>
                        <span>{workflow.totalProgress}%</span>
                      </div>
                      <Progress value={workflow.totalProgress} className="h-2" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
                      {workflow.steps.map((step) => (
                        <div key={step.id} className="p-2 rounded bg-primary/5 border border-primary/20">
                          <div className="text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{step.name}</span>
                              <Badge variant="outline" className={`text-xs ${getWorkflowStatusColor(step.status)}`}>
                                {step.status}
                              </Badge>
                            </div>
                            {step.status === 'running' && (
                              <Progress value={step.progress} className="h-1" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
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
                  placeholder="Search AI insights... (e.g., 'APT', 'behavioral', 'vulnerability')"
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

                <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights List */}
        <div className="space-y-6">
          {filteredInsights.map((insight) => (
            <Card key={insight.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card/80 border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={getSeverityColor(insight.severity)}>
                        {insight.severity}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {insight.category.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-200">
                        Confidence: {insight.confidence}%
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {insight.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors">
                      {insight.title}
                    </CardTitle>
                    <CardDescription className="text-base">
                      {insight.description}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{formatTimestamp(insight.timestamp)}</p>
                    <p className="text-xs text-muted-foreground">Source: {insight.dataSource}</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <h4 className="text-sm font-medium mb-2">AI Analysis Summary</h4>
                  <p className="text-sm text-muted-foreground">{insight.analysis.summary}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Key Findings</h4>
                    <div className="space-y-1">
                      {insight.analysis.details.slice(0, 3).map((detail, idx) => (
                        <div key={idx} className="p-2 rounded bg-background/50 border border-border/50">
                          <p className="text-xs text-muted-foreground">{detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Recommendations</h4>
                    <div className="space-y-1">
                      {insight.analysis.recommendations.slice(0, 3).map((rec, idx) => (
                        <div key={idx} className="p-2 rounded bg-green-500/5 border border-green-200 dark:border-green-800">
                          <p className="text-xs text-green-700 dark:text-green-300">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">AI Metrics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Accuracy:</span>
                        <span className="text-primary">{insight.metrics.accuracy}%</span>
                      </div>
                      <Progress value={insight.metrics.accuracy} className="h-1" />
                      
                      <div className="flex justify-between text-xs">
                        <span>Relevance:</span>
                        <span className="text-primary">{insight.metrics.relevance}%</span>
                      </div>
                      <Progress value={insight.metrics.relevance} className="h-1" />
                      
                      <div className="flex justify-between text-xs">
                        <span>Urgency:</span>
                        <span className="text-primary">{insight.metrics.urgency}%</span>
                      </div>
                      <Progress value={insight.metrics.urgency} className="h-1" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Affected Systems</h4>
                  <div className="flex flex-wrap gap-1">
                    {insight.affectedSystems.map((system, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {system}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {insight.tags.map((tag, idx) => (
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
                      <ThumbsUp className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <ThumbsDown className="w-4 h-4" />
                    </Button>
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

        {/* Quick Actions */}
        <Card className="bg-gradient-to-r from-muted/30 to-muted/10 border-border/30">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Advanced AI Analysis Tools</h3>
                <p className="text-muted-foreground">
                  Leverage cutting-edge artificial intelligence for comprehensive security analysis
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="gap-2">
                  <Settings className="w-4 h-4" />
                  Model Settings
                </Button>
                <Button variant="outline" className="gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Performance Metrics
                </Button>
                <Button className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  Train New Model
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default withAuth(AIInsightsHub);
