"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
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
import { toast } from "@/components/ui/use-toast"
import { getAccessTokenForAPI } from "@/utils/authUtils"
import { Loader2 } from "lucide-react"

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
  devEnvUrl: z.string().url("Please enter a valid URL").min(1, "Source URL is required"),
  projectId: z.string().min(1, "Project selection is required"),
});

const AddDynamicLLMModelForm = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      devEnvUrl: "",
      projectId: "",
    },
  });

  // Fetch projects on component mount
  useEffect(() => {
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
  }, []);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);

    try {
      // Create the dynamic analysis
      const dynamicAnalysisData = {
        project: parseInt(data.projectId),
        user_id: 1, // Replace with actual user ID if needed
        source_url: data.devEnvUrl,
        // You might want to add the title and description to the payload as well
        title: data.title,
        description: data.description
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
        title: "Analysis created successfully",
        description: "Your dynamic LLM analysis has been created and is now processing.",
      });

      form.reset({
        title: "",
        description: "",
        devEnvUrl: "",
        projectId: "",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to create analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      window.location.reload(); // Reload the page to fetch the updated analysis list
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          Create Dynamic Analysis
        </h3>
        <p className="text-sm text-muted-foreground">
          Submit a new dynamic security analysis for your project
        </p>
      </div>

      {/* Info Section */}
      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <h4 className="text-sm font-medium text-foreground">Analysis Configuration</h4>
        <p className="text-xs text-muted-foreground">
          Configure your dynamic security analysis. The scan will be queued and processed automatically.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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

          {/* Title Field */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Analysis Title *</FormLabel>
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

          {/* Description Field */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Description *</FormLabel>
                <FormControl>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    placeholder="Describe the purpose and scope of this security analysis..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Dev-Env URL Field */}
          <FormField
            control={form.control}
            name="devEnvUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Source URL *</FormLabel>
                <FormControl>
                  <Input
                    className="h-11"
                    placeholder="https://example.com"
                    {...field}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  Enter the full URL of the application you want to analyze
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => window.location.reload()}
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
                  <Loader2 className="h-4 w-4" />
                  Create Analysis
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AddDynamicLLMModelForm;