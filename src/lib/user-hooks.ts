import { useState, useCallback } from 'react';
import { useQuery, useMutation, ApolloError } from '@apollo/client';
import { 
  UserQueries,
  UserMutations
} from '@/graphql';
import { PageInput, Post, User, UpdateProfileInput } from '@/graphql/types';
import { createPageInput, formatGraphQLError } from '@/lib/utils';
import { useAuth } from './auth-context';
import { updateUserInLocalStorage } from './auth';

// 用户资料响应类型
export interface UserProfileResponse {
  user: User | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// 帖子列表响应类型
export interface PostsResponse {
  posts: Post[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
}

/**
 * 获取当前登录用户的Hook
 * @returns 当前用户信息响应对象
 */
export function useCurrentUser(): UserProfileResponse {
  // 使用AuthContext提供的用户信息
  const { user: authUser, loading: authLoading } = useAuth();
  
  const { data, loading: queryLoading, error, refetch } = useQuery(UserQueries.GET_ME, {
    fetchPolicy: 'network-only',
    skip: !authUser, // 如果没有用户登录，跳过查询
  });

  return {
    user: data?.me || authUser,
    loading: authLoading || queryLoading,
    error: error ? formatGraphQLError(error) : null,
    refetch: async () => { await refetch(); }
  };
}

/**
 * 获取用户资料的Hook
 * @param username 用户名
 * @returns 用户资料响应对象
 */
export function useUserProfile(username: string): UserProfileResponse {
  const { data, loading, error, refetch } = useQuery(UserQueries.GET_USER_PROFILE, {
    variables: { username },
    skip: !username,
    fetchPolicy: 'network-only',
  });

  return {
    user: data?.userByUsername || null,
    loading,
    error: error ? formatGraphQLError(error) : null,
    refetch: async () => { await refetch(); }
  };
}

/**
 * 获取用户帖子列表的Hook
 * @param username 用户名
 * @param page 页码
 * @param limit 每页数量
 * @returns 用户帖子列表
 */
export function useUserPosts(username: string, page = 1, limit = 10): PostsResponse {
  const pageInput: PageInput = createPageInput(page, limit);
  
  const { data, loading, error } = useQuery(UserQueries.GET_USER_POSTS, { 
    variables: { username, page: pageInput },
    skip: !username,
    fetchPolicy: 'network-only',
  });

  return {
    posts: data?.userPosts?.posts || [],
    loading,
    error: error ? formatGraphQLError(error) : null,
    hasMore: !!data?.userPosts?.pageInfo?.hasNextPage
  };
}

/**
 * 获取用户关注者列表的Hook
 * @param userId 用户ID
 * @param page 页码
 * @param limit 每页数量
 * @returns 关注者列表响应
 */
export function useUserFollowers(userId: string, page = 1, limit = 10) {
  const pageInput: PageInput = createPageInput(page, limit);
  
  const { data, loading, error } = useQuery(UserQueries.GET_FOLLOWERS, {
    variables: { id: userId, page: pageInput },
    skip: !userId,
    fetchPolicy: 'network-only',
  });

  return {
    followers: data?.user?.followers?.users || [],
    loading,
    error: error ? formatGraphQLError(error) : null,
    hasMore: !!data?.user?.followers?.pageInfo?.hasNextPage,
    totalCount: data?.user?.followers?.pageInfo?.totalCount || 0
  };
}

/**
 * 获取用户正在关注的列表的Hook
 * @param userId 用户ID
 * @param page 页码
 * @param limit 每页数量
 * @returns 关注列表响应
 */
export function useUserFollowing(userId: string, page = 1, limit = 10) {
  const pageInput: PageInput = createPageInput(page, limit);

  const { data, loading, error } = useQuery(UserQueries.GET_FOLLOWING, {
    variables: { id: userId, page: pageInput },
    skip: !userId,
    fetchPolicy: 'network-only',
  });

  return {
    following: data?.user?.following?.users || [],
    loading,
    error: error ? formatGraphQLError(error) : null,
    hasMore: !!data?.user?.following?.pageInfo?.hasNextPage,
    totalCount: data?.user?.following?.pageInfo?.totalCount || 0
  };
}

/**
 * 关注/取消关注用户的Hook
 * @returns 关注相关的状态和操作函数
 */
export function useFollowUser() {
  const [followUser, { loading: followLoading }] = useMutation(UserMutations.FOLLOW_USER);
  const [unfollowUser, { loading: unfollowLoading }] = useMutation(UserMutations.UNFOLLOW_USER);
  const [error, setError] = useState<string | null>(null);
  
  // 关注用户的函数
  const follow = async (userId: string) => {
    try {
      setError(null);
      await followUser({ 
        variables: { userId },
        refetchQueries: ['Me', 'UserByUsername', 'User'] // 刷新相关查询
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof ApolloError ? formatGraphQLError(err) : '关注用户失败';
      setError(errorMessage);
      return false;
    }
  };
  
  // 取消关注用户的函数
  const unfollow = async (userId: string) => {
    try {
      setError(null);
      await unfollowUser({ 
        variables: { userId },
        refetchQueries: ['Me', 'UserByUsername', 'User'] // 刷新相关查询
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof ApolloError ? formatGraphQLError(err) : '取消关注用户失败';
      setError(errorMessage);
      return false;
    }
  };
  
  return {
    follow,
    unfollow,
    loading: followLoading || unfollowLoading,
    error
  };
}

/**
 * 检查当前用户是否正在关注指定用户
 * @param username 要检查的用户名
 */
export function useIsFollowing(username: string) {
  const { data, loading } = useQuery(UserQueries.GET_USER_PROFILE, {
    variables: { username },
    skip: !username,
    fetchPolicy: 'cache-first',
  });
  
  return {
    isFollowing: data?.userByUsername?.isFollowing || false,
    loading
  };
}

/**
 * 更新用户资料的Hook
 */
export function useUpdateProfile() {
  const [updateProfile, { loading }] = useMutation(UserMutations.UPDATE_PROFILE);
  const [error, setError] = useState<string | null>(null);
  
  const update = useCallback(async (input: UpdateProfileInput) => {
    try {
      setError(null);
      const { data } = await updateProfile({ 
        variables: { input },
        refetchQueries: ['Me']
      });
      
      if (data?.updateProfile) {
        // 更新本地用户状态
        updateUserInLocalStorage(data.updateProfile);
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = err instanceof ApolloError ? formatGraphQLError(err) : '更新资料失败';
      setError(errorMessage);
      return false;
    }
  }, [updateProfile]);
  
  return {
    updateProfile: update,
    loading,
    error
  };
}

/**
 * 检查当前用户是否为指定用户
 * @param username 要检查的用户名
 */
export function useIsCurrentUser(username: string | undefined) {
  const { user: currentUser } = useAuth();
  
  // 如果没有传入用户名或当前没有登录用户，返回false
  if (!username || !currentUser) return false;
  
  // 检查用户名是否匹配
  return currentUser.username.toLowerCase() === username.toLowerCase();
}

/**
 * 获取用户喜欢的帖子
 * @param username 用户名
 * @param page 页码
 * @param limit 每页数量
 */
export function useUserLikedPosts(username: string, page = 1, limit = 10): PostsResponse {
  const pageInput: PageInput = createPageInput(page, limit);
  
  const { data, loading, error } = useQuery(UserQueries.GET_USER_LIKED_POSTS, {
    variables: { username, page: pageInput },
    skip: !username,
    fetchPolicy: 'network-only',
  });
  
  return {
    posts: data?.userLikedPosts?.posts || [],
    loading,
    error: error ? formatGraphQLError(error) : null,
    hasMore: !!data?.userLikedPosts?.pageInfo?.hasNextPage
  };
}

/**
 * 获取用户保存的帖子
 * @param page 页码
 * @param limit 每页数量
 */
export function useUserSavedPosts(page = 1, limit = 10): PostsResponse {
  const pageInput: PageInput = createPageInput(page, limit);
  
  const { data, loading, error } = useQuery(UserQueries.GET_USER_SAVED_POSTS, {
    variables: { page: pageInput },
    fetchPolicy: 'network-only',
  });
  
  return {
    posts: data?.userSavedPosts?.posts || [],
    loading,
    error: error ? formatGraphQLError(error) : null,
    hasMore: !!data?.userSavedPosts?.pageInfo?.hasNextPage
  };
}

/**
 * 获取谁喜欢了帖子
 * @param postId 帖子ID
 * @param page 页码
 * @param limit 每页数量
 */
export function usePostLikes(postId: string, page = 1, limit = 10) {
  const pageInput: PageInput = createPageInput(page, limit);
  
  const { data, loading, error } = useQuery(UserQueries.GET_POST_LIKES, {
    variables: { postId, page: pageInput },
    skip: !postId,
    fetchPolicy: 'network-only',
  });
  
  return {
    users: data?.postLikes?.users || [],
    loading,
    error: error ? formatGraphQLError(error) : null,
    hasMore: !!data?.postLikes?.pageInfo?.hasNextPage,
    totalCount: data?.postLikes?.pageInfo?.totalCount || 0
  };
}

/**
 * 获取推荐关注的用户
 * @param limit 推荐数量
 */
export function useSuggestedUsers(limit = 5) {
  const { data, loading, error } = useQuery(UserQueries.GET_SUGGESTED_USERS, {
    variables: { limit },
    fetchPolicy: 'network-only',
  });
  
  return {
    users: data?.suggestedUsers || [],
    loading,
    error: error ? formatGraphQLError(error) : null
  };
} 