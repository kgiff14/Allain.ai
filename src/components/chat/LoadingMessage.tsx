import React from 'react';
import { usePersona } from '../../hooks/usePersona';

export const LoadingMessage: React.FC = () => {
  const persona = usePersona();
  
  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-zinc-400">{persona.name}</span>
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