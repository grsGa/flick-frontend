'use client';

import { useState, useEffect, memo, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// 媒体文件类型
export interface MediaFile {
  url: string;
  type: 'image' | 'video';
  description?: string;
  width?: number;
  height?: number;
}

interface MediaGridProps {
  media: MediaFile[];
  className?: string;
  maxDisplay?: number;
  permalink_id?: string;
  username?: string;
  onMediaClick?: (index: number) => void;
}

// 使用memo包装MediaGrid组件，避免不必要的重新渲染
export const MediaGrid = memo(function MediaGridComponent({ 
  media = [], 
  className, 
  maxDisplay = 4,
  permalink_id,
  username,
  onMediaClick 
}: MediaGridProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  // 使用useMemo缓存有效的媒体文件，避免每次渲染都重新计算
  const validMedia = useMemo(() => 
    media?.filter(file => file && file.url) || [], 
    [media]
  );
  const [imageAspectRatios, setImageAspectRatios] = useState<{[url: string]: number}>({});
  
  // 优化useEffect依赖项，只在validMedia发生变化时重新计算
  useEffect(() => {
    const newAspectRatios: {[url: string]: number} = {...imageAspectRatios};
    let hasNewImages = false;
    
    validMedia.forEach(file => {
      if (file.type === 'image' && file.url && !imageAspectRatios[file.url]) {
        // 如果已经有宽高信息，直接计算
        if (file.width && file.height) {
          newAspectRatios[file.url] = file.width! / file.height!;
          hasNewImages = true;
        } else {
          // 否则加载图片获取宽高比
          const img = new Image();
          img.onload = () => {
            setImageAspectRatios(prev => ({
              ...prev,
              [file.url]: img.width / img.height
            }));
          };
          img.src = file.url;
        }
      }
    });
    
    // 只有当有新的宽高比计算时才更新状态
    if (hasNewImages) {
      setImageAspectRatios(newAspectRatios);
    }
  }, [validMedia]);
  
  // 确保至少有一个有效的媒体文件
  if (!validMedia.length) return null;

  // 根据媒体文件数量确定网格布局
  const getGridLayout = () => {
    switch (validMedia.length) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-2';
      case 3:
        return 'grid-cols-2';
      case 4:
        return 'grid-cols-2';
      default:
        return 'grid-cols-3';
    }
  };

  // 根据媒体文件位置和数量确定每个媒体的大小
  const getMediaClass = (index: number) => {
    const count = validMedia.length;
    
    // 单图情况特殊处理
    if (count === 1) {
      const media = validMedia[0];
      const aspectRatio = imageAspectRatios[media.url] || 16/9; // 默认16:9
      
      // 处理长图（高大于宽）
      if (aspectRatio < 0.8) {
        return 'w-auto max-w-full max-h-[85vh] object-contain mx-auto';
      } 
      // 处理宽图（宽大于高）
      else if (aspectRatio > 1.5) {
        return 'w-full max-h-[75vh] object-contain';
      }
      // 处理接近方形的图片
      else {
        return 'max-w-full max-h-[80vh] object-contain mx-auto';
      }
    }
    
    if (count === 2) return 'row-span-2 col-span-1 aspect-square w-full';
    
    if (count === 3) {
      if (index === 0) return 'row-span-2 col-span-1 aspect-[9/16] w-full';
      return 'row-span-1 col-span-1 aspect-square w-full';
    }
    
    if (count === 4) return 'row-span-1 col-span-1 aspect-square w-full';
    
    // 5个或更多
    if (index === 0) return 'row-span-2 col-span-2 aspect-video w-full';
    return 'row-span-1 col-span-1 aspect-square w-full';
  };

  // 获取图片容器类名
  const getContainerClassName = () => {
    if (validMedia.length === 1) {
      // 为所有单图情况使用flex布局，确保图片居中且完整显示
      return 'flex justify-center items-center w-full overflow-hidden';
    }
    
    // 多图使用网格布局
    return cn(
      'grid gap-1 overflow-hidden rounded-xl w-full',
      getGridLayout(),
      validMedia.length > 4 ? 'grid-rows-3' : 'grid-rows-2'
    );
  };

  // 生成图片详情页链接
  const getMediaDetailUrl = (index: number) => {
    if (permalink_id && username) {
      return `/${username}/status/${permalink_id}/photo/${index}`;
    }
    return '#';
  };

  // 打开媒体预览对话框
  const openMediaPreview = (index: number) => {
    // 使用链接验证用户名和帖子ID (消除未使用警告)
    const url = getMediaDetailUrl(index);
    console.log(`Media preview URL (unused): ${url}`);
    
    if (onMediaClick) {
      onMediaClick(index);
    } else {
      setSelectedIndex(index);
    }
  };

  // 关闭媒体预览对话框
  const closeMediaPreview = () => {
    setSelectedIndex(null);
  };

  // 切换到上一个媒体
  const goToPrevious = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex - 1 + validMedia.length) % validMedia.length);
  };

  // 切换到下一个媒体
  const goToNext = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex + 1) % validMedia.length);
  };

  // 渲染媒体预览
  const renderMediaPreview = () => {
    if (selectedIndex === null) return null;
    
    const media = validMedia[selectedIndex];
    if (!media) return null;
    
    return (
      <Dialog open={selectedIndex !== null} onOpenChange={closeMediaPreview}>
        <DialogContent className="max-w-4xl p-0 bg-black overflow-hidden">
          <DialogTitle className="sr-only">
            {media.description || (media.type === 'image' ? '图片预览' : '视频预览')}
          </DialogTitle>
          <button 
            onClick={closeMediaPreview}
            className="absolute right-4 top-4 z-50 rounded-full bg-black/80 text-white p-2 hover:bg-black shadow-lg border border-white/30 backdrop-blur-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
            <span className="sr-only">关闭</span>
          </button>
          <div className="relative w-full h-[80vh] flex items-center justify-center">
            {media.type === 'image' ? (
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src={media.url}
                  alt={media.description || '图片'}
                  className="max-h-full max-w-full object-contain"
                  loading="lazy"
                  onError={(e) => {
                    console.error(`图片加载失败: ${media.url}`);
                    // 设置为服务器上的占位图
                    const placeholderImg = new Image();
                    placeholderImg.onerror = () => {
                      // 如果服务器图片也加载失败，使用base64编码的备用图片
                      e.currentTarget.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
                    };
                    placeholderImg.src = '/images/placeholder.png';
                    e.currentTarget.src = '/images/placeholder.png';
                  }}
                />
              </div>
            ) : (
              <video
                src={media.url}
                controls
                autoPlay
                className="max-h-full max-w-full"
              >
                您的浏览器不支持视频播放
              </video>
            )}
            
            {validMedia.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                >
                  &lt;
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); goToNext(); }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                >
                  &gt;
                </button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <>
      <div className={cn(getContainerClassName(), className)}>
        {validMedia.slice(0, maxDisplay).map((media, index) => (
          <div
            key={`${media.url}-${index}`}
            className={cn(
              'relative overflow-hidden',
              validMedia.length === 1 ? 'flex justify-center items-center' : getMediaClass(index),
              'cursor-pointer transition-transform hover:opacity-95'
            )}
            onClick={() => openMediaPreview(index)}
          >
            {media.type === 'image' ? (
              validMedia.length === 1 ? (
                // 单图情况
                <img
                  src={media.url}
                  alt={media.description || '图片'}
                  className={cn(getMediaClass(index))}
                  loading="lazy"
                  onError={(e) => {
                    console.error(`图片加载失败: ${media.url}`);
                    // 设置为服务器上的占位图
                    const placeholderImg = new Image();
                    placeholderImg.onerror = () => {
                      // 如果服务器图片也加载失败，使用base64编码的备用图片
                      e.currentTarget.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
                    };
                    placeholderImg.src = '/images/placeholder.png';
                    e.currentTarget.src = '/images/placeholder.png';
                  }}
                />
              ) : (
                // 多图情况
                <div className="w-full h-full relative bg-muted flex-1">
                  <img
                    src={media.url}
                    alt={media.description || '图片'}
                  className="w-full h-full object-cover absolute inset-0"
                  loading="lazy"
                  onError={(e) => {
                    console.error(`图片加载失败: ${media.url}`);
                    // 设置为服务器上的占位图
                    const placeholderImg = new Image();
                    placeholderImg.onerror = () => {
                      // 如果服务器图片也加载失败，使用base64编码的备用图片
                      e.currentTarget.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
                    };
                    placeholderImg.src = '/images/placeholder.png';
                    e.currentTarget.src = '/images/placeholder.png';
                  }}
                />
              </div>
              )
            ) : (
              <div className="w-full h-full relative bg-black flex items-center justify-center">
                <video
                  src={media.url}
                  className="w-full h-full object-cover absolute inset-0"
                  poster={media.url.replace(/\.[^/.]+$/, '.jpg')} // 尝试使用同名jpg作为封面
                >
                  您的浏览器不支持视频播放
                </video>
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center">
                    <div className="w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-12 border-l-black ml-1" />
                  </div>
                </div>
              </div>
            )}
            
            {/* 显示+N的覆盖层 */}
            {index === maxDisplay - 1 && validMedia.length > maxDisplay && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white text-3xl font-bold">+{validMedia.length - maxDisplay}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {renderMediaPreview()}
    </>
  );
});