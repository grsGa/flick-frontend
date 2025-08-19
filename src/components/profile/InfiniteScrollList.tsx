'use client';

import React from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { User, Post } from '@/graphql/types';
import UserCard from '@/components/user/UserCard';
import PostCard from '@/components/post/PostCard';
import { Spinner } from '@/components/core/Spinner';

type ListItem = User | Post;

interface InfiniteScrollListProps {
  initialItems: ListItem[];
  fetchMore: () => Promise<ListItem[]>;
  hasMore: boolean;
  itemType: 'user' | 'post';
}

const InfiniteScrollList: React.FC<InfiniteScrollListProps> = ({
  initialItems,
  fetchMore,
  hasMore,
  itemType,
}) => {
  console.log('[InfiniteScrollList] Component initialized:', {
    initialItemsLength: initialItems.length,
    hasMore,
    itemType
  });
  
  const [items, setItems] = React.useState<ListItem[]>(initialItems);

  // 监听 initialItems 变化，确保组件能响应新数据
  React.useEffect(() => {
    console.log('[InfiniteScrollList] initialItems changed:', {
      newLength: initialItems.length,
      currentLength: items.length
    });
    setItems(initialItems);
  }, [initialItems]);

  const loadMore = async () => {
    console.log('[InfiniteScrollList] loadMore called, current items:', items.length);
    try {
      const newItems = await fetchMore();
      console.log('[InfiniteScrollList] fetchMore returned:', newItems.length, 'new items');
      setItems(prevItems => {
        const updated = [...prevItems, ...newItems];
        console.log('[InfiniteScrollList] Updated items count:', updated.length);
        return updated;
      });
    } catch (error) {
      console.error('[InfiniteScrollList] loadMore failed:', error);
    }
  };

  const renderItem = (item: ListItem) => {
    if (itemType === 'user') {
      return <UserCard key={(item as User).id} user={item as User} />;
    }
    if (itemType === 'post') {
      return <PostCard key={(item as Post).id} post={item as Post} />;
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
        items.length > 0 ? (
          <p style={{ textAlign: 'center' }} className="p-4 text-gray-500">
            <b>Yay! You have seen it all</b>
          </p>
        ) : null
      }
    >
      {items.map(item => renderItem(item))}
      {items.length === 0 && !hasMore && (
        <div className="p-8 text-center text-gray-500">
          No content yet
        </div>
      )}
    </InfiniteScroll>
  );
};

export default InfiniteScrollList;
