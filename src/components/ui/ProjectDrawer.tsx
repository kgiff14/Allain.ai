import React from 'react';
import { X, Book } from 'lucide-react';
import { ProjectKnowledge } from './ProjectKnowledge';
import { ProjectDocument } from '../../types';

interface ProjectDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  documents: ProjectDocument[];
  onAddDocument: (file: File) => Promise<void>;
}

export const ProjectDrawer: React.FC<ProjectDrawerProps> = ({
  isOpen,
  onClose,
  onOpen,
  documents,
  onAddDocument
}) => {
  return (
    <>
      {/* Toggle Button - Now moves with drawer */}
      <button
        onClick={isOpen ? onClose : onOpen}
        className={`fixed z-50 p-2 text-zinc-400 hover:text-white transition-all duration-300 transform top-2.5 ${
          isOpen ? 'right-96' : 'right-8'
        }`}
        aria-label={isOpen ? "Close project drawer" : "Open project drawer"}
      >
        {isOpen ? <X size={20} /> : <Book size={20} />}
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
        className={`fixed right-0 top-0 w-96 h-full bg-zinc-900 border-l border-zinc-800 z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full overflow-y-auto">
          <ProjectKnowledge
            documents={documents}
            onAddDocument={onAddDocument}
          />
        </div>
      </div>
    </>
  );
};

export default ProjectDrawer;