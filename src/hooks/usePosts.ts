'use client';

import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import { useCallback, useRef, useEffect, useMemo } from 'react';
import { gql } from '@apollo/client';

// Import GraphQL queries from shared file
import { 
  HOME_FEED_QUERY, 
  USER_POSTS_QUERY, 
  GET_TIMELINE, 
  GET_FOLLOWING_TIMELINE, 
  CREATE_POST_MUTATION, 
  LIKE_POST_MUTATION 
} from '../graphql/queries';

// Re-export for backward compatibility
export { 
  HOME_FEED_QUERY, 
  USER_POSTS_QUERY, 
  CREATE_POST_MUTATION, 
  LIKE_POST_MUTATION 
} from '../graphql/queries';






export function useHomeFeed(first: number = 10, after?: string) {
  const { data, loading, error, fetchMore } = useQuery(HOME_FEED_QUERY, {
    variables: { first, after },
    fetchPolicy: 'cache-and-network', // 总是从网络获取最新数据
    notifyOnNetworkStatusChange: true,
  });

  return {
    posts: data?.homeFeed?.edges?.map((edge: any) => edge.node) || [],
    pageInfo: data?.homeFeed?.pageInfo,
    loading,
    error,
    fetchMore,
  };
}

export function useUserPosts(username: string, first: number = 10, after?: string) {
  const { data, loading, error, fetchMore, refetch } = useQuery(USER_POSTS_QUERY, {
    variables: { username, first, after },
    fetchPolicy: 'cache-and-network', // 总是从网络获取最新数据
    notifyOnNetworkStatusChange: true,
    errorPolicy: 'all', // 即使有错误也返回部分数据
    // 确保查询在用户名变化时重新执行
    skip: !username,
  });

  return {
    posts: data?.userPosts?.edges?.map((edge: any) => edge.node) || [],
    pageInfo: data?.userPosts?.pageInfo,
    loading,
    error,
    fetchMore,
    refetch, // 暴露refetch方法供外部调用
  };
}

// Create a stable hook instance to prevent re-initialization
let hookInstance: any = null;

export function useCreatePost() {
  const client = useApolloClient();
  
  // Only log initialization once per component lifecycle
  const initRef = useRef(false);
  if (!initRef.current) {
    console.log('[useCreatePost] Hook initialized');
    initRef.current = true;
  }
  
  // Simplified and optimized cache update callback
  const onCompleted = useCallback((data: any) => {
    const username = data?.createPost?.author?.username;
    if (!username) return;

    // Use setTimeout to prevent blocking the UI and avoid render loops
    setTimeout(() => {
      try {
        // Simple cache eviction instead of complex refetch operations
        client.cache.evict({ fieldName: 'homeFeed' });
        client.cache.evict({ fieldName: 'userPosts', args: { username } });
        client.cache.gc();
      } catch (error) {
        console.error('[useCreatePost] Cache update failed:', error);
      }
    }, 0);
  }, [client]);

  const onError = useCallback((error: any) => {
    console.error('[useCreatePost] onError callback triggered:', error);
  }, []);
  
  // Use useMutation with stable callbacks
  const [createPostMutation, mutationResult] = useMutation(CREATE_POST_MUTATION, {
    onCompleted,
    onError
  });
  
  // Create a stable createPost function
  const createPost = useCallback(async (options: any) => {
    try {
      return await createPostMutation(options);
    } catch (error) {
      console.error('[useCreatePost] createPostMutation threw error:', error);
      throw error;
    }
  }, [createPostMutation]);

  return {
    createPost,
    loading: mutationResult.loading,
    error: mutationResult.error,
  };
}

export function useLikePost() {
  const [likePost, { loading, error }] = useMutation(LIKE_POST_MUTATION);

  return {
    likePost,
    loading,
    error,
  };
}

const USER_REPLIES_QUERY = gql`
  query UserReplies($userId: ID!, $first: Int!, $after: String) {
    userReplies(userId: $userId, first: $first, after: $after) {
      edges {
        node {
          id
          content
          createdAt
          author {
            id
            username
            displayName
            avatarUrl
            isVerified
          }
          media {
            id
            url
            type
            mimeType
            width
            height
            variants {
              thumbnail {
                url
                width
                height
                size
              }
              small {
                url
                width
                height
                size
              }
              medium {
                url
                width
                height
                size
              }
              large {
                url
                width
                height
                size
              }
              original {
                url
                width
                height
                size
              }
            }
          }
          interaction {
            isLiked
            isBookmarked
            isReposted
            likeCount
            replyCount
            repostCount
            viewCount
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export function useUserReplies(userId: string, first: number = 10) {
  const { data, loading, error, fetchMore } = useQuery(USER_REPLIES_QUERY, {
    variables: { userId, first },
    skip: !userId,
  });

  return {
    posts: data?.userReplies?.edges?.map((edge: any) => edge.node) || [],
    pageInfo: data?.userReplies?.pageInfo,
    loading,
    error,
    fetchMore,
  };
}

const USER_MEDIA_QUERY = gql`
  query UserMedia($userId: ID!, $first: Int!, $after: String) {
    userMedia(userId: $userId, first: $first, after: $after) {
      edges {
        node {
          id
          content
          createdAt
          author {
            id
            username
            displayName
            avatarUrl
            isVerified
          }
          media {
            id
            url
            type
            mimeType
            width
            height
            variants {
              thumbnail {
                url
                width
                height
                size
              }
              small {
                url
                width
                height
                size
              }
              medium {
                url
                width
                height
                size
              }
              large {
                url
                width
                height
                size
              }
              original {
                url
                width
                height
                size
              }
            }
          }
          interaction {
            isLiked
            isBookmarked
            isReposted
            likeCount
            replyCount
            repostCount
            viewCount
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export function useUserMedia(userId: string, first: number = 10) {
  const { data, loading, error, fetchMore } = useQuery(USER_MEDIA_QUERY, {
    variables: { userId, first },
    skip: !userId,
  });

  return {
    posts: data?.userMedia?.edges?.map((edge: any) => edge.node) || [],
    pageInfo: data?.userMedia?.pageInfo,
    loading,
    error,
    fetchMore,
  };
}

const USER_LIKES_QUERY = gql`
  query UserLikes($userId: ID!, $first: Int!, $after: String) {
    userLikes(userId: $userId, first: $first, after: $after) {
      edges {
        node {
          id
          content
          createdAt
          author {
            id
            username
            displayName
            avatarUrl
            isVerified
          }
          media {
            id
            url
            type
            mimeType
            width
            height
            variants {
              thumbnail {
                url
                width
                height
                size
              }
              small {
                url
                width
                height
                size
              }
              medium {
                url
                width
                height
                size
              }
              large {
                url
                width
                height
                size
              }
              original {
                url
                width
                height
                size
              }
            }
          }
          interaction {
            isLiked
            isBookmarked
            isReposted
            likeCount
            replyCount
            repostCount
            viewCount
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export function useUserLikes(userId: string, first: number = 10) {
  const { data, loading, error, fetchMore } = useQuery(USER_LIKES_QUERY, {
    variables: { userId, first },
    skip: !userId,
  });

  return {
    posts: data?.userLikes?.edges?.map((edge: any) => edge.node) || [],
    pageInfo: data?.userLikes?.pageInfo,
    loading,
    error,
    fetchMore,
  };
}

// Hook for following timeline (关注用户的帖子)
export const useFollowingFeed = (first: number = 20) => {
  const { data, loading, error, fetchMore, refetch } = useQuery(GET_FOLLOWING_TIMELINE, {
    variables: { first },
    notifyOnNetworkStatusChange: true,
  });

  return {
    posts: data?.followingTimeline?.edges?.map((edge: any) => edge.node) || [],
    loading,
    error,
    pageInfo: data?.followingTimeline?.pageInfo,
    fetchMore: (cursor: string) =>
      fetchMore({
        variables: { first, after: cursor },
      }),
    refetch,
  };
}
