import React from 'react';
import './globals.css';
import { Providers } from '@/components/layout/Providers';

export const metadata = {
  title: 'Flick',
  description: '分享你的精彩瞬间',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-background text-foreground">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
