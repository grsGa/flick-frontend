'use client';

import { FC, ReactNode } from 'react';
import { Navbar } from './navbar';

interface PageLayoutProps {
  children: ReactNode;
}

/**
 * 页面布局组件 - 增强版
 * 
 * 提供美化后的页面结构，包括优化导航栏和页脚
 */
export const PageLayout: FC<PageLayoutProps> = ({ children }) => {
  return (
    <div className="relative min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 w-full">
        <div className="w-full">
          {children}
        </div>
      </main>
      <footer className="border-t py-12 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex flex-col space-y-2">
                <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
                  Flick
                </span>
                <p className="text-sm text-muted-foreground max-w-md">
                  Flick 是一个社交分享平台，帮助你记录生活中的精彩瞬间，与朋友和家人分享你的故事。
                </p>
              </div>
              
              <div className="flex flex-wrap justify-center items-center gap-6 text-sm">
                <div className="flex flex-col space-y-2">
                  <span className="font-medium text-foreground">关于</span>
                  <div className="flex flex-col space-y-1">
                    <a href="#" className="text-muted-foreground hover:text-primary transition-colors">关于我们</a>
                    <a href="#" className="text-muted-foreground hover:text-primary transition-colors">加入我们</a>
                    <a href="#" className="text-muted-foreground hover:text-primary transition-colors">联系我们</a>
                  </div>
                </div>
                <div className="flex flex-col space-y-2">
                  <span className="font-medium text-foreground">法律</span>
                  <div className="flex flex-col space-y-1">
                    <a href="#" className="text-muted-foreground hover:text-primary transition-colors">使用条款</a>
                    <a href="#" className="text-muted-foreground hover:text-primary transition-colors">隐私政策</a>
                    <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Cookie 政策</a>
                  </div>
                </div>
                <div className="flex flex-col space-y-2">
                  <span className="font-medium text-foreground">支持</span>
                  <div className="flex flex-col space-y-1">
                    <a href="#" className="text-muted-foreground hover:text-primary transition-colors">帮助中心</a>
                    <a href="#" className="text-muted-foreground hover:text-primary transition-colors">常见问题</a>
                    <a href="#" className="text-muted-foreground hover:text-primary transition-colors">反馈建议</a>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t border-muted/30 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} Flick. 保留所有权利。
              </div>
              <div className="flex space-x-4">
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-twitter"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" /></svg>
                  <span className="sr-only">Twitter</span>
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
                  <span className="sr-only">Instagram</span>
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-facebook"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                  <span className="sr-only">Facebook</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}; 