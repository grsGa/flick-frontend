"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/core/Avatar';
import { useAuth } from '@/hooks/useAuth';

interface TopBarProps {
  title?: string;
}

const TopBar: React.FC<TopBarProps> = ({ title }) => {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <div className="sticky top-0 z-10 bg-white bg-opacity-80 backdrop-blur border-b border-gray-200">
      <div className="flex items-center justify-between p-4">
        {/* 返回按钮和标题 */}
        <div className="flex items-center">
          <button 
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-100 mr-4"
            aria-label="返回"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          
          {title && (
            <h1 className="text-xl font-bold">{title}</h1>
          )}
        </div>
        
        {/* 用户头像 */}
        {user && (
          <div 
            onClick={() => router.push(`/profile/${user.username}`)}
            className="cursor-pointer"
          >
            <Avatar 
              src={user.avatarUrl} 
              alt={user.username} 
              size="sm" 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TopBar;
