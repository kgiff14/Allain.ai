import React, { useMemo } from 'react';
import { Trash2, HardDrive } from 'lucide-react';
import { Chat } from '../../types/types';
import { formatTimestamp } from '../../utils/formatTimestamp';
import { formatBytes } from '../../utils/formatBytes';
import { chatStore } from '../../utils/chatStore';

interface ChatHistoryProps {
  chats: Chat[];
  onSelectChat: (chatId: string) => void;
  onChatDeleted?: () => void;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({ 
  chats, 
  onSelectChat,
  onChatDeleted 
}) => {
  // Calculate memory usage for each chat
  const chatsWithMemory = useMemo(() => {
    return chats.map(chat => {
      // Calculate the size of messages in bytes
      const messagesSize = new Blob([JSON.stringify(chat)]).size;
      return {
        ...chat,
        memorySize: messagesSize
      };
    });
  }, [chats]);

  const handleDeleteChat = (chatId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      // Use chatStore instead of file system
      chatStore.deleteChat(chatId);
      if (onChatDeleted) {
        onChatDeleted();
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Your chats</h2>
      <div className="space-y-4">
        {chatsWithMemory.map((chat) => (
          <div
            key={chat.id}
            className="group p-4 bg-zinc-800/50 rounded-lg shadow-md cursor-pointer 
                     hover:bg-zinc-800 transition-colors relative"
            onClick={() => onSelectChat(chat.id)}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 pr-8">
                <h3 className="text-white font-bold">{chat.title}</h3>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-zinc-400 text-sm">
                    Last message {formatTimestamp(chat.lastMessageTime)}
                  </p>
                  <div className="flex items-center gap-1.5 text-zinc-500 text-sm">
                    <HardDrive size={14} />
                    <span>{formatBytes(chat.memorySize)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => handleDeleteChat(chat.id, e)}
                className="opacity-0 group-hover:opacity-100 absolute right-4 top-7 
                         text-zinc-400 hover:text-red-400 transition-all duration-200"
                aria-label="Delete chat"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        
        {chats.length === 0 && (
          <div className="text-center text-zinc-400 py-8">
            <p>No chat history yet. Start a new conversation!</p>
          </div>
        )}
      </div>
    </div>
  );
};