// components/chat/ChatInputPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings2, FolderOpen, Info, Gauge } from 'lucide-react';
import ChatInput from './ChatInput';
import { ChatHistory } from './ChatHistory';
import { ProjectDrawer } from '../projects/ProjectDrawer';
import ConfigDrawer from '../ui/ConfigDrawer';
import { Chat } from '../../types/types';
import { chatStore } from '../../utils/chatStore';
import { Model } from './ModelSelector';
import { usePersona } from '../../hooks/usePersona';
import { projectStore } from '../../services/projectStore';
import { MemoryManagementDrawer } from '../ui/MemoryManagementDrawer';
import { ChatInputHeader } from './BaseHeader';

const ChatInputPage: React.FC = () => {
  const navigate = useNavigate();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isProjectDrawerOpen, setIsProjectDrawerOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const persona = usePersona();
  const [activeProjects, setActiveProjects] = useState<{ id: string; name: string; }[]>([]);
  const [showProjectInfo, setShowProjectInfo] = useState(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);

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
      <ChatInputHeader />

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
      <MemoryManagementDrawer
        isOpen={isMemoryOpen}
        onClose={() => setIsMemoryOpen(false)}
      />
    </div>
  );
};

export default ChatInputPage;