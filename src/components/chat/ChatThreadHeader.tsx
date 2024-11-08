import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Settings2, FolderOpen, HardDrive, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ConfigDrawer from '../ui/ConfigDrawer';
import { MemoryIndicator } from '../memories/MemoryIndicator';
import { MemoriesModal } from '../memories/MemoriesModal';
import { MemoryManagementDrawer } from '../ui/MemoryManagementDrawer';
import { usePersona } from '../../hooks/usePersona';
import { projectStore } from '../../services/projectStore';
import { personaStore } from '../../services/personaStore';
import { Alert } from '../ui/alert';

export const ChatThreadHeader: React.FC<{ 
  currentChatId: string | null; 
  onDeleteChat: () => void 
}> = ({ 
  currentChatId, 
  onDeleteChat 
}) => {
  const navigate = useNavigate();
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [isMemoriesModalOpen, setIsMemoriesModalOpen] = useState(false);
  const [showProjectInfo, setShowProjectInfo] = useState(false);
  const [newMemoryId, setNewMemoryId] = useState<string>();
  const persona = usePersona();
  const [activeProjects, setActiveProjects] = useState<{ id: string; name: string; }[]>([]);

  // Define loadActiveProjects
  const loadActiveProjects = useCallback(() => {
    const projects = projectStore.getAllProjects()
      .filter(p => p.isActive)
      .map(({ id, name }) => ({ id, name }));
    setActiveProjects(projects);
  }, []);

  useEffect(() => {
    // Add memory event listener
    const handleMemoryCreated = (event: CustomEvent<{ memoryId: string }>) => {
      setNewMemoryId(event.detail.memoryId);
      // Clear notification after delay
      setTimeout(() => {
        setNewMemoryId(undefined);
      }, 3000);
    };

    loadActiveProjects(); // Initial load
    
    window.addEventListener('memory-created', handleMemoryCreated as EventListener);
    window.addEventListener('project-changed', loadActiveProjects);
    window.addEventListener('project-updated', loadActiveProjects);

    return () => {
      window.removeEventListener('memory-created', handleMemoryCreated as EventListener);
      window.removeEventListener('project-changed', loadActiveProjects);
      window.removeEventListener('project-updated', loadActiveProjects);
    };
  }, [loadActiveProjects]);

  const handleAddMemory = (content: string) => {
    const memoryId = Date.now().toString();
    personaStore.addMemory(persona.id, {
      content,
      createdAt: new Date(),
      source: 'manual'
    });
    setNewMemoryId(memoryId);
  };

  const handleDeleteMemory = (memoryId: string) => {
    personaStore.removeMemory(persona.id, memoryId);
  };

  const handleUpdateMemoryConfig = (config: any) => {
    personaStore.updateMemoryConfig(persona.id, config);
  };

  return (
    <>
      <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur sticky top-0 z-10">
        <div className="relative w-full">
          {/* System Icons - Absolute Positioned */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-7 z-2">
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
            <div className="flex items-center">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors duration-200"
              >
                <ArrowLeft size={20} />
              </button>
            </div>

            <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-3">
              <MemoryIndicator
                persona={persona}
                onOpenMemories={() => setIsMemoriesModalOpen(true)}
                newMemoryId={newMemoryId}
              />
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
            
            <div className="flex-shrink-0">
              <button
                onClick={onDeleteChat}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                <Trash2 size={17}/>
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

      {/* Drawers and Modals */}
      <ConfigDrawer 
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
      />
      <MemoryManagementDrawer
        isOpen={isMemoryOpen}
        onClose={() => setIsMemoryOpen(false)}
      />
      <MemoriesModal
        isOpen={isMemoriesModalOpen}
        onClose={() => setIsMemoriesModalOpen(false)}
        persona={persona}
        onAddMemory={handleAddMemory}
        onDeleteMemory={handleDeleteMemory}
        onUpdateMemoryConfig={handleUpdateMemoryConfig}
      />
    </>
  );
};