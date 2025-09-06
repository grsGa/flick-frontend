'use client';

/**
 * 头像版本化URL服务
 * 实现缓存友好的头像更新机制
 */
class AvatarVersionService {
  private versionCache = new Map<string, number>();

  /**
   * 生成版本化头像URL
   * @param userId 用户ID
   * @param baseUrl 基础URL
   * @param version 版本号
   */
  generateVersionedUrl(userId: string, baseUrl: string, version?: number): string {
    if (!baseUrl) return '';
    
    // 如果URL已经包含版本信息，直接返回
    if (baseUrl.includes('avatar_v')) {
      return baseUrl;
    }

    // 使用提供的版本号或缓存的版本号
    const currentVersion = version || this.versionCache.get(userId) || 1;
    
    // 解析原始URL
    const url = new URL(baseUrl);
    const pathParts = url.pathname.split('/');
    const filename = pathParts[pathParts.length - 1];
    const [name, ext] = filename.split('.');
    
    // 生成版本化路径
    const versionedFilename = `avatar_v${currentVersion}.${ext}`;
    pathParts[pathParts.length - 1] = versionedFilename;
    url.pathname = pathParts.join('/');
    
    return url.toString();
  }

  /**
   * 更新用户头像版本
   * @param userId 用户ID
   * @param version 新版本号
   */
  updateVersion(userId: string, version: number) {
    this.versionCache.set(userId, version);
    console.log(`[AvatarVersionService] Updated version for user ${userId}: v${version}`);
  }

  /**
   * 获取用户当前头像版本
   * @param userId 用户ID
   */
  getCurrentVersion(userId: string): number {
    return this.versionCache.get(userId) || 1;
  }

  /**
   * 清理版本缓存
   * @param userId 用户ID（可选，不提供则清理所有）
   */
  clearCache(userId?: string) {
    if (userId) {
      this.versionCache.delete(userId);
    } else {
      this.versionCache.clear();
    }
  }

  /**
   * 从URL中提取版本号
   * @param url 头像URL
   */
  extractVersionFromUrl(url: string): number | null {
    const match = url.match(/avatar_v(\d+)\./);
    return match ? parseInt(match[1], 10) : null;
  }

  /**
   * 预加载新版本头像（避免闪烁）
   * @param url 新头像URL
   */
  preloadAvatar(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        console.log('[AvatarVersionService] Preloaded avatar:', url);
        resolve();
      };
      img.onerror = () => {
        console.warn('[AvatarVersionService] Failed to preload avatar:', url);
        reject(new Error('Failed to preload avatar'));
      };
      img.src = url;
    });
  }
}

// 导出单例实例
export const avatarVersionService = new AvatarVersionService();
