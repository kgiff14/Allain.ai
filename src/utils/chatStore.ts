// utils/chatStore.ts
import { Message, Chat } from '../types';

interface StoredChat extends Chat {
  messages: Message[];
}

const CHATS_STORAGE_KEY = 'stored_chats';

// Helper to generate a title from the first message
const generateChatTitle = (message: string): string => {
  // Take first 50 characters of message or up to the first newline
  const title = message.split('\n')[0].slice(0, 50);
  return title.length < message.length ? `${title}...` : title;
};

// Helper to convert date strings back to Date objects
const parseDates = (chat: StoredChat): StoredChat => {
  return {
    ...chat,
    lastMessageTime: new Date(chat.lastMessageTime),
    messages: chat.messages.map(msg => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }))
  };
};

export const chatStore = {
  // Create a new chat thread
  createChat: (initialMessage: Message): string => {
    const chats = chatStore.getAllChats();
    
    const newChat: StoredChat = {
      id: Date.now().toString(),
      title: generateChatTitle(initialMessage.content),
      lastMessageTime: new Date(),
      messages: [initialMessage]
    };

    localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify([newChat, ...chats]));
    return newChat.id;
  },

  // Get all chat threads
  getAllChats: (): StoredChat[] => {
    const stored = localStorage.getItem(CHATS_STORAGE_KEY);
    if (!stored) return [];
    
    // Parse stored chats and convert dates
    const chats: StoredChat[] = JSON.parse(stored);
    return chats.map(parseDates);
  },

  // Get a specific chat thread
  getChat: (chatId: string): StoredChat | null => {
    const chats = chatStore.getAllChats();
    const chat = chats.find(chat => chat.id === chatId);
    return chat ? parseDates(chat) : null;
  },

  // Update a chat thread with new messages
  updateChat: (chatId: string, messages: Message[], newTitle?: string) => {
    const chats = chatStore.getAllChats();
    const updatedChats = chats.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          messages,
          lastMessageTime: new Date(),
          title: newTitle || chat.title
        };
      }
      return chat;
    });
    localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(updatedChats));
  },

  // Delete a chat thread
  deleteChat: (chatId: string) => {
    const chats = chatStore.getAllChats();
    const updatedChats = chats.filter(chat => chat.id !== chatId);
    localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(updatedChats));
  }
};