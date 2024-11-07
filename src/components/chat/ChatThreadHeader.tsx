import React, { useState } from 'react';
import { ArrowLeft, Settings2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ConfigDrawer from '../ui/ConfigDrawer';

interface ChatHeaderProps {
  currentChatId: string | null;
  onDeleteChat: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ currentChatId, onDeleteChat }) => {
  const navigate = useNavigate();
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  return (
    <>
      <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur sticky top-0 z-10">
        <div className="relative w-full">
          <button
            onClick={() => setIsConfigOpen(true)}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors duration-200"
            aria-label="Open configuration"
          >
            <Settings2 size={20} />
          </button>

          <div className="max-w-6xl mx-auto w-full px-4 md:px-8 py-4 flex items-center justify-between">
            <div className="flex-1 flex items-center">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors duration-200 "
              >
                <ArrowLeft size={20} />
                <span>Back to Home</span>
              </button>
            </div>
            
            {currentChatId && (
              <button
                onClick={onDeleteChat}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                Delete Chat
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfigDrawer 
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
      />
    </>
  );
};