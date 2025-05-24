/**
 * 认证流程测试工具
 * 
 * 用于测试前后端认证流程的各个环节
 * 可以在浏览器控制台中执行以下函数:
 * 
 * - window.testLoginFlow() - 测试完整登录流程
 * - window.testTokenStorage() - 测试令牌存储和读取
 * - window.testTokenRefresh() - 测试令牌刷新功能
 * - window.displayAuthDebugInfo() - 显示当前认证状态调试信息
 */

import { 
    login, 
    getAuthToken, 
    getRefreshToken, 
    isAuthenticated, 
    getUser, 
    refreshToken
} from './lib/auth';
import { createApolloClient } from './lib/apollo-client';

declare global {
    interface Window {
        testLoginFlow: (username: string, password: string) => Promise<void>;
        testTokenStorage: () => void;
        testTokenRefresh: () => Promise<void>;
        displayAuthDebugInfo: () => void;
        clearAuthAndReload: () => void;
    }
}

/**
 * 测试完整登录流程
 */
export async function testLoginFlow(username: string, password: string): Promise<void> {
    console.group('登录流程测试');
    console.log('开始登录测试...');
    
    try {
        // 创建Apollo客户端
        const client = createApolloClient();
        
        // 执行登录
        console.log(`使用凭据登录: ${username}`);
        const authResponse = await login(client, username, password, true);
        
        console.log('登录响应:', {
            userId: authResponse.user.id,
            username: authResponse.user.username,
            tokenLength: authResponse.token.length,
            refreshTokenLength: authResponse.refreshToken.length,
            expiresAt: authResponse.expiresAt
        });
        
        // 验证存储情况
        setTimeout(() => {
            console.log('验证令牌存储:');
            
            // 检查localStorage
            const localStorageToken = localStorage.getItem('auth_token');
            console.log('- localStorage中的令牌:', 
                localStorageToken ? 
                `${localStorageToken.substring(0, 10)}... (${localStorageToken.length}字符)` : 
                '未找到');
            
            // 检查Cookie
            const cookieToken = document.cookie
                .split('; ')
                .find(row => row.startsWith('auth_token='))
                ?.split('=')[1];
            
            console.log('- Cookie中的令牌:', 
                cookieToken ? 
                `${cookieToken.substring(0, 10)}... (${cookieToken.length}字符)` : 
                '未找到');
            
            // 使用API检查认证状态
            console.log('- 认证状态:', isAuthenticated() ? '已认证' : '未认证');
            console.log('- 获取的用户:', getUser());
        }, 500);
        
        console.log('登录流程测试完成');
    } catch (error) {
        console.error('登录测试失败:', error);
    }
    
    console.groupEnd();
}

/**
 * 测试令牌存储和读取
 */
export function testTokenStorage(): void {
    console.group('令牌存储测试');
    
    // 获取当前存储的令牌
    const authToken = getAuthToken();
    const refreshToken = getRefreshToken();
    
    console.log('Auth Token:', authToken ? 
        `${authToken.substring(0, 10)}... (${authToken.length}字符)` : 
        '未找到');
    
    console.log('Refresh Token:', refreshToken ? 
        `${refreshToken.substring(0, 10)}... (${refreshToken.length}字符)` : 
        '未找到');
    
    // 检查Cookie中的令牌
    const cookieToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];
    
    console.log('Cookie中的令牌:', cookieToken ? 
        `${cookieToken.substring(0, 10)}... (${cookieToken.length}字符)` : 
        '未找到');
    
    // 检查localStorage中的令牌
    const localStorageToken = localStorage.getItem('auth_token');
    console.log('localStorage中的令牌:', localStorageToken ? 
        `${localStorageToken.substring(0, 10)}... (${localStorageToken.length}字符)` : 
        '未找到');
    
    // 检查令牌是否一致
    if (authToken && cookieToken && localStorageToken) {
        if (authToken === cookieToken && authToken === localStorageToken) {
            console.log('✅ 所有令牌一致');
        } else {
            console.error('❌ 令牌不一致:',
                'auth.ts:', authToken.substring(0, 5),
                'cookie:', cookieToken.substring(0, 5),
                'localStorage:', localStorageToken.substring(0, 5));
        }
    }
    
    console.groupEnd();
}

/**
 * 测试令牌刷新功能
 */
export async function testTokenRefresh(): Promise<void> {
    console.group('令牌刷新测试');
    
    try {
        // 创建Apollo客户端
        const client = createApolloClient();
        
        // 获取当前令牌
        const currentToken = getAuthToken();
        if (!currentToken) {
            console.error('❌ 未找到当前令牌，请先登录');
            console.groupEnd();
            return;
        }
        
        console.log('当前令牌:', `${currentToken.substring(0, 10)}... (${currentToken.length}字符)`);
        
        // 刷新令牌
        console.log('正在刷新令牌...');
        const authResponse = await refreshToken(client);
        
        if (!authResponse) {
            console.error('❌ 刷新令牌失败，未返回有效响应');
            console.groupEnd();
            return;
        }
        
        // 验证新令牌
        const newToken = getAuthToken();
        console.log('新令牌:', `${newToken?.substring(0, 10)}... (${newToken?.length}字符)`);
        
        if (newToken !== currentToken) {
            console.log('✅ 令牌已成功刷新');
        } else {
            console.error('❌ 令牌刷新失败，新旧令牌相同');
        }
    } catch (error) {
        console.error('刷新令牌测试失败:', error);
    }
    
    console.groupEnd();
}

/**
 * 显示当前认证状态调试信息
 */
export function displayAuthDebugInfo(): void {
    console.group('认证状态调试信息');
    
    // 检查认证状态
    const authenticated = isAuthenticated();
    console.log('认证状态:', authenticated ? '已认证' : '未认证');
    
    // 获取当前用户
    const user = getUser();
    console.log('当前用户:', user ? 
        {
            id: user.id,
            username: user.username,
            email: user.email,
            displayName: user.displayName,
            roles: user.roles
        } : 
        '未登录');
    
    // 检查令牌
    testTokenStorage();
    
    // 检查认证Cookie存在性
    const hasCookie = document.cookie
        .split('; ')
        .some(row => row.startsWith('auth_token='));
    
    console.log('认证Cookie存在:', hasCookie ? '是' : '否');
    
    console.groupEnd();
}

/**
 * 清除认证信息并重新加载页面
 */
export function clearAuthAndReload(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    
    console.log('已清除所有认证信息，正在刷新页面...');
    window.location.reload();
}

// 将函数添加到全局对象，以便在控制台中调用
if (typeof window !== 'undefined') {
    window.testLoginFlow = testLoginFlow;
    window.testTokenStorage = testTokenStorage;
    window.testTokenRefresh = testTokenRefresh;
    window.displayAuthDebugInfo = displayAuthDebugInfo;
    window.clearAuthAndReload = clearAuthAndReload;
} 