import React, { useState, useEffect } from 'react';
import { X, Database, HardDrive, Trash2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import ConfirmDialog from './ConfirmDialog';
import { improvedVectorStore } from '../../services/improvedVectorStore';
import { formatBytes } from '../../utils/formatBytes';
import { memoryManagementService, StorageUsage } from '../../services/MemoryManagementService';

interface MemoryManagementDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MemoryManagementDrawer: React.FC<MemoryManagementDrawerProps> = ({
  isOpen,
  onClose
}) => {
  const [usageData, setUsageData] = useState<StorageUsage | null>(null);
  const [historyData, setHistoryData] = useState<StorageUsage[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Subscribe to usage updates
      const subscription = memoryManagementService.usage$.subscribe(data => {
        setHistoryData(data);
        if (data.length > 0) {
          setUsageData(data[data.length - 1]);
        }
      });

      // Force an immediate update when drawer opens
      memoryManagementService.forceUpdate();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [isOpen]);

  const handleClearStorage = async () => {
    if (isDeleting) return;
  
    try {
      setIsDeleting(true);
      setError(null);
      
      await improvedVectorStore.clearAllVectors();
      localStorage.clear();
      
      // Force update usage data
      await memoryManagementService.forceUpdate();
      
      setIsConfirmOpen(false);
      
      // Small delay before reload
      setTimeout(() => {
        window.location.reload();
      }, 100);
      
    } catch (error) {
      console.error('Error in handleClearStorage:', error);
      setError('Failed to clear storage. Please try again.');
      setIsDeleting(false);
    }
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
      {/* Rest of the component remains the same, just update the usage display sections */}
      <div
        className={`fixed left-0 top-0 w-96 h-full bg-zinc-900 border-r border-zinc-800 
                   z-40 transform transition-transform duration-300 ease-in-out 
                   ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <HardDrive className="text-zinc-400" size={20} />
            <h2 className="text-lg font-semibold text-white">Memory Management</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Vector Store Usage */}
          {usageData && (
            <div className="p-4 bg-zinc-800/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Database size={16} className="text-zinc-400" />
                  <span className="text-zinc-300">Vector Store</span>
                </div>
                <span className="text-zinc-400 text-sm">
                  {formatBytes(usageData.vectorStore.used)} / {formatBytes(usageData.vectorStore.quota)}
                </span>
              </div>
              <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${usageData.vectorStore.percentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Local Storage Usage */}
          {usageData && (
            <div className="p-4 bg-zinc-800/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <HardDrive size={16} className="text-zinc-400" />
                  <span className="text-zinc-300">Local Storage</span>
                </div>
                <span className="text-zinc-400 text-sm">
                  {formatBytes(usageData.localStorage.used)} / {formatBytes(usageData.localStorage.quota)}
                </span>
              </div>
              <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${usageData.localStorage.percentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Usage History Graph */}
          <div className="p-4 bg-zinc-800/50 rounded-lg">
            <h3 className="text-zinc-300 mb-4">Usage History</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData}>
                  <XAxis 
                    dataKey="timestamp" 
                    stroke="#71717a"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#71717a"
                    fontSize={12}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#18181b',
                      border: '1px solid #3f3f46',
                      borderRadius: '0.5rem'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="vectorStore.percentage" 
                    stroke="#3b82f6" 
                    name="Vector Store"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="localStorage.percentage" 
                    stroke="#22c55e"
                    name="Local Storage"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="p-4 bg-red-900/50 border border-red-500/50 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Clear Storage Button */}
          <button
            onClick={() => setIsConfirmOpen(true)}
            disabled={isDeleting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 size={16} className={isDeleting ? 'animate-spin' : ''} />
            {isDeleting ? 'Clearing Storage...' : 'Clear All Storage'}
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => {
          if (!isDeleting) {
            setIsConfirmOpen(false);
          }
        }}
        onConfirm={handleClearStorage}
        title="Clear All Storage"
        message="Are you sure you want to clear all storage? This will delete all your chat history, documents, and vector embeddings. This action cannot be undone."
      />
    </>
  );
};