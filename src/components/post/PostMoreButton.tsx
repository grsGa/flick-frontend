'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Post } from '@/graphql/types';
import { useAuth } from '@/hooks/useAuth';
import { AdaptiveTooltip } from '@/components/ui/AdaptiveTooltip';
import { 
  Trash2, 
  BarChart3, 
  Edit, 
  Pin, 
  PinOff, 
  Settings, 
  ChevronRight,
  UserPlus,
  UserMinus,
  VolumeX,
  UserX,
  Flag,
  EyeOff
} from 'lucide-react';

interface PostMoreButtonProps {
  post: Post;
  currentUser?: User;
  onDelete?: () => void;
  onEdit?: () => void;
  onPin?: () => void;
  onUnpin?: () => void;
  onChangeReplyPermission?: (permission: 'EVERYONE' | 'FOLLOWING' | 'MENTIONED_ONLY') => void;
  onFollow?: () => void;
  onUnfollow?: () => void;
  onMute?: () => void;
  onBlock?: () => void;
  onReport?: () => void;
  onNotInterested?: () => void;
  isFollowing?: boolean;
  isPinned?: boolean;
}

const PostMoreButton: React.FC<PostMoreButtonProps> = ({
  post,
  currentUser,
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
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showReplyPermissionMenu, setShowReplyPermissionMenu] = useState(false);
  const [editTimeLeft, setEditTimeLeft] = useState<number | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isOwnPost = currentUser?.id === post.author.id;

  // Calculate edit time remaining (15 minutes from creation)
  useEffect(() => {
    if (!isOwnPost) return;

    const postCreatedAt = new Date(post.createdAt).getTime();
    const editDeadline = postCreatedAt + (15 * 60 * 1000); // 15 minutes in milliseconds
    const now = Date.now();
    
    if (now < editDeadline) {
      const timeLeft = Math.ceil((editDeadline - now) / 1000);
      setEditTimeLeft(timeLeft);

      const interval = setInterval(() => {
        const currentTime = Date.now();
        if (currentTime >= editDeadline) {
          setEditTimeLeft(null);
          clearInterval(interval);
        } else {
          setEditTimeLeft(Math.ceil((editDeadline - currentTime) / 1000));
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [post.createdAt, isOwnPost]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowReplyPermissionMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleMenuItemClick = (action: () => void) => {
    action();
    setIsOpen(false);
    setShowReplyPermissionMenu(false);
  };

  const handleReplyPermissionSelect = (permission: 'EVERYONE' | 'FOLLOWING' | 'MENTIONED_ONLY') => {
    onChangeReplyPermission?.(permission);
    setShowReplyPermissionMenu(false);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* More button */}
      <AdaptiveTooltip content="More" disabled={isOpen}>
        <button
          ref={buttonRef}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
          </svg>
        </button>
      </AdaptiveTooltip>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border-0 py-2 z-50"
          onClick={(e) => e.stopPropagation()}
        >
          {isOwnPost ? (
            // Own post menu items
            <>
              <button
                onClick={() => handleMenuItemClick(onDelete!)}
                className="w-full px-4 py-3 text-left hover:bg-gray-100 text-gray-900 font-bold transition-colors flex items-center gap-3"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm font-bold">Delete</span>
              </button>

              <button
                onClick={() => handleMenuItemClick(onInsights!)}
                className="w-full px-4 py-3 text-left hover:bg-gray-100 text-gray-900 font-bold transition-colors flex items-center gap-3"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm font-bold">View post insights</span>
              </button>

              <button
                onClick={() => handleMenuItemClick(onEdit!)}
                className="w-full px-4 py-3 text-left hover:bg-gray-100 text-gray-900 font-bold transition-colors flex items-center gap-3"
                disabled={!canEdit}
              >
                <Edit className="w-4 h-4" />
                <div className="flex flex-col">
                  <span className="text-sm font-bold">Edit post</span>
                  {canEdit && editTimeLeft && (
                    <span className="text-xs text-gray-500 font-normal">
                      {Math.floor(editTimeLeft / 60)}:{(editTimeLeft % 60).toString().padStart(2, '0')} left
                    </span>
                  )}
                </div>
              </button>

              <button
                onClick={() => handleMenuItemClick(isPinned ? onUnpin! : onPin!)}
                className="w-full px-4 py-3 text-left hover:bg-gray-100 text-gray-900 font-bold transition-colors flex items-center gap-3"
              >
                {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                <span className="text-sm font-bold">{isPinned ? 'Unpin from profile' : 'Pin to profile'}</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowReplyPermissionMenu(!showReplyPermissionMenu)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-100 text-gray-900 font-bold flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-4 h-4" />
                    <span className="text-sm font-bold">Change who can reply</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Reply permission submenu */}
                {showReplyPermissionMenu && (
                  <div className="absolute left-full top-0 ml-2 w-52 bg-white rounded-xl shadow-2xl py-2">
                    <button
                      onClick={() => handleReplyPermissionSelect('EVERYONE')}
                      className="w-full px-4 py-3 text-left hover:bg-gray-100 text-gray-900 font-bold transition-colors"
                    >
                      <span className="text-sm font-bold">Everyone</span>
                    </button>
                    <button
                      onClick={() => handleReplyPermissionSelect('FOLLOWING')}
                      className="w-full px-4 py-3 text-left hover:bg-gray-100 text-gray-900 font-bold transition-colors"
                    >
                      <span className="text-sm font-bold">Accounts you follow</span>
                    </button>
                    <button
                      onClick={() => handleReplyPermissionSelect('MENTIONED_ONLY')}
                      className="w-full px-4 py-3 text-left hover:bg-gray-100 text-gray-900 font-bold transition-colors"
                    >
                      <span className="text-sm font-bold">Only you</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            // Other user's post menu items
            <>
              <button
                onClick={() => handleMenuItemClick(onNotInterested!)}
                className="w-full px-4 py-3 text-left hover:bg-gray-100 text-gray-900 font-bold transition-colors flex items-center gap-3"
              >
                <EyeOff className="w-4 h-4" />
                <span className="text-sm font-bold">Not interested in this post</span>
              </button>

              <button
                onClick={() => handleMenuItemClick(isFollowing ? onUnfollow! : onFollow!)}
                className="w-full px-4 py-3 text-left hover:bg-gray-100 text-gray-900 font-bold transition-colors flex items-center gap-3"
              >
                {isFollowing ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                <span className="text-sm font-bold">{isFollowing ? `Unfollow @${post.author.username}` : `Follow @${post.author.username}`}</span>
              </button>

              <button
                onClick={() => handleMenuItemClick(onMute!)}
                className="w-full px-4 py-3 text-left hover:bg-gray-100 text-gray-900 font-bold transition-colors flex items-center gap-3"
              >
                <VolumeX className="w-4 h-4" />
                <span className="text-sm font-bold">Mute</span>
              </button>

              <button
                onClick={() => handleMenuItemClick(onBlock!)}
                className="w-full px-4 py-3 text-left hover:bg-gray-100 text-gray-900 font-bold transition-colors flex items-center gap-3"
              >
                <UserX className="w-4 h-4" />
                <span className="text-sm font-bold">Block @{post.author.username}</span>
              </button>

              <button
                onClick={() => handleMenuItemClick(onReport!)}
                className="w-full px-4 py-3 text-left hover:bg-gray-100 text-gray-900 font-bold transition-colors flex items-center gap-3"
              >
                <Flag className="w-4 h-4" />
                <span className="text-sm font-bold">Report post</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PostMoreButton;
