'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock,
  PlayCircle,
  PauseCircle,
  SkipForward,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Timer,
  Zap,
  Brain,
  Settings,
  Filter
} from "lucide-react";

interface QueueItem {
  id: string;
  prNumber: number;
  title: string;
  repository: string;
  author: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedTime: number; // in minutes
  queuePosition: number;
  status: 'waiting' | 'processing' | 'paused' | 'completed' | 'failed';
  progress: number;
  startedAt?: string;
  completedAt?: string;
}

const mockQueue: QueueItem[] = [
  {
    id: '1',
    prNumber: 125,
    title: 'Implement OAuth2 integration',
    repository: 'trilux-auth',
    author: 'alice.dev',
    priority: 'high',
    estimatedTime: 8,
    queuePosition: 1,
    status: 'processing',
    progress: 65,
    startedAt: '2026-02-06T12:00:00Z'
  },
  {
    id: '2',
    prNumber: 126,
    title: 'Update dependencies to latest versions',
    repository: 'trilux-core',
    author: 'bob.maintainer',
    priority: 'medium',
    estimatedTime: 5,
    queuePosition: 2,
    status: 'waiting',
    progress: 0
  },
  {
    id: '3',
    prNumber: 127,
    title: 'Critical security patch for XSS vulnerability',
    repository: 'trilux-web',
    author: 'security.team',
    priority: 'critical',
    estimatedTime: 12,
    queuePosition: 3,
    status: 'waiting',
    progress: 0
  },
  {
    id: '4',
    prNumber: 128,
    title: 'Refactor user interface components',
    repository: 'trilux-ui',
    author: 'ui.designer',
    priority: 'low',
    estimatedTime: 15,
    queuePosition: 4,
    status: 'waiting',
    progress: 0
  }
];

export default function PRReviewQueuePage() {
  const [queue, setQueue] = useState<QueueItem[]>(mockQueue);
  const [isProcessing, setIsProcessing] = useState(true);
  const [totalEstimatedTime, setTotalEstimatedTime] = useState(0);

  useEffect(() => {
    const total = queue
      .filter(item => item.status === 'waiting' || item.status === 'processing')
      .reduce((acc, item) => acc + item.estimatedTime, 0);
    setTotalEstimatedTime(total);
  }, [queue]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing': return <PlayCircle className="h-4 w-4 text-blue-500" />;
      case 'waiting': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'paused': return <PauseCircle className="h-4 w-4 text-gray-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const handlePauseQueue = () => {
    setIsProcessing(false);
    setQueue(prev => prev.map(item =>
      item.status === 'processing' ? { ...item, status: 'paused' as const } : item
    ));
  };

  const handleResumeQueue = () => {
    setIsProcessing(true);
    setQueue(prev => prev.map(item =>
      item.status === 'paused' ? { ...item, status: 'processing' as const } : item
    ));
  };

  const handleSkipCurrent = () => {
    setQueue(prev => prev.map((item, index) => {
      if (item.status === 'processing') {
        return { ...item, status: 'waiting' as const, queuePosition: prev.length + 1 };
      }
      return item;
    }));
  };

  const handlePrioritize = (id: string) => {
    setQueue(prev => {
      const itemIndex = prev.findIndex(item => item.id === id);
      if (itemIndex === -1) return prev;

      const item = prev[itemIndex];
      const newQueue = [...prev];
      newQueue.splice(itemIndex, 1);
      newQueue.unshift({ ...item, queuePosition: 1 });

      // Update positions
      return newQueue.map((item, index) => ({
        ...item,
        queuePosition: index + 1
      }));
    });
  };

  const handleRemoveFromQueue = (id: string) => {
    setQueue(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PR Review Queue</h1>
          <p className="text-muted-foreground">
            Manage and monitor the autonomous PR review pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isProcessing ? (
            <Button onClick={handlePauseQueue} variant="outline">
              <PauseCircle className="h-4 w-4 mr-2" />
              Pause Queue
            </Button>
          ) : (
            <Button onClick={handleResumeQueue}>
              <PlayCircle className="h-4 w-4 mr-2" />
              Resume Queue
            </Button>
          )}
          <Button variant="outline" onClick={handleSkipCurrent}>
            <SkipForward className="h-4 w-4 mr-2" />
            Skip Current
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Queue Settings
          </Button>
        </div>
      </div>

      {/* Queue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items in Queue</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queue.filter(item => item.status !== 'completed').length}</div>
            <p className="text-xs text-muted-foreground">
              {queue.filter(item => item.status === 'waiting').length} waiting
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Brain className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queue.filter(item => item.status === 'processing').length}</div>
            <p className="text-xs text-muted-foreground">
              Active analysis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Est. Time</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEstimatedTime}m</div>
            <p className="text-xs text-muted-foreground">
              Total remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical PRs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queue.filter(item => item.priority === 'critical').length}</div>
            <p className="text-xs text-muted-foreground">
              High priority
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Queue Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Queue Status</CardTitle>
              <CardDescription>
                {isProcessing ? 'Processing queue automatically' : 'Queue is paused'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isProcessing ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-sm font-medium">
                {isProcessing ? 'Active' : 'Paused'}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {queue.find(item => item.status === 'processing') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Currently Processing: PR #{queue.find(item => item.status === 'processing')?.prNumber}</span>
                <span>{queue.find(item => item.status === 'processing')?.progress}% complete</span>
              </div>
              <Progress value={queue.find(item => item.status === 'processing')?.progress || 0} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Queue List */}
      <Tabs defaultValue="waiting" className="space-y-4">
        <TabsList>
          <TabsTrigger value="waiting">
            Waiting ({queue.filter(item => item.status === 'waiting').length})
          </TabsTrigger>
          <TabsTrigger value="processing">
            Processing ({queue.filter(item => item.status === 'processing').length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({queue.filter(item => item.status === 'completed').length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All ({queue.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="waiting" className="space-y-4">
          {queue.filter(item => item.status === 'waiting').map((item) => (
            <QueueItemCard
              key={item.id}
              item={item}
              onPrioritize={handlePrioritize}
              onRemove={handleRemoveFromQueue}
            />
          ))}
        </TabsContent>

        <TabsContent value="processing" className="space-y-4">
          {queue.filter(item => item.status === 'processing').map((item) => (
            <QueueItemCard
              key={item.id}
              item={item}
              onPrioritize={handlePrioritize}
              onRemove={handleRemoveFromQueue}
            />
          ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {queue.filter(item => item.status === 'completed').map((item) => (
            <QueueItemCard
              key={item.id}
              item={item}
              onPrioritize={handlePrioritize}
              onRemove={handleRemoveFromQueue}
            />
          ))}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {queue.map((item) => (
            <QueueItemCard
              key={item.id}
              item={item}
              onPrioritize={handlePrioritize}
              onRemove={handleRemoveFromQueue}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function QueueItemCard({
  item,
  onPrioritize,
  onRemove
}: {
  item: QueueItem;
  onPrioritize: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing': return <PlayCircle className="h-4 w-4 text-blue-500" />;
      case 'waiting': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'paused': return <PauseCircle className="h-4 w-4 text-gray-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">#{item.prNumber}</Badge>
              <Badge className={`${getPriorityColor(item.priority)} text-white`}>
                {item.priority.toUpperCase()}
              </Badge>
              <div className="flex items-center gap-1">
                {getStatusIcon(item.status)}
                <span className="text-sm capitalize">{item.status}</span>
              </div>
              <Badge variant="secondary">Position: {item.queuePosition}</Badge>
            </div>
            <CardTitle className="text-lg">{item.title}</CardTitle>
            <CardDescription>
              {item.repository} • by {item.author} • Est. {item.estimatedTime}min
            </CardDescription>
          </div>
          <div className="flex gap-1">
            {item.status === 'waiting' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onPrioritize(item.id)}
              >
                <Zap className="h-4 w-4 mr-2" />
                Prioritize
              </Button>
            )}
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onRemove(item.id)}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Remove
            </Button>
          </div>
        </div>
      </CardHeader>
      {item.status === 'processing' && (
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Analysis Progress</span>
              <span>{item.progress}%</span>
            </div>
            <Progress value={item.progress} className="h-2" />
            <div className="text-xs text-muted-foreground">
              Started {item.startedAt ? new Date(item.startedAt).toLocaleString() : 'N/A'}
            </div>
          </div>
        </CardContent>
      )}
      {item.status === 'completed' && item.completedAt && (
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Completed {new Date(item.completedAt).toLocaleString()}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
