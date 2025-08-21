import React, { useState, useCallback } from 'react';
import { Media, MediaType, MediaVariant } from '@/graphql/types';

interface OptimizedMediaGridProps {
  media: Media[];
  className?: string;
  priority?: 'thumbnail' | 'small' | 'medium'; // 优先加载的版本
}

const OptimizedMediaGrid: React.FC<OptimizedMediaGridProps> = ({ 
  media, 
  className = '',
  priority = 'thumbnail' // 默认优先加载缩略图
}) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [fullSizeImages, setFullSizeImages] = useState<Set<string>>(new Set());

  if (media.length === 0) return null;

  // 获取最佳显示URL
  const getBestUrl = useCallback((item: Media, preferHighRes = false): string => {
    if (!item.variants) {
      return item.url; // 回退到原始URL
    }

    if (preferHighRes) {
      // 点击后显示高分辨率版本
      return item.variants.large?.url || 
             item.variants.medium?.url || 
             item.variants.original?.url || 
             item.url;
    } else {
      // 首页显示优化版本
      switch (priority) {
        case 'small':
          return item.variants.small?.url || 
                 item.variants.thumbnail?.url || 
                 item.url;
        case 'medium':
          return item.variants.medium?.url || 
                 item.variants.small?.url || 
                 item.variants.thumbnail?.url || 
                 item.url;
        default: // thumbnail
          return item.variants.thumbnail?.url || 
                 item.variants.small?.url || 
                 item.url;
      }
    }
  }, [priority]);

  // 获取视频预览图
  const getVideoPreview = useCallback((item: Media): string => {
    if (!item.variants) {
      return item.url; // 如果没有variants，使用原始URL
    }
    
    return item.variants.preview?.url || 
           item.variants.thumbnail?.url || 
           item.url;
  }, []);

  // 获取视频播放URL
  const getVideoUrl = useCallback((item: Media, quality: 'low' | 'mid' | 'high' = 'mid'): string => {
    if (!item.variants) {
      return item.url;
    }

    switch (quality) {
      case 'low':
        return item.variants.lowRes?.url || item.url;
      case 'high':
        return item.variants.highRes?.url || 
               item.variants.midRes?.url || 
               item.url;
      default: // mid
        return item.variants.midRes?.url || 
               item.variants.lowRes?.url || 
               item.url;
    }
  }, []);

  // 处理图片点击 - 显示高分辨率版本
  const handleImageClick = useCallback((item: Media) => {
    if (item.type === MediaType.IMAGE) {
      setFullSizeImages(prev => new Set([...prev, item.id]));
    }
  }, []);

  // 处理图片加载完成
  const handleImageLoad = useCallback((itemId: string) => {
    setLoadedImages(prev => new Set([...prev, itemId]));
  }, []);

  // 渲染单个媒体项
  const renderMediaItem = useCallback((item: Media, index: number, isGrid = false) => {
    const isLoaded = loadedImages.has(item.id);
    const showFullSize = fullSizeImages.has(item.id);
    
    if (item.type === MediaType.IMAGE) {
      const displayUrl = showFullSize ? getBestUrl(item, true) : getBestUrl(item, false);
      
      return (
        <div 
          key={item.id}
          className={`relative overflow-hidden cursor-pointer ${isGrid ? 'h-full' : ''}`}
          onClick={() => handleImageClick(item)}
        >
          {/* 加载占位符 */}
          {!isLoaded && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          
          <img 
            src={displayUrl}
            alt={item.altText || `Post media ${index + 1}`}
            className={`
              w-full h-full object-cover transition-opacity duration-300
              ${isLoaded ? 'opacity-100' : 'opacity-0'}
              ${isGrid ? 'object-cover' : 'object-contain'}
            `}
            onLoad={() => handleImageLoad(item.id)}
            loading="lazy" // 原生懒加载
          />
          
          {/* 点击提示 */}
          {!showFullSize && isLoaded && (
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
              <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                点击查看高清
              </div>
            </div>
          )}
        </div>
      );
    } else if (item.type === MediaType.VIDEO) {
      const previewUrl = getVideoPreview(item);
      const videoUrl = getVideoUrl(item);
      
      return (
        <div key={item.id} className={`relative overflow-hidden ${isGrid ? 'h-full' : ''}`}>
          <video 
            src={videoUrl}
            poster={previewUrl} // 使用预览图作为封面
            controls
            preload="metadata" // 只预加载元数据，不预加载视频内容
            className={`
              w-full h-full
              ${isGrid ? 'object-cover' : 'object-contain max-h-96'}
            `}
          />
          
          {/* 视频标识 */}
          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
            {item.duration ? `${Math.floor(item.duration / 60)}:${String(item.duration % 60).padStart(2, '0')}` : 'VIDEO'}
          </div>
        </div>
      );
    }
    
    return null;
  }, [loadedImages, fullSizeImages, getBestUrl, getVideoPreview, getVideoUrl, handleImageClick, handleImageLoad]);

  // 单个媒体项
  if (media.length === 1) {
    const item = media[0];
    return (
      <div className={`rounded-xl overflow-hidden ${className}`}>
        {renderMediaItem(item, 0)}
      </div>
    );
  }

  // 多个媒体项网格布局
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
            overflow-hidden relative
          `}
        >
          {renderMediaItem(item, index, true)}
          
          {/* 更多媒体提示 */}
          {index === 3 && media.length > 4 && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white text-lg font-semibold">
                +{media.length - 4}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default OptimizedMediaGrid;
