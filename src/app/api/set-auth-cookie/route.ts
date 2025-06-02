import { NextRequest, NextResponse } from "next/server";

/**
 * 设置认证Cookie的API路由
 * 用于在登录后手动设置认证Cookie
 */
export async function POST(request: NextRequest) {
  try {
    let tokenData;
    
    try {
      // 从请求体读取token信息
      tokenData = await request.json();
      console.log("[Auth Cookie API] 收到请求");
    } catch (parseError) {
      console.error("[Auth Cookie API] 解析请求体失败:", parseError);
      return NextResponse.json(
        { error: "无效的JSON请求体" },
        { status: 400 }
      );
    }
    
    // 提取token - 优先使用accessToken，兼容旧的token字段
    const token = tokenData?.accessToken || tokenData?.token;
    
    // 增强的JWT格式验证
    const isValidToken = (token: string): boolean => {
      if (typeof token !== 'string') return false;
      
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      
      try {
        // 验证每个部分都是有效的base64
        parts.forEach(part => {
          if (!part) throw new Error('Empty part');
          atob(part.replace(/-/g, '+').replace(/_/g, '/'));
        });
        
        // 可选：检查token是否过期
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (payload.exp && payload.exp < Date.now() / 1000) {
          return false; // Token已过期
        }
        
        return true;
      } catch {
        return false;
      }
    }
    
    // 必须提供token
    if (!token || !isValidToken(token)) {
      console.error("[Auth Cookie API] 缺少token参数:", tokenData);
      
      // 尝试从localStorage获取token(仅在客户端渲染时有效)
      return NextResponse.json(
        { error: "缺少有效的token或accessToken参数" },
        { status: 400 }
      );
    }

    console.log("[Auth Cookie API] 正在设置认证Cookie");
    
    // 创建响应
    const response = NextResponse.json({ 
      success: true,
      message: "认证Cookie已设置"
    });
    
    // 使用Next.js cookie API设置安全的Cookie
    response.cookies.set({
      name: 'auth_token',
      value: token,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7天
      httpOnly: true, // 防止XSS攻击
      secure: process.env.NODE_ENV === 'production', // 生产环境启用HTTPS
      sameSite: 'lax' // CSRF保护
    });
    
    console.log("[Auth Cookie API] Cookie已设置成功");
    
    return response;
  } catch (error) {
    console.error("[Auth Cookie API] 设置Cookie失败:", error);
    return NextResponse.json(
      { 
        error: "设置Cookie时出错",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 