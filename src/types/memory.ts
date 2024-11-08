import { Persona } from "./types";

// types/memory.ts
export interface Memory {
    id: string;
    content: string;
    createdAt: Date;
    source: 'auto' | 'manual';  // Was it created by filter or user
    messageId?: string;         // Reference to originating message if auto-created
  }
  
  // Configuration for memory features
  export interface MemoryConfig {
    useMemories: boolean;       // Whether to include memories in system prompt
    collectMemories: boolean;   // Whether to run the memory filter
  }
  
  // Extend existing Persona interface
  export interface PersonaWithMemory extends Persona {
    memories?: Memory[];
    memoryConfig: MemoryConfig;
  }
