'use client';
import React, { useState, useRef } from 'react';
import { 
  Video, 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Download, 
  Upload, 
  Share2, 
  Settings, 
  Maximize, 
  Minimize, 
  Volume2, 
  VolumeX, 
  SkipBack, 
  SkipForward, 
  Monitor, 
  Camera, 
  Mic, 
  MicOff, 
  StopCircle, 
  Edit, 
  Eye, 
  Brain, 
  Sparkles, 
  Target, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Calendar, 
  Activity, 
  BarChart3, 
  FileVideo, 
  Image, 
  Scissors, 
  Filter, 
  Zap, 
  Search, 
  BookOpen, 
  Users, 
  MessageCircle,
  TrendingUp,
  Database,
  Globe,
  Lock,
  Unlock,
  Code,
  Network,
  Server,
  Lightbulb,
  Star,
  Bookmark,
  ThumbsUp,
  ThumbsDown,
  Flag,
  MoreHorizontal,
  ExternalLink,
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

interface VideoAnalysis {
  id: string;
  title: string;
  description: string;
  duration: number;
  category: string;
  type: 'demo' | 'training' | 'analysis' | 'recording' | 'presentation';
  uploadDate: string;
  author: string;
  views: number;
  rating: number;
  tags: string[];
  aiInsights: {
    securityTopics: string[];
    vulnerabilities: string[];
    recommendations: string[];
    complexity: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
    confidence: number;
  };
  thumbnail: string;
  status: 'processing' | 'ready' | 'analyzing' | 'error';
}

interface RecordingSession {
  id: string;
  name: string;
  startTime: Date;
  duration: number;
  status: 'recording' | 'paused' | 'stopped' | 'processing';
  type: 'screen' | 'camera' | 'both';
  quality: '720p' | '1080p' | '4K';
  size: number; // in MB
}

const VideoAnalysisHub = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [recordingType, setRecordingType] = useState<'screen' | 'camera' | 'both'>('screen');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentSession, setCurrentSession] = useState<RecordingSession | null>(null);

  const categories = [
    { id: 'all', name: 'All Categories', icon: Video },
    { id: 'vulnerability-demo', name: 'Vulnerability Demos', icon: AlertTriangle },
    { id: 'security-training', name: 'Security Training', icon: BookOpen },
    { id: 'incident-analysis', name: 'Incident Analysis', icon: Target },
    { id: 'tool-demo', name: 'Tool Demonstrations', icon: Settings },
    { id: 'compliance-training', name: 'Compliance Training', icon: Shield },
    { id: 'threat-analysis', name: 'Threat Analysis', icon: Brain },
    { id: 'architecture-review', name: 'Architecture Reviews', icon: Network }
  ];

  const videoTypes = [
    { id: 'all', name: 'All Types' },
    { id: 'demo', name: 'Demonstrations' },
    { id: 'training', name: 'Training Videos' },
    { id: 'analysis', name: 'Analysis Sessions' },
    { id: 'recording', name: 'Screen Recordings' },
    { id: 'presentation', name: 'Presentations' }
  ];

  const videoAnalyses: VideoAnalysis[] = [
    {
      id: '1',
      title: 'SQL Injection Vulnerability Demonstration',
      description: 'Complete walkthrough of identifying and exploiting SQL injection vulnerabilities in web applications',
      duration: 1245, // seconds
      category: 'vulnerability-demo',
      type: 'demo',
      uploadDate: '2024-01-15',
      author: 'Security Research Team',
      views: 1247,
      rating: 4.8,
      tags: ['SQL Injection', 'Web Security', 'OWASP', 'Penetration Testing'],
      aiInsights: {
        securityTopics: ['SQL Injection', 'Input Validation', 'Parameterized Queries'],
        vulnerabilities: ['CWE-89: SQL Injection', 'CWE-20: Input Validation'],
        recommendations: [
          'Use parameterized queries',
          'Implement input validation',
          'Apply principle of least privilege'
        ],
        complexity: 'Intermediate',
        confidence: 94
      },
      thumbnail: '/api/placeholder/320/180',
      status: 'ready'
    },
    {
      id: '2',
      title: 'Zero Trust Architecture Implementation',
      description: 'Step-by-step guide to implementing zero trust security architecture in enterprise environments',
      duration: 2156,
      category: 'security-training',
      type: 'training',
      uploadDate: '2024-01-12',
      author: 'Network Security Expert',
      views: 892,
      rating: 4.9,
      tags: ['Zero Trust', 'Network Security', 'Architecture', 'Implementation'],
      aiInsights: {
        securityTopics: ['Zero Trust', 'Network Segmentation', 'Identity Verification'],
        vulnerabilities: ['Network Lateral Movement', 'Privilege Escalation'],
        recommendations: [
          'Implement micro-segmentation',
          'Deploy identity verification',
          'Continuous monitoring'
        ],
        complexity: 'Advanced',
        confidence: 92
      },
      thumbnail: '/api/placeholder/320/180',
      status: 'ready'
    },
    {
      id: '3',
      title: 'Incident Response Live Analysis',
      description: 'Real-time analysis of a security incident response scenario with threat hunting techniques',
      duration: 3420,
      category: 'incident-analysis',
      type: 'analysis',
      uploadDate: '2024-01-10',
      author: 'Incident Response Team',
      views: 634,
      rating: 4.7,
      tags: ['Incident Response', 'Threat Hunting', 'SIEM', 'Digital Forensics'],
      aiInsights: {
        securityTopics: ['Incident Response', 'Threat Hunting', 'Digital Forensics'],
        vulnerabilities: ['Advanced Persistent Threats', 'Lateral Movement'],
        recommendations: [
          'Enhance monitoring capabilities',
          'Improve incident response procedures',
          'Implement threat hunting program'
        ],
        complexity: 'Expert',
        confidence: 89
      },
      thumbnail: '/api/placeholder/320/180',
      status: 'ready'
    },
    {
      id: '4',
      title: 'API Security Testing Workshop',
      description: 'Hands-on workshop covering API security testing methodologies and tools',
      duration: 1890,
      category: 'security-training',
      type: 'training',
      uploadDate: '2024-01-08',
      author: 'Application Security Team',
      views: 1156,
      rating: 4.6,
      tags: ['API Security', 'Testing', 'OWASP API Top 10', 'Authentication'],
      aiInsights: {
        securityTopics: ['API Security', 'Authentication', 'Authorization', 'Rate Limiting'],
        vulnerabilities: ['Broken Authentication', 'Excessive Data Exposure'],
        recommendations: [
          'Implement OAuth 2.0',
          'Add rate limiting',
          'Validate all inputs'
        ],
        complexity: 'Intermediate',
        confidence: 91
      },
      thumbnail: '/api/placeholder/320/180',
      status: 'ready'
    }
  ];

  const handleStartRecording = () => {
    const session: RecordingSession = {
      id: Date.now().toString(),
      name: `Security Demo ${new Date().toLocaleDateString()}`,
      startTime: new Date(),
      duration: 0,
      status: 'recording',
      type: recordingType,
      quality: '1080p',
      size: 0
    };
    setCurrentSession(session);
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    if (currentSession) {
      setCurrentSession({
        ...currentSession,
        status: 'stopped',
        duration: Date.now() - currentSession.startTime.getTime()
      });
    }
    setIsRecording(false);
  };

  const handleAnalyzeVideo = (videoId: string) => {
    setIsAnalyzing(true);
    // Simulate AI analysis
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 3000);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
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

  const filteredVideos = videoAnalyses.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         video.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         video.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || video.category === selectedCategory;
    const matchesType = selectedType === 'all' || video.type === selectedType;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                <Video className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Video Analysis Hub
                </h1>
                <p className="text-lg text-muted-foreground">
                  Advanced video processing for security demonstrations and training
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="px-3 py-1">
              <Activity className="w-3 h-3 mr-1" />
              {filteredVideos.length} Videos
            </Badge>
            <Button className="gap-2">
              <Upload className="w-4 h-4" />
              Upload Video
            </Button>
          </div>
        </div>

        {/* Recording Control Center */}
        <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold flex items-center gap-2">
              <Video className="w-6 h-6 text-primary" />
              Recording Control Center
            </CardTitle>
            <CardDescription>
              Record security demonstrations, create training content, and capture analysis sessions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recording Controls */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Recording Type:</label>
                    <Select value={recordingType} onValueChange={(value: 'screen' | 'camera' | 'both') => setRecordingType(value)}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="screen">Screen Only</SelectItem>
                        <SelectItem value="camera">Camera Only</SelectItem>
                        <SelectItem value="both">Screen + Camera</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-4">
                    {!isRecording ? (
                      <Button
                        onClick={handleStartRecording}
                        className="gap-2 bg-red-600 hover:bg-red-700"
                      >
                        <Video className="w-4 h-4" />
                        Start Recording
                      </Button>
                    ) : (
                      <Button
                        onClick={handleStopRecording}
                        variant="destructive"
                        className="gap-2"
                      >
                        <StopCircle className="w-4 h-4" />
                        Stop Recording
                      </Button>
                    )}
                    
                    <Button variant="outline" className="gap-2">
                      <Settings className="w-4 h-4" />
                      Settings
                    </Button>
                  </div>
                </div>

                {currentSession && (
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Current Session</h4>
                        <Badge variant={isRecording ? "destructive" : "outline"}>
                          {currentSession.status}
                        </Badge>
                      </div>
                      <div className="text-sm space-y-1">
                        <div>Name: {currentSession.name}</div>
                        <div>Type: {currentSession.type}</div>
                        <div>Quality: {currentSession.quality}</div>
                        <div>Started: {currentSession.startTime.toLocaleTimeString()}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Recording Preview */}
              <div className="space-y-4">
                <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center relative overflow-hidden">
                  {isRecording ? (
                    <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-red-800/20 flex items-center justify-center">
                      <div className="text-center text-white">
                        <Video className="w-12 h-12 mx-auto mb-2 animate-pulse" />
                        <p className="text-lg font-medium">Recording Active</p>
                        <p className="text-sm opacity-75">
                          {recordingType === 'screen' ? 'Screen Recording' : 
                           recordingType === 'camera' ? 'Camera Recording' : 
                           'Screen + Camera Recording'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <Monitor className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-lg font-medium">Ready to Record</p>
                      <p className="text-sm">Click start to begin recording</p>
                    </div>
                  )}
                </div>
              </div>
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
                  placeholder="Search videos... (e.g., 'SQL injection', 'zero trust', 'incident response')"
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

                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {videoTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Video Library */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <Card key={video.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card/80 border-border/50">
              <CardHeader className="pb-3">
                <div className="aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg mb-3 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Play className="w-12 h-12 mx-auto mb-2 opacity-80" />
                      <p className="text-sm opacity-75">{formatDuration(video.duration)}</p>
                    </div>
                  </div>
                  <Badge className="absolute top-2 right-2 bg-black/50 text-white">
                    {video.type}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <CardTitle className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                    {video.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {video.description}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    {renderStars(video.rating)}
                    <span className="ml-1 font-medium">{video.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {video.views}
                  </div>
                  <Badge className={getComplexityColor(video.aiInsights.complexity)}>
                    {video.aiInsights.complexity}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">AI Analysis:</p>
                  <div className="text-xs space-y-1">
                    <div>
                      <span className="font-medium">Topics: </span>
                      <span className="text-muted-foreground">
                        {video.aiInsights.securityTopics.slice(0, 2).join(', ')}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Confidence: </span>
                      <span className="text-primary">{video.aiInsights.confidence}%</span>
                    </div>
                  </div>
                  <Progress value={video.aiInsights.confidence} className="h-1" />
                </div>

                <div className="flex flex-wrap gap-1">
                  {video.tags.slice(0, 3).map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {video.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{video.tags.length - 3}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{video.author}</span>
                  <span>{new Date(video.uploadDate).toLocaleDateString()}</span>
                </div>
              </CardContent>

              <CardFooter className="pt-0">
                <div className="flex items-center gap-2 w-full">
                  <Button className="flex-1 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Play className="w-4 h-4 mr-2" />
                    Watch
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleAnalyzeVideo(video.id)}
                    disabled={isAnalyzing}
                  >
                    <Brain className="w-4 h-4" />
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
          ))}
        </div>

        {/* AI Video Analysis Features */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" />
              AI-Powered Video Analysis
            </CardTitle>
            <CardDescription>
              Advanced AI capabilities for security video content analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold">Vulnerability Detection</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Automatically identify security vulnerabilities demonstrated in videos and provide detailed analysis.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold">Content Transcription</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Generate accurate transcripts and extract key security concepts and terminology.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold">Learning Insights</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Extract learning objectives and create knowledge assessments from video content.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-gradient-to-r from-muted/30 to-muted/10 border-border/30">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Create Professional Security Content</h3>
                <p className="text-muted-foreground">
                  Record demonstrations, create training materials, and analyze security scenarios
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="gap-2">
                  <BookOpen className="w-4 h-4" />
                  Video Templates
                </Button>
                <Button variant="outline" className="gap-2">
                  <Settings className="w-4 h-4" />
                  Recording Settings
                </Button>
                <Button className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  AI Enhancement
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default withAuth(VideoAnalysisHub);
