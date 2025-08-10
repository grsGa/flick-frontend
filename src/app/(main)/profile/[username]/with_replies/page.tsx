import React from 'react';
import { notFound } from 'next/navigation';
import client from '@/lib/apollo-client';
import { gql } from '@apollo/client';
import { User, PageInfo, Tweet } from '@/graphql/types';
import RepliesClient from '@/components/profile/RepliesClient';
import ProfileTabs from '@/components/profile/ProfileTabs';

const GET_USER = gql`
  query UserByUsername($username: String!) {
    userByUsername(username: $username) {
      id
      username
    }
  }
`;

const GET_USER_REPLIES = gql`
  query UserReplies($userId: ID!, $first: Int!, $after: String) {
    userReplies(userId: $userId, first: $first, after: $after) {
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
            isRetweeted
            likeCount
            commentCount
            retweetCount
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

async function getRepliesPageData(username: string) {
  try {
    const userResult = await client.query({
      query: GET_USER,
      variables: { username },
    });
    const user = userResult.data.userByUsername;

    if (!user) {
      return null;
    }

    const repliesResult = await client.query({
      query: GET_USER_REPLIES,
      variables: { userId: user.id, first: 10 },
    });

    return {
      user,
      tweets: repliesResult.data.userReplies.edges.map((edge: any) => edge.node),
      pageInfo: repliesResult.data.userReplies.pageInfo,
    };
  } catch (error) {
    console.error('Failed to fetch replies page data:', error);
    return null;
  }
}

export default async function RepliesPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const data = await getRepliesPageData(username);

  if (!data) {
    notFound();
  }

  const { user, tweets, pageInfo } = data;

  return (
    <RepliesClient
      userId={user.id}
      initialTweets={tweets}
      initialPageInfo={pageInfo}
    />
  );
}
