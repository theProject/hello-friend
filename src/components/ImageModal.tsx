// src/components/ImageModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Download, ZoomIn, ZoomOut } from 'lucide-react';
import Image from 'next/image';

interface ImageModalProps {
  imageUrl: string;
  alt: string;
  onClose: () => void;
  onDownload: () => void;
  glassStyle?: string;
  messageStyle?: string;
}

const ImageModal: React.FC<ImageModalProps> = ({ 
  imageUrl, 
  alt, 
  onClose, 
  onDownload,
  glassStyle 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isFullSize, setIsFullSize] = useState(false);

  useEffect(() => {
    // Get the original image dimensions
    const img = new window.Image();
    img.onload = () => {
      setDimensions({ width: img.width, height: img.height });
      setIsLoading(false);
    };
    img.src = imageUrl;
  }, [imageUrl]);

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

  const toggleFullSize = () => {
    setIsFullSize(!isFullSize);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className={`relative max-w-5xl w-full rounded-lg shadow-xl overflow-hidden ${glassStyle || 'bg-white dark:bg-gray-800'}`}>
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <button
            onClick={toggleFullSize}
            className="p-2 rounded-full bg-gray-800 bg-opacity-50 hover:bg-opacity-75 text-white transition-all"
            aria-label={isFullSize ? "Fit to screen" : "View full size"}
          >
            {isFullSize ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
          </button>
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
        
        <div className={`flex items-center justify-center ${isFullSize ? 'overflow-auto' : 'overflow-hidden'} max-h-[85vh]`}>
          {isLoading ? (
            <div className="h-96 w-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
            </div>
          ) : (
            isFullSize ? (
              // Full-size image (actual dimensions)
              <div className="overflow-auto max-h-[85vh] min-h-[50vh] w-full">
                {/* Using Next.js Image component with unoptimized prop for full-size view */}
                <Image 
                  src={imageUrl}
                  alt={alt}
                  width={dimensions.width}
                  height={dimensions.height}
                  className="max-w-none"
                  unoptimized={true} // Skip optimization for full-size view
                  style={{ width: dimensions.width, height: dimensions.height }}
                />
              </div>
            ) : (
              // Contained image (fit to screen)
              <div className="relative max-h-[85vh] min-h-[50vh] w-full flex items-center justify-center">
                <Image 
                  src={imageUrl}
                  alt={alt}
                  width={dimensions.width}
                  height={dimensions.height}
                  className="object-contain max-h-[85vh]"
                  unoptimized={false} // Use optimization for contained view
                />
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageModal;