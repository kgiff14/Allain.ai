import React, { useState } from 'react';
import { Loader2, FileText, Trash2, Upload } from 'lucide-react';
import { ProjectDocument } from '../../types/project';
import { formatTimestamp } from '../../utils/formatTimestamp';
import { projectStore } from '../../services/projectStore';
import { Alert, AlertDescription } from '../ui/alert';
import DocumentViewer from '../ui/DocumentViewer';

interface ProjectKnowledgeProps {
  projectId: string;
  onAddDocument: (file: File, projectId: string) => Promise<void>;
}

export const ProjectKnowledge: React.FC<ProjectKnowledgeProps> = ({
  projectId,
  onAddDocument
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<ProjectDocument | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [processingFiles, setProcessingFiles] = useState<string[]>([]);

  // Get project and its documents
  const project = projectStore.getProject(projectId);
  const documents = project?.documents || [];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Convert FileList to Array for easier processing
      const fileArray = Array.from(files);
      setProcessingFiles(fileArray.map(f => f.name));

      // Process files sequentially
      for (const file of fileArray) {
        await onAddDocument(file, projectId);
        setProcessingFiles(prev => prev.filter(name => name !== file.name));
      }
    } catch (err) {
      console.error('Error processing documents:', err);
      setError(err instanceof Error ? err.message : 'Failed to process documents');
    } finally {
      setIsProcessing(false);
      setProcessingFiles([]);
    }
  };

  const handleDeleteDocument = async (documentId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }

    try {
      await projectStore.removeDocumentFromProject(projectId, documentId);
      
      if (selectedDocument?.id === documentId) {
        setSelectedDocument(null);
        setIsViewerOpen(false);
      }
    } catch (err) {
      console.error('Error deleting document:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    }
  };

  return (
    <div>
      {/* File Upload */}
      <div className="mb-6">
        <label 
          htmlFor="add-document" 
          className={`flex items-center gap-2 px-4 py-2 border border-dashed 
                     border-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-300 
                     hover:border-zinc-600 transition-colors cursor-pointer
                     ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isProcessing ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Upload size={16} />
          )}
          Add Documents to Project
        </label>
        <input
          type="file"
          id="add-document"
          className="hidden"
          onChange={handleFileUpload}
          disabled={isProcessing}
          multiple
          accept=".txt,.md,.js,.jsx,.ts,.tsx,.py,.json,.yaml,.yml,.html,.css,.csv"
        />
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Processing Files Indicator */}
      {processingFiles.length > 0 && (
        <div className="mb-4 p-3 bg-zinc-800/50 rounded-lg">
          <div className="text-zinc-400 text-sm mb-2">Processing files:</div>
          {processingFiles.map(filename => (
            <div key={filename} className="flex items-center gap-2 text-zinc-300 text-sm">
              <Loader2 className="animate-spin" size={12} />
              {filename}
            </div>
          ))}
        </div>
      )}

      {/* Document List */}
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
  );
};