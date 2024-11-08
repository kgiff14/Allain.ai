import React, { useState, useEffect } from 'react';
import { X, Database, HardDrive, Trash2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import ConfirmDialog from './ConfirmDialog';
import { projectStore } from '../../services/projectStore';
import { improvedVectorStore } from '../../services/improvedVectorStore';
import { formatBytes } from '../../utils/formatBytes';
import { fsService } from '../../services/fsService';

interface MemoryManagementDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const getStorageUsage = async () => {
  try {
    // IndexedDB usage
    const vectorStoreUsage = await navigator.storage.estimate();
    const vectorStoreQuota = vectorStoreUsage.quota || 0;
    const vectorStoreUsed = vectorStoreUsage.usage || 0;

    // LocalStorage usage
    const localStorageUsed = new Blob(Object.values(localStorage)).size;
    const localStorageQuota = 10 * 1024 * 1024; // 5MB typical limit

    return {
      vectorStore: {
        used: vectorStoreUsed,
        quota: vectorStoreQuota,
        percentage: (vectorStoreUsed / vectorStoreQuota) * 100
      },
      localStorage: {
        used: localStorageUsed,
        quota: localStorageQuota,
        percentage: (localStorageUsed / localStorageQuota) * 100
      }
    };
  } catch (error) {
    console.error('Error getting storage usage:', error);
    throw error;
  }
};

// In MemoryManagementDrawer.tsx

const clearAllStorage = async (): Promise<void> => {
  console.log('Starting storage clearing process...');

  try {
    // 1. Clear Vector Store contents
    console.log('Clearing vector store contents...');
    await improvedVectorStore.clearAllVectors();
    
    // 2. Clear File System Storage
    console.log('Clearing file system storage...');
    const allProjects = projectStore.getAllProjects();
    const allDocuments = allProjects.flatMap(project => project.documents);
    console.log('Found documents:', allDocuments.length);

    if (allDocuments.length > 0) {
      for (const doc of allDocuments) {
        try {
          console.log('Deleting file:', doc.name);
          await window.fs.unlink(doc.name);
          console.log('Successfully deleted file:', doc.name);
        } catch (error) {
          console.error('Error deleting file:', doc.name, error);
        }
      }
    }

    // 3. Clear Local Storage
    console.log('Clearing local storage...');
    localStorage.clear();
    console.log('Local storage cleared');
    
    console.log('Storage clearing process completed successfully');
  } catch (error) {
    console.error('Error in clearAllStorage:', error);
    throw error;
  }
};

export const MemoryManagementDrawer: React.FC<MemoryManagementDrawerProps> = ({
  isOpen,
  onClose
}) => {
  const [usageData, setUsageData] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsageData = async () => {
    try {
      const usage = await getStorageUsage();
      setUsageData(usage);
      
      setHistoryData(prev => {
        const newData = [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          vectorStore: usage.vectorStore.percentage,
          localStorage: usage.localStorage.percentage
        }];
        return newData.slice(-10);
      });
    } catch (error) {
      console.error('Error loading usage data:', error);
      setError('Failed to load storage usage data');
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUsageData();
      const interval = setInterval(loadUsageData, 30000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const handleClearStorage = async () => {
    if (isDeleting) return;
  
    try {
      setIsDeleting(true);
      setError(null);
      console.log('Starting storage clearing...');
  
      await clearAllStorage();
      
      console.log('Storage cleared successfully');
      setIsConfirmOpen(false);
      
      // Small delay before reload to ensure all state updates are processed
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

      {/* Drawer */}
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
          <div className="p-4 bg-zinc-800/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Database size={16} className="text-zinc-400" />
                <span className="text-zinc-300">Vector Store</span>
              </div>
              <span className="text-zinc-400 text-sm">
                {usageData && `${formatBytes(usageData.vectorStore.used)} / ${formatBytes(usageData.vectorStore.quota)}`}
              </span>
            </div>
            <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${usageData?.vectorStore.percentage || 0}%` }}
              />
            </div>
          </div>

          {/* Local Storage Usage */}
          <div className="p-4 bg-zinc-800/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <HardDrive size={16} className="text-zinc-400" />
                <span className="text-zinc-300">Local Storage</span>
              </div>
              <span className="text-zinc-400 text-sm">
                {usageData && `${formatBytes(usageData.localStorage.used)} / ${formatBytes(usageData.localStorage.quota)}`}
              </span>
            </div>
            <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${usageData?.localStorage.percentage || 0}%` }}
              />
            </div>
          </div>

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
                    tickFormatter={(value) => value.split(':')[0] + ':' + value.split(':')[1]}
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
                    dataKey="vectorStore" 
                    stroke="#3b82f6" 
                    name="Vector Store"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="localStorage" 
                    stroke="#22c55e"
                    name="Local Storage"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Add error display */}
          {error && (
            <div className="px-6 mb-4">
              <div className="p-4 bg-red-900/50 border border-red-500/50 rounded-lg text-red-200 text-sm">
                {error}
              </div>
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