'use client';

import React from 'react';
import { useFollowers } from '@/hooks/useUser';
import InfiniteScrollList from './InfiniteScrollList';
import { User } from '@/graphql/types';
import { PageInfo } from '@/graphql/types';

interface FollowersClientProps {
  userId: string;
  initialFollowers: User[];
  initialPageInfo: PageInfo;
}

const FollowersClient: React.FC<FollowersClientProps> = ({
  userId,
  initialFollowers,
  initialPageInfo,
}) => {
  const { followers, pageInfo, fetchMore, loading } = useFollowers(userId);

  const [hasMore, setHasMore] = React.useState(initialPageInfo.hasNextPage);
  const [items, setItems] = React.useState<User[]>(initialFollowers);

  const loadMore = async () => {
    if (!pageInfo?.endCursor) {
      setHasMore(false);
      return [];
    }

    const { data } = await fetchMore({
      variables: { after: pageInfo.endCursor },
    });

    if (data.followers.edges.length > 0) {
      setItems(prev => [...prev, ...data.followers.edges.map((edge: any) => edge.node)]);
      setHasMore(data.followers.pageInfo.hasNextPage);
    } else {
      setHasMore(false);
    }
    return data.followers.edges.map((edge: any) => edge.node);
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

export default FollowersClient;
