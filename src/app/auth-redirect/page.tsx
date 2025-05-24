'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * 认证重定向页面
 * 用于解决Cookie设置问题的最终解决方案
 * 从URL接收token并重定向到目标页面
 */
export default function AuthRedirect() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('准备中...');
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const processAuth = async () => {
      try {
        // 获取参数
        const token = searchParams.get('token');
        const redirect = searchParams.get('redirect') || '/home';
        
        if (!token) {
          setError('未提供token参数');
          return;
        }
        
        setStatus('正在设置认证Cookie...');
        
        // 1. 设置localStorage
        localStorage.setItem('auth_token', token);
        
        // 2. 设置Cookie (简单方式)
        document.cookie = `auth_token=${token}; path=/; max-age=604800`; // 7天
        
        // 3. 通过API设置Cookie
        setStatus('通过API设置Cookie...');
        try {
          const response = await fetch('/api/set-auth-cookie', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
            credentials: 'include'
          });
          
          if (!response.ok) {
            console.warn('API设置Cookie失败', await response.text());
          }
        } catch (error) {
          console.error('API请求失败', error);
        }
        
        // 等待Cookie设置完成
        setStatus('等待Cookie设置生效...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 验证Cookie是否设置成功
        const hasCookie = document.cookie.includes('auth_token=');
        console.log(`Cookie验证: ${hasCookie ? '已设置' : '未设置'}, 所有Cookies: ${document.cookie}`);
        
        // 准备重定向
        setStatus('准备重定向至: ' + redirect);
        window.location.href = redirect;
      } catch (err) {
        setStatus('重定向失败');
        setError(err instanceof Error ? err.message : '未知错误');
      }
    };
    
    processAuth();
  }, [searchParams]);
  
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-6 bg-card rounded-lg shadow-lg space-y-4">
        <h1 className="text-xl font-bold text-center">身份验证跳转</h1>
        
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-center">{status}</p>
          
          {error && (
            <div className="w-full p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 