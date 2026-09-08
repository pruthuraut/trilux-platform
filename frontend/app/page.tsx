'use client';
import React from 'react';
import { TrendingUp, Shield, AlertTriangle, Bug, Calendar } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, Pie, PieChart, CartesianGrid, XAxis, YAxis, Label, ResponsiveContainer, Legend } from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import withAuth from '@/utils/withAuth';

// Previous data remains the same
const areaChartData = [
  { month: "January", DAST: 186, SAST: 80 },
  { month: "February", DAST: 305, SAST: 200 },
  { month: "March", DAST: 237, SAST: 120 },
  { month: "April", DAST: 73, SAST: 190 },
  { month: "May", DAST: 209, SAST: 130 },
  { month: "June", DAST: 214, SAST: 140 },
];

const pieChartData = [
  { name: "Prompt Injection", value: 275, fill: "hsl(var(--primary))" },
  { name: "Insecure Output", value: 200, fill: "hsl(0, 100.00%, 69.80%)" },
  { name: "Data Poisoning", value: 287, fill: "hsl(39, 100%, 50%)" },
  { name: "DoS Attacks", value: 173, fill: "hsl(150deg 30% 60%)" },
  { name: "Supply Chain", value: 190, fill: "hsl(var(--destructive))" },
];

const barChartData = [
  { browser: "Chrome", critical: 75, high: 120, medium: 80 },
  { browser: "Safari", critical: 50, high: 90, medium: 60 },
  { browser: "Firefox", critical: 45, high: 82, medium: 60 },
  { browser: "Edge", critical: 40, high: 78, medium: 55 },
];

const weeklyTrendData = [
  { day: "Mon", detected: 45, resolved: 38 },
  { day: "Tue", detected: 52, resolved: 43 },
  { day: "Wed", detected: 38, resolved: 35 },
  { day: "Thu", detected: 62, resolved: 51 },
  { day: "Fri", detected: 44, resolved: 42 },
];

const Dashboard = () => {
  const totalVulnerabilities = React.useMemo(() =>
    pieChartData.reduce((acc, curr) => acc + curr.value, 0),
    []);

  return (
    <div className="p-6 space-y-6 bg-background">
      {/* Header section remains the same */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Trilux Dashboard</h1>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Shield className="w-5 h-5" />
          <span>Last updated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Summary Cards section remains the same */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-card hover:bg-accent/5 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">Total Vulnerabilities</CardTitle>
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVulnerabilities}</div>
            <p className="text-xs text-muted-foreground">Across all systems</p>
          </CardContent>
        </Card>

        <Card className="bg-card hover:bg-accent/5 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">DAST Coverage</CardTitle>
            <Bug className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">86%</div>
            <p className="text-xs text-muted-foreground">Dynamic testing coverage</p>
          </CardContent>
        </Card>

        <Card className="bg-card hover:bg-accent/5 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">Risk Score</CardTitle>
            <TrendingUp className="w-4 h-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Medium</div>
            <p className="text-xs text-muted-foreground">Based on current findings</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Grid - Now 2x2 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Vulnerability Trends</CardTitle>
            <CardDescription>6-month detection history</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={areaChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="DAST" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="SAST" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(106, 99.00%, 61.80%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(106, 99.00%, 61.80%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs fill-muted-foreground" />
                <YAxis className="text-xs fill-muted-foreground" />
                <Area type="monotone" dataKey="DAST" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#DAST)" />
                <Area type="monotone" dataKey="SAST" stroke="hsl(106, 99.00%, 61.80%)" fillOpacity={1} fill="url(#SAST)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Vulnerability Distribution</CardTitle>
            <CardDescription>By type of security issue</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  className="stroke-background"
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Browser Security Analysis</CardTitle>
            <CardDescription>Vulnerability severity by browser</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="browser" className="text-xs fill-muted-foreground" />
                <YAxis className="text-xs fill-muted-foreground" />
                <Bar dataKey="critical" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} /> {/* Bright green */}
                <Bar dataKey="high" stackId="a" fill="#15803d" /> {/* Medium green */}
                <Bar dataKey="medium" stackId="a" fill="#166534" /> {/* Dark green */}
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Weekly Resolution Trends</CardTitle>
            <CardDescription>Detected vs Resolved Issues</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyTrendData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" className="text-xs fill-muted-foreground" />
                <YAxis className="text-xs fill-muted-foreground" />
                <Bar dataKey="detected" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolved" fill="hsl(146, 66.00%, 59.60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default withAuth(Dashboard);