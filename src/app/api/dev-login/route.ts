import { NextRequest, NextResponse } from "next/server";

/**
 * 开发环境专用登录辅助API
 * 仅在开发环境中使用，用于绕过常规登录页面进行快速测试
 */
export async function GET(request: NextRequest) {
  // 检查是否是开发环境
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: "此API仅在开发环境可用" },
      { status: 403 }
    );
  }
  
  try {
    // 获取token参数
    const token = request.nextUrl.searchParams.get('token');
    const redirect = request.nextUrl.searchParams.get('redirect') || '/home';
    
    if (!token) {
      return NextResponse.json(
        { error: "缺少token参数" },
        { status: 400 }
      );
    }
    
    console.log("[开发登录] 绕过常规登录流程，直接设置token");
    
    // 创建重定向响应
    const response = NextResponse.redirect(new URL(redirect, request.url));
    
    // 设置Cookie
    response.cookies.set({
      name: 'auth_token',
      value: token,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7天
    });
    
    // 再添加一个备用的
    response.headers.append(
      'Set-Cookie',
      `auth_token=${token}; Path=/; Max-Age=${60 * 60 * 24 * 7}`
    );
    
    // 记录操作
    console.log(`[开发登录] Token设置成功，重定向到: ${redirect}`);
    
    return response;
  } catch (error) {
    console.error("[开发登录] 错误:", error);
    return NextResponse.json(
      { 
        error: "登录处理出错",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 