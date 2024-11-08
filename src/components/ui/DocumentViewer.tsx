import React, { useState, useEffect } from 'react';
import { X, Trash2, FileText, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { ProjectDocument } from '../../types/types';

interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  document: ProjectDocument | null;
  onDelete: (documentId: string) => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ 
  isOpen, 
  onClose, 
  document, 
  onDelete 
}) => {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      if (!document) return;
      
      try {
        setIsLoading(true);
        const response = await window.fs.readFile(document.name, { encoding: 'utf8' });
        setContent(response);
        setError(null);
      } catch (err) {
        setError('Failed to load document content');
        console.error('Error loading document:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && document) {
      loadContent();
    }
  }, [isOpen, document]);

  if (!isOpen || !document) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <FileText className="text-zinc-400" size={20} />
            <h2 className="text-lg font-semibold text-white">{document.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDelete(document.id)}
              className="p-2 text-red-400 hover:text-red-300 rounded-lg transition-colors"
              aria-label="Delete document"
            >
              <Trash2 size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-300 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="animate-spin text-zinc-400" size={24} />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <pre className="text-zinc-300 font-mono text-sm whitespace-pre-wrap">
              {content}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;