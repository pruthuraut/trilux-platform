'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GitPullRequest,
  Brain,
  Shield,
  Zap,
  CheckCircle,
  AlertTriangle,
  Clock,
  Target,
  Users,
  TrendingUp,
  Github,
  Settings,
  Eye,
  Activity
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description: "Advanced AI models analyze code changes, intent, and potential issues automatically",
    benefits: ["Intent recognition", "Code quality assessment", "Security vulnerability detection"]
  },
  {
    icon: Shield,
    title: "Security-First Approach",
    description: "Comprehensive security analysis with real-time threat detection",
    benefits: ["SQL injection detection", "XSS vulnerability scanning", "Hardcoded secrets identification"]
  },
  {
    icon: Zap,
    title: "Real-Time Processing",
    description: "Instant PR analysis with automatic queue management and prioritization",
    benefits: ["Sub-minute analysis", "Priority-based queue", "Parallel processing"]
  },
  {
    icon: Target,
    title: "Quality Enforcement",
    description: "Automated code quality checks with customizable standards",
    benefits: ["Code style enforcement", "Test coverage validation", "Performance optimization"]
  },
  {
    icon: Github,
    title: "GitHub Integration",
    description: "Seamless integration with GitHub repositories and workflows",
    benefits: ["Webhook automation", "Branch protection", "Status checks"]
  },
  {
    icon: TrendingUp,
    title: "Analytics & Insights",
    description: "Comprehensive analytics to track team performance and code quality trends",
    benefits: ["Performance metrics", "Quality trends", "Team insights"]
  }
];

const workflowSteps = [
  {
    step: 1,
    title: "PR Created",
    description: "Developer creates or updates a pull request",
    icon: GitPullRequest,
    color: "bg-blue-500"
  },
  {
    step: 2,
    title: "Automatic Detection",
    description: "System detects PR via webhook and adds to analysis queue",
    icon: Eye,
    color: "bg-purple-500"
  },
  {
    step: 3,
    title: "AI Analysis",
    description: "AI agent analyzes code changes, intent, and potential issues",
    icon: Brain,
    color: "bg-green-500"
  },
  {
    step: 4,
    title: "Security Scan",
    description: "Comprehensive security vulnerability assessment",
    icon: Shield,
    color: "bg-red-500"
  },
  {
    step: 5,
    title: "Decision Engine",
    description: "AI determines if PR meets requirements for merge approval",
    icon: CheckCircle,
    color: "bg-emerald-500"
  },
  {
    step: 6,
    title: "Action & Feedback",
    description: "System approves, rejects, or suggests improvements with detailed feedback",
    icon: Activity,
    color: "bg-orange-500"
  }
];

export default function PRReviewOverview() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold tracking-tight">Autonomous PR Review Agent</h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Advanced AI-powered pull request analysis that automatically reviews code changes, 
          identifies security vulnerabilities, ensures quality standards, and provides intelligent 
          feedback to development teams.
        </p>
        <div className="flex justify-center gap-4 mt-6">
          <Button size="lg">
            <Github className="h-5 w-5 mr-2" />
            Connect Repository
          </Button>
          <Button size="lg" variant="outline">
            <Settings className="h-5 w-5 mr-2" />
            Configure Settings
          </Button>
        </div>
      </div>

      {/* Key Features */}
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold">Key Features</h3>
          <p className="text-muted-foreground">Comprehensive PR analysis and automated decision making</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <feature.icon className="h-8 w-8 text-primary" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Workflow */}
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold">How It Works</h3>
          <p className="text-muted-foreground">Autonomous workflow from PR creation to merge decision</p>
        </div>

        <div className="relative">
          {/* Timeline */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>
          
          <div className="space-y-8">
            {workflowSteps.map((step, index) => (
              <div key={index} className="relative flex items-start gap-6">
                {/* Step Icon */}
                <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${step.color} text-white`}>
                  <step.icon className="h-4 w-4" />
                </div>
                
                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h4 className="text-lg font-semibold">{step.title}</h4>
                    <Badge variant="outline">Step {step.step}</Badge>
                  </div>
                  <p className="text-muted-foreground mt-1">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="text-center">
          <CardHeader>
            <Clock className="h-12 w-12 mx-auto text-blue-500" />
            <CardTitle>Save Time</CardTitle>
            <CardDescription>
              Reduce manual review time by up to 80% with automated analysis
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <Shield className="h-12 w-12 mx-auto text-green-500" />
            <CardTitle>Improve Security</CardTitle>
            <CardDescription>
              Catch security vulnerabilities before they reach production
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <TrendingUp className="h-12 w-12 mx-auto text-purple-500" />
            <CardTitle>Enhance Quality</CardTitle>
            <CardDescription>
              Maintain consistent code quality standards across all projects
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* CTA Section */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to Transform Your PR Review Process?</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Start using our autonomous PR review agent today and experience faster, 
            more secure, and higher quality code reviews.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg">
              Get Started Now
            </Button>
            <Button size="lg" variant="outline">
              Schedule Demo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
