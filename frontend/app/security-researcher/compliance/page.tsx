'use client';
import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Lock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  AlertCircle, 
  Eye, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Share2, 
  RefreshCw, 
  Clock, 
  Calendar, 
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
  Building,
  Home,
  Layers,
  Target,
  Zap,
  Database,
  Clipboard,
  ClipboardCheck,
  ClipboardList,
  Award,
  BadgeCheck,
  Scan,
  FileSearch,
  ListChecks,
  CheckSquare,
  AlertOctagon,
  Scale,
  BookOpen,
  GraduationCap,
  Library,
  ScrollText
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

interface ComplianceFramework {
  id: string;
  name: string;
  fullName: string;
  category: 'security' | 'privacy' | 'industry' | 'regional' | 'internal';
  description: string;
  applicability: string[];
  requirements: number;
  implementedRequirements: number;
  status: 'compliant' | 'non-compliant' | 'in-progress' | 'not-applicable';
  lastAssessment: string;
  nextAssessment: string;
  certificationStatus: 'certified' | 'expired' | 'pending' | 'not-certified';
  certificationExpiry?: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  auditFrequency: 'monthly' | 'quarterly' | 'annually' | 'biannually';
  tags: string[];
}

interface ComplianceRequirement {
  id: string;
  frameworkId: string;
  controlId: string;
  title: string;
  description: string;
  category: 'access-control' | 'data-protection' | 'incident-response' | 'risk-management' | 'governance' | 'technical' | 'operational';
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'implemented' | 'partial' | 'not-implemented' | 'not-applicable';
  evidence: string[];
  lastReview: string;
  nextReview: string;
  assignee: string;
  implementationNotes: string;
  testResults: {
    date: string;
    result: 'pass' | 'fail' | 'partial';
    notes: string;
  }[];
}

interface ComplianceAudit {
  id: string;
  name: string;
  framework: string;
  type: 'internal' | 'external' | 'third-party' | 'self-assessment';
  scope: string[];
  status: 'planned' | 'in-progress' | 'completed' | 'on-hold';
  startDate: string;
  endDate?: string;
  auditor: string;
  findings: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  overallRating: 'excellent' | 'good' | 'satisfactory' | 'needs-improvement' | 'poor';
  recommendations: string[];
  actionItems: {
    id: string;
    description: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    dueDate: string;
    assignee: string;
    status: 'open' | 'in-progress' | 'completed';
  }[];
}

interface ComplianceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  target: number;
  trend: 'up' | 'down' | 'stable';
  category: 'coverage' | 'maturity' | 'effectiveness' | 'cost';
  period: string;
  benchmark?: number;
}

interface PolicyDocument {
  id: string;
  title: string;
  type: 'policy' | 'procedure' | 'standard' | 'guideline' | 'plan';
  category: string;
  version: string;
  status: 'draft' | 'review' | 'approved' | 'archived';
  owner: string;
  lastUpdated: string;
  nextReview: string;
  relatedFrameworks: string[];
  documentUrl: string;
  approvalDate?: string;
  effectiveDate?: string;
}

const ComplianceCenterHub = () => {
  const [selectedFramework, setSelectedFramework] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [activeView, setActiveView] = useState('frameworks');

  const complianceFrameworks: ComplianceFramework[] = [
    {
      id: 'soc2',
      name: 'SOC 2',
      fullName: 'Service Organization Control 2',
      category: 'security',
      description: 'Trust Services Criteria for security, availability, processing integrity, confidentiality, and privacy',
      applicability: ['SaaS', 'Cloud Services', 'Data Processing'],
      requirements: 64,
      implementedRequirements: 58,
      status: 'compliant',
      lastAssessment: '2025-06-15T00:00:00Z',
      nextAssessment: '2025-12-15T00:00:00Z',
      certificationStatus: 'certified',
      certificationExpiry: '2025-12-15T00:00:00Z',
      riskLevel: 'low',
      auditFrequency: 'annually',
      tags: ['security', 'cloud', 'audited']
    },
    {
      id: 'iso27001',
      name: 'ISO 27001',
      fullName: 'Information Security Management System',
      category: 'security',
      description: 'International standard for information security management systems',
      applicability: ['All Organizations', 'Information Security'],
      requirements: 114,
      implementedRequirements: 98,
      status: 'compliant',
      lastAssessment: '2025-03-20T00:00:00Z',
      nextAssessment: '2026-03-20T00:00:00Z',
      certificationStatus: 'certified',
      certificationExpiry: '2026-03-20T00:00:00Z',
      riskLevel: 'low',
      auditFrequency: 'annually',
      tags: ['security', 'international', 'comprehensive']
    },
    {
      id: 'gdpr',
      name: 'GDPR',
      fullName: 'General Data Protection Regulation',
      category: 'privacy',
      description: 'EU regulation on data protection and privacy for individuals within the European Union',
      applicability: ['EU Operations', 'EU Customer Data', 'Global Organizations'],
      requirements: 47,
      implementedRequirements: 44,
      status: 'compliant',
      lastAssessment: '2025-07-10T00:00:00Z',
      nextAssessment: '2025-10-10T00:00:00Z',
      certificationStatus: 'not-certified',
      riskLevel: 'medium',
      auditFrequency: 'quarterly',
      tags: ['privacy', 'eu', 'data-protection']
    },
    {
      id: 'pcidss',
      name: 'PCI DSS',
      fullName: 'Payment Card Industry Data Security Standard',
      category: 'industry',
      description: 'Security standard for organizations that handle branded credit cards',
      applicability: ['Payment Processing', 'E-commerce', 'Financial Services'],
      requirements: 362,
      implementedRequirements: 320,
      status: 'in-progress',
      lastAssessment: '2025-05-01T00:00:00Z',
      nextAssessment: '2025-11-01T00:00:00Z',
      certificationStatus: 'pending',
      riskLevel: 'high',
      auditFrequency: 'annually',
      tags: ['payment', 'financial', 'industry']
    },
    {
      id: 'hipaa',
      name: 'HIPAA',
      fullName: 'Health Insurance Portability and Accountability Act',
      category: 'industry',
      description: 'US legislation that provides data privacy and security provisions for safeguarding medical information',
      applicability: ['Healthcare', 'Medical Records', 'Health Information'],
      requirements: 45,
      implementedRequirements: 25,
      status: 'non-compliant',
      lastAssessment: '2025-04-15T00:00:00Z',
      nextAssessment: '2025-09-15T00:00:00Z',
      certificationStatus: 'not-certified',
      riskLevel: 'critical',
      auditFrequency: 'biannually',
      tags: ['healthcare', 'us', 'medical']
    },
    {
      id: 'nist',
      name: 'NIST CSF',
      fullName: 'NIST Cybersecurity Framework',
      category: 'security',
      description: 'Framework consisting of standards, guidelines, and best practices to manage cybersecurity risk',
      applicability: ['Critical Infrastructure', 'Federal Agencies', 'Enterprise'],
      requirements: 98,
      implementedRequirements: 78,
      status: 'in-progress',
      lastAssessment: '2025-08-01T00:00:00Z',
      nextAssessment: '2026-02-01T00:00:00Z',
      certificationStatus: 'not-certified',
      riskLevel: 'medium',
      auditFrequency: 'annually',
      tags: ['cybersecurity', 'framework', 'government']
    }
  ];

  const complianceRequirements: ComplianceRequirement[] = [
    {
      id: 'req-1',
      frameworkId: 'soc2',
      controlId: 'CC6.1',
      title: 'Logical and Physical Access Controls',
      description: 'The entity implements logical and physical access controls to protect against threats from sources outside its system boundaries',
      category: 'access-control',
      priority: 'critical',
      status: 'implemented',
      evidence: ['Access Control Policy', 'VPN Configuration', 'Network Segmentation'],
      lastReview: '2025-08-15T00:00:00Z',
      nextReview: '2025-11-15T00:00:00Z',
      assignee: 'Security Team',
      implementationNotes: 'Multi-factor authentication implemented across all systems',
      testResults: [
        {
          date: '2025-08-15T00:00:00Z',
          result: 'pass',
          notes: 'All access controls functioning properly'
        }
      ]
    },
    {
      id: 'req-2',
      frameworkId: 'gdpr',
      controlId: 'Art. 32',
      title: 'Security of Processing',
      description: 'Appropriate technical and organisational measures to ensure a level of security appropriate to the risk',
      category: 'data-protection',
      priority: 'critical',
      status: 'implemented',
      evidence: ['Encryption Implementation', 'Security Policies', 'Training Records'],
      lastReview: '2025-07-10T00:00:00Z',
      nextReview: '2025-10-10T00:00:00Z',
      assignee: 'Data Protection Officer',
      implementationNotes: 'AES-256 encryption implemented for all data at rest and in transit',
      testResults: [
        {
          date: '2025-07-10T00:00:00Z',
          result: 'pass',
          notes: 'Encryption verified across all systems'
        }
      ]
    },
    {
      id: 'req-3',
      frameworkId: 'pcidss',
      controlId: '3.4',
      title: 'Render PAN Unreadable',
      description: 'Render PAN unreadable anywhere it is stored',
      category: 'data-protection',
      priority: 'critical',
      status: 'partial',
      evidence: ['Tokenization System', 'Encryption Keys'],
      lastReview: '2025-05-01T00:00:00Z',
      nextReview: '2025-09-01T00:00:00Z',
      assignee: 'Payment Security Team',
      implementationNotes: 'Tokenization implemented, some legacy systems pending upgrade',
      testResults: [
        {
          date: '2025-05-01T00:00:00Z',
          result: 'partial',
          notes: '80% of systems compliant, legacy systems require attention'
        }
      ]
    }
  ];

  const complianceAudits: ComplianceAudit[] = [
    {
      id: 'audit-1',
      name: 'SOC 2 Type II Annual Audit',
      framework: 'SOC 2',
      type: 'external',
      scope: ['Security', 'Availability', 'Confidentiality'],
      status: 'completed',
      startDate: '2025-05-01T00:00:00Z',
      endDate: '2025-06-15T00:00:00Z',
      auditor: 'Deloitte & Touche LLP',
      findings: { critical: 0, high: 1, medium: 3, low: 5 },
      overallRating: 'good',
      recommendations: [
        'Enhance incident response documentation',
        'Implement additional monitoring controls',
        'Update security awareness training'
      ],
      actionItems: [
        {
          id: 'action-1',
          description: 'Update incident response procedures',
          priority: 'high',
          dueDate: '2025-09-30T00:00:00Z',
          assignee: 'Security Team',
          status: 'in-progress'
        },
        {
          id: 'action-2',
          description: 'Deploy enhanced SIEM monitoring',
          priority: 'medium',
          dueDate: '2025-10-15T00:00:00Z',
          assignee: 'IT Operations',
          status: 'open'
        }
      ]
    },
    {
      id: 'audit-2',
      name: 'GDPR Compliance Assessment',
      framework: 'GDPR',
      type: 'internal',
      scope: ['Data Processing', 'Privacy Controls', 'Subject Rights'],
      status: 'in-progress',
      startDate: '2025-08-01T00:00:00Z',
      auditor: 'Internal Audit Team',
      findings: { critical: 1, high: 2, medium: 4, low: 2 },
      overallRating: 'satisfactory',
      recommendations: [
        'Improve data mapping documentation',
        'Enhance consent management',
        'Strengthen breach notification procedures'
      ],
      actionItems: [
        {
          id: 'action-3',
          description: 'Complete data inventory mapping',
          priority: 'critical',
          dueDate: '2025-09-15T00:00:00Z',
          assignee: 'Data Protection Officer',
          status: 'in-progress'
        }
      ]
    }
  ];

  const complianceMetrics: ComplianceMetric[] = [
    {
      id: 'metric-1',
      name: 'Overall Compliance Score',
      value: 87.5,
      unit: '%',
      target: 95,
      trend: 'up',
      category: 'coverage',
      period: 'Current',
      benchmark: 85
    },
    {
      id: 'metric-2',
      name: 'Critical Requirements Implemented',
      value: 94.2,
      unit: '%',
      target: 100,
      trend: 'up',
      category: 'coverage',
      period: 'Current',
      benchmark: 90
    },
    {
      id: 'metric-3',
      name: 'Audit Finding Resolution Time',
      value: 15.5,
      unit: 'days',
      target: 10,
      trend: 'down',
      category: 'effectiveness',
      period: 'Average',
      benchmark: 20
    },
    {
      id: 'metric-4',
      name: 'Compliance Program Maturity',
      value: 4.2,
      unit: '/5',
      target: 4.5,
      trend: 'stable',
      category: 'maturity',
      period: 'Current',
      benchmark: 3.8
    }
  ];

  const policyDocuments: PolicyDocument[] = [
    {
      id: 'policy-1',
      title: 'Information Security Policy',
      type: 'policy',
      category: 'Security',
      version: '2.1',
      status: 'approved',
      owner: 'Chief Information Security Officer',
      lastUpdated: '2025-06-01T00:00:00Z',
      nextReview: '2026-06-01T00:00:00Z',
      relatedFrameworks: ['SOC 2', 'ISO 27001', 'NIST CSF'],
      documentUrl: '/policies/info-security-policy.pdf',
      approvalDate: '2025-06-01T00:00:00Z',
      effectiveDate: '2025-06-15T00:00:00Z'
    },
    {
      id: 'policy-2',
      title: 'Data Privacy Procedures',
      type: 'procedure',
      category: 'Privacy',
      version: '1.5',
      status: 'approved',
      owner: 'Data Protection Officer',
      lastUpdated: '2025-07-15T00:00:00Z',
      nextReview: '2025-12-15T00:00:00Z',
      relatedFrameworks: ['GDPR', 'CCPA'],
      documentUrl: '/policies/data-privacy-procedures.pdf',
      approvalDate: '2025-07-15T00:00:00Z',
      effectiveDate: '2025-08-01T00:00:00Z'
    },
    {
      id: 'policy-3',
      title: 'Incident Response Plan',
      type: 'plan',
      category: 'Security',
      version: '3.0',
      status: 'review',
      owner: 'Security Operations Manager',
      lastUpdated: '2025-08-20T00:00:00Z',
      nextReview: '2025-09-20T00:00:00Z',
      relatedFrameworks: ['SOC 2', 'ISO 27001', 'NIST CSF'],
      documentUrl: '/policies/incident-response-plan.pdf'
    }
  ];

  const handleStartScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 5000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': 
      case 'implemented': 
      case 'certified': 
      case 'approved': 
      case 'completed': 
      case 'pass': return 'text-green-600 dark:text-green-400';
      case 'non-compliant': 
      case 'not-implemented': 
      case 'not-certified': 
      case 'fail': return 'text-red-600 dark:text-red-400';
      case 'in-progress': 
      case 'partial': 
      case 'pending': 
      case 'review': return 'text-yellow-600 dark:text-yellow-400';
      case 'not-applicable': 
      case 'draft': 
      case 'archived': return 'text-gray-600 dark:text-gray-400';
      case 'planned': 
      case 'on-hold': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'medium': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'high': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case 'critical': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800';
      default: return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'security': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'privacy': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      case 'industry': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case 'regional': return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'internal': return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800';
      default: return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 30) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getCompliancePercentage = (implemented: number, total: number) => {
    return Math.round((implemented / total) * 100);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUp className="w-3 h-3 text-green-600" />;
      case 'down': return <ArrowDown className="w-3 h-3 text-red-600" />;
      case 'stable': return <Minus className="w-3 h-3 text-blue-600" />;
      default: return <Minus className="w-3 h-3 text-gray-600" />;
    }
  };

  const getFrameworkIcon = (framework: string) => {
    switch (framework.toLowerCase()) {
      case 'soc 2': return <Award className="w-4 h-4" />;
      case 'iso 27001': return <Award className="w-4 h-4" />;
      case 'gdpr': return <Scale className="w-4 h-4" />;
      case 'pci dss': return <BadgeCheck className="w-4 h-4" />;
      case 'hipaa': return <Shield className="w-4 h-4" />;
      case 'nist csf': return <Target className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
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
                <Scale className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Compliance Center
                </h1>
                <p className="text-lg text-muted-foreground">
                  Comprehensive compliance management and regulatory oversight
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="px-3 py-1">
              <CheckCircle className="w-3 h-3 mr-1" />
              {complianceFrameworks.filter(f => f.status === 'compliant').length} Compliant Frameworks
            </Badge>
            <Button 
              onClick={handleStartScan}
              disabled={isScanning}
              className="gap-2"
            >
              <Scan className={`w-4 h-4 ${isScanning ? 'animate-pulse' : ''}`} />
              {isScanning ? 'Scanning...' : 'Compliance Scan'}
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {complianceMetrics.map((metric) => (
            <Card key={metric.id} className={`bg-gradient-to-br ${
              metric.category === 'coverage' ? 'from-blue-500/10 to-blue-600/10 border-blue-200 dark:border-blue-800' :
              metric.category === 'maturity' ? 'from-green-500/10 to-green-600/10 border-green-200 dark:border-green-800' :
              metric.category === 'effectiveness' ? 'from-orange-500/10 to-orange-600/10 border-orange-200 dark:border-orange-800' :
              'from-purple-500/10 to-purple-600/10 border-purple-200 dark:border-purple-800'
            }`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${
                      metric.category === 'coverage' ? 'text-blue-600 dark:text-blue-400' :
                      metric.category === 'maturity' ? 'text-green-600 dark:text-green-400' :
                      metric.category === 'effectiveness' ? 'text-orange-600 dark:text-orange-400' :
                      'text-purple-600 dark:text-purple-400'
                    }`}>
                      {metric.name}
                    </p>
                    <p className={`text-3xl font-bold ${
                      metric.category === 'coverage' ? 'text-blue-700 dark:text-blue-300' :
                      metric.category === 'maturity' ? 'text-green-700 dark:text-green-300' :
                      metric.category === 'effectiveness' ? 'text-orange-700 dark:text-orange-300' :
                      'text-purple-700 dark:text-purple-300'
                    }`}>
                      {metric.value.toLocaleString()}{metric.unit}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs flex items-center gap-1">
                        {getTrendIcon(metric.trend)}
                        {metric.trend} trend
                      </p>
                      {metric.benchmark && (
                        <p className="text-xs text-muted-foreground">
                          vs {metric.benchmark}{metric.unit} benchmark
                        </p>
                      )}
                    </div>
                  </div>
                  <div className={`w-8 h-8 ${
                    metric.category === 'coverage' ? 'text-blue-500' :
                    metric.category === 'maturity' ? 'text-green-500' :
                    metric.category === 'effectiveness' ? 'text-orange-500' :
                    'text-purple-500'
                  }`}>
                    {metric.category === 'coverage' && <BarChart3 className="w-8 h-8" />}
                    {metric.category === 'maturity' && <TrendingUp className="w-8 h-8" />}
                    {metric.category === 'effectiveness' && <Target className="w-8 h-8" />}
                    {metric.category === 'cost' && <Activity className="w-8 h-8" />}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View Selector */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          {[
            { id: 'frameworks', label: 'Compliance Frameworks', icon: Scale },
            { id: 'requirements', label: 'Requirements', icon: ListChecks },
            { id: 'audits', label: 'Audits & Assessments', icon: FileSearch },
            { id: 'policies', label: 'Policy Documents', icon: ScrollText }
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
                  placeholder={`Search ${activeView}... (e.g., framework name, requirement, audit)`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-3 text-lg bg-background/50 border-border/70 focus:border-primary"
                />
              </div>
              <div className="flex gap-2">
                <Select value={selectedFramework} onValueChange={setSelectedFramework}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Framework" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Frameworks</SelectItem>
                    <SelectItem value="soc2">SOC 2</SelectItem>
                    <SelectItem value="iso27001">ISO 27001</SelectItem>
                    <SelectItem value="gdpr">GDPR</SelectItem>
                    <SelectItem value="pcidss">PCI DSS</SelectItem>
                    <SelectItem value="hipaa">HIPAA</SelectItem>
                    <SelectItem value="nist">NIST CSF</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="privacy">Privacy</SelectItem>
                    <SelectItem value="industry">Industry</SelectItem>
                    <SelectItem value="regional">Regional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content based on active view */}
        {activeView === 'frameworks' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {complianceFrameworks.map((framework) => (
              <Card key={framework.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card/80 border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getCategoryColor(framework.category)}>
                          {framework.category}
                        </Badge>
                        <Badge className={getStatusColor(framework.status)}>
                          {framework.status}
                        </Badge>
                        <Badge className={getRiskLevelColor(framework.riskLevel)}>
                          {framework.riskLevel} risk
                        </Badge>
                      </div>
                      <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors flex items-center gap-2">
                        {getFrameworkIcon(framework.name)}
                        {framework.name}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {framework.fullName}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-bold ${getStatusColor(framework.status)}`}>
                        {getCompliancePercentage(framework.implementedRequirements, framework.requirements)}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {framework.implementedRequirements}/{framework.requirements} requirements
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{framework.description}</p>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Compliance Progress</h4>
                    <Progress value={getCompliancePercentage(framework.implementedRequirements, framework.requirements)} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Last Assessment:</p>
                      <p>{formatTimestamp(framework.lastAssessment)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Next Assessment:</p>
                      <p>{formatTimestamp(framework.nextAssessment)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Certification:</p>
                      <p className={getStatusColor(framework.certificationStatus)}>
                        {framework.certificationStatus}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Audit Frequency:</p>
                      <p>{framework.auditFrequency}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Applicability</h4>
                    <div className="flex flex-wrap gap-1">
                      {framework.applicability.map((item, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {framework.certificationExpiry && (
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-sm flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Certification expires: {formatTimestamp(framework.certificationExpiry)}
                      </p>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-0">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="w-4 h-4" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <FileSearch className="w-4 h-4" />
                        Assess
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

        {activeView === 'requirements' && (
          <div className="space-y-4">
            {complianceRequirements.map((requirement) => (
              <Card key={requirement.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card/80 border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {complianceFrameworks.find(f => f.id === requirement.frameworkId)?.name}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {requirement.controlId}
                        </Badge>
                        <Badge className={getRiskLevelColor(requirement.priority)}>
                          {requirement.priority}
                        </Badge>
                        <Badge className={getStatusColor(requirement.status)}>
                          {requirement.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors">
                        {requirement.title}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {requirement.description}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Assignee: {requirement.assignee}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Next Review: {formatTimestamp(requirement.nextReview)}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Implementation Notes</h4>
                      <div className="p-3 rounded-lg bg-background/50 border border-border/50">
                        <p className="text-sm text-muted-foreground">{requirement.implementationNotes}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Evidence</h4>
                      <div className="flex flex-wrap gap-1">
                        {requirement.evidence.map((item, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {requirement.testResults.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Recent Test Results</h4>
                      <div className="space-y-2">
                        {requirement.testResults.slice(0, 2).map((test, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-background/50 border border-border/50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge className={getStatusColor(test.result)}>
                                  {test.result}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatTimestamp(test.date)}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{test.notes}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-0">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="gap-2">
                        <CheckSquare className="w-4 h-4" />
                        Test Control
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Edit className="w-4 h-4" />
                        Update
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <FileText className="w-4 h-4" />
                        Evidence
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

        {activeView === 'audits' && (
          <div className="space-y-4">
            {complianceAudits.map((audit) => (
              <Card key={audit.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card/80 border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {audit.framework}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {audit.type.replace('-', ' ').toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(audit.status)}>
                          {audit.status}
                        </Badge>
                        <Badge className={
                          audit.overallRating === 'excellent' ? 'bg-green-500/10 text-green-600' :
                          audit.overallRating === 'good' ? 'bg-blue-500/10 text-blue-600' :
                          audit.overallRating === 'satisfactory' ? 'bg-yellow-500/10 text-yellow-600' :
                          audit.overallRating === 'needs-improvement' ? 'bg-orange-500/10 text-orange-600' :
                          'bg-red-500/10 text-red-600'
                        }>
                          {audit.overallRating}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors">
                        {audit.name}
                      </CardTitle>
                      <CardDescription className="text-base">
                        Conducted by {audit.auditor} • {audit.scope.join(', ')}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Started: {formatTimestamp(audit.startDate)}
                      </p>
                      {audit.endDate && (
                        <p className="text-xs text-muted-foreground">
                          Completed: {formatTimestamp(audit.endDate)}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-3 rounded-lg bg-red-500/10 border border-red-200 dark:border-red-800">
                      <div className="text-2xl font-bold text-red-600">{audit.findings.critical}</div>
                      <div className="text-xs text-red-600">Critical</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-orange-500/10 border border-orange-200 dark:border-orange-800">
                      <div className="text-2xl font-bold text-orange-600">{audit.findings.high}</div>
                      <div className="text-xs text-orange-600">High</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-yellow-500/10 border border-yellow-200 dark:border-yellow-800">
                      <div className="text-2xl font-bold text-yellow-600">{audit.findings.medium}</div>
                      <div className="text-xs text-yellow-600">Medium</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-200 dark:border-blue-800">
                      <div className="text-2xl font-bold text-blue-600">{audit.findings.low}</div>
                      <div className="text-xs text-blue-600">Low</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Key Recommendations</h4>
                      <div className="space-y-1">
                        {audit.recommendations.slice(0, 3).map((rec, idx) => (
                          <div key={idx} className="p-2 rounded bg-background/50 border border-border/50">
                            <p className="text-xs text-muted-foreground">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Action Items ({audit.actionItems.length})</h4>
                      <div className="space-y-1">
                        {audit.actionItems.slice(0, 2).map((action) => (
                          <div key={action.id} className="p-2 rounded bg-background/50 border border-border/50">
                            <div className="flex items-center justify-between">
                              <Badge className={getRiskLevelColor(action.priority)}>
                                {action.priority}
                              </Badge>
                              <Badge className={getStatusColor(action.status)}>
                                {action.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                            <p className="text-xs text-muted-foreground">
                              Due: {formatTimestamp(action.dueDate)} • {action.assignee}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-0">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="w-4 h-4" />
                        View Report
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <ListChecks className="w-4 h-4" />
                        Action Items
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Download className="w-4 h-4" />
                        Export
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

        {activeView === 'policies' && (
          <div className="space-y-4">
            {policyDocuments.map((policy) => (
              <Card key={policy.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card/80 border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {policy.type.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {policy.category}
                        </Badge>
                        <Badge className={getStatusColor(policy.status)}>
                          {policy.status}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          v{policy.version}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors">
                        {policy.title}
                      </CardTitle>
                      <CardDescription className="text-base">
                        Owner: {policy.owner}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Updated: {formatTimestamp(policy.lastUpdated)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Next Review: {formatTimestamp(policy.nextReview)}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Related Frameworks</h4>
                      <div className="flex flex-wrap gap-1">
                        {policy.relatedFrameworks.map((framework, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {framework}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Document Information</h4>
                      <div className="space-y-1 text-xs">
                        {policy.approvalDate && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Approved:</span>
                            <span>{formatTimestamp(policy.approvalDate)}</span>
                          </div>
                        )}
                        {policy.effectiveDate && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Effective:</span>
                            <span>{formatTimestamp(policy.effectiveDate)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Version:</span>
                          <span>{policy.version}</span>
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
                        View Document
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Edit className="w-4 h-4" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Download className="w-4 h-4" />
                        Download
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

        {/* Quick Actions */}
        <Card className="bg-gradient-to-r from-muted/30 to-muted/10 border-border/30">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Compliance Management</h3>
                <p className="text-muted-foreground">
                  Comprehensive regulatory compliance tracking, audit management, and policy governance
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Assessment
                </Button>
                <Button variant="outline" className="gap-2">
                  <Calendar className="w-4 h-4" />
                  Schedule Audit
                </Button>
                <Button className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  AI Compliance Check
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default withAuth(ComplianceCenterHub);
