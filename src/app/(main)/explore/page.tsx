'use client';

import React, { useState } from 'react';
import MainContainer from '@/components/layout/MainContainer';
import PostCard from '@/components/post/PostCard';

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // 在实际应用中，这里会执行搜索逻辑
    console.log('Searching for:', searchQuery);
  };

  // 模拟数据
  const trendingTopics = [
    { id: 1, name: '技术', postCount: '10.2万' },
    { id: 2, name: '设计', postCount: '8.5万' },
    { id: 3, name: '开发', postCount: '15.7万' },
  ];

  return (
    <MainContainer showTopBar={true} topBarTitle="探索">
      <div className="p-4 border-b border-gray-200">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索"
            className="w-full p-3 pl-10 bg-gray-100 rounded-full outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
          <div className="absolute left-3 top-3 text-gray-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </form>
      </div>

      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">趋势</h2>
        <div className="space-y-4">
          {trendingTopics.map((topic) => (
            <div key={topic.id} className="hover:bg-gray-50 p-2 rounded cursor-pointer">
              <div className="text-gray-500 text-sm">趋势</div>
              <div className="font-bold">#{topic.name}</div>
              <div className="text-gray-500 text-sm">{topic.postCount} posts</div>
            </div>
          ))}
        </div>
      </div>
    </MainContainer>
  );
}