// services/projectStore.ts
import { 
    Project, 
    ProjectDocument, 
    CreateProjectInput, 
    UpdateProjectInput 
  } from '../types/project';
  
  const PROJECTS_STORAGE_KEY = 'stored_projects';
  const ACTIVE_PROJECTS_KEY = 'active_projects';
  
  // Custom events for project changes
  const PROJECT_CHANGE_EVENT = 'project-changed';
  const PROJECT_UPDATE_EVENT = 'project-updated';
  
  class ProjectStoreService {
    onUpdateCallback: (() => void) | undefined;
    private dispatchProjectChange() {
      window.dispatchEvent(new CustomEvent(PROJECT_CHANGE_EVENT));
    }
  
    private dispatchProjectUpdate() {
      window.dispatchEvent(new CustomEvent(PROJECT_UPDATE_EVENT));
    }
  
    // Initialize store with defaults if needed
    init() {
      const projects = this.getAllProjects();
      if (projects.length === 0) {
        this.createProject({
          name: 'Default Project',
          description: 'Default project for documents',
          isActive: true
        });
      }
    }
  
    // Get all projects with parsed dates
    getAllProjects(): Project[] {
      const stored = localStorage.getItem(PROJECTS_STORAGE_KEY);
      if (!stored) return [];
      
      return JSON.parse(stored).map((project: Project) => ({
        ...project,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(project.updatedAt),
        documents: project.documents.map(doc => ({
          ...doc,
          uploadedAt: new Date(doc.uploadedAt)
        }))
      }));
    }
  
    // Get a specific project by ID
    getProject(projectId: string): Project | null {
      const projects = this.getAllProjects();
      return projects.find(p => p.id === projectId) || null;
    }
  
    // Create a new project
    createProject(input: CreateProjectInput): Project {
      const projects = this.getAllProjects();
      
      const newProject: Project = {
        id: Date.now().toString(),
        name: input.name,
        description: input.description,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: input.isActive ?? false,
        documents: []
      };
  
      localStorage.setItem(
        PROJECTS_STORAGE_KEY,
        JSON.stringify([...projects, newProject])
      );
      
      this.dispatchProjectChange();
      return newProject;
    }
  
    // Update an existing project
    updateProject(projectId: string, updates: UpdateProjectInput): Project | null {
      const projects = this.getAllProjects();
      let updatedProject: Project | null = null;
  
      const updatedProjects = projects.map(project => {
        if (project.id === projectId) {
          updatedProject = {
            ...project,
            ...updates,
            updatedAt: new Date()
          };
          return updatedProject;
        }
        return project;
      });
  
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updatedProjects));
      this.dispatchProjectUpdate();
      return updatedProject;
    }
  
    // Delete a project and its documents
    deleteProject(projectId: string): void {
      const projects = this.getAllProjects();
      const project = projects.find(p => p.id === projectId);
      
      if (project) {
        // Clean up project documents
        project.documents.forEach(doc => {
          try {
            window.fs.unlink(doc.name);
          } catch (error) {
            console.error(`Error deleting document ${doc.name}:`, error);
          }
        });
      }
  
      const updatedProjects = projects.filter(p => p.id !== projectId);
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updatedProjects));
      this.dispatchProjectChange();
    }
  
    // Add a document to a project
    addDocumentToProject(projectId: string, document: ProjectDocument): void {
      const projects = this.getAllProjects();
      const updatedProjects = projects.map(project => {
        if (project.id === projectId) {
          return {
            ...project,
            documents: [...project.documents, document],
            updatedAt: new Date()
          };
        }
        return project;
      });
  
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updatedProjects));
      this.dispatchProjectUpdate();
    }
  
    // Remove a document from a project
    removeDocumentFromProject(projectId: string, documentId: string): void {
      const projects = this.getAllProjects();
      const updatedProjects = projects.map(project => {
        if (project.id === projectId) {
          return {
            ...project,
            documents: project.documents.filter(doc => doc.id !== documentId),
            updatedAt: new Date()
          };
        }
        return project;
      });
  
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updatedProjects));
      this.dispatchProjectUpdate();
    }
  
    // Get all documents from active projects for RAG
    getActiveProjectDocuments(): ProjectDocument[] {
      return this.getAllProjects()
        .filter(project => project.isActive)
        .flatMap(project => project.documents);
    }
  
    // Get documents for a specific project
    getProjectDocuments(projectId: string): ProjectDocument[] {
      const project = this.getProject(projectId);
      return project?.documents || [];
    }
  
    // Check if a document exists in any project
    findDocumentInProjects(documentId: string): { projectId: string; document: ProjectDocument } | null {
      const projects = this.getAllProjects();
      for (const project of projects) {
        const document = project.documents.find(doc => doc.id === documentId);
        if (document) {
          return { projectId: project.id, document };
        }
      }
      return null;
    }

    onUpdate(callback: () => void) {
      this.onUpdateCallback = callback;
    }
  }
  
  export const projectStore = new ProjectStoreService();