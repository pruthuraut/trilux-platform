// DeleteProjectDialog.tsx
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Project } from './types';
import { toast } from '@/components/ui/use-toast';
import { getAccessTokenForAPI } from '@/utils/authUtils';

interface DeleteProjectDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedProject: Project | null;
  isSubmitting: boolean;
  setIsSubmitting: (submitting: boolean) => void;
  fetchProjects: () => Promise<void>;
  setSelectedProject: (project: Project | null) => void;
}

const DeleteProjectDialog = ({
  open,
  setOpen,
  selectedProject,
  isSubmitting,
  setIsSubmitting,
  fetchProjects,
  setSelectedProject,
}: DeleteProjectDialogProps) => {
  const handleDeleteProject = async () => {
    if (!selectedProject) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/project/${selectedProject.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAccessTokenForAPI()}`,
          'ngrok-skip-browser-warning': 'true',
        },
      });
      if (!response.ok) throw new Error('Failed to delete project');
      toast({ title: 'Success', description: 'Project deleted successfully', variant: 'success' });
      setOpen(false);
      setSelectedProject(null);
      await fetchProjects();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete project. Please try again.', variant: 'destructive' });
      console.error('Error deleting project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will permanently delete the project{' '}
            <span className="font-semibold">{selectedProject?.project_name}</span>. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteProject}
            disabled={isSubmitting}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Project'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteProjectDialog;