'use client';
import React, { useState } from 'react';
import withAuth from '@/utils/withAuth';
import {
  LifeBuoy,
  Search,
  MessageCircle,
  FileQuestion,
  ExternalLink,
  BookOpen,
  Mail,
  Phone,
  Video,
  ChevronRight,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

const SupportPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');

  // Sample support tickets
  const tickets = [
    {
      id: 'TIC-1234',
      title: 'Cannot access development environment',
      status: 'Open',
      priority: 'High',
      category: 'Technical',
      lastUpdate: '2026-02-07T10:30:00',
      messages: 3,
    },
    {
      id: 'TIC-1235',
      title: 'Need help with API integration',
      status: 'In Progress',
      priority: 'Medium',
      category: 'Development',
      lastUpdate: '2026-02-05T09:15:00',
      messages: 5,
    },
    {
      id: 'TIC-1236',
      title: 'Account billing issue',
      status: 'Resolved',
      priority: 'Low',
      category: 'Billing',
      lastUpdate: '2026-01-30T16:45:00',
      messages: 4,
    },
  ];

  // Sample FAQ categories
  const faqCategories = [
    {
      title: 'Getting Started',
      icon: <BookOpen className="h-5 w-5" />,
      articles: 12,
    },
    {
      title: 'Account & Billing',
      icon: <Mail className="h-5 w-5" />,
      articles: 8,
    },
    {
      title: 'Technical Issues',
      icon: <FileQuestion className="h-5 w-5" />,
      articles: 15,
    },
    {
      title: 'API Documentation',
      icon: <MessageCircle className="h-5 w-5" />,
      articles: 10,
    },
  ];

  const getStatusColor = (status: string) => {
    const colors = {
      'Open': 'bg-blue-500/10 text-blue-500',
      'In Progress': 'bg-yellow-500/10 text-yellow-500',
      'Resolved': 'bg-green-500/10 text-green-500',
      'Closed': 'bg-gray-500/10 text-gray-500',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500/10 text-gray-500';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <LifeBuoy className="h-8 w-8 text-primary" />
            Support Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Get help with your issues and find answers to common questions
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <MessageSquare className="h-4 w-4 mr-2" />
          New Ticket
        </Button>
      </div>

      {/* Search and Quick Actions */}
      <Card className="bg-card">
        <CardContent className="pt-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for help articles or tickets..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              <span>Schedule a Call</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <span>Email Support</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              <span>Live Chat</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="tickets" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tickets">My Tickets</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
        </TabsList>

        {/* Tickets Tab */}
        <TabsContent value="tickets" className="space-y-6">
          <div className="flex gap-4">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="development">Development</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {tickets.map((ticket) => (
              <Card key={ticket.id} className="bg-card hover:bg-accent/5 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{ticket.id}</span>
                        <Badge variant="secondary" className={getStatusColor(ticket.status)}>
                          {ticket.status}
                        </Badge>
                      </div>
                      <h3 className="font-semibold">{ticket.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(ticket.lastUpdate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {ticket.messages} messages
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Knowledge Base Tab */}
        <TabsContent value="knowledge" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {faqCategories.map((category) => (
              <Card key={category.title} className="bg-card hover:bg-accent/5 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {category.icon}
                    {category.title}
                  </CardTitle>
                  <CardDescription>
                    {category.articles} articles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" className="w-full justify-between">
                    Browse Articles
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default withAuth(SupportPage);