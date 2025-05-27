import { ApolloClient, NormalizedCacheObject, gql } from '@apollo/client';
import type { User, AuthResponse } from '@/graphql/types';
import { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, setSecureCookie, removeCookie, getCookieValue, syncAuthStorages } from './auth-utils';
import { jwtDecode } from "jwt-decode";
import { createApolloClient } from './apollo-client';

// 状态管理变量
let _currentUser: User | null = null;
let _isInitialized = false;

// 认证相关的函数
export type { User, AuthResponse };

/**
 * JWT令牌解码后的数据结构
 */
interface JWTPayload {
  sub: string;
  exp: number;
  iat: number;
  username: string;
  roles: string[];
  [key: string]: unknown;
}

/**
 * 登录查询
 */
export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
      expiresAt
      user {
        id
        username
        email
        displayName
        avatarUrl
        coverImageUrl
        bio
        createdAt
        updatedAt
        followersCount
        followingCount
        postsCount
        isVerified
        roles
      }
    }
  }
`;

/**
 * 注册查询
 */
export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      refreshToken
      expiresAt
      user {
        id
        username
        email
        displayName
        avatarUrl
        coverImageUrl
        bio
        createdAt
        updatedAt
        followersCount
        followingCount
        postsCount
        isVerified
        roles
      }
    }
  }
`;

/**
 * 刷新令牌查询
 */
export const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      accessToken
      refreshToken
      expiresAt
      user {
        id
        username
        email
        displayName
        avatarUrl
        coverImageUrl
        bio
        createdAt
        updatedAt
        followersCount
        followingCount
        postsCount
        isVerified
        roles
      }
    }
  }
`;

/**
 * 初始化认证系统
 */
export const initAuth = (): void => {
  if (_isInitialized) return;
  
  try {
    // 首先同步本地存储和Cookie中的认证信息
    syncAuthStorages();
    
    // 获取用户信息
    const storedUser = getUserFromLocalStorage();
    if (storedUser) {
      _currentUser = storedUser;
    }
    
    _isInitialized = true;
    console.log('认证系统已初始化');
  } catch (error) {
    console.error('初始化认证系统时出错:', error);
    clearAuthData();
  }
};

/**
 * 用户登录
 */
export const login = async (
  usernameOrEmail: string,
  password: string,
  rememberMe = false
): Promise<AuthResponse> => {
  try {
    // 创建Apollo客户端
    const apolloClient = createApolloClient();
    
    const { data } = await apolloClient.mutate({
      mutation: LOGIN_MUTATION,
      variables: {
        input: {
          usernameOrEmail,
          password,
          rememberMe
        }
      }
    });
    
    if (!data || !data.login) {
      throw new Error('登录失败: 无响应数据');
    }
    
    const authResponse: AuthResponse = data.login;
    
    // 保存认证数据
    await saveAuthData(authResponse);
    
    return authResponse;
  } catch (error) {
    console.error('登录时出错:', error);
    clearAuthData();
    throw error;
  }
};

/**
 * 用户注册 - 直接使用创建的Apollo客户端版本
 */
export const register = async (
  email: string,
  username: string,
  password: string
): Promise<AuthResponse> => {
  // 创建Apollo客户端
  const apolloClient = createApolloClient();
  return registerWithClient(apolloClient, email, username, password);
};

/**
 * 用户注册 - 使用传入的Apollo客户端版本
 */
export const registerWithClient = async (
  apolloClient: ApolloClient<NormalizedCacheObject>,
  email: string,
  username: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const { data } = await apolloClient.mutate({
      mutation: REGISTER_MUTATION,
      variables: {
        input: {
          email,
          username,
          password
        }
      }
    });
    
    if (!data || !data.register) {
      throw new Error('注册失败: 无响应数据');
    }
    
    const authResponse: AuthResponse = data.register;
    
    // 保存认证数据
    await saveAuthData(authResponse);
    
    return authResponse;
  } catch (error) {
    console.error('注册时出错:', error);
    clearAuthData();
    throw error;
  }
};

/**
 * 刷新认证令牌
 */
export const refreshToken = async (
  apolloClient: ApolloClient<NormalizedCacheObject>
): Promise<AuthResponse | null> => {
  const currentRefreshToken = getRefreshToken();
  
  if (!currentRefreshToken) {
    console.error('无法刷新令牌: 未找到刷新令牌');
    return null;
  }
  
  try {
    const { data } = await apolloClient.mutate({
      mutation: REFRESH_TOKEN_MUTATION,
      variables: {
        refreshToken: currentRefreshToken
      }
    });
    
    if (!data || !data.refreshToken) {
      throw new Error('刷新令牌失败: 无响应数据');
    }
    
    const authResponse: AuthResponse = data.refreshToken;
    
    // 保存新的认证数据
    saveAuthData(authResponse);
    
    return authResponse;
  } catch (error) {
    console.error('刷新令牌时出错:', error);
    // 刷新令牌失败，清除认证数据
    clearAuthData();
    return null;
  }
};

/**
 * 保存认证数据
 */
const saveAuthData = async (authResponse: AuthResponse): Promise<void> => {
  const { accessToken, refreshToken, user } = authResponse;
  
  console.log('开始保存认证数据...');
  
  // 保存令牌到localStorage
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    
    // 保存用户信息
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    console.warn('无法访问localStorage，可能在服务器端运行');
  }
  
  // 使用API端点设置Cookie，确保中间件能够访问
  if (typeof fetch !== 'undefined') {
    try {
      console.log('通过API设置认证Cookie...');
      const response = await fetch('/api/set-auth-cookie', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessToken }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('设置认证Cookie失败:', errorData);
      } else {
        console.log('认证Cookie设置成功');
      }
    } catch (error) {
      console.error('调用set-auth-cookie API出错:', error);
    }
  }
  
  // 同时设置普通Cookie作为备份
  setSecureCookie(AUTH_TOKEN_KEY, accessToken, {
    maxAge: 60 * 60 * 24 * 7, // 7天
    sameSite: 'Lax'
  });
  
  setSecureCookie(REFRESH_TOKEN_KEY, refreshToken, {
    maxAge: 60 * 60 * 24 * 30, // 30天
    sameSite: 'Lax'
  });
  
  // 更新内存中的用户对象
  _currentUser = user;
  
  console.log('认证数据已保存');
};

/**
 * 清除认证数据
 */
export const clearAuthData = (): void => {
  // 移除localStorage中的数据
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem('user');
  
  // 移除Cookie中的数据
  removeCookie(AUTH_TOKEN_KEY);
  removeCookie(REFRESH_TOKEN_KEY);
  
  // 重置内存中的用户对象
  _currentUser = null;
};

/**
 * 登出用户
 */
export const logout = (): void => {
  clearAuthData();
  _currentUser = null;
};

/**
 * 更新本地用户信息
 */
export const updateUserInLocalStorage = (userData: Partial<User>): void => {
  if (!_currentUser) return;
  
  // 更新用户对象
  _currentUser = { ..._currentUser, ...userData };
  
  // 保存到localStorage
  localStorage.setItem('user', JSON.stringify(_currentUser));
  
  console.log('用户信息已更新');
};

/**
 * 从localStorage获取用户信息
 */
const getUserFromLocalStorage = (): User | null => {
  if (!localStorage) return null;
  
  try {
    const userJson = localStorage.getItem('user');
    if (!userJson) return null;
    
    const user = JSON.parse(userJson) as User;
    return user;
  } catch (error) {
    console.error('从localStorage获取用户信息时出错:', error);
    return null;
  }
};

/**
 * 从localStorage或Cookie获取认证令牌
 */
export const getAuthToken = (): string | null => {
  // 首先尝试从localStorage获取
  let token = typeof localStorage !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
  
  // 如果localStorage中没有，尝试从Cookie获取
  if (!token) {
    token = getCookieValue(AUTH_TOKEN_KEY);
  }
  
  return token;
};

/**
 * 从localStorage或Cookie获取刷新令牌
 */
export const getRefreshToken = (): string | null => {
  // 首先尝试从localStorage获取
  let token = typeof localStorage !== 'undefined' ? localStorage.getItem(REFRESH_TOKEN_KEY) : null;
  
  // 如果localStorage中没有，尝试从Cookie获取
  if (!token) {
    token = getCookieValue(REFRESH_TOKEN_KEY);
  }
  
  return token;
};

/**
 * 获取当前用户
 */
export const getCurrentUser = (): User | null => {
  return _currentUser || getUserFromLocalStorage();
};

/**
 * 获取用户信息
 * @deprecated 使用getCurrentUser替代
 */
export const getUser = (): User | null => {
  return getCurrentUser();
};

/**
 * 检查用户是否已认证
 */
export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  
  if (!token) return false;
  
  try {
    // 解析JWT令牌
    const decoded = jwtDecode<JWTPayload>(token);
    
    // 检查令牌是否过期
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      console.log('令牌已过期');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('验证令牌时出错:', error);
    return false;
  }
};

/**
 * 清除认证状态
 */
export const clearAuth = logout;

/**
 * 获取访问令牌
 */
export const getAccessToken = (): string | null => {
  return getAuthToken();
};

/**
 * 获取认证请求头
 */
export const getAuthHeaders = async (includeContentType = false): Promise<Record<string, string>> => {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  
  return headers;
};

/**
 * 检查令牌是否即将过期（在5分钟内过期）
 */
export const isTokenExpiringSoon = (): boolean => {
  const token = getAuthToken();
  if (!token) return true;
  
  try {
    const decoded = jwtDecode<JWTPayload>(token);
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded.exp - now;
    
    // 如果令牌在5分钟内过期，返回true
    return timeUntilExpiry < 300;
  } catch (error) {
    console.error('解析令牌时出错:', error);
    return true;
  }
};

/**
 * 检查令牌是否已过期
 */
export const isTokenExpired = (): boolean => {
  const token = getAuthToken();
  if (!token) return true;
  
  try {
    const decoded = jwtDecode<JWTPayload>(token);
    const now = Math.floor(Date.now() / 1000);
    
    return decoded.exp <= now;
  } catch (error) {
    console.error('解析令牌时出错:', error);
    return true;
  }
}; 