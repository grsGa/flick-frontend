'use client';

import React from 'react';
import MainContainer from '@/components/layout/MainContainer';
import PostCard from '@/components/post/PostCard';
import InfiniteScrollList from '@/components/profile/InfiniteScrollList';
import { useHomeFeed } from '@/hooks/usePosts';
import { useLikePost } from '@/hooks/usePosts';

export default function Home() {
  const { posts, loading, error, pageInfo, fetchMore } = useHomeFeed(-1); // -1表示获取所有帖子
  const { likePost } = useLikePost();

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
    console.log('[HomePage] loadMore called - but homepage shows all posts, no pagination needed');
    // 首页显示所有帖子，不需要分页加载
    return [];
  };

  if (loading && posts.length === 0) {
    return (
      <MainContainer showTopBar={true} topBarTitle="首页">
        <div className="p-4 text-center">
          加载中...
        </div>
      </MainContainer>
    );
  }

  if (error && posts.length === 0) {
    return (
      <MainContainer showTopBar={true} topBarTitle="首页">
        <div className="p-4 text-center text-red-500">
          加载失败: {error.message}
        </div>
      </MainContainer>
    );
  }

  return (
    <MainContainer showTopBar={true} topBarTitle="首页">
      <InfiniteScrollList
        initialItems={posts}
        fetchMore={loadMore}
        hasMore={pageInfo?.hasNextPage || false}
        itemType="post"
        onLike={handleLikePost}
      />
    </MainContainer>
  );
}