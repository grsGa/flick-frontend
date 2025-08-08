import React from 'react';
import TopBar from '@/components/layout/TopBar';

interface MainContainerProps {
  children: React.ReactNode;
  showTopBar?: boolean;
  topBarTitle?: string;
}

const MainContainer: React.FC<MainContainerProps> = ({ 
  children, 
  showTopBar = true,
  topBarTitle 
}) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* 顶部导航栏 */}
      {showTopBar && <TopBar title={topBarTitle} />}
      
      {/* 主要内容区域 */}
      <div className="flex-grow">
        {children}
      </div>
      
      {/* 底部空间占位符（在小屏幕上可能显示底部导航） */}
      <div className="h-16 md:hidden"></div>
    </div>
  );
};

export default MainContainer;