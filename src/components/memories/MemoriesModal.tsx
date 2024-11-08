import React, { useEffect, useRef, useState } from 'react';
import { X, Plus, Brain, Trash2, Edit2, Check } from 'lucide-react';
import { PersonaWithMemory, MemoryConfig } from '../../types/memory';
import { formatTimestamp } from '../../utils/formatTimestamp';

interface MemoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  persona: PersonaWithMemory;
  onAddMemory: (content: string) => void;
  onDeleteMemory: (memoryId: string) => void;
  onUpdateMemoryConfig: (config: Partial<MemoryConfig>) => void;
  onEditMemory?: (memoryId: string, newContent: string) => void;
}

export const MemoriesModal: React.FC<MemoriesModalProps> = ({
  isOpen,
  onClose,
  persona,
  onAddMemory,
  onDeleteMemory,
  onUpdateMemoryConfig,
  onEditMemory
}) => {
  const [newMemory, setNewMemory] = useState('');
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
  
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }
  
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleStartEdit = (memoryId: string, content: string) => {
    setEditingMemoryId(memoryId);
    setEditingContent(content);
  };

  const handleSaveEdit = (memoryId: string) => {
    if (onEditMemory && editingContent.trim()) {
      onEditMemory(memoryId, editingContent);
    }
    setEditingMemoryId(null);
    setEditingContent('');
  };

  const handleCancelEdit = () => {
    setEditingMemoryId(null);
    setEditingContent('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-lg w-full max-w-2xl h-[calc(100vh-8rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <Brain className="text-zinc-400" size={20} />
            <div>
              <h2 className="text-lg font-semibold text-white">
                {persona.name}'s Memories
              </h2>
              <p className="text-sm text-zinc-400">
                {persona.memories?.length || 0} memories stored
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Memory Settings */}
        <div className="border-b border-zinc-800">
          <div className="p-4 flex items-center justify-between gap-8">
            {/* Use Memories Toggle */}
            <div className="flex items-center gap-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={persona.memoryConfig?.useMemories}
                  onChange={(e) => onUpdateMemoryConfig({ useMemories: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-4 
                              peer-focus:ring-blue-800 rounded-full peer 
                              peer-checked:after:translate-x-full peer-checked:bg-blue-600
                              after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                              after:bg-white after:rounded-full after:h-5 after:w-5 
                              after:transition-all">
                </div>
              </label>
              <div>
                <div className="text-sm font-medium text-white">Use Memories</div>
                <div className="text-xs text-zinc-400">Include in conversations</div>
              </div>
            </div>

            {/* Collect Memories Toggle */}
            <div className="flex items-center gap-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={persona.memoryConfig?.collectMemories}
                  onChange={(e) => onUpdateMemoryConfig({ collectMemories: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-4 
                              peer-focus:ring-blue-800 rounded-full peer 
                              peer-checked:after:translate-x-full peer-checked:bg-blue-600
                              after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                              after:bg-white after:rounded-full after:h-5 after:w-5 
                              after:transition-all">
                </div>
              </label>
              <div>
                <div className="text-sm font-medium text-white">Collect Memories <span className="text-blue-400 text-xs font-medium">beta</span></div>
                <div className="text-xs text-zinc-400">Auto-detect important info</div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {/* Add Memory */}
          <div className="p-4 border-b border-zinc-800">
            <div className="flex gap-2">
              <textarea
                value={newMemory}
                onChange={(e) => setNewMemory(e.target.value)}
                placeholder="Add a new memory..."
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2
                         text-white placeholder-zinc-500 focus:border-blue-500
                         focus:ring-1 focus:ring-blue-500 resize-none h-20"
              />
              <button
                onClick={() => {
                  if (newMemory.trim()) {
                    onAddMemory(newMemory);
                    setNewMemory('');
                  }
                }}
                disabled={!newMemory.trim()}
                className="flex items-center gap-2 px-4 py-2 text-blue-600
                         rounded-lg hover:text-white disabled:opacity-50
                         disabled:cursor-not-allowed transition-colors h-20"
              >
                <Plus size={16} />
                Add
              </button>
            </div>
          </div>

          {/* Memories List - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {persona.memories?.map((memory) => (
              <div
                key={memory.id}
                className="group flex items-start justify-between p-4 bg-zinc-800/50
                         rounded-lg border border-zinc-700 hover:border-zinc-600"
              >
                <div className="flex-1 mr-4">
                  {editingMemoryId === memory.id ? (
                    <textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="w-full bg-zinc-700 text-white rounded-lg p-2 mb-2 resize-none"
                      rows={3}
                      autoFocus
                    />
                  ) : (
                    <p className="text-white whitespace-pre-wrap">{memory.content}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400">
                    <span>{formatTimestamp(memory.createdAt)}</span>
                    <span>•</span>
                    <span>{memory.source === 'auto' ? 'Auto-detected' : 'Manually added'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {editingMemoryId === memory.id ? (
                    <>
                      <button
                        onClick={() => handleSaveEdit(memory.id)}
                        className="p-1 text-green-400 hover:text-green-300 transition-colors"
                        title="Save changes"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-1 text-zinc-400 hover:text-zinc-300 transition-colors"
                        title="Cancel editing"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleStartEdit(memory.id, memory.content)}
                        className="p-1 text-zinc-400 hover:text-zinc-300 transition-colors"
                        title="Edit memory"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => onDeleteMemory(memory.id)}
                        className="p-1 text-zinc-400 hover:text-red-400 transition-colors"
                        title="Delete memory"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}

            {!persona.memories?.length && (
              <div className="text-center py-8 text-zinc-400">
                <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No memories stored yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemoriesModal;