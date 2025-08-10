import React from 'react';
import { notFound } from 'next/navigation';
import ProfileClient from '@/components/profile/ProfileClient';
import client from '@/lib/apollo-client';
import { gql } from '@apollo/client';
import { User } from '@/graphql/types';

const USER_BY_USERNAME_QUERY = gql`
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

async function getUser(username: string) {
  try {
    const { data } = await client.query({
      query: USER_BY_USERNAME_QUERY,
      variables: { username },
    });
    return data.userByUsername;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return null;
  }
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const user: User = await getUser(username);

  if (!user) {
    notFound();
  }

  return <ProfileClient user={user} />;
}
