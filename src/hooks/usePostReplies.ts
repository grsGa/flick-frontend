import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { useState, useCallback, useMemo } from 'react';
import { GET_POST_REPLIES, CREATE_REPLY_MUTATION, DELETE_REPLY_MUTATION } from '../graphql/queries';
import { Post } from '../graphql/types';

interface UsePostRepliesOptions {
  postId: string;
  first?: number;
  enabled?: boolean;
}

interface UsePostRepliesReturn {
  replies: Post[];
  loading: boolean;
  error: any;
  hasNextPage: boolean;
  fetchMore: () => void;
  refetch: () => void;
  createReply: (content: string, parentId?: string, mediaIds?: string[]) => Promise<Post>;
  deleteReply: (replyId: string) => Promise<boolean>;
  topLevelReplies: Post[];
  nestedRepliesMap: Record<string, Post[]>;
}

export const usePostReplies = ({ 
  postId, 
  first = 20, 
  enabled = true 
}: UsePostRepliesOptions): UsePostRepliesReturn => {
  const [hasNextPage, setHasNextPage] = useState(true);

  // 查询回复列表
  const { data, loading, error, fetchMore: apolloFetchMore, refetch } = useQuery(GET_POST_REPLIES, {
    variables: { postId, first },
    skip: !enabled || !postId,
    notifyOnNetworkStatusChange: true,
    errorPolicy: 'partial',
    fetchPolicy: 'cache-and-network', // 优化缓存策略
    nextFetchPolicy: 'cache-first',
  });

  // 创建回复变更
  const [createReplyMutation] = useMutation(CREATE_REPLY_MUTATION, {
    update: (cache, { data: mutationData }) => {
      if (!mutationData?.createReply) return;

      const newReply = mutationData.createReply;
      
      // 更新回复列表缓存
      const existingData = cache.readQuery({
        query: GET_POST_REPLIES,
        variables: { postId, first },
      });

      if (existingData?.postReplies) {
        cache.writeQuery({
          query: GET_POST_REPLIES,
          variables: { postId, first },
          data: {
            postReplies: {
              ...existingData.postReplies,
              edges: [
                ...existingData.postReplies.edges,
                {
                  node: newReply,
                  cursor: newReply.createdAt,
                  __typename: 'PostEdge',
                },
              ],
            },
          },
        });
      }

      // 更新父帖子的回复统计
      cache.modify({
        id: cache.identify({ __typename: 'Post', id: postId }),
        fields: {
          interaction(existingInteraction) {
            return {
              ...existingInteraction,
              replyCount: existingInteraction.replyCount + 1,
            };
          },
        },
      });

      // 如果是嵌套回复，也更新父回复的统计
      if (newReply.parentId && newReply.parentId !== postId) {
        cache.modify({
          id: cache.identify({ __typename: 'Post', id: newReply.parentId }),
          fields: {
            interaction(existingInteraction) {
              return {
                ...existingInteraction,
                replyCount: existingInteraction.replyCount + 1,
              };
            },
          },
        });
      }
    },
    optimisticResponse: (variables) => ({
      createReply: {
        __typename: 'Post',
        id: `temp-${Date.now()}`,
        content: variables.input.content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        parentId: variables.input.parentId || postId,
        rootId: postId,
        isReply: true,
        replyLevel: variables.input.parentId && variables.input.parentId !== postId ? 2 : 1,
        author: {
          __typename: 'User',
          id: 'current-user', // 这里应该从认证状态获取
          username: 'current-user',
          displayName: 'You',
          avatarUrl: null,
          isVerified: false,
        },
        parentPost: null,
        media: [],
        interaction: {
          __typename: 'Interaction',
          isLiked: false,
          isBookmarked: false,
          isReposted: false,
          likeCount: 0,
          replyCount: 0,
          repostCount: 0,
          viewCount: 0,
        },
      },
    }),
  });

  // 删除回复变更
  const [deleteReplyMutation] = useMutation(DELETE_REPLY_MUTATION, {
    update: (cache, { data: mutationData }, { variables }) => {
      if (!mutationData?.deleteReply || !variables?.replyId) return;

      // 从缓存中移除回复
      const existingData = cache.readQuery({
        query: GET_POST_REPLIES,
        variables: { postId, first },
      });

      if (existingData?.postReplies) {
        const filteredEdges = existingData.postReplies.edges.filter(
          (edge: any) => edge.node.id !== variables.replyId
        );

        cache.writeQuery({
          query: GET_POST_REPLIES,
          variables: { postId, first },
          data: {
            postReplies: {
              ...existingData.postReplies,
              edges: filteredEdges,
            },
          },
        });

        // 更新父帖子的回复统计
        cache.modify({
          id: cache.identify({ __typename: 'Post', id: postId }),
          fields: {
            interaction(existingInteraction) {
              return {
                ...existingInteraction,
                replyCount: Math.max(0, existingInteraction.replyCount - 1),
              };
            },
          },
        });
      }

      // 从缓存中彻底移除该回复对象
      cache.evict({ id: cache.identify({ __typename: 'Post', id: variables.replyId }) });
      cache.gc();
    },
  });

  // 获取回复列表
  const replies = useMemo(() => {
    return data?.postReplies?.edges?.map((edge: any) => edge.node) || [];
  }, [data]);

  // 分组回复：顶级回复和嵌套回复
  const { topLevelReplies, nestedRepliesMap } = useMemo(() => {
    const topLevel = replies.filter((reply: Post) => reply.replyLevel === 1);
    const nested = replies.filter((reply: Post) => reply.replyLevel === 2);
    
    const nestedMap = nested.reduce((acc: Record<string, Post[]>, reply: Post) => {
      if (reply.parentId) {
        if (!acc[reply.parentId]) acc[reply.parentId] = [];
        acc[reply.parentId].push(reply);
      }
      return acc;
    }, {});

    return { topLevelReplies: topLevel, nestedRepliesMap: nestedMap };
  }, [replies]);

  // 加载更多回复
  const fetchMore = useCallback(async () => {
    if (!hasNextPage || loading) return;

    try {
      const result = await apolloFetchMore({
        variables: {
          postId,
          first,
          after: data?.postReplies?.pageInfo?.endCursor,
        },
      });

      setHasNextPage(result.data?.postReplies?.pageInfo?.hasNextPage || false);
    } catch (err) {
      console.error('Failed to fetch more replies:', err);
    }
  }, [apolloFetchMore, data, hasNextPage, loading, postId, first]);

  // 创建回复
  const createReply = useCallback(async (
    content: string, 
    parentId?: string, 
    mediaIds?: string[]
  ): Promise<Post> => {
    const result = await createReplyMutation({
      variables: {
        input: {
          postId: parentId || postId, // 如果有parentId，则回复该回复，否则回复原帖
          content,
          parentId: parentId || postId,
          mediaIds: mediaIds || [],
        },
      },
    });

    if (!result.data?.createReply) {
      throw new Error('Failed to create reply');
    }

    return result.data.createReply;
  }, [createReplyMutation, postId]);

  // 删除回复
  const deleteReply = useCallback(async (replyId: string): Promise<boolean> => {
    const result = await deleteReplyMutation({
      variables: { replyId },
    });

    return result.data?.deleteReply || false;
  }, [deleteReplyMutation]);

  return {
    replies,
    loading,
    error,
    hasNextPage: data?.postReplies?.pageInfo?.hasNextPage || false,
    fetchMore,
    refetch,
    createReply,
    deleteReply,
    topLevelReplies,
    nestedRepliesMap,
  };
};
