'use client';

import { ThemeProvider } from './theme-provider';
import { ApolloProvider } from './apollo-provider';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/lib/auth-context';
import { LoadingProvider } from '@/lib/loading-context';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { useLoading } from '@/lib/loading-context';
import { PostDialogProvider } from './post-dialog-provider';
import { useEffect } from 'react';
import { cleanupExpiredInteractions } from '@/lib/utils';

interface ProvidersProps {
  children: React.ReactNode;
}

// 包含加载动画的组件
const LoadingWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoading } = useLoading();
  
  // 在组件挂载时清理过期的交互状态
  useEffect(() => {
    // 初始清理
    cleanupExpiredInteractions();
    
    // 设置定期清理，每天清理一次
    const cleanupInterval = setInterval(() => {
      cleanupExpiredInteractions();
    }, 24 * 60 * 60 * 1000); // 24小时
    
    return () => {
      clearInterval(cleanupInterval);
    };
  }, []);
  
  return (
    <>
      <LoadingScreen isLoading={isLoading} />
      {children}
    </>
  );
};

/**
 * 应用提供者组合组件
 * 
 * 将所有全局提供者组件组合在一起，包装整个应用
 * 包括：主题提供者、Apollo客户端提供者、认证提供者和Toast通知
 */
export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <ThemeProvider>
      <LoadingProvider>
        <ApolloProvider>
          <AuthProvider>
            <PostDialogProvider>
              <LoadingWrapper>
                {children}
              </LoadingWrapper>
            </PostDialogProvider>
          </AuthProvider>
        </ApolloProvider>
        <Toaster />
      </LoadingProvider>
    </ThemeProvider>
  );
}; 