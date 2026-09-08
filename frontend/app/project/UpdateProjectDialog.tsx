// UpdateProjectDialog.tsx
import { useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, Pencil } from 'lucide-react';
import { Project, ProjectFormData } from './types';
import { toast } from '@/components/ui/use-toast';
import { getAccessTokenForAPI } from '@/utils/authUtils';

interface UpdateProjectDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    formData: ProjectFormData;
    setFormData: React.Dispatch<React.SetStateAction<ProjectFormData>>;
    isSubmitting: boolean;
    setIsSubmitting: (submitting: boolean) => void;
    selectedProject: Project | null;
    fetchProjects: () => Promise<void>;
    setSelectedProject: (project: Project | null) => void;
    imagePreview: string | null;
    setImagePreview: (preview: string | null) => void;
}

const UpdateProjectDialog = ({
    open,
    setOpen,
    formData,
    setFormData,
    isSubmitting,
    setIsSubmitting,
    selectedProject,
    fetchProjects,
    setSelectedProject,
    imagePreview,
    setImagePreview,
}: UpdateProjectDialogProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev: ProjectFormData) => ({ ...prev, [name]: value } as ProjectFormData));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData((prev) => ({ ...prev, project_logo: e.target.files![0] }));
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) setImagePreview(event.target.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleUpdateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProject || !formData.project_name || !formData.project_description) {
            toast({ title: 'Error', description: 'Please fill in all required fields.', variant: 'destructive' });
            return;
        }
        setIsSubmitting(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('id', selectedProject.id);
            formDataToSend.append('created_at', selectedProject.created_at);
            formDataToSend.append('updated_at', selectedProject.updated_at);
            Object.entries(formData).forEach(([key, value]) => {
                if (value !== null) formDataToSend.append(key, value);
            });
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/project/${selectedProject.id}/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${getAccessTokenForAPI()}`,
                    'ngrok-skip-browser-warning': 'true',
                },
                body: formDataToSend,
            });
            if (!response.ok) throw new Error('Failed to update project');
            toast({ title: 'Success', description: 'Project updated successfully', variant: 'success' });
            setOpen(false);
            setSelectedProject(null);
            setImagePreview(null);
            await fetchProjects();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to update project. Please try again.', variant: 'destructive' });
            console.error('Error updating project:', error);
        } finally {
            setIsSubmitting(false);
            window.location.reload();
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[650px]">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <Pencil className="h-5 w-5 text-primary" />
                        Update Project
                    </DialogTitle>
                    <DialogDescription>Update the details below to modify the project.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpdateProject} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 py-4">
                        <div className="space-y-2">
                            <label htmlFor="project_name" className="text-sm font-medium flex items-center gap-1">
                                Project Name <span className="text-red-500">*</span>
                            </label>
                            <Input
                                id="project_name"
                                name="project_name"
                                placeholder="Enter project name"
                                value={formData.project_name}
                                onChange={handleInputChange}
                                required
                                className="focus-visible:ring-primary"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="project_description" className="text-sm font-medium flex items-center gap-1">
                                Description <span className="text-red-500">*</span>
                            </label>
                            <Textarea
                                id="project_description"
                                name="project_description"
                                placeholder="Enter project description"
                                value={formData.project_description}
                                onChange={handleInputChange}
                                rows={3}
                                required
                                className="focus-visible:ring-primary resize-none"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="project_type" className="text-sm font-medium flex items-center gap-1">
                                    Project Type <span className="text-red-500">*</span>
                                </label>
                                <Select
                                    value={formData.project_type}
                                    onValueChange={(value) => setFormData((prev) => ({ ...prev, project_type: value }))}
                                >
                                    <SelectTrigger id="project_type" className="w-full bg-background border-input focus:ring-primary">
                                        <SelectValue placeholder="Select project type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <div className="py-2">
                                            <h4 className="px-2 text-sm font-semibold mb-2">Choose a project type</h4>
                                            <SelectItem value="Web Application" className="flex items-center gap-2 px-2 py-3 cursor-pointer rounded-md focus:bg-accent focus:text-accent-foreground hover:bg-accent/50">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-500">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="M10 4v4" /><path d="M2 8h20" /><path d="M6 12h12" /><path d="M6 16h12" /></svg>
                                                </div>
                                                <div>
                                                    <div className="font-medium">Web Application</div>
                                                    <div className="text-xs text-muted-foreground">Websites, web platforms, portals</div>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="Software" className="flex items-center gap-2 px-2 py-3 cursor-pointer rounded-md focus:bg-accent focus:text-accent-foreground hover:bg-accent/50">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/10 text-purple-500">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 5h10M7 9h10M7 13h4"></path><rect width="18" height="18" x="3" y="3" rx="2"></rect></svg>
                                                </div>
                                                <div>
                                                    <div className="font-medium">Software</div>
                                                    <div className="text-xs text-muted-foreground">Desktop apps, mobile apps</div>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="Hardware" className="flex items-center gap-2 px-2 py-3 cursor-pointer rounded-md focus:bg-accent focus:text-accent-foreground hover:bg-accent/50">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/10 text-blue-500">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="8" x="5" y="8" rx="1"></rect><path d="M12 16v4"></path><path d="M8 12h.01"></path><path d="M12 12h.01"></path><path d="M16 12h.01"></path></svg>
                                                </div>
                                                <div>
                                                    <div className="font-medium">Hardware</div>
                                                    <div className="text-xs text-muted-foreground">Physical devices, equipment</div>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="Service" className="flex items-center gap-2 px-2 py-3 cursor-pointer rounded-md focus:bg-accent focus:text-accent-foreground hover:bg-accent/50">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                                </div>
                                                <div>
                                                    <div className="font-medium">Service</div>
                                                    <div className="text-xs text-muted-foreground">Consulting, support, maintenance</div>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="Research" className="flex items-center gap-2 px-2 py-3 cursor-pointer rounded-md focus:bg-accent focus:text-accent-foreground hover:bg-accent/50">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-500">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5h0c-1.4 0-2.5-1.1-2.5-2.5V2"></path><path d="M8.5 2h7"></path><path d="M14.5 16h-5"></path></svg>
                                                </div>
                                                <div>
                                                    <div className="font-medium">Research</div>
                                                    <div className="text-xs text-muted-foreground">Analysis, prototyping, exploration</div>
                                                </div>
                                            </SelectItem>
                                        </div>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="project_status" className="text-sm font-medium">
                                    Project Status <span className="text-red-500">*</span>
                                </label>
                                <Select
                                    value={formData.project_status}
                                    onValueChange={(value) => setFormData((prev) => ({ ...prev, project_status: value }))}
                                >
                                    <SelectTrigger id="project_status" className="w-full bg-background border-input">
                                        <SelectValue placeholder="Select project status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <div className="py-2">
                                            <h4 className="px-2 text-sm font-semibold mb-2">Choose a status</h4>
                                            <SelectItem value="Active" className="flex items-center gap-2 px-2 py-3 cursor-pointer rounded-md focus:bg-accent focus:text-accent-foreground hover:bg-accent/50">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/10 text-green-500">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                                                </div>
                                                <div>
                                                    <div className="font-medium">Active</div>
                                                    <div className="text-xs text-muted-foreground">Project is currently in progress</div>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="Completed" className="flex items-center gap-2 px-2 py-3 cursor-pointer rounded-md focus:bg-accent focus:text-accent-foreground hover:bg-accent/50">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/10 text-blue-500">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>
                                                </div>
                                                <div>
                                                    <div className="font-medium">Completed</div>
                                                    <div className="text-xs text-muted-foreground">Project has been finished successfully</div>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="On Hold" className="flex items-center gap-2 px-2 py-3 cursor-pointer rounded-md focus:bg-accent focus:text-accent-foreground hover:bg-accent/50">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/10 text-yellow-500">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M10 16v-6h4"></path><path d="M10 10h4"></path></svg>
                                                </div>
                                                <div>
                                                    <div className="font-medium">On Hold</div>
                                                    <div className="text-xs text-muted-foreground">Project temporarily paused</div>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="Cancelled" className="flex items-center gap-2 px-2 py-3 cursor-pointer rounded-md focus:bg-accent focus:text-accent-foreground hover:bg-accent/50">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 text-red-500">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                                                </div>
                                                <div>
                                                    <div className="font-medium">Cancelled</div>
                                                    <div className="text-xs text-muted-foreground">Project has been terminated</div>
                                                </div>
                                            </SelectItem>
                                        </div>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="update_project_url" className="text-sm font-medium">
                                Project URL
                            </label>
                            <Input
                                id="update_project_url"
                                name="project_url"
                                placeholder="https://example.com"
                                type="url"
                                value={formData.project_url}
                                onChange={handleInputChange}
                                className="focus-visible:ring-primary"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="update_project_logo" className="text-sm font-medium">
                                Project Logo
                            </label>
                            <Input
                                id="update_project_logo"
                                name="project_logo"
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="focus-visible:ring-primary"
                            />
                            {selectedProject && selectedProject.project_logo && (
                                <div className="flex items-center gap-2 mt-2">
                                    <p className="text-xs text-muted-foreground">
                                        Current logo: {selectedProject.project_logo.split('/').pop()}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" type="button" onClick={() => setOpen(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Update Project'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default UpdateProjectDialog;