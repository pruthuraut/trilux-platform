import { useRef, useState } from 'react';
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
import { Loader2, Plus, Upload, X } from 'lucide-react';
import { ProjectFormData } from './types';
import { toast } from '@/components/ui/use-toast';
import { getAccessTokenForAPI } from '@/utils/authUtils';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface AddProjectDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  formData: ProjectFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProjectFormData>>;
  isSubmitting: boolean;
  setIsSubmitting: (submitting: boolean) => void;
  fetchProjects: () => Promise<void>;
  initialFormState: ProjectFormData;
  setImagePreview: (preview: string | null) => void;
  imagePreview: string | null;
}

const AddProjectDialog = ({
  open,
  setOpen,
  formData,
  setFormData,
  isSubmitting,
  setIsSubmitting,
  fetchProjects,
  initialFormState,
  setImagePreview,
  imagePreview,
}: AddProjectDialogProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDragging, setIsDragging] = useState(false);

  const validateField = (name: string, value: string) => {
    if (name === 'project_name' && !value.trim()) {
      return 'Project name is required';
    }
    if (name === 'project_description' && !value.trim()) {
      return 'Project description is required';
    }
    if (name === 'project_url' && value) {
      try {
        new URL(value);
      } catch (error) {
        return 'Please enter a valid URL';
      }
    }
    return '';
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev: ProjectFormData) => ({ ...prev, [name]: value }));

    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev: ProjectFormData) => ({ ...prev, project_logo: e.target.files![0] }));
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) setImagePreview(event.target.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFormData((prev: ProjectFormData) => ({ ...prev, project_logo: e.dataTransfer.files[0] }));
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) setImagePreview(event.target.result as string);
      };
      reader.readAsDataURL(e.dataTransfer.files[0]);
    }
  };

  const removeImage = () => {
    setFormData((prev: ProjectFormData) => ({ ...prev, project_logo: null }));
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (!formData.project_name.trim()) {
      newErrors.project_name = 'Project name is required';
      isValid = false;
    }

    if (!formData.project_description.trim()) {
      newErrors.project_description = 'Project description is required';
      isValid = false;
    }

    if (formData.project_url) {
      try {
        new URL(formData.project_url);
      } catch (error) {
        newErrors.project_url = 'Please enter a valid URL';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({ title: 'Error', description: 'Please correct the errors in the form.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null) formDataToSend.append(key, value);
      });
      const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const response = await fetch(`${backendUrl}/api/project/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getAccessTokenForAPI()}`, 'ngrok-skip-browser-warning': 'true', },
        body: formDataToSend,
      });

      if (!response.ok) throw new Error('Failed to create project');

      toast({ title: 'Success', description: 'Project created successfully', variant: 'success' });
      setOpen(false);
      setFormData(initialFormState);
      setImagePreview(null);
      await fetchProjects();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create project. Please try again.', variant: 'destructive' });
      console.error('Error creating project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Create New Project
          </DialogTitle>
          <DialogDescription>Fill in the details below to create a new project.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateProject} className="space-y-6">
          {/* Basic Info Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Basic Information</h3>

            <div className="space-y-2">
              <Label htmlFor="project_name" className="flex items-center gap-1">
                Project Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="project_name"
                name="project_name"
                placeholder="Enter project name"
                value={formData.project_name}
                onChange={handleInputChange}
                className={cn("focus-visible:ring-primary", errors.project_name && "border-red-500 focus-visible:ring-red-500")}
              />
              {errors.project_name && (
                <p className="text-xs text-red-500 mt-1">{errors.project_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="project_description" className="flex items-center gap-1">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="project_description"
                name="project_description"
                placeholder="Enter project description"
                value={formData.project_description}
                onChange={handleInputChange}
                rows={3}
                className={cn("focus-visible:ring-primary resize-none", errors.project_description && "border-red-500 focus-visible:ring-red-500")}
              />
              {errors.project_description && (
                <p className="text-xs text-red-500 mt-1">{errors.project_description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="project_url" className="flex items-center gap-1">
                Project URL
              </Label>
              <Input
                id="project_url"
                name="project_url"
                placeholder="https://example.com"
                type="url"
                value={formData.project_url}
                onChange={handleInputChange}
                className={cn("focus-visible:ring-primary", errors.project_url && "border-red-500 focus-visible:ring-red-500")}
              />
              {errors.project_url && (
                <p className="text-xs text-red-500 mt-1">{errors.project_url}</p>
              )}
            </div>
          </div>

          {/* Settings Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Project Settings</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project_type" className="flex items-center gap-1">
                  Project Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  defaultValue="Web Application"
                  value={formData.project_type}
                  onValueChange={(value) => setFormData({ ...formData, project_type: value })}
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
                <Label htmlFor="project_status" className="flex items-center gap-1">
                  Project Status <span className="text-red-500">*</span>
                </Label>
                <Select
                  defaultValue={formData.project_status}
                  onValueChange={(value) => setFormData({ ...formData, project_status: value })}
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
          </div>

          {/* Logo Upload Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Project Branding</h3>

            <div className="space-y-2">
              <Label htmlFor="project_logo" className="flex items-center gap-1">
                Project Logo
              </Label>

              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-4 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer",
                  isDragging ? "border-primary/70 bg-primary/5" : "border-input hover:border-primary/50 hover:bg-accent/50",
                  imagePreview ? "p-2" : "h-32"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                {!imagePreview ? (
                  <div className="flex flex-col items-center text-center p-4">
                    <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">Drag & drop your logo here, or click to select</p>
                    <p className="text-xs text-muted-foreground mt-1">Recommended: 512x512px (PNG, JPG, SVG)</p>
                  </div>
                ) : (
                  <div className="relative w-full">
                    <div className="flex items-center gap-4">
                      <img
                        src={imagePreview}
                        alt="Project logo preview"
                        className="h-20 w-20 object-contain rounded border p-1"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium truncate">
                          {(formData.project_logo as File)?.name || "Uploaded Image"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(formData.project_logo as File)?.size ? `${Math.round((formData.project_logo as File).size / 1024)} KB` : ""}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage();
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                <input
                  id="project_logo"
                  name="project_logo"
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" type="button" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProjectDialog;