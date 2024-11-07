// components/ChatInputPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatHeader } from './ChatInputHeader';
import ChatInput from './ChatInput';
import { ChatHistory } from './ChatHistory';
import { ProjectKnowledge } from '../ui/ProjectKnowledge';
import { Chat, ProjectDocument } from '../../types';
import { chatStore } from '../../utils/chatStore';
import { documentStore } from '../../utils/documentStore';
import { Model } from './ModelSelector';

const ChatInputPage: React.FC = () => {
  const navigate = useNavigate();
  const [chats, setChats] = useState<Chat[]>([]);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);

  // Load existing chats and documents
  const loadChats = () => {
    const storedChats = chatStore.getAllChats();
    setChats(storedChats);
  };

  useEffect(() => {
    loadChats();
    const storedDocuments = documentStore.getAllDocuments();
    setDocuments(storedDocuments);
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

  const handleAddDocument = async (file: File) => {
    try {
      const newDocument = await documentStore.addDocument(file);
      setDocuments(prev => [newDocument, ...prev]);
    } catch (error) {
      console.error('Error adding document:', error);
      throw error;
    }
  };

  const handleSelectChat = (chatId: string) => {
    navigate(`/chat/${chatId}`);
  };

  return (
    <div className="bg-zinc-900 min-h-screen p-6">
      <div className="max-w-4xl mx-auto min-h-screen flex flex-col">
        <div className="p-6 mb-4">
          <ChatHeader
            title="Allain"
            description="Local RAG application"
          />
        </div>

        <div className="flex-1 flex flex-col space-y-4">
          <div className="p-6 rounded-lg shadow-lg">
            <ChatInput 
              onSendMessage={handleSendMessage}
            />
          </div>

          <div className="p-6 rounded-lg shadow-lg">
            <ChatHistory 
              chats={chats} 
              onSelectChat={handleSelectChat}
              onChatDeleted={loadChats}
            />
          </div>
        </div>
      </div>

      <div className="fixed right-0 top-0 w-96 h-full border-l border-zinc-800 overflow-y-auto p-4 bg-zinc-900">
        <ProjectKnowledge
          documents={documents}
          onAddDocument={handleAddDocument}
        />
      </div>
    </div>
  );
};

export default ChatInputPage;