import React from 'react';
import { User } from '@/graphql/types';
import Avatar from '@/components/core/Avatar';
import UserName from '@/components/core/UserName';

interface UserCardProps {
  user: User;
  className?: string;
}

const UserCard: React.FC<UserCardProps> = ({ user, className = '' }) => {
  const handleUserClick = () => {
    window.location.href = `/${user.username}`;
  };

  return (
    <div 
      className={`flex items-center justify-between ${className}`}
      onClick={handleUserClick}
    >
      <div className="flex items-center">
        <Avatar 
          src={user.avatarUrl} 
          alt={user.displayName || user.username} 
          size="md" 
        />
        
        <div className="ml-3">
          <UserName user={user} verified={user.isVerified} />
          <div className="text-gray-500 text-sm">@{user.username}</div>
        </div>
      </div>
      
      <button 
        className="px-4 py-2 bg-black text-white rounded-full text-sm font-bold hover:bg-gray-800"
        onClick={(e) => {
          e.stopPropagation();
          // 在实际应用中，这里会执行关注用户的逻辑
          console.log('Follow user:', user.id);
        }}
      >
        关注
      </button>
    </div>
  );
};

export default UserCard;