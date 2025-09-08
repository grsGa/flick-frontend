import { useEffect } from 'react';
import { useSubscription } from '@apollo/client';
import { useApolloClient } from '@apollo/client';
import { POST_CREATED_SUBSCRIPTION, HOME_FEED_QUERY, USER_POSTS_QUERY } from '../graphql/queries';

interface PostCreatedData {
  postCreated: {
    post: any;
    eventType: string;
    createdAt: string;
  };
}

interface UsePostSubscriptionsOptions {
  enabled?: boolean;
  userId?: string;
}

export const usePostSubscriptions = (options: UsePostSubscriptionsOptions = {}) => {
  const { enabled = true, userId } = options;
  const client = useApolloClient();

  // 订阅新帖子创建事件
  const { data: postCreatedData, loading, error } = useSubscription<PostCreatedData>(
    POST_CREATED_SUBSCRIPTION,
    {
      skip: !enabled,
      onSubscriptionData: ({ subscriptionData }) => {
        if (!subscriptionData.data?.postCreated) return;

        const { post } = subscriptionData.data.postCreated;
        // New post received via subscription

        // 更新首页缓存
        updateHomeFeedCache(post);

        // 如果是当前用户的帖子，更新用户帖子缓存
        if (userId && post.author.id === userId) {
          updateUserPostsCache(post, userId);
        }
      },
    }
  );

  // 更新首页缓存
  const updateHomeFeedCache = (newPost: any) => {
    try {
      const existingData = client.readQuery({
        query: HOME_FEED_QUERY,
        variables: { first: 20 }
      });

      if (existingData?.homeFeed?.edges) {
        // 检查帖子是否已存在（避免重复）
        const postExists = existingData.homeFeed.edges.some(
          (edge: any) => edge.node.id === newPost.id
        );

        if (!postExists) {
          const newEdge = {
            __typename: 'PostEdge',
            node: newPost,
            cursor: newPost.id
          };

          client.writeQuery({
            query: HOME_FEED_QUERY,
            variables: { first: 20 },
            data: {
              homeFeed: {
                ...existingData.homeFeed,
                edges: [newEdge, ...existingData.homeFeed.edges],
              }
            }
          });

          // Home feed cache updated successfully
        }
      }
    } catch (error) {
      // Home feed cache not available, skipping update
    }
  };

  // 更新用户帖子缓存
  const updateUserPostsCache = (newPost: any, authorId: string) => {
    try {
      const existingData = client.readQuery({
        query: USER_POSTS_QUERY,
        variables: { userId: authorId, first: 20 }
      });

      if (existingData?.userPosts?.edges) {
        // 检查帖子是否已存在（避免重复）
        const postExists = existingData.userPosts.edges.some(
          (edge: any) => edge.node.id === newPost.id
        );

        if (!postExists) {
          const newEdge = {
            __typename: 'PostEdge',
            node: newPost,
            cursor: newPost.id
          };

          client.writeQuery({
            query: USER_POSTS_QUERY,
            variables: { userId: authorId, first: 20 },
            data: {
              userPosts: {
                ...existingData.userPosts,
                edges: [newEdge, ...existingData.userPosts.edges],
              }
            }
          });

          // User posts cache updated successfully
        }
      }
    } catch (error) {
      // User posts cache not available, skipping update
    }
  };

  return {
    loading,
    error,
    postCreatedData
  };
};

export default usePostSubscriptions;
