'use client'
import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
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
import { Loader2, GitBranch } from "lucide-react"

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

const formSchema = z.object({
    projectId: z.string().min(1, "Project selection is required"),
    productName: z.string().min(1, "Product name is required").max(100, "Product name must be less than 100 characters"),
    repoType: z.enum(["GitHub", "GitLab", "GitBucket"]),
    repoUrl: z.string().url("Please enter a valid repository URL").min(1, "Repository URL is required"),
    accessToken: z.string().min(1, "Access token is required").min(8, "Access token must be at least 8 characters"),
    description: z.string().min(1, "Description is required").max(500, "Description must be less than 500 characters"),
});

function AddStaticProductForm() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            projectId: "",
            productName: "",
            repoType: "GitHub",
            repoUrl: "",
            accessToken: "",
            description: "",
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
                        'Content-Type': 'application/json',
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
            // Construct the static analysis request
            const staticAnalysisData = {
                project: parseInt(data.projectId),
                static_analysis_type: "LLM",
                source_url: data.repoUrl,
                repo_token: data.accessToken,
                repo_type: data.repoType,
                // You might want to include these as well if the API accepts them
                name: data.productName,
                description: data.description
            };

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/static-analysis/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAccessTokenForAPI()}`,
                    'ngrok-skip-browser-warning': 'true',
                },
                body: JSON.stringify(staticAnalysisData),
            });

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Static analysis requested successfully",
                });
                form.reset({
                    projectId: "",
                    productName: "",
                    repoType: "GitHub",
                    repoUrl: "",
                    accessToken: "",
                    description: "",
                });
            } else {
                const errorText = await response.text();
                console.error("Failed to add product:", errorText);
                toast({
                    title: "Error",
                    description: "Failed to request static analysis. Please try again.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error:", error);
            toast({
                title: "Error",
                description: "An unexpected error occurred. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
            window.location.reload();
        }
    };

    return (
        <div className="w-full space-y-6">
            <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <div className="h-8 w-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                        <GitBranch className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    Request Static Analysis
                </h3>
                <p className="text-sm text-muted-foreground">
                    Submit a new static analysis for your project repository
                </p>
            </div>

            {/* Info Section */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="text-sm font-medium text-foreground">Repository Analysis</h4>
                <p className="text-xs text-muted-foreground">
                    Configure your static code analysis. We&apos;ll analyze your repository for security vulnerabilities and code quality issues.
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

                    <FormField
                        control={form.control}
                        name="productName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm font-medium">Product Name *</FormLabel>
                                <FormControl>
                                    <Input
                                        className="h-11"
                                        placeholder="e.g., My Web Application"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="repoType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm font-medium">Repository Type *</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger className="h-11">
                                            <SelectValue placeholder="Select repository type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="GitHub">
                                            <div className="flex items-center gap-2">
                                                <GitBranch className="h-4 w-4" />
                                                <span>GitHub</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="GitLab">
                                            <div className="flex items-center gap-2">
                                                <GitBranch className="h-4 w-4" />
                                                <span>GitLab</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="GitBucket">
                                            <div className="flex items-center gap-2">
                                                <GitBranch className="h-4 w-4" />
                                                <span>GitBucket</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="repoUrl"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm font-medium">Repository URL *</FormLabel>
                                <FormControl>
                                    <Input
                                        className="h-11"
                                        placeholder="https://github.com/username/repo"
                                        {...field}
                                    />
                                </FormControl>
                                <p className="text-xs text-muted-foreground">
                                    Enter the full URL of your repository
                                </p>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

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
                                        placeholder="Enter your access token"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Personal access token with repository read permissions
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm font-medium">Description *</FormLabel>
                                <FormControl>
                                    <textarea
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                        placeholder="Describe the purpose and scope of this static analysis..."
                                        {...field}
                                    />
                                </FormControl>
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
                                    Requesting Analysis...
                                </>
                            ) : (
                                <>
                                    <GitBranch className="h-4 w-4" />
                                    Request Analysis
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}

export default AddStaticProductForm;