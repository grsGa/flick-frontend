'use client';

import { SidebarLayout } from '@/components/layout/sidebar-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL, fixMinioUrl } from '@/lib/utils';
import { withAuth } from '@/lib/auth-context';
import { getAuthHeaders } from '@/lib/auth';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { PostCard } from '@/components/ui/post-card';
import { Button } from '@/components/ui/button';
import { SearchIcon, UsersIcon, HashIcon, ImageIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDebounce } from '@/lib/hooks';

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
  bio?: string;
  followers_count?: number;
  following_count?: number;
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

// 主题标签类型
interface Hashtag {
  id: string;
  name: string;
  post_count: number;
}

// 搜索结果类型
interface SearchResults {
  users: User[];
  posts: Post[];
  hashtags: Hashtag[];
}

function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [activeTab, setActiveTab] = useState('all');
  const [searchResults, setSearchResults] = useState<SearchResults>({
    users: [],
    posts: [],
    hashtags: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 获取搜索结果
  const fetchSearchResults = async () => {
    if (!debouncedSearchQuery.trim()) {
      setSearchResults({ users: [], posts: [], hashtags: [] });
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`开始搜索: "${debouncedSearchQuery}"`);
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(debouncedSearchQuery)}&type=${activeTab}`, {
        method: 'GET',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("搜索失败:", errorText);
        throw new Error(`搜索失败 (${response.status}): ${errorText || '未知错误'}`);
      }
      
      const data = await response.json();
      console.log("搜索结果:", data);
      
      // 处理媒体URL
      const processedPosts = (data.posts || []).map((post: Post) => {
        if (post.media_files && Array.isArray(post.media_files) && post.media_files.length > 0) {
          return {
            ...post,
            media_files: post.media_files.map((file: MediaFile) => ({
              ...file,
              url: fixMinioUrl(file.url)
            }))
          };
        }
        return post;
      });
      
      // 更新结果
      setSearchResults({
        users: data.users || [],
        posts: processedPosts,
        hashtags: data.hashtags || []
      });
      setIsLoading(false);
      setRetryCount(0);
    } catch (error) {
      console.error("搜索出错:", error);
      setError(error instanceof Error ? error.message : "搜索时发生错误");
      setIsLoading(false);
      
      // 如果未达到最大重试次数，尝试重新搜索
      if (retryCount < maxRetries) {
        const retryDelay = (retryCount + 1) * 2000;
        console.log(`将在 ${retryDelay/1000} 秒后进行第 ${retryCount + 1} 次重试`);
        
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, retryDelay);
      }
    }
  };

  // 监听搜索查询变化
  useEffect(() => {
    fetchSearchResults();
  }, [debouncedSearchQuery, activeTab, retryCount]);

  // 页面加载时聚焦搜索框
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // 手动刷新处理
  const handleRefresh = async (): Promise<void> => {
    setRetryCount(0); // 触发重新搜索
  };

  // 计算各标签的结果数量
  const userCount = searchResults.users.length;
  const postCount = searchResults.posts.length;
  const hashtagCount = searchResults.hashtags.length;
  const totalCount = userCount + postCount + hashtagCount;

  // 右侧推荐内容
  const RightSidebar = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>搜索提示</CardTitle>
          <CardDescription>如何更好地使用搜索</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>使用 @ 前缀搜索用户，例如：@username</li>
            <li>使用 # 前缀搜索话题标签，例如：#话题</li>
            <li>输入完整词汇获得更准确的结果</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );

  // 如果加载出错，显示统一的错误界面
  if (error) {
    return (
      <SidebarLayout rightSidebar={<RightSidebar />}>
        <div className="text-center py-20">
          <p className="text-xl font-medium text-gray-600 dark:text-gray-400">无法加载搜索结果</p>
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
            {/* 搜索栏 */}
            <div className="pt-2 mb-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center">
                    <SearchIcon className="mr-2 h-5 w-5" />
                    <CardTitle>搜索</CardTitle>
                  </div>
                  <CardDescription>查找用户、帖子或话题</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      ref={searchInputRef}
                      type="search"
                      placeholder="搜索..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 搜索结果 */}
            {debouncedSearchQuery.trim() && (
              <div>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">搜索结果</CardTitle>
                    {!isLoading && (
                      <CardDescription>
                        {totalCount > 0 ? (
                          `找到 ${totalCount} 个匹配结果`
                        ) : (
                          '未找到匹配结果'
                        )}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="mb-4">
                        <TabsTrigger value="all">
                          全部 {totalCount > 0 && `(${totalCount})`}
                        </TabsTrigger>
                        <TabsTrigger value="users">
                          <UsersIcon className="h-4 w-4 mr-1" />
                          用户 {userCount > 0 && `(${userCount})`}
                        </TabsTrigger>
                        <TabsTrigger value="hashtags">
                          <HashIcon className="h-4 w-4 mr-1" />
                          话题 {hashtagCount > 0 && `(${hashtagCount})`}
                        </TabsTrigger>
                        <TabsTrigger value="posts">
                          <ImageIcon className="h-4 w-4 mr-1" />
                          帖子 {postCount > 0 && `(${postCount})`}
                        </TabsTrigger>
                      </TabsList>

                      {isLoading ? (
                        <div className="flex justify-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <p className="text-sm text-muted-foreground">正在搜索...</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <TabsContent value="all" className="m-0">
                            {totalCount === 0 ? (
                              <div className="text-center py-8">
                                <p className="text-muted-foreground">未找到与&quot;{debouncedSearchQuery}&quot;相关的结果</p>
                              </div>
                            ) : (
                              <div className="space-y-6">
                                {/* 用户结果 */}
                                {userCount > 0 && (
                                  <div>
                                    <h3 className="text-lg font-medium mb-3">用户</h3>
                                    <div className="space-y-2">
                                      {searchResults.users.slice(0, 3).map(user => (
                                        <Card key={user.id} className="hover:bg-accent transition-colors">
                                          <CardContent className="p-4">
                                            <div className="flex items-center gap-3">
                                              <img 
                                                src={user.avatar_url ? fixMinioUrl(user.avatar_url) : '/placeholder-avatar.png'} 
                                                alt={user.display_name || user.username}
                                                className="w-10 h-10 rounded-full object-cover"
                                              />
                                              <div className="flex-1">
                                                <p className="font-medium">{user.display_name || user.username}</p>
                                                <p className="text-sm text-muted-foreground">@{user.username}</p>
                                              </div>
                                              <Button variant="outline" size="sm">关注</Button>
                                            </div>
                                          </CardContent>
                                        </Card>
                                      ))}
                                      {userCount > 3 && (
                                        <div className="text-center pt-2">
                                          <Button variant="ghost" size="sm" onClick={() => setActiveTab('users')}>
                                            查看全部 {userCount} 位用户
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* 话题标签结果 */}
                                {hashtagCount > 0 && (
                                  <div>
                                    <h3 className="text-lg font-medium mb-3">话题标签</h3>
                                    <div className="space-y-2">
                                      {searchResults.hashtags.slice(0, 3).map(hashtag => (
                                        <Card key={hashtag.id} className="hover:bg-accent transition-colors">
                                          <CardContent className="p-4">
                                            <div className="flex items-center gap-3">
                                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                                <HashIcon className="h-5 w-5 text-primary" />
                                              </div>
                                              <div className="flex-1">
                                                <p className="font-medium">#{hashtag.name}</p>
                                                <p className="text-sm text-muted-foreground">{hashtag.post_count} 篇帖子</p>
                                              </div>
                                            </div>
                                          </CardContent>
                                        </Card>
                                      ))}
                                      {hashtagCount > 3 && (
                                        <div className="text-center pt-2">
                                          <Button variant="ghost" size="sm" onClick={() => setActiveTab('hashtags')}>
                                            查看全部 {hashtagCount} 个话题
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* 帖子结果 */}
                                {postCount > 0 && (
                                  <div>
                                    <h3 className="text-lg font-medium mb-3">帖子</h3>
                                    <div className="space-y-4">
                                      {searchResults.posts.slice(0, 2).map(post => (
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
                                          isSaved={post.is_saved || false}
                                        />
                                      ))}
                                      {postCount > 2 && (
                                        <div className="text-center pt-2">
                                          <Button variant="ghost" size="sm" onClick={() => setActiveTab('posts')}>
                                            查看全部 {postCount} 篇帖子
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </TabsContent>

                          <TabsContent value="users" className="m-0">
                            {userCount === 0 ? (
                              <div className="text-center py-8">
                                <p className="text-muted-foreground">未找到与&quot;{debouncedSearchQuery}&quot;相关的用户</p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {searchResults.users.map(user => (
                                  <Card key={user.id} className="hover:bg-accent transition-colors">
                                    <CardContent className="p-4">
                                      <div className="flex items-center gap-3">
                                        <img 
                                          src={user.avatar_url ? fixMinioUrl(user.avatar_url) : '/placeholder-avatar.png'} 
                                          alt={user.display_name || user.username}
                                          className="w-10 h-10 rounded-full object-cover"
                                        />
                                        <div className="flex-1">
                                          <p className="font-medium">{user.display_name || user.username}</p>
                                          <p className="text-sm text-muted-foreground">@{user.username}</p>
                                          {user.bio && <p className="text-sm mt-1 line-clamp-1">{user.bio}</p>}
                                        </div>
                                        <Button variant="outline" size="sm">关注</Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            )}
                          </TabsContent>

                          <TabsContent value="hashtags" className="m-0">
                            {hashtagCount === 0 ? (
                              <div className="text-center py-8">
                                <p className="text-muted-foreground">未找到与&quot;{debouncedSearchQuery}&quot;相关的话题</p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {searchResults.hashtags.map(hashtag => (
                                  <Card key={hashtag.id} className="hover:bg-accent transition-colors">
                                    <CardContent className="p-4">
                                      <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                          <HashIcon className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                          <p className="font-medium">#{hashtag.name}</p>
                                          <p className="text-sm text-muted-foreground">{hashtag.post_count} 篇帖子</p>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            )}
                          </TabsContent>

                          <TabsContent value="posts" className="m-0">
                            {postCount === 0 ? (
                              <div className="text-center py-8">
                                <p className="text-muted-foreground">未找到与&quot;{debouncedSearchQuery}&quot;相关的帖子</p>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {searchResults.posts.map(post => (
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
                                    isSaved={post.is_saved || false}
                                  />
                                ))}
                              </div>
                            )}
                          </TabsContent>
                        </>
                      )}
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 搜索建议（当没有输入查询时） */}
            {!debouncedSearchQuery.trim() && (
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>探索推荐</CardTitle>
                    <CardDescription>发现热门内容和用户</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* 热门话题 */}
                      <div>
                        <h3 className="text-lg font-medium mb-3">热门话题</h3>
                        <div className="space-y-2">
                          <Card className="hover:bg-accent transition-colors cursor-pointer">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                  <HashIcon className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium">#摄影</p>
                                  <p className="text-sm text-muted-foreground">1,234 篇帖子</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="hover:bg-accent transition-colors cursor-pointer">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                  <HashIcon className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium">#旅行</p>
                                  <p className="text-sm text-muted-foreground">987 篇帖子</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="hover:bg-accent transition-colors cursor-pointer">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                  <HashIcon className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium">#美食</p>
                                  <p className="text-sm text-muted-foreground">756 篇帖子</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      {/* 推荐用户 */}
                      <div>
                        <h3 className="text-lg font-medium mb-3">推荐关注</h3>
                        <div className="space-y-2">
                          <Card className="hover:bg-accent transition-colors cursor-pointer">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <img 
                                  src="/placeholder-avatar.png" 
                                  alt="用户"
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                                <div className="flex-1">
                                  <p className="font-medium">张摄影</p>
                                  <p className="text-sm text-muted-foreground">@photography</p>
                                </div>
                                <Button variant="outline" size="sm">关注</Button>
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="hover:bg-accent transition-colors cursor-pointer">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <img 
                                  src="/placeholder-avatar.png" 
                                  alt="用户"
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                                <div className="flex-1">
                                  <p className="font-medium">李旅行</p>
                                  <p className="text-sm text-muted-foreground">@travel_expert</p>
                                </div>
                                <Button variant="outline" size="sm">关注</Button>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </PullToRefresh>
        </div>
      </div>
    </SidebarLayout>
  );
}

export default withAuth(ExplorePage); 