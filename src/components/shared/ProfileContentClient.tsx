'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useUserPosts, useUserReplies, useUserMedia, useUserLikes } from '@/hooks/usePosts';
import InfiniteScrollList from '../profile/InfiniteScrollList';
import { Post, PageInfo } from '@/graphql/types';

type ContentType = 'posts' | 'replies' | 'media' | 'likes';

interface ProfileContentClientProps {
  contentType: ContentType;
  username?: string;
  userId?: string;
  initialPosts: Post[];
  initialPageInfo: PageInfo;
}

const ProfileContentClient: React.FC<ProfileContentClientProps> = ({
  contentType,
  username,
  userId,
  initialPosts,
  initialPageInfo,
}) => {
  const [hasMore, setHasMore] = useState(initialPageInfo.hasNextPage);

  // Use appropriate hook based on content type
  const postsHook = useUserPosts(username || '', 10, undefined);
  const repliesHook = useUserReplies(userId || '', 10);
  const mediaHook = useUserMedia(userId || '', 10);
  const likesHook = useUserLikes(userId || '', 10);

  // Select the appropriate hook result
  const hookResult = useMemo(() => {
    switch (contentType) {
      case 'posts':
        return postsHook;
      case 'replies':
        return repliesHook;
      case 'media':
        return mediaHook;
      case 'likes':
        return likesHook;
      default:
        return postsHook;
    }
  }, [contentType, postsHook, repliesHook, mediaHook, likesHook]);

  const { posts, pageInfo, fetchMore, refetch, loading } = hookResult;

  // Compute display posts with priority logic
  const displayPosts = useMemo(() => {
    console.log(`[ProfileContentClient-${contentType}] Computing display posts:`, { 
      hookPostsLength: posts?.length || 0, 
      initialPostsLength: initialPosts.length,
      loading,
      identifier: username || userId 
    });
    
    if (posts && posts.length > 0) {
      console.log(`[ProfileContentClient-${contentType}] Using fresh hook data`);
      return posts;
    } else if (initialPosts.length > 0) {
      console.log(`[ProfileContentClient-${contentType}] Using initial posts (SSR data)`);
      return initialPosts;
    } else if (loading) {
      console.log(`[ProfileContentClient-${contentType}] Loading, showing empty for now`);
      return [];
    }
    
    return [];
  }, [posts, initialPosts, loading, contentType, username, userId]);

  // Monitor page info changes
  useEffect(() => {
    console.log(`[ProfileContentClient-${contentType}] PageInfo changed:`, { 
      hasNextPage: pageInfo?.hasNextPage, 
      endCursor: pageInfo?.endCursor,
      initialHasNextPage: initialPageInfo.hasNextPage 
    });
    if (pageInfo) {
      setHasMore(pageInfo.hasNextPage);
    } else {
      setHasMore(initialPageInfo.hasNextPage);
    }
  }, [pageInfo?.hasNextPage, initialPageInfo.hasNextPage, contentType]);

  const displayPageInfo = pageInfo || initialPageInfo;

  const loadMore = async () => {
    console.log(`[ProfileContentClient-${contentType}] loadMore called:`, {
      endCursor: displayPageInfo?.endCursor,
      hasNextPage: displayPageInfo?.hasNextPage
    });
    
    if (!displayPageInfo?.endCursor) {
      console.log(`[ProfileContentClient-${contentType}] No endCursor, setting hasMore to false`);
      setHasMore(false);
      return [];
    }
    
    try {
      const variables = contentType === 'posts' 
        ? { username, first: 10, after: displayPageInfo.endCursor }
        : { userId, first: 10, after: displayPageInfo.endCursor };

      const { data } = await fetchMore({ variables });
      
      // Extract data based on content type
      let newData;
      switch (contentType) {
        case 'posts':
          newData = data.userPosts;
          break;
        case 'replies':
          newData = data.userReplies;
          break;
        case 'media':
          newData = data.userMedia;
          break;
        case 'likes':
          newData = data.userLikes;
          break;
        default:
          newData = data.userPosts;
      }

      console.log(`[ProfileContentClient-${contentType}] fetchMore result:`, {
        newPostsCount: newData.edges.length,
        hasNextPage: newData.pageInfo.hasNextPage,
        newEndCursor: newData.pageInfo.endCursor
      });
      
      setHasMore(newData.pageInfo.hasNextPage);
      return newData.edges.map((edge: any) => edge.node);
    } catch (error) {
      console.error(`[ProfileContentClient-${contentType}] loadMore failed:`, error);
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

export default ProfileContentClient;
