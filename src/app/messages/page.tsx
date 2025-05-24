'use client';

import { SidebarLayout } from '@/components/layout/sidebar-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/utils';
import { withAuth } from '@/lib/auth-context';
import { getAuthHeaders } from '@/lib/auth';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { Button } from '@/components/ui/button';
import { MessageCircleIcon } from 'lucide-react';

// 消息类型（保留为将来实现消息详情页面使用）
/* 
interface Message {
  id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  sender: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
  recipient: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}
*/

// 会话类型
interface Conversation {
  id: string;
  participant: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
  last_message?: {
    content: string;
    created_at: string;
    is_read: boolean;
  };
  unread_count: number;
}

function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // 获取会话数据
  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log("开始获取消息会话...");
      const headers = await getAuthHeaders();
      
      // 判断当前访问令牌是否存在
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        console.error('获取消息会话失败：未找到访问令牌');
        setError('请先登录再查看消息');
        setIsLoading(false);
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/messages/conversations`, {
        method: 'GET',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("获取会话失败:", errorText);
        throw new Error(`获取会话失败 (${response.status}): ${errorText || '未知错误'}`);
      }
      
      const data = await response.json();
      console.log("获取到的会话数据:", data);
      
      // 处理会话数据
      const conversationsData = data.conversations || [];
      setConversations(conversationsData);
      setIsLoading(false);
      setRetryCount(0);
    } catch (error) {
      console.error("获取会话出错:", error);
      setError(error instanceof Error ? error.message : "获取消息会话时发生错误");
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
    fetchConversations();
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
          <CardTitle>消息提示</CardTitle>
          <CardDescription>如何使用消息功能</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">点击用户个人资料页中的发消息按钮，开始与其他用户私聊</p>
        </CardContent>
      </Card>
    </div>
  );

  // 如果加载出错，显示统一的错误界面
  if (error) {
    return (
      <SidebarLayout rightSidebar={<RightSidebar />}>
        <div className="text-center py-20">
          <p className="text-xl font-medium text-gray-600 dark:text-gray-400">无法加载消息</p>
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
                    <MessageCircleIcon className="mr-2 h-5 w-5" />
                    <CardTitle>消息</CardTitle>
                  </div>
                  <CardDescription>
                    {isLoading ? (
                      <p className="text-center text-muted-foreground py-4">正在加载消息...</p>
                    ) : conversations.length > 0 ? (
                      <p className="text-muted-foreground">您有 {conversations.length} 个会话</p>
                    ) : (
                      <p className="text-muted-foreground">您没有任何消息</p>
                    )}
                  </CardDescription>
                </CardHeader>
                
                <div className="p-4">
                  {!isLoading && conversations.length === 0 ? (
                    <Card className="p-8 text-center border-dashed">
                      <p className="text-muted-foreground mb-2">您的消息列表为空</p>
                      <p className="text-xs text-muted-foreground">访问用户个人资料页，点击发消息按钮开始对话</p>
                    </Card>
                  ) : isLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="text-sm text-muted-foreground">正在加载消息...</p>
                      </div>
                    </div>
                  ) : (
                    conversations.map((conversation) => (
                      <Card key={conversation.id} className="mb-2 hover:bg-accent transition-colors cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <img 
                                src={conversation.participant.avatar_url || '/placeholder-avatar.png'} 
                                alt={conversation.participant.display_name || conversation.participant.username}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                              {conversation.unread_count > 0 && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-blue-500 text-white text-xs">
                                  {conversation.unread_count}
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">
                                {conversation.participant.display_name || conversation.participant.username}
                              </p>
                              {conversation.last_message && (
                                <p className={`text-sm ${conversation.unread_count > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'} truncate`}>
                                  {conversation.last_message.content}
                                </p>
                              )}
                            </div>
                            {conversation.last_message && (
                              <p className="text-xs text-muted-foreground">
                                {new Date(conversation.last_message.created_at).toLocaleString('zh-CN', {
                                  month: 'numeric',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            )}
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

export default withAuth(MessagesPage); 