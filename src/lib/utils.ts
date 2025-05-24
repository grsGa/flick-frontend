import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// GraphQL基础URL
export const GRAPHQL_API_URL = process.env.NEXT_PUBLIC_GRAPHQL_HTTP_URL || 'http://localhost:8080/graphql';

// API基础URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// 媒体服务基础URL
export const MEDIA_BASE_URL = process.env.NEXT_PUBLIC_MEDIA_URL || 'http://localhost:9000';

// Minio文件URL修复
export function fixMinioUrl(url: string | null | undefined): string {
  return fixMediaUrl(url);
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 处理媒体URL，确保返回完整的可访问URL
 * @param url 原始URL
 * @param addCacheBuster 是否添加缓存破坏参数
 * @returns 修复后的URL
 */
export function fixMediaUrl(url: string | null | undefined, addCacheBuster = false): string {
  if (!url) {
    return '';
  }
  
  try {
    // 检查URL是否已经是完整的URL
    const isFullUrl = url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//');
    
    // 如果是完整URL，直接返回
    if (isFullUrl) {
      return addCacheBuster ? `${url}?t=${Date.now()}` : url;
    }
    
    // 处理相对路径
    const mediaBaseUrl = MEDIA_BASE_URL;
    const fullUrl = url.startsWith('/') ? `${mediaBaseUrl}${url}` : `${mediaBaseUrl}/${url}`;
    
    return addCacheBuster ? `${fullUrl}?t=${Date.now()}` : fullUrl;
  } catch (error) {
    console.error('处理媒体URL时出错:', error);
    return url; // 发生错误时返回原始URL
  }
}

/**
 * 获取图片URL，带有默认图片回退
 * @param url 原始URL
 * @param defaultImage 默认图片URL
 * @returns 完整的图片URL
 */
export function getImageUrl(url: string | null | undefined, defaultImage: string = ''): string {
  if (!url) return defaultImage;
  return fixMediaUrl(url);
}

/**
 * 格式化日期
 * @param dateString ISO日期字符串
 * @returns 格式化后的日期字符串
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

/**
 * 带调试信息的网络请求函数
 * @param url 请求URL
 * @param options 请求选项
 * @returns 响应数据
 */
export async function fetchWithDebug<T = any>(url: string, options?: RequestInit): Promise<T> {
  console.log(`[DEBUG] 请求: ${url}`, options);
  
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[DEBUG] 请求失败 (${response.status}): ${errorText}`);
      throw new Error(`请求失败 (${response.status}): ${errorText || '未知错误'}`);
    }
    
    const data = await response.json();
    console.log(`[DEBUG] 响应成功:`, data);
    return data as T;
  } catch (error) {
    console.error(`[DEBUG] 请求错误:`, error);
    throw error;
  }
}

/**
 * 生成帖子URL
 * @param username 用户名
 * @param permalinkId 永久链接ID
 * @returns 帖子URL
 */
export function getPostUrl(username: string, permalinkId: string): string {
  return `/${username}/status/${permalinkId}`;
}

/**
 * 将GraphQL错误转换为用户友好的错误消息
 * @param error GraphQL错误对象
 * @returns 用户友好的错误消息
 */
export function formatGraphQLError(error: any): string {
  if (!error) return '发生未知错误';
  
  if (error.graphQLErrors && error.graphQLErrors.length > 0) {
    // 从GraphQL错误中提取消息
    const firstError = error.graphQLErrors[0];
    return firstError.message || '服务器错误';
  }
  
  if (error.networkError) {
    // 处理网络错误
    if (error.networkError.statusCode === 401) {
      return '未授权，请重新登录';
    }
    if (error.networkError.statusCode === 403) {
      return '没有权限执行此操作';
    }
    if (error.networkError.statusCode === 404) {
      return '请求的资源不存在';
    }
    return '网络错误，请检查连接';
  }
  
  // 如果是普通的错误对象
  if (error.message) {
    return error.message;
  }
  
  // 回退
  return '操作失败，请稍后重试';
}

/**
 * 转换分页参数对象
 * @param page 页码
 * @param limit 每页数量
 * @returns GraphQL分页输入对象
 */
export function createPageInput(page: number, limit: number): { page: number; limit: number } {
  return {
    page: Math.max(1, page), // 确保页码至少为1
    limit: Math.min(Math.max(1, limit), 50) // 限制limit在1-50之间
  };
}

/**
 * 清理过期的本地存储数据
 */
export function cleanupExpiredStorage() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return; // 在服务器端不执行
    }
    
    const now = Date.now();
    const expirationTime = 30 * 24 * 60 * 60 * 1000; // 30天过期
    const keysToRemove: string[] = [];
    
    // 遍历localStorage查找缓存项
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('cache_')) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const data = JSON.parse(item);
            if (data.timestamp && (now - data.timestamp > expirationTime)) {
              keysToRemove.push(key);
            }
          }
        } catch {
          // 忽略解析错误的项
          console.warn('清理过程中发现无效的缓存项', key);
        }
      }
    }
    
    // 删除过期项
    if (keysToRemove.length > 0) {
      console.log(`清理 ${keysToRemove.length} 条过期的缓存数据`);
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn('清理缓存状态时出错', errorMessage);
  }
}

/**
 * 格式化数字为易读形式
 * @param num 要格式化的数字
 * @returns 格式化后的字符串
 */
export function formatNumber(num: number): string {
  if (num === null || num === undefined) return '0';
  
  if (num === 0) return '0';
  
  // 对于大数字进行友好显示
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  
  return num.toString();
}
