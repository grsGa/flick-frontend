'use client';

import { useState, useEffect } from 'react';
import { SidebarLayout } from '@/components/layout/sidebar-layout';
import { useAuth, withAuth } from '@/lib/auth-context';
import { getAuthHeaders } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// 用户类型定义
type User = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  verified_email: boolean;
  is_following?: boolean;
};

function FollowingPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [following, setFollowing] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // 获取关注列表
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchFollowing = async () => {
      try {
        setLoading(true);
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/users/me/following`, {
          headers
        });

        if (response.ok) {
          const data = await response.json();
          setFollowing(data.following || []);
        } else {
          toast({
            title: "获取关注列表失败",
            description: "无法加载您的关注列表，请稍后再试。",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('获取关注列表失败:', error);
        toast({
          title: "获取关注列表失败",
          description: "发生了一个错误，请稍后再试。",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFollowing();
  }, [isAuthenticated, toast]);

  // 处理取消关注
  const handleUnfollow = async (userId: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/users/unfollow/${userId}`, {
        method: 'POST',
        headers
      });

      if (response.ok) {
        // 更新本地状态，移除已取消关注的用户
        setFollowing(following.filter(user => user.id !== userId));
        toast({
          title: "已取消关注",
          description: "您已成功取消关注该用户。",
        });
      } else {
        toast({
          title: "取消关注失败",
          description: "无法取消关注该用户，请稍后再试。",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('取消关注失败:', error);
      toast({
        title: "取消关注失败",
        description: "发生了一个错误，请稍后再试。",
        variant: "destructive",
      });
    }
  };

  return (
    <SidebarLayout>
      {/* 顶部导航栏 */}
      <div className="flex items-center p-4 border-b sticky top-0 z-20 bg-background backdrop-blur-sm">
        <Link href="/profile" className="mr-4">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">关注</h1>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-pulse">加载中...</div>
          </div>
        ) : following.length > 0 ? (
          <div className="space-y-4">
            {following.map((user) => (
              <div key={user.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={user.avatar_url} alt={user.display_name || user.username} />
                    <AvatarFallback>{(user.display_name || user.username)[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {user.display_name || user.username}
                      {user.verified_email && (
                        <span className="ml-1 text-blue-500">✓</span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">@{user.username}</div>
                    {user.bio && (
                      <p className="text-sm mt-1 line-clamp-1">{user.bio}</p>
                    )}
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleUnfollow(user.id)}
                >
                  取消关注
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">您还没有关注任何人</p>
            <p className="text-muted-foreground text-sm mt-2">开始关注其他用户，了解他们的动态</p>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}

export default withAuth(FollowingPage); 