'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { User } from '@/graphql/types';
import Link from 'next/link';
import ProfileTabs from '@/components/profile/ProfileTabs';
import MainContainer from '@/components/layout/MainContainer';
import BackButton from '@/components/core/BackButton';
import FollowTabs from '@/components/profile/FollowTabs';
import { useAuth } from '@/hooks/useAuth';
import { useFollowUser, useUnfollowUser } from '@/hooks/useUser';
import EditProfileModal from './EditProfileModal';
import { useQuery, gql } from '@apollo/client';

const GET_USER_QUERY = gql`
  query UserByUsername($username: String!) {
    userByUsername(username: $username) {
      id
      username
      displayName
      bio
      location
      website
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

interface ProfileLayoutClientProps {
  username: string;
  children: React.ReactNode;
}

const ProfileLayoutClient: React.FC<ProfileLayoutClientProps> = ({ username, children }) => {
  const pathname = usePathname();
  const { user: currentUser } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { followUser } = useFollowUser();
  const { unfollowUser } = useUnfollowUser();

  const { data, loading, error, refetch } = useQuery(GET_USER_QUERY, {
    variables: { username },
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network', // Ensure we get updates from cache
    notifyOnNetworkStatusChange: true,
  });

  // Show loading state while fetching user data
  if (loading) {
    return (
      <MainContainer showTopBar={true}>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading profile...</div>
        </div>
      </MainContainer>
    );
  }

  // Show error state if user fetch failed
  if (error || !data?.userByUsername) {
    return (
      <MainContainer showTopBar={true}>
        <div className="flex justify-center items-center h-64">
          <div className="text-red-500">Failed to load profile</div>
        </div>
      </MainContainer>
    );
  }

  const user = data.userByUsername;
  const isFollowPage = pathname.endsWith('/followers') || pathname.endsWith('/following');
  
  // Debug log for user state
  console.log('[ProfileLayoutClient] User data:', {
    id: user.id,
    username: user.username,
    isFollowing: user.isFollowing,
    followersCount: user.followersCount
  });
  console.log('[ProfileLayoutClient] isFollowing value:', user.isFollowing);
  console.log('[ProfileLayoutClient] Button should show:', user.isFollowing ? 'Following' : 'Follow');

  const handleFollow = async () => {
    try {
      if (!user.isFollowing) {
        await followUser({ variables: { userID: user.id } });
      } else {
        await unfollowUser({ variables: { userID: user.id } });
      }
    } catch (error) {
      console.error('Follow/unfollow error:', error);
    }
  };

  if (isFollowPage) {
    return (
      <MainContainer showTopBar={false}>
        <div className="sticky top-0 z-10 bg-white bg-opacity-80 backdrop-blur border-b border-gray-200 p-4 flex items-center space-x-4">
          <BackButton />
          <div>
            <h1 className="text-xl font-bold">{user.displayName || user.username}</h1>
            <p className="text-gray-500 text-sm">@{user.username}</p>
          </div>
        </div>
        <FollowTabs username={user.username} />
        <main>{children}</main>
      </MainContainer>
    );
  }

  return (
    <MainContainer showTopBar={true}>
      {/* User Banner */}
      <div className="h-64 bg-gray-300 relative">
        {user.bannerUrl ? (
          <img 
            src={user.bannerUrl} 
            alt="Banner" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-300"></div>
        )}
        
        {/* User Avatar */}
        <div className="absolute -bottom-20 left-6">
          <div className="w-40 h-40 rounded-full border-4 border-white bg-gray-200">
            {user.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt={user.username} 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-4xl font-bold text-gray-500">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="pt-16 px-4">
        <div className="flex justify-end mb-4">
          {currentUser?.username === user.username ? (
            <>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-4 py-2 border border-gray-300 rounded-full font-bold hover:bg-gray-50"
              >
                Edit Profile
              </button>
              {isEditModalOpen && (
                <EditProfileModal user={user} onClose={() => setIsEditModalOpen(false)} />
              )}
            </>
          ) : (
            <button
              className={`px-4 py-2 rounded-full font-bold ${
                user.isFollowing
                  ? 'bg-white text-black border border-gray-300'
                  : 'bg-black text-white'
              }`}
              onClick={handleFollow}
            >
              {user.isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
        
        <div className="mb-4">
          <h1 className="text-xl font-bold">
            {user.displayName || user.username}
            {user.isVerified && (
              <span className="ml-1 text-blue-500">
                {/* Verified Icon SVG */}
              </span>
            )}
          </h1>
          <p className="text-gray-500">@{user.username}</p>
        </div>
        
        {user.bio && (
          <div className="mb-4">
            <p>{user.bio}</p>
          </div>
        )}
        
        {/* Location and Website */}
        <div className="flex flex-wrap items-center text-gray-500 text-sm mb-4 gap-4">
          {user.location && (
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{user.location}</span>
            </div>
          )}
          {user.website && (
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                {user.website}
              </a>
            </div>
          )}
        </div>
        
        <div className="flex text-gray-500 text-sm mb-4">
          <Link href={`/profile/${user.username}/following`} className="mr-4 hover:underline">
            <span className="font-bold text-black">{user.followingCount || 0}</span> Following
          </Link>
          <Link href={`/profile/${user.username}/followers`} className="hover:underline">
            <span className="font-bold text-black">{user.followersCount || 0}</span> Followers
          </Link>
        </div>
      </div>

      {/* User Tabs */}
      <ProfileTabs username={user.username} />

      {/* Render the active sub-page content */}
      <main>{children}</main>
    </MainContainer>
  );
};

export default ProfileLayoutClient;
