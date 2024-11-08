// hooks/usePersona.ts
import { useState, useEffect } from 'react';
import { personaStore } from '../services/personaStore';

export const usePersona = () => {
  const [persona, setPersona] = useState(() => personaStore.getSelectedPersona());

  useEffect(() => {
    const handlePersonaChange = () => {
      setPersona(personaStore.getSelectedPersona());
    };

    // Listen for both selection changes and updates to personas
    window.addEventListener('persona-changed', handlePersonaChange);
    window.addEventListener('persona-updated', handlePersonaChange);

    return () => {
      window.removeEventListener('persona-changed', handlePersonaChange);
      window.removeEventListener('persona-updated', handlePersonaChange);
    };
  }, []);

  return persona;
};