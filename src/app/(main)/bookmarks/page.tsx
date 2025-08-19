'use client';

import React from 'react';
import MainContainer from '@/components/layout/MainContainer';
import PostCard from '@/components/post/PostCard';

export default function Bookmarks() {
  // 模拟书签数据
  const bookmarkedPosts = [
    {
      id: '1',
      content: '这是一个被收藏的帖子示例',
      author: {
        id: '1',
        username: 'user1',
        displayName: '用户1',
        avatarUrl: '',
        isVerified: true,
      },
      createdAt: '2023-01-01T00:00:00Z',
      media: [],
      interaction: {
        isLiked: true,
        isBookmarked: true,
        isReposted: false,
        likeCount: 120,
        commentCount: 42,
        repostCount: 15,
      },
    },
  ];

  return (
    <MainContainer showTopBar={true} topBarTitle="书签">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold">书签</h1>
        <p className="text-gray-500 text-sm">只有你能看到这些书签</p>
      </div>
      
      {bookmarkedPosts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onBookmark={(postId) => console.log('Toggle bookmark for post:', postId)}
        />
      ))}
      
      {bookmarkedPosts.length === 0 && (
        <div className="p-8 text-center">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">保存你想要稍后查看的帖子</h2>
          <p className="text-gray-500">
            点击帖子上的书签图标，就可以在这里轻松找到它。
          </p>
        </div>
      )}
    </MainContainer>
  );
}