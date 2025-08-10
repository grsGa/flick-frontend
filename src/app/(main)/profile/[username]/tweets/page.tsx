import React from 'react';
import { notFound } from 'next/navigation';
import client from '@/lib/apollo-client';
import { gql } from '@apollo/client';
import { Tweet, PageInfo } from '@/graphql/types';
import TweetsClient from '@/components/profile/TweetsClient';

const GET_USER_TWEETS = gql`
  query UserTweets($username: String!, $first: Int!, $after: String) {
    userTweets(username: $username, first: $first, after: $after) {
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

async function getTweetsPageData(username: string) {
  try {
    const { data } = await client.query({
      query: GET_USER_TWEETS,
      variables: { username, first: 10 },
    });
    return {
      tweets: data.userTweets.edges.map((edge: any) => edge.node),
      pageInfo: data.userTweets.pageInfo,
    };
  } catch (error) {
    console.error('Failed to fetch user tweets:', error);
    return null;
  }
}

export default async function ProfileTweetsPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const data = await getTweetsPageData(username);

  if (!data) {
    notFound();
  }

  const { tweets, pageInfo } = data;

  return (
    <TweetsClient
      username={username}
      initialTweets={tweets}
      initialPageInfo={pageInfo}
    />
  );
}
