'use client';

import React from 'react';
import { Post } from '@/graphql/types';

interface PostInteractionButtonsProps {
  post: Post;
  onLike?: () => void;
  onReply?: () => void;
  onRepost?: () => void;
  onBookmark?: () => void;
  onShare?: () => void;
  layout?: 'horizontal' | 'vertical';
  showCounts?: boolean;
}

const PostInteractionButtons: React.FC<PostInteractionButtonsProps> = ({
  post,
  onLike,
  onReply,
  onRepost,
  onBookmark,
  onShare,
  layout = 'horizontal',
  showCounts = true,
}) => {
  const buttonClass = layout === 'horizontal' 
    ? "flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
    : "flex flex-col items-center p-3 rounded-lg hover:bg-gray-100 transition-colors";

  const iconClass = "w-5 h-5";
  const countClass = layout === 'horizontal' 
    ? "ml-2 text-xs text-gray-400" 
    : "mt-1 text-xs text-gray-400";

  return (
    <div className={layout === 'horizontal' ? "flex items-center justify-between" : "flex flex-col space-y-2"}>
      {/* Reply */}
      <button 
        onClick={onReply}
        className={`${buttonClass} text-gray-500`}
        title="Reply"
      >
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {showCounts && post.interaction.replyCount > 0 && (
          <span className={countClass}>{post.interaction.replyCount}</span>
        )}
      </button>

      {/* Repost */}
      <button 
        onClick={onRepost}
        className={`${buttonClass} ${
          post.interaction.isReposted ? 'text-green-500' : 'text-gray-500'
        }`}
        title="Repost"
      >
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {showCounts && post.interaction.repostCount > 0 && (
          <span className={countClass}>{post.interaction.repostCount}</span>
        )}
      </button>

      {/* Like */}
      <button 
        onClick={onLike}
        className={`${buttonClass} ${
          post.interaction.isLiked ? 'text-red-500' : 'text-gray-500'
        }`}
        title="Like"
      >
        {post.interaction.isLiked ? (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.638h-.014C9.403 21.59 1.95 14.856 1.95 8.478c0-3.064 2.525-5.754 5.403-5.754 2.29 0 3.83 1.58 4.646 2.73.814-1.148 2.354-2.73 4.645-2.73 2.88 0 5.404 2.69 5.404 5.755 0 6.376-7.454 13.11-10.037 13.157H12z" />
          </svg>
        ) : (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        )}
        {showCounts && post.interaction.likeCount > 0 && (
          <span className={countClass}>{post.interaction.likeCount}</span>
        )}
      </button>

      {/* Bookmark */}
      <button 
        onClick={onBookmark}
        className={`${buttonClass} ${
          post.interaction.isBookmarked ? 'text-blue-500' : 'text-gray-500'
        }`}
        title="Bookmark"
      >
        {post.interaction.isBookmarked ? (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
            <path d="M5 2h14a1 1 0 011 1v19.143a.5.5 0 01-.757.429L12 18.03l-7.243 4.543A.5.5 0 014 22.143V3a1 1 0 011-1z" />
          </svg>
        ) : (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        )}
        {showCounts && (post.interaction.bookmarkCount || 0) > 0 && (
          <span className={countClass}>{post.interaction.bookmarkCount}</span>
        )}
      </button>

      {/* Share */}
      <button 
        onClick={onShare}
        className={`${buttonClass} text-gray-500`}
        title="Share"
      >
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
        </svg>
      </button>
    </div>
  );
};

export default PostInteractionButtons;
