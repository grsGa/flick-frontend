'use client';

import React from 'react';
import MainContainer from '@/components/layout/MainContainer';
import PostCard from '@/components/post/PostCard';
import { useHomeFeed } from '@/hooks/usePosts';
import { useLikePost } from '@/hooks/usePosts';

export default function Home() {
  const { posts, loading, error } = useHomeFeed(10);
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

  return (
    <MainContainer showTopBar={true} topBarTitle="首页">
      {loading && (
        <div className="p-4 text-center">
          加载中...
        </div>
      )}
      {error && (
        <div className="p-4 text-center text-red-500">
          加载失败: {error.message}
        </div>
      )}
      {posts.map((post: any) => (
        <PostCard
          key={post.id}
          post={post}
          onLike={() => handleLikePost(post.id)}
        />
      ))}
    </MainContainer>
  );
}