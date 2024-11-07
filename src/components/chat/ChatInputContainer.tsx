import React from 'react';
import ChatInput from './ChatInput';
import { Model } from './ModelSelector';

interface ChatInputContainerProps {
  onSendMessage: (content: string, model: Model, attachments?: File[]) => Promise<void>;
  isLoading: boolean;
  currentModel: Model;
  onModelSelect: (model: Model) => void;
}

export const ChatInputContainer: React.FC<ChatInputContainerProps> = ({
  onSendMessage,
  isLoading,
  currentModel,
  onModelSelect,
}) => {
  return (
    <div className="border-t border-zinc-800 bg-zinc-900">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-4">
        <ChatInput 
          onSendMessage={onSendMessage}
          disabled={isLoading} 
          initialModel={currentModel}
          onModelSelect={onModelSelect}
        />
      </div>
    </div>
  );
};