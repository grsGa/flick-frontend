'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { withGuest } from '@/lib/auth-context';
import { toast } from '@/components/ui/use-toast';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/lib/auth-context';
import { useSearchParams } from 'next/navigation';

function LoginPage() {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirectPath, setRedirectPath] = useState('/home');
  
  // 获取URL查询参数
  const searchParams = useSearchParams();
  const { login } = useAuth();

  // 检测重定向路径
  useEffect(() => {
    const redirect = searchParams.get('redirect');
    if (redirect) {
      setRedirectPath(redirect);
    }
  }, [searchParams]);

  // 表单提交处理
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!usernameOrEmail) {
      setError('请输入用户名或邮箱');
      return;
    }
    
    if (!password) {
      setError('请输入密码');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // 调用登录API
      const authResponse = await login(usernameOrEmail, password, rememberMe);
      
      // 登录成功提示
      toast({
        title: "登录成功",
        description: `欢迎回来，${authResponse.user.username}`,
        duration: 2000,
      });
      
      console.log(`[登录] 认证成功，准备重定向到: ${redirectPath}`);
      
      // 设置非httpOnly的Cookie，确保JavaScript可以访问
      document.cookie = `auth_token=${authResponse.token}; path=/; max-age=604800; SameSite=Lax`; // 7天
      
      // 通过API设置Cookie (后端可以设置更安全的Cookie)
      try {
        const cookieResponse = await fetch('/api/set-auth-cookie', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: authResponse.token }),
          credentials: 'include'
        });
        
        if (!cookieResponse.ok) {
          console.error(`[登录] Cookie API返回错误状态: ${cookieResponse.status}`);
        } else {
          console.log('[登录] Cookie API设置成功');
        }
      } catch (cookieError) {
        console.error('[登录] 设置Cookie时出错:', cookieError);
      }
      
      // 等待500ms，确保Cookie有足够时间被设置
      console.log('[登录] 等待Cookie设置完成...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 最后检查cookie是否设置成功
      const hasAuthCookie = document.cookie.includes('auth_token=');
      console.log(`[登录] Cookie设置检查: ${hasAuthCookie ? '成功' : '失败'}`);
      console.log(`[登录] 所有Cookies: ${document.cookie}`);
      
      // 重定向到目标页面
      console.log(`[登录] 即将跳转到: ${redirectPath}`);
      window.location.href = redirectPath;
      
    } catch (err) {
      // 处理错误
      const errorMessage = err instanceof Error ? err.message : '登录时发生未知错误';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-4 bg-muted/40">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 pb-6">
          <CardTitle className="text-2xl font-bold text-center">登录</CardTitle>
          <CardDescription className="text-center text-base">
            输入您的账号密码登录Flick
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            {/* 错误提示 */}
            {error && (
              <Alert variant="destructive" className="mb-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>登录失败</AlertTitle>
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="usernameOrEmail" className="text-sm font-medium">邮箱或用户名</Label>
              <Input
                id="usernameOrEmail"
                type="text"
                placeholder="example@example.com 或 username"
                value={usernameOrEmail}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setUsernameOrEmail(e.target.value);
                  setError(null); // 用户输入时清除错误
                }}
                required
                className={`h-11 ${error ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1">
                您可以使用注册时的邮箱或用户名进行登录
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">密码</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  忘记密码?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setPassword(e.target.value);
                  setError(null); // 用户输入时清除错误
                }}
                required
                className={`h-11 ${error ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="rememberMe" className="text-sm font-medium">记住我</Label>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col pt-4 pb-6 px-6">
            <Button 
              type="submit" 
              className="w-full h-11 text-base font-medium mt-4" 
              disabled={loading}
            >
              {loading ? '登录中...' : '登录'}
            </Button>
            
            <div className="text-center text-sm mt-6">
              还没有账号?{' '}
              <Link href="/register" className="text-primary hover:underline font-medium">
                注册
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default withGuest(LoginPage); 