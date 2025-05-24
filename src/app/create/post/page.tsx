'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarLayout } from '@/components/layout/sidebar-layout';
import { withAuth } from '@/lib/auth-context';

function CreatePostPage() {
  const router = useRouter();
  
  // 页面加载时自动重定向到首页
  useEffect(() => {
    router.push('/home');
  }, [router]);
  
  return (
    <SidebarLayout>
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">重定向中...</p>
      </div>
    </SidebarLayout>
  );
}

export default withAuth(CreatePostPage); 