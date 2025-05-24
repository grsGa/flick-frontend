'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CalendarIcon, LinkIcon, MapPinIcon, MoreHorizontal } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { FixedEditButton } from './fixed-edit-button';

// 用户类型
interface User {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  cover_image_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  verified_email?: boolean;
  created_at: string;
  following_count: number;
  followers_count: number;
  posts_count: number;
  is_following?: boolean;
  is_blocked?: boolean;
}

interface ProfileHeaderProps {
  user: User;
  isCurrentUser: boolean;
  onFollow: () => void;
  onBlock: () => void;
  onProfileUpdated: () => void;
}

export function ProfileHeader({
  user,
  isCurrentUser,
  onFollow,
  onBlock,
  onProfileUpdated
}: ProfileHeaderProps) {
  const [isFollowing, setIsFollowing] = useState(user.is_following || false);
  const [followersCount, setFollowersCount] = useState(user.followers_count);
  
  // 处理关注按钮点击
  const handleFollowClick = async () => {
    setIsFollowing(!isFollowing);
    setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);
    await onFollow();
  };

  return (
    <div className="mb-6">
      {/* 封面图 */}
      <div className="h-48 md:h-64 w-full relative bg-muted overflow-hidden">
        {user.cover_image_url ? (
          <Image
            src={user.cover_image_url}
            alt="封面图"
            fill
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-r from-primary/10 to-secondary/10" />
        )}
      </div>
      
      {/* 个人信息区 */}
      <div className="px-4 relative">
        {/* 头像 */}
        <div className="absolute -top-16 left-4 border-4 border-background rounded-full">
          <Avatar className="h-32 w-32">
            <AvatarImage src={user.avatar_url} alt={user.display_name || user.username} />
            <AvatarFallback className="text-2xl">{(user.display_name || user.username)[0]}</AvatarFallback>
          </Avatar>
        </div>
        
        {/* 操作按钮 */}
        <div className="flex justify-end pt-3 mb-10">
          {isCurrentUser ? (
            <FixedEditButton user={user} onProfileUpdated={onProfileUpdated} />
          ) : (
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full h-10 w-10">
                    <MoreHorizontal className="h-5 w-5" />
                    <span className="sr-only">更多操作</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onBlock}>
                    {user.is_blocked ? '取消屏蔽' : '屏蔽用户'}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    复制个人主页链接
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-500">
                    举报用户
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={handleFollowClick}>
                {isFollowing ? '已关注' : '关注'}
              </Button>
            </div>
          )}
        </div>
        
        {/* 用户名和基本信息 */}
        <div className="mt-12">
          <div className="flex items-center gap-1">
            <h1 className="text-2xl font-bold">{user.display_name || user.username}</h1>
            {user.verified_email && <VerifiedBadge size="medium" />}
          </div>
          <p className="text-muted-foreground">@{user.username}</p>
          
          {user.bio && <p className="mt-3">{user.bio}</p>}
          
          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 text-sm text-muted-foreground">
            {user.location && (
              <div className="flex items-center gap-1">
                <MapPinIcon className="h-4 w-4" />
                <span>{user.location}</span>
              </div>
            )}
            
            {user.website && (
              <div className="flex items-center gap-1">
                <LinkIcon className="h-4 w-4" />
                <a 
                  href={user.website.startsWith('http') ? user.website : `https://${user.website}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {user.website.replace(/^https?:\/\/(www\.)?/, '')}
                </a>
              </div>
            )}
            
            <div className="flex items-center gap-1">
              <CalendarIcon className="h-4 w-4" />
              <span>加入于 {formatDate(user.created_at)}</span>
            </div>
          </div>
          
          {/* 统计信息 */}
          <div className="flex gap-4 mt-4 text-sm">
            <div>
              <span className="font-bold">{user.following_count}</span>
              <span className="text-muted-foreground ml-1">关注</span>
            </div>
            <div>
              <span className="font-bold">{followersCount}</span>
              <span className="text-muted-foreground ml-1">粉丝</span>
            </div>
            <div>
              <span className="font-bold">{user.posts_count}</span>
              <span className="text-muted-foreground ml-1">帖子</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 