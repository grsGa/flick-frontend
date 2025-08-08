'use client';

import React from 'react';
import MainContainer from '@/components/layout/MainContainer';
import TweetEditor from '@/components/editor/TweetEditor';
import TweetCard from '@/components/tweet/TweetCard';
import { useHomeFeed } from '@/hooks/useTweets';
import { useCreateTweet } from '@/hooks/useTweets';
import { useLikeTweet } from '@/hooks/useTweets';

export default function Home() {
  const { tweets, loading, error } = useHomeFeed(10);
  const { createTweet } = useCreateTweet();
  const { likeTweet } = useLikeTweet();

  const handleCreateTweet = async (content: string, mediaIds?: string[]) => {
    try {
      await createTweet({
        variables: {
          input: {
            content,
            mediaIds,
          },
        },
      });
    } catch (err) {
      console.error('Failed to create tweet:', err);
    }
  };

  const handleLikeTweet = async (tweetId: string) => {
    try {
      await likeTweet({
        variables: {
          input: {
            tweetId,
          },
        },
      });
    } catch (err) {
      console.error('Failed to like tweet:', err);
    }
  };

  return (
    <MainContainer showTopBar={true} topBarTitle="首页">
      <TweetEditor onSubmit={handleCreateTweet} />
      {loading && (
        <div className="p-4 text-center">
          加载中...
        </div>
      )}
      {error && (
        <div className="p-4 text-center text-red-500">
          加载失败: {error.message}
        </div>
      )}
      {tweets.map((tweet: any) => (
        <TweetCard
          key={tweet.id}
          tweet={tweet}
          onLike={() => handleLikeTweet(tweet.id)}
        />
      ))}
    </MainContainer>
  );
}