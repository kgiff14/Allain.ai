// hooks/useChat.ts
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Message } from '../types/types';
import { chatStore } from '../utils/chatStore';
import { enhancedChatService } from '../services/enhancedChatService';
import { Model } from '../components/chat/ModelSelector';
import { useRAGContext } from './useRAGContext';
import { memoryService } from '../services/memoryService';
import { usePersona } from './usePersona'; // Add this import

// Helper to create a persistent blob URL from a File
const createPersistentBlobUrl = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const blob = new Blob([arrayBuffer], { type: file.type });
  return URL.createObjectURL(blob);
};

// Add new state for memory notifications
interface UseChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  streamingContent: string;
  currentChatId: string | null;
  newMemoryId: string | null;
}

export const useChat = (chatId?: string) => {
  const [state, setState] = useState<UseChatState>({
    messages: [],
    isLoading: false,
    error: null,
    streamingContent: '',
    currentChatId: null,
    newMemoryId: null
  });
  
  const navigate = useNavigate();
  const { getRelevantContext } = useRAGContext();
  const persona = usePersona(); // Add this line to get the current persona

  useEffect(() => {
    if (chatId) {
      const existingChat = chatStore.getChat(chatId);
      if (existingChat) {
        setState(prev => ({
          ...prev,
          messages: existingChat.messages,
          currentChatId: chatId
        }));
      } else {
        navigate('/');
      }
    }
  }, [chatId, navigate]);

  // Clear memory notification after delay
  useEffect(() => {
    if (state.newMemoryId) {
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, newMemoryId: null }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state.newMemoryId]);

  const handleAssistantResponse = async (
    chatId: string, 
    currentMessages: Message[], 
    content: string,
    model: Model,
    images?: File[]
  ) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, streamingContent: '', error: null }));
  
      // Get relevant context from RAG
      const ragContext = await getRelevantContext(content);
        

      // Get the assistant's response
      const assistantMessage = await enhancedChatService.streamMessage({
        content,
        messageHistory: currentMessages,
        onChunk: (chunk) => {
          setState(prev => ({ 
            ...prev, 
            streamingContent: prev.streamingContent + chunk 
          }));
        },
        onMemoryCreated: (memoryId) => {
          setState(prev => ({ ...prev, newMemoryId: memoryId }));
        },
        model,
        ragContext,
        images
      });


      const messageWithModel: Message = {
        ...assistantMessage,
        model: {
          name: model.name,
          id: model.id
        }
      };
  
      const updatedMessages = [...currentMessages, messageWithModel];
      setState(prev => ({ 
        ...prev, 
        messages: updatedMessages,
        streamingContent: ''
      }));
  
      chatStore.updateChat(chatId, updatedMessages);
    } catch (err) {
      console.error('Detailed error:', err);
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'An error occurred while sending the message'
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const sendMessage = async (content: string, model: Model, images?: File[]) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const userMessage: Message = {
        id: Date.now().toString(),
        content,
        role: 'user',
        timestamp: new Date(),
        attachments: images ? await Promise.all(images.map(async file => ({
          id: Math.random().toString(),
          type: 'image' as const,
          url: await createPersistentBlobUrl(file),
          name: file.name,
        }))) : undefined,
      };

      const newMessages = [...state.messages, userMessage];
      setState(prev => ({ ...prev, messages: newMessages }));

      if (!state.currentChatId) {
        const newChatId = chatStore.createChat(userMessage);
        setState(prev => ({ ...prev, currentChatId: newChatId }));
        window.history.replaceState(null, '', `/chat/${newChatId}`);
        await handleAssistantResponse(newChatId, newMessages, content, model, images);
      } else {
        chatStore.updateChat(state.currentChatId, newMessages);
        await handleAssistantResponse(state.currentChatId, newMessages, content, model, images);
      }
    } catch (err) {
      console.error('Detailed error:', err);
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'An error occurred while sending the message'
      }));
    }
  };

  const deleteChat = () => {
    if (state.currentChatId) {
      // Clean up blob URLs before deleting chat
      state.messages.forEach(message => {
        message.attachments?.forEach(attachment => {
          if (attachment.type === 'image') {
            URL.revokeObjectURL(attachment.url);
          }
        });
      });
      
      chatStore.deleteChat(state.currentChatId);
      navigate('/');
    }
  };

  // Clean up blob URLs when component unmounts
  useEffect(() => {
    return () => {
      state.messages.forEach(message => {
        message.attachments?.forEach(attachment => {
          if (attachment.type === 'image') {
            URL.revokeObjectURL(attachment.url);
          }
        });
      });
    };
  });

  return {
    ...state,
    sendMessage,
    deleteChat
  };
};