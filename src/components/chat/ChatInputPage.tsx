// components/chat/ChatInputPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings2, FolderOpen, Info } from 'lucide-react';
import ChatInput from './ChatInput';
import { ChatHistory } from './ChatHistory';
import { ProjectDrawer } from '../projects/ProjectDrawer';
import ConfigDrawer from '../ui/ConfigDrawer';
import { Chat } from '../../types/types';
import { chatStore } from '../../utils/chatStore';
import { Model } from './ModelSelector';
import { usePersona } from '../../hooks/usePersona';
import { projectStore } from '../../services/projectStore';

const ChatInputPage: React.FC = () => {
  const navigate = useNavigate();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isProjectDrawerOpen, setIsProjectDrawerOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const persona = usePersona();
  const [activeProjects, setActiveProjects] = useState<{ id: string; name: string; }[]>([]);
  const [showProjectInfo, setShowProjectInfo] = useState(false);

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

  // Load existing chats
  const loadChats = () => {
    const storedChats = chatStore.getAllChats();
    setChats(storedChats);
  };

  useEffect(() => {
    loadChats();
    // Initialize project store
    projectStore.init();
  }, []);

  const handleSendMessage = async (content: string, model: Model, attachments?: File[]) => {
    navigate('/response', {
      state: {
        initialMessage: content,
        initialModel: model,
        initialAttachments: attachments
      }
    });
  };

  const handleSelectChat = (chatId: string) => {
    navigate(`/chat/${chatId}`);
  };

  return (
    <div className="h-screen bg-zinc-900 flex flex-col">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur sticky top-0 z-10">
        <div className="relative w-full">
          <div className="max-w-16xl mx-auto w-full px-4 md:px-8 py-4 flex items-center justify-between">
            {/* Left side - Config button */}
            <button
              onClick={() => setIsConfigOpen(true)}
              className="text-zinc-400 hover:text-white transition-colors duration-200"
              aria-label="Open configuration"
            >
              <Settings2 size={20} />
            </button>

            {/* Center - Dynamic Title */}
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
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-zinc-800 border border-zinc-700 rounded-lg p-3 shadow-lg">
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
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Chat Input */}
          <div className="rounded-lg">
            <ChatInput 
              onSendMessage={handleSendMessage}
            />
          </div>

          {/* Chat History */}
          <div className="rounded-lg">
            <ChatHistory 
              chats={chats} 
              onSelectChat={handleSelectChat}
              onChatDeleted={loadChats}
            />
          </div>
        </div>
      </div>

      {/* Project Drawer */}
      <ProjectDrawer
        isOpen={isProjectDrawerOpen}
        onClose={() => setIsProjectDrawerOpen(false)}
        onOpen={() => setIsProjectDrawerOpen(true)}
      />

      {/* Config Drawer */}
      <ConfigDrawer 
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
      />
    </div>
  );
};

export default ChatInputPage;