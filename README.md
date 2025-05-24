This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Cookie认证修复方案

为解决登录后无法重定向到保护页面的问题，我们实施了以下修复：

### 1. 多级Cookie设置

- 使用多种方法设置Cookie，确保在不同环境下都能正常工作：
  - 直接使用document.cookie设置基础Cookie
  - 通过专用API端点(/api/set-auth-cookie)设置Cookie
  - 使用Next.js Response.cookies API设置Cookie
  - 使用自定义Headers设置Cookie

### 2. Cookie设置优化

- 移除可能导致问题的Cookie选项（如SameSite限制）
- 使用更基础的Cookie设置方式，提高兼容性
- 增加Cookie设置的等待时间，确保有足够时间处理

### 3. 中间件增强

- 改进中间件中的token提取逻辑，支持从多个来源获取token：
  - 从Cookie API直接获取
  - 从Cookie头字符串解析
  - 从Authorization请求头获取
  - 从URL参数获取（仅开发环境）
- 增加详细的日志输出，便于调试

### 4. Token同步机制

- 创建专用的token传递组件和Hook：
  - withTokenPassthrough HOC用于包装保护页面
  - useEnsureToken Hook用于确保token在页面中可用
- 在Home页面中实施token检查和同步
- 确保localStorage和Cookie中的token保持同步

### 5. 开发辅助工具

- 添加调试API端点：
  - /api/debug-cookie用于测试Cookie设置
  - /api/auth-debug用于检查认证状态
  - /api/dev-login用于开发环境中快速设置token

### 6. Next.js配置改进

- 增加headers配置，优化Cookie处理
- 删除可能干扰认证的文件

这些修改共同确保了登录后用户认证状态能够正确传递，用户能够成功重定向到受保护页面。
