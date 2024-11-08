// types/project.ts

export interface Project {
    id: string;
    name: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;  // Whether this project should be included in RAG
    documents: ProjectDocument[];
  }
  
  export interface ProjectDocument {
    id: string;
    projectId: string;
    name: string;
    type: string;
    uploadedAt: Date;
    contentHash?: string;  // For tracking changes/duplicates
  }
  
  // For creating a new project
  export interface CreateProjectInput {
    name: string;
    description?: string;
    isActive?: boolean;
  }
  
  // For updating an existing project
  export interface UpdateProjectInput {
    name?: string;
    description?: string;
    isActive?: boolean;
  }
  
  // For API responses
  export interface ProjectResponse {
    success: boolean;
    message?: string;
    project?: Project;
  }
  
  // For managing project selection
  export interface ProjectSelection {
    projectId: string;
    isSelected: boolean;
  }