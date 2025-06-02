'use client';

import { useState, useEffect, memo, useCallback } from 'react';
import { SidebarLayout } from '@/components/layout/sidebar-layout';
import { withAuth } from '@/lib/auth-context';
import { fixMinioUrl } from '@/lib/utils';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { CalendarIcon, MessageSquare, FileText, Image as ImageIcon, Heart, MoreHorizontal, MapPin, Globe } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PostItem } from '@/components/PostItem';
import { useQuery } from '@apollo/client';
import { UserQueries, ContentQueries } from '@/graphql';
import { useEnsureToken } from '@/lib/token-passthrough';
import { Post } from '@/graphql/types';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProfileEditor } from '@/components/profile/profile-editor';

// 创建记忆化的头像组件
const MemoizedAvatar = memo(({ src, alt, className }: { src?: string, alt: string, className?: string }) => {
  return (
    <Avatar className={className || "h-10 w-10"}>
      <AvatarImage src={src || "/images/placeholder.png"} alt={alt} className="object-cover" />
    </Avatar>
  );
});
MemoizedAvatar.displayName = 'MemoizedAvatar';

// 网站URL安全处理函数
const sanitizeWebsiteUrl = (url: string): string => {
  if (!url) return '';
  
  // 删除所有 javascript: 或 data: 协议
  if (url.match(/^(javascript|data):/i)) {
    return '';
  }
  
  // 确保 URL 具有 http/https 协议
  if (!url.match(/^https?:\/\//i)) {
    return `https://${url}`;
  }
  
  try {
    // 验证 URL 格式
    new URL(url);
    return url;
  } catch {
    return '';
  }
};

function ProfilePage() {
  // 确保令牌在cookie中正确设置
  useEnsureToken();

  const { toast } = useToast();
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('posts');

  // 使用Apollo Client查询用户数据
  const { data: userData, loading: userLoading, refetch: refetchUser } = useQuery(UserQueries.GET_ME, {
    fetchPolicy: 'network-only'
  });

  // 查询用户帖子
  const { data: postsData, loading: postsLoading, refetch: refetchPosts } = 
    useQuery(ContentQueries.GET_USER_POSTS, {
      variables: { 
        username: userData?.me?.username,
        page: { page: 1, limit: 20 }
      },
      skip: !userData?.me?.username,
    });

  // 查询用户点赞的帖子
  const { data: likedPostsData, loading: likesLoading, refetch: refetchLikedPosts } = 
    useQuery(ContentQueries.GET_LIKED_POSTS, {
      variables: { page: { page: 1, limit: 20 } },
      skip: activeTab !== 'likes',
    });

  // 刷新帖子数据
  const handlePostUpdate = async (): Promise<void> => {
    // 重新获取帖子数据
    if (activeTab === 'likes') {
      refetchLikedPosts();
    } else {
      refetchPosts();
    }
  };

  // 创建一个函数来根据路径设置激活标签
  const setActiveTabFromPath = (path: string): void => {
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

  // 稳定事件处理程序参考
  const handlePopState = useCallback((): void => {
    const currentPath = window.location.pathname;
    setActiveTabFromPath(currentPath);
  }, []);

  // 根据URL设置激活的标签，并监听pathname变化
  useEffect(() => {
    setActiveTabFromPath(pathname);

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [pathname, handlePopState]);

  // 监听活动标签变化，加载相应数据
  useEffect(() => {
    if (activeTab === 'likes' && userData?.me?.id) {
      refetchLikedPosts();
    }
  }, [activeTab, userData?.me?.id, refetchLikedPosts]);

  // 处理标签切换
  const handleTabChange = (value: string): void => {
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
    
    // 使用Next.js router更新URL
    router.push(newPath, { scroll: false });
  };

  // 刷新所有数据
  const handleRefresh = async (): Promise<void> => {
    try {
      await Promise.all([
        refetchUser(),
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
    return `${date.getFullYear()}年${date.getMonth() + 1}月 加入`;
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
        {posts.map((post: Post) => (
          <PostItem 
            key={post.id}
            post={post}
            onLike={handlePostUpdate}
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
        {likedPosts.map((post: Post) => (
          <PostItem 
            key={post.id}
            post={post}
            onLike={handlePostUpdate}
          />
        ))}
      </div>
    );
  };

  // 正在加载时显示加载界面
  if (userLoading) {
    return (
      <SidebarLayout>
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
      <SidebarLayout>
        <div className="text-center py-20">
          <p className="text-xl font-medium text-gray-600 dark:text-gray-400">无法加载用户资料</p>
          <p className="text-gray-500 dark:text-gray-500 mt-2">请检查网络连接并重试</p>
          <Button onClick={refetchUser} className="mt-6">重试</Button>
        </div>
      </SidebarLayout>
    );
  }

  // 处理个人资料更新
  const handleProfileUpdated = () => {
    refetchUser();
  };

  return (
    <SidebarLayout>
      {/* 顶部标题栏 */}
      <div className="sticky top-0 z-10 flex justify-between items-center px-4 py-3 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-lg font-bold">个人资料</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
              <MoreHorizontal className="h-5 w-5" />
              <span className="sr-only">更多选项</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              分享个人资料
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="mb-20">
          {/* 封面图片 */}
          <div className="relative h-48 sm:h-64 w-full bg-gradient-to-b from-black to-white">
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
          <div className="px-4 pb-3 relative">
            {/* 用户头像 - 确保一半在封面图内，一半在封面图外 */}
            <div className="absolute -top-[64px] left-4 border-4 border-white dark:border-gray-900 rounded-full shadow-md">
              <MemoizedAvatar 
                src={user.avatarUrl} 
                alt={user.displayName || user.username} 
                className="h-32 w-32"
              />
            </div>
            
            {/* 编辑资料按钮 - 确保一半在封面图内，一半在封面图外 */}
            <div className="absolute -top-[24px] right-4">
              <ProfileEditor 
                user={user} 
                onProfileUpdated={handleProfileUpdated}
              />
            </div>
            
            {/* 用户名和标识 - 移到头像右侧，在封面图和内容区交界处 */}
            <div className="flex items-center ml-40 mt-2">
              <div>
                <h1 className="text-2xl font-bold truncate">{user.displayName || user.username}</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">@{user.username}</p>
              </div>
            </div>
            
            <div className="mt-10">
              {user.bio && (
                <p className="mb-3 whitespace-pre-line text-sm">{user.bio}</p>
              )}
              
              {/* 添加位置和网站信息 */}
              <div className="flex flex-wrap gap-x-4 gap-y-2 mb-3 text-sm text-gray-500 dark:text-gray-400">
                {user.location && (
                  <div className="flex items-center">
                    <MapPin size={16} className="mr-1.5" />
                    <span>{user.location}</span>
                  </div>
                )}
                
                {user.website && (
                  <div className="flex items-center">
                    <Globe size={16} className="mr-1.5" />
                    <a 
                      href={sanitizeWebsiteUrl(user.website)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {user.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>
              
              {/* 修改加入日期和关注信息的显示 */}
              <div className="flex items-center text-sm">
                <div className="flex items-center text-gray-500 dark:text-gray-400">
                  <CalendarIcon className="h-4 w-4 mr-1.5" />
                  <span>{formatDate(user.createdAt)}</span>
                </div>
                
                {/* 竖线分隔符 */}
                <div className="mx-3 h-4 w-px bg-gray-300 dark:bg-gray-700"></div>
                
                {/* 关注和粉丝信息 */}
                <div className="flex space-x-4">
                  <Link href="/profile/following" className="text-gray-600 dark:text-gray-300 hover:underline">
                    <span className="font-bold">{user.followingCount || 0}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1">正在关注</span>
                  </Link>
                  <Link href="/profile/followers" className="text-gray-600 dark:text-gray-300 hover:underline">
                    <span className="font-bold">{user.followersCount || 0}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1">粉丝</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          {/* 分隔线 - 分隔用户资料和标签内容 */}
          <Separator className="my-4" />
          
          {/* 标签页 */}
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <div className="border-b-0">
              <TabsList className="mx-auto max-w-md flex justify-center h-12 p-0 bg-transparent">
                <TabsTrigger 
                  value="posts"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-gray-900 dark:data-[state=active]:border-gray-100 data-[state=active]:shadow-none focus:outline-none rounded-none flex items-center gap-1.5"
                >
                  <FileText size={18} />
                  <span>帖子</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="replies"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-gray-900 dark:data-[state=active]:border-gray-100 data-[state=active]:shadow-none focus:outline-none rounded-none flex items-center gap-1.5"
                >
                  <MessageSquare size={18} />
                  <span>回复</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="media"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-gray-900 dark:data-[state=active]:border-gray-100 data-[state=active]:shadow-none focus:outline-none rounded-none flex items-center gap-1.5"
                >
                  <ImageIcon size={18} />
                  <span>媒体</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="likes"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-gray-900 dark:data-[state=active]:border-gray-100 data-[state=active]:shadow-none focus:outline-none rounded-none flex items-center gap-1.5"
                >
                  <Heart size={18} />
                  <span>喜欢</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="posts" className="p-0 pt-4">
              {renderPostsTab()}
            </TabsContent>
            
            <TabsContent value="replies" className="p-0 pt-4">
              <div className="text-center py-20">
                <p className="text-xl font-medium text-gray-600 dark:text-gray-400">暂无回复</p>
                <p className="text-gray-500 dark:text-gray-500 mt-2">你的回复将会显示在这里</p>
              </div>
            </TabsContent>
            
            <TabsContent value="media" className="p-0 pt-4">
              <div className="text-center py-20">
                <p className="text-xl font-medium text-gray-600 dark:text-gray-400">暂无媒体</p>
                <p className="text-gray-500 dark:text-gray-500 mt-2">包含图片或视频的帖子将会显示在这里</p>
              </div>
            </TabsContent>
            
            <TabsContent value="likes" className="p-0 pt-4">
              {renderLikedPosts()}
            </TabsContent>
          </Tabs>
        </div>
      </PullToRefresh>
    </SidebarLayout>
  );
}

export default withAuth(ProfilePage);