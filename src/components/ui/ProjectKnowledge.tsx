import React, { useState, useEffect } from 'react';
import { Book, PlusCircle, Loader2, FileText, Trash2 } from 'lucide-react';
import { ProjectDocument } from '../../types';
import { formatTimestamp } from '../../utils/formatTimestamp';
import { documentStore } from '../../utils/documentStore';
import DocumentViewer from './DocumentViewer';
import { Alert, AlertDescription } from './alert';

interface ProjectKnowledgeProps {
  documents: ProjectDocument[];
  onAddDocument: (file: File) => Promise<void>;
}

export const ProjectKnowledge: React.FC<ProjectKnowledgeProps> = ({
  documents: initialDocuments,
  onAddDocument
}) => {
  const [documents, setDocuments] = useState<ProjectDocument[]>(initialDocuments);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<ProjectDocument | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [processingFiles, setProcessingFiles] = useState<string[]>([]);

  useEffect(() => {
    setDocuments(initialDocuments);
  }, [initialDocuments]);

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
        await onAddDocument(file);
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
      await documentStore.deleteDocument(documentId);
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      
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
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <Book className="text-white" size={20} />
          <span className="text-white font-medium">Project knowledge</span>
        </div>
        <label 
          htmlFor="add-document" 
          className={`text-blue-400 flex items-center gap-1 hover:text-blue-300 transition-colors ${
            isProcessing ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          }`}
        >
          {isProcessing ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <PlusCircle size={16} />
          )}
          Add Content
        </label>
        <input
          type="file"
          id="add-document"
          className="hidden"
          onChange={handleFileUpload}
          disabled={isProcessing}
          multiple // Enable multiple file selection
        />
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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

      {documents.length === 0 ? (
        <div className="text-center text-zinc-400 mt-24">
          <Book className="mx-auto mb-4 opacity-50" size={32} />
          <p className="text-sm">
            No knowledge added yet. Add PDFs, documents, or other text to the project knowledge base.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div 
              key={doc.id} 
              className="group bg-zinc-800/50 rounded-lg p-3 flex items-center justify-between hover:bg-zinc-800 transition-colors cursor-pointer"
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
                className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-400 transition-all duration-200"
                aria-label="Delete document"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

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