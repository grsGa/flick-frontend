'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { validateUsername, validateEmail } from '@/lib/utils';
import { useMutation, gql } from '@apollo/client';

const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        id
        username
        displayName
        avatarUrl
      }
    }
  }
`;

const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { login } = useAuth();
  const [registerMutation] = useMutation(REGISTER_MUTATION);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = '姓名不能为空';
    }
    
    if (!username.trim()) {
      newErrors.username = '用户名不能为空';
    } else if (!validateUsername(username)) {
      newErrors.username = '用户名只能包含字母、数字和下划线，最多15个字符';
    }
    
    if (!email.trim()) {
      newErrors.email = '邮箱不能为空';
    } else if (!validateEmail(email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }
    
    if (!password) {
      newErrors.password = '密码不能为空';
    } else if (password.length < 8) {
      newErrors.password = '密码至少需要8个字符';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data } = await registerMutation({
        variables: {
          input: {
            username,
            email,
            password,
            displayName: name,
          },
        },
      });
      
      if (data.register) {
        login(data.register.token, data.register.user);
        router.push('/home');
      }
    } catch (err: any) {
      setErrors({ general: err.message || '注册失败，请稍后重试' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      {/* Logo区域 */}
      <div className="flex justify-center mb-6">
        {/* 替换为自定义logo */}
        <svg width="70" height="70" viewBox="0 0 70 70" fill="none" className="w-20 h-20">
          <desc>
            Created with Pixso.
          </desc>
          <defs>
            <clipPath id="clip13_27">
              <rect id="Flick Logo" width="70.000000" height="70.000000" fill="white" fillOpacity="0"/>
            </clipPath>
          </defs>
          <g clipPath="url(#clip13_27)">
            <path id="path" d="M53.9 34.76C53.9 45.2 45.43 53.66 35 53.66C24.56 53.66 16.1 45.2 16.1 34.76C16.1 24.32 24.56 15.86 35 15.86C45.43 15.86 53.9 24.32 53.9 34.76ZM17.84 34.76C17.84 44.23 25.52 51.91 35 51.91C44.47 51.91 52.15 44.23 52.15 34.76C52.15 25.29 44.47 17.61 35 17.61C25.52 17.61 17.84 25.29 17.84 34.76Z" fill="#000000" fillOpacity="1.000000" fillRule="nonzero"/>
            <path id="path" d="M41.53 31.38C41.53 38.14 36.04 43.63 29.28 43.63C22.51 43.63 17.03 38.14 17.03 31.38C17.03 24.61 22.51 19.13 29.28 19.13C36.04 19.13 41.53 24.61 41.53 31.38ZM18.85 31.38C18.85 37.14 23.52 41.81 29.28 41.81C35.04 41.81 39.71 37.14 39.71 31.38C39.71 25.62 35.04 20.95 29.28 20.95C23.52 20.95 18.85 25.62 18.85 31.38Z" fill="#000000" fillOpacity="1.000000" fillRule="nonzero"/>
            <path id="path" d="M40.36 33.59C40.36 37.72 37.02 41.06 32.9 41.06C28.77 41.06 25.43 37.72 25.43 33.59C25.43 29.47 28.77 26.13 32.9 26.13C37.02 26.13 40.36 29.47 40.36 33.59ZM27.05 33.59C27.05 36.82 29.67 39.44 32.9 39.44C36.12 39.44 38.74 36.82 38.74 33.59C38.74 30.37 36.12 27.75 32.9 27.75C29.67 27.75 27.05 30.37 27.05 33.59Z" fill="#000000" fillOpacity="1.000000" fillRule="nonzero"/>
          </g>
        </svg>
      </div>
      
      {/* 标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground text-center">创建账户</h1>
      </div>
      
      {/* 错误消息 */}
      {errors.general && (
        <div className="mb-4">
          <div className="p-3 bg-destructive text-destructive-foreground rounded">
            {errors.general}
          </div>
        </div>
      )}
      
      {/* 注册表单 */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full px-4 py-3 bg-background border rounded focus:outline-none focus:ring-2 focus:ring-ring ${
              errors.name ? 'border-destructive' : 'border-input'
            }`}
            placeholder="姓名"
          />
          {errors.name && (
            <p className="mt-1 text-destructive text-sm">{errors.name}</p>
          )}
        </div>
        
        <div>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={`w-full px-4 py-3 bg-background border rounded focus:outline-none focus:ring-2 focus:ring-ring ${
              errors.username ? 'border-destructive' : 'border-input'
            }`}
            placeholder="用户名"
          />
          {errors.username && (
            <p className="mt-1 text-destructive text-sm">{errors.username}</p>
          )}
        </div>
        
        <div>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full px-4 py-3 bg-background border rounded focus:outline-none focus:ring-2 focus:ring-ring ${
              errors.email ? 'border-destructive' : 'border-input'
            }`}
            placeholder="邮箱"
          />
          {errors.email && (
            <p className="mt-1 text-destructive text-sm">{errors.email}</p>
          )}
        </div>
        
        <div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full px-4 py-3 bg-background border rounded focus:outline-none focus:ring-2 focus:ring-ring ${
              errors.password ? 'border-destructive' : 'border-input'
            }`}
            placeholder="密码"
          />
          {errors.password && (
            <p className="mt-1 text-destructive text-sm">{errors.password}</p>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full bg-primary text-primary-foreground py-3 rounded-full font-bold transition-all duration-300 shadow-sm outline outline-1 outline-input hover:shadow-lg ${
            isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/80 hover:-translate-y-0.5 transform'
          }`}
        >
          {isLoading ? '注册中...' : '注册'}
        </button>
        
        <p className="text-muted-foreground text-xs">
          注册即表示你同意我们的
          <a href="#" className="text-primary hover:underline">服务条款</a>
          和
          <a href="#" className="text-primary hover:underline">隐私政策</a>，
          包括
          <a href="#" className="text-primary hover:underline">Cookie使用政策</a>。
        </p>
      </form>
      
      {/* 分割线 */}
      <div className="my-6">
        <div className="flex items-center">
          <div className="flex-grow border-t border-input"></div>
          <span className="mx-4 text-muted-foreground text-sm">或</span>
          <div className="flex-grow border-t border-input"></div>
        </div>
      </div>
      
      {/* 登录提示 */}
      <div className="text-center">
        <span className="text-muted-foreground text-sm">已有账户？</span>{' '}
        <Link href="/?modal=login" className="text-primary font-bold hover:underline text-sm">
          登录
        </Link>
      </div>
    </div>
  );
};

export default RegisterPage;
