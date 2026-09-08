'use client';
import React from 'react';
import withAuth from '@/utils/withAuth';
import {
  User,
  Mail,
  Lock,
  Bell,
  Shield,
  Key,
  Globe,
  Moon,
  Sun,
  Languages,
  CreditCard,
  LogOut
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
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const MyAccount = () => {
  const [darkMode, setDarkMode] = React.useState(false);

  // Sample user data
  const user = {
    name: 'Sarah Wilson',
    email: 'sarah.wilson@example.com',
    avatar: '/api/placeholder/32/32',
    role: 'Senior Software Engineer',
    department: 'Engineering',
    joinDate: '2023-06-15',
    timezone: 'Pacific Time (PT)',
    language: 'English',
    twoFactorEnabled: true
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <User className="h-8 w-8 text-primary" />
            My Account
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your profile, preferences, and security settings
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Profile Section */}
        <Card className="md:col-span-8 bg-card">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal information and preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>SW</AvatarFallback>
              </Avatar>
              <div>
                <Button variant="outline" className="mb-2">Change Avatar</Button>
                <p className="text-sm text-muted-foreground">
                  JPG, GIF or PNG. Max size of 2MB.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input defaultValue={user.name} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input defaultValue={user.email} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Department</label>
                <Input defaultValue={user.department} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <Input defaultValue={user.role} />
              </div>
            </div>

            <div className="flex justify-end">
              <Button className="bg-primary hover:bg-primary/90">
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preferences Section */}
        <Card className="md:col-span-4 bg-card">
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Customize your account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4" />
                <span className="text-sm font-medium">Dark Mode</span>
              </div>
              <Switch
                checked={darkMode}
                onCheckedChange={setDarkMode}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Language</label>
              <Select defaultValue="en">
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Timezone</label>
              <Select defaultValue="pt">
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt">Pacific Time</SelectItem>
                  <SelectItem value="et">Eastern Time</SelectItem>
                  <SelectItem value="utc">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card className="md:col-span-12 bg-card">
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Manage your account security and authentication methods</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-medium">Password</h3>
                    <p className="text-sm text-muted-foreground">Last changed 30 days ago</p>
                  </div>
                </div>
                <Button variant="outline">Change</Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Key className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-medium">Two-Factor Authentication</h3>
                    <p className="text-sm text-muted-foreground">Currently enabled</p>
                  </div>
                </div>
                <Switch defaultChecked={user.twoFactorEnabled} />
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-red-500">Delete Account</h3>
                <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
              </div>
              <Button variant="destructive">Delete Account</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default withAuth(MyAccount);