// components/MessageList.tsx
import React from 'react';
import { Message as MessageType } from '../../types';
import { User } from 'lucide-react';

interface MessageListProps {
  messages: MessageType[];
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  return (
    <div className="space-y-6 mt-8">
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
    </div>
  );
};

interface MessageProps {
  message: MessageType;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        {message.role === 'user' ? (
          <User className="text-blue-400" size={24} />
        ) : (
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 flex items-center justify-center text-white text-sm">
            C
          </div>
        )}
        <span className="text-zinc-400">
          {message.role === 'user' ? 'You' : 'Claude'}
        </span>
        <span className="text-zinc-500 text-sm">
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </div>
      
      <div className="pl-9">
        <div className="text-white whitespace-pre-wrap">{message.content}</div>
        
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-3 flex gap-2 flex-wrap">
            {message.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="bg-zinc-800 rounded-lg p-2 flex items-center gap-2"
              >
                {attachment.type === 'image' ? (
                  <img
                    src={attachment.url}
                    alt={attachment.name}
                    className="w-8 h-8 object-cover rounded"
                  />
                ) : (
                  <div className="w-8 h-8 bg-zinc-700 rounded flex items-center justify-center text-zinc-300 text-xs">
                    DOC
                  </div>
                )}
                <span className="text-zinc-300 text-sm">{attachment.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};