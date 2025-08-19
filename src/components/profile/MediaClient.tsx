'use client';

import React from 'react';
import { useUserMedia } from '@/hooks/usePosts';
import InfiniteScrollList from './InfiniteScrollList';
import { Post, PageInfo } from '@/graphql/types';

interface MediaClientProps {
  userId: string;
  initialPosts: Post[];
  initialPageInfo: PageInfo;
}

const MediaClient: React.FC<MediaClientProps> = ({
  userId,
  initialPosts,
  initialPageInfo,
}) => {
  const { posts, pageInfo, fetchMore } = useUserMedia(userId);
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
      initialItems={initialPosts}
      fetchMore={loadMore}
      hasMore={hasMore}
      itemType="post"
    />
  );
};

export default MediaClient;
