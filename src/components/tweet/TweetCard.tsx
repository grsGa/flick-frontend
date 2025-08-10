import React from 'react';
import { Tweet } from '@/graphql/types';
import Avatar from '@/components/core/Avatar';
import UserName from '@/components/core/UserName';
import TimeAgo from '@/components/core/TimeAgo';
import MediaGrid from '@/components/media/MediaGrid';
import TweetActions from '@/components/tweet/TweetActions';

interface TweetCardProps {
  tweet: Tweet;
  onLike?: (tweetId: string) => void;
  onBookmark?: (tweetId: string) => void;
  onRetweet?: (tweetId: string) => void;
  onComment?: (tweetId: string) => void;
  className?: string;
}

const TweetCard: React.FC<TweetCardProps> = ({
  tweet,
  onLike,
  onBookmark,
  onRetweet,
  onComment,
  className = '',
}) => {
  const handleUserClick = () => {
    // Navigate to user profile
    window.location.href = `/profile/${tweet.author.username}`;
  };

  return (
    <div className={`p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors ${className}`}>
      <div className="flex">
        {/* User avatar */}
        <div className="flex-shrink-0 mr-3">
          <Avatar
            src={tweet.author.avatarUrl}
            alt={tweet.author.displayName || tweet.author.username}
            size="md"
            onClick={handleUserClick}
          />
        </div>

        {/* Tweet content */}
        <div className="flex-grow">
          {/* User info and timestamp */}
          <div className="flex items-center">
            <UserName 
              user={tweet.author} 
              verified={tweet.author.isVerified}
              onClick={handleUserClick}
            />
            <span className="mx-1 text-gray-500">·</span>
            <TimeAgo date={tweet.createdAt} />
          </div>

          {/* Tweet text */}
          <div className="mt-1 mb-2">
            <p className="text-gray-900">{tweet.content}</p>
          </div>

          {/* Media */}
          {tweet.media.length > 0 && (
            <div className="mb-2">
              <MediaGrid media={tweet.media} />
            </div>
          )}

          {/* Tweet actions */}
          <div className="mt-2">
            <TweetActions
              interaction={tweet.interaction}
              onLike={() => onLike?.(tweet.id)}
              onBookmark={() => onBookmark?.(tweet.id)}
              onRetweet={() => onRetweet?.(tweet.id)}
              onComment={() => onComment?.(tweet.id)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TweetCard;
