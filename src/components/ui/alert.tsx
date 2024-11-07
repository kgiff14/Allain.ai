// components/ui/alert.tsx
import React from 'react';

interface AlertProps {
  children: React.ReactNode;
  variant?: 'default' | 'destructive';
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ 
  children, 
  variant = 'default',
  className = ''
}) => {
  const baseStyles = 'p-4 rounded-lg border';
  const variantStyles = {
    default: 'bg-zinc-800 border-zinc-700 text-zinc-100',
    destructive: 'bg-red-900/50 border-red-500/50 text-red-200'
  };

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {children}
    </div>
  );
};

export const AlertDescription: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="text-sm">{children}</div>;
};