'use client';

import { FC, ReactNode, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { 
  HomeIcon, 
  SearchIcon, 
  PlusCircleIcon, 
  UserIcon,
  LogOutIcon,
  Settings2Icon,
  BellIcon,
  MessageCircleIcon,
  BookmarkIcon
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
import { usePostDialog } from '@/components/providers/post-dialog-provider';
import { useAuth } from '@/lib/auth-context';

interface SidebarLayoutProps {
  children: ReactNode;
  rightSidebar?: ReactNode;
}

/**
 * 应用主布局组件
 * 
 * 提供三栏布局：左侧导航栏、中央内容区、右侧推荐/搜索区
 */
export const SidebarLayout: FC<SidebarLayoutProps> = ({ children, rightSidebar }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { openPostDialog } = usePostDialog();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      toast({
        title: "已退出登录",
        description: "您已成功退出登录",
      });
      router.push('/');
    } catch (error) {
      console.error('退出登录失败:', error);
      toast({
        variant: "destructive",
        title: "退出失败",
        description: "请稍后重试",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navItems = [
    {
      href: '/home',
      icon: <HomeIcon className="h-6 w-6" />,
      label: '主页',
      pathPattern: '^/home'
    },
    {
      href: '/explore',
      icon: <SearchIcon className="h-6 w-6" />,
      label: '探索',
      pathPattern: '^/explore'
    },
    {
      href: '/notifications',
      icon: <BellIcon className="h-6 w-6" />,
      label: '通知',
      pathPattern: '^/notifications'
    },
    {
      href: '/messages',
      icon: <MessageCircleIcon className="h-6 w-6" />,
      label: '消息',
      pathPattern: '^/messages'
    },
    {
      href: '/bookmarks',
      icon: <BookmarkIcon className="h-6 w-6" />,
      label: '书签',
      pathPattern: '^/bookmarks'
    },
    {
      href: '/profile',
      icon: <UserIcon className="h-6 w-6" />,
      label: '我的',
      pathPattern: '^/profile'
    },
  ];

  // 检查指定路径是否应该高亮某个导航项
  const isActiveNavItem = (item: typeof navItems[0]) => {
    // 使用正则表达式测试当前路径
    const regex = new RegExp(item.pathPattern);
    return regex.test(pathname);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-12 gap-0">
        {/* 左侧导航栏 */}
        <aside className="hidden md:flex md:col-span-2 lg:col-span-2 xl:col-span-3 border-r min-h-screen sticky top-0">
          <div className="w-full py-4 flex flex-col h-screen sticky top-0">
            <div className="px-4 mb-6">
              <Link href="/home" className="flex items-center justify-center lg:justify-start">
                <span className="text-2xl font-bold">Flick</span>
              </Link>
            </div>
            
            <nav className="flex-1 space-y-2 px-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium hover:bg-accent transition-colors",
                    isActiveNavItem(item) ? "bg-accent text-accent-foreground" : "text-foreground",
                    "md:justify-center lg:justify-start"
                  )}
                  onClick={() => {
                    if (item.href === '/profile' && typeof window !== 'undefined') {
                      sessionStorage.removeItem('profileActiveTab');
                    }
                  }}
                >
                  <div className="flex items-center justify-center md:w-10 md:h-10 lg:w-auto lg:h-auto md:rounded-full lg:rounded-none">
                  {item.icon}
                  </div>
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              ))}
              
              <Link
                href="/create/post"
                className="mt-6 flex items-center justify-center w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 font-medium"
                onClick={(e) => {
                  e.preventDefault();
                  openPostDialog();
                }}
              >
                <PlusCircleIcon className="h-6 w-6 lg:mr-2" />
                <span className="hidden lg:inline">发布</span>
              </Link>
            </nav>
            
            <div className="mt-auto px-2 pb-4">
              <Button 
                variant="ghost" 
                className="w-full justify-start px-3 md:justify-center lg:justify-start" 
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <div className="flex items-center justify-center md:w-10 md:h-5 lg:w-auto lg:h-auto">
                  <LogOutIcon className="h-5 w-5 lg:mr-3" />
                </div>
                <span className="hidden lg:inline">退出登录</span>
              </Button>
              
              <div className="mt-4 flex items-center justify-between px-3">
                <ThemeToggle />
                <Link href="/settings" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Settings2Icon className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </aside>
        
        {/* 中央内容区 */}
        <main className="md:col-span-10 lg:col-span-7 xl:col-span-6 min-h-screen border-r">
          <div className="w-full max-w-3xl mx-auto">
          {children}
          </div>
        </main>
        
        {/* 右侧推荐/搜索区 */}
        {rightSidebar && (
          <aside className="hidden lg:block lg:col-span-3 xl:col-span-3 sticky top-0 h-screen overflow-y-auto py-4 px-4">
            {rightSidebar}
          </aside>
        )}
      </div>
    </div>
  );
}; 