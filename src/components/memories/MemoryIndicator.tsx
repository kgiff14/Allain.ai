import React, { useState, useEffect } from 'react';
import { Brain } from 'lucide-react';
import { PersonaWithMemory, Memory } from '../../types/memory';

interface MemoryIndicatorProps {
  persona: PersonaWithMemory;
  onOpenMemories: () => void;
  newMemoryId?: string; // To trigger animation
}

export const MemoryIndicator: React.FC<MemoryIndicatorProps> = ({
  persona,
  onOpenMemories,
  newMemoryId
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showBadge, setShowBadge] = useState(false);

  useEffect(() => {
    if (newMemoryId) {
      setIsAnimating(true);
      setShowBadge(true);
      
      // Stop wiggle animation after 1 second
      const wiggleTimer = setTimeout(() => {
        setIsAnimating(false);
      }, 1000);

      return () => clearTimeout(wiggleTimer);
    }
  }, [newMemoryId]);

  return (
    <button
      onClick={onOpenMemories}
      className="relative group"
      aria-label="View memories"
    >
      <Brain 
        className={`w-5 h-5 text-zinc-400 group-hover:text-zinc-300 transition-colors
                   ${isAnimating ? 'animate-wiggle' : ''}`}
      />
      
      {/* New memory badge */}
      {showBadge && (
        <div 
          className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full 
                     animate-fade-in cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            setShowBadge(false);
          }}
        />
      )}

      {/* Hover tooltip */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1
                    bg-zinc-800 text-sm text-zinc-300 rounded opacity-0 
                    group-hover:opacity-100 transition-opacity whitespace-nowrap">
        {persona.memories?.length || 0} memories stored
      </div>
    </button>
  );
};

// Add to your global CSS (e.g., globals.css)
/*
@keyframes wiggle {
  0% { transform: rotate(0deg); }
  25% { transform: rotate(-10deg); }
  50% { transform: rotate(10deg); }
  75% { transform: rotate(-5deg); }
  100% { transform: rotate(0deg); }
}

.animate-wiggle {
  animation: wiggle 1s ease-in-out;
}
*/