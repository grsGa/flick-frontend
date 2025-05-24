"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@apollo/client';
import { UserQueries } from '@/graphql';
import { Post } from '@/graphql/types';
import { SidebarLayout } from '@/components/layout/sidebar-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { createPageInput } from '@/lib/utils';
import PostItem from '@/components/PostItem';
import { withAuth } from '@/lib/auth-context';
import { useAuth } from '@/lib/auth-apollo-hooks';
import { withTokenPassthrough, useEnsureToken } from '@/lib/token-passthrough';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { HomeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePostDialog } from '@/components/providers/post-dialog-provider';

function HomePage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { openPostDialog } = usePostDialog();
  
  // 使用token确保hook
  useEnsureToken();
  
  // 确保用户已认证，这是安全保障措施
  useEffect(() => {
    console.log('[Home页] 认证状态检查:', { isAuthenticated: !!user });
    
    // 检查cookie中是否存在token
    const hasCookieToken = document.cookie
      .split('; ')
      .some(row => row.startsWith('auth_token='));
    
    console.log('[Home页] Cookie token检查:', { hasCookieToken });
    
    // 获取localStorage中的token
    const localToken = localStorage.getItem('auth_token');
    
    if (localToken && !hasCookieToken) {
      // 如果localStorage中有token但cookie中没有，则设置cookie
      console.log('[Home页] 从localStorage同步token到cookie');
      document.cookie = `auth_token=${localToken}; path=/; max-age=${60 * 60 * 24 * 7}`;
    }
  }, [user]);
  
  const { data, loading, error, fetchMore } = useQuery(UserQueries.GET_FEED, {
    variables: { page: createPageInput(page, 10) },
    fetchPolicy: 'network-only',
  });

  // 处理刷新
  const handleRefresh = async (): Promise<void> => {
    try {
      await fetchMore({
        variables: {
          page: createPageInput(1, 10),
        },
        updateQuery: (_, { fetchMoreResult }) => {
          return fetchMoreResult;
        },
      });
      setPage(1);
    } catch (error) {
      console.error('刷新失败:', error);
    }
  };
  
  // 处理点赞帖子
  const handleLikePost = async (postId: string) => {
    // 这里会实现点赞逻辑，现在暂时只打印信息
    console.log('点赞帖子:', postId);
  };

  // 加载更多帖子
  const loadMorePosts = useCallback(async () => {
    if (isLoadingMore || !data?.feed?.pageInfo?.hasNextPage || loading) return;
    
    setIsLoadingMore(true);
    
    try {
      await fetchMore({
        variables: {
          page: createPageInput(page + 1, 10),
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          
          return {
            feed: {
              ...fetchMoreResult.feed,
              posts: [
                ...prev.feed.posts,
                ...fetchMoreResult.feed.posts,
              ],
            },
          };
        },
      });
      
      setPage(prev => prev + 1);
    } catch (err) {
      console.error('加载更多帖子失败:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [data?.feed?.pageInfo?.hasNextPage, fetchMore, isLoadingMore, loading, page]);

  // 设置交叉观察器实现无限滚动
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loading && !isLoadingMore && data?.feed?.pageInfo?.hasNextPage) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current = observer;

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [data?.feed?.pageInfo?.hasNextPage, isLoadingMore, loadMorePosts, loading]);
  
  const posts = data?.feed?.posts || [];
  const hasMorePosts = data?.feed?.pageInfo?.hasNextPage || false;

  // 右侧推荐内容
  const RightSidebar = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>推荐关注</CardTitle>
          <CardDescription>你可能感兴趣的用户</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">这里将显示为你推荐的用户</p>
          <Button variant="outline" className="w-full mt-3 text-sm">查看更多</Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>热门话题</CardTitle>
          <CardDescription>正在讨论</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm font-medium">#技术</p>
            <p className="text-sm font-medium">#设计</p>
            <p className="text-sm font-medium">#摄影</p>
            <p className="text-sm text-muted-foreground mt-3">查看更多话题...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <SidebarLayout rightSidebar={<RightSidebar />}>
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col gap-4">
          <PullToRefresh onRefresh={handleRefresh}>
            <div className="mb-4 pt-2">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <HomeIcon className="mr-2 h-5 w-5" />
                      <CardTitle>主页</CardTitle>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-primary"
                      onClick={() => openPostDialog()}
                    >
                      发布新帖子
                    </Button>
                  </div>
                  <CardDescription>
                    查看你关注的用户的最新动态
                  </CardDescription>
                </CardHeader>
                
                {/* 帖子列表 */}
                <div className="p-4">
                  {loading && page === 1 ? (
                    // 加载状态
                    Array.from({ length: 3 }).map((_, index) => (
                      <Card key={`skeleton-${index}`} className="mb-4 p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2 animate-pulse" />
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/6 animate-pulse" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-pulse" />
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
                        </div>
                      </Card>
                    ))
                  ) : error ? (
                    // 错误状态
                    <Card className="p-6 text-center border-destructive">
                      <p className="text-destructive mb-2">加载帖子时出错</p>
                      <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
                      <Button 
                        onClick={() => handleRefresh()}
                        variant="outline"
                      >
                        重试
                      </Button>
                    </Card>
                  ) : posts.length === 0 ? (
                    // 空状态
                    <Card className="p-8 text-center border-dashed">
                      <p className="text-muted-foreground mb-2">暂无帖子</p>
                      <p className="text-xs text-muted-foreground mb-4">
                        关注更多用户或创建新帖子来丰富你的信息流
                      </p>
                      <Button
                        onClick={() => openPostDialog()}
                        className="mr-2"
                      >
                        发布帖子
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => window.location.href = '/explore'}
                      >
                        发现用户
                      </Button>
                    </Card>
                  ) : (
                    // 帖子列表
                    <>
                      {posts.map((post: Post) => (
                        <div key={post.id} className="mb-4">
                          <PostItem 
                            post={post} 
                            onLike={handleLikePost}
                          />
                        </div>
                      ))}
                      
                      {/* 加载更多指示器 */}
                      {hasMorePosts && (
                        <div 
                          ref={loadMoreRef} 
                          className="flex justify-center py-4"
                        >
                          {isLoadingMore ? (
                            <div className="flex flex-col items-center gap-2">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                              <p className="text-sm text-muted-foreground">加载更多...</p>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">向下滚动加载更多</p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </Card>
            </div>
          </PullToRefresh>
        </div>
      </div>
    </SidebarLayout>
  );
}

// 使用withAuth高阶组件保护页面，并应用token传递高阶组件
export default withTokenPassthrough(withAuth(HomePage)); 