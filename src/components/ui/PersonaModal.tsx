import { useEffect, useState } from "react";
import { Persona } from "../../types/types";
import { Save, X } from "lucide-react";


// Modal component for creating/editing personas
export const PersonaModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (persona: Persona) => void;
    initialPersona?: Persona;
  }> = ({ isOpen, onClose, onSave, initialPersona }) => {
    const [persona, setPersona] = useState<Persona>(() => initialPersona || {
      id: Date.now().toString(),
      name: '',
      maxTokens: 4096,
      temperature: 0.7,
      systemMessage: "You are an AI assistant focused on being helpful, harmless, and honest."
    });
  
    useEffect(() => {
      if (initialPersona) {
        setPersona(initialPersona);
      }
    }, [initialPersona]);
  
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-zinc-900 rounded-lg w-full max-w-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-800">
            <h2 className="text-lg font-semibold text-white">
              {initialPersona ? 'Edit Persona' : 'Create New Persona'}
            </h2>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-300 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
  
          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Persona Name */}
            <div className="space-y-2">
              <label className="text-zinc-300">Persona Name</label>
              <input
                type="text"
                value={persona.name}
                onChange={(e) => setPersona(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white"
                placeholder="Enter persona name..."
              />
            </div>
  
            {/* Max Tokens */}
            <div className="space-y-2">
              <label className="text-zinc-300">Max Tokens</label>
              <input
                type="number"
                value={persona.maxTokens}
                onChange={(e) => setPersona(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                min="1"
                max="4096"
                className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white"
              />
            </div>
  
            {/* Temperature */}
            <div className="space-y-2">
              <label className="text-zinc-300">Temperature</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  value={persona.temperature}
                  onChange={(e) => setPersona(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                  min="0"
                  max="1"
                  step="0.1"
                  className="flex-1"
                />
                <span className="text-white w-12 text-center">{persona.temperature}</span>
              </div>
            </div>
  
            {/* System Message */}
            <div className="space-y-2">
              <label className="text-zinc-300">System Message</label>
              <textarea
                value={persona.systemMessage}
                onChange={(e) => setPersona(prev => ({ ...prev, systemMessage: e.target.value }))}
                rows={8}
                className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white"
              />
            </div>
          </div>
  
          {/* Footer */}
          <div className="flex justify-end gap-4 p-6 border-t border-zinc-800">
            <button
              onClick={onClose}
              className="px-4 py-2 text-zinc-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onSave(persona);
                onClose();
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors flex items-center gap-2"
            >
              <Save size={16} />
              Save Persona
            </button>
          </div>
        </div>
      </div>
    );
  };