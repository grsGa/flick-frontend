"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Avatar from '@/components/core/Avatar';

// 定义导航项类型
interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

// 图标组件
const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l10 9h-3v8h-6v-6H11v6H5v-8H2l10-9z" />
  </svg>
);

const ExploreIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
  </svg>
);

const NotificationsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const MessagesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
  </svg>
);

const BookmarksIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
  </svg>
);

const ProfileIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const MoreIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
  </svg>
);

// 导航项配置
const navItems: NavItem[] = [
  { label: '首页', href: '/home', icon: HomeIcon },
  { label: '探索', href: '/explore', icon: ExploreIcon },
  { label: '通知', href: '/notifications', icon: NotificationsIcon },
  { label: '私信', href: '/messages', icon: MessagesIcon },
  { label: '书签', href: '/bookmarks', icon: BookmarksIcon },
  { label: '个人资料', href: '/profile', icon: ProfileIcon },
  { label: '更多', href: '/more', icon: MoreIcon },
];

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  // 获取个人资料页面链接
  const profileHref = user ? `/${user.username}` : '/profile';

  return (
    <div className="sticky top-0 h-screen flex flex-col p-4">
      {/* Logo */}
      <div className="mb-4">
        <Link href="/home" className="p-3 rounded-full hover:bg-gray-100 inline-block">
          <div className="w-8 h-8 bg-black rounded-full"></div>
        </Link>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-grow">
        <ul className="space-y-2">
          {navItems.map((item) => {
            // 特殊处理个人资料项
            const href = item.label === '个人资料' ? profileHref : item.href;
            const isActive = pathname === href;
            
            return (
              <li key={item.label}>
                <Link 
                  href={href}
                  className={`flex items-center p-3 rounded-full hover:bg-gray-100 ${
                    isActive ? 'font-bold' : ''
                  }`}
                >
                  <item.icon className="w-6 h-6" />
                  <span className="ml-4 text-xl hidden lg:inline">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 用户菜单 */}
      {user && (
        <div className="mt-auto">
          <div className="flex items-center p-3 rounded-full hover:bg-gray-100 cursor-pointer">
            <Avatar src={user.avatarUrl} alt={user.username} size="md" />
            <div className="ml-3 hidden lg:block">
              <div className="font-bold">{user.displayName || user.username}</div>
              <div className="text-gray-500">@{user.username}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
