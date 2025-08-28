import React, { useState } from 'react';
import { Post } from '../../graphql/types';
import { usePostReplies } from '../../hooks/useReplies';
import { ReplyItem } from './ReplyItem';
import UnifiedReplyComposer from '../post/UnifiedReplyComposer';
import { Button } from '../ui/button';
import { Loader2, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface ReplyListProps {
  postId: string;
  maxNestingLevel?: number;
  showReplyInput?: boolean;
  className?: string;
}

export function ReplyList({ 
  postId, 
  maxNestingLevel = 3, 
  showReplyInput = true,
  className = "" 
}: ReplyListProps) {
  const [showReplies, setShowReplies] = useState(true);
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const { data, loading, error, fetchMore } = usePostReplies(postId);
  
  const replies = data?.postReplies?.edges?.map(edge => edge.node) || [];
  const hasMore = data?.postReplies?.pageInfo?.hasNextPage || false;
  const endCursor = data?.postReplies?.pageInfo?.endCursor;

  const handleLoadMore = () => {
    if (hasMore && endCursor) {
      fetchMore({
        variables: { after: endCursor },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          
          return {
            postReplies: {
              ...fetchMoreResult.postReplies,
              edges: [
                ...prev.postReplies.edges,
                ...fetchMoreResult.postReplies.edges
              ]
            }
          };
        }
      });
    }
  };

  const handleReplyCreated = () => {
    // Reply will be automatically added to cache by the mutation
    setActiveReplyId(null); // Close any open reply input
  };

  const handleToggleReply = (replyId: string) => {
    setActiveReplyId(activeReplyId === replyId ? null : replyId);
  };

  // Group replies by level for better rendering
  const topLevelReplies = replies.filter(reply => reply.replyLevel === 1);
  const nestedReplies = replies.filter(reply => reply.replyLevel > 1);

  // Create a map of parent reply ID to nested replies
  // Now that backend correctly sets parentId for level 2 replies, we can use it directly
  const nestedRepliesMap = nestedReplies.reduce((acc, reply) => {
    if (reply.parentId) {
      // Use parentId to associate nested replies with their direct parent
      if (!acc[reply.parentId]) {
        acc[reply.parentId] = [];
      }
      acc[reply.parentId].push(reply);
    }
    return acc;
  }, {} as Record<string, Post[]>);

  // Sort nested replies by creation time (oldest first - 从上到下按时间排序)
  Object.keys(nestedRepliesMap).forEach(parentId => {
    nestedRepliesMap[parentId].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  });

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
        <UnifiedReplyComposer
          postId={postId}
          onReplySuccess={handleReplyCreated}
          placeholder="发布你的回复"
          className="pt-4"
        />
      )}

      {/* Replies list */}
      {showReplies && (
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
                  maxNestingLevel={maxNestingLevel}
                  currentLevel={1}
                  activeReplyId={activeReplyId}
                  onToggleReply={handleToggleReply}
                  onReplyCreated={handleReplyCreated}
                />
              ))}
              
              {hasMore && (
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
      )}
    </div>
  );
}
