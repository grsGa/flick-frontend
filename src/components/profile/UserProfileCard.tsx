"use client";

import React from 'react';
import Image from 'next/image';
import { User } from '@/graphql/types';
import { useFollowUser, useIsCurrentUser } from '@/lib/user-hooks';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { getImageUrl } from '@/lib/utils';
import Link from 'next/link';

interface UserProfileCardProps {
  user: User;
  refetch?: () => Promise<void>;
}

export function UserProfileCard({ user, refetch }: UserProfileCardProps) {
  const { toast } = useToast();
  const { follow, unfollow, loading } = useFollowUser();
  const isCurrentUser = useIsCurrentUser(user.username);

  // 关注用户处理函数
  const handleFollowAction = async () => {
    if (loading) return;
    
    try {
      const success = user.isFollowing
        ? await unfollow(user.id)
        : await follow(user.id);
      
      if (success) {
        toast({
          title: user.isFollowing ? '已取消关注' : '已关注',
          description: user.isFollowing 
            ? `您已取消关注 ${user.displayName || user.username}`
            : `您已成功关注 ${user.displayName || user.username}`,
          duration: 3000,
        });
        
        if (refetch) {
          await refetch();
        }
      } else {
        toast({
          title: '操作失败',
          description: '请稍后重试',
          variant: 'destructive',
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: '操作失败',
        description: '发生错误，请稍后重试',
        variant: 'destructive',
        duration: 3000,
      });
    }
  };

  return (
    <div className="bg-card rounded-lg shadow-md p-6 w-full">
      {/* 封面图片 */}
      {user.coverImageUrl && (
        <div className="h-32 -mx-6 -mt-6 mb-4 relative overflow-hidden rounded-t-lg">
          <Image
            src={getImageUrl(user.coverImageUrl)}
            alt={`${user.displayName || user.username}的封面图片`}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 items-center">
        {/* 头像 */}
        <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-background">
          <Image
            src={getImageUrl(user.avatarUrl, '/images/default-avatar.png')}
            alt={`${user.displayName || user.username}的头像`}
            fill
            className="object-cover"
          />
          {user.isVerified && (
            <div className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
          )}
        </div>

        {/* 用户信息 */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <h1 className="text-xl font-bold">
              {user.displayName || user.username}
            </h1>
            {user.isVerified && (
              <span className="inline-block bg-primary/10 text-primary text-xs rounded-full px-2 py-1">
                已认证
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
          
          {user.bio && (
            <p className="mt-2 text-sm">{user.bio}</p>
          )}

          {/* 统计信息 */}
          <div className="flex justify-center md:justify-start gap-4 mt-3">
            <div className="text-center">
              <p className="font-bold">{user.postsCount}</p>
              <p className="text-xs text-muted-foreground">帖子</p>
            </div>
            <Link href={`/${user.username}/followers`} className="text-center">
              <p className="font-bold">{user.followersCount}</p>
              <p className="text-xs text-muted-foreground">粉丝</p>
            </Link>
            <Link href={`/${user.username}/following`} className="text-center">
              <p className="font-bold">{user.followingCount}</p>
              <p className="text-xs text-muted-foreground">关注</p>
            </Link>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          {isCurrentUser ? (
            <Link href="/settings/profile" passHref>
              <Button variant="outline">编辑资料</Button>
            </Link>
          ) : (
            <Button
              onClick={handleFollowAction}
              disabled={loading}
              variant={user.isFollowing ? "outline" : "default"}
            >
              {user.isFollowing ? '取消关注' : '关注'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 