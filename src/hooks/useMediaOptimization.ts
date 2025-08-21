import { useState, useEffect, useCallback } from 'react';
import { Media, MediaVariant } from '@/graphql/types';

interface UseMediaOptimizationOptions {
  priority?: 'thumbnail' | 'small' | 'medium';
  enableProgressiveLoading?: boolean;
  enableLazyLoading?: boolean;
}

interface MediaOptimizationState {
  loadedImages: Set<string>;
  failedImages: Set<string>;
  fullSizeImages: Set<string>;
  loadingProgress: Map<string, number>;
}

export const useMediaOptimization = (options: UseMediaOptimizationOptions = {}) => {
  const {
    priority = 'thumbnail',
    enableProgressiveLoading = true,
    enableLazyLoading = true
  } = options;

  const [state, setState] = useState<MediaOptimizationState>({
    loadedImages: new Set(),
    failedImages: new Set(),
    fullSizeImages: new Set(),
    loadingProgress: new Map(),
  });

  // 获取最佳显示URL
  const getBestUrl = useCallback((item: Media, preferHighRes = false): string => {
    if (!item.variants) {
      return item.url;
    }

    if (preferHighRes) {
      return item.variants.large?.url || 
             item.variants.medium?.url || 
             item.variants.original?.url || 
             item.url;
    }

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
      default:
        return item.variants.thumbnail?.url || 
               item.variants.small?.url || 
               item.url;
    }
  }, [priority]);

  // 获取视频预览URL
  const getVideoPreviewUrl = useCallback((item: Media): string => {
    if (!item.variants) {
      return item.url;
    }
    
    return item.variants.preview?.url || 
           item.variants.thumbnail?.url || 
           item.url;
  }, []);

  // 获取视频播放URL
  const getVideoPlayUrl = useCallback((item: Media, quality: 'low' | 'mid' | 'high' = 'mid'): string => {
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
      default:
        return item.variants.midRes?.url || 
               item.variants.lowRes?.url || 
               item.url;
    }
  }, []);

  // 预加载图片
  const preloadImage = useCallback((url: string, itemId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        setState(prev => ({
          ...prev,
          loadedImages: new Set([...prev.loadedImages, itemId]),
          loadingProgress: new Map([...prev.loadingProgress, [itemId, 100]])
        }));
        resolve();
      };
      
      img.onerror = () => {
        setState(prev => ({
          ...prev,
          failedImages: new Set([...prev.failedImages, itemId])
        }));
        reject(new Error(`Failed to load image: ${url}`));
      };
      
      // 模拟加载进度
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 10;
        if (progress < 90) {
          setState(prev => ({
            ...prev,
            loadingProgress: new Map([...prev.loadingProgress, [itemId, progress]])
          }));
        } else {
          clearInterval(progressInterval);
        }
      }, 100);
      
      img.src = url;
    });
  }, []);

  // 渐进式加载：先加载缩略图，再加载高清图
  const progressiveLoad = useCallback(async (item: Media) => {
    if (!enableProgressiveLoading || !item.variants) return;

    try {
      // 先加载缩略图
      if (item.variants.thumbnail) {
        await preloadImage(item.variants.thumbnail.url, `${item.id}_thumb`);
      }

      // 延迟加载中等分辨率图片
      setTimeout(async () => {
        if (item.variants?.medium) {
          await preloadImage(item.variants.medium.url, `${item.id}_medium`);
        }
      }, 500);

    } catch (error) {
      console.warn('Progressive loading failed:', error);
    }
  }, [enableProgressiveLoading, preloadImage]);

  // 切换到高分辨率
  const loadFullSize = useCallback((item: Media) => {
    setState(prev => ({
      ...prev,
      fullSizeImages: new Set([...prev.fullSizeImages, item.id])
    }));

    // 预加载高分辨率图片
    const highResUrl = getBestUrl(item, true);
    preloadImage(highResUrl, `${item.id}_full`);
  }, [getBestUrl, preloadImage]);

  // 重置状态
  const resetState = useCallback(() => {
    setState({
      loadedImages: new Set(),
      failedImages: new Set(),
      fullSizeImages: new Set(),
      loadingProgress: new Map(),
    });
  }, []);

  // 获取加载状态
  const getLoadingState = useCallback((itemId: string) => {
    return {
      isLoaded: state.loadedImages.has(itemId),
      isFailed: state.failedImages.has(itemId),
      isFullSize: state.fullSizeImages.has(itemId),
      progress: state.loadingProgress.get(itemId) || 0,
    };
  }, [state]);

  // 计算节省的带宽
  const calculateBandwidthSavings = useCallback((media: Media[]): { saved: number, total: number } => {
    let saved = 0;
    let total = 0;

    media.forEach(item => {
      if (!item.variants) return;

      const originalSize = item.variants.original?.size || 0;
      const thumbnailSize = item.variants.thumbnail?.size || 0;
      
      total += originalSize;
      saved += (originalSize - thumbnailSize);
    });

    return { saved, total };
  }, []);

  return {
    // 状态
    loadedImages: state.loadedImages,
    failedImages: state.failedImages,
    fullSizeImages: state.fullSizeImages,
    loadingProgress: state.loadingProgress,

    // 方法
    getBestUrl,
    getVideoPreviewUrl,
    getVideoPlayUrl,
    preloadImage,
    progressiveLoad,
    loadFullSize,
    resetState,
    getLoadingState,
    calculateBandwidthSavings,
  };
};
