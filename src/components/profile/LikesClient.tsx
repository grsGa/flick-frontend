'use client';

import React from 'react';
import { useUserLikes } from '@/hooks/usePosts';
import InfiniteScrollList from './InfiniteScrollList';
import { Post, PageInfo } from '@/graphql/types';

interface LikesClientProps {
  userId: string;
  initialPosts: Post[];
  initialPageInfo: PageInfo;
}

const LikesClient: React.FC<LikesClientProps> = ({
  userId,
  initialPosts,
  initialPageInfo,
}) => {
  const { posts, pageInfo, fetchMore } = useUserLikes(userId);
  const [hasMore, setHasMore] = React.useState(initialPageInfo.hasNextPage);

  const loadMore = async () => {
    if (!pageInfo?.endCursor) {
      setHasMore(false);
      return [];
    }
    const { data } = await fetchMore({ variables: { after: pageInfo.endCursor } });
    setHasMore(data.userLikes.pageInfo.hasNextPage);
    return data.userLikes.edges.map((edge: any) => edge.node);
  };

  return (
    <InfiniteScrollList
      initialItems={initialPosts}
      fetchMore={loadMore}
      hasMore={hasMore}
      itemType="post"
    />
  );
};

export default LikesClient;
