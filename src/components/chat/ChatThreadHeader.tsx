import React, { useState, useEffect } from 'react';
import { ArrowLeft, Settings2, FolderOpen, HardDrive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ConfigDrawer from '../ui/ConfigDrawer';
import { MemoryManagementDrawer } from '../ui/MemoryManagementDrawer';
import { usePersona } from '../../hooks/usePersona';
import { projectStore } from '../../services/projectStore';
import { Alert } from '../ui/alert';

// Thread page header (with back and delete buttons)
export const ChatThreadHeader: React.FC<{ currentChatId: string | null; onDeleteChat: () => void }> = ({ 
  currentChatId, 
  onDeleteChat 
}) => {
  const navigate = useNavigate();
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [showProjectInfo, setShowProjectInfo] = useState(false);
  const persona = usePersona();
  const [activeProjects, setActiveProjects] = useState<{ id: string; name: string; }[]>([]);

  useEffect(() => {
    const loadActiveProjects = () => {
      const projects = projectStore.getAllProjects()
        .filter(p => p.isActive)
        .map(({ id, name }) => ({ id, name }));
      setActiveProjects(projects);
    };

    loadActiveProjects();
    window.addEventListener('project-changed', loadActiveProjects);
    window.addEventListener('project-updated', loadActiveProjects);

    return () => {
      window.removeEventListener('project-changed', loadActiveProjects);
      window.removeEventListener('project-updated', loadActiveProjects);
    };
  }, []);

  return (
    <>
      <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur sticky top-0 z-10">
        <div className="relative w-full">
          {/* System Icons - Absolute Positioned */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-3 z-20">
            <button
              onClick={() => setIsConfigOpen(true)}
              className="text-zinc-400 hover:text-white transition-colors duration-200"
              aria-label="Open configuration"
            >
              <Settings2 size={20} />
            </button>
            <button
              onClick={() => setIsMemoryOpen(true)}
              className="text-zinc-400 hover:text-white transition-colors duration-200"
              aria-label="Memory management"
            >
              <HardDrive size={20} />
            </button>
          </div>

          <div className="max-w-[980px] mx-auto w-full px-4 md:px-8 py-4 flex items-center justify-between">
            {/* Back Button - With left margin to account for absolute positioned icons */}
            <div className="flex items-center ">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors duration-200"
              >
                <ArrowLeft size={20} />
              </button>
            </div>

            {/* Center - Dynamic Title & RAG Status */}
            <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-3">
              <span className="text-white font-semibold">{persona.name}</span>
              {activeProjects.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowProjectInfo(!showProjectInfo)}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm bg-zinc-800/50 px-2 py-1 rounded"
                  >
                    <FolderOpen size={14} />
                    <span>{activeProjects.length} active project{activeProjects.length !== 1 ? 's' : ''}</span>
                  </button>

                  {showProjectInfo && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-zinc-800 border border-zinc-700 rounded-lg p-3 shadow-lg z-30">
                      <div className="text-sm text-zinc-300 mb-2">
                        Active projects used for context:
                      </div>
                      <div className="space-y-1">
                        {activeProjects.map(project => (
                          <div key={project.id} className="text-sm text-zinc-400 flex items-center gap-2">
                            <FolderOpen size={12} />
                            <span>{project.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Right side - Delete Button */}
            <div className="flex-shrink-0">
              <button
                onClick={onDeleteChat}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                Delete Chat
              </button>
            </div>
          </div>
        </div>

        {/* Project Warning */}
        {activeProjects.length === 0 && (
          <div className="max-w-xl mx-auto px-4 md:px-8 pb-4">
            <Alert>
              <span>No active projects. Enable projects in the settings to use your documents for context.</span>
            </Alert>
          </div>
        )}
      </div>

      {/* Drawers */}
      <ConfigDrawer 
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
      />
      <MemoryManagementDrawer
        isOpen={isMemoryOpen}
        onClose={() => setIsMemoryOpen(false)}
      />
    </>
  );
};