'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PostCard } from '@/components/ui/post-card';
import { API_BASE_URL } from '@/lib/utils';
import { getAuthHeaders } from '@/lib/auth';
import { MediaFile } from '@/components/ui/media-grid';

// 用户类型
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
  permalink_id: string;
  content: string;
  user: User;
  created_at: string;
  media_files: MediaFile[];
  like_count: number;
  comment_count: number;
  share_count: number;
  is_liked?: boolean;
  is_saved?: boolean;
}

interface ProfileTabsProps {
  user: {
    id: string;
    username: string;
  };
  isCurrentUser: boolean;
}

export function ProfileTabs({ user, isCurrentUser }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [mediaItems, setMediaItems] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 获取用户帖子
  useEffect(() => {
    const fetchUserPosts = async () => {
      if (activeTab === 'posts') {
        try {
          setLoading(true);
          const headers = await getAuthHeaders();
          
          const response = await fetch(`${API_BASE_URL}/content/users/${user.id}/posts`, {
            headers
          });
          
          if (response.ok) {
            const data = await response.json();
            setPosts(data.posts || []);
          } else {
            setError('获取帖子失败');
          }
        } catch (error) {
          console.error('获取用户帖子错误:', error);
          setError('出现错误，请稍后再试');
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchUserPosts();
  }, [user.id, activeTab]);

  // 获取用户喜欢的帖子
  useEffect(() => {
    const fetchLikedPosts = async () => {
      if (activeTab === 'likes') {
        try {
          setLoading(true);
          const headers = await getAuthHeaders();
          
          const response = await fetch(`${API_BASE_URL}/interactions/users/${user.id}/likes`, {
            headers
          });
          
          if (response.ok) {
            const data = await response.json();
            setLikedPosts(data.posts || []);
          } else {
            if (response.status === 403) {
              setError('没有权限查看');
            } else {
              setError('获取喜欢的帖子失败');
            }
          }
        } catch (error) {
          console.error('获取喜欢的帖子错误:', error);
          setError('出现错误，请稍后再试');
        } finally {
          setLoading(false);
        }
      }
    };
    
    if (isCurrentUser) {
      fetchLikedPosts();
    }
  }, [user.id, activeTab, isCurrentUser]);

  // 获取用户媒体内容
  useEffect(() => {
    const fetchMediaItems = async () => {
      if (activeTab === 'media') {
        try {
          setLoading(true);
          const headers = await getAuthHeaders();
          
          const response = await fetch(`${API_BASE_URL}/content/users/${user.id}/media`, {
            headers
          });
          
          if (response.ok) {
            const data = await response.json();
            setMediaItems(data.posts || []);
          } else {
            setError('获取媒体内容失败');
          }
        } catch (error) {
          console.error('获取媒体内容错误:', error);
          setError('出现错误，请稍后再试');
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchMediaItems();
  }, [user.id, activeTab]);

  // 获取用户收藏的帖子
  useEffect(() => {
    const fetchSavedPosts = async () => {
      if (activeTab === 'saved') {
        try {
          setLoading(true);
          const headers = await getAuthHeaders();
          
          const response = await fetch(`${API_BASE_URL}/content/saved`, {
            headers
          });
          
          if (response.ok) {
            const data = await response.json();
            setSavedPosts(data.posts || []);
          } else {
            setError('获取收藏内容失败');
          }
        } catch (error) {
          console.error('获取收藏内容错误:', error);
          setError('出现错误，请稍后再试');
        } finally {
          setLoading(false);
        }
      }
    };
    
    if (isCurrentUser) {
      fetchSavedPosts();
    }
  }, [user.id, activeTab, isCurrentUser]);

  // 处理标签切换
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setError('');
  };

  // 渲染帖子列表
  const renderPosts = (postsToRender: Post[]) => {
    if (loading) {
      return (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">{error}</p>
        </div>
      );
    }
    
    if (postsToRender.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">暂无内容</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {postsToRender.map(post => (
          <PostCard
            key={post.id}
            id={post.id}
            permalink_id={post.permalink_id}
            content={post.content}
            user={post.user}
            created_at={post.created_at}
            media_files={post.media_files}
            like_count={post.like_count}
            comment_count={post.comment_count}
            share_count={post.share_count}
            isLiked={post.is_liked}
            isSaved={post.is_saved}
          />
        ))}
      </div>
    );
  };

  return (
    <Tabs defaultValue="posts" value={activeTab} onValueChange={handleTabChange}>
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="posts">帖子</TabsTrigger>
        <TabsTrigger value="media">媒体</TabsTrigger>
        {isCurrentUser && <TabsTrigger value="likes">喜欢</TabsTrigger>}
        {isCurrentUser && <TabsTrigger value="saved">收藏</TabsTrigger>}
      </TabsList>
      
      <TabsContent value="posts" className="pt-4">
        {renderPosts(posts)}
      </TabsContent>
      
      <TabsContent value="media" className="pt-4">
        {renderPosts(mediaItems)}
      </TabsContent>
      
      {isCurrentUser && (
        <TabsContent value="likes" className="pt-4">
          {renderPosts(likedPosts)}
        </TabsContent>
      )}
      
      {isCurrentUser && (
        <TabsContent value="saved" className="pt-4">
          {renderPosts(savedPosts)}
        </TabsContent>
      )}
    </Tabs>
  );
} 