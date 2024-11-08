import React, { useRef, useEffect } from 'react';
import { Message } from '../../types/types';
import MessageContent from './MessageContent';
import StreamingMessage from './StreamingMessage';
import { LoadingMessage } from './LoadingMessage';
import { Model } from './ModelSelector';

interface MessageContainerProps {
  messages: Message[];
  streamingContent: string;
  isLoading: boolean;
  currentModel?: Model;
  onScroll: () => void;
  shouldAutoScroll: boolean;
}

export const MessageContainer: React.FC<MessageContainerProps> = ({
  messages,
  streamingContent,
  isLoading,
  currentModel,
  onScroll,
  shouldAutoScroll,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingContent, shouldAutoScroll]);

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 md:px-8 py-4"
      onScroll={onScroll}
    >
      <div className="max-w-4xl mx-auto space-y-4">
        {messages.map((message) => (
          <MessageContent key={message.id} message={message} />
        ))}
        
        {streamingContent && (
          <StreamingMessage 
            content={streamingContent} 
            isComplete={!isLoading}
            model={currentModel}
          />
        )}
        
        {isLoading && !streamingContent && <LoadingMessage />}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};