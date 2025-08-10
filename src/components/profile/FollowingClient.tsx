'use client';

import React from 'react';
import { useFollowing } from '@/hooks/useUser';
import InfiniteScrollList from './InfiniteScrollList';
import { User } from '@/graphql/types';
import { PageInfo } from '@/graphql/types';

interface FollowingClientProps {
  userId: string;
  initialFollowing: User[];
  initialPageInfo: PageInfo;
}

const FollowingClient: React.FC<FollowingClientProps> = ({
  userId,
  initialFollowing,
  initialPageInfo,
}) => {
  const { following, pageInfo, fetchMore, loading } = useFollowing(userId);

  const [hasMore, setHasMore] = React.useState(initialPageInfo.hasNextPage);
  const [items, setItems] = React.useState<User[]>(initialFollowing);

  const loadMore = async () => {
    if (!pageInfo?.endCursor) {
      setHasMore(false);
      return [];
    }

    const { data } = await fetchMore({
      variables: { after: pageInfo.endCursor },
    });

    if (data.following.edges.length > 0) {
      setItems(prev => [...prev, ...data.following.edges.map((edge: any) => edge.node)]);
      setHasMore(data.following.pageInfo.hasNextPage);
    } else {
      setHasMore(false);
    }
    return data.following.edges.map((edge: any) => edge.node);
  };

  return (
    <InfiniteScrollList
      initialItems={items}
      fetchMore={loadMore}
      hasMore={hasMore}
      itemType="user"
    />
  );
};

export default FollowingClient;
