// components/projects/ProjectDrawer.tsx
import React, { useState, useEffect } from 'react';
import { X, FolderOpen } from 'lucide-react';
import { Project, CreateProjectInput } from '../../types/project';
import { ProjectsList } from './ProjectsList';
import { ProjectModal } from './ProjectModal';
import { projectStore } from '../../services/projectStore';
import { documentStore } from '../../utils/documentStore';
import { documentProcessingService } from '../../services/enhancedDocumentParsingService';
import ConfirmDialog from '../ui/ConfirmDialog';
import { Alert, AlertDescription } from '../ui/alert';

interface ProjectDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

export const ProjectDrawer: React.FC<ProjectDrawerProps> = ({
  isOpen,
  onClose,
  onOpen,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjects, setActiveProjects] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [processingFiles, setProcessingFiles] = useState<string[]>([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    projectId: string | null;
    projectName: string;
  }>({
    isOpen: false,
    projectId: null,
    projectName: ''
  });

  // Load projects
  useEffect(() => {
    const loadProjects = () => {
      const allProjects = projectStore.getAllProjects();
      setProjects(allProjects);
      setActiveProjects(allProjects.filter(p => p.isActive).map(p => p.id));
    };

    loadProjects();
    window.addEventListener('project-changed', loadProjects);
    window.addEventListener('project-updated', loadProjects);

    return () => {
      window.removeEventListener('project-changed', loadProjects);
      window.removeEventListener('project-updated', loadProjects);
    };
  }, []);

  const handleCreateProject = () => {
    setSelectedProject(undefined);
    setIsModalOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleProjectSave = (projectData: CreateProjectInput) => {
    try {
      if (selectedProject) {
        projectStore.updateProject(selectedProject.id, {
          name: projectData.name,
          description: projectData.description,
          isActive: projectData.isActive ?? false
        });
      } else {
        projectStore.createProject({
          name: projectData.name,
          description: projectData.description,
          isActive: projectData.isActive ?? false
        });
      }
      setError(null);
    } catch (err) {
      setError('Failed to save project');
      console.error('Error saving project:', err);
    }
  };

  const handleProjectDelete = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setDeleteConfirmation({
        isOpen: true,
        projectId: projectId,
        projectName: project.name
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmation.projectId) {
      try {
        await projectStore.deleteProject(deleteConfirmation.projectId);
        setError(null);
      } catch (err) {
        setError('Failed to delete project');
        console.error('Error deleting project:', err);
      } finally {
        setDeleteConfirmation({ isOpen: false, projectId: null, projectName: '' });
      }
    }
  };

  const handleProjectToggle = (projectId: string, active: boolean) => {
    try {
      projectStore.updateProject(projectId, { isActive: active });
      setError(null);
    } catch (err) {
      setError('Failed to update project status');
      console.error('Error toggling project:', err);
    }
  };

  const handleAddDocument = async (projectId: string, file: File): Promise<void> => {
    try {
      setError(null);
      setProcessingFiles(prev => [...prev, file.name]);

      // Process document
      const document = await documentProcessingService.processDocument(file, projectId, {
        onProgress: (progress) => {
          console.log(`Processing ${file.name}: ${progress}%`);
        }
      });

      // Add document to project
      await projectStore.addDocumentToProject(projectId, document);

      setProcessingFiles(prev => prev.filter(name => name !== file.name));
    } catch (err) {
      setError('Failed to add document');
      console.error('Error adding document:', err);
      setProcessingFiles(prev => prev.filter(name => name !== file.name));
      throw err;
    }
  };

  const handleDeleteDocument = async (projectId: string, documentId: string): Promise<void> => {
    try {
      setError(null);
      await documentStore.deleteDocument(documentId);
      projectStore.removeDocumentFromProject(projectId, documentId);
    } catch (err) {
      setError('Failed to delete document');
      console.error('Error deleting document:', err);
      throw err;
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={isOpen ? onClose : onOpen}
        className={`fixed z-50 p-2 text-zinc-400 hover:text-white transition-all duration-300 
                   transform top-2.5 ${isOpen ? 'right-96' : 'right-8'}`}
        aria-label={isOpen ? "Close project drawer" : "Open project drawer"}
      >
        {isOpen ? <X size={20} /> : <FolderOpen size={20} />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      
      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 w-96 h-full bg-zinc-900 border-l border-zinc-800 
                   z-40 transform transition-transform duration-300 ease-in-out 
                   ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <FolderOpen className="text-zinc-400" size={20} />
              <h2 className="text-lg font-semibold text-white">Projects</h2>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <ProjectsList
              projects={projects}
              activeProjects={activeProjects}
              onProjectSelect={() => {}} // Implement if needed
              onProjectEdit={handleEditProject}
              onProjectDelete={handleProjectDelete}
              onProjectToggle={handleProjectToggle}
              onCreateProject={handleCreateProject}
              onAddDocument={handleAddDocument}
              onDeleteDocument={handleDeleteDocument}
            />
          </div>
        </div>
      </div>

      {/* Project Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleProjectSave}
        initialProject={selectedProject}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmDelete}
        title="Delete Project"
        message={`Are you sure you want to delete the project "${deleteConfirmation.projectName}"? 
                This will also remove all documents associated with this project. 
                This action cannot be undone.`}
      />
    </>
  );
};