"use client";

/**
 * 认证工具函数
 * 提供更可靠的Cookie操作和认证状态同步功能
 */

// 认证相关的常量
export const AUTH_TOKEN_KEY = 'auth_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';

// 判断是否在浏览器环境
export const isBrowser = () => typeof window !== 'undefined';

/**
 * 设置安全的Cookie
 * 确保在不同环境下都能正常工作
 */
export const setSecureCookie = (name: string, value: string, options: CookieOptions = {}): void => {
  if (!isBrowser()) return;
  
  try {
    // 设置默认过期时间（7天）
    const maxAge = options.maxAge || 60 * 60 * 24 * 7;
    
    // 构建Cookie字符串
    let cookieStr = `${name}=${encodeURIComponent(value)}; path=${options.path || '/'}; max-age=${maxAge}`;
    
    // 添加可选的Cookie属性
    if (options.sameSite) {
      cookieStr += `; SameSite=${options.sameSite}`;
    } else {
      // 默认使用Lax，这是最兼容的设置
      cookieStr += `; SameSite=Lax`;
    }
    
    if (options.secure) {
      cookieStr += '; Secure';
    }

    // 不再添加HttpOnly属性，确保JavaScript可以访问Cookie
    
    // 设置Cookie
    document.cookie = cookieStr;
    
    // 日志记录
    console.log(`Cookie已设置: ${name}=${value.substring(0, 5)}... (${cookieStr.length}字符)`);
  } catch (error) {
    console.error('设置Cookie时出错:', error);
  }
};

/**
 * 从Cookie中获取值
 */
export const getCookieValue = (name: string): string | null => {
  if (!isBrowser()) return null;
  
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    // 检查这个cookie是否是我们要找的
    if (cookie.startsWith(name + '=')) {
      return decodeURIComponent(cookie.substring(name.length + 1));
    }
  }
  return null;
};

/**
 * 删除Cookie
 */
export const removeCookie = (name: string, path = '/'): void => {
  if (!isBrowser()) return;
  document.cookie = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
};

/**
 * 同步认证存储
 * 确保localStorage和cookie中的认证信息保持一致
 */
export const syncAuthStorages = (): void => {
  if (!isBrowser()) return;
  
  try {
    // 从localStorage获取token
    const localToken = localStorage.getItem(AUTH_TOKEN_KEY);
    
    // 从cookie获取token
    const cookieToken = getCookieValue(AUTH_TOKEN_KEY);
    
    // 如果localStorage有token但cookie没有，则设置cookie
    if (localToken && !cookieToken) {
      setSecureCookie(AUTH_TOKEN_KEY, localToken, {
        maxAge: 60 * 60 * 24 * 7, // 7天
        sameSite: 'Strict'
      });
      console.log('已将localStorage中的token同步到cookie');
    } 
    // 如果cookie有token但localStorage没有，则设置localStorage
    else if (cookieToken && !localToken) {
      localStorage.setItem(AUTH_TOKEN_KEY, cookieToken);
      console.log('已将cookie中的token同步到localStorage');
    }
    // 如果两者都有但不一致，则使用localStorage的值
    else if (localToken && cookieToken && localToken !== cookieToken) {
      setSecureCookie(AUTH_TOKEN_KEY, localToken, {
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'Strict'
      });
      console.log('发现token不一致，已使用localStorage中的token更新cookie');
    }
  } catch (error) {
    console.error('同步认证存储时出错:', error);
  }
};

// Cookie选项接口
export interface CookieOptions {
  path?: string;
  maxAge?: number;
  expires?: Date | string;
  sameSite?: 'Strict' | 'Lax' | 'None';
  secure?: boolean;
  httpOnly?: boolean;
} 