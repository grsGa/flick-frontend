import React from 'react';
import { Interaction } from '@/graphql/types';
import { formatNumber } from '@/lib/utils';

interface PostActionsProps {
  interaction: Interaction;
  onLike?: () => void;
  onComment?: () => void;
  onRepost?: () => void;
  onBookmark?: () => void;
}

const PostActions: React.FC<PostActionsProps> = ({
  interaction,
  onLike,
  onComment,
  onRepost,
  onBookmark,
}) => {
  return (
    <div className="flex justify-between max-w-md">
      {/* Comment */}
      <button 
        onClick={onComment}
        className="flex items-center text-gray-500 hover:text-blue-500 group"
      >
        <div className="p-2 rounded-full group-hover:bg-blue-100">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        {interaction.commentCount > 0 && (
          <span className="ml-1 text-sm">{formatNumber(interaction.commentCount)}</span>
        )}
      </button>

      {/* Repost */}
      <button 
        onClick={onRepost}
        className={`flex items-center group ${
          interaction.isReposted ? 'text-green-500' : 'text-gray-500 hover:text-green-500'
        }`}
      >
        <div className="p-2 rounded-full group-hover:bg-green-100">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        {interaction.repostCount > 0 && (
          <span className="ml-1 text-sm">{formatNumber(interaction.repostCount)}</span>
        )}
      </button>

      {/* Like */}
      <button 
        onClick={onLike}
        className={`flex items-center group ${
          interaction.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
        }`}
      >
        <div className="p-2 rounded-full group-hover:bg-red-100">
          {interaction.isLiked ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.638h-.014C9.403 21.59 1.95 14.856 1.95 8.478c0-3.064 2.525-5.754 5.403-5.754 2.29 0 3.83 1.58 4.646 2.73.814-1.148 2.354-2.73 4.645-2.73 2.88 0 5.404 2.69 5.404 5.755 0 6.376-7.454 13.11-10.037 13.157H12z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          )}
        </div>
        {interaction.likeCount > 0 && (
          <span className="ml-1 text-sm">{formatNumber(interaction.likeCount)}</span>
        )}
      </button>

      {/* Bookmark */}
      <button 
        onClick={onBookmark}
        className={`flex items-center group ${
          interaction.isBookmarked ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'
        }`}
      >
        <div className="p-2 rounded-full group-hover:bg-blue-100">
          {interaction.isBookmarked ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 2h14a1 1 0 011 1v19.143a.5.5 0 01-.757.429L12 18.03l-7.243 4.543A.5.5 0 014 22.143V3a1 1 0 011-1z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          )}
        </div>
      </button>
    </div>
  );
};

export default PostActions;