import React from 'react';
import { notFound } from 'next/navigation';
import client from '@/lib/apollo-client';
import { Post, PageInfo } from '@/graphql/types';
import PostsClient from '@/components/profile/PostsClient';
import { USER_POSTS_QUERY } from '@/graphql/queries';

async function getPostsPageData(username: string) {
  try {
    console.log('[ProfilePostsPage] SSR fetching posts for username:', username);
    const { data } = await client.query({
      query: USER_POSTS_QUERY,
      variables: { username, first: 10 },
      fetchPolicy: 'network-only', // 使用网络优先策略，确保获取最新数据
      errorPolicy: 'all',
    });
    
    console.log('[ProfilePostsPage] SSR got posts:', data?.userPosts?.edges?.length || 0);
    
    return {
      posts: data.userPosts.edges.map((edge: any) => edge.node),
      pageInfo: data.userPosts.pageInfo,
    };
  } catch (error) {
    console.error('[ProfilePostsPage] SSR failed to fetch user posts:', error);
    return {
      posts: [],
      pageInfo: { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null }
    };
  }
}

export default async function ProfilePostsPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const data = await getPostsPageData(username);

  if (!data) {
    notFound();
  }

  const { posts, pageInfo } = data;

  return (
    <PostsClient
      username={username}
      initialPosts={posts}
      initialPageInfo={pageInfo}
    />
  );
}
