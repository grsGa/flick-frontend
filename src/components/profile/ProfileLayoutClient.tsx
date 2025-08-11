'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { User } from '@/graphql/types';
import Link from 'next/link';
import ProfileTabs from '@/components/profile/ProfileTabs';
import MainContainer from '@/components/layout/MainContainer';
import BackButton from '@/components/core/BackButton';
import FollowTabs from '@/components/profile/FollowTabs';
import { useAuth } from '@/hooks/useAuth';
import { useFollowUser, useUnfollowUser } from '@/hooks/useUser';

interface ProfileLayoutClientProps {
  user: User;
  children: React.ReactNode;
}

const ProfileLayoutClient: React.FC<ProfileLayoutClientProps> = ({ user, children }) => {
  const pathname = usePathname();
  const { user: currentUser } = useAuth();
  const { followUser } = useFollowUser();
  const { unfollowUser } = useUnfollowUser();
  const isFollowPage = pathname.endsWith('/followers') || pathname.endsWith('/following');

  const handleFollow = async () => {
    if (user.isFollowing) {
      await unfollowUser({ variables: { userId: user.id } });
    } else {
      await followUser({ variables: { userId: user.id } });
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
          {currentUser?.id === user.id ? (
            <button className="px-4 py-2 border border-gray-300 rounded-full font-bold hover:bg-gray-50">
              Edit Profile
            </button>
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
