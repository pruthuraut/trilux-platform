'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Upload, 
  FileCheck, 
  Shield, 
  Smartphone, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  History,
  ArrowRight,
  FileArchive,
  HardDrive
} from "lucide-react";
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import withAuth from '@/utils/withAuth';
import { getAccessTokenForAPI } from '@/utils/authUtils';

interface Project {
  id: number;
  project_name: string;
  project_type: string;
}

function MobileAppTestingPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [appName, setAppName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoadingProjects(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/project/`, {
          headers: {
            'Authorization': `Bearer ${getAccessTokenForAPI()}`,
            'ngrok-skip-browser-warning': 'true',
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }
        
        const data = await response.json();
        setProjects(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError('Failed to load projects. Please refresh the page.');
      } finally {
        setIsLoadingProjects(false);
      }
    };

    fetchProjects();
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      setError(null);
      
      // Auto-fill app name from file name if empty
      if (!appName) {
        const nameWithoutExt = file.name.replace(/\.(apk|ipa)$/i, '');
        setAppName(nameWithoutExt);
      }
    }
  }, [appName]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.android.package-archive': ['.apk'],
      'application/octet-stream': ['.ipa']
    },
    multiple: false,
    maxSize: 500 * 1024 * 1024 // 500MB max
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!selectedProjectId) {
      setError('Please select a project');
      return;
    }
    if (!appName.trim()) {
      setError('Please enter an app name');
      return;
    }
    if (!selectedFile) {
      setError('Please select an APK or IPA file');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('project', selectedProjectId);
      formData.append('app_name', appName.trim());
      formData.append('app_file', selectedFile);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/mobile-app-analysis/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAccessTokenForAPI()}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: formData
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || `Upload failed: ${response.status}`);
      }

      const data = await response.json();
      setUploadProgress(100);
      setSuccess(`Analysis initiated successfully! Scan ID: ${data.data?.scan_uuid || 'N/A'}`);
      
      // Reset form
      setSelectedFile(null);
      setAppName('');
      setSelectedProjectId('');

      // Redirect to history page after a short delay
      setTimeout(() => {
        router.push('/mobile-app-testing/history');
      }, 2000);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileType = (filename: string) => {
    return filename.toLowerCase().endsWith('.apk') ? 'APK' : 'IPA';
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Smartphone className="h-7 w-7 text-primary" />
            </div>
            Mobile App Testing
          </h1>
          <p className="text-muted-foreground mt-2">
            Upload and analyze mobile applications for security vulnerabilities
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => router.push('/mobile-app-testing/history')}
          className="gap-2"
        >
          <History className="h-4 w-4" />
          View History
        </Button>
      </div>

      {/* Main Upload Card */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            New Security Analysis
          </CardTitle>
          <CardDescription>
            Upload an Android APK or iOS IPA file to perform comprehensive security analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Alerts */}
            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800 dark:text-green-300">Success</AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-400">
                  {success}
                  <span className="block mt-1 text-sm">Redirecting to history page...</span>
                </AlertDescription>
              </Alert>
            )}

            {/* Project Selection */}
            <div className="space-y-2">
              <Label htmlFor="project" className="text-sm font-medium">
                Select Project <span className="text-red-500">*</span>
              </Label>
              {isLoadingProjects ? (
                <div className="h-10 flex items-center gap-2 px-3 border rounded-md bg-muted/30">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Loading projects...</span>
                </div>
              ) : (
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger id="project">
                    <SelectValue placeholder="Choose a project for this analysis" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {project.project_type}
                          </Badge>
                          {project.project_name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* App Name */}
            <div className="space-y-2">
              <Label htmlFor="appName" className="text-sm font-medium">
                App Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="appName"
                placeholder="Enter application name"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="bg-background"
              />
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                App File <span className="text-red-500">*</span>
              </Label>
              
              {!selectedFile ? (
                <div
                  {...getRootProps()}
                  className={`
                    border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
                    ${isDragActive 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'
                    }
                  `}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 rounded-full bg-primary/10">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    {isDragActive ? (
                      <p className="text-lg font-medium text-primary">Drop the file here...</p>
                    ) : (
                      <>
                        <div>
                          <p className="text-lg font-medium">Drag & drop your app file here</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            or click to browse
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="secondary">APK</Badge>
                          <Badge variant="secondary">IPA</Badge>
                          <span>Max size: 500MB</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg p-4 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileArchive className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium truncate max-w-[300px]">{selectedFile.name}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <HardDrive className="h-3 w-3" />
                            {formatFileSize(selectedFile.size)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {getFileType(selectedFile.name)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Uploading and initiating analysis...</span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full gap-2"
              size="lg"
              disabled={isUploading || !selectedProjectId || !appName.trim() || !selectedFile}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  Start Security Analysis
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <FileCheck className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-300">Permission Analysis</h4>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  Detect dangerous permissions and potential security risks
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800 dark:text-amber-300">Vulnerability Scan</h4>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Identify security vulnerabilities and misconfigurations
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800 dark:text-green-300">Recommendations</h4>
                <p className="text-sm text-green-700 dark:text-green-400">
                  Get actionable remediation guidance for each finding
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default withAuth(MobileAppTestingPage);
