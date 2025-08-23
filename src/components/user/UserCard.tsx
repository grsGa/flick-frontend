import React from 'react';
import { User } from '@/graphql/types';
import Avatar from '@/components/core/Avatar';
import UserName from '@/components/core/UserName';
import { useAuth } from '@/hooks/useAuth';
import { useFollowUser, useUnfollowUser } from '@/hooks/useUser';

interface UserCardProps {
  user: User;
  className?: string;
  showFollowButton?: boolean;
}

const UserCard: React.FC<UserCardProps> = ({ 
  user, 
  className = '', 
  showFollowButton = true 
}) => {
  const { user: currentUser } = useAuth();
  const { followUser } = useFollowUser();
  const { unfollowUser } = useUnfollowUser();

  const handleUserClick = () => {
    window.location.href = `/profile/${user.username}`;
  };

  const handleFollowClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!currentUser) return;
    
    try {
      if (user.isFollowing) {
        await unfollowUser({ variables: { userID: user.id } });
      } else {
        await followUser({ variables: { userID: user.id } });
      }
    } catch (error) {
      console.error('Follow/unfollow error:', error);
    }
  };

  const isCurrentUser = currentUser?.id === user.id;

  return (
    <div 
      className={`flex items-start space-x-3 p-4 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 ${className}`}
      onClick={handleUserClick}
    >
      {/* 用户头像 */}
      <Avatar 
        src={user.avatarUrl} 
        alt={user.displayName || user.username} 
        size="lg"
        className="flex-shrink-0"
      />
      
      {/* 用户信息区域 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          {/* 用户名和显示名 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1">
              <UserName 
                user={user} 
                verified={user.isVerified}
                className="text-base font-bold text-black hover:underline"
              />
            </div>
            <div className="text-gray-500 text-sm">@{user.username}</div>
          </div>
          
          {/* 关注按钮 */}
          {showFollowButton && !isCurrentUser && (
            <button 
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${
                user.isFollowing
                  ? 'bg-white text-black border border-gray-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
              onClick={handleFollowClick}
            >
              {user.isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
        
        {/* 用户简介 */}
        {user.bio && (
          <div className="mt-2 text-sm text-gray-700 leading-relaxed">
            {user.bio}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserCard;
