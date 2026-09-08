'use client';
import React, { useState } from 'react';
import { Shield, Bell, AlertTriangle, CheckCircle, Clock, Filter, Search, ChevronDown, AlertOctagon, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const SecurityAlertsPage = () => {
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  type Severity = 'low' | 'medium' | 'high' | 'critical';
  type Status = 'open' | 'investigating' | 'resolved';

  interface Alerts {
    id: number;
    title: string;
    description: string;
    severity: Severity;
    timestamp: string;
    status: Status;
    source: string;
    }

  // Mock data for alerts
  const alerts: Alerts[] = [
    {
      id: 1,
      title: "Suspicious Login Activity Detected",
      description: "Multiple failed login attempts from IP 192.168.1.100",
      severity: "high",
      timestamp: "10 minutes ago",
      status: "open",
      source: "Authentication System"
    },
    {
      id: 2,
      title: "Malware Detection",
      description: "Potential malware detected in user downloads folder",
      severity: "critical",
      timestamp: "25 minutes ago",
      status: "investigating",
      source: "Endpoint Protection"
    },
    {
      id: 3,
      title: "Firewall Rule Violation",
      description: "Unauthorized port scanning detected from internal network",
      severity: "medium",
      timestamp: "1 hour ago",
      status: "resolved",
      source: "Network Security"
    },
    {
      id: 4,
      title: "SSL Certificate Expiring",
      description: "Domain certificate will expire in 7 days",
      severity: "low",
      timestamp: "2 hours ago",
      status: "open",
      source: "Certificate Monitor"
    }
  ];

  const getSeverityColor = (severity: Severity): string => {
    const colors = {
      low: "bg-blue-500/10 text-blue-500",
      medium: "bg-yellow-500/10 text-yellow-500",
      high: "bg-orange-500/10 text-orange-500",
      critical: "bg-red-500/10 text-red-500"
    };
    return colors[severity] || "bg-gray-500/10 text-gray-500";
  };

  const getStatusColor = (status: Status): string => {
    const colors = {
      open: "bg-red-500/10 text-red-500",
      investigating: "bg-blue-500/10 text-blue-500",
      resolved: "bg-green-500/10 text-green-500"
    };
    return colors[status] || "bg-gray-500/10 text-gray-500";
  };

  const getStatusIcon = (status: Status) => {
    switch (status) {
      case 'open':
        return <AlertOctagon className="h-4 w-4" />;
      case 'investigating':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Security Alerts</h1>
            <p className="text-muted-foreground">Monitor and manage security incidents</p>
          </div>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Bell className="h-4 w-4 mr-2" />
          Configure Alerts
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-muted-foreground text-sm">Critical Alerts</p>
                <p className="text-2xl font-bold text-red-500">3</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-muted-foreground text-sm">Open Alerts</p>
                <p className="text-2xl font-bold text-orange-500">7</p>
              </div>
              <AlertOctagon className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-muted-foreground text-sm">Investigating</p>
                <p className="text-2xl font-bold text-blue-500">4</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-muted-foreground text-sm">Resolved Today</p>
                <p className="text-2xl font-bold text-green-500">12</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Section */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search alerts..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="investigating">Investigating</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {alerts.map((alert) => (
          <Card key={alert.id} className="hover:bg-muted/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{alert.title}</h3>
                    <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                    <Badge variant="outline" className={getStatusColor(alert.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(alert.status)}
                        {alert.status}
                      </span>
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {alert.timestamp}
                    </span>
                    <span>Source: {alert.source}</span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>Assign</DropdownMenuItem>
                    <DropdownMenuItem>Mark as Resolved</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-500">Dismiss</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SecurityAlertsPage;