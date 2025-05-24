"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApolloClient, NormalizedCacheObject, useApolloClient } from '@apollo/client';
import { initAuth, isAuthenticated, login, logout, getCurrentUser, User, AuthResponse } from './auth';

// 认证上下文类型
export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (usernameOrEmail: string, password: string, rememberMe?: boolean) => Promise<AuthResponse>;
  logout: () => void;
  loading: boolean;
}

// 创建上下文，默认值为未认证状态
export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => { throw new Error('未实现'); },
  logout: () => {},
  loading: true,
});

// AuthProvider组件
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const apolloClient = useApolloClient() as ApolloClient<NormalizedCacheObject>;
  const router = useRouter();
  
  // 初始化认证状态
  useEffect(() => {
    const init = async () => {
      try {
        // 初始化认证
        initAuth();
        
        // 检查认证状态并获取用户信息
        if (isAuthenticated()) {
          const currentUser = getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error("认证初始化失败:", error);
      } finally {
        setLoading(false);
      }
    };
    
    init();
  }, []);
  
  // 登录处理函数
  const handleLogin = async (usernameOrEmail: string, password: string, rememberMe?: boolean) => {
    setLoading(true);
    try {
      const response = await login(usernameOrEmail, password, rememberMe);
      setUser(response.user);
      return response;
    } finally {
      setLoading(false);
    }
  };
  
  // 登出处理函数
  const handleLogout = () => {
    setLoading(true);
    try {
      logout();
      setUser(null);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };
  
  // 上下文值
  const contextValue: AuthContextType = {
    isAuthenticated: !!user,
    user,
    login: handleLogin,
    logout: handleLogout,
    loading,
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// 使用认证Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth必须在AuthProvider内部使用');
  }
  return context;
}

// withAuth HOC，用于保护需要认证的页面
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();
    
    useEffect(() => {
      if (!loading && !isAuthenticated) {
        router.push('/login');
      }
    }, [loading, isAuthenticated, router]);
    
    if (loading) {
      return <div>加载中...</div>;
    }
    
    if (!isAuthenticated) {
      return null;
    }
    
    return <Component {...props} />;
  };
}

// withGuest HOC，用于只允许未登录用户访问的页面（如登录、注册页）
export function withGuest<P extends object>(Component: React.ComponentType<P>) {
  return function GuestComponent(props: P) {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();
    
    useEffect(() => {
      if (!loading && isAuthenticated) {
        router.push('/home');
      }
    }, [loading, isAuthenticated, router]);
    
    if (loading) {
      return <div>加载中...</div>;
    }
    
    if (isAuthenticated) {
      return null;
    }
    
    return <Component {...props} />;
  };
} 