import { useMutation, useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { Post, PostConnection } from '../graphql/types';

// Fragment for Post data
const POST_FRAGMENT = gql`
  fragment PostFragment on Post {
    id
    content
    author {
      id
      username
      displayName
      avatarUrl
      isVerified
    }
    parentId
    rootId
    isReply
    replyLevel
    parentPost {
      id
      author {
        id
        username
        displayName
      }
    }
    media {
      id
      url
      type
      variants {
        thumbnail {
          url
          width
          height
        }
        small {
          url
          width
          height
        }
        medium {
          url
          width
          height
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
    createdAt
    updatedAt
  }
`;

// Query to get replies for a post
const GET_POST_REPLIES = gql`
  ${POST_FRAGMENT}
  query GetPostReplies($postId: ID!, $first: Int!, $after: String) {
    postReplies(postId: $postId, first: $first, after: $after) {
      edges {
        node {
          ...PostFragment
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

// Query to get conversation thread
const GET_CONVERSATION_THREAD = gql`
  ${POST_FRAGMENT}
  query GetConversationThread($rootId: ID!, $first: Int!, $after: String) {
    conversationThread(rootId: $rootId, first: $first, after: $after) {
      edges {
        node {
          ...PostFragment
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

// Mutation to create a reply
const CREATE_REPLY = gql`
  ${POST_FRAGMENT}
  mutation CreateReply($input: CreateReplyInput!) {
    createReply(input: $input) {
      ...PostFragment
    }
  }
`;

// Mutation to delete a reply
const DELETE_REPLY = gql`
  mutation DeleteReply($replyId: ID!) {
    deleteReply(replyId: $replyId)
  }
`;

// Query to check reply permission
const CHECK_REPLY_PERMISSION = gql`
  query CheckReplyPermission($postId: ID!) {
    checkReplyPermission(postId: $postId)
  }
`;

// Hook to fetch post replies
export function usePostReplies(postId: string, first: number = 20, after?: string) {
  return useQuery(GET_POST_REPLIES, {
    variables: { postId, first, after },
    skip: !postId,
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
  });
}

// Hook to fetch conversation thread
export function useConversationThread(rootId: string, first: number = 20, after?: string) {
  return useQuery(GET_CONVERSATION_THREAD, {
    variables: { rootId, first, after },
    skip: !rootId,
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
  });
}

// Hook to create a reply
export function useCreateReply() {
  return useMutation(CREATE_REPLY, {
    update(cache, { data }) {
      if (data?.createReply) {
        const newReply = data.createReply;
        
        // 确定要更新的根帖子ID - 对于嵌套回复，需要更新根帖子的回复列表
        const rootPostId = newReply.rootId || newReply.parentId;
        
        if (rootPostId) {
          try {
            const postRepliesQuery = {
              query: GET_POST_REPLIES,
              variables: { postId: rootPostId, first: 20 }
            };
            
            const existingData = cache.readQuery<{ postReplies: PostConnection }>(postRepliesQuery);
            
            if (existingData) {
              // 将新回复添加到列表顶部（最新回复在上）
              cache.writeQuery({
                ...postRepliesQuery,
                data: {
                  postReplies: {
                    ...existingData.postReplies,
                    edges: [
                      {
                        node: newReply,
                        cursor: newReply.createdAt,
                        __typename: 'PostEdge'
                      },
                      ...existingData.postReplies.edges
                    ]
                  }
                }
              });
              console.log('Cache updated successfully for root post:', rootPostId);
            } else {
              console.log('No existing cache data found for root post:', rootPostId);
            }
          } catch (error) {
            console.log('Cache update failed:', error);
            // 备用策略：强制重新获取数据
            cache.evict({ fieldName: 'postReplies' });
          }
        }
      }
    },
    refetchQueries: (result) => {
      const rootPostId = result.data?.createReply?.rootId || result.data?.createReply?.parentId;
      return rootPostId ? [
        {
          query: GET_POST_REPLIES,
          variables: { postId: rootPostId, first: 20 }
        }
      ] : [];
    },
    errorPolicy: 'all',
  });
}

// Hook to delete a reply
export function useDeleteReply() {
  return useMutation(DELETE_REPLY, {
    update(cache, { data }, { variables }) {
      if (data?.deleteReply && variables?.replyId) {
        // Remove the reply from all relevant cache entries
        cache.evict({ id: `Post:${variables.replyId}` });
        cache.gc();
      }
    },
    errorPolicy: 'all',
  });
}

// Hook to check reply permission
export function useCheckReplyPermission(postId: string) {
  return useQuery(CHECK_REPLY_PERMISSION, {
    variables: { postId },
    skip: !postId,
    errorPolicy: 'all',
  });
}

// Types for the hooks
export interface CreateReplyInput {
  postId: string;
  content: string;
  mediaUrls?: string[];
  mentionedUsers?: string[];
}

export interface ReplyHookResult {
  replies: Post[];
  loading: boolean;
  error: any;
  hasMore: boolean;
  loadMore: () => void;
}
