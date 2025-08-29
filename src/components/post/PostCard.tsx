import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Post } from '@/graphql/types';
import Avatar from '@/components/core/Avatar';
import UserName from '@/components/core/UserName';
import TimeAgo from '@/components/core/TimeAgo';
import MediaGrid from '@/components/media/MediaGrid';
import PostInteractionButtons from '@/components/post/PostInteractionButtons';

interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  onBookmark?: (postId: string) => void;
  onRepost?: (postId: string) => void;
  onReply?: (postId: string) => void;
  className?: string;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  onLike,
  onBookmark,
  onRepost,
  onReply,
  className = '',
}) => {
  const router = useRouter();

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/profile/${post.author.username}`);
  };

  const handlePostClick = () => {
    router.push(`/status/${post.id}`);
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      className={`p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer ${className}`}
      onClick={handlePostClick}
    >
      <div className="flex">
        {/* User avatar */}
        <div className="flex-shrink-0 mr-3">
          <Avatar
            src={post.author.avatarUrl}
            alt={post.author.displayName || post.author.username}
            size="md"
            onClick={handleUserClick}
          />
        </div>

        {/* Post content */}
        <div className="flex-grow">
          {/* User info and timestamp */}
          <div className="flex items-center">
            <UserName 
              user={post.author} 
              verified={post.author.isVerified}
              onClick={handleUserClick}
            />
            <span className="mx-1 text-gray-500">·</span>
            <TimeAgo date={post.createdAt} />
          </div>

          {/* Post text */}
          <div className="mt-1 mb-2">
            <p className="text-gray-900">{post.content}</p>
          </div>

          {/* Media */}
          {post.media && post.media.length > 0 && (
            <div className="mb-2" onClick={handleActionClick}>
              <MediaGrid 
                media={post.media} 
                priority="medium" 
                optimized={true}
                post={post}
                onLike={() => onLike?.(post.id)}
                onReply={() => onReply?.(post.id)}
                onRepost={() => onRepost?.(post.id)}
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
          )}

          {/* Post actions */}
          <div className="mt-2" onClick={handleActionClick}>
            <PostInteractionButtons
              post={post}
              layout="horizontal"
              showCounts={true}
              onLike={() => onLike?.(post.id)}
              onBookmark={() => onBookmark?.(post.id)}
              onRepost={() => onRepost?.(post.id)}
              onReply={() => onReply?.(post.id)}
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
        </div>
      </div>
    </div>
  );
};

export default PostCard;
