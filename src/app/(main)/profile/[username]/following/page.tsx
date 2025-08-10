import React from 'react';
import { notFound } from 'next/navigation';
import client from '@/lib/apollo-client';
import { gql } from '@apollo/client';
import { User, PageInfo } from '@/graphql/types';
import FollowingClient from '@/components/profile/FollowingClient';
import FollowTabs from '@/components/profile/FollowTabs';
import BackButton from '@/components/core/BackButton';

const GET_USER = gql`
  query UserByUsername($username: String!) {
    userByUsername(username: $username) {
      id
      username
    }
  }
`;

const GET_FOLLOWING = gql`
  query Following($userId: ID!, $first: Int!, $after: String) {
    following(userId: $userId, first: $first, after: $after) {
      edges {
        node {
          id
          username
          displayName
          bio
          avatarUrl
          isFollowing
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

async function getFollowingPageData(username: string) {
  try {
    const userResult = await client.query({
      query: GET_USER,
      variables: { username },
    });
    const user = userResult.data.userByUsername;

    if (!user) {
      return null;
    }

    const followingResult = await client.query({
      query: GET_FOLLOWING,
      variables: { userId: user.id, first: 10 },
    });

    return {
      user,
      following: followingResult.data.following.edges.map((edge: any) => edge.node),
      pageInfo: followingResult.data.following.pageInfo,
    };
  } catch (error) {
    console.error('Failed to fetch following page data:', error);
    return null;
  }
}

export default async function FollowingPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const data = await getFollowingPageData(username);

  if (!data) {
    notFound();
  }

  const { user, following, pageInfo } = data;

  return (
    <FollowingClient
      userId={user.id}
      initialFollowing={following}
      initialPageInfo={pageInfo}
    />
  );
}
