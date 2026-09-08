// ProjectManagement.tsx
'use client';
import React, { useState, useEffect } from 'react';
import withAuth from '@/utils/withAuth';
import { getAccessTokenForAPI } from '@/utils/authUtils';
import ProjectHeader from './ProjectHeader';
import ProjectFilters from './ProjectFilters';
import ProjectTable from './ProjectTable';
import AddProjectDialog from './AddProjectDialog';
import UpdateProjectDialog from './UpdateProjectDialog';
import DeleteProjectDialog from './DeleteProjectDialog';
import { Project, ProjectFormData } from './types';
import { toast } from '@/components/ui/use-toast';

const ProjectManagement = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const initialFormState: ProjectFormData = {
    project_name: '',
    project_description: '',
    project_type: 'Web Application',
    project_status: 'Active',
    project_url: '',
    project_logo: null,
    user_id: '1',
    organization_id: '1',
  };

  const [formData, setFormData] = useState<ProjectFormData>(initialFormState);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/project/`, {
        headers: { 
            'Authorization': `Bearer ${getAccessTokenForAPI()}`,
            'ngrok-skip-browser-warning': 'true', 
    
    },
        
      });
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load projects. Please try again.', variant: 'destructive' });
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.project_description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || project.project_status.toLowerCase() === statusFilter.toLowerCase();
    const matchesType =
      typeFilter === 'all' || project.project_type.toLowerCase() === typeFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesType;
  });

  const projectTypes = ['all', ...Array.from(new Set(projects.map((p) => p.project_type.toLowerCase())))];
  const projectStatuses = ['all', ...Array.from(new Set(projects.map((p) => p.project_status.toLowerCase())))];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <ProjectHeader
        projects={projects}
        setShowAddDialog={setShowAddDialog}
        setFormData={setFormData}
        initialFormState={initialFormState}
        setImagePreview={setImagePreview}
      />
      <ProjectFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        projectTypes={projectTypes}
        projectStatuses={projectStatuses}
      />
      <ProjectTable
        filteredProjects={filteredProjects}
        isLoading={isLoading}
        setShowAddDialog={setShowAddDialog}
        setSelectedProject={setSelectedProject}
        setShowUpdateDialog={setShowUpdateDialog}
        setShowDeleteDialog={setShowDeleteDialog}
        setFormData={setFormData}
        fetchProjects={fetchProjects}
        initialFormState={initialFormState}
        setImagePreview={setImagePreview}
      />
      <AddProjectDialog
              open={showAddDialog}
              setOpen={setShowAddDialog}
              formData={formData}
              setFormData={setFormData}
              isSubmitting={isSubmitting}
              setIsSubmitting={setIsSubmitting}
              fetchProjects={fetchProjects}
              initialFormState={initialFormState}
              setImagePreview={setImagePreview} imagePreview={null}      />
      <UpdateProjectDialog
        open={showUpdateDialog}
        setOpen={setShowUpdateDialog}
        formData={formData}
        setFormData={setFormData}
        isSubmitting={isSubmitting}
        setIsSubmitting={setIsSubmitting}
        selectedProject={selectedProject}
        fetchProjects={fetchProjects}
        setSelectedProject={setSelectedProject}
        imagePreview={imagePreview}
        setImagePreview={setImagePreview}
      />
      <DeleteProjectDialog
        open={showDeleteDialog}
        setOpen={setShowDeleteDialog}
        selectedProject={selectedProject}
        isSubmitting={isSubmitting}
        setIsSubmitting={setIsSubmitting}
        fetchProjects={fetchProjects}
        setSelectedProject={setSelectedProject}
      />
    </div>
  );
};

export default withAuth(ProjectManagement);