import React, { useState } from 'react';
import { Message } from '../../types/types';
import SafeMarkdown from './SafeMarkdown';
import ImageModal from '../ui/ImageModal';

interface MessageContentProps {
  message: Message;
}

const MessageContent: React.FC<MessageContentProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  return (
    <>
      <div className={`flex ${isUser ? 'justify-end' : ''}`}>
        <div className={`${isUser ? 'max-w-md px-4 py-2 rounded-xl' : 'max-w-4xl p-4'} group hover:bg-zinc-800/50 rounded-lg transition-colors`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-zinc-300 font-semibold">
              {isUser ? 'You' : message.persona?.name}
            </span>
            {!isUser && message.model && (
              <span className="text-zinc-500 text-sm italic">
                using {message.model.name}
              </span>
            )}
            <span className="ml-auto text-zinc-500 text-xs">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
          </div>
          
          <div className="pl-8">
            <SafeMarkdown content={message.content} />
          </div>

          {message.attachments && message.attachments.length > 0 && (
            <div className="pl-8 mt-2 flex flex-wrap gap-2">
              {message.attachments.map((attachment) => (
                <div key={attachment.id} className="group/image relative">
                  {attachment.type === 'image' ? (
                    <div 
                      className="cursor-pointer transition-transform hover:scale-105"
                      onClick={() => setSelectedImage(attachment.url)}
                    >
                      <img
                        src={attachment.url}
                        alt={attachment.name}
                        className="w-40 h-40 object-cover rounded-md border border-zinc-600"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-colors rounded-md" />
                    </div>
                  ) : (
                    <div className="w-40 h-40 bg-zinc-800 rounded-md flex items-center justify-center text-zinc-400">
                      <span className="text-sm">{attachment.name}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage}
          onClose={() => setSelectedImage(null)}
          alt="Full size view"
        />
      )}
    </>
  );
};

export default MessageContent;