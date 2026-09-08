// ProjectHeader.tsx
import { FolderKanban, Activity, CheckCircle, Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Project, ProjectFormData } from './types';

interface ProjectHeaderProps {
  projects: Project[];
  setShowAddDialog: (value: boolean) => void;
  setFormData: (data: ProjectFormData) => void;
  initialFormState: ProjectFormData;
  setImagePreview: (preview: string | null) => void;
}

const ProjectHeader = ({
  projects,
  setShowAddDialog,
  setFormData,
  initialFormState,
  setImagePreview,
}: ProjectHeaderProps) => {
  return (
    <div className="relative rounded-xl overflow-hidden mb-8">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5 z-0"></div>
      <div className="relative z-10 p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <FolderKanban className="h-8 w-8 text-primary" />
              Project Management
            </h1>
            <p className="text-muted-foreground mt-1 max-w-2xl">
              Create, view, and manage your organization&apos;s projects. Track status, update details, and collaborate
              efficiently.
            </p>
          </div>
          <Button
            className="bg-primary hover:bg-primary/90 gap-2 shadow-md transition-all hover:translate-y-[-2px]"
            onClick={() => {
              setFormData(initialFormState);
              setImagePreview(null);
              setShowAddDialog(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add Project
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <Card className="bg-white/50 dark:bg-gray-800/50 border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <FolderKanban className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-semibold">{projects.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/50 dark:bg-gray-800/50 border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="bg-green-500/10 p-3 rounded-lg">
                <Activity className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Projects</p>
                <p className="text-2xl font-semibold">
                  {projects.filter((p) => p.project_status.toLowerCase() === 'active').length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/50 dark:bg-gray-800/50 border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="bg-blue-500/10 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-semibold">
                  {projects.filter((p) => p.project_status.toLowerCase() === 'completed').length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/50 dark:bg-gray-800/50 border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="bg-yellow-500/10 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">On Hold</p>
                <p className="text-2xl font-semibold">
                  {projects.filter((p) => p.project_status.toLowerCase() === 'on hold').length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProjectHeader;