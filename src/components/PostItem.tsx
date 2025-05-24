"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Post, MediaType } from '@/graphql/types';
import { formatDate, formatNumber } from '@/lib/utils';
import { useCurrentUser } from '@/lib/auth-apollo-hooks';

interface PostItemProps {
  post: Post;
  showActions?: boolean;
  showAuthor?: boolean;
  onLike?: (postId: string) => Promise<void>;
  className?: string;
}

export function PostItem({
  post,
  showActions = true,
  showAuthor = true,
  onLike,
  className = '',
}: PostItemProps) {
  const currentUser = useCurrentUser();
  const [isLiking, setIsLiking] = React.useState(false);
  
  // 处理点赞操作
  const handleLike = async () => {
    if (!currentUser || isLiking) return;
    
    try {
      setIsLiking(true);
      await onLike?.(post.id);
    } catch (error) {
      console.error('点赞失败:', error);
    } finally {
      setIsLiking(false);
    }
  };
  
  // 内容格式化 - 可以在这里添加更多格式化逻辑，如链接、@提及、话题标签等
  const formatContent = (content: string) => {
    return content;
  };
  
  // 获取永久链接
  const permalink = `/${post.author.username}/${post.permalinkId}`;
  
  return (
    <article className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 ${className}`}>
      {/* 作者信息 */}
      {showAuthor && (
        <div className="flex items-start mb-3">
          <Link href={`/${post.author.username}`} className="mr-3 shrink-0">
            <Image 
              src={post.author.avatarUrl || '/default-avatar.png'} 
              alt={post.author.displayName || post.author.username}
              width={40}
              height={40}
              className="rounded-full"
            />
          </Link>
          
          <div className="min-w-0">
            <div className="flex items-center">
              <Link href={`/${post.author.username}`} className="font-medium hover:underline truncate mr-2">
                {post.author.displayName || post.author.username}
              </Link>
              
              {post.author.isVerified && (
                <span className="text-blue-500" title="已验证账号">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                </span>
              )}
            </div>
            
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <span className="truncate">@{post.author.username}</span>
              <span className="mx-1">·</span>
              <Link href={permalink} className="hover:underline whitespace-nowrap">
                {formatDate(post.createdAt)}
              </Link>
            </div>
          </div>
        </div>
      )}
      
      {/* 帖子内容 */}
      <div className="mb-3">
        <p className="whitespace-pre-wrap break-words mb-3">
          {formatContent(post.content)}
        </p>
        
        {/* 媒体内容 */}
        {post.media && post.media.length > 0 && (
          <div className={`grid gap-2 mb-3 ${post.media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {post.media.map((item) => (
              <div key={item.id} className="relative rounded-lg overflow-hidden">
                {item.type === MediaType.IMAGE && (
                  <img 
                    src={item.url} 
                    alt="帖子图片" 
                    className="w-full h-auto object-cover rounded-lg"
                    style={{ maxHeight: '400px' }}
                  />
                )}
                
                {item.type === MediaType.VIDEO && (
                  <div className="relative pt-[56.25%]">
                    <video 
                      src={item.url}
                      poster={item.thumbnailUrl}
                      controls
                      className="absolute top-0 left-0 w-full h-full object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* 交互按钮 */}
      {showActions && (
        <div className="flex justify-between mt-2 text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-6">
            {/* 点赞按钮 */}
            <button 
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center space-x-1 group ${post.isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill={post.isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" className="transition-all">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span>{formatNumber(post.likesCount)}</span>
            </button>
            
            {/* 评论按钮 */}
            <Link 
              href={permalink} 
              className="flex items-center space-x-1 hover:text-blue-500"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>{formatNumber(post.commentsCount)}</span>
            </Link>
            
            {/* 分享按钮 */}
            <button className="flex items-center space-x-1 hover:text-green-500">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <span>{formatNumber(post.sharesCount)}</span>
            </button>
          </div>
          
          {/* 保存按钮 */}
          <button className={`group ${post.isSaved ? 'text-blue-500' : 'hover:text-blue-500'}`}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill={post.isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>
      )}
    </article>
  );
}

export default PostItem; 