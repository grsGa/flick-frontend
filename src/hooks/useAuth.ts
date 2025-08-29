"use client";

import React, { useState, useEffect, useCallback, useMemo, createContext, useContext } from "react";
import { useRouter } from "next/navigation";

// 定义用户接口
interface User {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

// 定义认证上下文类型
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (updatedUser: Partial<User>) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// 创建认证上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider 组件属性类型
interface AuthProviderProps {
  children: React.ReactNode;
}

// AuthProvider 组件
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Sync user info from GraphQL when available
  const syncUserInfo = useCallback(async (currentUser: User) => {
    if (typeof window !== "undefined" && token) {
      try {
        // Fetch latest user info from GraphQL
        const response = await fetch('http://localhost:8080/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            query: `
              query UserByUsername($username: String!) {
                userByUsername(username: $username) {
                  id
                  username
                  displayName
                  avatarUrl
                }
              }
            `,
            variables: { username: currentUser.username }
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.data?.userByUsername) {
            const latestUser = data.data.userByUsername;
            const updatedUser = {
              ...currentUser,
              displayName: latestUser.displayName,
              avatarUrl: latestUser.avatarUrl
            };
            
            // Only update if there are actual changes
            if (JSON.stringify(updatedUser) !== JSON.stringify(currentUser)) {
              setUser(updatedUser);
              localStorage.setItem("user", JSON.stringify(updatedUser));
            }
          }
        }
      } catch (error) {
        console.error('Failed to sync user info:', error);
      }
    }
  }, [token]);

  // 从 localStorage 加载初始状态
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (storedToken && storedUser) {
          setToken(storedToken);
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser && typeof parsedUser.id === "string" && typeof parsedUser.username === "string") {
            setUser(parsedUser);
            // Sync user info on app load to ensure latest data
            setTimeout(() => syncUserInfo(parsedUser), 500);
          } else {
            throw new Error("Invalid user data in localStorage");
          }
        }
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [syncUserInfo]);

  // 登录方法
  const login = useCallback((token: string, user: User) => {
    setToken(token);
    setUser(user);
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
    }
    
    // Sync user info after login to ensure consistency
    setTimeout(() => syncUserInfo(user), 1000);
  }, [syncUserInfo]);

  // 更新用户信息方法
  const updateUser = useCallback((updatedUser: Partial<User>) => {
    setUser(currentUser => {
      if (currentUser) {
        const newUser = { ...currentUser, ...updatedUser };
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(newUser));
        }
        return newUser;
      }
      return currentUser;
    });
  }, []);

  // 登出方法
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    router.push("/login");
  }, [router]);

  // 计算认证状态
  const isAuthenticated = !!token;

  // 提供上下文值
  const contextValue: AuthContextType = useMemo(() => ({
    user,
    token,
    login,
    logout,
    updateUser,
    isAuthenticated,
    isLoading
  }), [user, token, login, logout, updateUser, isAuthenticated, isLoading]);

  // 使用 React.createElement 替代 JSX 语法
  return React.createElement(
    AuthContext.Provider,
    { value: contextValue },
    children
  );
}

// useAuth hook
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
}
