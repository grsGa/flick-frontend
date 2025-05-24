import { NextRequest, NextResponse } from "next/server";

/**
 * Cookie调试API
 * 用于测试Cookie设置是否正常工作
 */
export async function GET(request: NextRequest) {
  try {
    // 创建响应
    const response = NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: '测试Cookie已设置'
    });
    
    // 设置一个简单的测试Cookie
    response.cookies.set({
      name: 'test_cookie',
      value: 'test_value_' + Date.now(),
      path: '/',
      maxAge: 3600, // 1小时
      sameSite: 'lax',
      httpOnly: false,
      secure: false,
    });
    
    // 获取当前所有的cookie
    const cookies = request.cookies.getAll();
    console.log('[DEBUG Cookie] 当前cookies:', cookies.map(c => c.name).join(', '));
    
    // 创建一个备用方式的cookie
    const backupCookie = `backup_cookie=backup_value_${Date.now()}; path=/; max-age=3600; SameSite=Lax`;
    response.headers.append('Set-Cookie', backupCookie);
    
    // 记录Cookie设置
    console.log('[DEBUG Cookie] 响应cookies:', response.cookies.toString());
    
    return response;
  } catch (error) {
    console.error("[DEBUG Cookie] 错误:", error);
    return NextResponse.json(
      { 
        error: "设置Cookie时出错",
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 