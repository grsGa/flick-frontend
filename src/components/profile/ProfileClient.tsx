'use client';

import React from 'react';
import MainContainer from '@/components/layout/MainContainer';
import TweetCard from '@/components/tweet/TweetCard';
import { useUserTweets } from '@/hooks/useTweets';
import { User } from '@/graphql/types';

export default function ProfileClient({ user }: { user: User }) {
  const { tweets, loading: tweetsLoading, error: tweetsError } = useUserTweets(user.username, 10);

  return (
    <MainContainer showTopBar={true}>
      {/* User Banner */}
      <div className="h-48 bg-gray-300 relative">
        {user?.bannerUrl ? (
          <img 
            src={user.bannerUrl} 
            alt="Banner" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-400 to-purple-500"></div>
        )}
        
        {/* User Avatar */}
        <div className="absolute -bottom-16 left-4">
          <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200">
            {user?.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt={user.username} 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-4xl font-bold text-gray-500">
                  {user?.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="pt-16 px-4">
        <div className="flex justify-end mb-4">
          <button className="px-4 py-2 border border-gray-300 rounded-full font-bold hover:bg-gray-50">
            Edit Profile
          </button>
        </div>
        
        <div className="mb-4">
          <h1 className="text-xl font-bold">
            {user?.displayName || user?.username}
            {user?.isVerified && (
              <span className="ml-1 text-blue-500">
                <svg className="w-5 h-5 inline" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
                </svg>
              </span>
            )}
          </h1>
          <p className="text-gray-500">@{user?.username}</p>
        </div>
        
        {user?.bio && (
          <div className="mb-4">
            <p>{user.bio}</p>
          </div>
        )}
        
        <div className="flex text-gray-500 text-sm mb-4">
          <span className="mr-4">
            <span className="font-bold text-black">{user?.followingCount || 0}</span> Following
          </span>
          <span>
            <span className="font-bold text-black">{user?.followersCount || 0}</span> Followers
          </span>
        </div>
      </div>

      {/* User Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button className="flex-1 py-4 font-bold text-center border-b-2 border-black">
            Tweets
          </button>
          <button className="flex-1 py-4 text-gray-500 text-center">
            Replies
          </button>
          <button className="flex-1 py-4 text-gray-500 text-center">
            Media
          </button>
          <button className="flex-1 py-4 text-gray-500 text-center">
            Likes
          </button>
        </div>
      </div>

      {/* User Tweets */}
      <div>
        {tweetsLoading && (
          <div className="p-4 text-center">
            Loading tweets...
          </div>
        )}
        
        {tweetsError && (
          <div className="p-4 text-center text-red-500">
            Failed to load tweets: {tweetsError.message}
          </div>
        )}
        
        {tweets.map((tweet: any) => (
          <TweetCard key={tweet.id} tweet={tweet} />
        ))}
        
        {tweets.length === 0 && !tweetsLoading && (
          <div className="p-8 text-center text-gray-500">
            No tweets yet
          </div>
        )}
      </div>
    </MainContainer>
  );
}
