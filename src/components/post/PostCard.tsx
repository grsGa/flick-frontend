import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Post, User } from '@/graphql/types';
import Avatar from '@/components/core/Avatar';
import VersionedAvatar from '@/components/avatar/VersionedAvatar';
import UserName from '@/components/core/UserName';
import TimeAgo from '@/components/core/TimeAgo';
import OptimizedMediaGrid from '@/components/media/OptimizedMediaGrid';
import PostInteractionButtons from '@/components/post/PostInteractionButtons';
import PostMoreButton from '@/components/post/PostMoreButton';

interface PostCardProps {
  post: Post;
  currentUser?: User;
  onLike?: (postId: string) => void;
  onBookmark?: (postId: string) => void;
  onRepost?: (postId: string) => void;
  onReply?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onEdit?: (postId: string) => void;
  onPin?: (postId: string) => void;
  onUnpin?: (postId: string) => void;
  onChangeReplyPermission?: (postId: string, permission: 'EVERYONE' | 'FOLLOWING' | 'MENTIONED_ONLY') => void;
  onFollow?: (userId: string) => void;
  onUnfollow?: (userId: string) => void;
  onMute?: (userId: string) => void;
  onBlock?: (userId: string) => void;
  onReport?: (postId: string) => void;
  onNotInterested?: (postId: string) => void;
  isFollowing?: boolean;
  isPinned?: boolean;
  className?: string;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUser,
  onLike,
  onBookmark,
  onRepost,
  onReply,
  onDelete,
  onEdit,
  onPin,
  onUnpin,
  onChangeReplyPermission,
  onFollow,
  onUnfollow,
  onMute,
  onBlock,
  onReport,
  onNotInterested,
  isFollowing = false,
  isPinned = false,
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
          <VersionedAvatar
            userId={post.author.id}
            src={post.author.avatarUrl}
            alt={post.author.displayName || post.author.username}
            size="md"
            onClick={handleUserClick}
          />
        </div>

        {/* Post content */}
        <div className="flex-grow">
          {/* User info and timestamp */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <UserName 
                user={post.author} 
                verified={post.author.isVerified}
                onClick={handleUserClick}
              />
              <span className="mx-1 text-gray-500">·</span>
              <TimeAgo date={post.createdAt} />
            </div>
            
            {/* More button */}
            <div onClick={handleActionClick}>
              <PostMoreButton
                post={post}
                currentUser={currentUser}
                onDelete={() => onDelete?.(post.id)}
                onEdit={() => onEdit?.(post.id)}
                onPin={() => onPin?.(post.id)}
                onUnpin={() => onUnpin?.(post.id)}
                onChangeReplyPermission={(permission) => onChangeReplyPermission?.(post.id, permission)}
                onFollow={() => onFollow?.(post.author.id)}
                onUnfollow={() => onUnfollow?.(post.author.id)}
                onMute={() => onMute?.(post.author.id)}
                onBlock={() => onBlock?.(post.author.id)}
                onReport={() => onReport?.(post.id)}
                onNotInterested={() => onNotInterested?.(post.id)}
                isFollowing={isFollowing}
                isPinned={isPinned}
              />
            </div>
          </div>

          {/* Post text */}
          <div className="mt-1 mb-2">
            <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
          </div>

          {/* Media */}
          {post.media && post.media.length > 0 && (
            <div className="mb-2" onClick={handleActionClick}>
              <OptimizedMediaGrid 
                media={post.media} 
                priority="medium"
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
