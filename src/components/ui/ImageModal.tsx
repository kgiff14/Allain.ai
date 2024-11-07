import React from 'react';
import { X } from 'lucide-react';

interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
  alt?: string;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose, alt }) => {
  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-[90vw] max-h-[90vh]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 bg-zinc-800 hover:bg-zinc-700 
                   text-zinc-400 hover:text-white rounded-full p-2 transition-colors"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {/* Image */}
        <img
          src={imageUrl}
          alt={alt || "Enlarged view"}
          className="rounded-lg max-w-full max-h-[90vh] object-contain"
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image
        />
      </div>
    </div>
  );
};

export default ImageModal;