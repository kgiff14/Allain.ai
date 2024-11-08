import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Image as ImageIcon } from 'lucide-react';
import ModelSelector, { Model } from './ModelSelector';

interface ChatInputProps {
  onSendMessage: (content: string, model: Model, images?: File[]) => void;
  disabled?: boolean;
  initialModel?: Model;
  onModelSelect?: (model: Model) => void;
}

const defaultModel: Model = {
  id: 'sonnet',
  name: 'Claude 3.5 Sonnet (Latest)',
  description: 'Best for complex tasks and analysis',
  apiId: 'claude-3-5-sonnet-latest',
  capabilities: {
    imageInput: true
  }
};

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  initialModel,
  onModelSelect
}) => {
  const [message, setMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState<Model>(defaultModel);
  const [images, setImages] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialModel) {
      setSelectedModel(initialModel);
    }
  }, [initialModel]);

  const handleModelSelect = (model: Model) => {
    setSelectedModel(model);
    if (onModelSelect) {
      onModelSelect(model);
    }
  };

  const handleAddImage = (file: File) => {
    setImages(prev => [...prev, file]);
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  const handlePaste = async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (!selectedModel.capabilities.imageInput) return;
    
    const items = event.clipboardData.items;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        event.preventDefault(); // Prevent default paste behavior for images
        const file = item.getAsFile();
        if (file) {
          handleAddImage(file);
        }
        return; // Exit after handling the image
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || (!message.trim() && images.length === 0)) return;

    onSendMessage(message, selectedModel, images);
    setMessage('');
    setImages([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleTextareaInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(event.target.value);
    
    // Auto-resize textarea
    const textarea = event.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  const isDisabled = disabled || (!message.trim() && images.length === 0);

  return (
    <div className="bg-zinc-900 rounded border border-zinc-700">
      {/* Model selector header */}
      <div className="px-4 py-2 flex items-start justify-between border-b border-zinc-700">
        <ModelSelector
          selectedModel={selectedModel}
          onModelSelect={handleModelSelect}
        />
        <div className="flex items-center gap-2 pt-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const files = Array.from(e.target.files || []);
              files.forEach(file => handleAddImage(file));
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}
            multiple
          />
          {selectedModel.capabilities.imageInput && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-zinc-400 hover:text-zinc-300 transition-colors rounded-lg hover:bg-zinc-800"
              type="button"
              aria-label="Add image"
            >
              <ImageIcon size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center p-4">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            className="flex-1 bg-transparent text-white placeholder-zinc-500 p-2 pr-12 focus:outline-none focus:ring-0 resize-none min-h-[60px] max-h-[200px]"
            placeholder={disabled ? "Please wait..." : "Still waiting for you to start typing..."}
            rows={1}
            disabled={disabled}
          />
          <button
            type="submit"
            className={`p-2 rounded-lg ${
              isDisabled
                ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' 
                : 'bg-white hover:bg-zinc-200 text-black transition-colors'
            }`}
            disabled={isDisabled}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>

        {/* Preview area for pasted/dropped images */}
        {images.length > 0 && (
          <div className="px-4 pb-4">
            <div className="flex flex-wrap gap-2">
              {images.map((file, index) => (
                <div 
                  key={index}
                  className="relative group"
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="w-16 h-16 object-cover rounded-md border border-zinc-700"
                  />
                  <button
                    onClick={() => handleRemoveImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 
                             text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    type="button"
                  >
                    <svg 
                      className="w-3 h-3" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M6 18L18 6M6 6l12 12" 
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shift + Return hint */}
        <div className="absolute right-4 top-1 text-xs text-zinc-500">
          shift + return for new line
        </div>
      </form>
    </div>
  );
};

export default ChatInput;