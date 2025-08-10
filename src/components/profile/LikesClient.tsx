'use client';

import React from 'react';
import { useUserLikes } from '@/hooks/useTweets';
import InfiniteScrollList from './InfiniteScrollList';
import { Tweet, PageInfo } from '@/graphql/types';

interface LikesClientProps {
  userId: string;
  initialTweets: Tweet[];
  initialPageInfo: PageInfo;
}

const LikesClient: React.FC<LikesClientProps> = ({
  userId,
  initialTweets,
  initialPageInfo,
}) => {
  const { tweets, pageInfo, fetchMore } = useUserLikes(userId);
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
      initialItems={initialTweets}
      fetchMore={loadMore}
      hasMore={hasMore}
      itemType="tweet"
    />
  );
};

export default LikesClient;
