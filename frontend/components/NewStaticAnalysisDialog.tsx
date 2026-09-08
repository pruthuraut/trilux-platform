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
import { Loader2, GitBranch, Shield, Brain, Upload } from "lucide-react"

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

// Define the form schema. The access token is required for the clone-based
// pipelines (LLM/CVE/GitLeaks) but NOT for Taint, which uses a public shallow
// clone — so it's validated conditionally below.
const formSchema = z.object({
  // title/description are only used by the URL pipeline; optional so uploads validate.
  title: z.string().max(100, "Title must be less than 100 characters").optional().default(""),
  description: z.string().max(500, "Description must be less than 500 characters").optional().default(""),
  // Optional so the "Upload code" mode (no URL) validates; enforced conditionally below.
  repoUrl: z.string().optional().default(""),
  projectId: z.string().min(1, "Project selection is required"),
  analysisType: z.string().min(1, "Analysis type is required"),
  repoType: z.enum(["GitHub", "GitLab", "GitBucket"]),
  accessToken: z.string().optional().default(""),
  sourceMode: z.enum(["github", "upload"]).default("github"),
}).superRefine((val, ctx) => {
  if (val.sourceMode === "github") {
    if (!val.title) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["title"], message: "Title is required" });
    }
    if (!val.description) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["description"], message: "Description is required" });
    }
    if (!val.repoUrl || !/^https?:\/\/.+/.test(val.repoUrl)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["repoUrl"],
        message: "Please enter a valid repository URL" });
    }
    // Access token only required for the clone-based pipelines (not Taint).
    if (val.analysisType !== "Taint" && (val.accessToken || "").length < 8) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["accessToken"],
        message: "Access token is required (min 8 characters)" });
    }
  }
});

interface NewStaticAnalysisDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAnalysisCreated?: () => void
}

const NewStaticAnalysisDialog = ({ open, onOpenChange, onAnalysisCreated }: NewStaticAnalysisDialogProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      repoUrl: "",
      projectId: "",
      analysisType: "LLM",
      repoType: "GitHub",
      accessToken: "",
      sourceMode: "github",
    },
  });
  const sourceMode = form.watch("sourceMode");

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
    if (data.sourceMode === "upload" && !file) {
      form.setError("repoUrl", { message: "Choose a .zip of your source code" });
      return;
    }
    setIsSubmitting(true);

    try {
      const API = process.env.NEXT_PUBLIC_API_BASE_URL;
      const token = getAccessTokenForAPI();
      let response: Response;

      if (data.sourceMode === "upload") {
        // Dropped source: multipart upload -> backend runs cross-file Taint SAST.
        const fd = new FormData();
        fd.append("project", data.projectId);
        fd.append("source_file", file as File);
        response = await fetch(`${API}/api/static-analysis/`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
          body: fd,
        });
      } else {
        const staticAnalysisData = {
          project: parseInt(data.projectId),
          source_url: data.repoUrl,
          static_analysis_type: data.analysisType,
          repo_type: data.repoType,
          repo_token: data.accessToken,
          title: data.title,
          description: data.description,
          static_analysis_status: "Waiting",
        };
        response = await fetch(`${API}/api/static-analysis/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify(staticAnalysisData),
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to submit form');
      }

      toast({
        title: "Analysis created successfully",
        description: "Your static code analysis has been created and is now queued for processing.",
      });

      form.reset({
        title: "",
        description: "",
        repoUrl: "",
        projectId: "",
        analysisType: "LLM",
        repoType: "GitHub",
        accessToken: "",
        sourceMode: "github",
      });
      setFile(null);

      onOpenChange(false);
      onAnalysisCreated?.();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const analysisTypeOptions = [
    {
      value: "LLM",
      label: "LLM Analysis",
      description: "AI-powered code analysis for security vulnerabilities and best practices",
      icon: <Brain className="h-4 w-4" />
    },
    {
      value: "CVEscan",
      label: "CVE Scan",
      description: "Scan for known Common Vulnerabilities and Exposures",
      icon: <Shield className="h-4 w-4" />
    },
    {
      value: "GitLeaks",
      label: "GitLeaks",
      description: "Detect and prevent secrets in your git repositories",
      icon: <GitBranch className="h-4 w-4" />
    },
    {
      value: "Taint",
      label: "Taint Analysis",
      description: "Cross-file data-flow SAST: trace attacker input to dangerous sinks (no token needed)",
      icon: <Shield className="h-4 w-4" />
    },
    {
      value: "Combined",
      label: "Combined Analysis",
      description: "Run all analysis types for comprehensive security coverage",
      icon: <Shield className="h-4 w-4" />
    },
  ];

  const repoTypeOptions = [
    {
      value: "GitHub",
      label: "GitHub",
      description: "GitHub.com or GitHub Enterprise"
    },
    {
      value: "GitLab",
      label: "GitLab",
      description: "GitLab.com or self-hosted GitLab"
    },
    {
      value: "GitBucket",
      label: "GitBucket",
      description: "GitBucket repository hosting"
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <GitBranch className="h-5 w-5 text-primary" />
            Create New Static Analysis
          </DialogTitle>
          <DialogDescription>
            Configure and start a new static code analysis for your repository
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Info Section */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-medium text-foreground">Repository Analysis</h4>
              <p className="text-xs text-muted-foreground">
                Configure your static code analysis. We&apos;ll analyze your repository for security vulnerabilities, secrets, and code quality issues.
              </p>
            </div>

            {/* Source mode toggle */}
            <div className="space-y-2">
              <FormLabel className="text-sm font-medium">Source *</FormLabel>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={sourceMode === "github" ? "default" : "outline"}
                  className="gap-2"
                  onClick={() => form.setValue("sourceMode", "github")}
                  disabled={isSubmitting}
                >
                  <GitBranch className="h-4 w-4" />
                  GitHub URL
                </Button>
                <Button
                  type="button"
                  variant={sourceMode === "upload" ? "default" : "outline"}
                  className="gap-2"
                  onClick={() => form.setValue("sourceMode", "upload")}
                  disabled={isSubmitting}
                >
                  <Upload className="h-4 w-4" />
                  Upload Code
                </Button>
              </div>
              {sourceMode === "upload" && (
                <p className="text-xs text-muted-foreground">
                  Zip your source folder and drop it here — we run cross-file taint SAST
                  over it (no repo URL or token needed).
                </p>
              )}
            </div>

            {/* Upload: source .zip */}
            {sourceMode === "upload" && (
              <div className="space-y-2">
                <FormLabel className="text-sm font-medium">Source Archive (.zip) *</FormLabel>
                <Input
                  type="file"
                  accept=".zip"
                  className="h-11 cursor-pointer file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  disabled={isSubmitting}
                />
                {file && <p className="text-xs text-foreground">Selected: {file.name}</p>}
              </div>
            )}

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

            {/* Analysis Type Field (URL mode only; uploads always run Taint) */}
            {sourceMode === "github" && (
            <FormField
              control={form.control}
              name="analysisType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Analysis Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select analysis type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {analysisTypeOptions.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              {type.icon}
                              <span className="font-medium">{type.label}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {type.description}
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
            )}

            {/* Repository Type Field (URL mode only) */}
            {sourceMode === "github" && (
            <FormField
              control={form.control}
              name="repoType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Repository Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select repository type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {repoTypeOptions.map((repo) => (
                        <SelectItem key={repo.value} value={repo.value}>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <GitBranch className="h-4 w-4" />
                              <span className="font-medium">{repo.label}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {repo.description}
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
            )}

            {/* Title Field (URL mode only) */}
            {sourceMode === "github" && (
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Analysis Title *</FormLabel>
                  <FormControl>
                    <Input
                      className="h-11"
                      placeholder="e.g., Security Audit - Main Branch"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            )}

            {/* Repository URL Field (URL mode only) */}
            {sourceMode === "github" && (
            <FormField
              control={form.control}
              name="repoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Repository URL *</FormLabel>
                  <FormControl>
                    <Input
                      className="h-11"
                      placeholder="https://github.com/username/repository"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Enter the full URL of your repository (e.g., https://github.com/username/repo)
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            )}

            {/* Access Token Field — not needed for Taint (public shallow clone) or uploads */}
            {sourceMode === "github" && form.watch("analysisType") !== "Taint" && (
              <FormField
                control={form.control}
                name="accessToken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Access Token *</FormLabel>
                    <FormControl>
                      <Input
                        className="h-11"
                        type="password"
                        placeholder="Enter your repository access token"
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Personal access token with repository read permissions
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Description Field (URL mode only) */}
            {sourceMode === "github" && (
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-[80px] resize-none"
                      placeholder="Describe the purpose and scope of this static analysis..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            )}

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
                    Creating Analysis...
                  </>
                ) : (
                  <>
                    <GitBranch className="h-4 w-4" />
                    Start Analysis
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

export default NewStaticAnalysisDialog;
