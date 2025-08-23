'use client';

import React, { useEffect, useRef } from 'react';
import { useFollowing } from '@/hooks/useUser';
import { useAuth } from '@/hooks/useAuth';
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
  const { user: currentUser } = useAuth();
  const { following, pageInfo, fetchMore, loading, refetch } = useFollowing(userId);
  const hasRefetched = useRef(false);

  // Refetch data when user authentication is available to get correct follow states
  useEffect(() => {
    if (currentUser && !loading && !hasRefetched.current) {
      console.log('[FollowingClient] User authenticated, refetching once to get correct follow states');
      console.log('[FollowingClient] Current user ID:', currentUser.id, 'Profile user ID:', userId);
      hasRefetched.current = true;
      refetch({
        fetchPolicy: 'network-only' // Force network request to get fresh data
      }).then((result) => {
        console.log('[FollowingClient] Refetch completed, new data:', result.data);
        const followingUsers = result.data?.following?.edges?.map(edge => ({
          username: edge.node.username,
          isFollowing: edge.node.isFollowing
        }));
        console.log('[FollowingClient] Following users:', followingUsers);
        
        // Log detailed comparison
        followingUsers?.forEach(user => {
          console.log(`[FollowingClient] User ${user.username}: isFollowing = ${user.isFollowing}`);
        });
        console.log('[FollowingClient] Updated following data with correct follow states');
      }).catch((error) => {
        console.error('[FollowingClient] Refetch failed:', error);
        hasRefetched.current = false; // Reset to allow retry
      });
    }
  }, [currentUser, refetch, loading]); // Only refetch once when user becomes available

  // Prioritize fresh GraphQL data over initial SSR data when user is authenticated
  // After refetch, always use GraphQL data if available, regardless of length
  const items = currentUser && following !== undefined ? following : 
                !currentUser && initialFollowing.length > 0 ? initialFollowing :
                following !== undefined ? following : initialFollowing;
  
  console.log('[FollowingClient] Data source decision:', {
    currentUser: !!currentUser,
    followingLength: following?.length || 0,
    followingUndefined: following === undefined,
    initialFollowingLength: initialFollowing.length,
    usingSource: currentUser && following !== undefined ? 'fresh-graphql' : 
                 !currentUser && initialFollowing.length > 0 ? 'ssr-initial' :
                 following !== undefined ? 'graphql-fallback' : 'initial-fallback',
    itemsLength: items.length
  });
  const currentPageInfo = pageInfo || initialPageInfo;
  const hasMore = currentPageInfo.hasNextPage;

  // Show loading state while GraphQL is fetching
  if (loading && items.length === 0) {
    return (
      <div className="bg-white">
        <div className="flex justify-center items-center p-12">
          <div className="text-gray-500">Loading following...</div>
        </div>
      </div>
    );
  }

  // Show empty state only when not loading and no items
  if (!loading && items.length === 0) {
    return (
      <div className="bg-white">
        <div className="text-center p-12">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Not following anyone yet</h2>
          <p className="text-gray-500 max-w-sm mx-auto">When this account follows someone, they'll show up here.</p>
        </div>
      </div>
    );
  }

  const loadMore = async () => {
    if (!currentPageInfo?.endCursor) {
      return [];
    }

    const { data } = await fetchMore({
      variables: { after: currentPageInfo.endCursor },
    });

    return data.following.edges.map((edge: any) => edge.node);
  };

  return (
    <InfiniteScrollList
      initialItems={items}
      fetchMore={loadMore}
      hasMore={hasMore}
      itemType="following"
    />
  );
};

export default FollowingClient;
