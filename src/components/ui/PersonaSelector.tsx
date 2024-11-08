import { Plus, Edit2, Trash2, Lock } from 'lucide-react';
import { Persona } from '../../types/types';

// Persona Selector component for the ConfigDrawer
export const PersonaSelector: React.FC<{
    personas: Persona[];
    selectedPersonaId: string | null;
    onPersonaSelect: (persona: Persona) => void;
    onCreatePersona: () => void;
    onEditPersona: (persona: Persona) => void;
    onDeletePersona: (personaId: string) => void;
  }> = ({
    personas,
    selectedPersonaId,
    onPersonaSelect,
    onCreatePersona,
    onEditPersona,
    onDeletePersona,
  }) => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">Personas</h3>
          <button
            onClick={onCreatePersona}
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <Plus size={16} />
            New Persona
          </button>
        </div>
  
        <div className="space-y-2">
          {personas.map((persona) => (
            <div
              key={persona.id}
              className={`group p-3 rounded-lg border ${
                selectedPersonaId === persona.id
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-zinc-700 hover:border-zinc-600'
              } transition-colors cursor-pointer`}
              onClick={() => onPersonaSelect(persona)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{persona.name}</span>
                  {persona.isDefault && (
                    <Lock size={14} className="text-zinc-400" />
                  )}
                </div>
                {!persona.isDefault && (
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditPersona(persona);
                      }}
                      className="p-1 text-zinc-400 hover:text-white transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePersona(persona.id);
                      }}
                      className="p-1 text-zinc-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-1 text-sm text-zinc-400">
                {persona.systemMessage.slice(0, 100)}...
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };