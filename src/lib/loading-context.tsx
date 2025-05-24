'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface LoadingContextProps {
  /**
   * 当前加载状态
   */
  isLoading: boolean;
  
  /**
   * 手动触发页面刷新加载
   */
  startLoading: () => void;
  
  /**
   * 完成加载
   */
  finishLoading: () => void;
}

const LoadingContext = createContext<LoadingContextProps | undefined>(undefined);

interface LoadingProviderProps {
  children: ReactNode;
}

/**
 * 全局加载状态提供者
 */
export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true); // 初始状态为加载中
  
  // 完成初始加载
  useEffect(() => {
    // 页面加载完成后延迟一点时间再结束加载动画
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // 处理页面刷新
  useEffect(() => {
    const handleBeforeUnload = () => {
      setIsLoading(true);
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  
  // 手动开始加载
  const startLoading = useCallback(() => {
    setIsLoading(true);
  }, []);
  
  // 结束加载
  const finishLoading = useCallback(() => {
    setIsLoading(false);
  }, []);
  
  const value = {
    isLoading,
    startLoading,
    finishLoading
  };
  
  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

/**
 * 使用加载状态的Hook
 */
export const useLoading = (): LoadingContextProps => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading必须在LoadingProvider内部使用');
  }
  return context;
}; 