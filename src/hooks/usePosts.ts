import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import { gql } from '@apollo/client';

// GraphQL queries and mutations
export const HOME_FEED_QUERY = gql`
  query HomeFeed($first: Int!, $after: String) {
    homeFeed(first: $first, after: $after) {
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
          }
          interaction {
            isLiked
            isBookmarked
            isReposted
            likeCount
            commentCount
            repostCount
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

export const USER_POSTS_QUERY = gql`
  query UserPosts($username: String!, $first: Int!, $after: String) {
    userPosts(username: $username, first: $first, after: $after) {
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
          }
          interaction {
            isLiked
            isBookmarked
            isReposted
            likeCount
            commentCount
            repostCount
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

const CREATE_POST_MUTATION = gql`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      id
      content
      createdAt
      updatedAt
      visibility
      replyPermission
      hasMedia
      hasPoll
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
      }
      interaction {
        isLiked
        isBookmarked
        isReposted
        likeCount
        commentCount
        repostCount
      }
      tags
      mentionedUsers
    }
  }
`;

const LIKE_POST_MUTATION = gql`
  mutation LikePost($input: LikePostInput!) {
    likePost(input: $input) {
      isLiked
      likeCount
    }
  }
`;

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

export function useCreatePost() {
  const client = useApolloClient();
  
  console.log('[useCreatePost] Hook initialized');
  
  const [createPost, { loading, error }] = useMutation(CREATE_POST_MUTATION, {
    onCompleted: async (data) => {
      console.log('[useCreatePost] onCompleted callback triggered with data:', data);
      
      const username = data?.createPost?.author?.username;
      if (!username) {
        console.error('[useCreatePost] No username found in response');
        return;
      }

      try {
        console.log('[useCreatePost] Starting simplified cache update for username:', username);
        
        // 修复策略: 分别为不同查询使用正确的variables
        await Promise.all([
          // 刷新首页时间线 - 不需要username参数
          client.refetchQueries({
            include: [HOME_FEED_QUERY],
            variables: { first: 10, after: null }
          }),
          // 刷新用户帖子列表 - 需要username参数
          client.refetchQueries({
            include: [USER_POSTS_QUERY],
            variables: { username, first: 10, after: null }
          })
        ]);
        
        console.log('[useCreatePost] Cache refetch completed successfully');

      } catch (error) {
        console.error('[useCreatePost] Cache update failed:', error);
        
        // 简化的备用策略：只清除相关字段
        client.cache.evict({ fieldName: 'homeFeed' });
        client.cache.evict({ fieldName: 'userPosts' });
        client.cache.gc();
        console.log('[useCreatePost] Cache eviction completed');
      }
    },
    onError: (error) => {
      console.error('[useCreatePost] onError callback triggered:', error);
    }
  });

  const wrappedCreatePost = async (options: any) => {
    console.log('[useCreatePost] wrappedCreatePost called with options:', options);
    try {
      const result = await createPost(options);
      console.log('[useCreatePost] createPost returned result:', result);
      return result;
    } catch (error) {
      console.error('[useCreatePost] createPost threw error:', error);
      throw error;
    }
  };

  return {
    createPost: wrappedCreatePost,
    loading,
    error,
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
          }
          interaction {
            isLiked
            isBookmarked
            isReposted
            likeCount
            commentCount
            repostCount
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
          }
          interaction {
            isLiked
            isBookmarked
            isReposted
            likeCount
            commentCount
            repostCount
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
          }
          interaction {
            isLiked
            isBookmarked
            isReposted
            likeCount
            commentCount
            repostCount
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
