"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
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
  isAuthenticated: boolean;
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
  const router = useRouter();

  // 从 localStorage 加载初始状态
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken && storedUser) {
        setToken(storedToken);
        try {
          const parsedUser = JSON.parse(storedUser);
          // 验证用户对象的基本结构
          if (parsedUser && typeof parsedUser.id === "string" && typeof parsedUser.username === "string") {
            setUser(parsedUser);
          } else {
            throw new Error("Invalid user data in localStorage");
          }
        } catch (e) {
          console.error("Failed to parse user from localStorage", e);
          localStorage.removeItem("user");
        }
      }
    }
  }, []);

  // 登录方法
  const login = (token: string, user: User) => {
    setToken(token);
    setUser(user);
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
    }
  };

  // 登出方法
  const logout = () => {
    setToken(null);
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    router.push("/login");
  };

  // 计算认证状态
  const isAuthenticated = !!token;

  // 提供上下文值
  const contextValue: AuthContextType = {
    user,
    token,
    login,
    logout,
    isAuthenticated
  };

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