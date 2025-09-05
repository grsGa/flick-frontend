"use client";

import { ApolloClient } from '@apollo/client';
import { gql } from '@apollo/client';

/**
 * 全局用户更新服务
 * 统一处理用户资料修改后的实时更新，避免多个堆叠方案造成混乱
 */
class UserUpdateService {
  private apolloClient: ApolloClient<any> | null = null;
  private updateCallbacks: Set<(userData: any) => void> = new Set();

  /**
   * 初始化服务，设置Apollo客户端
   */
  initialize(client: ApolloClient<any>) {
    this.apolloClient = client;
  }

  /**
   * 注册更新回调函数
   */
  subscribe(callback: (userData: any) => void) {
    this.updateCallbacks.add(callback);
    return () => {
      this.updateCallbacks.delete(callback);
    };
  }

  /**
   * 全局用户数据更新方法
   * 当用户修改个人资料后调用此方法进行统一更新
   */
  async updateUserGlobally(updatedUserData: {
    username: string;
    displayName?: string;
    avatarUrl?: string;
    bio?: string;
    location?: string;
    website?: string;
    bannerUrl?: string;
  }) {
    if (!this.apolloClient) {
      console.error('[UserUpdateService] Apollo client not initialized');
      return;
    }

    console.log('[UserUpdateService] Starting global user update:', updatedUserData);

    try {
      // 1. 通知所有订阅者（包括useAuth）
      this.updateCallbacks.forEach(callback => {
        try {
          callback(updatedUserData);
        } catch (error) {
          console.error('[UserUpdateService] Callback error:', error);
        }
      });

      // 2. 更新Apollo缓存中所有相关的用户数据
      await this.updateApolloCache(updatedUserData);

      console.log('[UserUpdateService] Global user update completed successfully');
    } catch (error) {
      console.error('[UserUpdateService] Global user update failed:', error);
    }
  }

  /**
   * 更新Apollo缓存中的用户数据
   */
  private async updateApolloCache(userData: any) {
    if (!this.apolloClient) return;

    const cache = this.apolloClient.cache;

    // 获取缓存中的所有数据
    const cacheData = cache.extract();
    
    // 遍历缓存，更新所有包含该用户的数据
    Object.keys(cacheData).forEach(key => {
      try {
        const item = cacheData[key];
        
        // 更新用户对象本身
        if (item && item.__typename === 'User' && item.username === userData.username) {
          // 过滤掉undefined值，只更新有值的字段
          const updateData: any = {};
          if (userData.displayName !== undefined) updateData.displayName = userData.displayName;
          if (userData.avatarUrl !== undefined) updateData.avatarUrl = userData.avatarUrl;
          if (userData.bio !== undefined) updateData.bio = userData.bio;
          if (userData.location !== undefined) updateData.location = userData.location;
          if (userData.website !== undefined) updateData.website = userData.website;
          if (userData.bannerUrl !== undefined) updateData.bannerUrl = userData.bannerUrl;
          
          if (Object.keys(updateData).length > 0) {
            cache.writeFragment({
              id: key,
              fragment: gql`
                fragment UpdatedUser on User {
                  ${userData.displayName !== undefined ? 'displayName' : ''}
                  ${userData.avatarUrl !== undefined ? 'avatarUrl' : ''}
                  ${userData.bio !== undefined ? 'bio' : ''}
                  ${userData.location !== undefined ? 'location' : ''}
                  ${userData.website !== undefined ? 'website' : ''}
                  ${userData.bannerUrl !== undefined ? 'bannerUrl' : ''}
                }
              `,
              data: updateData
            });
          }
        }

        // 更新帖子中的作者信息
        if (item && item.__typename === 'Post' && item.author && 
            typeof item.author === 'object' && item.author.username === userData.username) {
          const authorUpdate: any = { ...item.author };
          if (userData.displayName !== undefined) authorUpdate.displayName = userData.displayName;
          if (userData.avatarUrl !== undefined) authorUpdate.avatarUrl = userData.avatarUrl;
          
          cache.writeFragment({
            id: key,
            fragment: gql`
              fragment UpdatedPostAuthor on Post {
                author {
                  displayName
                  avatarUrl
                }
              }
            `,
            data: {
              author: authorUpdate
            }
          });
        }
      } catch (error) {
        // 忽略单个缓存项的更新错误，继续处理其他项
        console.debug('[UserUpdateService] Cache item update skipped:', key, error.message);
      }
    });

    // 强制重新获取关键查询
    try {
      await this.apolloClient.refetchQueries({
        include: ['UserByUsername', 'UserPosts']
      });
    } catch (error) {
      console.warn('[UserUpdateService] Refetch queries failed:', error);
    }
  }

  /**
   * 清理服务
   */
  cleanup() {
    this.updateCallbacks.clear();
    this.apolloClient = null;
  }
}

// 导出单例实例
export const userUpdateService = new UserUpdateService();
