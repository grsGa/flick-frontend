'use client';

import { SidebarLayout } from '@/components/layout/sidebar-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL, fixMinioUrl, fetchWithDebug } from '@/lib/utils';
import { withAuth } from '@/lib/auth-context';
import { getAuthHeaders } from '@/lib/auth';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { PostCard } from '@/components/ui/post-card';
import { Button } from '@/components/ui/button';
import { BookmarkIcon } from 'lucide-react';

// 媒体文件类型
interface MediaFile {
  url: string;
  type: 'image' | 'video';
  description?: string;
}

// 用户信息类型
interface User {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  verified_email?: boolean;
}

// 帖子类型
interface Post {
  id: string;
  content: string;
  user: User;
  user_id?: string;
  created_at: string;
  media_files?: MediaFile[];
  like_count?: number;
  comment_count?: number;
  share_count?: number;
  permalink_id?: string;
  is_saved?: boolean;
  is_liked?: boolean;
}

function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  // 添加处理状态，避免中间状态导致的闪烁
  const [isProcessing, setIsProcessing] = useState(false);
  // 添加ref检查组件是否已挂载
  const isMounted = useRef(true);

  // 使用useCallback缓存获取书签的函数
  const fetchBookmarks = async () => {
    if (!isMounted.current) return;
    
    try {
      setIsLoading(true);
      setError(null);
      // 添加处理状态
      setIsProcessing(true);
      
      console.log("开始获取书签...");
      const headers = await getAuthHeaders();
      
      // 判断当前访问令牌是否存在
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        console.error('获取书签失败：未找到访问令牌');
        setError('请先登录再查看书签');
        setIsLoading(false);
        setIsProcessing(false);
        return;
      }
      
      // 打印详细的请求信息
      console.log(`正在请求书签API: ${API_BASE_URL}/users/me/bookmarks`, {
        headers: {
          'Authorization': typeof headers === 'object' && 'Authorization' in headers ? 
            `Bearer ${String(headers['Authorization']).substring(0, 15)}...` : 'N/A', // 部分显示token保护隐私
          'Content-Type': typeof headers === 'object' && 'Content-Type' in headers ? 
            String(headers['Content-Type']) : 'N/A'
        }
      });
      
      // 尝试主路由API请求
      try {
        console.log("使用主API: /users/me/bookmarks");
        const response = await fetchWithDebug(`${API_BASE_URL}/users/me/bookmarks`, {
          method: 'GET',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          cache: 'no-store'
        });
        
        if (!response.ok) {
          console.error(`主API调用失败: ${response.status} ${response.statusText}`);
          
          // 尝试备用API
          console.log("主API失败，尝试备用API: /content/bookmarks");
          const backupResponse = await fetchWithDebug(`${API_BASE_URL}/content/bookmarks`, {
            method: 'GET',
            headers: {
              ...headers,
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            cache: 'no-store'
          });
          
          if (!backupResponse.ok) {
            console.error(`备用API也失败: ${backupResponse.status} ${backupResponse.statusText}`);
            
            try {
              const errorBody = await backupResponse.text();
              console.error("备用API错误详情:", errorBody);
            } catch (e) {
              console.error("无法读取备用API错误详情:", e);
            }
            
            if (isMounted.current) {
              setError(`获取书签失败 (${backupResponse.status}): ${backupResponse.statusText}`);
              setIsLoading(false);
              setIsProcessing(false);
            }
            return;
          }
          
          const backupData = await backupResponse.json();
          console.log("从备用API获取到的书签数据:", backupData);
          
          // 处理备用API返回的数据
          if (isMounted.current) {
            const backupBookmarks = backupData.posts || [];
            processAndSetBookmarks(backupBookmarks);
          }
          return;
        }
        
        const responseData = await response.json();
        console.log("从主API获取到的书签数据:", responseData);
        
        // 确保我们获取的是正确的数据结构
        if (isMounted.current) {
          const bookmarksData = responseData.posts || [];
          processAndSetBookmarks(bookmarksData);
        }
        
      } catch (apiError) {
        console.error("API调用异常:", apiError);
        
        if (isMounted.current) {
          setError(`获取书签失败: ${apiError instanceof Error ? apiError.message : '未知错误'}`);
          setIsLoading(false);
          setIsProcessing(false);
          
          if (retryCount < maxRetries) {
            const retryDelay = (retryCount + 1) * 2000;
            console.log(`将在 ${retryDelay/1000} 秒后进行第 ${retryCount + 1} 次重试`);
            
            setTimeout(() => {
              if (isMounted.current) {
                setRetryCount(prev => prev + 1);
              }
            }, retryDelay);
          }
        }
      }
    } catch (outerError) {
      console.error("获取书签外层错误:", outerError);
      
      if (isMounted.current) {
        setError(`获取书签失败: ${outerError instanceof Error ? outerError.message : '未知错误'}`);
        setIsLoading(false);
        setIsProcessing(false);
      }
    }
  };

  // 处理和设置书签数据
  const processAndSetBookmarks = (bookmarksData: Post[]) => {
    if (!isMounted.current) return;
    
    try {
      console.log(`获取到 ${bookmarksData.length} 条书签`);
      
      // 确保媒体URL正确处理，并将所有书签标记为已保存
      const processedBookmarks = bookmarksData
        .filter(post => post && typeof post === 'object') // 过滤无效的数据
        .map((post: Post) => {
          if (!post || typeof post !== 'object') {
            console.error('收到无效的书签数据:', post);
            return null;
          }
          
          if (!post.user || typeof post.user !== 'object') {
            console.warn(`书签 ${post.id} 缺少用户信息:`, post);
            post.user = {
              id: post.user_id || 'unknown',
              username: 'unknown',
              display_name: '未知用户'
            };
          }
          
          if (!post.permalink_id) {
            console.warn(`书签 ${post.id} 缺少permalink_id，将使用ID代替`);
            post.permalink_id = post.id;
          }
          
          // 标记为已保存
          post.is_saved = true;
          
          if (post.media_files && Array.isArray(post.media_files) && post.media_files.length > 0) {
            return {
              ...post,
              media_files: post.media_files
                .filter(file => file && file.url) // 过滤无效的媒体文件
                .map((file: MediaFile) => {
                  if (!file || !file.url) {
                    console.warn(`书签 ${post.id} 包含无效的媒体文件:`, file);
                    return file;
                  }
                  return {
                    ...file,
                    url: fixMinioUrl(file.url)
                  };
              })
            };
          }
          return post;
        })
        .filter(Boolean) as Post[]; // 过滤掉处理过程中变为null的项
      
      // 使用深拷贝确保数据独立
      const finalBookmarks = JSON.parse(JSON.stringify(processedBookmarks));
      setBookmarks(finalBookmarks);
      setIsLoading(false);
      setRetryCount(0);
      
      // 处理完成
      setIsProcessing(false);
    } catch (error) {
      console.error('处理书签数据出错:', error);
      setBookmarks([]);
      setIsLoading(false);
      setIsProcessing(false);
    }
  };

  // 使用useEffect监听重试计数变化
  useEffect(() => {
    fetchBookmarks();
    
    // 设置定期刷新 - 每10分钟刷新一次
    const refreshInterval = setInterval(() => {
      console.log("定期刷新书签数据...");
      if (isMounted.current) {
        fetchBookmarks();
      }
    }, 10 * 60 * 1000); // 10分钟
    
    // 组件卸载时清理
    return () => {
      isMounted.current = false;
      clearInterval(refreshInterval);
    };
  }, [retryCount]);

  // 手动刷新处理
  const handleRefresh = async (): Promise<void> => {
    if (isProcessing) return;
    setRetryCount(0);
  };

  // 右侧推荐内容
  const RightSidebar = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>书签提示</CardTitle>
          <CardDescription>如何使用书签功能</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">在帖子详情页中点击书签图标，将帖子添加到您的书签中</p>
        </CardContent>
      </Card>
    </div>
  );

  // 如果加载出错，显示统一的错误界面
  if (error) {
    return (
      <SidebarLayout rightSidebar={<RightSidebar />}>
        <div className="text-center py-20">
          <p className="text-xl font-medium text-gray-600 dark:text-gray-400">无法加载书签</p>
          <p className="text-gray-500 dark:text-gray-500 mt-2">请检查网络连接并重试</p>
          <Button onClick={() => setRetryCount(0)} className="mt-6">重试</Button>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout rightSidebar={<RightSidebar />}>
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col gap-4">
          <PullToRefresh onRefresh={handleRefresh}>
            <div className="mb-4 pt-2">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center">
                    <BookmarkIcon className="mr-2 h-5 w-5" />
                    <CardTitle>我的书签</CardTitle>
                  </div>
                  <CardDescription>
                    {isLoading || isProcessing ? (
                      <p className="text-center text-muted-foreground py-4">正在加载书签...</p>
                    ) : bookmarks.length > 0 ? (
                      <p className="text-muted-foreground">您已收藏 {bookmarks.length} 条帖子</p>
                    ) : (
                      <p className="text-muted-foreground">您还没有收藏任何帖子</p>
                    )}
                  </CardDescription>
                </CardHeader>
                
                <div className="p-4">
                  {!isLoading && !isProcessing && bookmarks.length === 0 ? (
                    <Card className="p-8 text-center border-dashed">
                      <p className="text-muted-foreground mb-2">您的书签列表为空</p>
                      <p className="text-xs text-muted-foreground">浏览内容时，点击书签图标收藏感兴趣的帖子</p>
                    </Card>
                  ) : isLoading || isProcessing ? (
                    <div className="flex justify-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="text-sm text-muted-foreground">正在处理书签数据...</p>
                      </div>
                    </div>
                  ) : (
                    bookmarks.map((post) => (
                      <PostCard
                        key={post.id}
                        id={post.id}
                        permalink_id={post.permalink_id}
                        user={post.user}
                        content={post.content}
                        created_at={post.created_at}
                        media_files={post.media_files}
                        like_count={post.like_count || 0}
                        comment_count={post.comment_count || 0}
                        share_count={post.share_count || 0}
                        isLiked={post.is_liked || false}
                        isSaved={true}
                        className="mb-4"
                      />
                    ))
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

export default withAuth(BookmarksPage); 