// types.ts
export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  attachments?: Attachment[];
  model?: {
    name: string;
    id: string;
  };
  persona?: {
    name: string;
    id: string;
  };
}
  
export interface Attachment {
  id: string;
  type: 'image' | 'document';
  url: string;
  name: string;
  contentType?: string; // Added for MIME type information
}

export interface Chat {
  id: string;
  title: string;
  lastMessage?: string;
  lastMessageTime: Date;
}

export interface ProjectDocument {
  id: string;
  name: string;
  type: string;
  uploadedAt: Date;
}

export interface Persona {
  id: string;
  name: string;
  maxTokens: number;
  temperature: number;
  systemMessage: string;
  isDefault?: boolean;  // New property to mark default persona
}

declare global {
  interface Window {
    fs: {
      readFile: (path: string, options?: { encoding?: string }) => Promise<string>;
      writeFile: (path: string, content: string) => Promise<void>;
      unlink: (path: string) => Promise<void>;
    };
  }
}