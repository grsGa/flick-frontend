import React from 'react';
import { notFound } from 'next/navigation';
import client from '@/lib/apollo-client';
import { gql } from '@apollo/client';
import { User, PageInfo, Post } from '@/graphql/types';
import LikesClient from '@/components/profile/LikesClient';
import ProfileTabs from '@/components/profile/ProfileTabs';

const GET_USER = gql`
  query UserByUsername($username: String!) {
    userByUsername(username: $username) {
      id
      username
    }
  }
`;

const GET_USER_LIKES = gql`
  query UserLikes($userId: ID!, $first: Int!, $after: String) {
    userLikes(userId: $userId, first: $first, after: $after) {
      edges {
        node {
          id
          content
          createdAt
          author {
            id
            username
            displayName
            avatarUrl
            isVerified
          }
          media {
            id
            url
            type
          }
          interaction {
            isLiked
            isBookmarked
            isReposted
            likeCount
            commentCount
            repostCount
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

async function getLikesPageData(username: string) {
  try {
    const userResult = await client.query({
      query: GET_USER,
      variables: { username },
    });
    const user = userResult.data.userByUsername;

    if (!user) {
      return null;
    }

    const likesResult = await client.query({
      query: GET_USER_LIKES,
      variables: { userId: user.id, first: 10 },
    });

    return {
      user,
      posts: likesResult.data.userLikes.edges.map((edge: any) => edge.node),
      pageInfo: likesResult.data.userLikes.pageInfo,
    };
  } catch (error) {
    console.error('Failed to fetch likes page data:', error);
    return null;
  }
}

export default async function LikesPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const data = await getLikesPageData(username);

  if (!data) {
    notFound();
  }

  const { user, posts, pageInfo } = data;

  return (
    <LikesClient
      userId={user.id}
      initialPosts={posts}
      initialPageInfo={pageInfo}
    />
  );
}
