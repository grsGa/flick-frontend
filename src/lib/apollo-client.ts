"use client";

import { ApolloClient, InMemoryCache, from, NormalizedCacheObject, HttpLink, ApolloLink } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { setContext } from '@apollo/client/link/context';
import { useState } from 'react';
import { GRAPHQL_API_URL } from './utils';
import { getAuthToken, clearAuth } from './auth';

let apolloClient: ApolloClient<NormalizedCacheObject> | null = null;

// 创建Apollo客户端
export function createApolloClient() {
  // 创建自定义fetch函数，添加超时
  const timeoutFetch = (uri: RequestInfo | URL, options: RequestInit) => {
    const TIMEOUT_MS = 10000; // 10秒超时
    
    const controller = new AbortController();
    const signal = controller.signal;
    
    // 添加信号到请求选项
    const optionsWithSignal = {
      ...options,
      signal
    };
    
    // 创建超时Promise
    const timeoutPromise = new Promise<Response>((_, reject) => {
      setTimeout(() => {
        controller.abort();
        reject(new Error('请求超时，请稍后再试'));
      }, TIMEOUT_MS);
    });
    
    // 创建fetch Promise
    const fetchPromise = fetch(uri, optionsWithSignal);
    
    // 返回竞争的Promise
    return Promise.race([fetchPromise, timeoutPromise]);
  };
  
  // 创建HttpLink
  const httpLink = new HttpLink({
    uri: GRAPHQL_API_URL,
    credentials: 'include',
    fetch: timeoutFetch as typeof fetch,
    fetchOptions: {
      mode: 'cors',
      method: 'POST',
      cache: 'no-cache',
      credentials: 'include',
    },
    headers: {
      'Apollo-Require-Preflight': 'true',
      'Accept': 'application/json',
    },
    useGETForQueries: false,
  });

  // 请求中间件 - 调试请求
  const requestMiddleware = new ApolloLink((operation, forward) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('GraphQL请求:', {
        operation: operation.operationName,
        variables: operation.variables,
      });
    }
    return forward(operation);
  });

  // 认证中间件 - 添加令牌
  const authLink = setContext((_, { headers }) => {
    // 获取令牌
    const token = getAuthToken();
    
    // 如果有token，设置Authorization头
    if (token) {
      return {
        headers: {
          ...headers,
          authorization: `Bearer ${token}`,
        }
      };
    }
    
    return { headers };
  });

  // 错误处理中间件
  const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      for (const { message, locations, path } of graphQLErrors) {
        console.error(
          `[GraphQL错误]: 消息: ${message}, 位置: ${locations}, 路径: ${path}`
        );
        
        // 处理认证错误
        if (message.includes('认证失败') || message.includes('令牌已过期') || message.includes('unauthorized')) {
          if (typeof window !== 'undefined') {
            console.error('认证失败，清除认证状态');
            clearAuth();
            // 重定向到登录页
            window.location.href = '/login';
          }
        }
      }
    }

    if (networkError) {
      console.error(`[网络错误]: ${networkError}`);
    }
  });

  // 创建Apollo Client实例
  return new ApolloClient({
    link: from([
      errorLink,
      requestMiddleware,
      authLink,
      httpLink
    ]),
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            posts: {
              keyArgs: ['filter'],
              merge(existing, incoming, { args }) {
                if (!existing) return incoming;
                
                // 处理加载更多的情况
                if (args?.page?.page && args.page.page > 1) {
                  return {
                    ...incoming,
                    posts: [...existing.posts, ...incoming.posts],
                  };
                }
                
                // 首次加载或刷新
                return incoming;
              },
            },
            feed: {
              keyArgs: false,
              merge(existing, incoming, { args }) {
                if (!existing) return incoming;
                
                // 处理加载更多的情况
                if (args?.page?.page && args.page.page > 1) {
                  return {
                    ...incoming,
                    posts: [...existing.posts, ...incoming.posts],
                  };
                }
                
                // 首次加载或刷新
                return incoming;
              },
            },
            userPosts: {
              keyArgs: ['userId', 'username'],
              merge(existing, incoming, { args }) {
                if (!existing) return incoming;
                
                // 处理加载更多的情况
                if (args?.page?.page && args.page.page > 1) {
                  return {
                    ...incoming,
                    posts: [...existing.posts, ...incoming.posts],
                  };
                }
                
                // 首次加载或刷新
                return incoming;
              },
            },
            comments: {
              keyArgs: ['postId'],
              merge(existing, incoming, { args }) {
                if (!existing) return incoming;
                
                // 处理加载更多的情况
                if (args?.page?.page && args.page.page > 1) {
                  return {
                    ...incoming,
                    comments: [...existing.comments, ...incoming.comments],
                  };
                }
                
                // 首次加载或刷新
                return incoming;
              },
            },
          },
        },
      },
    }),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'network-only',
        errorPolicy: 'all',
        notifyOnNetworkStatusChange: true,
      },
      query: {
        fetchPolicy: 'network-only',
        errorPolicy: 'all',
      },
      mutate: {
        errorPolicy: 'all',
      },
    },
    connectToDevTools: process.env.NODE_ENV !== 'production',
  });
}

// 初始化Apollo客户端
export function initializeApollo(initialState: NormalizedCacheObject | null = null) {
  const _apolloClient = apolloClient ?? createApolloClient();

  // 如果有初始状态，则恢复缓存
  if (initialState) {
    const existingCache = _apolloClient.cache.extract();
    _apolloClient.cache.restore({ ...existingCache, ...initialState });
  }

  // 对SSG和SSR始终创建新客户端
  if (typeof window === 'undefined') return _apolloClient;

  // 在客户端创建Apollo客户端
  if (!apolloClient) apolloClient = _apolloClient;

  return _apolloClient;
}

// React Hook用于使用Apollo客户端
export function useApollo(initialState: NormalizedCacheObject | null = null) {
  const [client] = useState(() => initializeApollo(initialState));
  return client;
} 