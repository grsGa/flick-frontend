'use client';

import React from 'react';
import MainContainer from '@/components/layout/MainContainer';
import { useNotifications } from '@/hooks/useNotifications';

export default function Notifications() {
  const { notifications, loading, error } = useNotifications(10);

  return (
    <MainContainer showTopBar={true} topBarTitle="通知">
      <div className="border-b border-gray-200">
        <div className="flex">
          <button className="flex-1 py-4 font-bold text-center border-b-2 border-black">
            全部
          </button>
          <button className="flex-1 py-4 text-gray-500 text-center">
            已提及
          </button>
        </div>
      </div>
      
      {loading && (
        <div className="p-4 text-center">
          加载中...
        </div>
      )}
      
      {error && (
        <div className="p-4 text-center text-red-500">
          加载失败: {error.message}
        </div>
      )}
      
      {notifications.map((notification: any) => (
        <div key={notification.id} className="p-4 border-b border-gray-200 hover:bg-gray-50">
          <div className="flex">
            <div className="flex-shrink-0 mr-3">
              <div className="w-10 h-10 rounded-full bg-gray-200"></div>
            </div>
            <div className="flex-grow">
              <div className="flex items-center">
                <span className="font-bold">{notification.actor.displayName || notification.actor.username}</span>
                <span className="mx-1 text-gray-500">·</span>
                <span className="text-gray-500 text-sm">刚刚</span>
              </div>
              <div className="mt-1">
                {notification.type === 'LIKE' && '点赞了你的动态'}
                {notification.type === 'COMMENT' && '评论了你的动态'}
                {notification.type === 'FOLLOW' && '关注了你'}
                {notification.type === 'REPOST' && '转发了你的动态'}
                {notification.type === 'BOOKMARK' && '收藏了你的动态'}
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {notifications.length === 0 && !loading && (
        <div className="p-8 text-center text-gray-500">
          暂无通知
        </div>
      )}
    </MainContainer>
  );
}