"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { getAccessTokenForAPI } from "@/utils/authUtils"
import { Loader2, Play, X } from "lucide-react"

// Project type definition
interface Project {
  id: number
  project_name: string
  project_description: string
  project_type: string
  project_status: string
  project_url: string
  project_logo: string
  created_at: string
  updated_at: string
  user_id: number
  organization_id: number
}

// Define the form schema
const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().min(1, "Description is required").max(500, "Description must be less than 500 characters"),
  sourceUrl: z.string().url("Please enter a valid URL").min(1, "Source URL is required"),
  projectId: z.string().min(1, "Project selection is required"),
  scannerType: z.string().min(1, "Scanner type is required"),
});

interface NewScanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScanCreated?: () => void
}

const NewScanDialog = ({ open, onOpenChange, onScanCreated }: NewScanDialogProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      sourceUrl: "",
      projectId: "",
      scannerType: "Nuclei",
    },
  });

  // Fetch projects on component mount
  useEffect(() => {
    if (open) {
      const fetchProjects = async () => {
        setIsLoading(true);
        setFetchError(null);
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/project/`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${getAccessTokenForAPI()}`,
              'ngrok-skip-browser-warning': 'true',
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch projects');
          }

          const data = await response.json();
          setProjects(data);
        } catch (error) {
          console.error('Error fetching projects:', error);
          setFetchError('Failed to load projects. Please try again later.');
        } finally {
          setIsLoading(false);
        }
      };

      fetchProjects();
    }
  }, [open]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);

    try {
      // Create the dynamic analysis
      const dynamicAnalysisData = {
        project: parseInt(data.projectId),
        user_id: 1, // Replace with actual user ID if needed
        source_url: data.sourceUrl,
        dynamic_analysis_type: data.scannerType,
        title: data.title,
        description: data.description,
        dynamic_analysis_status: "Waiting"
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/dynamic-analysis/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessTokenForAPI()}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(dynamicAnalysisData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to submit form');
      }

      toast({
        title: "Scan created successfully",
        description: "Your dynamic security scan has been created and is now queued for processing.",
      });

      form.reset({
        title: "",
        description: "",
        sourceUrl: "",
        projectId: "",
        scannerType: "Nuclei",
      });

      onOpenChange(false);
      onScanCreated?.();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create scan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const scannerOptions = [
    {
      value: "Nuclei",
      label: "Nuclei",
      description: "Fast vulnerability scanner with extensive template coverage"
    },
    {
      value: "OWASP ZAP",
      label: "OWASP ZAP",
      description: "Comprehensive security testing proxy for web applications"
    },
    {
      value: "Burp Suite",
      label: "Burp Suite",
      description: "Professional web security testing platform"
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Play className="h-5 w-5 text-primary" />
            Create New Security Scan
          </DialogTitle>
          <DialogDescription>
            Configure and start a new dynamic security analysis for your application
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Info Section */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-medium text-foreground">Scan Configuration</h4>
              <p className="text-xs text-muted-foreground">
                Configure your dynamic security scan. The scan will be queued and processed by the selected scanner engine.
              </p>
            </div>

            {/* Project Selection Field */}
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Project *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span className="text-sm">Loading projects...</span>
                        </div>
                      ) : fetchError ? (
                        <div className="text-center text-red-500 py-4 text-sm">{fetchError}</div>
                      ) : projects.length === 0 ? (
                        <div className="text-center py-4 text-sm text-muted-foreground">No projects found</div>
                      ) : (
                        projects.map((project) => (
                          <SelectItem
                            key={project.id}
                            value={project.id.toString()}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{project.project_name}</span>
                              <span className="text-xs text-muted-foreground truncate">
                                {project.project_description || project.project_url}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Scanner Type Field */}
            <FormField
              control={form.control}
              name="scannerType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Scanner Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select scanner type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {scannerOptions.map((scanner) => (
                        <SelectItem key={scanner.value} value={scanner.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{scanner.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {scanner.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title Field */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Scan Title *</FormLabel>
                  <FormControl>
                    <Input
                      className="h-11"
                      placeholder="e.g., Production Security Audit"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Source URL Field */}
            <FormField
              control={form.control}
              name="sourceUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Target URL *</FormLabel>
                  <FormControl>
                    <Input
                      className="h-11"
                      placeholder="https://example.com"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Enter the full URL of the application you want to scan (e.g., https://example.com)
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description Field */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-[80px] resize-none"
                      placeholder="Describe the purpose and scope of this security scan..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating Scan...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Start Scan
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default NewScanDialog;
