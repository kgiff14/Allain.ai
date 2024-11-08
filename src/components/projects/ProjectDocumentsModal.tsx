// components/projects/ProjectDocumentsModal.tsx
import React, { useState } from 'react';
import { X, Upload, FileText, Loader2, Trash2 } from 'lucide-react';
import { ProjectDocument } from '../../types/project';
import { formatTimestamp } from '../../utils/formatTimestamp';
import { Alert, AlertDescription } from '../ui/alert';
import { improvedDocumentService } from '../../services/improvedDocumentService';
import { projectStore } from '../../services/projectStore';
import DocumentViewer from '../ui/DocumentViewer';

interface ProcessingFile {
  fileName: string;
  progress: number;
}

interface ProjectDocumentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    projectName: string;
    documents: ProjectDocument[];
    onAddDocument: (file: File, onProgress?: (progress: number) => void) => Promise<void>;
    onDeleteDocument: (documentId: string) => Promise<void>;
  }

interface FileProgress {
    fileName: string;
    progress: number;
  }
  
  const ProjectDocumentsModal = ({
    isOpen,
    onClose,
    projectId,
    projectName,
    documents,
    onAddDocument,
    onDeleteDocument,
  }: ProjectDocumentsModalProps) => {
    const [error, setError] = useState<string | null>(null);
    const [processingFiles, setProcessingFiles] = useState<Record<string, FileProgress>>({});
    const [selectedDocument, setSelectedDocument] = useState<ProjectDocument | null>(null);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
  
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
      
        setError(null);
      
        try {
          for (const file of Array.from(files)) {
            setProcessingFiles(prev => ({
              ...prev,
              [file.name]: { fileName: file.name, progress: 0 }
            }));
      
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
      
            // Remove from processing state when complete
            setProcessingFiles(prev => {
              const { [file.name]: _, ...rest } = prev;
              return rest;
            });
          }
        } catch (err) {
          console.error('Error processing documents:', err);
          setError(err instanceof Error ? err.message : 'Failed to process documents');
        }
      };

      const handleDeleteDocument = async (documentId: string, event?: React.MouseEvent) => {
        if (event) {
          event.stopPropagation();
        }
    
        try {
          setError(null);
          console.log('Initiating document deletion:', documentId);
          
          // First, remove from UI if document is selected
          if (selectedDocument?.id === documentId) {
            setSelectedDocument(null);
            setIsViewerOpen(false);
          }
    
          // Delete via service
          await improvedDocumentService.deleteDocument(documentId);
          
          console.log('Document deleted successfully');
    
          // Refresh project documents
          const updatedProject = projectStore.getProject(projectId);
          if (!updatedProject) {
            throw new Error('Project not found after deletion');
          }
    
        } catch (err) {
          console.error('Error deleting document:', err);
          setError(err instanceof Error ? err.message : 'Failed to delete document');
          throw err; // Re-throw to handle in parent components if needed
        }
      };
  
    // Render processing files section
    const renderProcessingFiles = () => {
      const files = Object.values(processingFiles);
      if (files.length === 0) return null;
  
      return (
        <div className="space-y-2 mb-4">
          {files.map(file => (
            <div key={file.fileName} className="bg-zinc-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={16} />
                  <span className="text-zinc-300 text-sm">{file.fileName}</span>
                </div>
                <span className="text-zinc-400 text-sm">{Math.round(file.progress)}%</span>
              </div>
              <div className="h-1 bg-zinc-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${file.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      );
    };
  
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-zinc-900 rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <FileText className="text-zinc-400" size={20} />
              <div>
                <h2 className="text-lg font-semibold text-white">Project Documents</h2>
                <p className="text-sm text-zinc-400">{projectName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-300 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
  
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* File Upload */}
            <div className="mb-6">
              <label 
                htmlFor="fileInput" 
                className="flex items-center justify-center gap-2 px-4 py-3 border-2 
                         border-dashed border-zinc-700 rounded-lg text-zinc-400 
                         hover:text-zinc-300 hover:border-zinc-600 transition-colors 
                         cursor-pointer"
              >
                <Upload size={20} />
                Upload Documents
              </label>
              <input
                id="fileInput"
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                multiple
                accept=".txt,.md,.js,.jsx,.ts,.tsx,.py,.json,.yaml,.yml,.html,.css,.csv"
              />
            </div>
  
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
  
            {/* Processing Files */}
            {renderProcessingFiles()}
  
            {/* Document List */}
            <div className="space-y-2">
            {documents.length === 0 ? (
                <div className="text-center text-zinc-400 py-8">
                <FileText className="mx-auto mb-4 opacity-50" size={32} />
                <p className="text-sm">
                    No documents in this project yet. Add documents to begin.
                </p>
                </div>
            ) : (
                <div className="space-y-2">
                {documents.map((doc) => (
                    <div 
                    key={doc.id}
                    className="group bg-zinc-800/50 rounded-lg p-3 flex items-center 
                            justify-between hover:bg-zinc-800 transition-colors cursor-pointer"
                    onClick={() => {
                        setSelectedDocument(doc);
                        setIsViewerOpen(true);
                    }}
                    >
                    <div className="flex items-center gap-3">
                        <FileText className="text-zinc-400" size={16} />
                        <div>
                        <div className="text-white">{doc.name}</div>
                        <div className="text-zinc-400 text-sm">
                            {formatTimestamp(doc.uploadedAt)}
                        </div>
                        </div>
                    </div>
                    <button
                        onClick={(e) => handleDeleteDocument(doc.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-zinc-400 
                                hover:text-red-400 transition-all duration-200"
                        aria-label="Delete document"
                    >
                        <Trash2 size={16} />
                    </button>
                    </div>
                ))}
                </div>
            )}

            {/* Document Viewer */}
            <DocumentViewer
                isOpen={isViewerOpen}
                onClose={() => {
                setIsViewerOpen(false);
                setSelectedDocument(null);
                }}
                document={selectedDocument}
                onDelete={handleDeleteDocument}
            />
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export default ProjectDocumentsModal;