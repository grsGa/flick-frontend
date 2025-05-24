'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ApolloLink, fromPromise } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { setContext } from '@apollo/client/link/context';
import { getAuthToken, refreshToken, clearAuth, isAuthenticated } from './auth';
import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';

// 令牌状态
interface TokenState {
  isRefreshing: boolean;
  tokenPromise: Promise<string | null> | null;
}

// 创建上下文，用于在整个组件树中管理令牌状态
const TokenPassthroughContext = createContext<{
  client: ApolloClient<NormalizedCacheObject> | null;
  isRefreshing: boolean;
}>({
  client: null,
  isRefreshing: false
});

/**
 * 创建认证链接
 * 处理令牌添加、刷新和错误处理
 */
export const createAuthLink = (
  apolloClient: ApolloClient<NormalizedCacheObject>
) => {
  // 令牌状态
  const tokenState: TokenState = {
    isRefreshing: false,
    tokenPromise: null
  };

  // 认证状态链接 - 添加令牌到请求头
  const authLink = setContext((_, { headers }) => {
    // 获取令牌
    const token = getAuthToken();
    
    // 如果有令牌，添加到请求头
    if (token) {
      return {
        headers: {
          ...headers,
          authorization: `Bearer ${token}`
        }
      };
    }
    
    return { headers };
  });

  // 错误处理链接 - 处理令牌过期等错误
  const errorLink = onError(({ graphQLErrors, operation, forward }) => {
    // 如果没有GraphQL错误，直接返回
    if (!graphQLErrors) return;
    
    // 检查是否有认证错误
    const authError = graphQLErrors.find(
      error => 
        error.message.includes('认证失败') || 
        error.message.includes('令牌已过期') || 
        error.message.includes('token expired') || 
        error.message.includes('unauthorized') ||
        error.message.includes('unauthenticated')
    );
    
    // 如果没有认证错误，直接返回
    if (!authError) return;
    
    // 如果已经在刷新令牌，等待刷新完成
    if (tokenState.isRefreshing) {
      // 等待当前刷新完成后重试请求
      return fromPromise(
        tokenState.tokenPromise!.then(newToken => {
          // 如果刷新成功，重试原始请求
          if (newToken) {
            // 更新操作上下文中的Authorization头
            const oldHeaders = operation.getContext().headers;
            operation.setContext({
              headers: {
                ...oldHeaders,
                authorization: `Bearer ${newToken}`
              }
            });
            
            // 重试请求
            return forward(operation);
          } else {
            // 如果刷新失败，清除认证信息并抛出错误
            clearAuth();
            throw authError;
          }
        })
      );
    }
    
    // 开始刷新令牌
    tokenState.isRefreshing = true;
    
    // 创建刷新令牌的Promise
    tokenState.tokenPromise = refreshToken(apolloClient)
      .then(response => {
        tokenState.isRefreshing = false;
        
        // 如果刷新成功，返回新令牌
        if (response && response.token) {
          return response.token;
        }
        
        // 如果刷新失败，清除认证信息并返回null
        clearAuth();
        return null;
      })
      .catch(() => {
        tokenState.isRefreshing = false;
        clearAuth();
        return null;
      });
    
    // 返回刷新令牌的Promise
    return fromPromise(
      tokenState.tokenPromise.then(newToken => {
        // 如果刷新成功，重试原始请求
        if (newToken) {
          // 更新操作上下文中的Authorization头
          const oldHeaders = operation.getContext().headers;
          operation.setContext({
            headers: {
              ...oldHeaders,
              authorization: `Bearer ${newToken}`
            }
          });
          
          // 重试请求
          return forward(operation);
        } else {
          // 如果刷新失败，抛出原始错误
          throw authError;
        }
      })
    );
  });

  // 组合认证链接和错误处理链接
  return ApolloLink.from([errorLink, authLink]);
};

/**
 * 令牌传递组件
 * 提供令牌状态和Apollo客户端
 */
export function TokenPassthroughProvider({
  children,
  client
}: {
  children: React.ReactNode;
  client: ApolloClient<NormalizedCacheObject>;
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // 定期检查令牌是否即将过期，如果是，刷新令牌
  useEffect(() => {
    if (!client) return;
    
    // 检查是否已认证
    if (!isAuthenticated()) return;
    
    // 创建定期刷新令牌的定时器
    const refreshInterval = setInterval(async () => {
      // 如果正在刷新，跳过
      if (isRefreshing) return;
      
      // 如果未认证，跳过
      if (!isAuthenticated()) return;
      
      try {
        // 设置刷新状态
        setIsRefreshing(true);
        
        // 刷新令牌
        await refreshToken(client);
      } catch (error) {
        console.error('令牌刷新失败:', error);
        clearAuth();
      } finally {
        // 重置刷新状态
        setIsRefreshing(false);
      }
    }, 10 * 60 * 1000); // 每10分钟检查一次
    
    // 清理函数
    return () => {
      clearInterval(refreshInterval);
    };
  }, [client, isRefreshing]);
  
  return (
    <TokenPassthroughContext.Provider value={{ client, isRefreshing }}>
      {children}
    </TokenPassthroughContext.Provider>
  );
}

/**
 * 使用令牌传递的Hook
 */
export function useTokenPassthrough() {
  return useContext(TokenPassthroughContext);
}

/**
 * withTokenPassthrough HOC
 * 用于在组件渲染时确保token在localStorage和cookie间同步
 * 解决中间件无法识别token的问题
 */
export function withTokenPassthrough<P extends object>(Component: React.ComponentType<P>) {
  return function TokenPassthroughComponent(props: P) {
    const [tokenReady, setTokenReady] = useState(false);
    
    useEffect(() => {
      // 检查并同步token
      const syncToken = () => {
        if (typeof window === 'undefined') return;
        
        // 获取localStorage中的token
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
          console.log('[TokenPassthrough] localStorage中未找到token');
          setTokenReady(true);
          return;
        }
        
        // 检查cookie是否已设置
        const hasCookieToken = document.cookie
          .split('; ')
          .some(row => row.startsWith('auth_token='));
          
        if (!hasCookieToken) {
          console.log('[TokenPassthrough] Cookie中未找到token，正在设置...');
          
          // 尝试在cookie中设置token
          document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;
          
          // 通过API再次确保设置
          fetch('/api/set-auth-cookie', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
            credentials: 'include'
          })
          .catch(err => console.error('[TokenPassthrough] 通过API设置Cookie失败:', err));
        }
        
        // 标记为准备就绪
        setTokenReady(true);
      };
      
      syncToken();
    }, []);
    
    // 可以选择显示加载组件
    if (!tokenReady) {
      return <div className="p-4 text-center">准备中...</div>;
    }
    
    return <Component {...props} />;
  };
}

/**
 * 用于检查并确保token存在的hook
 * 可以在任何需要确保token可用的组件中使用
 */
export function useEnsureToken() {
  useEffect(() => {
    // 同步token检查逻辑
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    
    const hasCookieToken = document.cookie
      .split('; ')
      .some(row => row.startsWith('auth_token='));
      
    if (!hasCookieToken) {
      console.log('[useEnsureToken] Cookie中未找到token，设置中...');
      document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;
    }
  }, []);
} 