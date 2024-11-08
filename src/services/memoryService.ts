// services/memoryService.ts
import { Memory, PersonaWithMemory } from '../types/memory';
import { personaStore } from './personaStore';
import { Message } from '../types/types';

class MemoryService {
    private baseUrl: string;
    constructor(options: { timeout?: number } = {}) {
        this.baseUrl = process.env.NODE_ENV === 'development' 
          ? 'http://localhost:3001' 
          : '/api';
      }

      private memoryProcessingCache = new Map<string, Promise<string | null>>();
    
  // Format memories for inclusion in the system prompt
  formatMemoriesForPrompt(persona: PersonaWithMemory): string {
    if (!persona.memoryConfig?.useMemories || !persona.memories?.length) {
      return '';
    }

    const memories = persona.memories
      .map(m => `- ${m.content}`)
      .join('\n');

    return `\n\nRelevant memories from previous conversations:\n${memories}`;
  }

  // Process a message to see if it contains memory-worthy content
  async processMessageForMemories(
    message: Message, 
    personaId: string
  ): Promise<string | null> {
    const persona = personaStore.getSelectedPersona();
    
    if (!persona.memoryConfig?.collectMemories) {
      return null;
    }

    // Use message ID as cache key
    const cacheKey = message.id;
    const cachedPromise = this.memoryProcessingCache.get(cacheKey);
    if (cachedPromise) {
      return cachedPromise;
    }

    const memoryPromise = this._processMemory(message, personaId);
    this.memoryProcessingCache.set(cacheKey, memoryPromise);

    // Clean up cache after promise resolves
    memoryPromise.finally(() => {
      this.memoryProcessingCache.delete(cacheKey);
    });

    return memoryPromise;
  }

  private async _processMemory(
    message: Message,
    personaId: string
  ): Promise<string | null> {
    let memoryContent = '';

    try {
      console.log('Starting memory processing for message:', message.id);

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 1000,
          temperature: 0.5,
          stream: true,
          system: "You are a memory detection system. Your task is to determine if a message contains information worth remembering for future conversations. You must respond in one of two ways only:\n1. If the message contains information worth remembering, provide a clear, concise, factual summary of ONLY the important information.\n2. If there's nothing significant to remember, respond with exactly 'null' (no quotes).\n\nKeep any summaries brief, factual, and objective. Focus on concrete information, preferences, or factual statements.",
          messages: [{
            role: "user",
            content: `Analyze this message for information worth remembering:\n\n"${message.content}"\n\nRespond with either a concise summary of important information or 'null' if there's nothing significant. Also look for key words or phrases like, 'Remember this', etc.`
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Memory processing failed with status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }

          // Decode the chunk and add to buffer
          buffer += decoder.decode(value, { stream: true });
          
          // Process complete messages from buffer
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep the last incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event = JSON.parse(line.slice(6));
                if (event.type === 'content_block_delta' && 
                    event.delta?.type === 'text_delta' && 
                    event.delta.text) {
                  memoryContent += event.delta.text;
                }
              } catch (e) {
                console.warn('Failed to parse SSE event:', e);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      // Clean up the final content
      memoryContent = memoryContent.trim();
      
      if (!memoryContent || memoryContent.toLowerCase() === 'null') {
        console.log('No memory-worthy content detected');
        return null;
      }

      // Create and store the memory
      const memory: Omit<Memory, 'id'> = {
        content: memoryContent,
        createdAt: new Date(),
        source: 'auto',
        messageId: message.id
      };

      personaStore.addMemory(personaId, memory);
      console.log('New memory created:', memoryContent);
      return memoryContent;

    } catch (error) {
      console.error('Error in memory processing:', error);
      return null;
    }
  }

  // Get system prompt with memories included
  getSystemPromptWithMemories(
    basePrompt: string, 
    persona: PersonaWithMemory
  ): string {
    if (!persona.memoryConfig?.useMemories) {
      return basePrompt;
    }

    const memories = this.formatMemoriesForPrompt(persona);
    return `${basePrompt}${memories}`;
  }
}

export const memoryService = new MemoryService();