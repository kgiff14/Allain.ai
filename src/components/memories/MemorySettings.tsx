import React from 'react';
import { Brain, BrainCircuit, Info } from 'lucide-react';
import { MemoryConfig } from '../../types/memory';

interface MemorySettingsProps {
  config: MemoryConfig;
  onChange: (config: Partial<MemoryConfig>) => void;
  isDefault?: boolean;
}

export const MemorySettings: React.FC<MemorySettingsProps> = ({ 
  config, 
  onChange,
  isDefault
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="text-zinc-400" size={20} />
        <h3 className="text-lg font-medium text-white">Memory Settings</h3>
      </div>

      {/* Memory Usage Toggle */}
      <div className="flex items-start justify-between p-4 rounded-lg border border-zinc-700 bg-zinc-800/50">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-white">Use Stored Memories</h4>
            <div className="group relative">
              <Info size={14} className="text-zinc-400 hover:text-zinc-300" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 
                            bg-zinc-800 text-xs text-zinc-300 rounded-lg opacity-0 
                            group-hover:opacity-100 transition-opacity pointer-events-none">
                When enabled, stored memories will be included in conversations with this persona
              </div>
            </div>
          </div>
          <p className="text-sm text-zinc-400">
            Include past memories in future conversations
          </p>
        </div>
        <div className="flex items-center h-6">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.useMemories}
              onChange={e => onChange({ useMemories: e.target.checked })}
              disabled={isDefault}
              className="sr-only peer"
            />
            <div className={`w-11 h-6 rounded-full peer 
                           ${isDefault ? 'bg-zinc-600' : 'bg-zinc-700'} 
                           peer-checked:after:translate-x-full 
                           peer-checked:bg-blue-600
                           after:content-[''] after:absolute after:top-[2px] 
                           after:left-[2px] after:bg-white after:rounded-full 
                           after:h-5 after:w-5 after:transition-all`}>
            </div>
          </label>
        </div>
      </div>

      {/* Memory Collection Toggle */}
      <div className="flex items-start justify-between p-4 rounded-lg border border-zinc-700 bg-zinc-800/50">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-white">Collect New Memories</h4>
            <div className="group relative">
              <Info size={14} className="text-zinc-400 hover:text-zinc-300" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 
                            bg-zinc-800 text-xs text-zinc-300 rounded-lg opacity-0 
                            group-hover:opacity-100 transition-opacity pointer-events-none">
                When enabled, new important information will be automatically stored as memories
              </div>
            </div>
          </div>
          <p className="text-sm text-zinc-400">
            Automatically detect and store new memories
          </p>
          {config.collectMemories && (
            <div className="mt-2 text-xs text-blue-400 flex items-center gap-1.5">
              <BrainCircuit size={12} />
              Uses additional AI processing
            </div>
          )}
        </div>
        <div className="flex items-center h-6">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.collectMemories}
              onChange={e => onChange({ collectMemories: e.target.checked })}
              disabled={isDefault}
              className="sr-only peer"
            />
            <div className={`w-11 h-6 rounded-full peer 
                           ${isDefault ? 'bg-zinc-600' : 'bg-zinc-700'} 
                           peer-checked:after:translate-x-full 
                           peer-checked:bg-blue-600
                           after:content-[''] after:absolute after:top-[2px] 
                           after:left-[2px] after:bg-white after:rounded-full 
                           after:h-5 after:w-5 after:transition-all`}>
            </div>
          </label>
        </div>
      </div>

      {isDefault && (
        <div className="text-sm text-zinc-400 flex items-center gap-2">
          <Info size={14} />
          Memory settings cannot be modified for the default persona
        </div>
      )}
    </div>
  );
};