'use client';

import React from 'react';
import { Post } from '@/graphql/types';
import { MessageCircle, Repeat2, Heart, Bookmark, Share } from 'lucide-react';
import { AdaptiveTooltip } from '@/components/ui/AdaptiveTooltip';

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
      <AdaptiveTooltip content="Reply">
        <button 
          onClick={onReply}
          className={`${buttonClass} text-gray-500`}
        >
          <MessageCircle className={iconClass} />
          {showCounts && post.interaction.replyCount > 0 && (
            <span className={countClass}>{post.interaction.replyCount}</span>
          )}
        </button>
      </AdaptiveTooltip>

      {/* Repost */}
      <AdaptiveTooltip content={post.interaction.isReposted ? 'Undo repost' : 'Repost'}>
        <button 
          onClick={onRepost}
          className={`${buttonClass} ${
            post.interaction.isReposted ? 'text-green-500' : 'text-gray-500'
          }`}
        >
          <Repeat2 className={iconClass} />
          {showCounts && post.interaction.repostCount > 0 && (
            <span className={countClass}>{post.interaction.repostCount}</span>
          )}
        </button>
      </AdaptiveTooltip>

      {/* Like */}
      <AdaptiveTooltip content={post.interaction.isLiked ? 'Unlike' : 'Like'}>
        <button 
          onClick={onLike}
          className={`${buttonClass} ${
            post.interaction.isLiked ? 'text-red-500' : 'text-gray-500'
          }`}
        >
          <Heart className={`${iconClass} ${post.interaction.isLiked ? 'fill-current' : ''}`} />
          {showCounts && post.interaction.likeCount > 0 && (
            <span className={countClass}>{post.interaction.likeCount}</span>
          )}
        </button>
      </AdaptiveTooltip>

      {/* Bookmark */}
      <AdaptiveTooltip content={post.interaction.isBookmarked ? 'Remove bookmark' : 'Bookmark'}>
        <button 
          onClick={onBookmark}
          className={`${buttonClass} ${
            post.interaction.isBookmarked ? 'text-blue-500' : 'text-gray-500'
          }`}
        >
          <Bookmark className={`${iconClass} ${post.interaction.isBookmarked ? 'fill-current' : ''}`} />
        </button>
      </AdaptiveTooltip>

      {/* Share */}
      <AdaptiveTooltip content="Share">
        <button 
          onClick={onShare}
          className={`${buttonClass} text-gray-500`}
        >
          <Share className={iconClass} />
        </button>
      </AdaptiveTooltip>
    </div>
  );
};

export default PostInteractionButtons;
