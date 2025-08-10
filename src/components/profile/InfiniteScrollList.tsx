'use client';

import React from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { User, Tweet } from '@/graphql/types';
import UserCard from '@/components/user/UserCard';
import TweetCard from '@/components/tweet/TweetCard';
import { Spinner } from '@/components/core/Spinner';

type ListItem = User | Tweet;

interface InfiniteScrollListProps {
  initialItems: ListItem[];
  fetchMore: () => Promise<ListItem[]>;
  hasMore: boolean;
  itemType: 'user' | 'tweet';
}

const InfiniteScrollList: React.FC<InfiniteScrollListProps> = ({
  initialItems,
  fetchMore,
  hasMore,
  itemType,
}) => {
  const [items, setItems] = React.useState<ListItem[]>(initialItems);

  const loadMore = async () => {
    const newItems = await fetchMore();
    setItems(prevItems => [...prevItems, ...newItems]);
  };

  const renderItem = (item: ListItem) => {
    if (itemType === 'user') {
      return <UserCard key={(item as User).id} user={item as User} />;
    }
    if (itemType === 'tweet') {
      return <TweetCard key={(item as Tweet).id} tweet={item as Tweet} />;
    }
    return null;
  };

  return (
    <InfiniteScroll
      dataLength={items.length}
      next={loadMore}
      hasMore={hasMore}
      loader={<div className="flex justify-center p-4"><Spinner /></div>}
      endMessage={
        <p style={{ textAlign: 'center' }} className="p-4 text-gray-500">
          <b>Yay! You have seen it all</b>
        </p>
      }
    >
      {items.map(item => renderItem(item))}
    </InfiniteScroll>
  );
};

export default InfiniteScrollList;
