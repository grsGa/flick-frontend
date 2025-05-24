'use client';

import { SidebarLayout } from '@/components/layout/sidebar-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/utils';
import { withAuth } from '@/lib/auth-context';
import { getAuthHeaders } from '@/lib/auth';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { Button } from '@/components/ui/button';
import { BellIcon } from 'lucide-react';

// 通知类型
interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'system';
  content: string;
  created_at: string;
  is_read: boolean;
  actor?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
  target_id?: string;
  target_type?: 'post' | 'comment' | 'user';
}

function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // 获取通知数据
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log("开始获取通知...");
      const headers = await getAuthHeaders();
      
      // 判断当前访问令牌是否存在
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        console.error('获取通知失败：未找到访问令牌');
        setError('请先登录再查看通知');
        setIsLoading(false);
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/notifications`, {
        method: 'GET',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("获取通知失败:", errorText);
        throw new Error(`获取通知失败 (${response.status}): ${errorText || '未知错误'}`);
      }
      
      const data = await response.json();
      console.log("获取到的通知数据:", data);
      
      // 处理通知数据
      const notificationsData = data.notifications || [];
      setNotifications(notificationsData);
      setIsLoading(false);
      setRetryCount(0);
    } catch (error) {
      console.error("获取通知出错:", error);
      setError(error instanceof Error ? error.message : "获取通知时发生错误");
      setIsLoading(false);
      
      // 如果未达到最大重试次数，尝试重新获取
      if (retryCount < maxRetries) {
        const retryDelay = (retryCount + 1) * 2000;
        console.log(`将在 ${retryDelay/1000} 秒后进行第 ${retryCount + 1} 次重试`);
        
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, retryDelay);
      }
    }
  };

  // 使用useEffect监听重试计数变化
  useEffect(() => {
    fetchNotifications();
  }, [retryCount]);

  // 手动刷新处理
  const handleRefresh = async (): Promise<void> => {
    setRetryCount(0);
  };

  // 右侧推荐内容
  const RightSidebar = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>通知提示</CardTitle>
          <CardDescription>如何使用通知功能</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">打开通知允许您接收关注、点赞和评论的实时提醒</p>
        </CardContent>
      </Card>
    </div>
  );

  // 如果加载出错，显示统一的错误界面
  if (error) {
    return (
      <SidebarLayout rightSidebar={<RightSidebar />}>
        <div className="text-center py-20">
          <p className="text-xl font-medium text-gray-600 dark:text-gray-400">无法加载通知</p>
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
                    <BellIcon className="mr-2 h-5 w-5" />
                    <CardTitle>通知</CardTitle>
                  </div>
                  <CardDescription>
                    {isLoading ? (
                      <p className="text-center text-muted-foreground py-4">正在加载通知...</p>
                    ) : notifications.length > 0 ? (
                      <p className="text-muted-foreground">您有 {notifications.length} 条通知</p>
                    ) : (
                      <p className="text-muted-foreground">您没有任何通知</p>
                    )}
                  </CardDescription>
                </CardHeader>
                
                <div className="p-4">
                  {!isLoading && notifications.length === 0 ? (
                    <Card className="p-8 text-center border-dashed">
                      <p className="text-muted-foreground mb-2">您的通知列表为空</p>
                      <p className="text-xs text-muted-foreground">当有用户关注您、点赞或评论您的内容时，通知将显示在这里</p>
                    </Card>
                  ) : isLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="text-sm text-muted-foreground">正在加载通知...</p>
                      </div>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <Card key={notification.id} className="mb-2 hover:bg-accent transition-colors cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${notification.is_read ? 'bg-transparent' : 'bg-blue-500'}`}></div>
                            <div className="flex-1">
                              <p className="text-sm">{notification.content}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(notification.created_at).toLocaleString('zh-CN')}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
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

export default withAuth(NotificationsPage); 