// src/components/ImageModal.tsx
import React from 'react';
import { X, Download } from 'lucide-react';
import Image from 'next/image';

interface ImageModalProps {
  imageUrl: string;
  alt: string;
  onClose: () => void;
  onDownload: () => void;
  glassStyle?: string;
  messageStyle?: string;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, alt, onClose, onDownload }) => {
  const handleDownload = async () => {
    if (onDownload) {
      onDownload();
    } else {
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `image-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.error('Error downloading image:', error);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="relative max-w-4xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl">
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <button
            onClick={handleDownload}
            className="p-2 rounded-full bg-gray-800 bg-opacity-50 hover:bg-opacity-75 text-white transition-all"
            aria-label="Download image"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-gray-800 bg-opacity-50 hover:bg-opacity-75 text-white transition-all"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="relative overflow-auto max-h-[90vh] rounded-lg modalImageContainer">
          <Image 
            src={imageUrl}
            alt={alt}
            fill
            className="customObjectContain"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
};

export default ImageModal;
