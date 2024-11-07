// components/ChatHeader.tsx
import React from 'react';
import { Lock, User } from 'lucide-react';

interface ChatHeaderProps {
  title: string;
  description: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ title, description }) => {
  return (
    <div className="mb-2">
      <div className="flex items-center gap-2">
        <User className="text-white" size={24} />
        <h1 className="text-white text-xl">{title}</h1>
        <Lock className="text-zinc-400" size={16} />
        <span className="text-zinc-400">Private</span>
      </div>
      <p className="text-zinc-400 mt-1">{description}</p>
    </div>
  );
};