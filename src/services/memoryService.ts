// services/memoryService.ts
import { Memory, PersonaWithMemory } from '../types/memory';
import { personaStore } from './personaStore';
import { Message } from '../types/types';

class MemoryService {
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

    // Construct the memory detection prompt
    const prompt = {
      model: "claude-3-haiku-20240307",
      system: "You are a memory detection system. Your task is to determine if a message contains information worth remembering for future conversations. If it does, extract and summarize that information concisely. Only respond with the memory-worthy content or null if there's nothing significant to remember. Keep memories factual and objective.",
      messages: [{
        role: "user",
        content: `Message: "${message.content}"\n\nShould this be remembered? If yes, provide a clear, concise summary. If no, respond with null.`
      }]
    };

    try {
      // Call API endpoint here
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prompt)
      });

      if (!response.ok) throw new Error('Failed to process memory');

      const result = await response.json();
      const memoryContent = result.content;

      // If memory-worthy content was detected, store it
      if (memoryContent && memoryContent !== 'null') {
        const memory: Omit<Memory, 'id'> = {
          content: memoryContent,
          createdAt: new Date(),
          source: 'auto',
          messageId: message.id
        };

        personaStore.addMemory(personaId, memory);
        return memoryContent;
      }

      return null;

    } catch (error) {
      console.error('Error processing message for memories:', error);
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