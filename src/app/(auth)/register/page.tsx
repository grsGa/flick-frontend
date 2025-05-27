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
import { useState, FormEvent, ChangeEvent } from 'react';
import { withGuest } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AuthContext } from '@/lib/auth-context';
import { useContext } from 'react';

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { register } = useContext(AuthContext);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    
    // 验证表单
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致，请重新输入");
      return;
    }
    
    if (password.length < 8) {
      setError("密码长度必须至少为8个字符");
      return;
    }
    
    setLoading(true);

    try {
      // 调用注册API
      await register(email, username, password);
      
      // 注册成功，跳转到onboarding页面
      toast({
        title: "注册成功",
        description: "欢迎加入Flick！",
      });
      router.push('/onboarding');
    } catch (error) {
      // 注册失败，显示错误消息
      const errorMessage = error instanceof Error ? error.message : "注册过程中出现错误";
      setError(errorMessage);
      console.error('注册失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-4 bg-muted/40">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 pb-6">
          <CardTitle className="text-2xl font-bold text-center">注册账号</CardTitle>
          <CardDescription className="text-center text-base">
            创建您的Flick账号，开始分享精彩
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            {/* 错误提示 */}
            {error && (
              <Alert variant="destructive" className="mb-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>注册失败</AlertTitle>
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">电子邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                required
                className="h-11"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">用户名</Label>
              <Input
                id="username"
                type="text"
                placeholder="选择一个独特的用户名"
                value={username}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setUsername(e.target.value);
                  setError(null);
                }}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="至少8个字符"
                value={password}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">确认密码</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="再次输入密码"
                value={confirmPassword}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setConfirmPassword(e.target.value);
                  setError(null);
                }}
                required
                className="h-11"
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col pt-4 pb-6 px-6">
            <Button 
              type="submit" 
              className="w-full h-11 text-base font-medium mt-4" 
              disabled={loading}
            >
              {loading ? '注册中...' : '注册'}
            </Button>
            
            <div className="text-center text-sm mt-6">
              已有账号?{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                登录
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default withGuest(RegisterPage); 