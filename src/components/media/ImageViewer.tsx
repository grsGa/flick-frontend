import React, { useState, useEffect } from 'react';
import { Media, Post } from '@/graphql/types';
import ImageViewerSidebar from '@/components/media/ImageViewerSidebar';

interface ImageViewerProps {
  media: Media[];
  currentIndex: number;
  post?: Post;
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onLike?: () => void;
  onReply?: () => void;
  onRepost?: () => void;
  onBookmark?: () => void;
  onShare?: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  media,
  currentIndex,
  post,
  isOpen,
  onClose,
  onNext,
  onPrevious,
  onLike,
  onReply,
  onRepost,
  onBookmark,
  onShare,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayIndex, setDisplayIndex] = useState(currentIndex);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);

  const currentMedia = media[displayIndex];

  // 获取原始图片URL
  const getOriginalUrl = (item: Media): string => {
    return item.variants?.original?.url || item.url;
  };

  // 处理平滑切换动画
  const handleSmoothTransition = (newIndex: number, direction: 'left' | 'right') => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setSlideDirection(direction);
    
    setTimeout(() => {
      setDisplayIndex(newIndex);
      setTimeout(() => {
        setIsTransitioning(false);
        setSlideDirection(null);
      }, 300);
    }, 150);
  };

  // 同步外部索引变化
  useEffect(() => {
    if (currentIndex !== displayIndex && !isTransitioning) {
      const direction = currentIndex > displayIndex ? 'right' : 'left';
      handleSmoothTransition(currentIndex, direction);
    }
  }, [currentIndex, displayIndex, isTransitioning]);

  // 处理键盘事件
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          onPrevious?.();
          break;
        case 'ArrowRight':
          onNext?.();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onNext, onPrevious]);

  // 阻止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !currentMedia) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex">
      {/* 背景遮罩层 - 半透明模糊黑色遮罩 */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
      
      {/* 固定位置的关闭按钮 - 左上角 */}
      <button
        className="fixed top-4 left-4 z-[10000] bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-all duration-200 hover:scale-110 backdrop-blur-md border border-white/20"
        onClick={onClose}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* 固定位置的左导航按钮 */}
      {media.length > 1 && currentIndex > 0 && (
        <button
          className="fixed left-4 top-1/2 transform -translate-y-1/2 z-[10000] bg-black/60 hover:bg-black/80 text-white p-4 rounded-full transition-all duration-200 hover:scale-110 hover:-translate-x-1 backdrop-blur-md border border-white/20 group"
          onClick={onPrevious}
          disabled={isTransitioning}
        >
          <svg className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* 固定位置的右导航按钮 */}
      {media.length > 1 && currentIndex < media.length - 1 && (
        <button
          className={`fixed right-4 top-1/2 transform -translate-y-1/2 z-[10000] bg-black/60 hover:bg-black/80 text-white p-4 rounded-full transition-all duration-200 hover:scale-110 hover:translate-x-1 backdrop-blur-md border border-white/20 group ${
            sidebarOpen ? 'mr-80' : 'mr-0'
          }`}
          onClick={onNext}
          disabled={isTransitioning}
        >
          <svg className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* 主图片区域 */}
      <div className={`flex-1 flex items-center justify-center p-4 transition-all duration-300 relative ${
        sidebarOpen ? 'mr-80' : 'mr-0'
      }`}>
        <div className="relative max-w-full max-h-full overflow-hidden">
          {/* 图片容器 - 支持滑动动画 */}
          <div className={`transition-all duration-300 ease-in-out ${
            isTransitioning 
              ? slideDirection === 'left' 
                ? 'transform translate-x-full opacity-0' 
                : 'transform -translate-x-full opacity-0'
              : 'transform translate-x-0 opacity-100'
          }`}>
            <img
              src={getOriginalUrl(currentMedia)}
              alt={currentMedia.altText || 'Full size image'}
              className="max-w-full max-h-full object-contain transition-all duration-300"
              style={{ maxHeight: 'calc(100vh - 2rem)' }}
            />
          </div>
          
          {/* 图片计数指示器 */}
          {media.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm backdrop-blur-md border border-white/20">
              {currentIndex + 1} / {media.length}
            </div>
          )}
        </div>
      </div>

      {/* 边栏切换按钮 - 移至边栏外部 */}
      <button
        className={`fixed top-4 z-[10001] bg-black/60 hover:bg-black/80 text-white p-2 rounded transition-all ${
          sidebarOpen ? 'right-84' : 'right-4'
        }`}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        )}
      </button>

      {/* 右侧边栏 */}
      <div className={`fixed right-0 top-0 h-full w-80 bg-white transform transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <ImageViewerSidebar
          post={post}
          currentMedia={currentMedia}
          onLike={onLike}
          onReply={onReply}
          onRepost={onRepost}
          onBookmark={onBookmark}
          onShare={onShare}
        />
      </div>

      {/* 背景点击关闭 - 暂时移除，只使用ESC键和关闭按钮 */}
    </div>
  );
};

export default ImageViewer;
