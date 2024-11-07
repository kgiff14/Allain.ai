import React from 'react';
import { ArrowDown } from 'lucide-react';

interface ScrollToBottomButtonProps {
  show: boolean;
  onClick: () => void;
}

const ScrollToBottomButton: React.FC<ScrollToBottomButtonProps> = ({ show, onClick }) => {
  if (!show) return null;

  // Using memo to prevent unnecessary re-renders
  return (
    <button
      onClick={onClick}
      className="fixed bottom-32 right-40 bg-zinc-800 hover:bg-zinc-700 
                 p-3 rounded-full shadow-lg transition-all duration-200 
                 transform translate-y-0 hover:translate-y-1
                 animate-fade-in z-20 group"
      aria-label="Scroll to bottom"
    >
      <div className="relative">
        <ArrowDown className="text-zinc-300 group-hover:text-white transition-colors" size={20} />
        
        {/* Tooltip */}
        <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 
                      px-2 py-1 bg-zinc-900 text-zinc-300 text-xs rounded 
                      whitespace-nowrap opacity-0 group-hover:opacity-100 
                      transition-opacity pointer-events-none">
          Scroll to bottom
        </div>
      </div>
    </button>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default React.memo(ScrollToBottomButton);