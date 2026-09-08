'use client';
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MessageCircle, 
  Video, 
  Calendar, 
  Clock, 
  Bell, 
  BellRing, 
  Share2, 
  Eye, 
  Search, 
  Filter, 
  Plus, 
  Settings, 
  Star, 
  Bookmark, 
  ThumbsUp, 
  ThumbsDown, 
  MoreHorizontal, 
  Shield, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Activity, 
  TrendingUp, 
  Database, 
  Network, 
  Server, 
  Globe, 
  Lock, 
  Unlock, 
  Bug, 
  Code, 
  FileText, 
  Building, 
  Layers, 
  Hash, 
  Tag, 
  Link, 
  Copy, 
  ExternalLink, 
  Archive, 
  Trash2, 
  Edit, 
  Send, 
  Paperclip, 
  Image, 
  Download, 
  Upload, 
  RefreshCw, 
  BarChart3, 
  PieChart, 
  LineChart, 
  Zap, 
  Brain, 
  Lightbulb, 
  Flag, 
  UserPlus, 
  UserMinus, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Award, 
  Gauge, 
  Crown, 
  GitBranch, 
  Workflow, 
  CheckSquare, 
  Square, 
  Circle, 
  Dot,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  ScreenShare,
  PhoneCall,
  PhoneOff,
  Volume2,
  VolumeX
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

interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  avatar: string;
  status: 'online' | 'offline' | 'busy' | 'away';
  specializations: string[];
  certifications: string[];
  projects: string[];
  lastActive: string;
  location: string;
  timezone: string;
  skills: {
    name: string;
    level: number;
  }[];
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'review' | 'completed' | 'on-hold';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate: string;
  dueDate: string;
  progress: number;
  team: string[];
  lead: string;
  tags: string[];
  securityLevel: 'public' | 'internal' | 'confidential' | 'restricted';
  type: 'vulnerability-assessment' | 'penetration-testing' | 'security-audit' | 'incident-response' | 'compliance' | 'research';
}

interface Message {
  id: string;
  from: string;
  to: string | string[];
  content: string;
  timestamp: string;
  type: 'text' | 'file' | 'image' | 'system';
  attachments?: {
    name: string;
    size: number;
    type: string;
  }[];
  reactions?: {
    emoji: string;
    users: string[];
  }[];
  isEncrypted: boolean;
  threadId?: string;
}

interface Meeting {
  id: string;
  title: string;
  description: string;
  organizer: string;
  attendees: string[];
  startTime: string;
  endTime: string;
  type: 'security-briefing' | 'incident-response' | 'project-review' | 'training' | 'one-on-one';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  isRecurring: boolean;
  location?: string;
  meetingLink?: string;
  agenda: string[];
  recordings?: string[];
}

const TeamCollaborationHub = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('team');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [messageText, setMessageText] = useState('');

  const teamMembers: TeamMember[] = [
    {
      id: 'member-1',
      name: 'Sarah Chen',
      role: 'Senior Security Analyst',
      department: 'Security Operations',
      email: 'sarah.chen@company.com',
      avatar: '/api/placeholder/40/40',
      status: 'online',
      specializations: ['Threat Intelligence', 'Malware Analysis', 'Digital Forensics'],
      certifications: ['CISSP', 'GCIH', 'GNFA'],
      projects: ['project-1', 'project-3'],
      lastActive: '2025-09-09T10:30:00Z',
      location: 'New York, NY',
      timezone: 'EST',
      skills: [
        { name: 'Threat Hunting', level: 95 },
        { name: 'Incident Response', level: 90 },
        { name: 'SIEM Management', level: 85 },
        { name: 'Python Scripting', level: 80 }
      ]
    },
    {
      id: 'member-2',
      name: 'Marcus Rodriguez',
      role: 'Lead Penetration Tester',
      department: 'Red Team',
      email: 'marcus.rodriguez@company.com',
      avatar: '/api/placeholder/40/40',
      status: 'busy',
      specializations: ['Web Application Security', 'Network Penetration Testing', 'Social Engineering'],
      certifications: ['OSCP', 'OSCE', 'CEH'],
      projects: ['project-2', 'project-4'],
      lastActive: '2025-09-09T09:45:00Z',
      location: 'Austin, TX',
      timezone: 'CST',
      skills: [
        { name: 'Penetration Testing', level: 98 },
        { name: 'Exploit Development', level: 85 },
        { name: 'Social Engineering', level: 90 },
        { name: 'Metasploit', level: 95 }
      ]
    },
    {
      id: 'member-3',
      name: 'Dr. Priya Patel',
      role: 'Security Research Lead',
      department: 'R&D',
      email: 'priya.patel@company.com',
      avatar: '/api/placeholder/40/40',
      status: 'online',
      specializations: ['AI Security', 'Cryptography', 'Zero-Day Research'],
      certifications: ['PhD Computer Science', 'CISSP', 'CISM'],
      projects: ['project-1', 'project-5'],
      lastActive: '2025-09-09T10:15:00Z',
      location: 'San Francisco, CA',
      timezone: 'PST',
      skills: [
        { name: 'Research & Development', level: 98 },
        { name: 'Machine Learning', level: 92 },
        { name: 'Cryptographic Analysis', level: 95 },
        { name: 'Academic Writing', level: 90 }
      ]
    },
    {
      id: 'member-4',
      name: 'James Thompson',
      role: 'Cloud Security Architect',
      department: 'Cloud Security',
      email: 'james.thompson@company.com',
      avatar: '/api/placeholder/40/40',
      status: 'away',
      specializations: ['AWS Security', 'Kubernetes Security', 'DevSecOps'],
      certifications: ['AWS Solutions Architect', 'CKS', 'CSSLP'],
      projects: ['project-3', 'project-6'],
      lastActive: '2025-09-09T08:30:00Z',
      location: 'Seattle, WA',
      timezone: 'PST',
      skills: [
        { name: 'Cloud Architecture', level: 95 },
        { name: 'Container Security', level: 90 },
        { name: 'Infrastructure as Code', level: 88 },
        { name: 'DevOps Integration', level: 85 }
      ]
    },
    {
      id: 'member-5',
      name: 'Lisa Wang',
      role: 'Compliance Manager',
      department: 'Governance & Compliance',
      email: 'lisa.wang@company.com',
      avatar: '/api/placeholder/40/40',
      status: 'online',
      specializations: ['SOC 2', 'ISO 27001', 'GDPR Compliance'],
      certifications: ['CISA', 'CISM', 'ISO 27001 Lead Auditor'],
      projects: ['project-4', 'project-7'],
      lastActive: '2025-09-09T10:00:00Z',
      location: 'Chicago, IL',
      timezone: 'CST',
      skills: [
        { name: 'Regulatory Compliance', level: 95 },
        { name: 'Risk Assessment', level: 90 },
        { name: 'Audit Management', level: 92 },
        { name: 'Policy Development', level: 88 }
      ]
    }
  ];

  const projects: Project[] = [
    {
      id: 'project-1',
      name: 'Advanced Threat Detection System',
      description: 'Development of AI-powered threat detection system for real-time security monitoring',
      status: 'active',
      priority: 'high',
      startDate: '2025-08-15',
      dueDate: '2025-11-30',
      progress: 67,
      team: ['member-1', 'member-3'],
      lead: 'member-3',
      tags: ['AI', 'Machine Learning', 'Threat Detection'],
      securityLevel: 'confidential',
      type: 'research'
    },
    {
      id: 'project-2',
      name: 'Web Application Penetration Testing - Client XYZ',
      description: 'Comprehensive penetration testing of client web applications and APIs',
      status: 'active',
      priority: 'critical',
      startDate: '2025-09-01',
      dueDate: '2025-09-30',
      progress: 45,
      team: ['member-2'],
      lead: 'member-2',
      tags: ['Penetration Testing', 'Web Security', 'Client Work'],
      securityLevel: 'restricted',
      type: 'penetration-testing'
    },
    {
      id: 'project-3',
      name: 'Cloud Infrastructure Security Assessment',
      description: 'Security assessment of cloud infrastructure and container orchestration',
      status: 'review',
      priority: 'medium',
      startDate: '2025-08-01',
      dueDate: '2025-09-15',
      progress: 85,
      team: ['member-1', 'member-4'],
      lead: 'member-4',
      tags: ['Cloud Security', 'AWS', 'Kubernetes'],
      securityLevel: 'internal',
      type: 'security-audit'
    },
    {
      id: 'project-4',
      name: 'SOC 2 Type II Compliance Preparation',
      description: 'Preparation and documentation for SOC 2 Type II compliance audit',
      status: 'active',
      priority: 'high',
      startDate: '2025-07-01',
      dueDate: '2025-10-31',
      progress: 72,
      team: ['member-2', 'member-5'],
      lead: 'member-5',
      tags: ['Compliance', 'SOC 2', 'Audit'],
      securityLevel: 'confidential',
      type: 'compliance'
    }
  ];

  const meetings: Meeting[] = [
    {
      id: 'meeting-1',
      title: 'Weekly Security Briefing',
      description: 'Weekly review of security incidents, threat landscape, and team updates',
      organizer: 'member-1',
      attendees: ['member-1', 'member-2', 'member-3', 'member-4', 'member-5'],
      startTime: '2025-09-09T14:00:00Z',
      endTime: '2025-09-09T15:00:00Z',
      type: 'security-briefing',
      status: 'scheduled',
      isRecurring: true,
      meetingLink: 'https://meet.company.com/security-weekly',
      agenda: [
        'Review of previous week incidents',
        'Current threat landscape update',
        'Project status updates',
        'New security initiatives'
      ]
    },
    {
      id: 'meeting-2',
      title: 'Incident Response Planning Session',
      description: 'Planning session for upcoming incident response exercise',
      organizer: 'member-3',
      attendees: ['member-1', 'member-2', 'member-4'],
      startTime: '2025-09-10T10:00:00Z',
      endTime: '2025-09-10T11:30:00Z',
      type: 'incident-response',
      status: 'scheduled',
      isRecurring: false,
      meetingLink: 'https://meet.company.com/ir-planning',
      agenda: [
        'Scenario development',
        'Role assignments',
        'Communication protocols',
        'Success metrics'
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-red-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'high': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case 'medium': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'low': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      default: return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800';
    }
  };

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 dark:text-green-400';
      case 'planning': return 'text-blue-600 dark:text-blue-400';
      case 'review': return 'text-orange-600 dark:text-orange-400';
      case 'completed': return 'text-gray-600 dark:text-gray-400';
      case 'on-hold': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.specializations.some(spec => spec.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDepartment = selectedDepartment === 'all' || member.department === selectedDepartment;
    const matchesFilter = selectedFilter === 'all' || 
                         (selectedFilter === 'online' && member.status === 'online') ||
                         (selectedFilter === 'busy' && member.status === 'busy');
    
    return matchesSearch && matchesDepartment && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Team Collaboration
                </h1>
                <p className="text-lg text-muted-foreground">
                  Secure collaboration platform for security research teams
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="px-3 py-1">
              <Activity className="w-3 h-3 mr-1" />
              {teamMembers.filter(m => m.status === 'online').length} Online
            </Badge>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Meeting
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Active Projects</p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                    {projects.filter(p => p.status === 'active').length}
                  </p>
                </div>
                <Briefcase className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Team Members</p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{teamMembers.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-200 dark:border-orange-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Meetings Today</p>
                  <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">
                    {meetings.filter(m => new Date(m.startTime).toDateString() === new Date().toDateString()).length}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Messages</p>
                  <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">142</p>
                </div>
                <MessageCircle className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          {[
            { id: 'team', label: 'Team Members', icon: Users },
            { id: 'projects', label: 'Projects', icon: Briefcase },
            { id: 'meetings', label: 'Meetings', icon: Calendar },
            { id: 'messages', label: 'Messages', icon: MessageCircle }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
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
                  placeholder={`Search ${activeTab}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-3 text-lg bg-background/50 border-border/70 focus:border-primary"
                />
              </div>
              {activeTab === 'team' && (
                <div className="flex gap-2">
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      <SelectItem value="Security Operations">Security Operations</SelectItem>
                      <SelectItem value="Red Team">Red Team</SelectItem>
                      <SelectItem value="R&D">Research & Development</SelectItem>
                      <SelectItem value="Cloud Security">Cloud Security</SelectItem>
                      <SelectItem value="Governance & Compliance">Governance & Compliance</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="busy">Busy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content based on active tab */}
        {activeTab === 'team' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member) => (
              <Card key={member.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card/80 border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${getStatusColor(member.status)}`}></div>
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold">{member.name}</CardTitle>
                      <CardDescription>{member.role}</CardDescription>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {member.location}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Specializations</h4>
                    <div className="flex flex-wrap gap-1">
                      {member.specializations.slice(0, 2).map((spec, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                      {member.specializations.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{member.specializations.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Top Skills</h4>
                    <div className="space-y-1">
                      {member.skills.slice(0, 2).map((skill, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>{skill.name}</span>
                            <span className="text-primary">{skill.level}%</span>
                          </div>
                          <Progress value={skill.level} className="h-1" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Certifications</h4>
                    <div className="flex flex-wrap gap-1">
                      {member.certifications.slice(0, 3).map((cert, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-0">
                  <div className="flex items-center gap-2 w-full">
                    <Button variant="outline" size="sm" className="flex-1 gap-2">
                      <MessageCircle className="w-4 h-4" />
                      Message
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Video className="w-4 h-4" />
                      Call
                    </Button>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="space-y-4">
            {projects.map((project) => (
              <Card key={project.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card/80 border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getPriorityColor(project.priority)}>
                          {project.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {project.type.replace('-', ' ').toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className={getProjectStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {project.securityLevel}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors">
                        {project.name}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {project.description}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Due: {formatDate(project.dueDate)}</p>
                      <p className="text-xs text-muted-foreground">Lead: {teamMembers.find(m => m.id === project.lead)?.name}</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span className="text-primary">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Team Members</h4>
                      <div className="flex flex-wrap gap-2">
                        {project.team.map((memberId) => {
                          const member = teamMembers.find(m => m.id === memberId);
                          return member ? (
                            <div key={memberId} className="flex items-center gap-1 p-2 rounded bg-primary/5 border border-primary/20">
                              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                                <Users className="w-3 h-3 text-primary" />
                              </div>
                              <span className="text-xs">{member.name}</span>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Project Tags</h4>
                      <div className="flex flex-wrap gap-1">
                        {project.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag}
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
                        <Eye className="w-4 h-4" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <MessageCircle className="w-4 h-4" />
                        Discuss
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

        {activeTab === 'meetings' && (
          <div className="space-y-4">
            {meetings.map((meeting) => (
              <Card key={meeting.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card/80 border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {meeting.type.replace('-', ' ').toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className={getProjectStatusColor(meeting.status)}>
                          {meeting.status}
                        </Badge>
                        {meeting.isRecurring && (
                          <Badge variant="outline" className="text-xs">
                            Recurring
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors">
                        {meeting.title}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {meeting.description}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {formatTimestamp(meeting.startTime)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Organizer: {teamMembers.find(m => m.id === meeting.organizer)?.name}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Attendees ({meeting.attendees.length})</h4>
                      <div className="flex flex-wrap gap-1">
                        {meeting.attendees.slice(0, 5).map((attendeeId) => {
                          const attendee = teamMembers.find(m => m.id === attendeeId);
                          return attendee ? (
                            <Badge key={attendeeId} variant="secondary" className="text-xs">
                              {attendee.name}
                            </Badge>
                          ) : null;
                        })}
                        {meeting.attendees.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{meeting.attendees.length - 5}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Agenda</h4>
                      <div className="space-y-1">
                        {meeting.agenda.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="text-xs text-muted-foreground flex items-center gap-2">
                            <Circle className="w-2 h-2 fill-current" />
                            {item}
                          </div>
                        ))}
                        {meeting.agenda.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{meeting.agenda.length - 3} more items
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-0">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Video className="w-4 h-4" />
                        Join Meeting
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Calendar className="w-4 h-4" />
                        Add to Calendar
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Bell className="w-4 h-4" />
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

        {activeTab === 'messages' && (
          <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                Secure Team Communications
              </CardTitle>
              <CardDescription>
                End-to-end encrypted messaging for security team collaboration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
                {/* Conversations List */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Conversations</h4>
                  <div className="space-y-2 overflow-y-auto">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="p-3 rounded-lg bg-background/50 border border-border/50 cursor-pointer hover:bg-primary/5 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                              <Users className="w-4 h-4 text-primary" />
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-background ${getStatusColor(member.status)}`}></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{member.name}</p>
                            <p className="text-xs text-muted-foreground truncate">Last message preview...</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Message Area */}
                <div className="lg:col-span-2 flex flex-col">
                  <div className="flex-1 p-4 bg-background/30 rounded-lg border border-border/50 overflow-y-auto">
                    <div className="text-center text-muted-foreground">
                      <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Select a conversation to start messaging</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <Input
                      placeholder="Type your secure message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      className="flex-1"
                    />
                    <Button size="sm" className="gap-2">
                      <Send className="w-4 h-4" />
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="bg-gradient-to-r from-muted/30 to-muted/10 border-border/30">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Enhance Team Collaboration</h3>
                <p className="text-muted-foreground">
                  Secure communication and project management tools for security teams
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="gap-2">
                  <Calendar className="w-4 h-4" />
                  Schedule Meeting
                </Button>
                <Button variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Project
                </Button>
                <Button className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  Invite Member
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default withAuth(TeamCollaborationHub);
