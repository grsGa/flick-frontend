'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LikesPage() {
  const router = useRouter();

  useEffect(() => {
    // 为了确保不导致路由循环，使用一个标记避免重复设置
    const flag = sessionStorage.getItem('redirecting_from_likes');
    
    if (!flag) {
      // 设置一个标志，防止重定向循环
      sessionStorage.setItem('redirecting_from_likes', 'true');
      // 设置会话存储，然后重定向到主页面
      sessionStorage.setItem('profileActiveTab', 'likes');
      
      // 使用replace而不是push，避免堆栈中有多个条目
      router.replace('/profile');
    } else {
      // 如果已经设置过标记，清除它，避免影响未来导航
      sessionStorage.removeItem('redirecting_from_likes');
    }
  }, [router]);

  return null;
} 