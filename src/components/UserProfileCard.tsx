"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User } from '@/graphql/types';
import { formatDate } from '@/lib/utils';
import { useFollowUser, useIsCurrentUser } from '@/lib/user-hooks';
import { useAuth } from '@/lib/auth-context';

interface UserProfileCardProps {
  user: User;
  variant?: 'default' | 'compact' | 'minimal';
  showFollowButton?: boolean;
  showStats?: boolean;
  className?: string;
  onFollowStatusChange?: (isFollowing: boolean) => void;
}

export function UserProfileCard({
  user,
  variant = 'default',
  showFollowButton = true,
  showStats = true,
  className = '',
  onFollowStatusChange,
}: UserProfileCardProps) {
  const { follow, unfollow, loading } = useFollowUser();
  const { user: currentUser } = useAuth();
  const isCurrentUser = useIsCurrentUser(user?.username);
  
  // 处理关注/取消关注逻辑
  const handleFollowToggle = async () => {
    if (!user || loading || isCurrentUser) return;
    
    try {
      if (user.isFollowing) {
        await unfollow(user.id);
        onFollowStatusChange?.(false);
      } else {
        await follow(user.id);
        onFollowStatusChange?.(true);
      }
    } catch (error) {
      console.error('关注操作失败:', error);
    }
  };
  
  if (!user) return null;

  const profileUrl = `/${user.username}`;
  
  // 紧凑型展示
  if (variant === 'compact') {
    return (
      <div className={`flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition ${className}`}>
        <Link href={profileUrl} className="flex-shrink-0">
          <Image
            src={user.avatarUrl || '/default-avatar.png'}
            alt={user.displayName || user.username}
            width={48}
            height={48}
            className="rounded-full"
          />
        </Link>
        <div className="ml-3 flex-grow min-w-0">
          <div className="flex items-center">
            <Link href={profileUrl} className="font-medium hover:underline truncate">
              {user.displayName || user.username}
            </Link>
            {user.isVerified && (
              <span className="ml-1 text-blue-500" title="已验证账号">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">@{user.username}</p>
        </div>
        {showFollowButton && !isCurrentUser && currentUser && (
          <button
            onClick={handleFollowToggle}
            disabled={loading}
            className={`ml-2 px-4 py-1 text-sm font-medium rounded-full transition focus:outline-none ${
              user.isFollowing
                ? 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                : 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
            }`}
          >
            {user.isFollowing ? '已关注' : '关注'}
          </button>
        )}
      </div>
    );
  }
  
  // 最小型展示
  if (variant === 'minimal') {
    return (
      <Link href={profileUrl} className={`flex items-center ${className}`}>
        <Image
          src={user.avatarUrl || '/default-avatar.png'}
          alt={user.displayName || user.username}
          width={32}
          height={32}
          className="rounded-full"
        />
        <div className="ml-2 min-w-0">
          <p className="font-medium text-sm truncate">{user.displayName || user.username}</p>
          {user.isVerified && (
            <span className="ml-1 text-blue-500 inline-block" title="已验证账号">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
            </span>
          )}
        </div>
      </Link>
    );
  }
  
  // 默认完整展示
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden ${className}`}>
      {/* 封面图片 */}
      <div className="h-32 bg-gradient-to-r from-blue-400 to-indigo-500 relative">
        {user.coverImageUrl && (
          <Image
            src={user.coverImageUrl}
            alt="封面图片"
            fill
            style={{ objectFit: 'cover' }}
          />
        )}
      </div>
      
      {/* 用户头像 */}
      <div className="px-4 pb-4 relative">
        <div className="absolute -top-12 left-4 border-4 border-white dark:border-gray-800 rounded-full">
          <Image
            src={user.avatarUrl || '/default-avatar.png'}
            alt={user.displayName || user.username}
            width={80}
            height={80}
            className="rounded-full"
          />
        </div>
        
        {/* 操作按钮 */}
        <div className="flex justify-end pt-2">
          {isCurrentUser ? (
            <Link
              href="/settings/profile"
              className="px-4 py-1.5 text-sm font-medium rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              编辑资料
            </Link>
          ) : (
            showFollowButton && currentUser && (
              <button
                onClick={handleFollowToggle}
                disabled={loading}
                className={`px-4 py-1.5 text-sm font-medium rounded-full transition focus:outline-none ${
                  user.isFollowing
                    ? 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                    : 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
                }`}
              >
                {user.isFollowing ? '已关注' : '关注'}
              </button>
            )
          )}
        </div>
        
        {/* 用户信息 */}
        <div className="mt-10">
          <div className="flex items-center">
            <h2 className="text-xl font-bold truncate">
              {user.displayName || user.username}
            </h2>
            {user.isVerified && (
              <span className="ml-1 text-blue-500" title="已验证账号">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              </span>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-400">@{user.username}</p>
          
          {user.bio && (
            <p className="mt-3 text-gray-700 dark:text-gray-300">{user.bio}</p>
          )}
          
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            加入于 {formatDate(user.createdAt)}
          </p>
          
          {/* 统计信息 */}
          {showStats && (
            <div className="flex mt-4 space-x-4">
              <Link href={`${profileUrl}/followers`} className="text-gray-600 dark:text-gray-300 hover:underline">
                <span className="font-bold">{user.followersCount}</span> 粉丝
              </Link>
              <Link href={`${profileUrl}/following`} className="text-gray-600 dark:text-gray-300 hover:underline">
                <span className="font-bold">{user.followingCount}</span> 关注
              </Link>
              <Link href={profileUrl} className="text-gray-600 dark:text-gray-300 hover:underline">
                <span className="font-bold">{user.postsCount}</span> 帖子
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserProfileCard; 