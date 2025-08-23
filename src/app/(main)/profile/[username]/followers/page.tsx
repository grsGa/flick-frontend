import React from 'react';
import { notFound } from 'next/navigation';
import client from '@/lib/apollo-client';
import { gql } from '@apollo/client';
import { User, PageInfo } from '@/graphql/types';
import FollowersClient from '@/components/profile/FollowersClient';
import FollowTabs from '@/components/profile/FollowTabs';
import BackButton from '@/components/core/BackButton';

const GET_USER_AND_FOLLOWERS = gql`
  query GetUserAndFollowers($username: String!, $first: Int!, $after: String) {
    userByUsername(username: $username) {
      id
      username
    }
    followers(userId: $userId, first: $first, after: $after) {
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

// This is a placeholder as the query above has a variable dependency.
// We will fetch the user first, then the followers.
const GET_USER = gql`
  query UserByUsername($username: String!) {
    userByUsername(username: $username) {
      id
      username
    }
  }
`;

const GET_FOLLOWERS = gql`
  query Followers($userId: ID!, $first: Int!, $after: String) {
    followers(userId: $userId, first: $first, after: $after) {
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

async function getFollowersPageData(username: string) {
  try {
    // Step 1: Get the user to find their ID
    const userResult = await client.query({
      query: GET_USER,
      variables: { username },
    });
    const user = userResult.data.userByUsername;

    if (!user) {
      return null;
    }

    // Step 2: Get the followers for that user
    const followersResult = await client.query({
      query: GET_FOLLOWERS,
      variables: { userId: user.id, first: 10 },
      fetchPolicy: 'cache-first', // Use cache-first to ensure data is cached for client-side
    });

    return {
      user,
      followers: followersResult.data.followers.edges.map((edge: any) => edge.node),
      pageInfo: followersResult.data.followers.pageInfo,
    };
  } catch (error) {
    console.error('Failed to fetch followers page data:', error);
    return null;
  }
}

export default async function FollowersPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const data = await getFollowersPageData(username);

  if (!data) {
    notFound();
  }

  const { user, followers, pageInfo } = data;

  return (
    <FollowersClient
      userId={user.id}
      initialFollowers={followers}
      initialPageInfo={pageInfo}
    />
  );
}
