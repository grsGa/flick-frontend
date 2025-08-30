import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Media, MediaType, MediaVariant, Post } from '@/graphql/types';
import ImageViewer from './ImageViewer';

interface OptimizedMediaGridProps {
  media: Media[];
  className?: string;
  priority?: 'thumbnail' | 'small' | 'medium'; // 优先加载的版本
  post?: Post; // 帖子信息，用于图片查看器
  onLike?: () => void;
  onReply?: () => void;
  onRepost?: () => void;
}

const OptimizedMediaGrid: React.FC<OptimizedMediaGridProps> = ({ 
  media, 
  className = '',
  priority = 'medium', // 默认优先加载中等分辨率图片
  post,
  onLike,
  onReply,
  onRepost
}) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [fullSizeImages, setFullSizeImages] = useState<Set<string>>(new Set());
  const [imageAspectRatios, setImageAspectRatios] = useState<Map<string, number>>(new Map());
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [autoPlayVideos, setAutoPlayVideos] = useState<Set<string>>(new Set());
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

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
          return item.variants.large?.url || 
                 item.variants.medium?.url || 
                 item.variants.small?.url || 
                 item.url;
        default: // thumbnail
          return item.variants.thumbnail?.url || 
                 item.variants.small?.url || 
                 item.url;
      }
    }
  }, [priority]);

  // 获取视频预览图
  const getVideoPreview = useCallback((item: Media): string | undefined => {
    if (!item.variants) {
      return undefined; // 如果没有variants，不设置预览图
    }
    
    // 只有当存在专门的预览图或缩略图时才返回
    const posterUrl = item.variants.preview?.url || item.variants.thumbnail?.url;
    return posterUrl;
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
        const videoUrl = item.variants.highRes?.url || item.variants.midRes?.url || item.variants.lowRes?.url || item.variants.preview?.url || item.url;
        return videoUrl;
      default: // mid
        return item.variants.midRes?.url || 
               item.variants.lowRes?.url || 
               item.url;
    }
  }, []);

  // 处理图片点击 - 打开图片查看器
  const handleImageClick = useCallback((item: Media, index: number) => {
    if (item.type === MediaType.IMAGE) {
      const imageMedia = media.filter(m => m.type === MediaType.IMAGE);
      const imageIndex = imageMedia.findIndex(m => m.id === item.id);
      setCurrentImageIndex(imageIndex >= 0 ? imageIndex : 0);
      setViewerOpen(true);
    }
  }, [media]);

  // 处理图片加载完成并计算纵横比
  const handleImageLoad = useCallback((mediaId: string, event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    const aspectRatio = img.naturalWidth / img.naturalHeight;
    
    setLoadedImages(prev => new Set([...prev, mediaId]));
    setImageAspectRatios(prev => new Map([...prev, [mediaId, aspectRatio]]));
  }, []);

  // 根据纵横比判断图片类型
  const getImageType = useCallback((mediaId: string): 'landscape' | 'portrait' | 'square' => {
    const aspectRatio = imageAspectRatios.get(mediaId);
    if (!aspectRatio) return 'square'; // 默认正方形
    
    if (aspectRatio > 1.3) return 'landscape'; // 长图
    if (aspectRatio < 0.75) return 'portrait'; // 竖图
    return 'square'; // 正方形
  }, [imageAspectRatios]);

  // 视频自动播放逻辑
  const handleVideoIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    entries.forEach((entry) => {
      const videoId = entry.target.getAttribute('data-video-id');
      if (!videoId) return;

      const video = videoRefs.current.get(videoId);
      if (!video) return;

      if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
        // 视频进入视口且可见度超过50%时自动播放
        if (!autoPlayVideos.has(videoId)) {
          video.muted = true; // 静音自动播放
          video.play().catch(console.error);
          setAutoPlayVideos(prev => new Set([...prev, videoId]));
        }
      } else {
        // 视频离开视口时暂停
        if (autoPlayVideos.has(videoId)) {
          video.pause();
          setAutoPlayVideos(prev => {
            const newSet = new Set(prev);
            newSet.delete(videoId);
            return newSet;
          });
        }
      }
    });
  }, [autoPlayVideos]);

  // 设置Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(handleVideoIntersection, {
      threshold: [0.5], // 当视频50%可见时触发
      rootMargin: '0px'
    });

    // 观察所有视频元素
    videoRefs.current.forEach((video) => {
      observer.observe(video);
    });

    return () => {
      observer.disconnect();
    };
  }, [handleVideoIntersection]);

  // 渲染单个媒体项
  const renderMediaItem = useCallback((item: Media, index: number, isGrid = false) => {
    const isLoaded = loadedImages.has(item.id);
    const showFullSize = fullSizeImages.has(item.id);
    
    if (item.type === MediaType.IMAGE) {
      const displayUrl = showFullSize ? getBestUrl(item, true) : getBestUrl(item, false);
      
      return (
        <div 
          key={item.id}
          className={`relative overflow-hidden cursor-pointer ${isGrid ? 'h-full' : 'w-full h-full'}`}
          onClick={() => handleImageClick(item, index)}
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
              transition-opacity duration-300
              ${isLoaded ? 'opacity-100' : 'opacity-0'}
              ${isGrid ? 'w-full h-full object-cover' : 'w-full h-full object-cover'}
            `}
            onLoad={(e) => handleImageLoad(item.id, e)}
            loading="lazy" // 原生懒加载
          />
          
        </div>
      );
    } else if (item.type === MediaType.VIDEO) {
      const previewUrl = getVideoPreview(item);
      const videoUrl = getVideoUrl(item);
      
      return (
        <div key={item.id} className={`relative overflow-hidden ${isGrid ? 'h-full' : ''}`}>
          <video 
            ref={(el) => {
              if (el) {
                videoRefs.current.set(item.id, el);
              } else {
                videoRefs.current.delete(item.id);
              }
            }}
            data-video-id={item.id}
            src={videoUrl}
            poster={previewUrl} // 使用预览图作为封面，如果没有则为undefined
            controls
            preload="metadata" // 只预加载元数据，不预加载视频内容
            playsInline // 在移动设备上内联播放
            loop // 循环播放
            className={`
              w-full h-full
              ${isGrid ? 'object-cover' : 'object-contain max-h-96'}
            `}
            onError={(e) => {
              console.error('[OptimizedMediaGrid] Video load error:', {
                videoUrl,
                previewUrl,
                mediaId: item.id,
                error: e
              });
            }}
            onLoadStart={() => {
              console.log('[OptimizedMediaGrid] Video load started:', {
                videoUrl,
                mediaId: item.id
              });
            }}
            onClick={(e) => {
              // 点击视频时切换静音状态
              const video = e.currentTarget;
              video.muted = !video.muted;
            }}
          />
          
          {/* 视频标识 */}
          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
            {item.duration ? `${Math.floor(item.duration / 60)}:${String(item.duration % 60).padStart(2, '0')}` : 'VIDEO'}
          </div>
          
          {/* 静音指示器 */}
          {autoPlayVideos.has(item.id) && (
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white p-1 rounded">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.828 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.828l3.555-3.793A1 1 0 019.383 3.076zM12 6.414l1.293-1.293a1 1 0 011.414 1.414L13.414 8l1.293 1.293a1 1 0 01-1.414 1.414L12 9.414l-1.293 1.293a1 1 0 01-1.414-1.414L10.586 8 9.293 6.707a1 1 0 011.414-1.414L12 6.414z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      );
    }
    
    return null;
  }, [loadedImages, fullSizeImages, getBestUrl, getVideoPreview, getVideoUrl, handleImageClick, handleImageLoad]);

  // 图片查看器导航功能
  const imageMedia = media.filter(m => m.type === MediaType.IMAGE);
  
  const handleNextImage = useCallback(() => {
    setCurrentImageIndex(prev => (prev + 1) % imageMedia.length);
  }, [imageMedia.length]);
  
  const handlePreviousImage = useCallback(() => {
    setCurrentImageIndex(prev => (prev - 1 + imageMedia.length) % imageMedia.length);
  }, [imageMedia.length]);
  
  const handleCloseViewer = useCallback(() => {
    setViewerOpen(false);
  }, []);
  
  const handleShare = useCallback(() => {
    if (imageMedia[currentImageIndex]) {
      const imageUrl = imageMedia[currentImageIndex].variants?.original?.url || imageMedia[currentImageIndex].url;
      if (navigator.share) {
        navigator.share({
          title: '分享图片',
          url: imageUrl
        });
      } else {
        navigator.clipboard.writeText(imageUrl);
        // 这里可以添加一个toast提示
      }
    }
  }, [imageMedia, currentImageIndex]);

  // 单个媒体项 - 根据纵横比动态调整布局
  if (media.length === 1) {
    const item = media[0];
    const imageType = getImageType(item.id);
    const isLoaded = loadedImages.has(item.id);
    
    // 根据图片类型设置不同的容器样式
    const getContainerStyle = () => {
      if (!isLoaded) {
        // 加载中时使用默认样式
        return { minHeight: '300px', maxHeight: '500px', maxWidth: '100%' };
      }
      
      switch (imageType) {
        case 'landscape':
          // 长图：左对齐显示，充分利用宽度
          return { 
            aspectRatio: '16/9',
            maxHeight: '400px',
            width: '100%'
          };
        case 'portrait':
          // 竖图：左对齐显示，限制宽度
          return { 
            aspectRatio: '9/16',
            maxHeight: '600px',
            maxWidth: '400px'
          };
        case 'square':
        default:
          // 正方形：左对齐显示
          return { 
            aspectRatio: '1/1',
            maxHeight: '500px',
            width: '100%'
          };
      }
    };

    const getContainerClasses = () => {
      const baseClasses = `rounded-2xl overflow-hidden border border-gray-200 ${className}`;
      
      if (!isLoaded) {
        return `${baseClasses} w-full`;
      }
      
      switch (imageType) {
        case 'landscape':
          return `${baseClasses} w-full`;
        case 'portrait':
          return `${baseClasses}`;
        case 'square':
        default:
          return `${baseClasses} w-full`;
      }
    };
    
    return (
      <>
        <div 
          className={getContainerClasses()}
          style={getContainerStyle()}
        >
          {renderMediaItem(item, 0)}
        </div>

        {/* 图片查看器 */}
        <ImageViewer
          media={imageMedia}
          currentIndex={currentImageIndex}
          post={post}
          isOpen={viewerOpen}
          onClose={handleCloseViewer}
          onNext={imageMedia.length > 1 ? handleNextImage : undefined}
          onPrevious={imageMedia.length > 1 ? handlePreviousImage : undefined}
          onLike={onLike}
          onReply={onReply}
          onRepost={onRepost}
          onShare={handleShare}
        />
      </>
    );
  }

  // 两张图片 - 左右并排
  if (media.length === 2) {
    return (
      <>
        <div className={`grid grid-cols-2 gap-1 rounded-2xl overflow-hidden border border-gray-200 ${className}`} style={{ height: '280px' }}>
          {media.slice(0, 2).map((item, index) => (
            <div key={item.id} className="overflow-hidden relative">
              {renderMediaItem(item, index, true)}
            </div>
          ))}
        </div>

        {/* 图片查看器 */}
        <ImageViewer
          media={imageMedia}
          currentIndex={currentImageIndex}
          post={post}
          isOpen={viewerOpen}
          onClose={handleCloseViewer}
          onNext={imageMedia.length > 1 ? handleNextImage : undefined}
          onPrevious={imageMedia.length > 1 ? handlePreviousImage : undefined}
          onLike={onLike}
          onReply={onReply}
          onRepost={onRepost}
          onShare={handleShare}
        />
      </>
    );
  }

  // 三张图片 - 左侧大图，右侧两张小图
  if (media.length === 3) {
    return (
      <>
        <div className={`grid grid-cols-2 gap-1 rounded-2xl overflow-hidden border border-gray-200 ${className}`} style={{ height: '280px' }}>
          {/* 左侧大图 */}
          <div className="row-span-2 overflow-hidden relative">
            {renderMediaItem(media[0], 0, true)}
          </div>
          {/* 右侧两张小图 */}
          {media.slice(1, 3).map((item, index) => (
            <div key={item.id} className="overflow-hidden relative">
              {renderMediaItem(item, index + 1, true)}
            </div>
          ))}
        </div>

        {/* 图片查看器 */}
        <ImageViewer
          media={imageMedia}
          currentIndex={currentImageIndex}
          post={post}
          isOpen={viewerOpen}
          onClose={handleCloseViewer}
          onNext={imageMedia.length > 1 ? handleNextImage : undefined}
          onPrevious={imageMedia.length > 1 ? handlePreviousImage : undefined}
          onLike={onLike}
          onReply={onReply}
          onRepost={onRepost}
          onShare={handleShare}
        />
      </>
    );
  }

  // 四张或更多图片 - 2x2网格
  const displayedMedia = media.slice(0, 4);
  return (
    <>
      <div className={`grid grid-cols-2 gap-1 rounded-2xl overflow-hidden border border-gray-200 ${className}`} style={{ height: '280px' }}>
        {displayedMedia.map((item, index) => (
          <div key={item.id} className="overflow-hidden relative">
            {renderMediaItem(item, index, true)}
            
            {/* 更多媒体提示 */}
            {index === 3 && media.length > 4 && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  +{media.length - 4}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 图片查看器 */}
      <ImageViewer
        media={imageMedia}
        currentIndex={currentImageIndex}
        post={post}
        isOpen={viewerOpen}
        onClose={handleCloseViewer}
        onNext={imageMedia.length > 1 ? handleNextImage : undefined}
        onPrevious={imageMedia.length > 1 ? handlePreviousImage : undefined}
        onLike={onLike}
        onReply={onReply}
        onRepost={onRepost}
        onShare={handleShare}
      />
    </>
  );
};

export default OptimizedMediaGrid;
