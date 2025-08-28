import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { useCreateReply, CreateReplyInput } from '../../hooks/useReplies';
import { useAuth } from '../../hooks/useAuth';
import { Loader2, Send } from 'lucide-react';

interface ReplyInputProps {
  postId: string;
  placeholder?: string;
  onReplyCreated?: (reply: any) => void;
  className?: string;
}

export function ReplyInput({ 
  postId, 
  placeholder = "Write a reply...", 
  onReplyCreated,
  className = "" 
}: ReplyInputProps) {
  const [content, setContent] = useState('');
  const [createReply, { loading, error }] = useCreateReply();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() || !user) return;

    try {
      const input: CreateReplyInput = {
        postId,
        content: content.trim(),
      };

      const { data } = await createReply({ variables: { input } });
      
      if (data?.createReply) {
        setContent('');
        onReplyCreated?.(data.createReply);
      }
    } catch (err) {
      console.error('Failed to create reply:', err);
    }
  };

  const isDisabled = !content.trim() || loading || !user;
  const characterCount = content.length;
  const maxLength = 280;

  if (!user) {
    return (
      <div className={`p-4 bg-gray-50 rounded-lg text-center ${className}`}>
        <p className="text-gray-600">Please log in to reply</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-3 ${className}`}>
      <div className="flex gap-3">
        <img
          src={user.avatarUrl || '/default-avatar.png'}
          alt={user.username}
          className="w-10 h-10 rounded-full flex-shrink-0"
        />
        <div className="flex-1 space-y-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            className="min-h-[80px] resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            maxLength={maxLength}
            disabled={loading}
          />
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {characterCount}/{maxLength}
              {characterCount > maxLength * 0.9 && (
                <span className={characterCount > maxLength ? 'text-red-500' : 'text-orange-500'}>
                  {' '}({maxLength - characterCount} remaining)
                </span>
              )}
            </div>
            
            <Button
              type="submit"
              disabled={isDisabled}
              size="sm"
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-1" />
                  Reply
                </>
              )}
            </Button>
          </div>
          
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              Failed to post reply. Please try again.
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
