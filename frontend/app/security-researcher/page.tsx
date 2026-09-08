'use client';
import React, { useState, useEffect } from 'react';
import {
  Shield,
  Search,
  MessageCircle,
  Mic,
  Video,
  BookOpen,
  TrendingUp,
  BarChart3,
  Target,
  Lightbulb,
  Users,
  Network,
  Server,
  Database,
  Lock,
  Brain,
  Zap,
  AlertTriangle,
  CheckCircle,
  Globe,
  Cpu,
  Eye,
  FileText,
  Calendar,
  Activity,
  Filter,
  Download,
  Share2,
  Settings,
  Bell,
  Star,
  Bookmark,
  ArrowRight,
  Play,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Shield as ShieldIcon,
  ShieldCheck,
  ShieldAlert,
  Clock,
  TrendingDown,
  TrendingUpIcon,
  Bug
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
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import withAuth from '@/utils/withAuth';
import Link from 'next/link';

const SecurityResearcherHub = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('overview');
  const [isRecording, setIsRecording] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Mock data for demonstrations
  const threatIntelData = {
    criticalThreats: 23,
    newVulnerabilities: 156,
    activeCampaigns: 8,
    riskScore: 7.2,
    trend: '+12%'
  };

  const recentResearch = [
    {
      id: 1,
      title: "Advanced Persistent Threats in Cloud Infrastructure",
      author: "AI Security Analyst",
      date: "2026-02-05",
      category: "Cloud Security",
      severity: "Critical",
      summary: "Analysis of sophisticated APT groups targeting cloud environments",
      tags: ["APT", "Cloud", "Infrastructure"],
      confidence: 95
    },
    {
      id: 2,
      title: "Zero-Day Vulnerability in Popular Web Framework",
      author: "Vulnerability Research Team",
      date: "2026-02-02",
      category: "Web Security",
      severity: "High",
      summary: "Discovery of critical RCE vulnerability in widely-used framework",
      tags: ["Zero-Day", "RCE", "Web"],
      confidence: 88
    },
    {
      id: 3,
      title: "Emerging AI-Powered Social Engineering Tactics",
      author: "Behavioral Security AI",
      date: "2026-01-28",
      category: "Social Engineering",
      severity: "Medium",
      summary: "Analysis of new AI-driven social engineering techniques",
      tags: ["AI", "Social Engineering", "Phishing"],
      confidence: 92
    }
  ];

  const securityModules = [
    {
      title: "AI Security Chat",
      description: "Intelligent security assistant with real-time threat analysis",
      icon: MessageCircle,
      href: "/security-researcher/chat",
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      features: ["Natural Language Queries", "Real-time Analysis", "Code Review"]
    },
    {
      title: "Voice Assistant",
      description: "Hands-free security research and voice-to-voice interactions",
      icon: Mic,
      href: "/security-researcher/voice",
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      features: ["Voice Commands", "Audio Reports", "Accessibility Support"]
    },
    {
      title: "Video Analysis",
      description: "Advanced video processing for security demonstrations",
      icon: Video,
      href: "/security-researcher/video",
      color: "bg-red-500/10 text-red-600 dark:text-red-400",
      features: ["Screen Recording", "Security Demos", "Training Content"]
    },
    {
      title: "Knowledge Base",
      description: "Comprehensive security research library and documentation",
      icon: BookOpen,
      href: "/security-researcher/knowledge",
      color: "bg-green-500/10 text-green-600 dark:text-green-400",
      features: ["Research Papers", "Best Practices", "Case Studies"]
    },
    {
      title: "Threat Intelligence",
      description: "Real-time threat monitoring and intelligence gathering",
      icon: Target,
      href: "/security-researcher/threat-intel",
      color: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
      features: ["IOC Tracking", "Campaign Analysis", "Attribution"]
    },
    {
      title: "Risk Quantification",
      description: "Advanced risk assessment and cyber risk quantification",
      icon: BarChart3,
      href: "/security-researcher/metrics",
      color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
      features: ["Risk Scoring", "Impact Analysis", "Cost Modeling"]
    }
  ];

  const quickActions = [
    { title: "Start Security Chat", icon: MessageCircle, href: "/security-researcher/chat" },
    { title: "Launch Voice Assistant", icon: Mic, href: "/security-researcher/voice" },
    { title: "View Latest Trends", icon: TrendingUp, href: "/security-researcher/trends" },
    { title: "Team Collaboration", icon: Users, href: "/security-researcher/collaboration" },
    { title: "Network Analysis", icon: Network, href: "/security-researcher/network" },
    { title: "Compliance Check", icon: Lock, href: "/security-researcher/compliance" }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'High': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case 'Medium': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      default: return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Security Research Hub
              </h1>
              <p className="text-lg text-muted-foreground">
                AI-Powered Organizational Security Intelligence Platform
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-card border rounded-lg">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {currentTime.toLocaleTimeString()}
            </span>
          </div>
          <Badge variant="outline" className="px-3 py-1">
            <Activity className="w-3 h-3 mr-1" />
            Real-time Active
          </Badge>
        </div>
      </div>

      {/* Threat Intelligence Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-200 dark:border-red-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">Critical Threats</p>
                <p className="text-3xl font-bold text-red-700 dark:text-red-300">{threatIntelData.criticalThreats}</p>
              </div>
              <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>
            <div className="flex items-center mt-2 text-sm">
              <TrendingUpIcon className="w-4 h-4 text-red-500 mr-1" />
              <span className="text-red-600 dark:text-red-400">{threatIntelData.trend} from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-200 dark:border-orange-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">New Vulnerabilities</p>
                <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">{threatIntelData.newVulnerabilities}</p>
              </div>
              <Bug className="w-8 h-8 text-orange-500" />
            </div>
            <div className="flex items-center mt-2 text-sm">
              <TrendingUp className="w-4 h-4 text-orange-500 mr-1" />
              <span className="text-orange-600 dark:text-orange-400">+8% increase</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Active Campaigns</p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{threatIntelData.activeCampaigns}</p>
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
            <div className="flex items-center mt-2 text-sm">
              <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600 dark:text-green-400">-15% decrease</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Risk Score</p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-300">{threatIntelData.riskScore}/10</p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-500" />
            </div>
            <Progress value={threatIntelData.riskScore * 10} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Quick Search and Actions */}
      <Card className="bg-gradient-to-r from-card to-card/80 border-border/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search security research, vulnerabilities, threat intelligence..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-3 text-lg bg-background/50 border-border/70 focus:border-primary"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, index) => (
                <Link key={index} href={action.href}>
                  <Button variant="outline" size="sm" className="gap-2 hover:bg-primary/10">
                    <action.icon className="w-4 h-4" />
                    {action.title}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {securityModules.map((module, index) => (
          <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card/80 border-border/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl ${module.color}`}>
                  <module.icon className="w-6 h-6" />
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors">
                {module.title}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {module.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {module.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    {feature}
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Link href={module.href} className="w-full">
                <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  Explore <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Recent Research & Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Research */}
        <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-semibold flex items-center gap-2">
                <Brain className="w-6 h-6 text-primary" />
                Recent Research
              </CardTitle>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
            <CardDescription>
              Latest AI-generated security research and threat analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentResearch.map((research) => (
              <div key={research.id} className="p-4 rounded-lg border border-border/50 hover:border-primary/30 transition-colors bg-background/30">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={getSeverityColor(research.severity)}>
                        {research.severity}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {research.category}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="w-3 h-3" />
                        {research.confidence}% confidence
                      </div>
                    </div>
                    <h4 className="font-semibold text-lg leading-tight hover:text-primary transition-colors cursor-pointer">
                      {research.title}
                    </h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {research.summary}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{research.author}</span>
                      <span>{research.date}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {research.tags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Bookmark className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Link href="/security-researcher/knowledge" className="w-full">
              <Button variant="outline" className="w-full">
                View All Research <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* AI Assistant Preview */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              AI Security Assistant
            </CardTitle>
            <CardDescription>
              Start a conversation with your AI security researcher
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-background/50 border">
              <p className="text-sm text-muted-foreground mb-2">Ask me anything about:</p>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Threat analysis and intelligence
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Vulnerability assessment
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Security best practices
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Compliance requirements
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Risk quantification
                </li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Link href="/security-researcher/chat">
                <Button className="w-full gap-2 bg-primary hover:bg-primary/90">
                  <MessageCircle className="w-4 h-4" />
                  Start Chat
                </Button>
              </Link>
              <Link href="/security-researcher/voice">
                <Button variant="outline" className="w-full gap-2 hover:bg-primary/10">
                  <Mic className="w-4 h-4" />
                  Voice Mode
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer Actions */}
      <Card className="bg-gradient-to-r from-muted/30 to-muted/10 border-border/30">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">Ready to enhance your organization&apos;s security?</h3>
              <p className="text-muted-foreground">
                Leverage AI-powered security research to make informed decisions and protect your business
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/security-researcher/trends">
                <Button variant="outline" className="gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Security Trends
                </Button>
              </Link>
              <Link href="/security-researcher/metrics">
                <Button className="gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Risk Assessment
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default withAuth(SecurityResearcherHub);
