// types.ts
export interface Project {
    id: string;
    project_name: string;
    project_description: string;
    project_type: string;
    project_status: string;
    project_url: string;
    project_logo: string;
    user_id: string;
    organization_id: string;
    created_at: string;
    updated_at: string;
  }
  
  export interface ProjectFormData {
    project_name: string;
    project_description: string;
    project_type: string;
    project_status: string;
    project_url: string;
    project_logo: File | null;
    user_id: string;
    organization_id: string;
  }