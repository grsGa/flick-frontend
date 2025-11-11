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

// Note: Backend LoginInput now uses "identifier" field which accepts username, email, or phone

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
      // Backend accepts identifier (username, email, or phone)
      const { data } = await loginMutation({
        variables: {
          input: {
            identifier: username,
            password: password,
          },
        },
      });
      
      if (data.login) {
        login(data.login.token, data.login.user);
        router.push('/home');
      }
    } catch (err: any) {
      console.error('[Login] Error details:', err);
      
      // 提供更友好的错误消息
      let errorMessage = '登录失败，请检查用户名和密码';
      
      if (err.message) {
        const message = err.message.toLowerCase();
        if (message.includes('user not found')) {
          errorMessage = '该账户不存在，请检查用户名或邮箱是否正确，或者先注册新账户。';
        } else if (message.includes('invalid password')) {
          errorMessage = '密码错误，请重新输入正确的密码。';
        } else if (message.includes('invalid credentials')) {
          errorMessage = '用户名或密码错误，请检查后重试。';
        } else if (message.includes('network') || message.includes('fetch')) {
          errorMessage = '网络连接失败，请检查网络后重试';
        } else if (message.includes('server') || message.includes('internal')) {
          errorMessage = '服务器暂时不可用，请稍后重试';
        }
      }
      
      setError(errorMessage);
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

      {/* 第三方登录 */}
      <div className="space-y-4">
        <a
          href="http://localhost:8080/auth/google/login"
          className="w-full inline-flex items-center justify-center py-3 px-4 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-full font-semibold transition-colors duration-200"
        >
          {/* Google Icon SVG */}
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          使用Google账号登录
        </a>
        <a
          href="http://localhost:8080/auth/github/login"
          className="w-full inline-flex items-center justify-center py-3 px-4 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-full font-semibold transition-colors duration-200"
        >
          {/* GitHub Icon SVG */}
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.207 11.387.6.11.82-.26.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.93 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.652.242 2.873.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.217.694.824.576C20.565 21.795 24 17.295 24 12 24 5.37 18.627 0 12 0z"></path>
          </svg>
          使用GitHub账号登录
        </a>
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
