'use client';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Send, 
  Mic, 
  MicOff, 
  Bot, 
  User, 
  Sparkles, 
  Shield, 
  MessageCircle, 
  Copy, 
  ThumbsUp, 
  ThumbsDown, 
  BookOpen, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  Download, 
  Share2, 
  Settings,
  Zap,
  Clock,
  Activity,
  Brain,
  Search,
  Filter,
  History,
  Bookmark,
  Star,
  Trash2,
  MoreVertical,
  ExternalLink,
  Code,
  Database,
  Server,
  Network,
  Globe,
  Lock,
  Eye,
  ShieldCheck,
  RefreshCw,
  Play,
  Pause,
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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import withAuth from '@/utils/withAuth';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: string[];
  analysis?: {
    confidence: number;
    severity: string;
    category: string;
    recommendations: string[];
  };
}

const AISecurityChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: `Hello! I'm your AI Security Researcher assistant. I can help you with:

• **Threat Analysis** - Analyze potential security threats and vulnerabilities
• **Risk Assessment** - Quantify and evaluate security risks
• **Compliance Guidance** - Navigate security standards and regulations
• **Incident Response** - Provide guidance during security incidents
• **Code Review** - Analyze code for security vulnerabilities
• **Architecture Review** - Assess security of system designs

What would you like to explore today?`,
      timestamp: new Date(),
      analysis: {
        confidence: 100,
        severity: 'Info',
        category: 'Introduction',
        recommendations: ['Start by asking about specific security concerns', 'Upload files for analysis', 'Use voice commands for hands-free interaction']
      }
    }
  ]);
  
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const securityCategories = useMemo(() => [
    { id: 'all', label: 'All Topics', icon: Sparkles },
    { id: 'threat-analysis', label: 'Threat Analysis', icon: Target },
    { id: 'vulnerability', label: 'Vulnerabilities', icon: AlertTriangle },
    { id: 'compliance', label: 'Compliance', icon: CheckCircle },
    { id: 'incident-response', label: 'Incident Response', icon: Shield },
    { id: 'code-review', label: 'Code Review', icon: Code },
    { id: 'network-security', label: 'Network Security', icon: Network },
    { id: 'cloud-security', label: 'Cloud Security', icon: Globe },
    { id: 'data-protection', label: 'Data Protection', icon: Database }
  ], []);

  const quickPrompts = useMemo(() => [
    "Analyze the latest OWASP Top 10 vulnerabilities",
    "How to implement zero-trust architecture?",
    "Best practices for API security testing",
    "Explain GDPR compliance requirements",
    "Help with incident response planning",
    "Review security of microservices architecture",
    "Guide through SOC 2 Type II audit",
    "Assess cloud security posture"
  ], []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Escape to close mobile sidebar
      if (e.key === 'Escape' && showMobileSidebar) {
        setShowMobileSidebar(false);
      }
      
      // Ctrl/Cmd + K to focus input
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      
      // Ctrl/Cmd + Enter to send message
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSendMessage();
      }
      
      // Ctrl/Cmd + B to toggle analysis
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setShowAnalysis(!showAnalysis);
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMobileSidebar, showAnalysis]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = useCallback(async () => {
    if (!currentMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    // Simulate AI response with realistic delay
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: generateAIResponse(currentMessage),
        timestamp: new Date(),
        analysis: {
          confidence: Math.floor(Math.random() * 20) + 80,
          severity: ['Low', 'Medium', 'High', 'Critical'][Math.floor(Math.random() * 4)],
          category: selectedCategory === 'all' ? 'General Security' : securityCategories.find(c => c.id === selectedCategory)?.label || 'General',
          recommendations: generateRecommendations()
        }
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500 + Math.random() * 1000);
  }, [currentMessage, selectedCategory, securityCategories]);

  const generateAIResponse = (query: string): string => {
    const responses = [
      `Based on my analysis of your query about "${query}", here are the key security considerations:

**Risk Assessment:**
• High probability of SQL injection vulnerabilities in legacy systems
• Network segmentation gaps identified in current architecture
• Authentication mechanisms need strengthening

**Recommendations:**
1. Implement parameterized queries and input validation
2. Deploy network access control lists (NACLs)
3. Enable multi-factor authentication (MFA)
4. Regular security audits and penetration testing

**Next Steps:**
- Review current security policies
- Update incident response procedures
- Schedule security awareness training

Would you like me to dive deeper into any of these areas?`,

      `Excellent question! Let me provide a comprehensive security analysis:

**Current Threat Landscape:**
• Advanced Persistent Threats (APTs) targeting your industry
• Increased phishing campaigns and social engineering attacks
• Zero-day vulnerabilities in commonly used frameworks

**Mitigation Strategies:**
1. **Defense in Depth**: Implement layered security controls
2. **Continuous Monitoring**: Deploy SIEM and SOC capabilities
3. **Incident Response**: Establish clear procedures and communication channels
4. **Employee Training**: Regular security awareness programs

**Compliance Considerations:**
- Ensure alignment with industry standards (ISO 27001, NIST)
- Regular compliance audits and gap assessments
- Documentation of security controls and procedures

I can help you create specific implementation plans for any of these areas.`,

      `Great question about security best practices! Here's my analysis:

**Technical Controls:**
• Web Application Firewall (WAF) configuration
• Database encryption and access controls
• API security and rate limiting
• Container security and image scanning

**Operational Controls:**
• Security incident escalation procedures
• Change management and approval workflows
• Backup and disaster recovery testing
• Vendor risk assessment processes

**Strategic Recommendations:**
1. Develop a comprehensive security roadmap
2. Establish security metrics and KPIs
3. Regular security posture assessments
4. Executive reporting and governance

**Risk Quantification:**
- Potential financial impact: $2.5M - $5.2M
- Probability of occurrence: Medium to High
- Recommended security investment: 3-5% of IT budget

Would you like me to elaborate on any specific area?`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  };

  const generateRecommendations = (): string[] => {
    const allRecommendations = [
      'Implement zero-trust network architecture',
      'Enable multi-factor authentication across all systems',
      'Conduct regular penetration testing',
      'Update incident response procedures',
      'Enhance security awareness training',
      'Deploy endpoint detection and response (EDR)',
      'Implement data loss prevention (DLP) controls',
      'Review and update security policies',
      'Establish security metrics and monitoring',
      'Conduct vendor security assessments'
    ];

    return allRecommendations.slice(0, 3 + Math.floor(Math.random() * 3));
  };

  const handleQuickPrompt = (prompt: string) => {
    setCurrentMessage(prompt);
    inputRef.current?.focus();
  };

  const handleVoiceToggle = () => {
    setIsRecording(!isRecording);
    // Voice recording logic would go here
  };

  const handleSpeakToggle = () => {
    setIsSpeaking(!isSpeaking);
    // Text-to-speech logic would go here
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800';
      case 'High': return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800';
      case 'Medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800';
      case 'Low': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800';
      default: return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800';
    }
  };

  return (
    <div className="w-full max-w-full overflow-hidden min-h-screen bg-background">
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="w-full border border-border/50 rounded-lg bg-card/80 backdrop-blur-md p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 border border-primary/30 shadow-inner flex-shrink-0">
                  <Brain className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text truncate">
                    AI Security Chat
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block truncate">
                    Intelligent security assistant powered by advanced AI
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <Badge variant="outline" className="gap-1 sm:gap-2 bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-300 text-xs whitespace-nowrap">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="hidden sm:inline">Online</span>
                  <span className="sm:hidden">●</span>
                </Badge>
                <Button variant="outline" size="sm" className="hover:bg-muted/50 transition-colors h-8 w-8 sm:h-auto sm:w-auto sm:px-3 flex-shrink-0">
                  <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden lg:inline ml-2">Settings</span>
                </Button>
              </div>
            </div>

            {/* Category Filter */}
            <div className="w-full">
              <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1">
                <div className="flex gap-1 sm:gap-2 px-1">
                  {securityCategories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category.id)}
                      className={`flex-shrink-0 gap-1 sm:gap-2 transition-all duration-200 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3 whitespace-nowrap ${
                        selectedCategory === category.id 
                          ? 'shadow-md bg-primary hover:bg-primary/90' 
                          : 'hover:bg-muted/50 hover:shadow-sm'
                      }`}
                    >
                      <category.icon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="hidden sm:inline">{category.label}</span>
                      <span className="sm:hidden">{category.label.split(' ')[0]}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="w-full border border-border/50 rounded-lg bg-card/50 backdrop-blur-sm overflow-hidden">
          {/* Messages Container */}
          <div className="h-[60vh] sm:h-[65vh] lg:h-[70vh] flex flex-col w-full">
            <ScrollArea className="flex-1 w-full">
              <div className="p-4 sm:p-6 w-full">
                <div className="space-y-3 sm:space-y-4 lg:space-y-6 w-full max-w-none">
                  {messages.map((message) => (
                    <div key={message.id} className={`w-full flex gap-2 sm:gap-3 lg:gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {message.type === 'assistant' && (
                        <Avatar className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-primary/10 to-primary/20 border border-primary/30 flex-shrink-0">
                          <Bot className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-primary" />
                        </Avatar>
                      )}
                      
                      <div className={`max-w-[75%] sm:max-w-[80%] lg:max-w-[85%] space-y-2 min-w-0 ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
                        <Card className={`w-full transition-all duration-200 hover:shadow-lg ${
                          message.type === 'user' 
                            ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground ml-auto shadow-md border-primary/20' 
                            : 'bg-card/80 backdrop-blur-sm border-border/50 hover:bg-card/90'
                        }`}>
                          <CardContent className="p-2.5 sm:p-3 lg:p-4 w-full">
                            <div className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed break-words w-full overflow-hidden">
                              {message.content}
                            </div>
                            
                            {message.analysis && showAnalysis && message.type === 'assistant' && (
                              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/30 space-y-2 sm:space-y-3 w-full">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Brain className="w-3 h-3 flex-shrink-0" />
                                  <span className="font-medium">Analysis Summary</span>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs w-full">
                                  <div className="space-y-1.5 sm:space-y-2 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <span className="text-muted-foreground text-xs">Confidence</span>
                                      <span className="font-medium text-xs sm:text-sm">{message.analysis.confidence}%</span>
                                    </div>
                                    <Progress 
                                      value={message.analysis.confidence} 
                                      className="h-1.5 sm:h-2 bg-muted/50 w-full" 
                                    />
                                  </div>
                                  <div className="space-y-1.5 sm:space-y-2 min-w-0">
                                    <span className="text-muted-foreground block text-xs">Severity Level</span>
                                    <Badge className={`${getSeverityColor(message.analysis.severity)} font-medium text-xs whitespace-nowrap`}>
                                      {message.analysis.severity}
                                    </Badge>
                                  </div>
                                </div>
                                
                                {message.analysis.recommendations && message.analysis.recommendations.length > 0 && (
                                  <div className="space-y-2 w-full">
                                    <span className="text-xs text-muted-foreground font-medium">Recommended Actions</span>
                                    <div className="grid grid-cols-1 gap-1.5 sm:gap-2 w-full">
                                      {message.analysis.recommendations.slice(0, 3).map((rec, idx) => (
                                        <Badge 
                                          key={idx} 
                                          variant="secondary" 
                                          className="text-xs cursor-pointer hover:bg-secondary/80 transition-colors p-1.5 sm:p-2 text-left justify-start w-full"
                                        >
                                          <span className="truncate break-words">{rec}</span>
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                        
                        <div className="flex items-center gap-1 sm:gap-2 text-xs text-muted-foreground px-1 w-full">
                          <div className="flex items-center gap-1 min-w-0">
                            {message.type === 'assistant' ? (
                              <>
                                <Bot className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                                <span className="hidden sm:inline text-xs whitespace-nowrap">AI Assistant</span>
                                <span className="sm:hidden text-xs">AI</span>
                              </>
                            ) : (
                              <>
                                <User className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                                <span className="text-xs">You</span>
                              </>
                            )}
                          </div>
                          <span className="text-xs">•</span>
                          <span className="text-xs whitespace-nowrap">{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          
                          {message.type === 'assistant' && (
                            <div className="flex items-center gap-0.5 sm:gap-1 ml-auto flex-shrink-0">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-5 w-5 sm:h-6 sm:w-6 p-0 hover:bg-muted/50 transition-colors"
                                title="Copy message"
                              >
                                <Copy className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-5 w-5 sm:h-6 sm:w-6 p-0 hover:bg-muted/50 transition-colors"
                                title="Helpful"
                              >
                                <ThumbsUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-5 w-5 sm:h-6 sm:w-6 p-0 hover:bg-muted/50 transition-colors"
                                title="Not helpful"
                              >
                                <ThumbsDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-5 w-5 sm:h-6 sm:w-6 p-0 hover:bg-muted/50 transition-colors"
                                onClick={handleSpeakToggle}
                                title={isSpeaking ? "Stop speaking" : "Read aloud"}
                              >
                                {isSpeaking ? <VolumeX className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <Volume2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {message.type === 'user' && (
                        <Avatar className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-secondary to-secondary/80 flex-shrink-0">
                          <User className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                        </Avatar>
                      )}
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="w-full flex gap-2 sm:gap-3 lg:gap-4">
                      <Avatar className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-primary/10 to-primary/20 border border-primary/30 flex-shrink-0">
                        <Bot className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-primary" />
                      </Avatar>
                      <Card className="bg-card/80 backdrop-blur-sm border-border/50 animate-pulse max-w-[75%] sm:max-w-[80%] lg:max-w-[85%] w-full">
                        <CardContent className="p-2.5 sm:p-3 lg:p-4">
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                            <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                            <span>AI is analyzing your request...</span>
                          </div>
                          <div className="mt-2 space-y-1.5 sm:space-y-2">
                            <div className="h-1.5 sm:h-2 bg-muted/50 rounded w-3/4 animate-pulse"></div>
                            <div className="h-1.5 sm:h-2 bg-muted/50 rounded w-1/2 animate-pulse"></div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </ScrollArea>

          {/* Quick Prompts */}
          <div className="border-t bg-card/30 backdrop-blur-sm p-3 sm:p-4 w-full">
            <div className="w-full max-w-4xl mx-auto">
              <p className="text-xs text-muted-foreground mb-2 sm:mb-3 font-medium">Quick prompts to get started:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 w-full">
                {quickPrompts.slice(0, 4).map((prompt, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickPrompt(prompt)}
                    className="w-full text-xs hover:bg-primary/10 hover:border-primary/30 transition-all duration-200 justify-start text-left h-auto py-1.5 sm:py-2 px-2 sm:px-3 min-w-0"
                  >
                    <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1.5 sm:mr-2 flex-shrink-0" />
                    <span className="truncate text-xs">{prompt}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t bg-card/60 backdrop-blur-md p-3 sm:p-4 shadow-sm w-full">
            <div className="w-full max-w-4xl mx-auto">
              <div className="flex items-end gap-2 sm:gap-3 w-full">
                <div className="flex-1 relative min-w-0">
                  <Input
                    ref={inputRef}
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    placeholder="Ask me anything about security... (Ctrl+K to focus, Ctrl+Enter to send)"
                    className="w-full pr-10 sm:pr-12 py-2.5 sm:py-3 text-sm sm:text-base bg-background/80 border-border/70 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 rounded-lg sm:rounded-xl"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={isLoading}
                  />
                  <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleVoiceToggle}
                      className={`h-6 w-6 sm:h-8 sm:w-8 p-0 transition-all duration-200 flex-shrink-0 ${
                        isRecording 
                          ? 'text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-950 dark:hover:bg-red-900' 
                          : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                      }`}
                      title={isRecording ? "Stop recording" : "Voice input"}
                    >
                      {isRecording ? (
                        <div className="relative">
                          <MicOff className="w-3 h-3 sm:w-4 sm:h-4" />
                          <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                        </div>
                      ) : (
                        <Mic className="w-3 h-3 sm:w-4 sm:h-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!currentMessage.trim() || isLoading}
                  className="h-10 sm:h-12 px-3 sm:px-4 lg:px-6 gap-1.5 sm:gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg sm:rounded-xl flex-shrink-0"
                >
                  {isLoading ? (
                    <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                  ) : (
                    <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                  )}
                  <span className="hidden sm:inline text-sm whitespace-nowrap">Send</span>
                </Button>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-2 sm:mt-3 gap-2 text-xs text-muted-foreground w-full">
                <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                  <span className="hidden md:inline text-xs whitespace-nowrap">⌘K to focus • ⌘⏎ to send • ⌘B to toggle analysis</span>
                  <span className="md:hidden text-xs">Enter to send • Shift+Enter for new line</span>
                  <Button variant="ghost" size="sm" className="h-5 sm:h-6 text-xs hover:bg-muted/50 transition-colors px-2 flex-shrink-0">
                    <FileText className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                    Upload
                  </Button>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowAnalysis(!showAnalysis)}
                    className="h-5 sm:h-6 text-xs hover:bg-muted/50 transition-colors px-2 whitespace-nowrap"
                  >
                    <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                    {showAnalysis ? 'Hide' : 'Show'} Analysis
                  </Button>
                  <div className="text-xs text-muted-foreground border-l pl-2 whitespace-nowrap">
                    {messages.length - 1} {messages.length === 2 ? 'message' : 'messages'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Quick Actions - Bottom floating button */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="default"
          size="icon"
          onClick={() => setShowMobileSidebar(true)}
          className="h-12 w-12 rounded-full shadow-lg bg-gradient-to-r from-primary to-primary/90 hover:shadow-xl transition-all duration-200"
          title="Quick Actions"
        >
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>

      {/* Mobile Actions Overlay */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setShowMobileSidebar(false)}>
          <div 
            className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t shadow-2xl rounded-t-2xl overflow-y-auto scrollbar-hide transform transition-transform duration-300 max-h-[70vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b bg-card/80 backdrop-blur-sm flex items-center justify-between">
              <h3 className="font-semibold text-lg">Quick Actions</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileSidebar(false)}
                className="h-8 w-8 p-0"
              >
                ×
              </Button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Quick Settings */}
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setShowAnalysis(!showAnalysis);
                    setShowMobileSidebar(false);
                  }}
                  className="flex-col h-16 gap-1"
                >
                  <Eye className="w-4 h-4" />
                  <span className="text-xs">{showAnalysis ? 'Hide' : 'Show'} Analysis</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-col h-16 gap-1"
                  onClick={() => setShowMobileSidebar(false)}
                >
                  <FileText className="w-4 h-4" />
                  <span className="text-xs">Upload File</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-col h-16 gap-1"
                  onClick={() => setShowMobileSidebar(false)}
                >
                  <Download className="w-4 h-4" />
                  <span className="text-xs">Export Chat</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-col h-16 gap-1"
                  onClick={() => setShowMobileSidebar(false)}
                >
                  <Share2 className="w-4 h-4" />
                  <span className="text-xs">Share</span>
                </Button>
              </div>

              {/* Category Quick Select */}
              <div>
                <h4 className="text-sm font-medium mb-2">Security Categories</h4>
                <div className="grid grid-cols-2 gap-2">
                  {securityCategories.slice(0, 6).map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedCategory(category.id);
                        setShowMobileSidebar(false);
                      }}
                      className="justify-start gap-2 text-xs h-8"
                    >
                      <category.icon className="w-3 h-3" />
                      <span className="truncate">{category.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Quick Prompts */}
              <div>
                <h4 className="text-sm font-medium mb-2">Quick Prompts</h4>
                <div className="space-y-2">
                  {quickPrompts.slice(0, 3).map((prompt, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleQuickPrompt(prompt);
                        setShowMobileSidebar(false);
                      }}
                      className="w-full justify-start text-left h-auto py-2 px-3 text-xs"
                    >
                      <span className="truncate">{prompt}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Session Info */}
              <Card className="border-border/50">
                <CardContent className="p-3 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Messages</span>
                    <Badge variant="secondary">{messages.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Category</span>
                    <Badge variant="outline" className="text-xs">
                      {securityCategories.find(c => c.id === selectedCategory)?.label || 'All'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Quick Actions - Bottom floating button */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="default"
          size="icon"
          onClick={() => setShowMobileSidebar(true)}
          className="h-12 w-12 rounded-full shadow-lg bg-gradient-to-r from-primary to-primary/90 hover:shadow-xl transition-all duration-200"
          title="Quick Actions"
        >
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>
      </div>
    </div>
  );
};

export default withAuth(AISecurityChat);
