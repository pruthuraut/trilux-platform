'use client';
import React, { useState } from 'react';
import withAuth from '@/utils/withAuth';
import {
  Shield,
  Plus,
  Search,
  FileCheck,
  AlertTriangle,
  Clock,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  FileEdit,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const SecurityPolicies = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Sample policies data
  const policies = [
    {
      id: 1,
      title: 'Password Requirements Policy',
      description: 'Defines minimum password strength, length, and complexity requirements for all systems.',
      category: 'Access Control',
      status: 'Active',
      lastUpdated: '2026-01-28',
      priority: 'High',
      compliance: ['NIST', 'ISO 27001'],
    },
    {
      id: 2,
      title: 'Data Classification Policy',
      description: 'Guidelines for classifying and handling different types of sensitive data within the organization.',
      category: 'Data Security',
      status: 'Under Review',
      lastUpdated: '2026-02-03',
      priority: 'Medium',
      compliance: ['GDPR', 'HIPAA'],
    },
    {
      id: 3,
      title: 'Incident Response Plan',
      description: 'Procedures for detecting, reporting, and responding to security incidents and breaches.',
      category: 'Incident Management',
      status: 'Draft',
      lastUpdated: '2026-02-06',
      priority: 'High',
      compliance: ['SOC 2', 'ISO 27001'],
    },
  ];

  const getStatusColor = (status: string) => {
    const colors = {
      'Active': 'bg-green-500/10 text-green-500 dark:bg-green-500/20',
      'Under Review': 'bg-yellow-500/10 text-yellow-500 dark:bg-yellow-500/20',
      'Draft': 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/20',
      'Archived': 'bg-gray-500/10 text-gray-500 dark:bg-gray-500/20',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500/10 text-gray-500';
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'High':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'Medium':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'Low':
        return <AlertCircle className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Security Policies
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and monitor organization-wide security policies and compliance
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          New Policy
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search policies..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="review">Under Review</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="access">Access Control</SelectItem>
            <SelectItem value="data">Data Security</SelectItem>
            <SelectItem value="incident">Incident Management</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Policies Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {policies.map((policy) => (
          <Card key={policy.id} className="bg-card hover:bg-accent/5 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    {getPriorityIcon(policy.priority)}
                    {policy.title}
                  </CardTitle>
                  <CardDescription>{policy.description}</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="flex items-center gap-2">
                      <FileEdit className="h-4 w-4" />Edit Policy
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-2 text-red-500">
                      <Trash2 className="h-4 w-4" />Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className={getStatusColor(policy.status)}>
                    {policy.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Updated {new Date(policy.lastUpdated).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {policy.compliance.map((standard) => (
                    <Badge key={standard} variant="outline" className="bg-primary/5 text-primary">
                      {standard}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default withAuth(SecurityPolicies);