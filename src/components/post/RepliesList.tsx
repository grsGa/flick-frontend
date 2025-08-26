'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Avatar from '@/components/core/Avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle, Heart, Repeat2, Share } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import Link from 'next/link';
import { Reply } from '@/graphql/types';

const GET_POST_REPLIES = gql`
  query GetPostReplies($postId: ID!, $first: Int!, $after: String) {
    post(id: $postId) {
      id
      replies(first: $first, after: $after) {
        edges {
          node {
            id
            content
            author {
              id
              username
              displayName
              avatarUrl
              isVerified
            }
            createdAt
            interaction {
              isLiked
              isBookmarked
              likeCount
              replyCount
              repostCount
              viewCount
            }
          }
          cursor
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

interface RepliesListProps {
  postId: string;
}

export default function RepliesList({ postId }: RepliesListProps) {
  const [loadingMore, setLoadingMore] = useState(false);

  const { data, loading, error, fetchMore } = useQuery(GET_POST_REPLIES, {
    variables: {
      postId,
      first: 20,
      after: null,
    },
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  const handleLoadMore = async () => {
    if (!data?.post?.replies?.pageInfo?.hasNextPage || loadingMore) return;

    setLoadingMore(true);
    try {
      await fetchMore({
        variables: {
          after: data.post.replies.pageInfo.endCursor,
        },
      });
    } catch (error) {
      console.error('[RepliesList] Error loading more replies:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { 
      addSuffix: true, 
      locale: zhCN 
    });
  };

  if (loading && !data) {
    return (
      <div className="space-y-0">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-white border-gray-200 rounded-none border-x-0 border-t-0">
            <div className="p-4">
              <div className="flex items-start space-x-3">
                <Skeleton className="h-10 w-10 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-3 w-20 bg-gray-200" />
                    <Skeleton className="h-3 w-16 bg-gray-200" />
                  </div>
                  <Skeleton className="h-4 w-full bg-gray-200" />
                  <Skeleton className="h-4 w-3/4 bg-gray-200" />
                  <div className="flex items-center space-x-4 mt-2">
                    <Skeleton className="h-6 w-12 bg-gray-200" />
                    <Skeleton className="h-6 w-12 bg-gray-200" />
                    <Skeleton className="h-6 w-12 bg-gray-200" />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-white border-gray-200 rounded-none border-x-0 border-t-0">
        <div className="p-4 text-center text-gray-500">
          <p>加载回复时出错，请刷新重试</p>
        </div>
      </Card>
    );
  }

  const replies = data?.post?.replies?.edges || [];
  const hasNextPage = data?.post?.replies?.pageInfo?.hasNextPage;

  if (replies.length === 0) {
    return null;
  }

  return (
    <div className="space-y-0">
      {replies.map(({ node: reply }) => (
        <Card key={reply.id} className="bg-white border-gray-200 rounded-none border-x-0 border-t-0 hover:bg-gray-50 transition-colors">
          <div className="p-4">
            <div className="flex items-start space-x-3">
              <Link href={`/profile/${reply.author.username}`}>
                <Avatar 
                  src={reply.author.avatarUrl || undefined}
                  alt={reply.author.displayName || reply.author.username}
                  size="md"
                />
              </Link>

              <div className="flex-1 min-w-0">
                {/* Author Info */}
                <div className="flex items-center space-x-2 mb-1">
                  <Link 
                    href={`/profile/${reply.author.username}`}
                    className="font-bold text-gray-900 hover:underline truncate"
                  >
                    {reply.author.displayName || reply.author.username}
                  </Link>
                  <Link 
                    href={`/profile/${reply.author.username}`}
                    className="text-gray-500 hover:underline truncate"
                  >
                    @{reply.author.username}
                  </Link>
                  <span className="text-gray-500">·</span>
                  <span className="text-gray-500 text-sm">
                    {formatTime(reply.createdAt)}
                  </span>
                </div>

                {/* Reply Content */}
                <div className="mb-3">
                  <p className="text-gray-900 whitespace-pre-wrap break-words">
                    {reply.content}
                  </p>
                </div>

                {/* Reply Actions */}
                <div className="flex items-center space-x-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-blue-500 hover:bg-blue-50 p-2"
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    <span className="text-sm">{reply.interaction.replyCount}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-green-500 hover:bg-green-50 p-2"
                  >
                    <Repeat2 className="h-4 w-4 mr-1" />
                    <span className="text-sm">{reply.interaction.repostCount}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className={`p-2 ${
                      reply.interaction.isLiked
                        ? 'text-red-500 hover:text-red-400 hover:bg-red-50'
                        : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
                    }`}
                  >
                    <Heart className={`h-4 w-4 mr-1 ${reply.interaction.isLiked ? 'fill-current' : ''}`} />
                    <span className="text-sm">{reply.interaction.likeCount}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-blue-500 hover:bg-blue-50 p-2"
                  >
                    <Share className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}

      {/* Load More Button */}
      {hasNextPage && (
        <Card className="bg-white border-gray-200 rounded-none border-x-0 border-t-0">
          <div className="p-4 text-center">
            <Button
              onClick={handleLoadMore}
              disabled={loadingMore}
              variant="ghost"
              className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
            >
              {loadingMore ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span>加载中...</span>
                </div>
              ) : (
                '显示更多回复'
              )}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
