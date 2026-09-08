'use client';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Send, 
  Settings, 
  Activity, 
  Zap, 
  Brain, 
  MessageCircle, 
  FileAudio, 
  Download, 
  Upload, 
  Headphones, 
  Radio, 
  Waves, 
  Eye, 
  EyeOff, 
  Languages, 
  Globe, 
  Clock, 
  BarChart3, 
  Target, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle, 
  Sparkles,
  AudioLines,
  PlayCircle,
  PauseCircle,
  StopCircle,
  Speaker,
  Monitor,
  Smartphone,
  Laptop
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
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import withAuth from '@/utils/withAuth';

interface VoiceSession {
  id: string;
  timestamp: Date;
  duration: number;
  topic: string;
  summary: string;
  confidence: number;
  language: string;
}

interface AudioVisualizerProps {
  isActive: boolean;
  amplitude: number;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isActive, amplitude }) => {
  const bars = Array.from({ length: 20 }, (_, i) => i);
  
  return (
    <div className="flex items-center justify-center gap-1 h-16">
      {bars.map((bar) => (
        <div
          key={bar}
          className={`w-1 bg-primary rounded-full transition-all duration-100 ${
            isActive ? 'animate-pulse' : ''
          }`}
          style={{
            height: isActive 
              ? `${Math.random() * amplitude * 60 + 10}px` 
              : '4px',
            animationDelay: `${bar * 50}ms`
          }}
        />
      ))}
    </div>
  );
};

const VoiceAssistant = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  const [volume, setVolume] = useState([75]);
  const [speechRate, setSpeechRate] = useState([1]);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [selectedVoice, setSelectedVoice] = useState('neural-female');
  const [isAccessibilityMode, setIsAccessibilityMode] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [sessionStats, setSessionStats] = useState({
    totalQueries: 0,
    avgConfidence: 0,
    sessionTime: 0
  });

  const [recentSessions] = useState<VoiceSession[]>([
    {
      id: '1',
      timestamp: new Date(Date.now() - 3600000),
      duration: 450,
      topic: 'Zero Trust Architecture Implementation',
      summary: 'Discussed implementation strategies for zero trust security model',
      confidence: 92,
      language: 'en-US'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 7200000),
      duration: 320,
      topic: 'API Security Best Practices',
      summary: 'Covered authentication, rate limiting, and input validation',
      confidence: 88,
      language: 'en-US'
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 10800000),
      duration: 275,
      topic: 'Incident Response Planning',
      summary: 'Created step-by-step incident response procedures',
      confidence: 95,
      language: 'en-US'
    }
  ]);

  const languages = [
    { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
    { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
    { code: 'es-ES', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr-FR', name: 'French', flag: '🇫🇷' },
    { code: 'de-DE', name: 'German', flag: '🇩🇪' },
    { code: 'it-IT', name: 'Italian', flag: '🇮🇹' },
    { code: 'ja-JP', name: 'Japanese', flag: '🇯🇵' },
    { code: 'ko-KR', name: 'Korean', flag: '🇰🇷' }
  ];

  const voices = [
    { id: 'neural-female', name: 'Neural Female (Professional)', type: 'Neural' },
    { id: 'neural-male', name: 'Neural Male (Authoritative)', type: 'Neural' },
    { id: 'standard-female', name: 'Standard Female (Friendly)', type: 'Standard' },
    { id: 'standard-male', name: 'Standard Male (Clear)', type: 'Standard' }
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isListening) {
      interval = setInterval(() => {
        setAudioLevel(Math.random() * 100);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isListening]);

  const handleStartListening = () => {
    setIsListening(true);
    setCurrentTranscript('');
    // Simulate speech recognition
    setTimeout(() => {
      setCurrentTranscript('How can I implement a zero trust security architecture for my organization?');
      setIsListening(false);
      setIsProcessing(true);
      
      setTimeout(() => {
        setIsProcessing(false);
        setIsSpeaking(true);
        setLastResponse('Zero trust architecture is a security model that assumes no implicit trust and continuously validates every transaction. Let me walk you through the key implementation steps...');
        
        setTimeout(() => {
          setIsSpeaking(false);
          setSessionStats(prev => ({
            totalQueries: prev.totalQueries + 1,
            avgConfidence: 92,
            sessionTime: prev.sessionTime + 45
          }));
        }, 4000);
      }, 2000);
    }, 3000);
  };

  const handleStopListening = () => {
    setIsListening(false);
    setIsProcessing(false);
  };

  const handleStopSpeaking = () => {
    setIsSpeaking(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    if (isListening) return 'bg-red-500';
    if (isProcessing) return 'bg-yellow-500';
    if (isSpeaking) return 'bg-blue-500';
    return 'bg-gray-500';
  };

  const getStatusText = () => {
    if (isListening) return 'Listening...';
    if (isProcessing) return 'Processing...';
    if (isSpeaking) return 'Speaking...';
    return 'Ready';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                <Mic className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Voice Security Assistant
                </h1>
                <p className="text-lg text-muted-foreground">
                  Hands-free security research and voice-to-voice interactions
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline" className={`px-3 py-1 ${getStatusColor()}`}>
              <div className={`w-2 h-2 rounded-full ${getStatusColor()} mr-2`} />
              {getStatusText()}
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              <Globe className="w-3 h-3 mr-1" />
              {languages.find(l => l.code === selectedLanguage)?.name}
            </Badge>
          </div>
        </div>

        {/* Main Voice Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Voice Control Center */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold flex items-center gap-2">
                  <Radio className="w-6 h-6 text-primary" />
                  Voice Control Center
                </CardTitle>
                <CardDescription>
                  Ask questions about security using natural language
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Audio Visualizer */}
                <div className="flex items-center justify-center p-8 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                  <AudioVisualizer isActive={isListening || isSpeaking} amplitude={audioLevel / 100} />
                </div>

                {/* Main Controls */}
                <div className="flex items-center justify-center gap-4">
                  {!isListening && !isProcessing && !isSpeaking && (
                    <Button
                      size="lg"
                      onClick={handleStartListening}
                      className="h-16 w-16 rounded-full bg-primary hover:bg-primary/90 group"
                    >
                      <Mic className="w-8 h-8 group-hover:scale-110 transition-transform" />
                    </Button>
                  )}
                  
                  {isListening && (
                    <Button
                      size="lg"
                      onClick={handleStopListening}
                      variant="destructive"
                      className="h-16 w-16 rounded-full animate-pulse"
                    >
                      <Square className="w-8 h-8" />
                    </Button>
                  )}
                  
                  {isProcessing && (
                    <div className="h-16 w-16 rounded-full bg-yellow-500 flex items-center justify-center animate-spin">
                      <Brain className="w-8 h-8 text-white" />
                    </div>
                  )}
                  
                  {isSpeaking && (
                    <Button
                      size="lg"
                      onClick={handleStopSpeaking}
                      variant="outline"
                      className="h-16 w-16 rounded-full"
                    >
                      <PauseCircle className="w-8 h-8" />
                    </Button>
                  )}
                </div>

                {/* Status and Transcript */}
                {showTranscript && (
                  <div className="space-y-4">
                    {currentTranscript && (
                      <Card className="bg-blue-500/10 border-blue-200 dark:border-blue-800">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-2">
                            <MessageCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-blue-600 mb-1">You said:</p>
                              <p className="text-sm text-blue-700 dark:text-blue-300">{currentTranscript}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    {lastResponse && (
                      <Card className="bg-primary/10 border-primary/20">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-2">
                            <Brain className="w-5 h-5 text-primary mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-primary mb-1">AI Assistant:</p>
                              <p className="text-sm text-foreground">{lastResponse}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    Save Session
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Audio
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Switch to Chat
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Voice Settings */}
            <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  Voice Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Language Selection */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Language</Label>
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            <span className="flex items-center gap-2">
                              <span>{lang.flag}</span>
                              {lang.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Voice Selection */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Voice</Label>
                    <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {voices.map((voice) => (
                          <SelectItem key={voice.id} value={voice.id}>
                            {voice.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Volume Control */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Volume2 className="w-4 h-4" />
                      Volume: {volume[0]}%
                    </Label>
                    <Slider
                      value={volume}
                      onValueChange={setVolume}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Speech Rate */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Speech Rate: {speechRate[0]}x
                    </Label>
                    <Slider
                      value={speechRate}
                      onValueChange={setSpeechRate}
                      min={0.5}
                      max={2}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Accessibility Options */}
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="text-sm font-medium">Accessibility Options</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="accessibility-mode" className="text-sm">Enhanced Accessibility</Label>
                      <Switch
                        id="accessibility-mode"
                        checked={isAccessibilityMode}
                        onCheckedChange={setIsAccessibilityMode}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-transcript" className="text-sm">Show Transcript</Label>
                      <Switch
                        id="show-transcript"
                        checked={showTranscript}
                        onCheckedChange={setShowTranscript}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Session Stats */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Session Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{sessionStats.totalQueries}</div>
                    <div className="text-sm text-muted-foreground">Total Queries</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{sessionStats.avgConfidence}%</div>
                    <div className="text-sm text-muted-foreground">Avg Confidence</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{formatDuration(sessionStats.sessionTime)}</div>
                    <div className="text-sm text-muted-foreground">Session Time</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Sessions */}
            <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Recent Sessions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentSessions.map((session) => (
                  <div key={session.id} className="p-3 rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm line-clamp-1">{session.topic}</h4>
                        <Badge variant="outline" className="text-xs">
                          {session.confidence}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {session.summary}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatDuration(session.duration)}</span>
                        <span>{session.timestamp.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full">
                  View All Sessions
                </Button>
              </CardFooter>
            </Card>

            {/* Quick Commands */}
            <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Voice Commands
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-2">
                  <p className="font-medium">Try saying:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>&quot;Explain zero trust architecture&quot;</li>
                    <li>&quot;How to secure APIs?&quot;</li>
                    <li>&quot;What are the latest security threats?&quot;</li>
                    <li>&quot;Help with compliance requirements&quot;</li>
                    <li>&quot;Analyze this vulnerability&quot;</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default withAuth(VoiceAssistant);
