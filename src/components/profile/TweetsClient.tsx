'use client';

import React from 'react';
import { useUserTweets } from '@/hooks/useTweets';
import InfiniteScrollList from './InfiniteScrollList';
import { Tweet, PageInfo } from '@/graphql/types';

interface TweetsClientProps {
  username: string;
  initialTweets: Tweet[];
  initialPageInfo: PageInfo;
}

const TweetsClient: React.FC<TweetsClientProps> = ({
  username,
  initialTweets,
  initialPageInfo,
}) => {
  const { tweets, pageInfo, fetchMore } = useUserTweets(username);
  const [hasMore, setHasMore] = React.useState(initialPageInfo.hasNextPage);

  const loadMore = async () => {
    if (!pageInfo?.endCursor) {
      setHasMore(false);
      return [];
    }
    const { data } = await fetchMore({ variables: { after: pageInfo.endCursor } });
    setHasMore(data.userTweets.pageInfo.hasNextPage);
    return data.userTweets.edges.map((edge: any) => edge.node);
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

export default TweetsClient;
