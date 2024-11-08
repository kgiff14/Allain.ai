import { PersonaWithMemory, Memory, MemoryConfig } from '../types/memory';
import { Persona } from '../types/types'

const PERSONAS_STORAGE_KEY = 'stored_personas';
const SELECTED_PERSONA_KEY = 'selected_persona';

const DEFAULT_MEMORY_CONFIG: MemoryConfig = {
  useMemories: true,
  collectMemories: true
};

// Update default persona with memory support
const DEFAULT_PERSONA: PersonaWithMemory = {
  id: 'default',
  name: 'Allain',
  maxTokens: 8192,
  temperature: 0.5,
  systemMessage: "You are an AI assistant named Allain, focused on being helpful, harmless, and honest.",
  isDefault: true,
  memories: [],
  memoryConfig: DEFAULT_MEMORY_CONFIG
};
  
// Custom event type
const PERSONA_CHANGE_EVENT = 'persona-changed';
const PERSONA_UPDATE_EVENT = 'persona-updated';

class PersonaStoreService {
  private dispatchPersonaChange() {
    window.dispatchEvent(new CustomEvent(PERSONA_CHANGE_EVENT));
  }

  private dispatchPersonaUpdate() {
    window.dispatchEvent(new CustomEvent(PERSONA_UPDATE_EVENT));
  }

  init() {
    const personas = this.getAllPersonas();
    if (personas.length === 0) {
      this.addPersona(DEFAULT_PERSONA);
      this.setSelectedPersona(DEFAULT_PERSONA.id);
    }
  }

  addPersona(persona: Persona) {
    const personas = this.getAllPersonas();
    localStorage.setItem(
      PERSONAS_STORAGE_KEY,
      JSON.stringify([...personas, persona])
    );
    this.dispatchPersonaUpdate();
  }

  updatePersona(updatedPersona: Persona) {
    if (updatedPersona.isDefault) {
      console.warn('Cannot modify default persona');
      return;
    }

    const personas = this.getAllPersonas();
    const updatedPersonas = personas.map(p => 
      p.id === updatedPersona.id ? updatedPersona : p
    );
    localStorage.setItem(PERSONAS_STORAGE_KEY, JSON.stringify(updatedPersonas));
    this.dispatchPersonaUpdate();
  }

  deletePersona(personaId: string) {
    const personas = this.getAllPersonas();
    if (personas.find(p => p.id === personaId)?.isDefault) {
      console.warn('Cannot delete default persona');
      return;
    }

    const updatedPersonas = personas.filter(p => p.id !== personaId);
    localStorage.setItem(PERSONAS_STORAGE_KEY, JSON.stringify(updatedPersonas));

    if (this.getSelectedPersonaId() === personaId) {
      this.setSelectedPersona(DEFAULT_PERSONA.id);
    }
    this.dispatchPersonaUpdate();
  }

  getSelectedPersonaId(): string {
    return localStorage.getItem(SELECTED_PERSONA_KEY) || DEFAULT_PERSONA.id;
  }

  getSelectedPersona(): PersonaWithMemory {
    const selectedId = this.getSelectedPersonaId();
    const personas = this.getAllPersonas();
    return personas.find(p => p.id === selectedId) || DEFAULT_PERSONA;
  }

  setSelectedPersona(personaId: string) {
    localStorage.setItem(SELECTED_PERSONA_KEY, personaId);
    this.dispatchPersonaChange();
  }

  isDefaultPersona(personaId: string): boolean {
    const persona = this.getAllPersonas().find(p => p.id === personaId);
    return !!persona?.isDefault;
  }

  // Add memory to a persona
  addMemory(personaId: string, memory: Omit<Memory, 'id'>): void {
    const personas = this.getAllPersonas();
    const updatedPersonas = personas.map(persona => {
      if (persona.id === personaId) {
        return {
          ...persona,
          memories: [
            ...(persona.memories || []),
            {
              id: Date.now().toString(),
              ...memory
            }
          ]
        };
      }
      return persona;
    });
    
    localStorage.setItem(PERSONAS_STORAGE_KEY, JSON.stringify(updatedPersonas));
    this.dispatchPersonaUpdate();
  }

  // Remove memory from a persona
  removeMemory(personaId: string, memoryId: string): void {
    const personas = this.getAllPersonas();
    const updatedPersonas = personas.map(persona => {
      if (persona.id === personaId) {
        return {
          ...persona,
          memories: (persona.memories || []).filter(m => m.id !== memoryId)
        };
      }
      return persona;
    });
    
    localStorage.setItem(PERSONAS_STORAGE_KEY, JSON.stringify(updatedPersonas));
    this.dispatchPersonaUpdate();
  }

  // Update memory config
  updateMemoryConfig(personaId: string, config: Partial<MemoryConfig>): void {
    const personas = this.getAllPersonas();
    const updatedPersonas = personas.map(persona => {
      if (persona.id === personaId) {
        return {
          ...persona,
          memoryConfig: {
            ...(persona.memoryConfig || DEFAULT_MEMORY_CONFIG),
            ...config
          }
        };
      }
      return persona;
    });
    
    localStorage.setItem(PERSONAS_STORAGE_KEY, JSON.stringify(updatedPersonas));
    this.dispatchPersonaUpdate();
  }

  // Get memory config for a persona
getMemoryConfig(personaId: string): MemoryConfig {
  const persona = this.getAllPersonas().find(p => p.id === personaId);
  return persona?.memoryConfig || DEFAULT_MEMORY_CONFIG;
}

// Override getAllPersonas to ensure memory config exists
  getAllPersonas(): PersonaWithMemory[] {
    const stored = localStorage.getItem(PERSONAS_STORAGE_KEY);
    const personas: PersonaWithMemory[] = stored ? JSON.parse(stored) : [];
    
    // Ensure all personas have memory config and convert dates
    return personas.map(persona => ({
      ...persona,
      memories: (persona.memories || []).map(memory => ({
        ...memory,
        createdAt: new Date(memory.createdAt)
      })),
      memoryConfig: persona.memoryConfig || DEFAULT_MEMORY_CONFIG
    }));
  }

  // Helper to get formatted memories for system prompt
  getMemoriesForSystemPrompt(personaId: string): string {
    const persona = this.getSelectedPersona();
    if (!persona.memoryConfig?.useMemories || !persona.memories?.length) {
      return '';
    }

    return `\n\nRelevant memories from past conversations:\n${
      persona.memories
        .map(m => `- ${m.content}`)
        .join('\n')
    }`;
  }
}

export const personaStore = new PersonaStoreService();