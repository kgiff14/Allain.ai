import { Persona } from "../types/types";

const PERSONAS_STORAGE_KEY = 'stored_personas';
const SELECTED_PERSONA_KEY = 'selected_persona';

// Default persona
const DEFAULT_PERSONA: Persona = {
  id: 'default',
  name: 'Default',
  maxTokens: 4096,
  temperature: 0.7,
  systemMessage: "You are an AI assistant focused on being helpful, harmless, and honest.",
  isDefault: true
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

  getAllPersonas(): Persona[] {
    const stored = localStorage.getItem(PERSONAS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
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

  getSelectedPersona(): Persona {
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
}

export const personaStore = new PersonaStoreService();