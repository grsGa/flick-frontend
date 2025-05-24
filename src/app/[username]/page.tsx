"use client";

import React, { useState } from 'react';
import { useUserProfile, useUserPosts } from '@/lib/user-hooks';
import UserProfileCard from '@/components/UserProfileCard';
import { Post } from '@/graphql/types';
import { useRouter } from 'next/navigation';
import PostItem from '@/components/PostItem';

type Props = {
  params: {
    username: string;
  };
}

export default function UserProfilePage({ params }: Props) {
  const router = useRouter();
  const username = params.username;
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // 获取用户资料
  const { user, loading: userLoading, error: userError } = useUserProfile(username);
  
  // 获取用户帖子
  const { posts, loading: postsLoading, hasMore } = useUserPosts(username, page);
  
  // 处理关注状态变化
  const handleFollowStatusChange = (isFollowing: boolean) => {
    // 更新本地状态，避免重新加载
    if (user) {
      user.isFollowing = isFollowing;
    }
  };
  
  // 处理点赞操作
  const handleLikePost = async (postId: string) => {
    // 这里应该实现点赞逻辑，暂时留空
    console.log('点赞帖子:', postId);
  };
  
  // 加载更多帖子
  const loadMorePosts = async () => {
    if (isLoadingMore || !hasMore || postsLoading) return;
    
    setIsLoadingMore(true);
    setPage(prevPage => prevPage + 1);
    setIsLoadingMore(false);
  };
  
  // 处理错误
  if (userError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-red-800 dark:text-red-200">
          <p>加载用户资料时出错: {userError}</p>
        </div>
      </div>
    );
  }
  
  // 处理用户不存在的情况
  if (!userLoading && !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h1 className="text-xl font-bold mb-2">用户不存在</h1>
          <p className="text-gray-600 dark:text-gray-400">找不到用户名为 @{username} 的用户</p>
          <button 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            onClick={() => router.push('/')}
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-6 max-w-4xl">
            {/* 用户资料卡片 */}
      <div className="mb-6">
        {userLoading ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md h-64 animate-pulse" />
        ) : (
          <UserProfileCard user={user!} onFollowStatusChange={handleFollowStatusChange} />
                  )}
                </div>
                
      {/* 内容导航 */}
      <div className="border-b dark:border-gray-700 mb-6">
        <nav className="flex">
          <button className="px-4 py-3 border-b-2 border-blue-500 font-medium text-blue-500">
            帖子
          </button>
          <button className="px-4 py-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            回复
          </button>
          <button className="px-4 py-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            点赞
          </button>
          <button className="px-4 py-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            媒体
          </button>
        </nav>
                </div>
                
      {/* 帖子列表 */}
      <div className="space-y-4">
        {postsLoading && page === 1 ? (
          // 首次加载占位符
          Array.from({ length: 3 }).map((_, index) => (
            <div 
              key={`skeleton-${index}`} 
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 animate-pulse"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/6" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    </div>
                  </div>
          ))
        ) : posts.length === 0 ? (
          // 无帖子状态
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
            <h3 className="text-lg font-medium mb-2">尚无帖子</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {user?.displayName || username} 还没有发表任何帖子
            </p>
                  </div>
        ) : (
          // 帖子列表 - 使用PostItem组件
          <>
            {posts.map((post: Post) => (
              <PostItem 
                          key={post.id}
                post={post}
                showAuthor={false} 
                onLike={handleLikePost}
                        />
                      ))}
            
            {/* 加载更多按钮 */}
            {hasMore && (
              <div className="text-center py-4">
                <button
                  onClick={loadMorePosts}
                  disabled={isLoadingMore || postsLoading}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition disabled:opacity-50"
                >
                  {isLoadingMore ? '加载中...' : '加载更多'}
                </button>
                  </div>
                )}
          </>
        )}
      </div>
    </main>
  );
}