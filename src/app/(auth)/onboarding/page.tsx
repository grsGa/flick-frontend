'use client';

import { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
import { getAuthHeaders, getUser } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/utils';

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [step, setStep] = useState(1);

  // 如果用户已经完成信息设置，直接跳转到首页
  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.push('/');
      return;
    }
    
    if (user.profile_complete) {
      router.push('/home');
    }
  }, [router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!username) {
      toast({
        variant: "destructive",
        title: "用户名不能为空",
        description: "请输入您的用户名",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // 获取授权头信息
      const headers = await getAuthHeaders();
      
      // 调用更新用户信息API
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          username,
          bio,
          profile_complete: true
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.description || errorData.error || '更新用户信息失败');
      }
      
      // 信息更新成功
      toast({
        title: "信息已更新",
        description: "欢迎来到Flick！",
      });
      
      // 跳转到首页
      router.push('/home');
    } catch (error) {
      console.error('更新用户信息失败:', error);
      toast({
        variant: "destructive",
        title: "更新失败",
        description: error instanceof Error ? error.message : "更新用户信息时出现错误",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const nextStep = () => {
    if (step === 1 && !username) {
      toast({
        variant: "destructive",
        title: "用户名不能为空",
        description: "请输入您的用户名",
      });
      return;
    }
    setStep(step + 1);
  };
  
  const prevStep = () => {
    setStep(step - 1);
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-4 bg-muted/40">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">完善您的个人资料</CardTitle>
          <CardDescription className="text-center">
            {step === 1 && "让我们从设置您的用户名开始"}
            {step === 2 && "添加一段个人简介，让其他人了解您"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {step === 1 && (
              <div className="space-y-2">
                <Label htmlFor="username">用户名 <span className="text-destructive">*</span></Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="选择一个独特的用户名"
                  value={username}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  这将是您在Flick上的唯一标识，后续可在个人设置中修改。
                </p>
              </div>
            )}
            
            {step === 2 && (
              <div className="space-y-2">
                <Label htmlFor="bio">个人简介</Label>
                <Textarea
                  id="bio"
                  placeholder="介绍一下自己吧"
                  value={bio}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setBio(e.target.value)}
                  className="min-h-[120px]"
                />
                <p className="text-sm text-muted-foreground">
                  选填。简单介绍一下自己，让其他用户了解您。
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            {step === 1 && (
              <Button 
                type="button" 
                className="w-full" 
                onClick={nextStep}
              >
                下一步
              </Button>
            )}
            
            {step === 2 && (
              <div className="w-full flex flex-col space-y-2">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? '保存中...' : '开始使用Flick'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={prevStep}
                >
                  返回
                </Button>
              </div>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 