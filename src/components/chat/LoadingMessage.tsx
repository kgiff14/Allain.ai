// components/LoadingMessage.tsx
import React from 'react';

export const LoadingMessage: React.FC = () => {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 flex items-center justify-center text-white text-sm">
          A
        </div>
        <span className="text-zinc-400">Allain</span>
      </div>
      <div className="pl-9">
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100" />
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200" />
        </div>
      </div>
    </div>
  );
};