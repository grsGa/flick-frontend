'use client';

import React from 'react';
import { useUserMedia } from '@/hooks/useTweets';
import InfiniteScrollList from './InfiniteScrollList';
import { Tweet, PageInfo } from '@/graphql/types';

interface MediaClientProps {
  userId: string;
  initialTweets: Tweet[];
  initialPageInfo: PageInfo;
}

const MediaClient: React.FC<MediaClientProps> = ({
  userId,
  initialTweets,
  initialPageInfo,
}) => {
  const { tweets, pageInfo, fetchMore } = useUserMedia(userId);
  const [hasMore, setHasMore] = React.useState(initialPageInfo.hasNextPage);

  const loadMore = async () => {
    if (!pageInfo?.endCursor) {
      setHasMore(false);
      return [];
    }
    const { data } = await fetchMore({ variables: { after: pageInfo.endCursor } });
    setHasMore(data.userMedia.pageInfo.hasNextPage);
    return data.userMedia.edges.map((edge: any) => edge.node);
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

export default MediaClient;
