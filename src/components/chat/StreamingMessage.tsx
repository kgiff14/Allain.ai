import React, { useState, useEffect, useCallback, useRef } from 'react';
import { debounce } from 'lodash';
import SafeMarkdown from './SafeMarkdown';
import { Model } from './ModelSelector';
import { usePersona } from '../../hooks/usePersona';

interface StreamingMessageProps {
  content: string;
  isComplete: boolean;
  model?: Model;
}

const StreamingMessage: React.FC<StreamingMessageProps> = ({ content, isComplete, model }) => {
  const [displayContent, setDisplayContent] = useState('');
  const contentRef = useRef('');
  const batchTimeout = useRef<NodeJS.Timeout>();
  const persona = usePersona(); // Current persona for streaming message

  // Batch updates using useRef and setTimeout
  const updateContent = useCallback(() => {
    if (contentRef.current !== displayContent) {
      setDisplayContent(contentRef.current);
    }
  }, [displayContent]);

  // Debounced update function
  const debouncedUpdate = useCallback(
    debounce(() => {
      updateContent();
    }, 50),
    []
  );

  useEffect(() => {
    contentRef.current = content;
    
    if (!isComplete) {
      if (batchTimeout.current) {
        clearTimeout(batchTimeout.current);
      }
      
      batchTimeout.current = setTimeout(() => {
        debouncedUpdate();
      }, 16);
    } else {
      updateContent();
    }
    
    return () => {
      if (batchTimeout.current) {
        clearTimeout(batchTimeout.current);
      }
      debouncedUpdate.cancel();
    };
  }, [content, isComplete, debouncedUpdate, updateContent]);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-zinc-400">{persona.name}</span>
        {model && (
          <span className="text-zinc-500 text-sm italic">
            using {model.name}
          </span>
        )}
      </div>
      <div className="pl-8">
        <SafeMarkdown content={displayContent} />
      </div>
    </div>
  );
};

export default React.memo(StreamingMessage);