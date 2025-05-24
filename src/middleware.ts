import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 需要认证的路径
const PROTECTED_PATHS = [
  '/home',
  '/profile',
  '/notifications',
  '/messages',
  '/explore',
  '/create',
  '/settings',
  '/onboarding'
];

// 从请求中提取认证token
const extractAuthToken = (request: NextRequest): string | null => {
  console.log('[中间件] 开始提取认证token');
  
  // 1. 直接从Cookie中获取auth_token
  const cookieToken = request.cookies.get('auth_token')?.value;
  if (cookieToken && cookieToken.length > 0) {
    console.log('[中间件] 从Cookie中找到token:', 
      cookieToken.length > 10 ? cookieToken.substring(0, 10) + '...' : '(短token)');
    return cookieToken;
  }
  
  // 2. 输出所有可用的cookies进行调试
  const allCookies = request.cookies.getAll();
  if (allCookies.length > 0) {
    console.log('[中间件] 所有可用的cookies:');
    allCookies.forEach(c => {
      console.log(` - ${c.name}: ${c.value ? 
        (c.value.length > 5 ? `${c.value.substring(0, 5)}... (${c.value.length}字符)` : c.value) : 
        '(空值)'}`);
    });
  } else {
    console.log('[中间件] 没有可用的cookies');
  }
  
  console.log('[中间件] 未找到认证token');
  return null;
};

// 中间件函数
export function middleware(request: NextRequest) {
  // 获取访问路径
  const path = request.nextUrl.pathname;
  
  console.log(`[中间件] 处理请求: ${path}`);
  
  // 输出请求信息用于调试
  console.log(`[中间件] 请求方法: ${request.method}`);
  console.log(`[中间件] 请求来源: ${request.headers.get('referer') || '直接访问'}`);
  
  // 首先检查是否是API路由，这些路由由其自己的认证逻辑处理
  if (path.startsWith('/api/')) {
    console.log(`[中间件] API路由，跳过中间件认证: ${path}`);
    return NextResponse.next();
  }
  
  // 检查是否是需要认证的路径
  const isProtectedPath = PROTECTED_PATHS.some(protectedPath => 
    path === protectedPath || path.startsWith(`${protectedPath}/`)
  );
  
  // 如果不是受保护的路径，直接放行
  if (!isProtectedPath) {
    console.log(`[中间件] 非受保护路径，直接放行: ${path}`);
    return NextResponse.next();
  }
  
  console.log(`[中间件] 访问受保护路径: ${path}`);
  
  // 检查URL参数是否包含token（开发模式下的备用认证方式）
  const urlToken = request.nextUrl.searchParams.get('token');
  if (urlToken && process.env.NODE_ENV === 'development') {
    console.log(`[中间件] 使用URL参数token，创建带token的重定向`);
    
    // 创建不带token参数的URL
    const cleanUrl = new URL(request.nextUrl.pathname, request.url);
    
    // 保留除了token以外的其他查询参数
    for (const [key, value] of request.nextUrl.searchParams.entries()) {
      if (key !== 'token') {
        cleanUrl.searchParams.set(key, value);
      }
    }
    
    // 创建重定向响应
    const response = NextResponse.redirect(cleanUrl);
    
    // 设置Cookie
    response.cookies.set({
      name: 'auth_token',
      value: urlToken,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7天
    });
    
    console.log(`[中间件] 已设置token到Cookie，重定向到: ${cleanUrl}`);
    return response;
  }
  
  // 提取认证token
  const token = extractAuthToken(request);
    
  // 如果没有token，重定向到登录页
  if (!token) {
    console.log(`[中间件] 未找到认证token，重定向到登录页`);
    
    // 构造重定向URL，包含原路径作为重定向参数
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', path);
    
    // 在响应中设置头信息，帮助前端识别认证失败原因
    const response = NextResponse.redirect(redirectUrl);
    response.headers.set('X-Auth-Required', 'true');
    
    return response;
  }
  
  console.log(`[中间件] 找到认证token，允许访问: ${path}`);
  
  // 创建带有认证信息的响应
  const response = NextResponse.next();
  
  // 将token传递到请求头中，便于后续处理
  response.headers.set('X-Auth-Token', token);
  
  // 确保cookie在后续请求中也可用
  if (!request.cookies.get('auth_token')?.value) {
    console.log('[中间件] 在请求cookie中未找到auth_token，正在设置...');
    response.cookies.set({
      name: 'auth_token',
      value: token,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7天
    });
  }
  
  return response;
}

// 配置匹配器
export const config = {
  matcher: [
    // 保护路径
    '/home/:path*',
    '/profile/:path*',
    '/notifications/:path*',
    '/messages/:path*',
    '/explore/:path*',
    '/create/:path*',
    '/settings/:path*',
    '/onboarding/:path*',
    // API路由（只记录日志但不做认证）
    '/api/:path*',
  ],
}; 