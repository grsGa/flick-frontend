'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useUserPosts } from '@/hooks/usePosts';
import InfiniteScrollList from './InfiniteScrollList';
import { Post, PageInfo } from '@/graphql/types';

interface PostsClientProps {
  username: string;
  initialPosts: Post[];
  initialPageInfo: PageInfo;
}

const PostsClient: React.FC<PostsClientProps> = ({
  username,
  initialPosts,
  initialPageInfo,
}) => {
  const { posts, pageInfo, fetchMore, refetch, loading } = useUserPosts(username);
  const [hasMore, setHasMore] = useState(initialPageInfo.hasNextPage);

  // 使用 useMemo 来稳定 displayPosts，避免无限重渲染
  const displayPosts = useMemo(() => {
    console.log('[PostsClient] Computing display posts:', { 
      hookPostsLength: posts?.length || 0, 
      initialPostsLength: initialPosts.length,
      loading,
      username 
    });
    
    // 修复：优先使用有数据的源，避免显示空列表
    if (posts && posts.length > 0) {
      console.log('[PostsClient] Using fresh hook data');
      return posts;
    } else if (initialPosts.length > 0) {
      console.log('[PostsClient] Using initial posts (SSR data)');
      return initialPosts;
    } else if (loading) {
      console.log('[PostsClient] Loading, showing empty for now');
      return [];
    }
    
    return [];
  }, [posts, initialPosts, loading, username]);

  // 监听页面信息变化
  useEffect(() => {
    console.log('[PostsClient] PageInfo changed:', { 
      hasNextPage: pageInfo?.hasNextPage, 
      endCursor: pageInfo?.endCursor,
      initialHasNextPage: initialPageInfo.hasNextPage 
    });
    if (pageInfo) {
      setHasMore(pageInfo.hasNextPage);
    } else {
      // 如果没有pageInfo，使用初始pageInfo
      setHasMore(initialPageInfo.hasNextPage);
    }
  }, [pageInfo?.hasNextPage, initialPageInfo.hasNextPage]);

  const displayPageInfo = pageInfo || initialPageInfo;

  const loadMore = async () => {
    console.log('[PostsClient] loadMore called:', {
      endCursor: displayPageInfo?.endCursor,
      hasNextPage: displayPageInfo?.hasNextPage
    });
    
    if (!displayPageInfo?.endCursor) {
      console.log('[PostsClient] No endCursor, setting hasMore to false');
      setHasMore(false);
      return [];
    }
    
    try {
      const { data } = await fetchMore({ 
        variables: { 
          username,
          first: 10,
          after: displayPageInfo.endCursor 
        } 
      });
      console.log('[PostsClient] fetchMore result:', {
        newPostsCount: data.userPosts.edges.length,
        hasNextPage: data.userPosts.pageInfo.hasNextPage,
        newEndCursor: data.userPosts.pageInfo.endCursor
      });
      
      setHasMore(data.userPosts.pageInfo.hasNextPage);
      return data.userPosts.edges.map((edge: any) => edge.node);
    } catch (error) {
      console.error('[PostsClient] loadMore failed:', error);
      setHasMore(false);
      return [];
    }
  };

  return (
    <InfiniteScrollList
      initialItems={displayPosts}
      fetchMore={loadMore}
      hasMore={hasMore}
      itemType="post"
    />
  );
};

export default PostsClient;
