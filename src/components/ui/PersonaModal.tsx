import { useEffect, useState } from "react";
import { Info, Save, Sparkles, X } from "lucide-react";
import { Persona } from "../../types/types";

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

  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');

  useEffect(() => {
    if (initialPersona) {
      setPersona(initialPersona);
    }
  }, [initialPersona]);

  const renderTooltip = (text: string) => (
    <div className="group relative inline-block">
      <Info size={14} className="text-zinc-400 hover:text-zinc-300 transition-colors" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-zinc-800 
                    text-zinc-300 text-xs rounded-lg w-48 opacity-0 group-hover:opacity-100 
                    pointer-events-none transition-opacity shadow-lg">
        {text}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <Sparkles className="text-blue-400" size={20} />
            <h2 className="text-lg font-semibold text-white">
              {initialPersona ? 'Edit Persona' : 'Create New Persona'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800">
          <button
            onClick={() => setActiveTab('basic')}
            className={`px-6 py-3 text-sm font-medium transition-colors relative
                      ${activeTab === 'basic' 
                        ? 'text-blue-400' 
                        : 'text-zinc-400 hover:text-zinc-300'}`}
          >
            Basic Settings
            {activeTab === 'basic' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`px-6 py-3 text-sm font-medium transition-colors relative
                      ${activeTab === 'advanced' 
                        ? 'text-blue-400' 
                        : 'text-zinc-400 hover:text-zinc-300'}`}
          >
            Advanced Settings
            {activeTab === 'advanced' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {activeTab === 'basic' ? (
              <>
                {/* Persona Name */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-zinc-300 text-sm font-medium">Persona Name</label>
                    {renderTooltip("Give your persona a distinctive name to identify its role and purpose")}
                  </div>
                  <input
                    type="text"
                    value={persona.name}
                    onChange={(e) => setPersona(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white
                             placeholder-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                             transition-colors"
                    placeholder="e.g., Technical Expert, Creative Writer..."
                  />
                </div>

                {/* System Message */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-zinc-300 text-sm font-medium">Persona Instructions</label>
                    {renderTooltip("Define how your AI assistant should behave and what role it should play")}
                  </div>
                  <textarea
                    value={persona.systemMessage}
                    onChange={(e) => setPersona(prev => ({ ...prev, systemMessage: e.target.value }))}
                    rows={8}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white
                             placeholder-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                             transition-colors resize-none"
                    placeholder="Describe the persona's role, expertise, and behavior..."
                  />
                </div>
              </>
            ) : (
              <>
                {/* Temperature Control */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <label className="text-zinc-300 text-sm font-medium">Response Style</label>
                      {renderTooltip("Controls response variability. Lower values produce more focused, consistent outputs. Higher values increase creativity and variability.")}
                    </div>
                    <span className="text-blue-400 font-mono text-sm bg-blue-500/10 px-2 py-1 rounded">
                      {persona.temperature.toFixed(1)}
                    </span>
                  </div>
                  
                  {/* Preset Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setPersona(prev => ({ ...prev, temperature: 0.3 }))}
                      className={`p-3 rounded-lg border text-sm transition-all ${
                        Math.abs(persona.temperature - 0.3) < 0.1
                          ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                          : 'border-zinc-700 hover:border-zinc-600 text-zinc-400 hover:text-zinc-300'
                      }`}
                    >
                      <div className="font-medium">Focused</div>
                      <div className="text-xs opacity-80">Consistent & precise</div>
                    </button>
                    <button
                      onClick={() => setPersona(prev => ({ ...prev, temperature: 0.7 }))}
                      className={`p-3 rounded-lg border text-sm transition-all ${
                        Math.abs(persona.temperature - 0.7) < 0.1
                          ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                          : 'border-zinc-700 hover:border-zinc-600 text-zinc-400 hover:text-zinc-300'
                      }`}
                    >
                      <div className="font-medium">Balanced</div>
                      <div className="text-xs opacity-80">Mix of both</div>
                    </button>
                    <button
                      onClick={() => setPersona(prev => ({ ...prev, temperature: 1.0 }))}
                      className={`p-3 rounded-lg border text-sm transition-all ${
                        Math.abs(persona.temperature - 1.0) < 0.1
                          ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                          : 'border-zinc-700 hover:border-zinc-600 text-zinc-400 hover:text-zinc-300'
                      }`}
                    >
                      <div className="font-medium">Creative</div>
                      <div className="text-xs opacity-80">More varied & unique</div>
                    </button>
                  </div>

                  {/* Fine Control Slider */}
                  <div className="space-y-2">
                    <div className="relative pt-1">
                      <input
                        type="range"
                        value={persona.temperature}
                        onChange={(e) => setPersona(prev => ({ 
                          ...prev, 
                          temperature: parseFloat(e.target.value)
                        }))}
                        min="0"
                        max="1"
                        step="0.1"
                        className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between mt-2 px-1">
                        <span className="text-xs text-zinc-500">0.0</span>
                        <span className="text-xs text-zinc-500">0.5</span>
                        <span className="text-xs text-zinc-500">1.0</span>
                      </div>
                    </div>
                  </div>

                  {/* Description based on current value */}
                  <div className="text-sm text-zinc-400">
                    {persona.temperature <= 0.3 && (
                      "Responses will be more consistent, factual, and deterministic."
                    )}
                    {persona.temperature > 0.3 && persona.temperature < 0.8 && (
                      "Balanced between consistency and creativity in responses."
                    )}
                    {persona.temperature >= 0.8 && (
                      "Responses will be more creative, varied, and exploratory."
                    )}
                  </div>
                </div>

                {/* Max Tokens */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <label className="text-zinc-300 text-sm font-medium">Max Tokens</label>
                      {renderTooltip("Maximum length of the response. Claude supports up to 8,192 output tokens.")}
                    </div>
                    <span className="text-blue-400 font-mono text-sm">{persona.maxTokens.toLocaleString()}</span>
                  </div>
                  <select
                    value={persona.maxTokens}
                    onChange={(e) => setPersona(prev => ({ 
                      ...prev, 
                      maxTokens: parseInt(e.target.value) 
                    }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white
                             focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  >
                    <option value="1024">1,024 tokens (Short responses)</option>
                    <option value="2048">2,048 tokens (Medium responses)</option>
                    <option value="4096">4,096 tokens (Long responses)</option>
                    <option value="8192">8,192 tokens (Maximum length)</option>
                  </select>
                  <p className="text-zinc-400 text-xs">
                    1 token ≈ 4 characters or ¾ of a word
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-800">
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
            disabled={!persona.name.trim()}
            className="px-4 py-2 text-blue-600 hover:text-white rounded-lg
                     transition-colors flex items-center gap-2 disabled:opacity-50
                     disabled:cursor-not-allowed"
          >
            <Save size={16} />
            {initialPersona ? 'Save Changes' : 'Create Persona'}
          </button>
        </div>
      </div>
    </div>
  );
};