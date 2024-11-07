import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface Model {
  id: string;
  name: string;
  description: string;
  apiId: string;
  capabilities: {
    imageInput: boolean;
  };
}

const models: Model[] = [
  {
    id: 'sonnet',
    name: 'Claude 3.5 Sonnet (Latest)',
    description: 'Best for complex tasks and analysis',
    apiId: 'claude-3-5-sonnet-20241022',
    capabilities: {
      imageInput: true
    }
  },
  {
    id: 'haiku',
    name: 'Claude 3.5 Haiku (Latest)',
    description: 'Fast and efficient for simple tasks',
    apiId: 'claude-3-5-haiku-20241022',
    capabilities: {
      imageInput: false
    }
  }
];

interface ModelSelectorProps {
  selectedModel: Model;
  onModelSelect: (model: Model) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, onModelSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');

  useEffect(() => {
    const updatePosition = () => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      if (spaceBelow < 200 && spaceAbove > spaceBelow) {
        setDropdownPosition('top');
      } else {
        setDropdownPosition('bottom');
      }
    };

    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
    }

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-white hover:bg-zinc-800 px-2 py-1 rounded-md transition-colors"
      >
        <span>{selectedModel.name}</span>
        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown menu */}
          <div 
            className={`absolute ${
              dropdownPosition === 'bottom' ? 'top-full' : 'bottom-full'
            } left-0 ${
              dropdownPosition === 'bottom' ? 'mt-1' : 'mb-1'
            } w-72 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg z-20`}
            style={{
              maxHeight: '200px',
              overflowY: 'auto'
            }}
          >
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  onModelSelect(model);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 flex items-start gap-3 hover:bg-zinc-700/50 transition-colors text-left"
              >
                <div className="w-5 pt-1">
                  {model.id === selectedModel.id && (
                    <Check className="w-4 h-4 text-blue-400" />
                  )}
                </div>
                <div>
                  <div className="text-white font-medium">{model.name}</div>
                  <div className="text-zinc-400 text-sm">{model.description}</div>
                  <div className="text-zinc-500 text-xs mt-1">
                    {model.capabilities.imageInput ? '✓ Supports image input' : '✕ No image support'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ModelSelector;