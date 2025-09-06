'use client';

import { useSubscription, gql } from '@apollo/client';
import { useAuth } from './useAuth';
import { userUpdateService } from '@/services/userUpdateService';

const USER_PROFILE_UPDATED_SUBSCRIPTION = gql`
  subscription UserProfileUpdated($userId: ID!) {
    userProfileUpdated(userId: $userId) {
      id
      username
      displayName
      avatarUrl
      avatarVersion
      bio
      location
      website
      bannerUrl
    }
  }
`;

/**
 * 用户头像实时更新订阅Hook
 * 监听GraphQL Subscription，实现跨客户端的实时头像更新
 */
export function useAvatarSubscription() {
  const { user } = useAuth();

  const { data, loading, error } = useSubscription(USER_PROFILE_UPDATED_SUBSCRIPTION, {
    variables: { userId: user?.id },
    skip: !user?.id,
    onData: ({ data: subscriptionData }) => {
      const updatedUser = subscriptionData?.data?.userProfileUpdated;
      if (updatedUser && updatedUser.id === user?.id) {
        console.log('[AvatarSubscription] Received user profile update:', updatedUser);
        
        // 触发全局用户更新服务
        userUpdateService.updateUserGlobally({
          username: updatedUser.username,
          displayName: updatedUser.displayName,
          avatarUrl: updatedUser.avatarUrl,
          bio: updatedUser.bio,
          location: updatedUser.location,
          website: updatedUser.website,
          bannerUrl: updatedUser.bannerUrl,
        });
      }
    },
    onError: (error) => {
      console.error('[AvatarSubscription] Subscription error:', error);
    }
  });

  return {
    subscriptionData: data,
    loading,
    error,
    isConnected: !loading && !error
  };
}
