import React, { useState, useEffect } from 'react';
import { FolderOpen, Upload, FileText, Loader2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Project, ProjectDocument } from '../../types/project';
import { Alert, AlertDescription } from '../ui/alert';
import { projectStore } from '../../services/projectStore';
import { improvedDocumentService } from '../../services/improvedDocumentService';

const ProjectManagement = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [processingFiles, setProcessingFiles] = useState<Record<string, { fileName: string; progress: number }>>({}); 
  const [error, setError] = useState<string | null>(null);

  // Enhanced project loading with proper event handling
  const loadProjects = () => {
    console.log('Loading projects...'); // Debug log
    const allProjects = projectStore.getAllProjects();
    console.log('Loaded projects:', allProjects); // Debug log
    setProjects(allProjects);
  };

  useEffect(() => {
    loadProjects();
    
    // Set up event listeners for project updates
    const handleProjectChange = () => {
      console.log('Project changed event received'); // Debug log
      loadProjects();
    };

    window.addEventListener('project-changed', handleProjectChange);
    window.addEventListener('project-updated', handleProjectChange);

    return () => {
      window.removeEventListener('project-changed', handleProjectChange);
      window.removeEventListener('project-updated', handleProjectChange);
    };
  }, []);

  const handleFileUpload = async (projectId: string, files: FileList) => {
    setError(null);

    for (const file of Array.from(files)) {
      try {
        // Add file to processing state
        setProcessingFiles(prev => ({
          ...prev,
          [file.name]: { fileName: file.name, progress: 0 }
        }));

        // Process the document
        const document = await improvedDocumentService.processDocument(
          file,
          projectId,
          (progress) => {
            setProcessingFiles(prev => ({
              ...prev,
              [file.name]: { fileName: file.name, progress }
            }));
          }
        );

        // Explicitly add document to project
        await projectStore.addDocumentToProject(projectId, document);
        console.log('Document added to project:', document); // Debug log

        // Remove from processing state
        setProcessingFiles(prev => {
          const { [file.name]: _, ...rest } = prev;
          return rest;
        });

        // Force reload projects
        loadProjects();

      } catch (err) {
        console.error('Error processing file:', err); // Debug log
        setError(`Failed to process ${file.name}: ${err}`);
      }
    }
  };

  const handleProjectToggle = async (projectId: string, active: boolean) => {
    try {
      await projectStore.updateProject(projectId, { isActive: active });
      loadProjects(); // Reload projects after toggle
    } catch (err) {
      setError(`Failed to toggle project: ${err}`);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {projects.map((project) => (
        <div key={project.id} className="border border-zinc-700 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">{project.name}</h3>
              {project.description && (
                <p className="text-zinc-400 text-sm">{project.description}</p>
              )}
            </div>
            <button
              onClick={() => handleProjectToggle(project.id, !project.isActive)}
              className={`p-2 rounded-lg transition-colors ${
                project.isActive ? 'text-blue-400 hover:text-blue-300' : 'text-zinc-400 hover:text-zinc-300'
              }`}
            >
              {project.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
            </button>
          </div>

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

          {/* Document List */}
          <div className="space-y-2">
            {project.documents && project.documents.length > 0 ? (
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
                    onClick={() => {
                      improvedDocumentService.deleteDocument(doc.id);
                      projectStore.removeDocumentFromProject(project.id, doc.id);
                      loadProjects();
                    }}
                    className="opacity-0 group-hover:opacity-100 text-zinc-400 
                             hover:text-red-400 transition-all duration-200"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center text-zinc-400 py-8">
                <FileText className="mx-auto mb-2 opacity-50" size={24} />
                <p className="text-sm">No documents in this project yet</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectManagement;