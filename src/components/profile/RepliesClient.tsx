'use client';

import React from 'react';
import { useUserReplies } from '@/hooks/usePosts';
import InfiniteScrollList from './InfiniteScrollList';
import { Post, PageInfo } from '@/graphql/types';

interface RepliesClientProps {
  userId: string;
  initialPosts: Post[];
  initialPageInfo: PageInfo;
}

const RepliesClient: React.FC<RepliesClientProps> = ({
  userId,
  initialPosts,
  initialPageInfo,
}) => {
  const { posts, pageInfo, fetchMore } = useUserReplies(userId);
  const [hasMore, setHasMore] = React.useState(initialPageInfo.hasNextPage);

  const loadMore = async () => {
    if (!pageInfo?.endCursor) {
      setHasMore(false);
      return [];
    }
    const { data } = await fetchMore({ variables: { after: pageInfo.endCursor } });
    setHasMore(data.userReplies.pageInfo.hasNextPage);
    return data.userReplies.edges.map((edge: any) => edge.node);
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

export default RepliesClient;
