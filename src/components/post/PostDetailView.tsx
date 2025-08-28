'use client';

import { useState, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Avatar from '@/components/core/Avatar';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import MediaGrid from '@/components/media/MediaGrid';
import PostInteractionButtons from '@/components/post/PostInteractionButtons';
import { ReplyList } from '@/components/replies/ReplyList';
import UnifiedReplyComposer from '@/components/post/UnifiedReplyComposer';
import { Post } from '@/graphql/types';

interface PostDetailViewProps {
  post: Post;
}

export default function PostDetailView({ post }: PostDetailViewProps) {
  const router = useRouter();
  const [showReplyComposer, setShowReplyComposer] = useState(false);
  const replyComposerRef = useRef<HTMLDivElement>(null);

  const handleBack = () => {
    router.back();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { 
      addSuffix: true, 
      locale: zhCN 
    });
  };

  const formatFullTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleReplyClick = () => {
    replyComposerRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'center'
    });
    // 可以添加聚焦到输入框的逻辑
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="flex items-center px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="mr-4 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">帖子</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full">
        <Card className="bg-white border-gray-200 rounded-none border-x-0 border-t-0 shadow-none">
          <div className="p-4">
            {/* Author Info */}
            <div className="flex items-start space-x-3 mb-4">
              <Link href={`/profile/${post.author.username}`}>
                <Avatar 
                  src={post.author.avatarUrl || undefined}
                  alt={post.author.displayName || post.author.username}
                  size="lg"
                  className="hover:opacity-80 transition-opacity"
                />
              </Link>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <Link 
                    href={`/profile/${post.author.username}`}
                    className="hover:underline"
                  >
                    <span className="font-bold text-gray-900">
                      {post.author.displayName || post.author.username}
                    </span>
                  </Link>
                </div>
                <Link 
                  href={`/profile/${post.author.username}`}
                  className="text-gray-500 hover:underline"
                >
                  @{post.author.username}
                </Link>
              </div>
            </div>

            {/* Post Content */}
            <div className="mb-4">
              <p className="text-gray-900 text-lg leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>
            </div>

            {/* Media */}
            {post.media && post.media.length > 0 && (
              <div className="mb-4">
                <MediaGrid 
                  media={post.media} 
                  className="rounded-2xl overflow-hidden"
                  post={post}
                />
              </div>
            )}

            {/* Poll */}
            {post.poll && (
              <div className="mb-4 p-4 border border-gray-200 rounded-2xl">
                <h3 className="font-semibold mb-3 text-gray-900">{post.poll.question}</h3>
                <div className="space-y-2">
                  {post.poll.options.map((option) => (
                    <div
                      key={option.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <span className="text-gray-900">{option.text}</span>
                      <span className="text-gray-500">{option.voteCount} 票</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-sm text-gray-500">
                  {post.poll.isExpired ? '投票已结束' : `${formatTime(post.poll.expiresAt)} 结束`}
                </div>
              </div>
            )}

            {/* Timestamp and View Count */}
            <div className="flex items-center justify-between text-gray-500 text-sm mb-4">
              <span>{formatFullTime(post.createdAt)}</span>
              <span className="font-bold">{post.interaction.viewCount.toLocaleString()} Views</span>
            </div>


            {/* Actions */}
            <PostInteractionButtons 
              post={post}
              layout="horizontal"
              showCounts={true}
              onReply={handleReplyClick}
              onLike={() => console.log('Like clicked')}
              onRepost={() => console.log('Repost clicked')}
              onBookmark={() => console.log('Bookmark clicked')}
              onShare={() => {
                if (navigator.share) {
                  navigator.share({
                    title: `${post.author.displayName || post.author.username}的帖子`,
                    text: post.content,
                    url: `${window.location.origin}/status/${post.id}`
                  });
                } else {
                  navigator.clipboard.writeText(`${window.location.origin}/status/${post.id}`);
                }
              }}
            />
          </div>
        </Card>

        {/* Reply Composer */}
        <div ref={replyComposerRef} className="p-4">
          <UnifiedReplyComposer 
            postId={post.id}
            onReplySuccess={() => {
              // 回复成功后可以刷新回复列表
              console.log('Reply created successfully');
            }}
            placeholder="发布你的回复"
          />
        </div>

        {/* Replies */}
        <div>
          <ReplyList 
            postId={post.id}
            maxNestingLevel={3}
            showReplyInput={false}
            className="p-4"
          />
        </div>
      </div>
    </div>
  );
}
