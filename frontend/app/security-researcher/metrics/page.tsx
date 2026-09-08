'use client';
import React, { useState } from 'react';
import { 
  BarChart3, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  ShieldCheck, 
  DollarSign, 
  Calendar, 
  Clock, 
  Activity, 
  Zap, 
  Eye, 
  Download, 
  Share2, 
  Settings, 
  RefreshCw,
  PieChart,
  LineChart,
  Building,
  Network,
  Database,
  Server,
  Globe,
  Users,
  Lock,
  Unlock,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  ArrowUp,
  ArrowDown,
  Calculator,
  Filter,
  Search,
  Plus,
  Minus,
  Percent,
  Hash,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import withAuth from '@/utils/withAuth';

interface RiskMetric {
  id: string;
  name: string;
  category: string;
  currentValue: number;
  previousValue: number;
  unit: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  trend: 'up' | 'down' | 'stable';
  description: string;
  impact: string;
  confidence: number;
  lastUpdated: string;
  recommendations: string[];
}

interface AssetRisk {
  id: string;
  name: string;
  type: 'application' | 'network' | 'data' | 'infrastructure' | 'personnel';
  riskScore: number;
  vulnerabilities: number;
  criticalIssues: number;
  value: number; // Business value
  exposure: number; // Exposure level
  mitigation: number; // Mitigation level
}

interface CostModel {
  category: string;
  potential_loss: number;
  mitigation_cost: number;
  probability: number;
  annual_loss_expectancy: number;
}

const CyberRiskMetrics = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAssetType, setSelectedAssetType] = useState('all');
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'financial'>('overview');

  const riskCategories = [
    { id: 'all', name: 'All Categories', icon: BarChart3 },
    { id: 'technical', name: 'Technical Risk', icon: Server },
    { id: 'operational', name: 'Operational Risk', icon: Activity },
    { id: 'financial', name: 'Financial Risk', icon: DollarSign },
    { id: 'compliance', name: 'Compliance Risk', icon: Shield },
    { id: 'reputational', name: 'Reputational Risk', icon: Users },
    { id: 'strategic', name: 'Strategic Risk', icon: Target }
  ];

  const riskMetrics: RiskMetric[] = [
    {
      id: '1',
      name: 'Overall Cyber Risk Score',
      category: 'technical',
      currentValue: 7.2,
      previousValue: 6.8,
      unit: '/10',
      severity: 'High',
      trend: 'up',
      description: 'Comprehensive risk assessment based on vulnerabilities, threats, and controls',
      impact: 'High likelihood of successful cyber attack within next 12 months',
      confidence: 87,
      lastUpdated: '2024-01-15T10:00:00Z',
      recommendations: [
        'Implement additional network segmentation',
        'Enhance endpoint detection capabilities',
        'Accelerate patch management processes'
      ]
    },
    {
      id: '2',
      name: 'Mean Time to Detection (MTTD)',
      category: 'operational',
      currentValue: 197,
      previousValue: 234,
      unit: 'days',
      severity: 'Critical',
      trend: 'down',
      description: 'Average time to detect security incidents and breaches',
      impact: 'Extended exposure time increases potential damage and costs',
      confidence: 92,
      lastUpdated: '2024-01-15T09:30:00Z',
      recommendations: [
        'Deploy advanced SIEM capabilities',
        'Implement behavioral analytics',
        'Enhance security monitoring coverage'
      ]
    },
    {
      id: '3',
      name: 'Annual Loss Expectancy (ALE)',
      category: 'financial',
      currentValue: 2.4,
      previousValue: 2.1,
      unit: 'M USD',
      severity: 'High',
      trend: 'up',
      description: 'Expected annual financial loss from cyber incidents',
      impact: 'Significant financial impact to business operations and revenue',
      confidence: 78,
      lastUpdated: '2024-01-15T09:00:00Z',
      recommendations: [
        'Increase cyber insurance coverage',
        'Implement business continuity planning',
        'Enhance data backup and recovery'
      ]
    },
    {
      id: '4',
      name: 'Vulnerability Exposure Score',
      category: 'technical',
      currentValue: 156,
      previousValue: 189,
      unit: 'CVEs',
      severity: 'Medium',
      trend: 'down',
      description: 'Number of unpatched critical and high vulnerabilities',
      impact: 'Reduced attack surface through improved patch management',
      confidence: 95,
      lastUpdated: '2024-01-15T08:45:00Z',
      recommendations: [
        'Continue accelerated patching program',
        'Implement vulnerability prioritization',
        'Enhance asset inventory management'
      ]
    },
    {
      id: '5',
      name: 'Compliance Risk Index',
      category: 'compliance',
      currentValue: 3.2,
      previousValue: 4.1,
      unit: '/10',
      severity: 'Medium',
      trend: 'down',
      description: 'Risk of regulatory non-compliance and associated penalties',
      impact: 'Improved compliance posture reduces regulatory and financial risks',
      confidence: 85,
      lastUpdated: '2024-01-15T08:15:00Z',
      recommendations: [
        'Complete remaining SOX controls',
        'Update privacy policies for GDPR',
        'Conduct compliance gap assessment'
      ]
    },
    {
      id: '6',
      name: 'Security Awareness Score',
      category: 'operational',
      currentValue: 78,
      previousValue: 72,
      unit: '%',
      severity: 'Low',
      trend: 'up',
      description: 'Employee security awareness and behavior assessment',
      impact: 'Improved employee security behavior reduces human-factor risks',
      confidence: 89,
      lastUpdated: '2024-01-15T07:30:00Z',
      recommendations: [
        'Continue phishing simulation program',
        'Expand security training topics',
        'Implement security champions program'
      ]
    }
  ];

  const assetRisks: AssetRisk[] = [
    {
      id: '1',
      name: 'Customer Database',
      type: 'data',
      riskScore: 9.2,
      vulnerabilities: 3,
      criticalIssues: 1,
      value: 10,
      exposure: 8,
      mitigation: 6
    },
    {
      id: '2',
      name: 'Payment Processing System',
      type: 'application',
      riskScore: 8.7,
      vulnerabilities: 5,
      criticalIssues: 2,
      value: 9,
      exposure: 7,
      mitigation: 7
    },
    {
      id: '3',
      name: 'Corporate Network',
      type: 'network',
      riskScore: 7.8,
      vulnerabilities: 12,
      criticalIssues: 0,
      value: 8,
      exposure: 6,
      mitigation: 8
    },
    {
      id: '4',
      name: 'Cloud Infrastructure',
      type: 'infrastructure',
      riskScore: 6.9,
      vulnerabilities: 8,
      criticalIssues: 1,
      value: 9,
      exposure: 5,
      mitigation: 9
    },
    {
      id: '5',
      name: 'Executive Team',
      type: 'personnel',
      riskScore: 6.2,
      vulnerabilities: 0,
      criticalIssues: 0,
      value: 8,
      exposure: 4,
      mitigation: 7
    }
  ];

  const costModels: CostModel[] = [
    {
      category: 'Data Breach',
      potential_loss: 4200000,
      mitigation_cost: 450000,
      probability: 0.15,
      annual_loss_expectancy: 630000
    },
    {
      category: 'Ransomware Attack',
      potential_loss: 2800000,
      mitigation_cost: 280000,
      probability: 0.22,
      annual_loss_expectancy: 616000
    },
    {
      category: 'Supply Chain Compromise',
      potential_loss: 1900000,
      mitigation_cost: 320000,
      probability: 0.08,
      annual_loss_expectancy: 152000
    },
    {
      category: 'Insider Threat',
      potential_loss: 1500000,
      mitigation_cost: 180000,
      probability: 0.12,
      annual_loss_expectancy: 180000
    },
    {
      category: 'Cloud Misconfiguration',
      potential_loss: 850000,
      mitigation_cost: 120000,
      probability: 0.28,
      annual_loss_expectancy: 238000
    }
  ];

  const getRiskColor = (score: number) => {
    if (score >= 8) return 'text-red-600 dark:text-red-400';
    if (score >= 6) return 'text-orange-600 dark:text-orange-400';
    if (score >= 4) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getRiskBadgeColor = (score: number) => {
    if (score >= 8) return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800';
    if (score >= 6) return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800';
    if (score >= 4) return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
    return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'High': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case 'Medium': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'Low': return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800';
      default: return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800';
    }
  };

  const getTrendIcon = (trend: string, change: number) => {
    const isPositiveTrend = change > 0;
    switch (trend) {
      case 'up': 
        return isPositiveTrend ? 
          <ArrowUp className="w-4 h-4 text-red-500" /> : 
          <ArrowUp className="w-4 h-4 text-green-500" />;
      case 'down': 
        return isPositiveTrend ? 
          <ArrowDown className="w-4 h-4 text-green-500" /> : 
          <ArrowDown className="w-4 h-4 text-red-500" />;
      case 'stable': 
        return <Minus className="w-4 h-4 text-yellow-500" />;
      default: 
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getAssetTypeIcon = (type: string) => {
    switch (type) {
      case 'application': return Globe;
      case 'network': return Network;
      case 'data': return Database;
      case 'infrastructure': return Server;
      case 'personnel': return Users;
      default: return Shield;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const filteredMetrics = riskMetrics.filter(metric => 
    selectedCategory === 'all' || metric.category === selectedCategory
  );

  const filteredAssets = assetRisks.filter(asset =>
    selectedAssetType === 'all' || asset.type === selectedAssetType
  );

  const totalALE = costModels.reduce((sum, model) => sum + model.annual_loss_expectancy, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                <BarChart3 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Cyber Risk Quantification
                </h1>
                <p className="text-lg text-muted-foreground">
                  Advanced risk assessment and cyber risk quantification metrics
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              <Button
                variant={viewMode === 'overview' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('overview')}
              >
                Overview
              </Button>
              <Button
                variant={viewMode === 'detailed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('detailed')}
              >
                Detailed
              </Button>
              <Button
                variant={viewMode === 'financial' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('financial')}
              >
                Financial
              </Button>
            </div>
            <Button className="gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Risk Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-200 dark:border-red-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">Overall Risk Score</p>
                  <p className="text-3xl font-bold text-red-700 dark:text-red-300">7.2/10</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <div className="flex items-center mt-2 text-sm">
                <ArrowUp className="w-4 h-4 text-red-500 mr-1" />
                <span className="text-red-600 dark:text-red-400">+0.4 from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-200 dark:border-orange-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Annual Loss Expectancy</p>
                  <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">$2.4M</p>
                </div>
                <DollarSign className="w-8 h-8 text-orange-500" />
              </div>
              <div className="flex items-center mt-2 text-sm">
                <ArrowUp className="w-4 h-4 text-orange-500 mr-1" />
                <span className="text-orange-600 dark:text-orange-400">+14% increase</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Critical Assets at Risk</p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">23</p>
                </div>
                <Target className="w-8 h-8 text-blue-500" />
              </div>
              <div className="flex items-center mt-2 text-sm">
                <ArrowDown className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600 dark:text-green-400">-3 from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Risk Coverage</p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300">84%</p>
                </div>
                <ShieldCheck className="w-8 h-8 text-green-500" />
              </div>
              <Progress value={84} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-gradient-to-r from-card to-card/80 border-border/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex gap-2 flex-1">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Risk Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {riskCategories.map((category) => (
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
                    <SelectItem value="7d">7 Days</SelectItem>
                    <SelectItem value="30d">30 Days</SelectItem>
                    <SelectItem value="90d">90 Days</SelectItem>
                    <SelectItem value="1y">1 Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="w-4 h-4" />
                  Configure
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {viewMode === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Risk Metrics */}
            <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-primary" />
                  Key Risk Metrics
                </CardTitle>
                <CardDescription>
                  Critical security risk indicators and trends
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredMetrics.slice(0, 4).map((metric) => {
                  const change = ((metric.currentValue - metric.previousValue) / metric.previousValue * 100);
                  return (
                    <div key={metric.id} className="p-4 rounded-lg border border-border/50 hover:border-primary/30 transition-colors bg-background/30">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-lg">{metric.name}</h4>
                          <div className="flex items-center gap-2">
                            <Badge className={getSeverityColor(metric.severity)}>
                              {metric.severity}
                            </Badge>
                            <div className="flex items-center gap-1">
                              {getTrendIcon(metric.trend, change)}
                              <span className={`font-bold text-sm ${
                                change > 0 ? 'text-red-500' : 'text-green-500'
                              }`}>
                                {change > 0 ? '+' : ''}{change.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-baseline gap-2">
                          <span className={`text-3xl font-bold ${getRiskColor(metric.currentValue)}`}>
                            {metric.currentValue}
                          </span>
                          <span className="text-lg text-muted-foreground">{metric.unit}</span>
                          <Badge variant="outline" className="ml-auto">
                            {metric.confidence}% confidence
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">{metric.description}</p>
                        
                        <div className="text-sm">
                          <span className="font-medium text-orange-600 dark:text-orange-400">Impact: </span>
                          <span>{metric.impact}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Asset Risk Assessment */}
            <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold flex items-center gap-2">
                  <Target className="w-6 h-6 text-primary" />
                  Critical Asset Risks
                </CardTitle>
                <CardDescription>
                  Risk assessment for high-value organizational assets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {assetRisks.map((asset) => {
                  const AssetIcon = getAssetTypeIcon(asset.type);
                  return (
                    <div key={asset.id} className="p-4 rounded-lg border border-border/50 hover:border-primary/30 transition-colors bg-background/30">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AssetIcon className="w-5 h-5 text-primary" />
                            <h4 className="font-semibold">{asset.name}</h4>
                          </div>
                          <Badge className={getRiskBadgeColor(asset.riskScore)}>
                            Risk: {asset.riskScore}/10
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-lg font-bold">{asset.vulnerabilities}</div>
                            <div className="text-muted-foreground">Vulnerabilities</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-red-600">{asset.criticalIssues}</div>
                            <div className="text-muted-foreground">Critical Issues</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold">{asset.value}/10</div>
                            <div className="text-muted-foreground">Business Value</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <div className="flex justify-between">
                              <span>Exposure</span>
                              <span>{asset.exposure}/10</span>
                            </div>
                            <Progress value={asset.exposure * 10} className="h-1 mt-1" />
                          </div>
                          <div>
                            <div className="flex justify-between">
                              <span>Mitigation</span>
                              <span>{asset.mitigation}/10</span>
                            </div>
                            <Progress value={asset.mitigation * 10} className="h-1 mt-1" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full gap-2">
                  <Eye className="w-4 h-4" />
                  View All Assets
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {viewMode === 'financial' && (
          <div className="space-y-8">
            {/* Financial Risk Models */}
            <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold flex items-center gap-2">
                  <Calculator className="w-6 h-6 text-primary" />
                  Cyber Risk Financial Models
                </CardTitle>
                <CardDescription>
                  Quantified financial impact and cost-benefit analysis of security investments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{formatCurrency(totalALE)}</div>
                    <div className="text-sm text-muted-foreground">Total Annual Loss Expectancy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(1350000)}</div>
                    <div className="text-sm text-muted-foreground">Security Investment Budget</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">1.8x</div>
                    <div className="text-sm text-muted-foreground">ROI on Security Investment</div>
                  </div>
                </div>

                <div className="space-y-4">
                  {costModels.map((model, index) => (
                    <div key={index} className="p-4 rounded-lg border border-border/50 bg-background/30">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-lg">{model.category}</h4>
                        <Badge variant="outline">
                          {(model.probability * 100).toFixed(1)}% probability
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Potential Loss</div>
                          <div className="font-semibold text-red-600">
                            {formatCurrency(model.potential_loss)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Mitigation Cost</div>
                          <div className="font-semibold text-blue-600">
                            {formatCurrency(model.mitigation_cost)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Annual Loss Expectancy</div>
                          <div className="font-semibold text-orange-600">
                            {formatCurrency(model.annual_loss_expectancy)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Cost Avoidance</div>
                          <div className="font-semibold text-green-600">
                            {formatCurrency(model.annual_loss_expectancy - model.mitigation_cost)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Risk vs Mitigation</span>
                          <span>{((model.mitigation_cost / model.potential_loss) * 100).toFixed(1)}% of potential loss</span>
                        </div>
                        <Progress 
                          value={(model.mitigation_cost / model.potential_loss) * 100} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* AI Insights */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" />
              AI Risk Assessment Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-600 mb-2">Risk Prediction</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      AI models predict a 23% increase in overall cyber risk over the next quarter based on current threat trends and vulnerability patterns.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-200 dark:border-orange-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-600 mb-2">Priority Recommendation</p>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      Focus security investments on network segmentation and endpoint detection to achieve maximum risk reduction ROI.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-600 mb-2">Optimization Opportunity</p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Current security controls are 15% over-invested in low-risk areas. Reallocation could improve overall posture by 12%.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-gradient-to-r from-muted/30 to-muted/10 border-border/30">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Advanced Risk Analytics</h3>
                <p className="text-muted-foreground">
                  Generate detailed risk reports and schedule automated assessments
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Risk Report
                </Button>
                <Button variant="outline" className="gap-2">
                  <Calculator className="w-4 h-4" />
                  ROI Calculator
                </Button>
                <Button className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  AI Assessment
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default withAuth(CyberRiskMetrics);
