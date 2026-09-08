// ProjectTable.tsx
import { useRef } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { FolderKanban, Loader2, Plus, MoreHorizontal, Pencil, ExternalLink, Trash2, Download, RefreshCw } from 'lucide-react';
import { Project, ProjectFormData } from './types';


interface ProjectTableProps {
  filteredProjects: Project[];
  isLoading: boolean;
  setShowAddDialog: (value: boolean) => void;
  setSelectedProject: (project: Project | null) => void;
  setShowUpdateDialog: (value: boolean) => void;
  setShowDeleteDialog: (value: boolean) => void;
  setFormData: (data: ProjectFormData) => void;
  fetchProjects: () => Promise<void>;
  initialFormState: ProjectFormData;
  setImagePreview: (preview: string | null) => void;
}

const ProjectTable = ({
  filteredProjects,
  isLoading,
  setShowAddDialog,
  setSelectedProject,
  setShowUpdateDialog,
  setShowDeleteDialog,
  setFormData,
  fetchProjects,
  initialFormState,
  setImagePreview,
}: ProjectTableProps) => {
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-500/10 text-green-500 dark:bg-green-500/20';
      case 'completed':
        return 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/20';
      case 'on hold':
        return 'bg-yellow-500/10 text-yellow-500 dark:bg-yellow-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-500 dark:bg-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 dark:bg-gray-500/20';
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'web application':
        return 'bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20';
      case 'software':
        return 'bg-purple-500/10 text-purple-500 dark:bg-purple-500/20';
      case 'hardware':
        return 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/20';
      case 'service':
        return 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20';
      case 'research':
        return 'bg-cyan-500/10 text-cyan-500 dark:bg-cyan-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 dark:bg-gray-500/20';
    }
  };

  const openEditDialog = (project: Project) => {
    setSelectedProject(project);
    setFormData({
      project_name: project.project_name,
      project_description: project.project_description,
      project_type: project.project_type,
      project_status: project.project_status,
      project_url: project.project_url || '',
      project_logo: null,
      user_id: project.user_id,
      organization_id: project.organization_id,
    });
    setImagePreview(project.project_logo || null);
    setShowUpdateDialog(true);
  };

  const openDeleteDialog = (project: Project) => {
    setSelectedProject(project);
    setShowDeleteDialog(true);
  };

  return (
    <Card className="shadow-md border-0">
      <CardHeader className="pb-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle>Projects</CardTitle>
            <CardDescription>
              Showing {filteredProjects.length} of {filteredProjects.length} projects
            </CardDescription>
          </div>
          {filteredProjects.length > 0 && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1" 
                onClick={() => {
                    const csvData = filteredProjects.map((project) => ({
                        'Project Name': project.project_name,
                        'Description': project.project_description,
                        'Type': project.project_type,
                        'Status': project.project_status,
                        'Created At': new Date(project.created_at).toLocaleString(),
                    }));
                    const csv = [
                        Object.keys(csvData[0]).join(','),
                        ...csvData.map((row) => Object.values(row).join(',')),
                    ].join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'projects.csv';
                    a.click();
                    URL.revokeObjectURL(url);
                    }
                }
                >
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button variant="outline" size="sm" className="gap-1" onClick={
                () => fetchProjects()
              } >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-muted-foreground">Loading projects...</span>
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-primary/5 p-4 rounded-full mb-4">
              <FolderKanban className="h-12 w-12 text-primary opacity-80" />
            </div>
            <h3 className="text-lg font-medium mb-1">No projects found</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              {filteredProjects.length === 0
                ? 'Create your first project to get started with project management'
                : 'Try adjusting your filters or search terms to find what you’re looking for'}
            </p>
            {filteredProjects.length === 0 && (
              <Button
                className="gap-2 shadow-sm"
                onClick={() => {
                  setFormData(initialFormState);
                  setShowAddDialog(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Create First Project
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Project</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Created</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow key={project.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 rounded-md border shadow-sm">
                          <AvatarImage src={`${process.env.NEXT_PUBLIC_API_BASE_URL+project.project_logo}`} alt={project.project_name} className="object-cover" />
                          <AvatarFallback className="bg-primary/10 text-primary rounded-md">
                            {project.project_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{project.project_name}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {project.project_description}
                          </div>
                          {project.project_url && (
                            <a
                              href={project.project_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary flex items-center gap-1 mt-1 hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {project.project_url.replace(/(^\w+:|^)\/\//, '')}
                            </a>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`${getTypeBadge(project.project_type)} px-2 py-1`}>
                        {project.project_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`${getStatusBadge(project.project_status)} px-2 py-1`}>
                        {project.project_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">
                          {new Date(project.created_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(project.created_at).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => openEditDialog(project)}
                          >
                            <Pencil className="h-4 w-4" /> Edit Project
                          </DropdownMenuItem>
                          {project.project_url && (
                            <DropdownMenuItem
                              className="flex items-center gap-2 cursor-pointer"
                              onClick={() => window.open(project.project_url, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" /> Visit URL
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="flex items-center gap-2 text-red-500 focus:text-red-500 cursor-pointer"
                            onClick={() => openDeleteDialog(project)}
                          >
                            <Trash2 className="h-4 w-4" /> Delete Project
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectTable;