"use client";

import React, { useState, useEffect, useRef } from 'react';
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
];

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 获取个人资料页面链接
  const profileHref = user ? `/profile/${user.username}` : '/login';

  return (
    <div className="sticky top-0 h-screen flex flex-col p-4">
      {/* Logo */}
      <div className="mb-4">
        <Link href="/home" className="p-3 rounded-full hover:bg-gray-100 inline-block">
          <svg width="40" height="40" viewBox="10 10 50 50" fill="none" className="w-10 h-10">
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
        </Link>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-grow">
        <ul className="space-y-2">
          {navItems.map((item) => {
            // 特殊处理个人资料项
            const href = item.label === '个人资料' ? profileHref : item.href;
            const isActive = item.label === '个人资料' 
              ? pathname.startsWith(href) 
              : pathname === href;
            
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
          
          {/* Post 按钮 */}
          <li className="mt-4">
            <button className="w-full bg-black text-white font-bold py-3 px-6 rounded-full hover:bg-gray-800 transition-colors">
              <span className="text-xl">Post</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* 用户菜单 */}
      {user && (
        <div className="mt-auto relative" ref={menuRef}>
          {isMenuOpen && (
            <div className="absolute bottom-full mb-2 w-64 bg-white rounded-lg shadow-2xl py-2">
              <ul>
                <li>
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-100 font-bold">
                    Settings
                  </button>
                </li>
                <li>
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 font-bold"
                  >
                    Log out @{user.username}
                  </button>
                </li>
              </ul>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-4 h-4 bg-white"></div>
            </div>
          )}
          <div
            className={`flex items-center p-3 rounded-full cursor-pointer ${
              !isMenuOpen && 'hover:bg-gray-100'
            }`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
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
