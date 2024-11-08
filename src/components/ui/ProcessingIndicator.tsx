import React from 'react';
import { Loader2 } from 'lucide-react';

interface ProcessingIndicatorProps {
  fileName: string;
  progress?: number;
  status?: string;
}

const ProcessingIndicator: React.FC<ProcessingIndicatorProps> = ({
  fileName,
  progress,
  status = 'Processing'
}) => {
  return (
    <div className="bg-zinc-800/50 rounded-lg p-3">
      <div className="flex items-center gap-3">
        <Loader2 className="animate-spin text-blue-400" size={16} />
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <span className="text-zinc-200 text-sm font-medium">{fileName}</span>
            {typeof progress === 'number' && (
              <span className="text-zinc-400 text-sm">{Math.round(progress)}%</span>
            )}
          </div>
          {/* Progress bar */}
          {typeof progress === 'number' && (
            <div className="mt-2 h-1 bg-zinc-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          <div className="text-zinc-400 text-xs mt-1">{status}</div>
        </div>
      </div>
    </div>
  );
};

export default ProcessingIndicator;