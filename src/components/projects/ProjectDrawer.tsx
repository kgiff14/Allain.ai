// components/projects/ProjectDrawer.tsx
import React, { useState } from 'react';
import { X, FolderOpen, Plus } from 'lucide-react';
import { ProjectModal } from './ProjectModal';
import ProjectManagement from './ProjectManagement';  // Import our new component
import { CreateProjectInput } from '../../types/project';
import ConfirmDialog from '../ui/ConfirmDialog';
import { Alert, AlertDescription } from '../ui/alert';
import { projectStore } from '../../services/projectStore';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    projectId: string | null;
    projectName: string;
  }>({
    isOpen: false,
    projectId: null,
    projectName: ''
  });

  const handleCreateProject = () => {
    setIsModalOpen(true);
  };

  const handleProjectSave = (projectData: CreateProjectInput) => {
    try {
      projectStore.createProject({
        name: projectData.name,
        description: projectData.description,
        isActive: projectData.isActive ?? false
      });
      setError(null);
    } catch (err) {
      setError('Failed to save project');
      console.error('Error saving project:', err);
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
            <button
              onClick={handleCreateProject}
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
                <Plus size={16} />
              New Project
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <ProjectManagement />
          </div>
        </div>
      </div>

      {/* Project Creation Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleProjectSave}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation(prev => ({ ...prev, isOpen: false }))}
        onConfirm={() => {
          if (deleteConfirmation.projectId) {
            projectStore.deleteProject(deleteConfirmation.projectId);
          }
          setDeleteConfirmation({ isOpen: false, projectId: null, projectName: '' });
        }}
        title="Delete Project"
        message={`Are you sure you want to delete the project "${deleteConfirmation.projectName}"? 
                This will also remove all documents associated with this project. 
                This action cannot be undone.`}
      />
    </>
  );
};