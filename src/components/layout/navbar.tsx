'use client';

import { FC, useState } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { MenuIcon } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

/**
 * 顶部导航栏组件 - 优化版
 */
export const Navbar: FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 transition-all duration-200 hover:opacity-80">
            <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">Flick</span>
          </Link>
        </div>
        
        {/* 导航栏中间区域为空 */}
        <div className="flex-1"></div>
        
        <div className="flex items-center gap-3">
          <ThemeToggle />
          
          {/* 桌面按钮 */}
          <div className="hidden md:flex gap-3">
            <Button asChild variant="ghost" size="sm" className="rounded-full px-4 hover:bg-primary/10 hover:text-primary transition-all duration-200">
              <Link href="/login">登录</Link>
            </Button>
            <Button asChild size="sm" className="rounded-full px-4 bg-primary/90 hover:bg-primary transition-colors duration-200">
              <Link href="/register">注册</Link>
            </Button>
          </div>
          
          {/* 移动端菜单 */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="rounded-full w-8 h-8">
                <MenuIcon className="h-5 w-5" />
                <span className="sr-only">打开菜单</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[80vw] sm:w-[350px] border-l border-muted/30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
              <SheetHeader>
                <SheetTitle className="sr-only">导航菜单</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col space-y-6 py-6">
                <div className="flex flex-col gap-3 pt-6">
                  <Button asChild size="lg" className="rounded-full bg-primary/90 hover:bg-primary transition-colors duration-200">
                    <Link href="/login" onClick={() => setIsOpen(false)}>
                      登录
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-200">
                    <Link href="/register" onClick={() => setIsOpen(false)}>
                      注册
                    </Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}; 