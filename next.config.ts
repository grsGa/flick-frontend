import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ['localhost', '127.0.0.1'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  // 添加运行时配置
  publicRuntimeConfig: {
    minioPublicEndpoint: process.env.NEXT_PUBLIC_MINIO_ENDPOINT || 'localhost:9000'
  },
  env: {
    NEXT_PUBLIC_MINIO_ENDPOINT: 'localhost:9000',
    NEXT_PUBLIC_GRAPHQL_HTTP_URL: '/api/graphql',
    NEXT_PUBLIC_GRAPHQL_WS_URL: 'ws://localhost:8080/graphql',
    NEXT_PUBLIC_API_URL: 'http://localhost:8080/api',
    NEXT_PUBLIC_MEDIA_URL: 'http://localhost:9000',
    NEXT_PUBLIC_BACKEND_URL: 'http://localhost:8080',
  },
  // 添加自定义headers，允许更多的Cookie操作
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Set-Cookie',
            value: 'Path=/; HttpOnly; SameSite=Lax',
          },
        ],
      },
    ];
  },
  // 将原来的rewrites配置注释掉，改为使用内部的API代理
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/graphql',
  //       destination: 'http://localhost:8080/graphql',
  //     },
  //   ];
  // },
};

export default nextConfig;
