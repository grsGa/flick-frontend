'use client';

import { useState } from 'react';
import { Send, Image, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Avatar from '@/components/core/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { toast } from '@/lib/toast';

const CREATE_REPLY_MUTATION = gql`
  mutation CreateReply($input: CreateReplyInput!) {
    createReply(input: $input) {
      id
      content
      author {
        id
        username
        displayName
        avatarUrl
        isVerified
      }
      createdAt
      interaction {
        isLiked
        isBookmarked
        isReposted
        likeCount
        replyCount
        repostCount
        viewCount
      }
    }
  }
`;

interface ReplyComposerProps {
  postId: string;
  onReplySuccess?: () => void;
  placeholder?: string;
}

export default function ReplyComposer({ 
  postId, 
  onReplySuccess,
  placeholder = "发布你的回复"
}: ReplyComposerProps) {
  const { currentUser } = useAuth();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [createReply] = useMutation(CREATE_REPLY_MUTATION, {
    onCompleted: (data) => {
      console.log('[ReplyComposer] Reply created successfully:', data.createReply);
      setContent('');
      setIsSubmitting(false);
      toast.success('回复发布成功！');
      onReplySuccess?.();
    },
    onError: (error) => {
      console.error('[ReplyComposer] Error creating reply:', error);
      setIsSubmitting(false);
      toast.error('回复发布失败，请重试');
    },
    // Refetch queries to update the replies list
    refetchQueries: ['GetPostReplies'],
  });

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;

    if (!currentUser) {
      toast.error('请先登录后再回复');
      return;
    }

    setIsSubmitting(true);

    try {
      await createReply({
        variables: {
          input: {
            content: content.trim(),
            postId,
          },
        },
      });
    } catch (error) {
      console.error('[ReplyComposer] Submit error:', error);
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!currentUser) {
    return (
      <div className="p-4 text-center text-gray-400">
        <p>请先登录后再回复</p>
      </div>
    );
  }

  return (
    <div className="flex space-x-3">
      <Avatar 
        src={currentUser.avatarUrl || undefined}
        alt={currentUser.displayName || currentUser.username}
        size="md"
      />

      <div className="flex-1 space-y-3">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-h-[100px] bg-transparent border-gray-800 text-white placeholder-gray-400 resize-none focus:border-blue-500"
          maxLength={280}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
              disabled
            >
              <Image className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
              disabled
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-3">
            <span className={`text-sm ${
              content.length > 260 ? 'text-red-400' : 
              content.length > 240 ? 'text-yellow-400' : 
              'text-gray-400'
            }`}>
              {content.length}/280
            </span>
            
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting || content.length > 280}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>发布中...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Send className="h-4 w-4" />
                  <span>回复</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
