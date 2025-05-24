import { NextRequest, NextResponse } from "next/server";

/**
 * 认证调试API
 * 提供有关当前请求认证状态的详细信息
 */
export async function GET(request: NextRequest) {
  try {
    // 获取所有headers
    const headers = Object.fromEntries(request.headers.entries());
    
    // 获取所有cookies
    const cookies = request.cookies.getAll();
    
    // 获取认证相关的信息
    const authHeader = request.headers.get('authorization');
    const authToken = request.cookies.get('auth_token');
    
    // 准备响应
    const response = {
      requestInfo: {
        method: request.method,
        url: request.url,
        nextUrl: {
          pathname: request.nextUrl.pathname,
          searchParams: Object.fromEntries(request.nextUrl.searchParams.entries()),
        },
      },
      authInfo: {
        hasAuthHeader: !!authHeader,
        authHeaderValue: authHeader ? `${authHeader.substring(0, 15)}...` : null,
        hasAuthCookie: !!authToken,
        authCookieValue: authToken ? `${authToken.value.substring(0, 15)}...` : null,
      },
      headers: headers,
      cookies: cookies.map(c => ({
        name: c.name,
        value: c.value.length > 15 ? `${c.value.substring(0, 15)}...` : c.value,
      })),
      timestamp: new Date().toISOString(),
    };
    
    // 返回响应
    return NextResponse.json(response);
  } catch (error) {
    console.error("认证调试API错误:", error);
    
    return NextResponse.json(
      { error: "处理请求时出错" },
      { status: 500 }
    );
  }
} 