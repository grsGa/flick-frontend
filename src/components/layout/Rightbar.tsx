import React, { useState } from 'react';
import { useRecommendedUsers } from '@/hooks/useUser';
import UserCard from '@/components/user/UserCard';

const Rightbar: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { users: recommendedUsers, loading: usersLoading } = useRecommendedUsers(5);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // 在实际应用中，这里会执行搜索逻辑
    console.log('Searching for:', searchQuery);
  };

  return (
    <div className="sticky top-0 h-screen overflow-y-auto p-4 space-y-4">
      {/* 搜索框 */}
      <form onSubmit={handleSearch} className="sticky top-4">
        <div className="relative">
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
        </div>
      </form>

      {/* 推荐用户 */}
      <div className="bg-gray-50 rounded-2xl">
        <div className="p-4">
          <h2 className="text-xl font-bold">你可能喜欢</h2>
        </div>
        
        {usersLoading ? (
          <div className="p-4 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center space-x-3">
                <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {recommendedUsers.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        )}
        
        <div className="p-4 text-blue-500 hover:underline cursor-pointer">
          显示更多
        </div>
      </div>

      {/* 趋势话题 */}
      <div className="bg-gray-50 rounded-2xl">
        <div className="p-4">
          <h2 className="text-xl font-bold">趋势</h2>
        </div>
        
        <div className="space-y-4 p-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="hover:bg-gray-100 p-2 rounded cursor-pointer">
              <div className="text-gray-500 text-sm">趋势 {i + 1}</div>
              <div className="font-bold">话题 {i + 1}</div>
              <div className="text-gray-500 text-sm">{Math.floor(Math.random() * 10000)} posts</div>
            </div>
          ))}
        </div>
        
        <div className="p-4 text-blue-500 hover:underline cursor-pointer">
          显示更多
        </div>
      </div>

      {/* 页脚 */}
      <div className="text-gray-500 text-sm p-4">
        <div className="flex flex-wrap gap-2">
          <span className="hover:underline cursor-pointer">条款</span>
          <span className="hover:underline cursor-pointer">隐私政策</span>
          <span className="hover:underline cursor-pointer">Cookie</span>
          <span className="hover:underline cursor-pointer">更多</span>
        </div>
        <div className="mt-2">© 2025 Flick</div>
      </div>
    </div>
  );
};

export default Rightbar;