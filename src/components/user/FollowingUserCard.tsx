import React from 'react';
import { User } from '@/graphql/types';
import Avatar from '@/components/core/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { useFollowUser, useUnfollowUser } from '@/hooks/useUser';
import Link from 'next/link';

interface FollowingUserCardProps {
  user: User;
  className?: string;
}

const FollowingUserCard: React.FC<FollowingUserCardProps> = ({ 
  user, 
  className = '' 
}) => {
  const { user: currentUser } = useAuth();
  const { followUser } = useFollowUser();
  const { unfollowUser } = useUnfollowUser();

  const handleFollowClick = async (e: React.MouseEvent) => {
    e.preventDefault();
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
    <div className={`bg-white hover:bg-gray-50 transition-colors duration-200 following-card ${className}`}>
      <div className="flex items-start space-x-3 p-4 border-b border-gray-100 last:border-b-0 sm:p-4 p-3">
        {/* 用户头像 */}
        <Link href={`/profile/${user.username}`} className="flex-shrink-0">
          <Avatar 
            src={user.avatarUrl} 
            alt={user.displayName || user.username} 
            size="lg"
            className="w-12 h-12 sm:w-12 sm:h-12 w-10 h-10 avatar"
          />
        </Link>
        
        {/* 用户信息区域 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            {/* 用户名和显示名 */}
            <Link href={`/profile/${user.username}`} className="flex-1 min-w-0 pr-3">
              <div className="flex items-center space-x-1">
                <h3 className="text-base font-bold text-gray-900 hover:underline truncate sm:text-base text-sm">
                  {user.displayName || user.username}
                </h3>
                {user.isVerified && (
                  <svg className="w-4 h-4 text-blue-500 flex-shrink-0 sm:w-4 sm:h-4 w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className="text-sm text-gray-500 truncate sm:text-sm text-xs">@{user.username}</p>
              
              {/* 用户简介 */}
              {user.bio && (
                <p className="mt-1 text-sm text-gray-700 leading-relaxed sm:text-sm text-xs" 
                   style={{
                     display: '-webkit-box',
                     WebkitLineClamp: 2,
                     WebkitBoxOrient: 'vertical',
                     overflow: 'hidden'
                   }}>
                  {user.bio}
                </p>
              )}
            </Link>
            
            {/* 关注按钮 */}
            {!isCurrentUser && (
              <div className="flex-shrink-0">
                <button 
                  className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-200 min-w-[80px] follow-btn sm:px-4 sm:py-1.5 sm:text-sm px-3 py-1 text-xs sm:min-w-[80px] min-w-[70px] ${
                    user.isFollowing
                      ? 'bg-white text-black border border-gray-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 hover:shadow-sm'
                      : 'bg-black text-white hover:bg-gray-800 hover:shadow-sm'
                  }`}
                  onClick={handleFollowClick}
                >
                  {user.isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FollowingUserCard;
