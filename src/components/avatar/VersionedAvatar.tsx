'use client';

import React, { useState, useEffect } from 'react';
import Avatar from '@/components/core/Avatar';
import { avatarVersionService } from '@/services/avatarVersionService';

interface VersionedAvatarProps {
  userId: string;
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  version?: number;
  onClick?: () => void;
  className?: string;
}

/**
 * 版本化头像组件
 * 支持缓存友好的头像更新，避免浏览器缓存导致的显示延迟
 */
const VersionedAvatar: React.FC<VersionedAvatarProps> = ({
  userId,
  src,
  alt,
  size = 'md',
  version,
  onClick,
  className
}) => {
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!src || !userId) {
      setAvatarUrl('');
      return;
    }

    // 生成版本化URL
    const versionedUrl = avatarVersionService.generateVersionedUrl(userId, src, version);
    
    // 如果版本号发生变化，预加载新头像
    if (version && version !== avatarVersionService.getCurrentVersion(userId)) {
      setIsLoading(true);
      
      avatarVersionService.preloadAvatar(versionedUrl)
        .then(() => {
          avatarVersionService.updateVersion(userId, version);
          setAvatarUrl(versionedUrl);
          setIsLoading(false);
        })
        .catch(() => {
          // 预加载失败，直接使用新URL
          avatarVersionService.updateVersion(userId, version);
          setAvatarUrl(versionedUrl);
          setIsLoading(false);
        });
    } else {
      setAvatarUrl(versionedUrl);
    }
  }, [userId, src, version]);

  return (
    <div className={`relative ${className || ''}`}>
      <Avatar
        src={avatarUrl}
        alt={alt}
        size={size}
        onClick={onClick}
      />
      
      {/* 加载指示器 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 rounded-full">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default VersionedAvatar;
