'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  Github,
  Shield,
  Brain,
  Clock,
  Users,
  AlertTriangle,
  Check,
  Plus,
  Trash2,
  Key,
  Link,
  Globe,
  Lock,
  Zap,
  Target,
  FileText
} from "lucide-react";

interface GitHubRepo {
  id: string;
  name: string;
  fullName: string;
  isConnected: boolean;
  branch: string;
  webhookUrl?: string;
}

const mockRepos: GitHubRepo[] = [
  { id: '1', name: 'trilux-core', fullName: 'company/trilux-core', isConnected: true, branch: 'main' },
  { id: '2', name: 'trilux-ui', fullName: 'company/trilux-ui', isConnected: true, branch: 'develop' },
  { id: '3', name: 'trilux-auth', fullName: 'company/trilux-auth', isConnected: false, branch: 'main' },
  { id: '4', name: 'trilux-docs', fullName: 'company/trilux-docs', isConnected: false, branch: 'main' }
];

export default function PRReviewSettingsPage() {
  const [repos, setRepos] = useState<GitHubRepo[]>(mockRepos);
  const [settings, setSettings] = useState({
    // General Settings
    autoReview: true,
    requireManualApproval: false,
    maxConcurrentReviews: 3,
    reviewTimeout: 30,

    // Security Settings
    enforceSecurityChecks: true,
    blockCriticalIssues: true,
    requireSecurityReview: true,
    allowedVulnerabilityLevels: ['low', 'medium'],

    // Quality Settings
    minimumQualityScore: 75,
    minimumSecurityScore: 85,
    minimumPerformanceScore: 70,
    enforceCodeStyle: true,
    requireTests: true,
    minimumCoverage: 80,

    // AI Settings
    aiModel: 'gpt-4',
    enableLearning: true,
    confidenceThreshold: 0.8,
    fallbackToHuman: true,

    // Notification Settings
    emailNotifications: true,
    slackNotifications: false,
    webhookUrl: '',
    notifyOnApproval: true,
    notifyOnRejection: true,
    notifyOnIssues: true
  });

  const [customRules, setCustomRules] = useState([
    { id: '1', name: 'No hardcoded secrets', pattern: '(api_key|password|secret)', severity: 'critical' },
    { id: '2', name: 'Require error handling', pattern: 'try.*catch', severity: 'medium' },
    { id: '3', name: 'SQL injection check', pattern: 'SELECT.*\\+', severity: 'high' }
  ]);

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleRepoConnection = (repoId: string, connect: boolean) => {
    setRepos(prev => prev.map(repo =>
      repo.id === repoId ? { ...repo, isConnected: connect } : repo
    ));
  };

  const addCustomRule = () => {
    const newRule = {
      id: Date.now().toString(),
      name: 'New Rule',
      pattern: '',
      severity: 'medium' as const
    };
    setCustomRules(prev => [...prev, newRule]);
  };

  const removeCustomRule = (ruleId: string) => {
    setCustomRules(prev => prev.filter(rule => rule.id !== ruleId));
  };

  const saveSettings = () => {
    // In a real app, this would save to backend
    console.log('Saving settings:', settings);
    // Show success message
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PR Review Settings</h1>
          <p className="text-muted-foreground">
            Configure autonomous PR review agent behavior and integrations
          </p>
        </div>
        <Button onClick={saveSettings}>
          <Check className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="repositories">Repositories</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="ai">AI Settings</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>
                Configure basic PR review agent behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Review PRs</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically review PRs when they are created or updated
                  </p>
                </div>
                <Switch
                  checked={settings.autoReview}
                  onCheckedChange={(checked) => handleSettingChange('autoReview', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Manual Approval</Label>
                  <p className="text-sm text-muted-foreground">
                    Always require human approval before merging
                  </p>
                </div>
                <Switch
                  checked={settings.requireManualApproval}
                  onCheckedChange={(checked) => handleSettingChange('requireManualApproval', checked)}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Concurrent Reviews</Label>
                  <Select
                    value={settings.maxConcurrentReviews.toString()}
                    onValueChange={(value) => handleSettingChange('maxConcurrentReviews', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Review Timeout (minutes)</Label>
                  <Input
                    type="number"
                    value={settings.reviewTimeout}
                    onChange={(e) => handleSettingChange('reviewTimeout', parseInt(e.target.value))}
                    min="5"
                    max="120"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="repositories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Github className="h-5 w-5" />
                GitHub Repository Connections
              </CardTitle>
              <CardDescription>
                Manage which repositories are monitored for PR reviews
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {repos.map((repo) => (
                  <div key={repo.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{repo.name}</span>
                        <Badge variant={repo.isConnected ? 'default' : 'secondary'}>
                          {repo.isConnected ? 'Connected' : 'Disconnected'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{repo.fullName}</p>
                      <p className="text-xs text-muted-foreground">Branch: {repo.branch}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {repo.isConnected && (
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </Button>
                      )}
                      <Switch
                        checked={repo.isConnected}
                        onCheckedChange={(checked) => handleRepoConnection(repo.id, checked)}
                      />
                    </div>
                  </div>
                ))}

                <Button variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Connect New Repository
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Webhook Configuration</CardTitle>
              <CardDescription>
                Configure webhooks for real-time PR notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <Input
                  placeholder="https://your-webhook-endpoint.com/github"
                  value={settings.webhookUrl}
                  onChange={(e) => handleSettingChange('webhookUrl', e.target.value)}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Add this URL to your GitHub repository webhook settings to receive real-time PR events.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure security analysis and vulnerability detection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enforce Security Checks</Label>
                  <p className="text-sm text-muted-foreground">
                    Run comprehensive security analysis on all PRs
                  </p>
                </div>
                <Switch
                  checked={settings.enforceSecurityChecks}
                  onCheckedChange={(checked) => handleSettingChange('enforceSecurityChecks', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Block Critical Issues</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically reject PRs with critical security issues
                  </p>
                </div>
                <Switch
                  checked={settings.blockCriticalIssues}
                  onCheckedChange={(checked) => handleSettingChange('blockCriticalIssues', checked)}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Minimum Security Score</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    value={settings.minimumSecurityScore}
                    onChange={(e) => handleSettingChange('minimumSecurityScore', parseInt(e.target.value))}
                    min="0"
                    max="100"
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">
                    PRs below this score will be rejected
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Custom Security Rules</Label>
                <div className="space-y-2">
                  {customRules.map((rule) => (
                    <div key={rule.id} className="flex items-center gap-2 p-2 border rounded">
                      <Input value={rule.name} className="flex-1" readOnly />
                      <Badge className={
                        rule.severity === 'critical' ? 'bg-red-600' :
                          rule.severity === 'high' ? 'bg-orange-500' :
                            'bg-yellow-500'
                      }>
                        {rule.severity}
                      </Badge>
                      <Button size="sm" variant="destructive" onClick={() => removeCustomRule(rule.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Button size="sm" variant="outline" onClick={addCustomRule}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Rule
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Code Quality Settings
              </CardTitle>
              <CardDescription>
                Set quality standards and requirements for PR approval
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Min Quality Score</Label>
                  <Input
                    type="number"
                    value={settings.minimumQualityScore}
                    onChange={(e) => handleSettingChange('minimumQualityScore', parseInt(e.target.value))}
                    min="0"
                    max="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Min Security Score</Label>
                  <Input
                    type="number"
                    value={settings.minimumSecurityScore}
                    onChange={(e) => handleSettingChange('minimumSecurityScore', parseInt(e.target.value))}
                    min="0"
                    max="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Min Performance Score</Label>
                  <Input
                    type="number"
                    value={settings.minimumPerformanceScore}
                    onChange={(e) => handleSettingChange('minimumPerformanceScore', parseInt(e.target.value))}
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enforce Code Style</Label>
                  <p className="text-sm text-muted-foreground">
                    Check code formatting and style guidelines
                  </p>
                </div>
                <Switch
                  checked={settings.enforceCodeStyle}
                  onCheckedChange={(checked) => handleSettingChange('enforceCodeStyle', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Tests</Label>
                  <p className="text-sm text-muted-foreground">
                    Ensure new code includes appropriate tests
                  </p>
                </div>
                <Switch
                  checked={settings.requireTests}
                  onCheckedChange={(checked) => handleSettingChange('requireTests', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label>Minimum Test Coverage (%)</Label>
                <Input
                  type="number"
                  value={settings.minimumCoverage}
                  onChange={(e) => handleSettingChange('minimumCoverage', parseInt(e.target.value))}
                  min="0"
                  max="100"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Model Configuration
              </CardTitle>
              <CardDescription>
                Configure the AI model settings for PR analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>AI Model</Label>
                <Select
                  value={settings.aiModel}
                  onValueChange={(value) => handleSettingChange('aiModel', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4">GPT-4 (Most Accurate)</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Faster)</SelectItem>
                    <SelectItem value="claude-3">Claude-3 (Alternative)</SelectItem>
                    <SelectItem value="gemini-pro">Gemini Pro (Google)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Confidence Threshold</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="1.0"
                  value={settings.confidenceThreshold}
                  onChange={(e) => handleSettingChange('confidenceThreshold', parseFloat(e.target.value))}
                />
                <p className="text-sm text-muted-foreground">
                  Minimum confidence level for automatic decisions (0.1 - 1.0)
                </p>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Learning</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow the AI to learn from human feedback
                  </p>
                </div>
                <Switch
                  checked={settings.enableLearning}
                  onCheckedChange={(checked) => handleSettingChange('enableLearning', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Fallback to Human</Label>
                  <p className="text-sm text-muted-foreground">
                    Escalate to human review when confidence is low
                  </p>
                </div>
                <Switch
                  checked={settings.fallbackToHuman}
                  onCheckedChange={(checked) => handleSettingChange('fallbackToHuman', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure how and when to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email updates on PR review status
                  </p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Slack Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send notifications to Slack channels
                  </p>
                </div>
                <Switch
                  checked={settings.slackNotifications}
                  onCheckedChange={(checked) => handleSettingChange('slackNotifications', checked)}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>Notification Triggers</Label>

                <div className="flex items-center justify-between">
                  <span className="text-sm">PR Approved</span>
                  <Switch
                    checked={settings.notifyOnApproval}
                    onCheckedChange={(checked) => handleSettingChange('notifyOnApproval', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">PR Rejected</span>
                  <Switch
                    checked={settings.notifyOnRejection}
                    onCheckedChange={(checked) => handleSettingChange('notifyOnRejection', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Issues Found</span>
                  <Switch
                    checked={settings.notifyOnIssues}
                    onCheckedChange={(checked) => handleSettingChange('notifyOnIssues', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
