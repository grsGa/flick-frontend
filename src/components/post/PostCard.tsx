import React from 'react';
import { Post } from '@/graphql/types';
import Avatar from '@/components/core/Avatar';
import UserName from '@/components/core/UserName';
import TimeAgo from '@/components/core/TimeAgo';
import MediaGrid from '@/components/media/MediaGrid';
import PostActions from '@/components/post/PostActions';

interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  onBookmark?: (postId: string) => void;
  onRepost?: (postId: string) => void;
  onComment?: (postId: string) => void;
  className?: string;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  onLike,
  onBookmark,
  onRepost,
  onComment,
  className = '',
}) => {
  const handleUserClick = () => {
    // Navigate to user profile
    window.location.href = `/profile/${post.author.username}`;
  };

  return (
    <div className={`p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors ${className}`}>
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
          {post.media.length > 0 && (
            <div className="mb-2">
              <MediaGrid 
                media={post.media} 
                priority="medium" 
                optimized={true}
                post={post}
                onLike={() => onLike?.(post.id)}
                onComment={() => onComment?.(post.id)}
                onRepost={() => onRepost?.(post.id)}
                onShare={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: `${post.author.displayName || post.author.username}的帖子`,
                      text: post.content,
                      url: window.location.href
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                  }
                }}
              />
            </div>
          )}

          {/* Post actions */}
          <div className="mt-2">
            <PostActions
              interaction={post.interaction}
              onLike={() => onLike?.(post.id)}
              onBookmark={() => onBookmark?.(post.id)}
              onRepost={() => onRepost?.(post.id)}
              onComment={() => onComment?.(post.id)}
              onView={() => {
                // View action - could track views here
                console.log('View clicked for post:', post.id);
              }}
              onShare={() => {
                if (navigator.share) {
                  navigator.share({
                    title: `${post.author.displayName || post.author.username}的帖子`,
                    text: post.content,
                    url: window.location.href
                  });
                } else {
                  navigator.clipboard.writeText(window.location.href);
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
