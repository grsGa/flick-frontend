'use client';

import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { useAvatarSubscription } from './useAvatarSubscription';
import { avatarVersionService } from '@/services/avatarVersionService';

/**
 * 头像缓存管理Hook
 * 集成版本化URL和实时订阅，提供完整的头像更新体验
 */
export function useAvatarCache() {
  const { user } = useAuth();
  const { isConnected } = useAvatarSubscription();

  useEffect(() => {
    // 初始化当前用户的头像版本
    if (user?.id && user?.avatarUrl) {
      const version = avatarVersionService.extractVersionFromUrl(user.avatarUrl);
      if (version) {
        avatarVersionService.updateVersion(user.id, version);
      }
    }
  }, [user?.id, user?.avatarUrl]);

  // 清理缓存（用户登出时）
  useEffect(() => {
    if (!user) {
      avatarVersionService.clearCache();
    }
  }, [user]);

  return {
    isSubscriptionConnected: isConnected,
    generateVersionedUrl: (url: string, version?: number) => 
      user?.id ? avatarVersionService.generateVersionedUrl(user.id, url, version) : url,
    getCurrentVersion: () => 
      user?.id ? avatarVersionService.getCurrentVersion(user.id) : 1
  };
}
