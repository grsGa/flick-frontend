// Utility functions
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval > 1) {
    return `${interval}年前`;
  }
  
  interval = Math.floor(seconds / 2592000);
  if (interval > 1) {
    return `${interval}个月前`;
  }
  
  interval = Math.floor(seconds / 86400);
  if (interval > 1) {
    return `${interval}天前`;
  }
  
  interval = Math.floor(seconds / 3600);
  if (interval > 1) {
    return `${interval}小时前`;
  }
  
  interval = Math.floor(seconds / 60);
  if (interval > 1) {
    return `${interval}分钟前`;
  }
  
  return '刚刚';
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
}

export function validateUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_]{1,15}$/;
  return usernameRegex.test(username);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}