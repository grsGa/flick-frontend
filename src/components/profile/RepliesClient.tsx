'use client';

import React from 'react';
import { useUserReplies } from '@/hooks/useTweets';
import InfiniteScrollList from './InfiniteScrollList';
import { Tweet, PageInfo } from '@/graphql/types';

interface RepliesClientProps {
  userId: string;
  initialTweets: Tweet[];
  initialPageInfo: PageInfo;
}

const RepliesClient: React.FC<RepliesClientProps> = ({
  userId,
  initialTweets,
  initialPageInfo,
}) => {
  const { tweets, pageInfo, fetchMore } = useUserReplies(userId);
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
      initialItems={initialTweets}
      fetchMore={loadMore}
      hasMore={hasMore}
      itemType="tweet"
    />
  );
};

export default RepliesClient;
