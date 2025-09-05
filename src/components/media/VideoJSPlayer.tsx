"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { Media } from '@/graphql/types';

// Video.js quality selector plugin types
declare global {
  interface Window {
    videojs: any;
  }
}

// Quality levels interface
interface QualityLevel {
  label: string;
  src: string;
  type: string;
}

interface VideoJSPlayerProps {
  media: Media;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  onMetadataLoad?: (video: HTMLVideoElement) => void;
  enableQualitySelector?: boolean;
  enableContextMenu?: boolean;
}

const VideoJSPlayer: React.FC<VideoJSPlayerProps> = ({
  media,
  className = '',
  autoPlay = false,
  muted = true,
  onMetadataLoad,
  enableQualitySelector = true,
  enableContextMenu = true
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [currentQuality, setCurrentQuality] = useState<string>('');
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [isInitialized, setIsInitialized] = useState(false);

  // 获取所有可用的视频质量选项
  const qualityLevels = React.useMemo((): QualityLevel[] => {
    const levels: QualityLevel[] = [];
    
    if (media.variants) {
      if (media.variants.highRes?.url) {
        levels.push({
          label: '高清 (1080p)',
          src: media.variants.highRes.url,
          type: 'video/mp4'
        });
      }
      if (media.variants.midRes?.url) {
        levels.push({
          label: '标清 (720p)',
          src: media.variants.midRes.url,
          type: 'video/mp4'
        });
      }
      if (media.variants.lowRes?.url) {
        levels.push({
          label: '流畅 (480p)',
          src: media.variants.lowRes.url,
          type: 'video/mp4'
        });
      }
    }
    
    // 总是添加原始质量作为备选
    levels.push({
      label: '原画质',
      src: media.url,
      type: 'video/mp4'
    });
    
    return levels;
  }, [media.variants, media.url]);

  // 获取初始视频URL（不再依赖currentQuality状态）
  const initialVideoUrl = React.useMemo(() => {
    // 默认使用中等质量或第一个可用的质量
    const defaultLevel = qualityLevels.find(level => level.label.includes('标清')) || 
                        qualityLevels.find(level => level.label.includes('流畅')) || 
                        qualityLevels[0];
    
    return defaultLevel?.src || media.url;
  }, [qualityLevels, media.url]);

  const posterUrl = media.variants?.preview?.url || media.variants?.thumbnail?.url;

  // 处理右键菜单
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (!enableContextMenu) return;
    
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  }, [enableContextMenu]);

  // 复制视频地址
  const handleCopyVideoAddress = useCallback(() => {
    if (playerRef.current && !playerRef.current.isDisposed()) {
      try {
        const currentSrc = playerRef.current.src();
        if (currentSrc) {
          navigator.clipboard.writeText(currentSrc).then(() => {
            console.log('[VideoJSPlayer] Video address copied to clipboard:', currentSrc);
          }).catch(err => {
            console.error('[VideoJSPlayer] Failed to copy video address:', err);
          });
        }
      } catch (error) {
        console.error('[VideoJSPlayer] Error copying video address:', error);
      }
    }
    setShowContextMenu(false);
  }, []);

  // 隐藏菜单函数
  const hideMenu = useCallback(() => {
    setShowQualityMenu(false);
    setShowContextMenu(false);
  }, []);

  // 点击其他地方关闭右键菜单
  useEffect(() => {
    document.addEventListener('click', hideMenu);
    return () => document.removeEventListener('click', hideMenu);
  }, [hideMenu]);

  // 使用 useCallback 缓存元数据加载处理函数
  const handleMetadataLoad = useCallback((videoEl: HTMLVideoElement) => {
    if (onMetadataLoad) {
      onMetadataLoad(videoEl);
    }
  }, [onMetadataLoad]);

  // 稳定的质量选择器添加函数 - 使用 useMemo 缓存
  const addQualitySelector = useMemo(() => (player: any) => {
    console.log('[VideoJSPlayer] Adding quality selector with levels:', qualityLevels);
    
    // 创建质量选择器按钮
    const qualityButton = player.controlBar.addChild('button', {
      className: 'vjs-quality-selector vjs-control vjs-button'
    });
    
    // 设置按钮图标和样式
    qualityButton.el().innerHTML = `
      <span style="
        display: inline-block;
        width: 16px;
        height: 16px;
        font-size: 12px;
        font-weight: bold;
        color: white;
        text-align: center;
        line-height: 16px;
      ">HD</span>
    `;
    
    qualityButton.el().setAttribute('title', '视频质量');
    qualityButton.el().style.order = '7';
    
    // 创建质量选择菜单
    const qualityMenu = document.createElement('div');
    qualityMenu.className = 'vjs-quality-menu';
    qualityMenu.style.cssText = `
      position: absolute;
      bottom: 100%;
      right: 0;
      background: rgba(0, 0, 0, 0.9);
      border-radius: 6px;
      padding: 8px 0;
      min-width: 140px;
      display: none;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    
    qualityLevels.forEach((level) => {
      const menuItem = document.createElement('div');
      menuItem.className = 'vjs-quality-menu-item';
      menuItem.textContent = level.label;
      menuItem.style.cssText = `
        padding: 10px 16px;
        color: white;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.2s;
        border: none;
        background: none;
      `;
      
      // 标记当前选中的质量
      const isCurrentQuality = (
        (currentQuality === 'high' && level.label.includes('高清')) ||
        (currentQuality === 'mid' && level.label.includes('标清')) ||
        (currentQuality === 'low' && level.label.includes('流畅')) ||
        (currentQuality === 'original' && level.label.includes('原画质'))
      );
      
      if (isCurrentQuality) {
        menuItem.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        menuItem.textContent = '✓ ' + level.label;
      }
      
      menuItem.addEventListener('mouseenter', () => {
        if (!isCurrentQuality) {
          menuItem.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        }
      });
      
      menuItem.addEventListener('mouseleave', () => {
        if (!isCurrentQuality) {
          menuItem.style.backgroundColor = 'transparent';
        }
      });
      
      menuItem.addEventListener('click', () => {
        // 记录当前播放状态
        const currentTime = player.currentTime();
        const wasPaused = player.paused();
        const currentSrc = player.currentSrc();
        
        console.log('[VideoJSPlayer] Switching quality from:', currentSrc, 'to:', level.src, {
          currentTime,
          wasPaused,
          newSrc: level.src
        });
        
        // 如果是相同的源，不需要切换
        if (currentSrc === level.src) {
          console.log('[VideoJSPlayer] Same source, no need to switch');
          qualityMenu.style.display = 'none';
          return;
        }
        
        // 更新当前质量状态（在切换之前）
        if (level.label.includes('高清')) setCurrentQuality('high');
        else if (level.label.includes('标清')) setCurrentQuality('mid');
        else if (level.label.includes('流畅')) setCurrentQuality('low');
        else setCurrentQuality('original');
        
        // 使用更稳定的源切换方法
        const switchSource = () => {
          try {
            // 检查播放器是否仍然有效
            if (!player || player.isDisposed()) {
              console.warn('[VideoJSPlayer] Player disposed during quality switch');
              return;
            }
            
            // 保存当前播放状态
            const currentTime = player.currentTime();
            const wasPaused = player.paused();
            
            console.log('[VideoJSPlayer] Switching quality from:', player.src(), 'to:', level.src, {
              currentTime,
              wasPaused,
              newSrc: level.src
            });
            
            // 设置新的视频源
            player.src({
              src: level.src,
              type: 'video/mp4'
            });
            
            // 使用多个事件监听器确保可靠性
            let restored = false;
            
            let restorePlaybackState: (() => void) | null = null;

            if (enableQualitySelector) {
              restorePlaybackState = () => {           
              console.log('[VideoJSPlayer] Restoring playback state');
              
              try {
                // 检查播放器是否仍然有效
                if (!player || player.isDisposed()) {
                  console.warn('[VideoJSPlayer] Player disposed, skipping playback restore');
                  return;
                }
                
                // 恢复播放时间
                if (currentTime > 0) {
                  player.currentTime(currentTime);
                }
                
                // 恢复播放状态
                if (!wasPaused) {
                  const playPromise = player.play();
                  if (playPromise) {
                    playPromise.catch(err => {
                      console.error('[VideoJSPlayer] Failed to resume playback:', err);
                    });
                  }
                }
              } catch (err) {
                console.error('[VideoJSPlayer] Error restoring playback state:', err);
              }
              
              // 安全清理事件监听器
              try {
                if (player && !player.isDisposed()) {
                  player.off('canplay', restorePlaybackState);
                  player.off('loadeddata', restorePlaybackState);
                  player.off('loadedmetadata', restorePlaybackState);
                  player.off('error', handleError);
                }
              } catch (cleanupErr) {
                console.warn('[VideoJSPlayer] Error during event cleanup:', cleanupErr);
              }
            };
            
            const handleError = (error: any) => {
              console.error('[VideoJSPlayer] Error loading new source:', error);
              restored = true;
              
              // 安全清理事件监听器
              try {
                if (player && !player.isDisposed()) {
                  player.off('canplay', restorePlaybackState);
                  player.off('loadeddata', restorePlaybackState);
                  player.off('loadedmetadata', restorePlaybackState);
                  player.off('error', handleError);
                }
              } catch (cleanupErr) {
                console.warn('[VideoJSPlayer] Error during event cleanup:', cleanupErr);
              }
            };
            
            // 安全监听多个加载事件以提高成功率
            try {
              if (player && !player.isDisposed()) {
                player.one('canplay', restorePlaybackState);
                player.one('loadeddata', restorePlaybackState);
                player.one('loadedmetadata', restorePlaybackState);
                player.one('error', handleError);
              }
            } catch (eventErr) {
              console.error('[VideoJSPlayer] Error binding events:', eventErr);
              // 如果事件绑定失败，直接尝试恢复
              if (restorePlaybackState) {
                setTimeout(restorePlaybackState, 100);
              }
            }
            
            // 设置超时保护
            const timeoutId = setTimeout(() => {
              if (!restored && player && !player.isDisposed()) {
                console.warn('[VideoJSPlayer] Source switch timeout, forcing restore');
                if (restorePlaybackState) {
                  try {
                    restorePlaybackState();
                  } catch (timeoutErr) {
                    console.error('[VideoJSPlayer] Error during timeout restore:', timeoutErr);
                  }
                }
              }
            }, 2000);
            
            // 开始加载新源
            player.load();
            
                // 清理超时定时器
            const originalRestore = restorePlaybackState;
            restorePlaybackState = () => {
              clearTimeout(timeoutId);
              if (originalRestore) {
                originalRestore();
              }
            };
            
            // 在源切换后确保控制条可见和隐藏poster
            setTimeout(() => {
              const controlBar = player.controlBar;
              if (controlBar) {
                controlBar.show();
                controlBar.el().style.opacity = '1';
                controlBar.el().style.visibility = 'visible';
              }
              
              // 隐藏poster图片以避免画中画效果
              const posterImage = player.el().querySelector('.vjs-poster');
              if (posterImage) {
                (posterImage as HTMLElement).style.display = 'none';
              }
            }, 100);
            }
            
          } catch (error) {
            console.error('[VideoJSPlayer] Error during source switch:', error);
          }
        };
        
        // 立即执行切换
        switchSource();
        
        qualityMenu.style.display = 'none';
      });
      
      qualityMenu.appendChild(menuItem);
    });
    
    qualityButton.el().appendChild(qualityMenu);
    
    // 点击按钮显示/隐藏菜单
    qualityButton.on('click', (e: any) => {
      e.stopPropagation();
      const isVisible = qualityMenu.style.display === 'block';
      qualityMenu.style.display = isVisible ? 'none' : 'block';
      console.log('[VideoJSPlayer] Quality menu toggled:', !isVisible);
    });
    
    // 点击其他地方隐藏菜单
    const hideMenu = (e: any) => {
      if (!qualityButton.el().contains(e.target)) {
        qualityMenu.style.display = 'none';
      }
    };
    
    player.on('click', hideMenu);
    document.addEventListener('click', hideMenu);
    
    // 清理函数
    return () => {
      document.removeEventListener('click', hideMenu);
    };
  }, [qualityLevels, currentQuality]);

  useEffect(() => {
    if (!videoRef.current) return;

    const videoElement = videoRef.current;
    
    // 检查组件是否已卸载
    let isMounted = true;
    
    // 使用 setTimeout 确保 DOM 完全渲染后再初始化
    const initializePlayer = () => {
      if (!isMounted) {
        console.log('[VideoJSPlayer] Component unmounted, aborting initialization');
        return;
      }
      
      if (!videoElement || !videoElement.isConnected) {
        console.warn('[VideoJSPlayer] Video element not connected to DOM, retrying...');
        // 限制重试次数，避免无限循环
        const retryCount = (initializePlayer as any).retryCount || 0;
        if (retryCount < 10) { // 减少重试次数
          (initializePlayer as any).retryCount = retryCount + 1;
          setTimeout(() => {
            if (isMounted) initializePlayer();
          }, 200); // 增加重试间隔
        } else {
          console.error('[VideoJSPlayer] Max retry attempts reached, aborting initialization');
        }
        return;
      }

      // 检查是否已经有播放器实例
      if (playerRef.current && !playerRef.current.isDisposed()) {
        console.log('[VideoJSPlayer] Disposing existing player');
        playerRef.current.dispose();
        playerRef.current = null;
      }

      // 初始化 Video.js 播放器
      console.log('[VideoJSPlayer] Initializing Video.js with:', {
        videoUrl: initialVideoUrl,
        posterUrl,
        autoPlay,
        muted,
        elementConnected: videoElement.isConnected,
        qualityLevels: qualityLevels.length
      });

      const player = videojs(videoElement, {
        controls: true,
        responsive: true,
        fluid: true,
        autoplay: autoPlay,
        muted: muted,
        preload: 'metadata',
        // 不设置poster，避免画中画问题
        // poster: posterUrl,
        sources: [{
          src: initialVideoUrl,
          type: 'video/mp4'
        }],
        // 优化纵向视频显示 - 不设置固定宽高比
        // aspectRatio: '16:9', // 让视频使用原始宽高比
        fill: false, // 不强制填充，避免溢出
        responsive: true,
        fluid: false, // 禁用fluid模式避免尺寸计算问题
        playbackRates: [0.5, 1, 1.25, 1.5, 2], // 播放速度选项
        // 确保控制条始终可见
        userActions: {
          hotkeys: true
        },
        plugins: {}
      });

      console.log('[VideoJSPlayer] Video.js player created:', player);
      playerRef.current = player;
      setIsInitialized(true);

      // 监听元数据加载
      player.ready(() => {
        console.log('[VideoJSPlayer] Player ready');
        
        // 添加质量选择器按钮
        if (enableQualitySelector && qualityLevels.length > 1) {
          console.log('[VideoJSPlayer] Adding quality selector, levels available:', qualityLevels.length);
          const cleanup = addQualitySelector(player);
          
          // 保存清理函数
          (player as any).qualitySelectorCleanup = cleanup;
        }
        
        player.on('loadedmetadata', () => {
          console.log('[VideoJSPlayer] Video metadata loaded');
          const videoWidth = player.videoWidth();
          const videoHeight = player.videoHeight();
          const duration = player.duration();
          const aspectRatio = videoWidth / videoHeight;
          const isPortrait = aspectRatio < 1;
          
          console.log('[VideoJSPlayer] Video dimensions:', {
            width: videoWidth,
            height: videoHeight,
            duration,
            aspectRatio,
            isPortrait
          });
          
          // 对于纵向视频，调整播放器尺寸以确保控制条可见
          if (isPortrait && containerRef.current) {
            const container = containerRef.current;
            // 动态设置容器高度，根据实际宽高比计算
            const containerWidth = container.offsetWidth;
            const idealHeight = containerWidth / aspectRatio;
            container.style.height = `${Math.min(idealHeight, 600)}px`;
            container.style.maxHeight = 'none';
            
            // 设置播放器宽高比 - Video.js需要width:height格式
            const aspectRatioString = `${videoWidth}:${videoHeight}`;
            player.aspectRatio(aspectRatioString);
            
            // 确保控制条有足够空间显示
            const controlBar = player.controlBar;
            if (controlBar) {
              controlBar.show();
            }
          }
          
          // 初始化时隐藏poster以避免与视频内容重叠
          setTimeout(() => {
            const posterImage = player.el().querySelector('.vjs-poster');
            if (posterImage) {
              (posterImage as HTMLElement).style.display = 'none';
            }
          }, 100);
          
          if (handleMetadataLoad && videoRef.current) {
            handleMetadataLoad(videoRef.current);
          }
        });

        // 监听错误事件
        player.on('error', (error: any) => {
          console.error('[VideoJSPlayer] Video error:', error);
          console.error('[VideoJSPlayer] Error details:', {
            code: player.error()?.code,
            message: player.error()?.message,
            type: (player.error() as any)?.type
          });
        });

        // 监听加载开始事件
        player.on('loadstart', () => {
          console.log('[VideoJSPlayer] Video load started');
        });
        
        player.on('loadeddata', () => {
          console.log('[VideoJSPlayer] Video data loaded');
        });
        
        // 确保控制条始终可见和调整布局
        player.on('ready', () => {
          const controlBar = player.controlBar;
          if (controlBar) {
            controlBar.show();
            // 对于纵向视频，保持控制条显示
            controlBar.el().style.opacity = '1';
            controlBar.el().style.visibility = 'visible';
          }
          
          // 调整播放器尺寸以适应容器
          if (containerRef.current) {
            const videoEl = player.el();
            if (videoEl) {
              videoEl.style.height = '100%';
              videoEl.style.width = '100%';
            }
          }
        });
        
        // 修复poster图片显示问题
        player.on('play', () => {
          // 播放开始时隐藏poster
          const posterImage = player.el().querySelector('.vjs-poster');
          if (posterImage) {
            (posterImage as HTMLElement).style.display = 'none';
          }
        });
        
        player.on('pause', () => {
          // 暂停时不显示poster，保持视频帧显示
          const posterImage = player.el().querySelector('.vjs-poster');
          if (posterImage) {
            (posterImage as HTMLElement).style.display = 'none';
          }
        });
        
        player.on('ended', () => {
          // 播放结束时也不显示poster，显示最后一帧
          const posterImage = player.el().querySelector('.vjs-poster');
          if (posterImage) {
            (posterImage as HTMLElement).style.display = 'none';
          }
        });
      });
    };

    // 延迟初始化以确保 DOM 完全准备好
    const timeoutId = setTimeout(initializePlayer, 50);

    // 清理函数
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      if (playerRef.current && !playerRef.current.isDisposed()) {
        console.log('[VideoJSPlayer] Cleaning up player');
        
        // 清理质量选择器
        if (playerRef.current.qualitySelectorCleanup) {
          playerRef.current.qualitySelectorCleanup();
        }
        
        playerRef.current.dispose();
        playerRef.current = null;
        setIsInitialized(false);
      }
    };
  }, [initialVideoUrl, autoPlay, muted, posterUrl, handleMetadataLoad, enableQualitySelector, qualityLevels]);

  return (
    <div 
      ref={containerRef}
      className={`relative ${className}`}
      onContextMenu={handleContextMenu}
    >
      <video
        ref={videoRef}
        className="video-js vjs-default-skin w-full h-full"
        data-setup="{}"
        style={{
          minHeight: className.includes('min-h-[400px]') ? '400px' : 'auto',
          objectFit: 'cover'
        }}
      />
      
      {/* 自定义右键菜单 */}
      {showContextMenu && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50"
          style={{
            left: contextMenuPosition.x,
            top: contextMenuPosition.y,
            minWidth: '180px'
          }}
        >
          <button
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            onClick={handleCopyVideoAddress}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy video address
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoJSPlayer;
