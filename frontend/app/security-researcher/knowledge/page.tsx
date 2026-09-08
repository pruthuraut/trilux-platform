'use client';
import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Download, 
  Share2, 
  Bookmark, 
  Star, 
  Eye, 
  Clock, 
  Tag, 
  FileText, 
  Video, 
  AudioLines, 
  Image, 
  ExternalLink, 
  ArrowRight, 
  ChevronDown, 
  ChevronRight, 
  Grid3X3, 
  List, 
  SortAsc, 
  SortDesc, 
  Calendar, 
  User, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Target, 
  Database, 
  Network, 
  Globe, 
  Lock, 
  Code, 
  Brain, 
  Lightbulb, 
  TrendingUp, 
  BarChart3,
  Play,
  Pause,
  Volume2,
  Headphones,
  Maximize,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Archive,
  Edit,
  Copy,
  MoreHorizontal
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import withAuth from '@/utils/withAuth';
import Link from 'next/link';

interface KnowledgeItem {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'document' | 'video' | 'audio' | 'research' | 'case-study' | 'best-practice';
  tags: string[];
  author: string;
  date: string;
  readTime: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  rating: number;
  views: number;
  bookmarked: boolean;
  thumbnail?: string;
  summary: string;
  lastUpdated: string;
}

const SecurityKnowledgeBase = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    { id: 'all', name: 'All Categories', icon: BookOpen, count: 156 },
    { id: 'vulnerability-assessment', name: 'Vulnerability Assessment', icon: AlertTriangle, count: 23 },
    { id: 'threat-intelligence', name: 'Threat Intelligence', icon: Target, count: 18 },
    { id: 'incident-response', name: 'Incident Response', icon: Shield, count: 15 },
    { id: 'compliance', name: 'Compliance & Governance', icon: CheckCircle, count: 12 },
    { id: 'network-security', name: 'Network Security', icon: Network, count: 21 },
    { id: 'application-security', name: 'Application Security', icon: Code, count: 19 },
    { id: 'cloud-security', name: 'Cloud Security', icon: Globe, count: 16 },
    { id: 'data-protection', name: 'Data Protection', icon: Database, count: 14 },
    { id: 'access-control', name: 'Access Control', icon: Lock, count: 18 }
  ];

  const contentTypes = [
    { id: 'all', name: 'All Types', icon: BookOpen },
    { id: 'document', name: 'Documents', icon: FileText },
    { id: 'video', name: 'Videos', icon: Video },
    { id: 'audio', name: 'Audio', icon: AudioLines },
    { id: 'research', name: 'Research Papers', icon: Brain },
    { id: 'case-study', name: 'Case Studies', icon: Lightbulb },
    { id: 'best-practice', name: 'Best Practices', icon: Star }
  ];

  const knowledgeItems: KnowledgeItem[] = [
    {
      id: '1',
      title: 'Zero Trust Architecture Implementation Guide',
      description: 'Comprehensive guide to implementing zero trust security architecture in modern organizations',
      category: 'network-security',
      type: 'document',
      tags: ['Zero Trust', 'Network Security', 'Architecture', 'Implementation'],
      author: 'AI Security Research Team',
      date: '2024-01-15',
      readTime: 25,
      difficulty: 'Intermediate',
      rating: 4.8,
      views: 1247,
      bookmarked: true,
      summary: 'This guide provides step-by-step instructions for implementing zero trust architecture, including network segmentation, identity verification, and continuous monitoring strategies.',
      lastUpdated: '2024-01-15'
    },
    {
      id: '2',
      title: 'Advanced Threat Hunting Techniques',
      description: 'Deep dive into modern threat hunting methodologies and tools',
      category: 'threat-intelligence',
      type: 'video',
      tags: ['Threat Hunting', 'SIEM', 'Detection', 'Analysis'],
      author: 'Cyber Threat Expert',
      date: '2024-01-12',
      readTime: 45,
      difficulty: 'Advanced',
      rating: 4.9,
      views: 892,
      bookmarked: false,
      summary: 'Learn advanced threat hunting techniques using behavioral analysis, anomaly detection, and threat intelligence integration.',
      lastUpdated: '2024-01-12'
    },
    {
      id: '3',
      title: 'API Security Best Practices Checklist',
      description: 'Essential security measures for protecting APIs in production environments',
      category: 'application-security',
      type: 'best-practice',
      tags: ['API Security', 'Authentication', 'Authorization', 'Rate Limiting'],
      author: 'Application Security Team',
      date: '2024-01-10',
      readTime: 15,
      difficulty: 'Intermediate',
      rating: 4.7,
      views: 1534,
      bookmarked: true,
      summary: 'A comprehensive checklist covering authentication, authorization, input validation, rate limiting, and monitoring for API security.',
      lastUpdated: '2024-01-10'
    },
    {
      id: '4',
      title: 'Incident Response Playbook 2024',
      description: 'Updated incident response procedures and communication protocols',
      category: 'incident-response',
      type: 'document',
      tags: ['Incident Response', 'Playbook', 'Communication', 'Recovery'],
      author: 'Incident Response Team',
      date: '2024-01-08',
      readTime: 35,
      difficulty: 'Intermediate',
      rating: 4.6,
      views: 756,
      bookmarked: false,
      summary: 'Complete incident response playbook including detection, analysis, containment, eradication, and recovery procedures.',
      lastUpdated: '2024-01-08'
    },
    {
      id: '5',
      title: 'Cloud Security Architecture Patterns',
      description: 'Security patterns and practices for multi-cloud environments',
      category: 'cloud-security',
      type: 'research',
      tags: ['Cloud Security', 'Multi-Cloud', 'Architecture', 'Patterns'],
      author: 'Cloud Security Research',
      date: '2024-01-05',
      readTime: 40,
      difficulty: 'Advanced',
      rating: 4.8,
      views: 623,
      bookmarked: true,
      summary: 'Research paper on security architecture patterns for multi-cloud deployments, including shared responsibility models and security controls.',
      lastUpdated: '2024-01-05'
    },
    {
      id: '6',
      title: 'GDPR Compliance Audit Framework',
      description: 'Framework for conducting GDPR compliance audits and assessments',
      category: 'compliance',
      type: 'document',
      tags: ['GDPR', 'Compliance', 'Audit', 'Privacy'],
      author: 'Compliance Team',
      date: '2024-01-03',
      readTime: 30,
      difficulty: 'Intermediate',
      rating: 4.5,
      views: 445,
      bookmarked: false,
      summary: 'Comprehensive framework for conducting GDPR compliance audits, including assessment criteria and remediation guidelines.',
      lastUpdated: '2024-01-03'
    }
  ];

  const filteredItems = knowledgeItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesType = selectedType === 'all' || item.type === selectedType;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return FileText;
      case 'video': return Video;
      case 'audio': return AudioLines;
      case 'research': return Brain;
      case 'case-study': return Lightbulb;
      case 'best-practice': return Star;
      default: return FileText;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'Intermediate': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'Advanced': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case 'Expert': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800';
      default: return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Security Knowledge Base
                </h1>
                <p className="text-lg text-muted-foreground">
                  Comprehensive security research library and documentation
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="px-3 py-1">
              <Database className="w-3 h-3 mr-1" />
              {filteredItems.length} Resources
            </Badge>
            <Button className="gap-2">
              <Download className="w-4 h-4" />
              Export Library
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="bg-gradient-to-r from-card to-card/80 border-border/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search knowledge base... (e.g., 'zero trust', 'API security', 'incident response')"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-3 text-lg bg-background/50 border-border/70 focus:border-primary"
                />
              </div>

              {/* Filter Controls */}
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <span className="flex items-center gap-2">
                            <category.icon className="w-4 h-4" />
                            {category.name} ({category.count})
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {contentTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          <span className="flex items-center gap-2">
                            <type.icon className="w-4 h-4" />
                            {type.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Most Recent</SelectItem>
                      <SelectItem value="popular">Most Popular</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="title">Title A-Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.slice(1).map((category) => (
            <Card 
              key={category.id} 
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-card to-card/80 border-border/50"
              onClick={() => setSelectedCategory(category.id)}
            >
              <CardContent className="p-4 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <category.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{category.name}</p>
                    <p className="text-xs text-muted-foreground">{category.count} items</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Knowledge Items */}
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1'
        }`}>
          {filteredItems.map((item) => {
            const TypeIcon = getTypeIcon(item.type);
            
            return (
              <Card 
                key={item.id} 
                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card/80 border-border/50"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                        <TypeIcon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                          {item.title}
                        </CardTitle>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="flex-shrink-0">
                      {item.bookmarked ? (
                        <Bookmark className="w-4 h-4 text-primary fill-current" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  
                  <CardDescription className="line-clamp-2">
                    {item.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {item.summary}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {item.tags.slice(0, 3).map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {item.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{item.tags.length - 3}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        {renderStars(item.rating)}
                        <span className="ml-1 font-medium">{item.rating}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Eye className="w-4 h-4" />
                        {item.views}
                      </div>
                    </div>
                    <Badge className={getDifficultyColor(item.difficulty)}>
                      {item.difficulty}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {item.author}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.readTime} min read
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.date).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-0">
                  <div className="flex items-center gap-2 w-full">
                    <Button className="flex-1 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Play className="w-4 h-4 mr-2" />
                      {item.type === 'video' ? 'Watch' : item.type === 'audio' ? 'Listen' : 'Read'}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card className="bg-gradient-to-r from-muted/30 to-muted/10 border-border/30">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Contribute to the Knowledge Base</h3>
                <p className="text-muted-foreground">
                  Share your security expertise and help the community learn
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="gap-2">
                  <Edit className="w-4 h-4" />
                  Submit Article
                </Button>
                <Button variant="outline" className="gap-2">
                  <Video className="w-4 h-4" />
                  Upload Video
                </Button>
                <Button className="gap-2">
                  <Brain className="w-4 h-4" />
                  AI-Generated Content
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default withAuth(SecurityKnowledgeBase);
