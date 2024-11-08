import React, { useState, useEffect } from 'react';
import { X, Settings2 } from 'lucide-react';
import { PersonaModal } from './PersonaModal';
import { PersonaSelector } from './PersonaSelector';
import ConfirmDialog from './ConfirmDialog';
import { personaStore } from '../../services/personaStore';

interface Persona {
  id: string;
  name: string;
  maxTokens: number;
  temperature: number;
  systemMessage: string;
  isDefault?: boolean;
}

interface ConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConfigDrawer: React.FC<ConfigDrawerProps> = ({ isOpen, onClose }) => {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | undefined>(undefined);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    personaId: string | null;
    personaName: string;
  }>({
    isOpen: false,
    personaId: null,
    personaName: ''
  });

  // Load personas and selected persona
  useEffect(() => {
    setPersonas(personaStore.getAllPersonas());
    setSelectedPersonaId(personaStore.getSelectedPersonaId());
  }, [isOpen]);

  const handleCreatePersona = () => {
    setEditingPersona(undefined);
    setIsModalOpen(true);
  };

  const handleEditPersona = (persona: Persona) => {
    if (persona.isDefault) {
      return; // Prevent editing default persona
    }
    setEditingPersona(persona);
    setIsModalOpen(true);
  };

  const handleSavePersona = (persona: Persona) => {
    if (editingPersona?.isDefault) {
      return; // Extra protection against editing default
    }

    if (editingPersona) {
      personaStore.updatePersona(persona);
    } else {
      personaStore.addPersona({ ...persona, isDefault: false });
    }
    setPersonas(personaStore.getAllPersonas());
  };

  const handleDeletePersona = (personaId: string) => {
    if (personaStore.isDefaultPersona(personaId)) {
      return; // Prevent deleting default persona
    }
    
    const persona = personas.find(p => p.id === personaId);
    if (persona) {
      setDeleteConfirmation({
        isOpen: true,
        personaId: personaId,
        personaName: persona.name
      });
    }
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmation.personaId) {
      personaStore.deletePersona(deleteConfirmation.personaId);
      setPersonas(personaStore.getAllPersonas());
    }
  };

  const handleSelectPersona = (persona: Persona) => {
    personaStore.setSelectedPersona(persona.id);
    setSelectedPersonaId(persona.id);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}
      
      {/* Drawer */}
      <div
        className={`fixed left-0 top-0 w-96 h-full bg-zinc-900 border-r border-zinc-800 z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Settings2 className="text-zinc-400" size={20} />
              <h2 className="text-lg font-semibold text-white">Configuration</h2>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-300 transition-colors"
              aria-label="Close configuration"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-8">
            {/* Personas Section */}
            <PersonaSelector
              personas={personas}
              selectedPersonaId={selectedPersonaId}
              onPersonaSelect={handleSelectPersona}
              onCreatePersona={handleCreatePersona}
              onEditPersona={handleEditPersona}
              onDeletePersona={handleDeletePersona}
            />

            {/* Selected Persona Info */}
            {selectedPersonaId && (
              <div className="space-y-4 pt-4 border-t border-zinc-800">
                <h3 className="text-lg font-medium text-white">Current Settings</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Max Tokens:</span>
                    <span className="text-white">
                      {personas.find(p => p.id === selectedPersonaId)?.maxTokens}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Temperature:</span>
                    <span className="text-white">
                      {personas.find(p => p.id === selectedPersonaId)?.temperature}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Persona Modal */}
      <PersonaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePersona}
        initialPersona={editingPersona}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmDelete}
        title="Delete Persona"
        message={`Are you sure you want to delete the persona "${deleteConfirmation.personaName}"? This action cannot be undone.`}
      />
    </>
  );
};

export default ConfigDrawer;