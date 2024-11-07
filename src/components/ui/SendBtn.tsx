import React from 'react';
import { ArrowUp } from 'lucide-react';

const UpArrowButton: React.FC = () => {
  return (
    <button
      className="bg-red-700 p-3 rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition duration-200"
      aria-label="Scroll Up"
    >
      <ArrowUp className="text-white" size={20} />
    </button>
  );
};

export default UpArrowButton;