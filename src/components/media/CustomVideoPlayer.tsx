"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Media } from '@/graphql/types';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  PictureInPicture,
  Settings
} from 'lucide-react';

interface CustomVideoPlayerProps {
  media: Media;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  videoUrl: string;
  onClose: () => void;
}

const CustomContextMenu: React.FC<ContextMenuProps> = ({ x, y, videoUrl, onClose }) => {
  useEffect(() => {
    const handleClickOutside = () => onClose();
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [onClose]);

  const copyVideoAddress = () => {
    navigator.clipboard.writeText(videoUrl);
    onClose();
  };

  return (
    <div 
      className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 z-50"
      style={{ left: x, top: y }}
    >
      <button
        onClick={copyVideoAddress}
        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
      >
        Copy video address
      </button>
    </div>
  );
};

const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({
  media,
  className = '',
  autoPlay = false,
  muted = true
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLInputElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(muted);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [videoQuality, setVideoQuality] = useState<'low' | 'mid' | 'high'>('mid');
  const [showControls, setShowControls] = useState(true);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 获取视频URL，优先使用中等质量 - 使用useMemo避免不必要的重新计算
  const videoUrl = React.useMemo(() => {
    if (!media.variants) return media.url;
    
    switch (videoQuality) {
      case 'low':
        return media.variants.lowRes?.url || media.url;
      case 'high':
        return media.variants.highRes?.url || media.variants.midRes?.url || media.variants.lowRes?.url || media.url;
      default:
        return media.variants.midRes?.url || media.variants.lowRes?.url || media.url;
    }
  }, [media.variants, media.url, videoQuality]);

  const posterUrl = media.variants?.preview?.url || media.variants?.thumbnail?.url;

  // 播放/暂停切换
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  }, [isPlaying]);

  // 音量控制
  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
  }, [isMuted]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    if (!videoRef.current) return;
    
    // 将0-100范围转换为0-1范围
    const normalizedVolume = newVolume / 100;
    
    videoRef.current.volume = normalizedVolume;
    setVolume(newVolume); // UI状态保持0-100范围
    
    if (newVolume === 0) {
      setIsMuted(true);
      videoRef.current.muted = true;
    } else if (isMuted) {
      setIsMuted(false);
      videoRef.current.muted = false;
    }
  }, [isMuted]);

  // 播放速率控制
  const handlePlaybackRateChange = useCallback((rate: number) => {
    if (!videoRef.current) return;
    
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
  }, []);

  // 视频质量控制 - 优化避免闪烁
  const handleQualityChange = useCallback((quality: 'low' | 'mid' | 'high') => {
    if (!videoRef.current || videoQuality === quality) return;
    
    const currentTime = videoRef.current.currentTime;
    const wasPlaying = !videoRef.current.paused;
    
    // 先暂停视频避免闪烁
    if (wasPlaying) {
      videoRef.current.pause();
    }
    
    setVideoQuality(quality);
    setShowQualityMenu(false);
    
    // 等待React重新渲染后恢复状态
    requestAnimationFrame(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = currentTime;
        if (wasPlaying) {
          videoRef.current.play().catch(console.error);
        }
      }
    });
  }, [videoQuality]);

  // 进度条控制
  const [isDragging, setIsDragging] = useState(false);
  
  const handleProgressChange = useCallback((newTime: number) => {
    if (!videoRef.current) return;
    
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, []);

  const handleProgressStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleProgressEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 全屏控制
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, [isFullscreen]);

  // 画中画
  const togglePictureInPicture = useCallback(async () => {
    if (!videoRef.current) return;
    
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (error) {
      console.error('Picture-in-picture error:', error);
    }
  }, []);

  // 右键菜单
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  // 控制栏显示/隐藏 - 修复闪烁问题
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    
    // 清除之前的定时器，避免重复设置
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    
    // 3秒后自动隐藏控制栏
    hideControlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
      hideControlsTimeoutRef.current = null;
    }, 3000);
  }, [isPlaying]);

  // 视频事件处理 - 修复进度条和闪烁问题
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => {
      if (isDragging) return; // 拖动时不更新进度条
      
      const time = video.currentTime;
      const dur = video.duration;
      
      setCurrentTime(time);
      
      // 当接近结束时（最后0.1秒），确保进度条走满
      if (dur && time >= dur - 0.1) {
        setCurrentTime(dur);
      }
    };
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };
    const handleVolumeChange = () => {
      setVolume(video.volume * 100); // 转换为0-100范围显示
      setIsMuted(video.muted);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      // 确保进度条走满 - 使用更可靠的方法
      if (video.duration && !isNaN(video.duration)) {
        setCurrentTime(video.duration);
      }
    };
    const handleLoadStart = () => {
      // 视频开始加载时重置状态
      setCurrentTime(0);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('loadstart', handleLoadStart);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('loadstart', handleLoadStart);
    };
  }, [videoUrl, isDragging]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, []);

  // 全屏状态监听
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current) return;
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleProgressChange(Math.max(0, currentTime - 10));
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleProgressChange(Math.min(duration, currentTime + 10));
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange(Math.min(100, volume + 10));
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange(Math.max(0, volume - 10));
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, handleProgressChange, currentTime, duration, handleVolumeChange, volume, toggleMute, toggleFullscreen]);

  // 格式化时间
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <style jsx>{`
        .progress-slider {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
          outline: none;
          overflow: hidden;
          border-radius: 16px;
        }
        
        .progress-slider::-webkit-slider-track {
          background: transparent;
          height: 4px;
          width: 100%;
          border-radius: 2px;
        }
        
        .progress-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 0;
          width: 0;
          background: transparent;
          cursor: pointer;
          border: none;
          box-shadow: none;
        }
        
        .progress-slider::-moz-range-track {
          background: transparent;
          height: 4px;
          border-radius: 2px;
          border: none;
        }
        
        .progress-slider::-moz-range-thumb {
          height: 0;
          width: 0;
          background: transparent;
          cursor: pointer;
          border: none;
          box-shadow: none;
        }
        
        .progress-slider:hover::-webkit-slider-thumb {
          transform: none;
        }
        
        .progress-slider:hover::-moz-range-thumb {
          transform: none;
        }
        
        .volume-slider {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
          outline: none;
          overflow: hidden;
          border-radius: 16px;
        }
        
        .volume-slider::-webkit-slider-track {
          background: transparent;
          height: 4px;
          width: 100%;
          border-radius: 2px;
        }
        
        .volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 0;
          width: 0;
          background: transparent;
          cursor: pointer;
          border: none;
          box-shadow: none;
        }
        
        .volume-slider::-moz-range-track {
          background: transparent;
          height: 4px;
          border-radius: 2px;
          border: none;
        }
        
        .volume-slider::-moz-range-thumb {
          height: 0;
          width: 0;
          background: transparent;
          cursor: pointer;
          border: none;
          box-shadow: none;
        }
        
        .volume-slider:hover::-webkit-slider-thumb {
          transform: none;
        }
        
        .volume-slider:hover::-moz-range-thumb {
          transform: none;
        }
      `}</style>
      
      <div 
        ref={containerRef}
        className={`relative bg-black rounded-xl overflow-hidden group ${className}`}
        onMouseMove={showControlsTemporarily}
        onMouseLeave={() => isPlaying && setShowControls(false)}
        onContextMenu={handleContextMenu}
      >
      <video
        ref={videoRef}
        src={videoUrl}
        poster={posterUrl}
        className="w-full h-full object-contain"
        controls={false}
        controlsList="nodownload noremoteplayback"
        preload="metadata"
        playsInline
        muted={isMuted}
        autoPlay={autoPlay}
        onClick={togglePlay}
      />

      {/* 自定义控制栏 */}
      <div 
        className={`
          absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4
          transition-opacity duration-300
          ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}
        `}
      >
        {/* 进度条 */}
        <div className="mb-3">
          <input
            ref={progressRef}
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={(e) => handleProgressChange(Number(e.target.value))}
            onMouseDown={handleProgressStart}
            onMouseUp={handleProgressEnd}
            onTouchStart={handleProgressStart}
            onTouchEnd={handleProgressEnd}
            className="w-full progress-slider"
            style={{
              height: '4px',
              background: `linear-gradient(to right, #ffffff 0%, #ffffff ${duration > 0 ? (currentTime / duration) * 100 : 0}%, rgba(255, 255, 255, 0.3) ${duration > 0 ? (currentTime / duration) * 100 : 0}%, rgba(255, 255, 255, 0.3) 100%)`
            }}
          />
        </div>

        {/* 控制按钮 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 播放/暂停 */}
            <button
              onClick={togglePlay}
              className="text-white hover:text-gray-300 transition-colors"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>

            {/* 音量控制 */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="text-white hover:text-gray-300 transition-colors"
              >
                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-20 volume-slider"
                style={{
                  height: '4px',
                  background: `linear-gradient(to right, #ffffff 0%, #ffffff ${volume}%, rgba(255, 255, 255, 0.3) ${volume}%, rgba(255, 255, 255, 0.3) 100%)`
                }}
              />
            </div>

            {/* 时间显示 */}
            <span className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* 视频质量选择 */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowQualityMenu(!showQualityMenu);
                  setShowSpeedMenu(false);
                }}
                className="text-white hover:text-gray-300 transition-colors text-sm px-2 py-1 rounded bg-black/50"
              >
                {videoQuality === 'low' ? '480p' : videoQuality === 'mid' ? '720p' : '1080p'}
              </button>
              
              {showQualityMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-black/95 backdrop-blur-sm rounded-lg p-1 min-w-24 shadow-lg border border-gray-700">
                  <div className="text-gray-300 text-xs px-2 py-1 font-medium">Quality</div>
                  <div className="space-y-0.5">
                    {[
                      { key: 'low', label: '480p' },
                      { key: 'mid', label: '720p' },
                      { key: 'high', label: '1080p' }
                    ].map((quality) => (
                      <button
                        key={quality.key}
                        onClick={() => handleQualityChange(quality.key as 'low' | 'mid' | 'high')}
                        className={`
                          block w-full text-left px-2 py-1.5 text-sm rounded transition-all duration-150
                          ${videoQuality === quality.key 
                            ? 'bg-blue-600 text-white shadow-sm' 
                            : 'text-gray-200 hover:bg-gray-700/80 hover:text-white'}
                        `}
                      >
                        <div className="flex justify-between items-center">
                          <span>{quality.label}</span>
                          {videoQuality === quality.key && (
                            <span className="text-xs opacity-75">✓</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 播放速率 */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowSpeedMenu(!showSpeedMenu);
                  setShowQualityMenu(false);
                }}
                className="text-white hover:text-gray-300 transition-colors text-sm px-2 py-1 rounded bg-black/50"
              >
                {playbackRate === 1 ? 'Normal' : `${playbackRate}x`}
              </button>
              
              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-black/95 backdrop-blur-sm rounded-lg p-1 min-w-24 shadow-lg border border-gray-700">
                  <div className="text-gray-300 text-xs px-2 py-1 font-medium">Speed</div>
                  <div className="space-y-0.5">
                    {[
                      { rate: 0.5, label: '0.5x' },
                      { rate: 0.75, label: '0.75x' },
                      { rate: 1, label: 'Normal' },
                      { rate: 1.25, label: '1.25x' },
                      { rate: 1.5, label: '1.5x' },
                      { rate: 2, label: '2x' }
                    ].map((speed) => (
                      <button
                        key={speed.rate}
                        onClick={() => handlePlaybackRateChange(speed.rate)}
                        className={`
                          block w-full text-left px-2 py-1.5 text-sm rounded transition-all duration-150
                          ${playbackRate === speed.rate 
                            ? 'bg-blue-600 text-white shadow-sm' 
                            : 'text-gray-200 hover:bg-gray-700/80 hover:text-white'}
                        `}
                      >
                        <div className="flex justify-between items-center">
                          <span>{speed.label}</span>
                          {playbackRate === speed.rate && (
                            <span className="text-xs opacity-75">✓</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 画中画 */}
            <button
              onClick={togglePictureInPicture}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <PictureInPicture size={20} />
            </button>

            {/* 全屏 */}
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <Maximize size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* 自定义右键菜单 */}
      {contextMenu && (
        <CustomContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          videoUrl={videoUrl}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* 加载指示器 */}
      {!duration && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      </div>
    </>
  );
};

export default CustomVideoPlayer;
