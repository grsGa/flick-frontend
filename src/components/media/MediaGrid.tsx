import React from 'react';
import { Media, MediaType } from '@/graphql/types';

interface MediaGridProps {
  media: Media[];
  className?: string;
}

const MediaGrid: React.FC<MediaGridProps> = ({ media, className = '' }) => {
  if (media.length === 0) return null;

  // For single media item
  if (media.length === 1) {
    const item = media[0];
    return (
      <div className={`rounded-xl overflow-hidden ${className}`}>
        {item.type === MediaType.IMAGE ? (
          <img 
            src={item.url} 
            alt="Post media"
            className="w-full h-auto object-cover max-h-96"
          />
        ) : (
          <video 
            src={item.url} 
            controls
            className="w-full h-auto object-cover max-h-96"
          />
        )}
      </div>
    );
  }

  // For multiple media items (up to 4)
  const displayedMedia = media.slice(0, 4);
  const gridClass = displayedMedia.length === 2 
    ? 'grid grid-cols-2 gap-1' 
    : displayedMedia.length === 3
    ? 'grid grid-cols-2 gap-1 grid-rows-2'
    : 'grid grid-cols-2 gap-1';

  return (
    <div className={`${gridClass} rounded-xl overflow-hidden ${className}`}>
      {displayedMedia.map((item, index) => (
        <div 
          key={item.id} 
          className={`
            ${displayedMedia.length === 3 && index === 0 ? 'row-span-2' : ''}
            overflow-hidden
          `}
        >
          {item.type === MediaType.IMAGE ? (
            <img 
              src={item.url} 
              alt={`Post media ${index + 1}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <video 
              src={item.url} 
              className="w-full h-full object-cover"
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default MediaGrid;