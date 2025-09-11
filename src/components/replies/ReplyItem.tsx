import React, { useState } from 'react';
import { Post } from '../../graphql/types';
import UniversalReplyComposer from '../shared/UniversalReplyComposer';
import { Button } from '../ui/button';
import { AdaptiveTooltip } from '../ui/AdaptiveTooltip';
import { useAuth } from '../../hooks/useAuth';
import { useDeleteReply } from '../../hooks/useReplies';
import Avatar from '../core/Avatar';
import { 
  Heart, 
  MessageCircle, 
  Repeat2, 
  Share, 
  MoreHorizontal,
  Trash2,
  Reply as ReplyIcon
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ReplyItemProps {
  reply: Post;
  nestedReplies?: Post[];
  maxNestingLevel?: number;
  currentLevel?: number;
  className?: string;
  activeReplyId?: string | null;
  onToggleReply?: (replyId: string) => void;
  onReplyCreated?: () => void;
}

export function ReplyItem({ 
  reply, 
  nestedReplies = [], 
  maxNestingLevel = 3, 
  currentLevel = 1,
  className = "",
  activeReplyId,
  onToggleReply,
  onReplyCreated
}: ReplyItemProps) {
  const [showNestedReplies, setShowNestedReplies] = useState(true);
  const { user } = useAuth();
  const [deleteReply] = useDeleteReply();

  const isOwner = user?.id === reply.author.id;
  const canNest = currentLevel < maxNestingLevel;
  const hasNestedReplies = nestedReplies.length > 0;

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this reply?')) {
      try {
        await deleteReply({ variables: { replyId: reply.id } });
      } catch (error) {
        console.error('Failed to delete reply:', error);
      }
    }
  };

  const showReplyInput = activeReplyId === reply.id;

  // Calculate indentation based on nesting level
  const indentationClass = currentLevel > 1 ? `ml-${Math.min(currentLevel - 1, 4) * 4}` : '';

  return (
    <div className={`${className} ${indentationClass}`}>
      <div className="flex gap-3 group">
        {/* Avatar */}
        <Avatar
          src={reply.author.avatarUrl}
          alt={reply.author.username}
          size="md"
          className="flex-shrink-0"
        />

        {/* Reply content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900">
              {reply.author.displayName || reply.author.username}
            </span>
            <span className="text-gray-500">@{reply.author.username}</span>
            {reply.author.isVerified && (
              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
            <span className="text-gray-500 text-sm">
              {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
            </span>
            
            {/* Reply level indicator */}
            {reply.replyLevel > 1 && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                L{reply.replyLevel}
              </span>
            )}
          </div>

          {/* Replying to context */}
          {reply.parentPost && (
            <div className="text-gray-500 text-sm mb-2">
              Replying to @{reply.parentPost.author.username}
            </div>
          )}

          {/* Content */}
          <div className="text-gray-900 mb-3 whitespace-pre-wrap">
            {reply.content}
          </div>

          {/* Media */}
          {reply.media && reply.media.length > 0 && (
            <div className="mb-3 grid grid-cols-2 gap-2 max-w-md">
              {reply.media.map((media) => (
                <div key={media.id} className="rounded-lg overflow-hidden">
                  <img
                    src={media.variants?.small?.url || media.url}
                    alt=""
                    className="w-full h-auto object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 text-gray-500">
            <AdaptiveTooltip content="Reply">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleReply?.(reply.id)}
                className="hover:text-blue-500 hover:bg-blue-50"
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                {/* Show count for level 1 replies, show "Reply" text for level 2+ */}
                {reply.replyLevel === 1 ? (reply.interaction?.replyCount || 0) : 'Reply'}
              </Button>
            </AdaptiveTooltip>

            <AdaptiveTooltip content={reply.interaction?.isLiked ? 'Unlike' : 'Like'}>
              <Button
                variant="ghost"
                size="sm"
                className="hover:text-red-500 hover:bg-red-50"
              >
                <Heart className={`w-4 h-4 mr-1 ${reply.interaction?.isLiked ? 'fill-current' : ''}`} />
                {reply.interaction?.likeCount || 0}
              </Button>
            </AdaptiveTooltip>

            {/* More options */}
            {isOwner && (
              <AdaptiveTooltip content="Delete">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AdaptiveTooltip>
            )}
          </div>

          {/* Reply input */}
          {showReplyInput && canNest && (
            <div className="mt-3 pt-3">
              <UniversalReplyComposer
                postId={reply.id}
                placeholder={`回复 @${reply.author.username}...`}
                onReplySuccess={onReplyCreated}
              />
            </div>
          )}

          {/* Nested replies */}
          {hasNestedReplies && canNest && (
            <div className="mt-4 space-y-3">
              {showNestedReplies && (
                <>
                  {nestedReplies.map(nestedReply => (
                    <ReplyItem
                      key={nestedReply.id}
                      reply={nestedReply}
                      nestedReplies={[]} // No further nesting for now
                      maxNestingLevel={maxNestingLevel}
                      currentLevel={currentLevel + 1}
                      activeReplyId={activeReplyId}
                      onToggleReply={onToggleReply}
                      onReplyCreated={onReplyCreated}
                    />
                  ))}
                </>
              )}
              
              {nestedReplies.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNestedReplies(!showNestedReplies)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  {showNestedReplies ? 'Hide' : 'Show'} {nestedReplies.length} replies
                </Button>
              )}
            </div>
          )}

          {/* Max nesting reached indicator */}
          {!canNest && hasNestedReplies && (
            <div className="mt-3 text-sm text-gray-500">
              <Button
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                View {nestedReplies.length} more replies
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReplyItem;
