'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import LoginPage from './login/page';
import RegisterPage from './register/page';

const AuthPage: React.FC = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();

  // 检查URL参数以确定显示哪个模态框
  useEffect(() => {
    const modal = searchParams.get('modal');
    if (modal === 'login') {
      setShowRegister(false);
      setShowLogin(true);
    } else if (modal === 'register') {
      setShowLogin(false);
      setShowRegister(true);
    } else {
      // 如果没有modal参数，确保两个模态框都关闭
      setShowLogin(false);
      setShowRegister(false);
    }
  }, [searchParams]);

  // 如果用户已认证，重定向到首页
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/home');
    }
  }, [isAuthenticated, router]);

  const openLoginModal = () => {
    // 关闭注册模态框，打开登录模态框
    setShowRegister(false);
    setShowLogin(true);
    router.push('?modal=login');
  };

  const openRegisterModal = () => {
    // 关闭登录模态框，打开注册模态框
    setShowLogin(false);
    setShowRegister(true);
    router.push('?modal=register');
  };

  const closeModal = () => {
    // 关闭所有模态框
    setShowLogin(false);
    setShowRegister(false);
    router.push('/'); // 关闭模态框时返回到根路径
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* 左侧 Logo 区域 */}
      <div className="w-1/2 hidden lg:flex items-center justify-center bg-background">
        {/* 替换为绘制的logo */}
        <div className="flex items-center justify-center">
          <svg width="210" height="210" viewBox="0 0 70 70" fill="none" className="w-[210px] h-[210px]">
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
      </div>

      {/* 右侧内容区域 */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-8 py-12 bg-background">
        <div className="max-w-md w-full space-y-6">
          <h1 className="text-5xl font-bold text-foreground">正发生</h1>
          <h2 className="text-2xl font-semibold text-foreground">现在就加入。</h2>

          {/* 第三方注册 */}
          <button
            onClick={() => (window.location.href = 'http://localhost:8080/auth/google/login')}
            className="w-full max-w-md bg-white border border-input py-2 px-4 rounded-full flex items-center justify-center gap-2 hover:bg-accent hover:shadow-lg transition-all duration-300 text-foreground shadow-sm outline outline-1 outline-input hover:-translate-y-0.5 transform"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
            使用 Google 账号注册
          </button>
          <button
            onClick={() => (window.location.href = 'http://localhost:8080/auth/github/login')}
            className="w-full max-w-md bg-white border border-input py-2 px-4 rounded-full flex items-center justify-center gap-2 hover:bg-accent hover:shadow-lg transition-all duration-300 text-foreground shadow-sm outline outline-1 outline-input hover:-translate-y-0.5 transform"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            使用 GitHub 账号注册
          </button>

          <div className="flex items-center">
            <hr className="flex-grow border-input" />
            <span className="px-4 text-muted-foreground">或</span>
            <hr className="flex-grow border-input" />
          </div>

          {/* 创建账号 */}
          <button 
            onClick={openRegisterModal}
            className="w-full max-w-md bg-primary text-primary-foreground font-bold py-2 px-4 rounded-full hover:bg-primary/80 hover:shadow-lg transition-all duration-300 shadow-sm outline outline-1 outline-input hover:-translate-y-0.5 transform"
          >
            创建账号
          </button>

          <p className="text-xs text-muted-foreground text-center">
            注册即表示你同意我们的服务条款、隐私政策和 Cookie 使用政策。
          </p>

          {/* 登录入口 */}
          <div className="text-center mt-8">
            <p className="text-muted-foreground">已有账号？</p>
            <button 
              onClick={openLoginModal}
              className="w-full max-w-md bg-background border border-input font-bold py-2 px-4 mt-2 rounded-full hover:bg-accent hover:shadow-lg transition-all duration-300 shadow-sm outline outline-1 outline-input hover:-translate-y-0.5 transform"
            >
              登录
            </button>
          </div>
        </div>
      </div>

      {/* 登录模态框 */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-input w-full max-w-md max-h-[90vh] overflow-y-auto relative">
            <div className="p-4 flex justify-end">
              <button 
                onClick={closeModal}
                className="text-muted-foreground hover:text-foreground"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-4 pb-8">
              <LoginPage />
            </div>
          </div>
        </div>
      )}

      {/* 注册模态框 */}
      {showRegister && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-input w-full max-w-md max-h-[90vh] overflow-y-auto relative">
            <div className="p-4 flex justify-end">
              <button 
                onClick={closeModal}
                className="text-muted-foreground hover:text-foreground"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-4 pb-8">
              <RegisterPage />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthPage;
