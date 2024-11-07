import React, { useState, useEffect } from 'react';
import { X, Settings2, Info } from 'lucide-react';

interface ModelConfig {
  maxTokens: number;
  temperature: number;
  systemMessage: string;
}

interface ConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_CONFIG: ModelConfig = {
  maxTokens: 4096,
  temperature: 0.7,
  systemMessage: "You are Allain, an AI assistant that is an expert in software development. You provide complete and reviewed feedback. You remain objective to the information you have and what the best practices are for a given scenario. If you don't know an answer, please express that you dont know."
};

const ConfigDrawer: React.FC<ConfigDrawerProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<ModelConfig>(() => {
    const savedConfig = localStorage.getItem('modelConfig');
    return savedConfig ? JSON.parse(savedConfig) : DEFAULT_CONFIG;
  });

  useEffect(() => {
    localStorage.setItem('modelConfig', JSON.stringify(config));
  }, [config]);

  const handleChange = (key: keyof ModelConfig, value: string | number) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Reset to defaults
  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
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
              <h2 className="text-lg font-semibold text-white">Model Configuration</h2>
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
          <div className="p-6 space-y-6">
            {/* Max Tokens */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-zinc-300">
                Max Tokens
                <div className="group relative">
                  <Info size={14} className="text-zinc-500" />
                  <div className="absolute left-6 bottom-0 w-48 p-2 bg-zinc-800 rounded text-xs text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    Maximum number of tokens the model can generate in response
                  </div>
                </div>
              </label>
              <input
                type="number"
                value={config.maxTokens}
                onChange={(e) => handleChange('maxTokens', parseInt(e.target.value))}
                min="1"
                max="8,192"
                className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white"
              />
            </div>

            {/* Temperature */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-zinc-300">
                Temperature
                <div className="group relative">
                  <Info size={14} className="text-zinc-500" />
                  <div className="absolute left-6 p-2 bottom-0 w-48 p-1 bg-zinc-800 rounded text-xs text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    Controls randomness in responses (0 = deterministic, 1 = creative)
                  </div>
                </div>
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  value={config.temperature}
                  onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                  min="0"
                  max="1"
                  step="0.1"
                  className="flex-1"
                />
                <span className="text-white w-12 text-center">{config.temperature}</span>
              </div>
            </div>

            {/* System Message */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-zinc-300">
                System Message
                <div className="group relative">
                  <Info size={14} className="text-zinc-500" />
                  <div className="absolute left-6 bottom-0 w-48 p-2 bg-zinc-800 rounded text-xs text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    Initial instructions given to the model
                  </div>
                </div>
              </label>
              <textarea
                value={config.systemMessage}
                onChange={(e) => handleChange('systemMessage', e.target.value)}
                rows={16}
                className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white"
              />
            </div>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2 rounded transition-colors"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfigDrawer;