"use client";

import React, { useEffect } from 'react';
import { ApolloProvider } from '@apollo/client';
import { createApolloClient } from '@/lib/apollo-client';
import { ThemeProvider } from './theme-provider';
import { AuthProvider } from '@/lib/auth-context';
import { TokenPassthroughProvider } from '@/lib/token-passthrough';
import { LoadingProvider } from '@/lib/loading-context';

interface ProvidersProps {
  children: React.ReactNode;
}

// 创建Apollo客户端
const client = createApolloClient();

export function Providers({ children }: ProvidersProps) {
  // 在开发环境中加载认证测试工具
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      import('../auth-test').catch(err => 
        console.error('加载认证测试工具失败:', err)
      );
      console.log('🔑 开发环境: 认证测试工具已加载');
      console.log('可用测试命令:');
      console.log('- window.testLoginFlow(username, password)');
      console.log('- window.testTokenStorage()');
      console.log('- window.testTokenRefresh()');
      console.log('- window.displayAuthDebugInfo()');
      console.log('- window.clearAuthAndReload()');
    }
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ApolloProvider client={client}>
        <TokenPassthroughProvider client={client}>
          <AuthProvider>
            <LoadingProvider>
              {children}
            </LoadingProvider>
          </AuthProvider>
        </TokenPassthroughProvider>
      </ApolloProvider>
    </ThemeProvider>
  );
}

export default Providers; 