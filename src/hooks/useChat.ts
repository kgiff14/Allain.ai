// hooks/useChat.ts
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Message } from '../types/types';
import { chatStore } from '../utils/chatStore';
import { enhancedChatService } from '../services/enhancedChatService';
import { Model } from '../components/chat/ModelSelector';
import { useRAGContext } from './useRAGContext';

// Helper to create a persistent blob URL from a File
const createPersistentBlobUrl = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const blob = new Blob([arrayBuffer], { type: file.type });
  return URL.createObjectURL(blob);
};

export const useChat = (chatId?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { getRelevantContext, error: ragError } = useRAGContext();

  useEffect(() => {
    if (chatId) {
      const existingChat = chatStore.getChat(chatId);
      if (existingChat) {
        setMessages(existingChat.messages);
        setCurrentChatId(chatId);
      } else {
        navigate('/');
      }
    }
  }, [chatId, navigate]);

  const handleAssistantResponse = async (
    chatId: string, 
    currentMessages: Message[], 
    content: string,
    model: Model,
    images?: File[]
  ) => {
    try {
      setIsLoading(true);
      setStreamingContent('');
      setError(null);
  
      // Get relevant context from RAG
      const ragContext = await getRelevantContext(content);
        
      const assistantMessage = await enhancedChatService.streamMessage(
        content,
        currentMessages,
        (chunk) => {
          setStreamingContent(prev => prev + chunk);
        },
        model,
        ragContext,
        images
      );
  
      const messageWithModel: Message = {
        ...assistantMessage,
        model: {
          name: model.name,
          id: model.id
        }
      };
  
      const updatedMessages = [...currentMessages, messageWithModel];
      setMessages(updatedMessages);
      setStreamingContent('');
  
      chatStore.updateChat(chatId, updatedMessages);
    } catch (err) {
      console.error('Detailed error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while sending the message');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (content: string, model: Model, images?: File[]) => {
    try {
      setError(null);
      
      // Create persistent blob URLs for images if present
      const attachments = images ? await Promise.all(
        images.map(async file => ({
          id: Math.random().toString(),
          type: 'image' as const,
          url: await createPersistentBlobUrl(file),
          name: file.name,
        }))
      ) : undefined;

      const userMessage: Message = {
        id: Date.now().toString(),
        content,
        role: 'user',
        timestamp: new Date(),
        attachments,
      };

      const newMessages = [...messages, userMessage];
      setMessages(newMessages);

      if (!currentChatId) {
        const newChatId = chatStore.createChat(userMessage);
        setCurrentChatId(newChatId);
        window.history.replaceState(null, '', `/chat/${newChatId}`);
        await handleAssistantResponse(newChatId, newMessages, content, model, images);
      } else {
        chatStore.updateChat(currentChatId, newMessages);
        await handleAssistantResponse(currentChatId, newMessages, content, model, images);
      }
    } catch (err) {
      console.error('Detailed error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while sending the message');
    }
  };

  const deleteChat = () => {
    if (currentChatId) {
      // Clean up blob URLs before deleting chat
      messages.forEach(message => {
        message.attachments?.forEach(attachment => {
          if (attachment.type === 'image') {
            URL.revokeObjectURL(attachment.url);
          }
        });
      });
      
      chatStore.deleteChat(currentChatId);
      navigate('/');
    }
  };

  // Clean up blob URLs when component unmounts
  useEffect(() => {
    return () => {
      messages.forEach(message => {
        message.attachments?.forEach(attachment => {
          if (attachment.type === 'image') {
            URL.revokeObjectURL(attachment.url);
          }
        });
      });
    };
  }, []);

  return {
    messages,
    isLoading,
    error: error || ragError,
    streamingContent,
    currentChatId,
    sendMessage,
    deleteChat
  };
};