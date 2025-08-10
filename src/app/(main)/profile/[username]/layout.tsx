import React from 'react';
import { notFound } from 'next/navigation';
import client from '@/lib/apollo-client';
import { gql } from '@apollo/client';
import { User } from '@/graphql/types';
import ProfileLayoutClient from '@/components/profile/ProfileLayoutClient';

const GET_USER_QUERY = gql`
  query UserByUsername($username: String!) {
    userByUsername(username: $username) {
      id
      username
      displayName
      bio
      avatarUrl
      bannerUrl
      followersCount
      followingCount
      isFollowing
      isVerified
      createdAt
    }
  }
`;

async function getUser(username: string): Promise<User | null> {
  try {
    const { data } = await client.query({
      query: GET_USER_QUERY,
      variables: { username },
    });
    return data.userByUsername;
  } catch (error) {
    console.error('Failed to fetch user for layout:', error);
    return null;
  }
}

export default async function ProfileLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const user = await getUser(username);

  if (!user) {
    notFound();
  }

  return <ProfileLayoutClient user={user}>{children}</ProfileLayoutClient>;
}
