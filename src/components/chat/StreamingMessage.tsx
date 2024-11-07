import React, { useState, useEffect, useCallback, useRef } from 'react';
import { debounce } from 'lodash';
import SafeMarkdown from './SafeMarkdown';
import { Model } from './ModelSelector';

interface StreamingMessageProps {
  content: string;
  isComplete: boolean;
  model?: Model;
}

const StreamingMessage: React.FC<StreamingMessageProps> = ({ content, isComplete, model }) => {
  const [displayContent, setDisplayContent] = useState('');
  const contentRef = useRef('');
  const batchTimeout = useRef<NodeJS.Timeout>();

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
    }, 50), // Adjust this value to balance between smoothness and performance
    []
  );

  useEffect(() => {
    contentRef.current = content;
    
    if (!isComplete) {
      // Clear any existing timeout
      if (batchTimeout.current) {
        clearTimeout(batchTimeout.current);
      }
      
      // Schedule a new update
      batchTimeout.current = setTimeout(() => {
        debouncedUpdate();
      }, 16); // Roughly one frame at 60fps
    } else {
      // Immediate update when stream is complete
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
        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 flex items-center justify-center text-white text-sm">
          A
        </div>
        <span className="text-zinc-400">Allain</span>
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