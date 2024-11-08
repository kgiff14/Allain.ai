import React, { useState, useCallback } from 'react';
import { X, Upload, FileText, Loader2, Trash2 } from 'lucide-react';
import { ProjectDocument } from '../../types/project';
import { formatTimestamp } from '../../utils/formatTimestamp';
import { Alert, AlertDescription } from '../ui/alert';
import { getFileExtension } from '../../utils/fileTypes';

interface ProjectDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  documents: ProjectDocument[];
  onAddDocument: (file: File) => Promise<void>;
  onDeleteDocument: (documentId: string) => Promise<void>;
  processingFiles: string[];
}

const ProjectDocumentsModal = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  documents,
  onAddDocument,
  onDeleteDocument
}: ProjectDocumentsModalProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingFiles, setProcessingFiles] = useState<string[]>([]);
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      const fileArray = Array.from(files);
      setProcessingFiles(fileArray.map(f => f.name));

      // Process files sequentially
      for (const file of fileArray) {
        if (!getFileExtension(file.name)) {
          throw new Error(`Unsupported file type: ${file.name}`);
        }
        await onAddDocument(file);
        setProcessingFiles(prev => prev.filter(name => name !== file.name));
      }
    } catch (err) {
      console.error('Error processing documents:', err);
      setError(err instanceof Error ? err.message : 'Failed to process documents');
    } finally {
      setIsProcessing(false);
      setProcessingFiles([]);
      // Reset the input value to allow uploading the same file again
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleDeleteDocument = useCallback(async (documentId: string) => {
    try {
      await onDeleteDocument(documentId);
    } catch (err) {
      console.error('Error deleting document:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    }
  }, [onDeleteDocument]);

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
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* File Upload */}
          <div className="mb-6">
            <label 
              htmlFor="fileInput" 
              className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed 
                       border-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-300 
                       hover:border-zinc-600 transition-colors cursor-pointer
                       ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isProcessing ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Upload size={20} />
              )}
              Upload Documents
            </label>
            <input
              id="fileInput"
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isProcessing}
              multiple
              accept=".txt,.md,.js,.jsx,.ts,.tsx,.py,.json,.yaml,.yml,.html,.css,.csv"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Processing Files Indicator */}
          {processingFiles.length > 0 && (
            <div className="bg-zinc-800/50 rounded-lg p-4">
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
          <div className="space-y-2">
            {documents.length === 0 ? (
              <div className="text-center text-zinc-400 py-8">
                <FileText className="mx-auto mb-4 opacity-50" size={32} />
                <p className="text-sm">No documents in this project yet.</p>
              </div>
            ) : (
              documents.map((doc) => (
                <div 
                  key={doc.id}
                  className="group bg-zinc-800/50 rounded-lg p-4 flex items-center justify-between"
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
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="opacity-0 group-hover:opacity-100 text-zinc-400 
                             hover:text-red-400 transition-all duration-200"
                    aria-label="Delete document"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDocumentsModal;