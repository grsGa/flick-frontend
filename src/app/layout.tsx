import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";
import { cleanupExpiredStorage } from "@/lib/utils";

// 使用Google Fonts加载Inter字体
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

// 清理过期的本地存储数据
if (typeof window !== 'undefined') {
  cleanupExpiredStorage();
}

export const metadata: Metadata = {
  title: "Flick - 分享与连接",
  description: "发现、创建、分享与连接",
  icons: [
    {
      rel: "icon",
      url: "/favicon.ico",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable
        )}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
