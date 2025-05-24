import { NextRequest, NextResponse } from "next/server";

/**
 * GraphQL代理中间件
 * 
 * 用于将前端GraphQL请求转发到后端API服务器
 * 同时处理跨域和特殊的认证逻辑
 */
export async function POST(request: NextRequest) {
  try {
    // 读取请求体
    const body = await request.json();
    
    // 获取请求头
    const headers = Object.fromEntries(request.headers.entries());
    
    // 准备发送给后端的头信息
    const backendHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    };
    
    // 传递认证头
    if (headers.authorization) {
      backendHeaders.Authorization = headers.authorization;
    } else {
      // 如果没有认证头，尝试从Cookie中获取token
      const authToken = request.cookies.get('auth_token')?.value;
      if (authToken) {
        backendHeaders.Authorization = `Bearer ${authToken}`;
        console.log("[GraphQL代理] 从Cookie中提取token添加到请求头");
      }
    }
    
    // 检查是否为登录请求，添加调试信息
    const isLoginRequest = body.operationName === 'Login' || 
                         (body.query && body.query.includes('mutation') && body.query.includes('login'));
    
    if (isLoginRequest) {
      console.log("[GraphQL代理] 处理登录请求:", JSON.stringify(body.variables));
    } else {
      // 记录其他类型的GraphQL操作
      console.log(`[GraphQL代理] 处理GraphQL ${body.operationName || '未命名操作'}`);
    }
    
    // 从环境变量中获取后端URL，如果没有设置则使用默认值
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL 
      ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/graphql` 
      : "http://localhost:8080/graphql";
    
    console.log(`[GraphQL代理] 转发请求到 ${backendUrl}`);
    
    // 添加超时逻辑
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
    
    try {
      const response = await fetch(backendUrl, {
        method: "POST",
        headers: backendHeaders,
        body: JSON.stringify(body),
        cache: "no-store",
        signal: controller.signal,
      });
      
      // 请求完成，清除超时
      clearTimeout(timeoutId);
      
      // 检查请求是否成功
      if (!response.ok) {
        console.error(`[GraphQL代理] 后端请求失败: ${response.status} ${response.statusText}`);
        
        // 尝试读取错误信息
        let errorData: { message?: string } = { message: `HTTP错误 ${response.status}` };
        let errorText = '';
        
        // 尝试解析错误响应
        try {
          // 首先尝试解析为JSON
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
            errorText = JSON.stringify(errorData);
          } else {
            // 如果不是JSON，读取为文本
            errorText = await response.text();
          }
        } catch {
          // 忽略错误并使用默认值
          errorText = '无法读取错误详情';
        }
        
        console.error(`[GraphQL代理] 错误详情: ${errorText}`);
        
        // 构建更具体的错误信息
        const statusText = response.statusText ? ` - ${response.statusText}` : '';
        const errorMessage = errorData.message || `服务器返回了 ${response.status}${statusText}`;
        
        // 根据HTTP状态码返回适当的错误
        switch (response.status) {
          case 400:
            return NextResponse.json(
              { errors: [{ message: `请求格式错误: ${errorMessage}`, extensions: { code: "BAD_REQUEST" } }] },
              { status: 400 }
            );
          case 401:
            return NextResponse.json(
              { errors: [{ message: "未授权访问，请登录", extensions: { code: "UNAUTHORIZED" } }] },
              { status: 401 }
            );
          case 403:
            return NextResponse.json(
              { errors: [{ message: "您没有权限执行此操作", extensions: { code: "FORBIDDEN" } }] },
              { status: 403 }
            );
          case 404:
            return NextResponse.json(
              { errors: [{ message: "请求的资源不存在", extensions: { code: "NOT_FOUND" } }] },
              { status: 404 }
            );
          case 422:
            return NextResponse.json(
              { errors: [{ message: `请求无法处理: ${errorMessage}`, extensions: { code: "UNPROCESSABLE_ENTITY" } }] },
              { status: 422 }
            );
          case 500:
            return NextResponse.json(
              { errors: [{ message: "服务器内部错误", extensions: { code: "INTERNAL_SERVER_ERROR" } }] },
              { status: 500 }
            );
          default:
            return NextResponse.json(
              { errors: [{ message: errorMessage, extensions: { code: "BACKEND_ERROR" } }] },
              { status: response.status }
            );
        }
      }
      
      // 尝试解析JSON响应
      let responseData;
      try {
        responseData = await response.json();
        // 检查GraphQL错误
        if (responseData.errors) {
          console.log(`[GraphQL代理] GraphQL响应包含错误:`, responseData.errors);
        }
      } catch (parseError) {
        console.error("[GraphQL代理] 无法解析JSON响应:", parseError);
        
        return NextResponse.json(
          { 
            errors: [{ 
              message: "无法解析后端响应为JSON",
              extensions: { code: "INVALID_RESPONSE" }
            }] 
          },
          { status: 500 }
        );
      }
      
      // 处理响应
      const responseHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
        "Access-Control-Allow-Credentials": "true",
      };
      
      // 如果是登录请求并且成功，设置Cookie
      if (isLoginRequest && responseData?.data?.login) {
        const auth = responseData.data.login;
        
        if (auth.token) {
          console.log("[GraphQL代理] 登录成功，设置认证Cookie");
          
          // 创建响应对象
          const nextResponse = NextResponse.json(responseData, {
            status: response.status,
            headers: responseHeaders
          });
          
          // 设置Cookie - 持久化token到客户端
          const expiryDate = auth.expiresAt 
            ? new Date(auth.expiresAt) 
            : new Date(Date.now() + 24 * 60 * 60 * 1000); // 默认24小时
            
          // 设置auth_token cookie，用于中间件认证
          nextResponse.cookies.set({
            name: 'auth_token',
            value: auth.token,
            path: '/',
            expires: expiryDate,
            sameSite: 'lax',
            httpOnly: false, // 允许JavaScript访问
            secure: process.env.NODE_ENV === 'production', // 在生产环境中使用secure
          });
          
          // 记录cookies以便调试
          console.log("[GraphQL代理] 设置的cookies:", nextResponse.cookies.toString());
          
          // 添加Authorization头信息，确保当前响应已包含认证信息
          nextResponse.headers.set('Authorization', `Bearer ${auth.token}`);
          console.log("[GraphQL代理] 已设置认证信息到响应中");
          
          return nextResponse;
        }
      }
      
      // 返回普通响应
      return NextResponse.json(responseData, {
        status: response.status,
        headers: responseHeaders
      });
    } catch (fetchError) {
      // 清除超时
      clearTimeout(timeoutId);
      
      // 检查是否是超时错误
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error("[GraphQL代理] 请求超时");
        return NextResponse.json(
          { 
            errors: [{ 
              message: "请求超时，请稍后重试",
              extensions: { code: "TIMEOUT_ERROR" }
            }] 
          },
          { status: 504 }
        );
      }
      
      // 其他网络错误
      console.error("[GraphQL代理] 网络错误:", fetchError);
      return NextResponse.json(
        { 
          errors: [{ 
            message: "网络错误，无法连接到后端服务",
            extensions: { code: "NETWORK_ERROR" }
          }] 
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("[GraphQL代理] 处理请求时出错:", error);
    
    return NextResponse.json(
      {
        errors: [{ 
          message: `代理处理错误: ${error instanceof Error ? error.message : String(error)}`,
          extensions: { code: "PROXY_ERROR" }
        }]
      },
      { status: 500 }
    );
  }
}

// 处理OPTIONS请求（CORS预检）
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin") || "*";
  
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": "86400",
    },
  });
} 