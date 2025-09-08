'use client';

import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import { useCallback, useRef, useEffect, useMemo } from 'react';
import { gql } from '@apollo/client';
import { useAuth } from './useAuth';

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
  const { data, loading, error, fetchMore, refetch } = useQuery(HOME_FEED_QUERY, {
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
    refetch,
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
  const { user } = useAuth();
  
  // Optimistic UI and smart cache update
  const [createPostMutation, mutationResult] = useMutation(CREATE_POST_MUTATION, {
    update: (cache, { data }) => {
      if (!data?.createPost) return;
      
      const newPost = data.createPost;
      // Updating cache with new post
      
      try {
        // Update Home Feed
        const homeFeedData = cache.readQuery({
          query: HOME_FEED_QUERY,
          variables: { first: 10 }
        });
        
        if (homeFeedData?.homeFeed) {
          cache.writeQuery({
            query: HOME_FEED_QUERY,
            variables: { first: 10 },
            data: {
              homeFeed: {
                ...homeFeedData.homeFeed,
                edges: [
                  {
                    __typename: 'PostEdge',
                    node: newPost,
                    cursor: newPost.id
                  },
                  ...homeFeedData.homeFeed.edges
                ]
              }
            }
          });
        }
        
        // Update User Posts
        const username = newPost.author?.username;
        if (username) {
          const userPostsData = cache.readQuery({
            query: USER_POSTS_QUERY,
            variables: { username, first: 10 }
          });
          
          if (userPostsData?.userPosts) {
            cache.writeQuery({
              query: USER_POSTS_QUERY,
              variables: { username, first: 10 },
              data: {
                userPosts: {
                  ...userPostsData.userPosts,
                  edges: [
                    {
                      __typename: 'PostEdge',
                      node: newPost,
                      cursor: newPost.id
                    },
                    ...userPostsData.userPosts.edges
                  ]
                }
              }
            });
          }
        }
        
        // Cache updated successfully
      } catch (error) {
        // Cache update failed, optimistic response will handle display
        // No need for cache eviction as it disrupts user experience
      }
    },
    
    onError: (error) => {
      console.error('[useCreatePost] Mutation error:', error);
    }
  });
  
  // Create post with optimistic response
  const createPost = useCallback(async (variables: any) => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return createPostMutation({
      variables,
      optimisticResponse: {
        createPost: {
          __typename: 'Post',
          id: tempId,
          content: variables.input.content,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          visibility: variables.input.visibility || 'PUBLIC',
          replyPermission: variables.input.replyPermission || 'EVERYONE',
          parentId: variables.input.parentId || null,
          rootId: null,
          repostId: null,
          isReply: false,
          replyLevel: 0,
          hasMedia: !!(variables.input.mediaUrls?.length),
          hasPoll: false,
          author: {
            __typename: 'User',
            id: user?.id || 'temp-user-id',
            username: user?.username || 'temp-user',
            displayName: user?.displayName || user?.username || 'User',
            avatarUrl: user?.avatarUrl || null,
            isVerified: user?.isVerified || false
          },
          media: variables.input.mediaUrls?.map((url: string, index: number) => ({
            __typename: 'Media',
            id: `temp-media-${index}`,
            url,
            type: 'IMAGE', // Default assumption
            mimeType: 'image/jpeg',
            width: 0,
            height: 0,
            variants: null
          })) || [],
          mediaAttachments: [],
          mentionedUsers: [],
          tags: [],
          poll: null,
          stats: {
            __typename: 'PostStats',
            likeCount: 0,
            replyCount: 0,
            repostCount: 0,
            viewCount: 0
          },
          interaction: {
            __typename: 'Interaction',
            isLiked: false,
            isBookmarked: false,
            isReposted: false,
            likeCount: 0,
            replyCount: 0,
            repostCount: 0,
            viewCount: 0
          },
          replies: null,
          parentPost: null,
          replyMention: null
        }
      }
    });
  }, [createPostMutation, user]);

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
  const { data, loading, error, fetchMore, refetch } = useQuery(USER_REPLIES_QUERY, {
    variables: { userId, first },
    skip: !userId,
  });

  return {
    posts: data?.userReplies?.edges?.map((edge: any) => edge.node) || [],
    pageInfo: data?.userReplies?.pageInfo,
    loading,
    error,
    fetchMore,
    refetch,
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
  const { data, loading, error, fetchMore, refetch } = useQuery(USER_MEDIA_QUERY, {
    variables: { userId, first },
    skip: !userId,
  });

  return {
    posts: data?.userMedia?.edges?.map((edge: any) => edge.node) || [],
    pageInfo: data?.userMedia?.pageInfo,
    loading,
    error,
    fetchMore,
    refetch,
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
  const { data, loading, error, fetchMore, refetch } = useQuery(USER_LIKES_QUERY, {
    variables: { userId, first },
    skip: !userId,
  });

  return {
    posts: data?.userLikes?.edges?.map((edge: any) => edge.node) || [],
    pageInfo: data?.userLikes?.pageInfo,
    loading,
    error,
    fetchMore,
    refetch,
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
