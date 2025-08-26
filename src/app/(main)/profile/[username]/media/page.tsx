import React from 'react';
import { notFound } from 'next/navigation';
import client from '@/lib/apollo-client';
import { gql } from '@apollo/client';
import { User, PageInfo, Post } from '@/graphql/types';
import MediaClient from '@/components/profile/MediaClient';
import ProfileTabs from '@/components/profile/ProfileTabs';

const GET_USER = gql`
  query UserByUsername($username: String!) {
    userByUsername(username: $username) {
      id
      username
    }
  }
`;

const GET_USER_MEDIA = gql`
  query UserMedia($userId: ID!, $first: Int!, $after: String) {
    userMedia(userId: $userId, first: $first, after: $after) {
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
            replyCount
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

async function getMediaPageData(username: string) {
  try {
    const userResult = await client.query({
      query: GET_USER,
      variables: { username },
    });
    const user = userResult.data.userByUsername;

    if (!user) {
      return null;
    }

    const mediaResult = await client.query({
      query: GET_USER_MEDIA,
      variables: { userId: user.id, first: 10 },
    });

    return {
      user,
      posts: mediaResult.data.userMedia.edges.map((edge: any) => edge.node),
      pageInfo: mediaResult.data.userMedia.pageInfo,
    };
  } catch (error) {
    console.error('Failed to fetch media page data:', error);
    return null;
  }
}

export default async function MediaPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const data = await getMediaPageData(username);

  if (!data) {
    notFound();
  }

  const { user, posts, pageInfo } = data;

  return (
    <MediaClient
      userId={user.id}
      initialPosts={posts}
      initialPageInfo={pageInfo}
    />
  );
}
