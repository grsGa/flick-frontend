import React, { useState, useCallback } from 'react';
import { Post } from '../../graphql/types';
import { usePostReplies } from '../../hooks/usePostReplies';
import ReplyItem from './ReplyItem';
import UniversalReplyComposer from '../shared/UniversalReplyComposer';
import { Button } from '../ui/button';
import { Loader2, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface ReplyListProps {
  postId: string;
  showReplyInput?: boolean;
  className?: string;
}

export function ReplyList({ 
  postId, 
  showReplyInput = true,
  className = "" 
}: ReplyListProps) {
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const { 
    replies, 
    loading, 
    error, 
    hasNextPage, 
    fetchMore, 
    createReply,
    topLevelReplies, 
    nestedRepliesMap 
  } = usePostReplies({ postId });
  
  const handleLoadMore = () => {
    fetchMore();
  };

  const handleReplyCreated = () => {
    // Reply will be automatically added to cache by the mutation
    setActiveReplyId(null); // Close any open reply input
  };

  const handleToggleReply = (replyId: string) => {
    setActiveReplyId(activeReplyId === replyId ? null : replyId);
  };

  // Replies are already grouped by the hook

  if (error) {
    return (
      <div className={`text-center py-4 text-red-600 ${className}`}>
        <p>Failed to load replies. Please try again.</p>
      </div>
    );
  }

  const replyCount = replies.length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Reply input */}
      {showReplyInput && (
        <UniversalReplyComposer
          postId={postId}
          onReplySuccess={handleReplyCreated}
          placeholder="发布你的回复"
          className="pt-4"
        />
      )}

      {/* Replies list */}
      <div className="space-y-3">
          {loading && replies.length === 0 ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {topLevelReplies.map(reply => (
                <ReplyItem
                  key={reply.id}
                  reply={reply}
                  nestedReplies={nestedRepliesMap[reply.id] || []}
                  maxNestingLevel={3}
                  currentLevel={1}
                  activeReplyId={activeReplyId}
                  onToggleReply={handleToggleReply}
                  onReplyCreated={handleReplyCreated}
                />
              ))}
              
              {hasNextPage && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={loading}
                    size="sm"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Load more replies
                  </Button>
                </div>
              )}
            </>
          )}
          
          {!loading && replies.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No replies yet</p>
              <p className="text-sm">Be the first to reply!</p>
            </div>
          )}
      </div>
    </div>
  );
}
