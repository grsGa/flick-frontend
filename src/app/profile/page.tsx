'use client';

import { useState, useEffect, memo } from 'react';
import { SidebarLayout } from '@/components/layout/sidebar-layout';
import { useAuth, withAuth } from '@/lib/auth-context';
import { fixMinioUrl } from '@/lib/utils';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarIcon, MoreHorizontal } from 'lucide-react';
import { FixedEditButton } from '@/components/profile/fixed-edit-button';
import { useToast } from '@/components/ui/use-toast';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { PostCard } from '@/components/ui/post-card';
import { useQuery } from '@apollo/client';
import { GET_ME, GET_USER_FOLLOW_STATS, GET_USER_POSTS, GET_LIKED_POSTS } from '@/graphql';

// 创建记忆化的头像组件
const MemoizedAvatar = memo(({ src, alt, className }: { src?: string, alt: string, className?: string }) => {
  const firstLetter = alt[0]?.toUpperCase() || '用户';
  
  return (
    <Avatar className={className || "h-10 w-10"}>
      <AvatarImage src={src ? fixMinioUrl(src) : undefined} alt={alt} className="object-cover" />
      <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-400 to-purple-500 text-white">
        {firstLetter}
      </AvatarFallback>
    </Avatar>
  );
});
MemoizedAvatar.displayName = 'MemoizedAvatar';

// 用户类型定义
type User = {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  coverImageUrl?: string;
  location?: string;
  website?: string;
  verifiedEmail?: boolean;
  createdAt: string;
  followers: number;
  following: number;
};

// 帖子类型定义
type Post = {
  id: string;
  caption: string;
  mediaUrls: string[];
  createdAt: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  isSaved: boolean;
  permalinkId: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
  };
};

// 修复Card引起的lint错误
function isMediaPost(post: Post): boolean {
  return post.mediaUrls && post.mediaUrls.length > 0;
}

function ProfilePage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState('posts');
  const [previewPost, setPreviewPost] = useState<Post | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  // 使用Apollo Client查询用户数据
  const { data: userData, loading: userLoading, refetch: refetchUser } = useQuery(GET_ME);

  // 查询用户关注统计
  const { data: followStatsData, loading: followStatsLoading, refetch: refetchFollowStats } = 
    useQuery(GET_USER_FOLLOW_STATS, {
      variables: { userId: userData?.me?.id },
      skip: !userData?.me?.id,
    });

  // 查询用户帖子
  const { data: postsData, loading: postsLoading, refetch: refetchPosts } = 
    useQuery(GET_USER_POSTS, {
      variables: { userId: userData?.me?.id, limit: 20 },
      skip: !userData?.me?.id,
    });

  // 查询用户点赞的帖子
  const { data: likedPostsData, loading: likesLoading, refetch: refetchLikedPosts } = 
    useQuery(GET_LIKED_POSTS, {
      variables: { userId: userData?.me?.id, limit: 20 },
      skip: !userData?.me?.id || activeTab !== 'likes',
    });

  // 处理取消点赞
  const handleUnlike = (postId: string) => {
    // 重新获取点赞帖子数据
    refetchLikedPosts();
  };

  // 创建一个函数来根据路径设置激活标签
  const setActiveTabFromPath = (path: string) => {
    if (path === '/profile/replies') {
      setActiveTab('replies');
    } else if (path === '/profile/media') {
      setActiveTab('media');
    } else if (path === '/profile/likes') {
      setActiveTab('likes');
    } else if (path === '/profile' || path === '/profile/') {
      setActiveTab('posts');
    }
  };

  // 根据URL设置激活的标签，并监听pathname变化
  useEffect(() => {
    if (pathname) {
      setActiveTabFromPath(pathname);
    }

    // 添加popstate事件监听器，用于处理浏览器前进/后退按钮
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [pathname]);

  // 监听活动标签变化，加载相应数据
  useEffect(() => {
    if (activeTab === 'likes' && userData?.me?.id) {
      refetchLikedPosts();
    }
  }, [activeTab, userData?.me?.id]);

  // 处理浏览器导航事件
  const handlePopState = () => {
    if (pathname) {
      setActiveTabFromPath(pathname);
    }
  };

  // 处理标签切换
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    let newPath = '/profile';
    if (value === 'posts') {
      newPath = '/profile';
    } else if (value === 'replies') {
      newPath = '/profile/replies';
    } else if (value === 'media') {
      newPath = '/profile/media';
    } else if (value === 'likes') {
      newPath = '/profile/likes';
    }
    
    // 使用window.history.pushState更新URL
    window.history.pushState(null, '', newPath);
  };

  // 生成帖子状态URL
  const formatStatusUrl = (post: Post, photoIndex: number = 1) => {
    return `/${post.user.username}/status/${post.permalinkId}/photo/${photoIndex}`;
  };

  // 打开媒体预览
  const openMediaPreview = (post: Post, initialIndex: number = 0) => {
    setPreviewPost(post);
    setCurrentMediaIndex(initialIndex);
    setPreviewOpen(true);
  };

  // 下一张媒体
  const nextMedia = () => {
    if (previewPost && previewPost.mediaUrls.length > 0) {
      const newIndex = (currentMediaIndex + 1) % previewPost.mediaUrls.length;
      setCurrentMediaIndex(newIndex);
      // 更新浏览器URL而不导航
      const url = formatStatusUrl(previewPost, newIndex + 1);
      window.history.replaceState(null, '', url);
    }
  };

  // 上一张媒体
  const prevMedia = () => {
    if (previewPost && previewPost.mediaUrls.length > 0) {
      const newIndex = (currentMediaIndex - 1 + previewPost.mediaUrls.length) % previewPost.mediaUrls.length;
      setCurrentMediaIndex(newIndex);
      // 更新浏览器URL而不导航
      const url = formatStatusUrl(previewPost, newIndex + 1);
      window.history.replaceState(null, '', url);
    }
  };

  // 处理对话框关闭
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setPreviewOpen(false);
      // 恢复之前的URL
      if (pathname) {
        window.history.pushState(null, '', pathname);
      }
    }
  };

  // 刷新所有数据
  const handleRefresh = async () => {
    try {
      await Promise.all([
        refetchUser(),
        refetchFollowStats(),
        refetchPosts(),
        activeTab === 'likes' ? refetchLikedPosts() : Promise.resolve()
      ]);
      
      toast({
        title: "已刷新",
        description: "数据已更新",
        duration: 2000,
      });
    } catch (error) {
      console.error('刷新数据失败:', error);
      toast({
        title: "刷新失败",
        description: "请检查网络连接并重试",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
  };

  // 处理删除帖子
  const handleDeletePost = (postId: string) => {
    // 更新帖子列表
    refetchPosts();
    
    toast({
      title: "已删除",
      description: "帖子已成功删除",
      duration: 2000,
    });
  };

  // 渲染帖子标签内容
  const renderPostsTab = () => {
    const posts = postsData?.userPosts?.posts || [];
    
    if (postsLoading) {
      return (
        <div className="py-10 flex justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
    
    if (posts.length === 0) {
      return (
        <div className="text-center py-20">
          <p className="text-xl font-medium text-gray-600 dark:text-gray-400">还没有发布内容</p>
          <p className="text-gray-500 dark:text-gray-500 mt-2">分享你的第一条帖子，开始记录精彩瞬间</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4 pb-10">
        {posts.map((post) => (
          <PostCard 
            key={post.id}
            post={post}
            onOpenMediaPreview={(index) => openMediaPreview(post, index)}
            onDelete={handleDeletePost}
          />
        ))}
      </div>
    );
  };

  // 渲染点赞标签内容
  const renderLikedPosts = () => {
    const likedPosts = likedPostsData?.likedPosts?.posts || [];
    
    if (likesLoading) {
      return (
        <div className="py-10 flex justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
    
    if (likedPosts.length === 0) {
      return (
        <div className="text-center py-20">
          <p className="text-xl font-medium text-gray-600 dark:text-gray-400">还没有点赞内容</p>
          <p className="text-gray-500 dark:text-gray-500 mt-2">浏览更多内容，点赞你喜欢的帖子</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4 pb-10">
        {likedPosts.map((post) => (
          <PostCard 
            key={post.id}
            post={post}
            onOpenMediaPreview={(index) => openMediaPreview(post, index)}
            onUnlike={() => handleUnlike(post.id)}
          />
        ))}
      </div>
    );
  };

  // 正在加载时显示加载界面
  if (userLoading) {
    return (
      <SidebarLayout activePath="profile">
        <div className="py-10 flex justify-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </SidebarLayout>
    );
  }

  // 从查询结果中提取用户信息
  const user = userData?.me;
  
  if (!user) {
    return (
      <SidebarLayout activePath="profile">
        <div className="text-center py-20">
          <p className="text-xl font-medium text-gray-600 dark:text-gray-400">无法加载用户资料</p>
          <p className="text-gray-500 dark:text-gray-500 mt-2">请检查网络连接并重试</p>
          <Button onClick={refetchUser} className="mt-6">重试</Button>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout activePath="profile">
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="mb-20">
          {/* 封面图片 */}
          <div className="relative h-48 sm:h-64 w-full bg-gray-100 dark:bg-gray-900">
            {user.coverImageUrl && (
              <Image 
                src={fixMinioUrl(user.coverImageUrl)} 
                alt="封面图片"
                className="w-full h-full object-cover"
                fill
                sizes="100vw"
                priority
              />
            )}
          </div>
          
          {/* 用户资料 */}
          <div className="px-4 py-3 relative">
            <div className="flex justify-between items-start relative">
              <div className="absolute -top-16 border-4 border-white dark:border-black rounded-full">
                <MemoizedAvatar 
                  src={user.avatarUrl} 
                  alt={user.displayName || user.username} 
                  className="h-24 w-24 sm:h-32 sm:w-32"
                />
              </div>
              
              <div className="ml-auto">
                <FixedEditButton />
              </div>
            </div>
            
            <div className="mt-20 sm:mt-16">
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold truncate">{user.displayName || user.username}</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">@{user.username}</p>
              </div>
              
              {user.bio && (
                <p className="mt-3 mb-2 whitespace-pre-line text-sm">{user.bio}</p>
              )}
              
              <div className="flex items-center mt-2 text-gray-500 dark:text-gray-400 text-sm">
                <CalendarIcon className="h-4 w-4 mr-1" />
                <span>加入于 {formatDate(user.createdAt)}</span>
              </div>
              
              <div className="flex mt-2 space-x-6 text-sm">
                <Link href="/profile/following" className="hover:underline">
                  <span className="font-bold">{followStatsData?.userFollowStats?.followingCount || 0}</span>
                  <span className="text-gray-500 dark:text-gray-400 ml-1">正在关注</span>
                </Link>
                <Link href="/profile/followers" className="hover:underline">
                  <span className="font-bold">{followStatsData?.userFollowStats?.followersCount || 0}</span>
                  <span className="text-gray-500 dark:text-gray-400 ml-1">粉丝</span>
                </Link>
              </div>
            </div>
          </div>
          
          {/* 标签页 */}
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <div className="border-b border-gray-200 dark:border-gray-800">
              <TabsList className="w-full justify-start h-12 p-0 bg-transparent">
                <TabsTrigger 
                  value="posts"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:shadow-none focus:outline-none rounded-none"
                >
                  帖子
                </TabsTrigger>
                <TabsTrigger 
                  value="replies"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:shadow-none focus:outline-none rounded-none"
                >
                  回复
                </TabsTrigger>
                <TabsTrigger 
                  value="media"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:shadow-none focus:outline-none rounded-none"
                >
                  媒体
                </TabsTrigger>
                <TabsTrigger 
                  value="likes"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:shadow-none focus:outline-none rounded-none"
                >
                  喜欢
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="posts" className="p-0 pt-2">
              {renderPostsTab()}
            </TabsContent>
            
            <TabsContent value="replies" className="p-0 pt-2">
              <div className="text-center py-20">
                <p className="text-xl font-medium text-gray-600 dark:text-gray-400">暂无回复</p>
                <p className="text-gray-500 dark:text-gray-500 mt-2">你的回复将会显示在这里</p>
              </div>
            </TabsContent>
            
            <TabsContent value="media" className="p-0 pt-2">
              <div className="text-center py-20">
                <p className="text-xl font-medium text-gray-600 dark:text-gray-400">暂无媒体</p>
                <p className="text-gray-500 dark:text-gray-500 mt-2">包含图片或视频的帖子将会显示在这里</p>
              </div>
            </TabsContent>
            
            <TabsContent value="likes" className="p-0 pt-2">
              {renderLikedPosts()}
            </TabsContent>
          </Tabs>
        </div>
      </PullToRefresh>
      
      {/* 媒体预览对话框 */}
      <Dialog open={previewOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="p-0 max-w-4xl w-full bg-black">
          {previewPost && (
            <div className="relative">
              <img 
                src={fixMinioUrl(previewPost.mediaUrls[currentMediaIndex])}
                alt="媒体预览"
                className="w-full h-auto max-h-[80vh]"
              />
              
              {previewPost.mediaUrls.length > 1 && (
                <>
                  <button
                    onClick={prevMedia}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 rounded-full p-2"
                  >
                    <span className="text-white">←</span>
                  </button>
                  <button
                    onClick={nextMedia}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 rounded-full p-2"
                  >
                    <span className="text-white">→</span>
                  </button>
                  
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1">
                    {previewPost.mediaUrls.map((_, index) => (
                      <div 
                        key={index}
                        className={`w-2 h-2 rounded-full ${index === currentMediaIndex ? 'bg-white' : 'bg-white/50'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarLayout>
  );
}

export default withAuth(ProfilePage);