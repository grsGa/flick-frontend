'use client';

import React, { useEffect } from 'react';
import PostCard from '@/components/post/PostCard';
import InfiniteScrollList from '@/components/profile/InfiniteScrollList';
import { useHomeFeed, useFollowingFeed } from '@/hooks/usePosts';
import { useLikePost } from '@/hooks/usePosts';
import { HomeTabType } from './HomeTabs';

interface HomeFeedProps {
  activeTab: HomeTabType;
}

export default function HomeFeed({ activeTab }: HomeFeedProps) {
  // Use different hooks based on active tab
  const forYouData = useHomeFeed(-1);
  const followingData = useFollowingFeed(20);
  const { likePost } = useLikePost();

  // Select data source based on active tab
  const { posts, loading, error, pageInfo, fetchMore, refetch } = activeTab === 'following' 
    ? followingData 
    : forYouData;

  // Refetch data when tab changes to ensure fresh data
  useEffect(() => {
    console.log(`[HomeFeed] Tab changed to: ${activeTab}, refetching data`);
    if (refetch) {
      refetch();
    }
  }, [activeTab, refetch]);

  const handleLikePost = async (postId: string) => {
    try {
      await likePost({
        variables: {
          input: {
            postId,
          },
        },
      });
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  };

  const loadMore = async () => {
    console.log(`[HomeFeed] loadMore called for ${activeTab} tab`);
    // 首页显示所有帖子，不需要分页加载
    return [];
  };

  if (loading && posts.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error && posts.length === 0) {
    return (
      <div className="p-4 text-center text-red-500">
        加载失败: {error.message}
      </div>
    );
  }

  // Filter posts based on active tab (placeholder logic)
  const filteredPosts = posts; // TODO: Implement actual filtering logic

  if (filteredPosts.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <div className="space-y-2">
          <div className="text-2xl">📭</div>
          <h3 className="font-semibold">
            {activeTab === 'following' ? '还没有关注的人发帖' : '暂无推荐内容'}
          </h3>
          <p className="text-sm">
            {activeTab === 'following' 
              ? '关注一些用户来查看他们的帖子' 
              : '稍后再来看看吧'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <InfiniteScrollList
      initialItems={filteredPosts}
      fetchMore={loadMore}
      hasMore={pageInfo?.hasNextPage || false}
      itemType="post"
      onLike={handleLikePost}
    />
  );
}
