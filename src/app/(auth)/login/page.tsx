'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useMutation, gql } from '@apollo/client';

const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
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

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inputErrors, setInputErrors] = useState({ username: '', password: '' });
  
  const router = useRouter();
  const { login } = useAuth();
  const [loginMutation] = useMutation(LOGIN_MUTATION);

  const validate = () => {
    const newErrors = { username: '', password: '' };
    let isValid = true;
    if (!username) {
      newErrors.username = '请输入用户名';
      isValid = false;
    }
    if (!password) {
      newErrors.password = '请输入密码';
      isValid = false;
    }
    setInputErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }
    setIsLoading(true);
    setError('');
    
    try {
      // Dynamically build the input object based on user input
      const isEmail = username.includes('@');
      const input = {
        password,
        ...(isEmail ? { email: username } : { username: username }),
      };

      const { data } = await loginMutation({
        variables: {
          input: input,
        },
      });
      
      if (data.login) {
        login(data.login.token, data.login.user);
        router.push('/home');
      }
    } catch (err: any) {
      setError(err.message || '登录失败，请检查用户名和密码');
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
        <h1 className="text-2xl font-bold text-foreground text-center">登录到Flick</h1>
      </div>
      
      {/* 错误消息 */}
      {error && (
        <div className="mb-4">
          <div className="p-3 bg-destructive text-destructive-foreground rounded">
            {error}
          </div>
        </div>
      )}
      
      {/* 登录表单 */}
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={`w-full px-4 py-3 bg-background border ${inputErrors.username ? 'border-destructive' : 'border-input'} text-foreground rounded focus:outline-none focus:ring-2 focus:ring-ring`}
            placeholder="手机号、邮箱或用户名"
          />
          {inputErrors.username && <p className="text-destructive text-sm mt-1">{inputErrors.username}</p>}
        </div>
        
        <div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full px-4 py-3 bg-background border ${inputErrors.password ? 'border-destructive' : 'border-input'} text-foreground rounded focus:outline-none focus:ring-2 focus:ring-ring`}
            placeholder="密码"
          />
          {inputErrors.password && <p className="text-destructive text-sm mt-1">{inputErrors.password}</p>}
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full bg-primary text-primary-foreground py-3 rounded-full font-bold transition-all duration-300 shadow-sm outline outline-1 outline-input hover:shadow-lg ${
            isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/80 hover:-translate-y-0.5 transform'
          }`}
        >
          {isLoading ? '登录中...' : '登录'}
        </button>
      </form>
      
      {/* 忘记密码链接 */}
      <div className="mt-4 text-center">
        <Link href="/forgot-password" className="text-primary hover:underline text-sm">
          忘记密码？
        </Link>
      </div>
      
      {/* 分割线 */}
      <div className="my-6">
        <div className="flex items-center">
          <div className="flex-grow border-t border-input"></div>
          <span className="mx-4 text-muted-foreground text-sm">或</span>
          <div className="flex-grow border-t border-input"></div>
        </div>
      </div>
      
      {/* 注册提示 */}
      <div className="text-center mt-6">
        <span className="text-muted-foreground text-sm">没有账户？</span>{' '}
        <Link href="/?modal=register" className="text-primary font-bold hover:underline text-sm transition-colors duration-200">
          注册
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
