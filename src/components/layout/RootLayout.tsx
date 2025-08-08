"use client";

import React from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Rightbar from '@/components/layout/Rightbar';

interface RootLayoutProps {
  children: React.ReactNode;
}

const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto max-w-7xl">
        <div className="flex">
          {/* 左侧边栏 - 在小屏幕上隐藏，在中等屏幕上显示 */}
          <div className="hidden md:block md:w-20 lg:w-64 flex-shrink-0">
            <Sidebar />
          </div>
          
          {/* 主内容区域 */}
          <main className="flex-grow border-x border-gray-200 min-h-screen">
            {children}
          </main>
          
          {/* 右侧边栏 - 在小屏幕和中等屏幕上隐藏，在大屏幕上显示 */}
          <div className="hidden lg:block lg:w-80 flex-shrink-0">
            <Rightbar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RootLayout;
