// components/projects/ProjectsList.tsx
import React, { useState } from 'react';
import { Edit2, Trash2, FolderOpen, FileText, ToggleLeft, ToggleRight, Files, Loader2 } from 'lucide-react';
import { Project, ProjectDocument } from '../../types/project';
import { formatTimestamp } from '../../utils/formatTimestamp';
import ProjectDocumentsModal from './ProjectDocumentsModal';

interface ProcessingFile {
  fileName: string;
  progress: number;
}

interface ProjectsListProps {
  projects: Project[];
  activeProjects: string[];
  onProjectSelect: (projectId: string) => void;
  onProjectEdit: (project: Project) => void;
  onProjectDelete: (projectId: string) => void;
  onProjectToggle: (projectId: string, active: boolean) => void;
  onCreateProject: () => void;
  onAddDocument: (projectId: string, file: File, onProgress?: (progress: number) => void) => Promise<void>;
  onDeleteDocument: (projectId: string, documentId: string) => Promise<void>;
}

export const ProjectsList: React.FC<ProjectsListProps> = ({
  projects,
  activeProjects,
  onProjectSelect,
  onProjectEdit,
  onProjectDelete,
  onProjectToggle,
  onCreateProject,
  onAddDocument,
  onDeleteDocument,
}) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [processingFiles, setProcessingFiles] = useState<Record<string, ProcessingFile>>({});
  const [error, setError] = useState<string | null>(null);

  const handleAddDocument = async (file: File) => {
    if (!selectedProject) return;
    
    try {
      setError(null);
      // Add file to processing state with 0 progress
      setProcessingFiles(prev => ({
        ...prev,
        [file.name]: { fileName: file.name, progress: 0 }
      }));

      await onAddDocument(
        selectedProject.id, 
        file,
        (progress: number) => {
          // Ensure the progress update triggers a re-render
          setProcessingFiles(prev => ({
            ...prev,
            [file.name]: { 
              fileName: file.name, 
              progress: Math.round(progress) 
            }
          }));
        }
      );

      // Remove file from processing state when complete
      setProcessingFiles(prev => {
        const newState = { ...prev };
        delete newState[file.name];
        return newState;
      });

    } catch (err) {
      console.error('Error adding document:', err);
      setError(err instanceof Error ? err.message : 'Failed to add document');
      
      // Remove file from processing state on error
      setProcessingFiles(prev => {
        const newState = { ...prev };
        delete newState[file.name];
        return newState;
      });
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!selectedProject) return;

    try {
      setError(null);
      await onDeleteDocument(selectedProject.id, documentId);
    } catch (err) {
      console.error('Error deleting document:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    }
  };

  // Function to get all processing files for a specific project
  const getProjectProcessingFiles = (projectId: string) => {
    return selectedProject?.id === projectId ? Object.values(processingFiles) : [];
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">Projects</h3>
          <button
            onClick={onCreateProject}
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <FolderOpen size={16} />
            New Project
          </button>
        </div>

        <div className="space-y-2">
          {projects.map((project) => (
            <div
              key={project.id}
              className="group p-4 rounded-lg border border-zinc-700 hover:border-zinc-600 
                       bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{project.name}</span>
                    <span className="text-zinc-400 text-sm">
                      ({project.documents.length} files)
                    </span>
                  </div>
                  
                  {project.description && (
                    <p className="text-zinc-400 text-sm mt-1">
                      {project.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                    <span>Created {formatTimestamp(project.createdAt)}</span>
                    <span>Updated {formatTimestamp(project.updatedAt)}</span>
                  </div>

                  {/* Processing Files Indicator */}
                  {getProjectProcessingFiles(project.id).map(file => (
                    <div key={file.fileName} className="mt-2 bg-zinc-700/30 rounded-lg p-2">
                      <div className="flex items-center gap-2 text-sm text-zinc-300">
                        <Loader2 className="animate-spin" size={12} />
                        <span>{file.fileName}</span>
                        <span className="text-zinc-400">
                          {Math.round(file.progress)}%
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-1 h-1 bg-zinc-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onProjectToggle(project.id, !activeProjects.includes(project.id))}
                    className={`p-1 transition-colors ${
                      activeProjects.includes(project.id)
                        ? 'text-blue-400 hover:text-blue-300'
                        : 'text-zinc-400 hover:text-zinc-300'
                    }`}
                    title={activeProjects.includes(project.id) ? 'Disable RAG' : 'Enable RAG'}
                  >
                    {activeProjects.includes(project.id) ? (
                      <ToggleRight size={20} />
                    ) : (
                      <ToggleLeft size={20} />
                    )}
                  </button>

                  <button
                    onClick={() => setSelectedProject(project)}
                    className="p-1 text-zinc-400 hover:text-white transition-colors"
                    title="Manage documents"
                  >
                    <Files size={16} />
                  </button>

                  <button
                    onClick={() => onProjectEdit(project)}
                    className="p-1 text-zinc-400 hover:text-white transition-colors"
                    title="Edit project"
                  >
                    <Edit2 size={16} />
                  </button>

                  <button
                    onClick={() => onProjectDelete(project.id)}
                    className="p-1 text-zinc-400 hover:text-red-400 transition-colors"
                    title="Delete project"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {project.documents.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {project.documents.slice(0, 3).map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-1 px-2 py-1 bg-zinc-700/50 
                               rounded text-zinc-300 text-xs"
                    >
                      <FileText size={12} />
                      <span>{doc.name}</span>
                    </div>
                  ))}
                  {project.documents.length > 3 && (
                    <div className="px-2 py-1 bg-zinc-700/50 rounded text-zinc-300 text-xs">
                      +{project.documents.length - 3} more
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {projects.length === 0 && (
            <div className="text-center text-zinc-400 py-8">
              <FolderOpen className="mx-auto mb-4 opacity-50" size={32} />
              <p className="text-sm">
                No projects yet. Create a project to organize your documents.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Documents Modal */}
      {selectedProject && (
        <ProjectDocumentsModal
          isOpen={true}
          onClose={() => setSelectedProject(null)}
          projectId={selectedProject.id}
          projectName={selectedProject.name}
          documents={selectedProject.documents}
          onAddDocument={handleAddDocument}
          onDeleteDocument={handleDeleteDocument}
        />
      )}
    </>
  );
};