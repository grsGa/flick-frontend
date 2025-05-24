"use client";

import { useAuth } from './auth-context';
import { useState } from 'react';
import { ApolloClient, NormalizedCacheObject, useApolloClient } from '@apollo/client';
import { 
  login as loginApi, 
  register as registerApi, 
  clearAuth, 
  getUser, 
  updateUserInLocalStorage, 
  refreshToken,
  User
} from './auth';

// 直接导出useAuth以避免重复定义
export { useAuth };

// 辅助函数，检查是否已登录
export const useIsLoggedIn = () => {
  const auth = useAuth();
  return auth.isAuthenticated;
};

// 获取当前用户
export const useCurrentUser = () => {
  const auth = useAuth();
  return auth.user;
};

// 获取登录、注册和登出方法
export const useAuthActions = () => {
  const auth = useAuth();
  return { 
    login: auth.login, 
    logout: auth.logout 
  };
};

// 获取认证状态
export const useAuthStatus = () => {
  const auth = useAuth();
  return { 
    isLoading: auth.loading, 
    error: null, 
    isInitialized: true 
  };
};

// 刷新认证的hook
export const useRefreshAuth = () => {
  const client = useApolloClient() as ApolloClient<NormalizedCacheObject>;
  return async () => {
    return await refreshToken(client);
  };
};

// 更新用户信息的hook
export const useUpdateUser = () => {
  const updateUserData = (userData: Partial<User>) => {
    updateUserInLocalStorage(userData);
  };
  
  return updateUserData;
};

export const useApolloAuth = () => {
  const client = useApolloClient() as ApolloClient<NormalizedCacheObject>;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getUser());

  // 登录
  const login = async (usernameOrEmail: string, password: string, rememberMe?: boolean) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await loginApi(client, usernameOrEmail, password, rememberMe);
      setIsAuthenticated(true);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : '登录失败';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 注册
  const register = async (email: string, username: string, password: string, displayName?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await registerApi(client, email, username, password, displayName);
      setIsAuthenticated(true);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : '注册失败';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 注销
  const logout = () => {
    clearAuth();
    setIsAuthenticated(false);
    // 可选：重置Apollo客户端缓存
    client.resetStore();
  };

  // 更新用户资料
  const updateUser = (userData: Partial<User>) => {
    updateUserInLocalStorage(userData);
  };

  return {
    login,
    register,
    logout,
    updateUser,
    isAuthenticated,
    isLoading,
    error,
    user: getUser(),
    client
  };
}; 