'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MediaPage() {
  const router = useRouter();

  useEffect(() => {
    // 为了确保不导致路由循环，我们直接设置会话存储，然后重定向到主页面
    // 主页面将从会话存储中读取并设置正确的活动标签
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('profileActiveTab', 'media');
      router.replace('/profile');
    }
  }, [router]);

  return null;
} 