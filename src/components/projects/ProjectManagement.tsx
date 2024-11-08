import { useState, useEffect } from 'react';
import { Files, Edit2, Trash2, ToggleLeft, ToggleRight, FileText, Loader2, Upload } from 'lucide-react';
import { ProjectModal } from './ProjectModal';
import { Alert, AlertDescription } from '../ui/alert';
import { Project, ProjectDocument, CreateProjectInput } from '../../types/project';
import { projectStore } from '../../services/projectStore';
import { improvedDocumentService } from '../../services/improvedDocumentService';
import { v4 as uuidv4 } from 'uuid';
import { formatTimestamp } from '../../utils/formatTimestamp';

const ProjectManagement = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [processingFiles, setProcessingFiles] = useState<Record<string, { fileName: string; progress: number }>>({}); 
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Load projects with proper event handling
  const loadProjects = () => {
    const allProjects = projectStore.getAllProjects();
    setProjects(allProjects);
  };

  useEffect(() => {
    loadProjects();
    
    const handleProjectChange = () => loadProjects();

    window.addEventListener('project-changed', handleProjectChange);
    window.addEventListener('project-updated', handleProjectChange);

    return () => {
      window.removeEventListener('project-changed', handleProjectChange);
      window.removeEventListener('project-updated', handleProjectChange);
    };
  }, []);

  const handleDeleteProject = async (projectId: string) => {
    try {
      // Delete all documents in the project first
      const project = projects.find(p => p.id === projectId);
      if (project) {
        for (const doc of project.documents) {
          await improvedDocumentService.deleteDocument(doc.id);
        }
      }
      // Delete the project
      projectStore.deleteProject(projectId);
      loadProjects();
    } catch (err) {
      setError(`Failed to delete project: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleProjectToggle = async (projectId: string, active: boolean) => {
    try {
      await projectStore.updateProject(projectId, { isActive: active });
      loadProjects();
    } catch (err) {
      setError(`Failed to toggle project: ${err}`);
    }
  };

  const handleSaveProject = (projectData: CreateProjectInput) => {
    try {
      if (editingProject) {
        projectStore.updateProject(editingProject.id, projectData);
      } else {
        projectStore.createProject(projectData);
      }
      setIsModalOpen(false);
      setEditingProject(null);
      loadProjects();
    } catch (err) {
      setError(`Failed to save project: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const toggleProjectExpansion = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const handleDeleteDocument = async (projectId: string, documentId: string) => {
    try {
      await improvedDocumentService.deleteDocument(documentId);
      await projectStore.removeDocumentFromProject(projectId, documentId);
      loadProjects();
    } catch (err) {
      setError(`Failed to delete document: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleFileUpload = async (projectId: string, files: FileList) => {
    setError(null);

    for (const file of Array.from(files)) {
      try {
        // Add file to processing state
        setProcessingFiles(prev => ({
          ...prev,
          [file.name]: { fileName: file.name, progress: 0 }
        }));

        // Create document metadata
        const document: ProjectDocument = {
          id: uuidv4(),
          projectId,
          name: file.name,
          type: file.type,
          uploadedAt: new Date()
        };

        // Process the document
        await improvedDocumentService.processDocument(
          file,
          projectId,
          (progress) => {
            setProcessingFiles(prev => ({
              ...prev,
              [file.name]: { fileName: file.name, progress }
            }));
          }
        );

        // Add document to project
        await projectStore.addDocumentToProject(projectId, document);

        // Remove from processing state
        setProcessingFiles(prev => {
          const { [file.name]: _, ...rest } = prev;
          return rest;
        });

        // Expand the project to show the new file
        setExpandedProjects(prev => new Set([...prev, projectId]));

        // Reload projects to show new document
        loadProjects();

      } catch (err) {
        console.error('Error processing file:', err);
        setError(`Failed to process ${file.name}: ${err instanceof Error ? err.message : String(err)}`);
        
        // Remove from processing state on error
        setProcessingFiles(prev => {
          const { [file.name]: _, ...rest } = prev;
          return rest;
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Project List */}
      <div className="space-y-3">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-zinc-800/50 rounded-lg border border-zinc-700 hover:border-zinc-600 transition-colors"
          >
            {/* Project Header */}
            <div className="py-4 px-4 relative">
                {/* RAG Status Pill - Positioned absolutely in top right */}
                {project.isActive && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                    <span className="text-blue-400 text-xs font-medium">RAG Enabled</span>
                </div>
                )}

                <div className="flex items-center justify-between">
                <div className="flex-1">
                    <h4 className="text-white font-medium">{project.name}</h4>
                    {project.description && (
                    <p className="text-zinc-400 text-sm mt-1">{project.description}</p>
                    )}
                </div>
                
                {/* Project Actions */}
                <div className="flex items-center gap-2 ml-4">
                    <button
                    onClick={() => handleProjectToggle(project.id, !project.isActive)}
                    className={`p-2 rounded-lg transition-colors ${
                        project.isActive ? 'text-blue-400 hover:text-blue-300' : 'text-zinc-400 hover:text-zinc-300'
                    }`}
                    title={project.isActive ? 'Disable RAG' : 'Enable RAG'}
                    >
                    {project.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>
                    
                    <button
                    onClick={() => toggleProjectExpansion(project.id)}
                    className="p-2 text-zinc-400 hover:text-zinc-300 transition-colors rounded-lg"
                    title="Manage files"
                    >
                    <Files size={20} />
                    </button>
                    
                    <button
                    onClick={() => {
                        setEditingProject(project);
                        setIsModalOpen(true);
                    }}
                    className="p-2 text-zinc-400 hover:text-zinc-300 transition-colors rounded-lg"
                    title="Edit project"
                    >
                    <Edit2 size={20} />
                    </button>
                    
                    <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="p-2 text-zinc-400 hover:text-red-400 transition-colors rounded-lg"
                    title="Delete project"
                    >
                    <Trash2 size={20} />
                    </button>
                </div>
                </div>

                {/* Project Metadata Footer */}
                <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500 italic">
                <div className="flex items-center gap-1">
                    <FileText size={12} />
                    <span>{project.documents.length} file{project.documents.length !== 1 ? 's' : ''}</span>
                </div>
                <div>
                    Created {formatTimestamp(project.createdAt)}
                </div>
                {project.updatedAt.getTime() !== project.createdAt.getTime() && (
                    <div>
                    Last updated {formatTimestamp(project.updatedAt)}
                    </div>
                )}
                </div>
            </div>

            {/* Expandable Files Section */}
            {expandedProjects.has(project.id) && (
                <div className="border-t border-zinc-700">
                <div className="p-4 space-y-4">
                  {/* File Upload */}
                  <div className="relative">
                    <label 
                      className="flex items-center gap-2 px-4 py-2 border border-dashed border-zinc-700 
                              rounded-lg text-zinc-400 hover:text-zinc-300 hover:border-zinc-600 
                              transition-colors cursor-pointer"
                    >
                      <Upload size={16} />
                      <span>Upload Files</span>
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => e.target.files && handleFileUpload(project.id, e.target.files)}
                        accept=".txt,.md,.js,.jsx,.ts,.tsx,.py,.json,.yaml,.yml,.html,.css,.csv"
                      />
                    </label>
                  </div>

                  {/* Processing Files */}
                  {Object.entries(processingFiles).map(([fileName, { progress }]) => (
                    <div key={fileName} className="bg-zinc-800/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Loader2 className="animate-spin" size={16} />
                          <span className="text-zinc-300 text-sm">{fileName}</span>
                        </div>
                        <span className="text-zinc-400 text-sm">{Math.round(progress)}%</span>
                      </div>
                      <div className="h-1 bg-zinc-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  ))}

                  {/* Document List with max height and scrolling */}
                  <div className="max-h-[384px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                    {project.documents.length === 0 ? (
                      <div className="text-center text-zinc-400 py-8">
                        <FileText className="mx-auto mb-2 opacity-50" size={24} />
                        <p className="text-sm">No documents in this project yet</p>
                      </div>
                    ) : (
                      project.documents.map((doc) => (
                        <div 
                          key={doc.id}
                          className="group flex items-center justify-between p-3 bg-zinc-800/50 
                                  rounded-lg hover:bg-zinc-800 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <FileText size={16} className="text-zinc-400" />
                            <span className="text-zinc-300">{doc.name}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDocument(project.id, doc.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-zinc-400 
                                     hover:text-red-400 transition-all duration-200"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Project Creation/Edit Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProject(null);
        }}
        onSave={handleSaveProject}
        initialProject={editingProject || undefined}
      />
    </div>
  );
};

export default ProjectManagement;