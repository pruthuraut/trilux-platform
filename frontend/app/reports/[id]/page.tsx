'use client';
import React, { useState, useEffect } from 'react';
import { notFound, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Heading, Paragraph } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import {
  FileText,
  ArrowLeft,
  Calendar,
  Briefcase,
  BarChart,
  ShieldAlert,
  AlertTriangle,
  CircleAlert,
  Info,
  Loader2,
  Download,
  CheckCircle2,
  Code,
  FileCode,
  Clock,
  BarChart3,
  ArrowRight
} from 'lucide-react';
import withAuth from '@/utils/withAuth';
import { getAccessTokenForAPI } from '@/utils/authUtils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Define interfaces based on the API response structure
interface Project {
  id: number;
  project_name: string;
  project_description: string;
  project_type: string;
  project_status: string;
  project_url: string;
  project_logo: string | null;
  created_at: string;
  updated_at: string;
  user_id: number;
  organization_id: number;
}

interface Finding {
  id?: string;
  title: string;
  description: string;
  severity: string;
  location: {
    file_path: string;
    line_number?: number;
  };
  recommendation: string;
  reference?: string;
}

interface ProjectSummary {
  total_issues: number;
  high_severity: number;
  medium_severity: number;
  low_severity: number;
  info: number;
  warning: number;
  status: string;
}

interface ReportMeta {
  report_generated_at: string;
  source_files_scanned: number;
  scan_notes: string[];
}

interface ReportContent {
  project_summary: ProjectSummary;
  detailed_findings: Finding[];
  meta: ReportMeta;
}

interface ReportData {
  id: number;
  report_url: string;
  created_at: string;
  updated_at: string;
  user_id: number;
  organization_id: number;
  report_content: ReportContent;
  project: Project;
}

interface ReportDetailPageProps {
  params: {
    id: string;
  };
}

const ReportDetailPage: React.FC<ReportDetailPageProps> = ({ params }) => {
  const router = useRouter();
  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // The params.id is now scan_uuid
  const scanUuid = params.id;

  // Detect theme from document class
  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setTheme(isDarkMode ? 'dark' : 'light');

    // Optional: Listen for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDarkMode = document.documentElement.classList.contains('dark');
          setTheme(isDarkMode ? 'dark' : 'light');
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchReport = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/report/${scanUuid}/`, {
          headers: {
            'Authorization': `Bearer ${getAccessTokenForAPI()}`,
            'ngrok-skip-browser-warning': 'true',
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            notFound();
          }
          throw new Error(`Failed to fetch report: ${response.status}`);
        }

        const data = await response.json();
        setReport(data);
      } catch (err) {
        console.error('Error fetching report:', err);
        setError('Failed to load report data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [scanUuid]);

  const generatePdf = async () => {
    if (!report) return;

    setIsPdfGenerating(true);

    try {
      // Create a new PDF document
      const doc = new jsPDF();
      const { project, report_content: { project_summary, detailed_findings, meta } } = report;
      const isDarkMode = theme === 'dark';

      // Define theme colors
      const colors = {
        background: isDarkMode ? '#1e1e2e' : '#ffffff',
        text: isDarkMode ? '#ffffff' : '#18181b', // Enhanced contrast for dark mode
        muted: isDarkMode ? '#a1a1aa' : '#71717a',
        primary: '#3B82F6', // Primary blue color
        divider: isDarkMode ? '#3f3f46' : '#e2e8f0',
        header: isDarkMode ? '#27272a' : '#f8fafc',
        // Severity colors - kept consistent for both themes
        high: '#ef4444',
        medium: '#f59e0b',
        low: '#3b82f6',
        info: '#6b7280',
        success: '#10b981'
      };

      // Apply background to current page
      if (isDarkMode) {
        doc.setFillColor(colors.background);
        doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), "F");
      }

      // Function to add a new page with proper background
      const addNewPageWithBackground = () => {
        doc.addPage();
        if (isDarkMode) {
          doc.setFillColor(colors.background);
          doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), "F");
        }
      };

      // Add header with logo
      doc.setFillColor(colors.header);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 40, 'F');

      // Title
      doc.setFontSize(24);
      doc.setTextColor(colors.primary);
      doc.text('TRILUX SECURITY REPORT', 105, 15, { align: 'center' });

      // Subtitle
      doc.setFontSize(18);
      doc.setTextColor(colors.text);
      doc.text(`${project.project_name}`, 105, 25, { align: 'center' });

      // Project information section
      doc.setFontSize(16);
      doc.setTextColor(colors.primary);
      doc.text('Project Overview', 14, 50);
      doc.setDrawColor(colors.primary);
      doc.line(14, 52, 196, 52);

      doc.setFontSize(11);
      doc.setTextColor(colors.text);
      doc.text(`Project Name: ${project.project_name}`, 14, 60);
      doc.text(`Project Type: ${project.project_type}`, 14, 67);
      doc.text(`Project URL: ${project.project_url}`, 14, 74);
      doc.text(`Project Status: ${project.project_status}`, 14, 81);
      doc.text(`Description: ${project.project_description || 'N/A'}`, 14, 88);

      // Summary section
      doc.setFontSize(16);
      doc.setTextColor(colors.primary);
      doc.text('Security Summary', 14, 105);
      doc.line(14, 107, 196, 107);

      doc.setFontSize(11);
      doc.setTextColor(colors.text);
      doc.text(`Total Issues: ${project_summary.total_issues}`, 14, 115);
      doc.text(`High Severity: ${project_summary.high_severity}`, 14, 122);
      doc.text(`Medium Severity: ${project_summary.medium_severity}`, 14, 129);
      doc.text(`Low Severity: ${project_summary.low_severity}`, 14, 136);
      doc.text(`Info: ${project_summary.info}`, 14, 143);
      doc.text(`Status: ${project_summary.status}`, 14, 150);

      // Simple bar chart for severity distribution
      const chartStartY = 160;
      const chartWidth = 150;
      const barHeight = 8;
      const gap = 16;
      const totalIssues = project_summary.total_issues || 1; // Avoid division by zero

      // Define chart background for better contrast
      if (isDarkMode) {
        doc.setFillColor('#2a2a3a');
        doc.rect(35, chartStartY, chartWidth, barHeight * 4 + gap * 3, 'F');
      }

      // High severity bar
      doc.setDrawColor(colors.high);
      doc.setFillColor(colors.high);
      const highWidth = (project_summary.high_severity / totalIssues) * chartWidth;
      doc.rect(35, chartStartY, highWidth > 0 ? highWidth : 1, barHeight, 'F');
      doc.setTextColor(colors.text);
      doc.text('High', 14, chartStartY + 6);
      doc.setTextColor(colors.text);
      doc.text(`${project_summary.high_severity}`, 35 + chartWidth + 5, chartStartY + 6);

      // Medium severity bar
      doc.setDrawColor(colors.medium);
      doc.setFillColor(colors.medium);
      const mediumWidth = (project_summary.medium_severity / totalIssues) * chartWidth;
      doc.rect(35, chartStartY + gap, mediumWidth > 0 ? mediumWidth : 1, barHeight, 'F');
      doc.setTextColor(colors.text);
      doc.text('Medium', 14, chartStartY + gap + 6);
      doc.setTextColor(colors.text);
      doc.text(`${project_summary.medium_severity}`, 35 + chartWidth + 5, chartStartY + gap + 6);

      // Low severity bar
      doc.setDrawColor(colors.low);
      doc.setFillColor(colors.low);
      const lowWidth = (project_summary.low_severity / totalIssues) * chartWidth;
      doc.rect(35, chartStartY + gap * 2, lowWidth > 0 ? lowWidth : 1, barHeight, 'F');
      doc.setTextColor(colors.text);
      doc.text('Low', 14, chartStartY + gap * 2 + 6);
      doc.setTextColor(colors.text);
      doc.text(`${project_summary.low_severity}`, 35 + chartWidth + 5, chartStartY + gap * 2 + 6);

      // Info bar
      doc.setDrawColor(colors.info);
      doc.setFillColor(colors.info);
      const infoWidth = (project_summary.info / totalIssues) * chartWidth;
      doc.rect(35, chartStartY + gap * 3, infoWidth > 0 ? infoWidth : 1, barHeight, 'F');
      doc.setTextColor(colors.text);
      doc.text('Info', 14, chartStartY + gap * 3 + 6);
      doc.setTextColor(colors.text);
      doc.text(`${project_summary.info}`, 35 + chartWidth + 5, chartStartY + gap * 3 + 6);

      // Add page for detailed findings
      addNewPageWithBackground();

      // Detailed findings section
      doc.setFontSize(16);
      doc.setTextColor(colors.primary);
      doc.text('Detailed Findings', 14, 20);
      doc.line(14, 22, 196, 22);

      if (detailed_findings.length === 0) {
        doc.setFontSize(11);
        doc.setTextColor(colors.text);
        doc.text('No vulnerabilities were found in this scan.', 14, 30);

        // Add success icon or indicator
        doc.setFillColor(colors.success);
        doc.circle(105, 50, 10, 'F');
        doc.setTextColor(isDarkMode ? colors.background : '#ffffff');
        doc.setFontSize(14);
        doc.text('✓', 103, 54);

        doc.setTextColor(colors.success);
        doc.setFontSize(14);
        doc.text('Secure - No Issues Found', 105, 75, { align: 'center' });
      } else {
        let yPosition = 30;

        // For each finding, create a section
        detailed_findings.forEach((finding, index) => {
          // Add a new page if there's not enough space
          if (yPosition > 250) {
            addNewPageWithBackground();
            yPosition = 20;
          }

          // Finding header - create a visual box for each finding
          if (isDarkMode) {
            doc.setFillColor(colors.header);
            doc.roundedRect(14, yPosition, 182, 12, 1, 1, 'F');
          } else {
            doc.setFillColor(finding.severity.toLowerCase() === 'high'
              ? '#fff1f2' : finding.severity.toLowerCase() === 'medium'
                ? '#fff7ed' : '#eff6ff');
            doc.roundedRect(14, yPosition, 182, 12, 1, 1, 'F');
          }

          // Badge for severity
          const findingColor = finding.severity.toLowerCase() === 'high'
            ? colors.high : finding.severity.toLowerCase() === 'medium'
              ? colors.medium : colors.low;

          doc.setFillColor(findingColor);
          doc.circle(20, yPosition + 6, 4, 'F');

          doc.setFontSize(13);
          doc.setTextColor(colors.text);
          doc.text(`${index + 1}. ${finding.title}`, 28, yPosition + 8);

          // Severity badge
          const severityText = finding.severity.toUpperCase();
          const textWidth = doc.getStringUnitWidth(severityText) * 5;

          if (isDarkMode) {
            doc.setFillColor(findingColor);
            doc.roundedRect(170 - textWidth, yPosition + 3, textWidth + 10, 6, 1, 1, 'F');
            doc.setTextColor('#ffffff');
            doc.setFontSize(8);
            doc.text(severityText, 175 - textWidth, yPosition + 7);
          } else {
            doc.setFillColor(findingColor + '30'); // Add transparency
            doc.roundedRect(170 - textWidth, yPosition + 3, textWidth + 10, 6, 1, 1, 'F');
            doc.setTextColor(findingColor);
            doc.setFontSize(8);
            doc.text(severityText, 175 - textWidth, yPosition + 7);
          }

          yPosition += 15;

          // Finding ID if available
          if (finding.id) {
            doc.setFontSize(10);
            doc.setTextColor(colors.muted);
            doc.text(`ID: ${finding.id}`, 14, yPosition);
            yPosition += 7;
          }

          // Location
          if (finding.location) {
            doc.setFontSize(10);
            doc.setTextColor(colors.muted);
            doc.text(`Location: ${finding.location.file_path}${finding.location.line_number ? `:${finding.location.line_number}` : ''
              }`, 14, yPosition);
            yPosition += 10;
          }

          // Description
          doc.setFontSize(11);
          doc.setTextColor(colors.primary);
          doc.text('Description:', 14, yPosition);
          yPosition += 7;

          // Handle text wrapping for description
          const splitDescription = doc.splitTextToSize(finding.description, 180);
          doc.setFontSize(10);
          doc.setTextColor(colors.text);
          doc.text(splitDescription, 14, yPosition);
          yPosition += splitDescription.length * 5 + 8;

          // Recommendation
          doc.setFontSize(11);
          doc.setTextColor(colors.primary);
          doc.text('Recommendation:', 14, yPosition);
          yPosition += 7;

          // Handle text wrapping for recommendation
          const splitRecommendation = doc.splitTextToSize(finding.recommendation, 180);
          doc.setFontSize(10);
          doc.setTextColor(colors.text);
          doc.text(splitRecommendation, 14, yPosition);
          yPosition += splitRecommendation.length * 5 + 8;

          // Reference if available
          if (finding.reference) {
            doc.setFontSize(11);
            doc.setTextColor(colors.primary);
            doc.text('Reference:', 14, yPosition);
            yPosition += 7;

            const splitReference = doc.splitTextToSize(finding.reference, 180);
            doc.setFontSize(10);
            doc.setTextColor(colors.text);
            doc.text(splitReference, 14, yPosition);
            yPosition += splitReference.length * 5 + 8;
          }

          // Add separation between findings
          doc.setDrawColor(colors.divider);
          doc.line(14, yPosition, 196, yPosition);
          yPosition += 10;
        });
      }

      // Add notes page if there are any
      if (meta.scan_notes && meta.scan_notes.length > 0) {
        addNewPageWithBackground();

        // Notes section
        doc.setFontSize(16);
        doc.setTextColor(colors.primary);
        doc.text('Scan Notes', 14, 20);
        doc.line(14, 22, 196, 22);

        let yPosition = 30;

        meta.scan_notes.forEach((note, index) => {
          // Add a new page if there's not enough space
          if (yPosition > 250) {
            addNewPageWithBackground();
            yPosition = 20;
          }

          // Note item with bullet point
          doc.setFontSize(11);
          doc.setTextColor(colors.text);

          // Create bullet point
          doc.setFillColor(colors.primary);
          doc.circle(15, yPosition + 2, 1.5, 'F');

          // Handle text wrapping for note
          const splitNote = doc.splitTextToSize(note, 175);
          doc.text(splitNote, 20, yPosition);
          yPosition += splitNote.length * 5 + 8;
        });
      }

      // Final page with metadata
      addNewPageWithBackground();

      doc.setFontSize(16);
      doc.setTextColor(colors.primary);
      doc.text('Report Information', 14, 20);
      doc.line(14, 22, 196, 22);

      doc.setFontSize(11);
      doc.setTextColor(colors.text);
      doc.text(`Generated On: ${new Date(meta.report_generated_at).toLocaleString()}`, 14, 30);
      doc.text(`Files Scanned: ${meta.source_files_scanned}`, 14, 37);
      doc.text(`Report ID: ${report.id}`, 14, 44);

      // Status badge
      const statusColor = project_summary.status === 'Secure' ? colors.success : colors.high;
      doc.setFontSize(14);
      doc.setTextColor(statusColor);
      doc.text(`Status: ${project_summary.status}`, 14, 60);

      // Add footer with page numbers
      const pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(colors.muted);
        doc.text(`Page ${i} of ${pageCount}`, 105, 287, { align: 'center' });

        // Add logo text at the bottom
        doc.setFontSize(8);
        doc.setTextColor(colors.muted);
        doc.text('Generated with Trilux Security Platform', 105, 295, { align: 'center' });

        // Add company logo
        doc.setFillColor(colors.primary);
        doc.circle(14, 290, 3, 'F');
        doc.setFontSize(6);
        doc.setTextColor(isDarkMode ? colors.background : '#ffffff');
        doc.text('O', 12.7, 292);
      }

      // Save the PDF
      const fileName = `${project.project_name.replace(/\s+/g, '_')}_SecurityReport_${new Date().toISOString().split('T')[0]
        }.pdf`;

      doc.save(fileName);

    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsPdfGenerating(false);
    }
  };
  // Helper functions for UI elements
  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return <CircleAlert className="h-5 w-5 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'low':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityClass = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
          <p className="mt-4 text-lg font-medium">Loading report data...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'Failed to load report'}</AlertDescription>
        </Alert>
        <Button asChild>
          <Link href="/reports">Return to Reports</Link>
        </Button>
      </div>
    );
  }

  const { project_summary, detailed_findings, meta } = report.report_content;

  // Ensure meta object exists and has default values to prevent TypeErrors
  const safeMetaData = {
    report_generated_at: meta?.report_generated_at || new Date().toISOString(),
    source_files_scanned: meta?.source_files_scanned || 0,
    scan_notes: meta?.scan_notes || []
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header with Gradient */}
        <div className="relative mb-8 p-8 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-background border border-primary/20 backdrop-blur-sm overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/reports')}
            className="absolute top-6 left-6 z-10 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90 shadow-md transition-all duration-200 cursor-pointer"
            aria-label="Go back to reports"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="relative z-10 text-center pt-6">
            {/* Icon with Gradient Background */}
            <div className="inline-flex items-center justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/60 rounded-2xl blur-lg opacity-30 animate-pulse"></div>
                <div className="relative p-4 bg-gradient-to-r from-primary to-primary/80 rounded-2xl text-primary-foreground shadow-lg">
                  <ShieldAlert className="h-8 w-8" />
                </div>
              </div>
            </div>

            {/* Title with Gradient Text */}
            <Heading size={1} className="text-4xl font-bold mb-4 bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
              {report.project.project_name} Security Report
            </Heading>

            {/* Enhanced Metadata */}
            <div className="flex flex-wrap justify-center gap-6 mt-6">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/60 backdrop-blur-sm border border-primary/10">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  {new Date(report.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/60 backdrop-blur-sm border border-primary/10">
                <Briefcase className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{report.project.project_type}</span>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/60 backdrop-blur-sm border border-primary/10">
                <FileCode className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{safeMetaData.source_files_scanned} Files Scanned</span>
              </div>

              <Badge
                className={`px-4 py-2 text-sm font-medium ${project_summary.status === 'Secure'
                  ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
                  : 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
                  }`}
              >
                <div className={`w-2 h-2 rounded-full mr-2 ${project_summary.status === 'Secure' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                {project_summary.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Enhanced Content Card */}
        <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-0">
            <Tabs defaultValue="summary" className="w-full">
              <div className="px-8 py-6 bg-gradient-to-r from-muted/30 to-muted/10 border-b">
                <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 bg-background/60 backdrop-blur-sm">
                  <TabsTrigger value="summary" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <BarChart className="h-4 w-4 mr-2" />
                    Summary
                  </TabsTrigger>
                  <TabsTrigger value="findings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Findings
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Code className="h-4 w-4 mr-2" />
                    Notes
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-8">
                <TabsContent value="summary" className="mt-0">
                  <div className="space-y-8">
                    {/* Project Info Card */}
                    <Card className="border-0 bg-gradient-to-br from-card to-card/50 shadow-lg hover:shadow-xl transition-all duration-300">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Briefcase className="h-5 w-5 text-primary" />
                          </div>
                          <h2 className="text-xl font-semibold">Project Information</h2>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Project Name</p>
                            <p className="font-semibold text-lg">{report.project.project_name}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Project Type</p>
                            <Badge variant="secondary" className="font-medium">
                              {report.project.project_type}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Project URL</p>
                            <a
                              href={report.project.project_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-medium text-primary hover:text-primary/80 transition-colors hover:underline"
                            >
                              {report.project.project_url}
                              <ArrowRight className="h-3 w-3" />
                            </a>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Status</p>
                            <Badge
                              variant={report.project.project_status === 'Active' ? 'default' : 'secondary'}
                              className="font-medium"
                            >
                              {report.project.project_status}
                            </Badge>
                          </div>
                        </div>
                        {report.project.project_description && (
                          <div className="mt-6 pt-6 border-t">
                            <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                            <p className="text-muted-foreground leading-relaxed">{report.project.project_description}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Enhanced Severity Distribution */}
                    <Card className="border-0 bg-gradient-to-br from-card to-card/50 shadow-lg hover:shadow-xl transition-all duration-300">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <BarChart3 className="h-5 w-5 text-primary" />
                            </div>
                            <h2 className="text-xl font-semibold">Security Analysis</h2>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">{project_summary.total_issues}</p>
                            <p className="text-sm text-muted-foreground">Total Issues</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {/* High Severity */}
                          <div className="group">
                            <div className="flex justify-between items-center mb-3">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                                  <CircleAlert className="h-5 w-5 text-red-500" />
                                </div>
                                <div>
                                  <span className="font-medium">High Severity</span>
                                  <p className="text-xs text-muted-foreground">Critical security issues</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-2xl font-bold text-red-500">{project_summary.high_severity}</span>
                                <p className="text-xs text-muted-foreground">
                                  {project_summary.total_issues > 0 &&
                                    `${Math.round((project_summary.high_severity / project_summary.total_issues) * 100)}%`
                                  }
                                </p>
                              </div>
                            </div>
                            <Progress
                              value={project_summary.total_issues > 0 ? (project_summary.high_severity / project_summary.total_issues) * 100 : 0}
                              className="h-3 bg-red-100 dark:bg-red-900/20"
                              indicatorClassName="bg-gradient-to-r from-red-500 to-red-600"
                            />
                          </div>

                          {/* Medium Severity */}
                          <div className="group">
                            <div className="flex justify-between items-center mb-3">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                                </div>
                                <div>
                                  <span className="font-medium">Medium Severity</span>
                                  <p className="text-xs text-muted-foreground">Moderate security concerns</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-2xl font-bold text-amber-500">{project_summary.medium_severity}</span>
                                <p className="text-xs text-muted-foreground">
                                  {project_summary.total_issues > 0 &&
                                    `${Math.round((project_summary.medium_severity / project_summary.total_issues) * 100)}%`
                                  }
                                </p>
                              </div>
                            </div>
                            <Progress
                              value={project_summary.total_issues > 0 ? (project_summary.medium_severity / project_summary.total_issues) * 100 : 0}
                              className="h-3 bg-amber-100 dark:bg-amber-900/20"
                              indicatorClassName="bg-gradient-to-r from-amber-500 to-amber-600"
                            />
                          </div>

                          {/* Low Severity */}
                          <div className="group">
                            <div className="flex justify-between items-center mb-3">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                  <Info className="h-5 w-5 text-blue-500" />
                                </div>
                                <div>
                                  <span className="font-medium">Low Severity</span>
                                  <p className="text-xs text-muted-foreground">Minor security improvements</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-2xl font-bold text-blue-500">{project_summary.low_severity}</span>
                                <p className="text-xs text-muted-foreground">
                                  {project_summary.total_issues > 0 &&
                                    `${Math.round((project_summary.low_severity / project_summary.total_issues) * 100)}%`
                                  }
                                </p>
                              </div>
                            </div>
                            <Progress
                              value={project_summary.total_issues > 0 ? (project_summary.low_severity / project_summary.total_issues) * 100 : 0}
                              className="h-3 bg-blue-100 dark:bg-blue-900/20"
                              indicatorClassName="bg-gradient-to-r from-blue-500 to-blue-600"
                            />
                          </div>

                          {/* Info */}
                          <div className="group">
                            <div className="flex justify-between items-center mb-3">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                                  <Info className="h-5 w-5 text-gray-500" />
                                </div>
                                <div>
                                  <span className="font-medium">Informational</span>
                                  <p className="text-xs text-muted-foreground">Best practice recommendations</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-2xl font-bold text-gray-500">{project_summary.info}</span>
                                <p className="text-xs text-muted-foreground">
                                  {project_summary.total_issues > 0 &&
                                    `${Math.round((project_summary.info / project_summary.total_issues) * 100)}%`
                                  }
                                </p>
                              </div>
                            </div>
                            <Progress
                              value={project_summary.total_issues > 0 ? (project_summary.info / project_summary.total_issues) * 100 : 0}
                              className="h-3 bg-gray-100 dark:bg-gray-800"
                              indicatorClassName="bg-gradient-to-r from-gray-500 to-gray-600"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Report Meta Information */}
                    <Card className="border-0 bg-gradient-to-br from-card to-card/50 shadow-lg hover:shadow-xl transition-all duration-300">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <h2 className="text-xl font-semibold">Report Details</h2>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
                            <Clock className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Report Generated</p>
                              <p className="font-semibold">
                                {new Date(report.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
                            <FileCode className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Files Analyzed</p>
                              <p className="font-semibold">{safeMetaData.source_files_scanned} files</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="findings" className="mt-0">
                  <div className="space-y-6">
                    {detailed_findings.length === 0 ? (
                      <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/30 shadow-lg">
                        <CardContent className="p-12 text-center">
                          <div className="relative">
                            <div className="absolute inset-0 bg-green-500/20 rounded-full animate-pulse"></div>
                            <CheckCircle2 className="relative h-16 w-16 mx-auto text-green-500 mb-6" />
                          </div>
                          <h3 className="text-2xl font-semibold text-green-700 dark:text-green-300 mb-3">
                            Excellent Security Posture
                          </h3>
                          <p className="text-green-600 dark:text-green-400 text-lg mb-4">
                            No security vulnerabilities were detected in this analysis.
                          </p>
                          <p className="text-muted-foreground">
                            Your project follows security best practices and maintains a strong security foundation.
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      detailed_findings.map((finding, index) => (
                        <Card key={finding.id || index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                          <div className={`h-1 ${finding.severity.toLowerCase() === 'high' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                            finding.severity.toLowerCase() === 'medium' ? 'bg-gradient-to-r from-amber-500 to-amber-600' :
                              'bg-gradient-to-r from-blue-500 to-blue-600'
                            }`}></div>

                          <CardHeader className={`${getSeverityClass(finding.severity)} border-b-0`}>
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0">
                                {getSeverityIcon(finding.severity)}
                              </div>
                              <div className="flex-grow min-w-0">
                                <div className="flex items-start justify-between gap-4 mb-2">
                                  <h3 className="text-lg font-semibold leading-tight">{finding.title}</h3>
                                  <div className="flex gap-2 flex-shrink-0">
                                    <Badge
                                      variant="outline"
                                      className={`${getSeverityClass(finding.severity)} font-medium`}
                                    >
                                      {finding.severity}
                                    </Badge>
                                    {finding.id && (
                                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 font-mono text-xs">
                                        {finding.id}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {finding.location && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Code className="h-4 w-4" />
                                    <span className="font-mono bg-muted/50 px-2 py-1 rounded text-xs">
                                      {finding.location.file_path}
                                      {finding.location.line_number && `:${finding.location.line_number}`}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="pt-6 space-y-6">
                            <div>
                              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <Info className="h-4 w-4 text-primary" />
                                Description
                              </h4>
                              <p className="text-muted-foreground leading-relaxed bg-muted/30 p-4 rounded-lg">
                                {finding.description}
                              </p>
                            </div>

                            <div>
                              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                Recommendation
                              </h4>
                              <p className="text-muted-foreground leading-relaxed bg-green-50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
                                {finding.recommendation}
                              </p>
                            </div>

                            {finding.reference && (
                              <div>
                                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-blue-500" />
                                  Reference
                                </h4>
                                <p className="text-muted-foreground leading-relaxed bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                  {finding.reference}
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="mt-0">
                  <Card className="border-0 bg-gradient-to-br from-card to-card/50 shadow-lg">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Code className="h-5 w-5 text-primary" />
                        </div>
                        <h2 className="text-xl font-semibold">Scan Notes & Information</h2>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {safeMetaData.scan_notes.length === 0 ? (
                        <div className="text-center py-8">
                          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No additional notes were generated for this security scan.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {safeMetaData.scan_notes.map((note, index) => (
                            <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 hover:bg-muted/40 transition-colors">
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                                <span className="text-xs font-medium text-primary">{index + 1}</span>
                              </div>
                              <p className="text-muted-foreground leading-relaxed">{note}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>

          {/* Enhanced Footer */}
          <CardFooter className="bg-gradient-to-r from-muted/20 to-muted/10 border-t px-8 py-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4 w-full">
              <Link href="/reports">
                <Button variant="outline" className="flex items-center gap-2 hover:bg-background/80 transition-all duration-200">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Reports
                </Button>
              </Link>

              <Button
                variant="default"
                className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-md hover:shadow-lg transition-all duration-200"
                onClick={generatePdf}
                disabled={isPdfGenerating}
              >
                {isPdfGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF Report
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default withAuth(ReportDetailPage);