// components/ChatThreadPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Alert, AlertDescription } from '../ui/alert';
import { ProjectDocument } from '../../types';
import { documentStore } from '../../utils/documentStore';
import ProjectDrawer from '../ui/ProjectDrawer';
import ScrollToBottomButton from '../ui/ScrollToBottomButton';
import { Model } from './ModelSelector';
import { ChatHeader } from './ChatThreadHeader';
import { MessageContainer } from './MessageContainer';
import { ChatInputContainer } from './ChatInputContainer';
import { useChat } from '../../hooks/useChat';
import { useScroll } from '../../hooks/useScroll';

const defaultModel: Model = {
  id: 'sonnet',
  name: 'Claude 3.5 Sonnet (Latest)',
  description: 'Best for complex tasks and analysis',
  apiId: 'claude-3-5-sonnet-latest',
  capabilities: {
    imageInput: true
  }
};

interface LocationState {
  initialMessage?: string;
  initialAttachments?: File[];
  initialModel?: Model;
}

const ChatThreadPage: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const initialMessageSentRef = useRef(false);

  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentModel, setCurrentModel] = useState<Model>(() => {
    const state = location.state as LocationState;
    return state?.initialModel || defaultModel;
  });

  const {
    messages,
    isLoading,
    error,
    streamingContent,
    currentChatId,
    sendMessage,
    deleteChat
  } = useChat(chatId);

  const {
    shouldAutoScroll,
    showScrollButton,
    scrollToBottom
  } = useScroll(containerRef);

  // Handle initial message
  useEffect(() => {
    const state = location.state as LocationState;
    if (state?.initialMessage && !initialMessageSentRef.current) {
      sendMessage(
        state.initialMessage,
        state.initialModel || currentModel,
        state.initialAttachments
      );
      initialMessageSentRef.current = true;
    }
  }, [location.state]);

  // Load documents
  useEffect(() => {
    const loadDocuments = () => {
      const storedDocuments = documentStore.getAllDocuments();
      setDocuments(storedDocuments);
    };
    loadDocuments();
  }, []);

  const handleAddDocument = async (file: File) => {
    try {
      const newDocument = await documentStore.addDocument(file);
      setDocuments(prev => [newDocument, ...prev]);
    } catch (error) {
      console.error('Error adding document:', error);
      throw error;
    }
  };

  return (
    <div className="h-screen bg-zinc-900 flex flex-col">
      <ChatHeader 
        currentChatId={currentChatId} 
        onDeleteChat={deleteChat}
      />

      {error && (
        <Alert variant="destructive" className="mx-auto mt-4 max-w-4xl">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div ref={containerRef} className="flex-1 overflow-y-auto relative">
        <MessageContainer
          messages={messages}
          streamingContent={streamingContent}
          isLoading={isLoading}
          currentModel={currentModel}
          onScroll={() => {}}
          shouldAutoScroll={shouldAutoScroll}
        />
      </div>

      <ChatInputContainer
        onSendMessage={sendMessage}
        isLoading={isLoading}
        currentModel={currentModel}
        onModelSelect={setCurrentModel}
      />

      <ScrollToBottomButton 
        show={showScrollButton} 
        onClick={scrollToBottom}
      />

      <ProjectDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onOpen={() => setIsDrawerOpen(true)}
        documents={documents}
        onAddDocument={handleAddDocument}
      />
    </div>
  );
};

export default ChatThreadPage;