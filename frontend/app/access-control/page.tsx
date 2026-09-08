'use client';
import React, { useState } from 'react';
import withAuth from '@/utils/withAuth';
import {
  Users,
  Plus,
  Search,
  Shield,
  UserPlus,
  Key,
  Clock,
  Filter,
  CheckCircle2,
  XCircle,
  Building2,
  UserCog,
  MoreHorizontal,
  Mail,
  UserX,
  RefreshCcw
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
  DropdownMenuSeparator,
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AddUserDialog from '@/components/add-user-dialog';

const UserAccessControl = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Sample users data
  const users = [
    {
      id: 1,
      name: 'Sarah Anderson',
      email: 'sarah.anderson@company.com',
      role: 'Admin',
      department: 'Security Operations',
      status: 'Active',
      lastActive: '2026-02-05T10:30:00',
      permissions: ['Full Access', 'User Management', 'Policy Control'],
      avatar: '/sarah.jpg'
    },
    {
      id: 2,
      name: 'Michael Chen',
      email: 'michael.chen@company.com',
      role: 'Analyst',
      department: 'Risk Management',
      status: 'Pending',
      lastActive: '2026-01-31T16:45:00',
      permissions: ['View Only', 'Report Generation'],
      avatar: '/michael.jpg'
    },
    {
      id: 3,
      name: 'Elena Rodriguez',
      email: 'elena.r@company.com',
      role: 'Manager',
      department: 'Compliance',
      status: 'Active',
      lastActive: '2026-02-07T09:15:00',
      permissions: ['Policy Control', 'Team Management'],
      avatar: '/elena.jpg'
    }
  ];

  const getRoleColor = (role: string) => {
    const colors = {
      'Admin': 'bg-purple-500/10 text-purple-500 dark:bg-purple-500/20',
      'Analyst': 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/20',
      'Manager': 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-500/10 text-gray-500';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'Active': 'bg-green-500/10 text-green-500 dark:bg-green-500/20',
      'Pending': 'bg-yellow-500/10 text-yellow-500 dark:bg-yellow-500/20',
      'Suspended': 'bg-red-500/10 text-red-500 dark:bg-red-500/20'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500/10 text-gray-500';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            User Access Control
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage user permissions, roles, and access levels
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Sync Directory
          </Button>
          <Button className="bg-primary hover:bg-primary/90 gap-2" onClick={() => AddUserDialog()}>
            <UserPlus className="h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">247</div>
            <p className="text-xs text-muted-foreground">
              +12 this month
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">182</div>
            <p className="text-xs text-muted-foreground">
              Current active users
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="analyst">Analyst</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <Card key={user.id} className="bg-card hover:bg-accent/5 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      {user.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="flex items-center gap-2">
                      <UserCog className="h-4 w-4" />Manage Access
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-2">
                      <RefreshCcw className="h-4 w-4" />Reset MFA
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="flex items-center gap-2 text-red-500">
                      <UserX className="h-4 w-4" />Suspend Access
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className={getRoleColor(user.role)}>
                    {user.role}
                  </Badge>
                  <Badge variant="secondary" className={getStatusColor(user.status)}>
                    {user.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  {user.department}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {user.permissions.map((permission) => (
                    <Badge key={permission} variant="outline" className="bg-primary/5 text-primary">
                      {permission}
                    </Badge>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last active: {new Date(user.lastActive).toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default withAuth(UserAccessControl);