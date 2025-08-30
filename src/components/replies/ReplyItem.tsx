import React, { useState } from 'react';
import { Post } from '../../graphql/types';
import UniversalReplyComposer from '../shared/UniversalReplyComposer';
import { Button } from '../ui/button';
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleReply?.(reply.id)}
              className="hover:text-blue-500 hover:bg-blue-50"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {reply.interaction?.replyCount || 0}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="hover:text-green-500 hover:bg-green-50"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {reply.interaction?.repostCount || 0}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="hover:text-red-500 hover:bg-red-50"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {reply.interaction?.likeCount || 0}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="hover:text-gray-700 hover:bg-gray-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </Button>

            {/* More options */}
            {isOwner && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
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
