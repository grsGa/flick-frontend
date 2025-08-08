'use client';

import React from 'react';
import MainContainer from '@/components/layout/MainContainer';
import { useConversations } from '@/hooks/useMessages';

export default function Messages() {
  const { conversations, loading, error } = useConversations();

  return (
    <MainContainer showTopBar={true} topBarTitle="私信">
      <div className="p-4 border-b border-gray-200">
        <button className="w-full bg-blue-500 text-white py-2 rounded-full font-bold">
          新私信
        </button>
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
      
      <div className="divide-y divide-gray-200">
        {conversations.map((conversation: any) => (
          <div key={conversation.id} className="p-4 hover:bg-gray-50 cursor-pointer">
            <div className="flex">
              <div className="flex-shrink-0 mr-3">
                <div className="w-12 h-12 rounded-full bg-gray-200"></div>
              </div>
              <div className="flex-grow">
                <div className="flex justify-between">
                  <div className="font-bold">
                    {conversation.participants[0]?.displayName || conversation.participants[0]?.username}
                  </div>
                  <div className="text-gray-500 text-sm">
                    {conversation.lastMessage?.createdAt ? '刚刚' : ''}
                  </div>
                </div>
                <div className="text-gray-500 text-sm truncate">
                  {conversation.lastMessage?.content || '开始对话'}
                </div>
              </div>
              {conversation.unreadCount > 0 && (
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
                  {conversation.unreadCount}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {conversations.length === 0 && !loading && (
        <div className="p-8 text-center text-gray-500">
          暂无私信
        </div>
      )}
    </MainContainer>
  );
}