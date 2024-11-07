import React, { useCallback, useState } from 'react';
import { Image as ImageIcon, X } from 'lucide-react';

interface ImageUploadProps {
  onImageAdd: (file: File) => void;
  onImageRemove: (index: number) => void;
  images: File[];
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageAdd, onImageRemove, images }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    imageFiles.forEach(file => onImageAdd(file));
  }, [onImageAdd]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) onImageAdd(file);
      }
    }
  }, [onImageAdd]);

  return (
    <div 
      className="relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handlePaste}
    >
      {/* Image previews */}
      {images.length > 0 && (
        <div className="flex gap-2 mb-2 flex-wrap">
          {images.map((file, index) => (
            <div 
              key={index}
              className="relative group"
            >
              <img
                src={URL.createObjectURL(file)}
                alt={`Preview ${index + 1}`}
                className="w-16 h-16 object-cover rounded-md border border-zinc-700"
              />
              <button
                onClick={() => onImageRemove(index)}
                className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 
                         text-white opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove image"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      <label className="cursor-pointer inline-block">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => {
            const files = Array.from(e.target.files || []);
            files.forEach(file => onImageAdd(file));
            e.target.value = ''; // Reset input
          }}
          multiple
        />
        <div className="p-2 text-zinc-400 hover:text-zinc-300 transition-colors">
          <ImageIcon size={20} />
        </div>
      </label>

      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-zinc-800/90 border-2 border-dashed 
                      border-blue-400 rounded-lg flex items-center justify-center">
          <span className="text-blue-400">Drop image here</span>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;