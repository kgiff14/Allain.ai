// components/projects/ProjectModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Save, FolderOpen } from 'lucide-react';
import { Project, CreateProjectInput } from '../../types/project';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectData: CreateProjectInput) => void;
  initialProject?: Project;
  title?: string;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProject,
  title = 'Create New Project'
}) => {
  const [projectData, setProjectData] = useState<CreateProjectInput>({
    name: '',
    description: '',
    isActive: false
  });

  // Reset form when modal opens/closes or initialProject changes
  useEffect(() => {
    if (initialProject) {
      setProjectData({
        name: initialProject.name,
        description: initialProject.description || '',
        isActive: initialProject.isActive
      });
    } else {
      setProjectData({
        name: '',
        description: '',
        isActive: false
      });
    }
  }, [initialProject, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(projectData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-lg w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <FolderOpen className="text-zinc-400" size={20} />
            <h2 className="text-lg font-semibold text-white">
              {initialProject ? 'Edit Project' : title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-300 transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Project Name */}
          <div className="space-y-2">
            <label htmlFor="projectName" className="block text-sm font-medium text-zinc-300">
              Project Name
            </label>
            <input
              id="projectName"
              type="text"
              value={projectData.name}
              onChange={(e) => setProjectData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md 
                       text-white placeholder-zinc-500 focus:outline-none focus:ring-2 
                       focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter project name"
              required
            />
          </div>

          {/* Project Description */}
          <div className="space-y-2">
            <label htmlFor="projectDescription" className="block text-sm font-medium text-zinc-300">
              Description
            </label>
            <textarea
              id="projectDescription"
              value={projectData.description}
              onChange={(e) => setProjectData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md 
                       text-white placeholder-zinc-500 focus:outline-none focus:ring-2 
                       focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Enter project description (optional)"
              rows={4}
            />
          </div>

          {/* Active in RAG Toggle */}
          <div className="flex items-center space-x-3">
            <input
              id="projectActive"
              type="checkbox"
              checked={projectData.isActive}
              onChange={(e) => setProjectData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="h-4 w-4 text-blue-500 bg-zinc-800 border-zinc-700 
                       rounded focus:ring-blue-500 focus:ring-offset-zinc-900"
            />
            <label htmlFor="projectActive" className="text-sm text-zinc-300">
              Enable for RAG (include in context for chat)
            </label>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-zinc-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 text-blue-600 hover:text-white rounded-md 
                     transition-colors flex items-center gap-2"
            disabled={!projectData.name.trim()}
          >
            <Save size={16} />
            {initialProject ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
};