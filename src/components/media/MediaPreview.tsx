import React from 'react';
import { MediaFile } from '@/types';

interface MediaPreviewProps {
  media: MediaFile[];
  onRemove?: (index: number) => void;
  className?: string;
}

const MediaPreview: React.FC<MediaPreviewProps> = ({ 
  media, 
  onRemove,
  className = ''
}) => {
  if (media.length === 0) return null;

  return (
    <div className={`grid gap-2 ${className}`} style={{
      gridTemplateColumns: media.length === 1 ? '1fr' : 
                           media.length === 2 ? '1fr 1fr' : 
                           media.length === 3 ? '1fr 1fr' : 
                           '1fr 1fr',
    }}>
      {media.map((item, index) => (
        <div key={index} className="relative group">
          {item.type === 'image' ? (
            <img 
              src={item.url} 
              alt={`Preview ${index + 1}`}
              className="w-full h-40 object-cover rounded-lg"
            />
          ) : (
            <video 
              src={item.url} 
              className="w-full h-40 object-cover rounded-lg"
            />
          )}
          
          {onRemove && (
            <button
              onClick={() => onRemove(index)}
              className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="移除媒体"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default MediaPreview;