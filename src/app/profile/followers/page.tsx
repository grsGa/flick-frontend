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
};

function FollowersPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [followers, setFollowers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // 获取关注者列表
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchFollowers = async () => {
      try {
        setLoading(true);
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/users/me/followers`, {
          headers
        });

        if (response.ok) {
          const data = await response.json();
          setFollowers(data.followers || []);
        } else {
          toast({
            title: "获取粉丝列表失败",
            description: "无法加载您的粉丝列表，请稍后再试。",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('获取粉丝列表失败:', error);
        toast({
          title: "获取粉丝列表失败",
          description: "发生了一个错误，请稍后再试。",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFollowers();
  }, [isAuthenticated, toast]);

  return (
    <SidebarLayout>
      {/* 顶部导航栏 */}
      <div className="flex items-center p-4 border-b sticky top-0 z-20 bg-background backdrop-blur-sm">
        <Link href="/profile" className="mr-4">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">粉丝</h1>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-pulse">加载中...</div>
          </div>
        ) : followers.length > 0 ? (
          <div className="space-y-4">
            {followers.map((follower) => (
              <div key={follower.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={follower.avatar_url} alt={follower.display_name || follower.username} />
                    <AvatarFallback>{(follower.display_name || follower.username)[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {follower.display_name || follower.username}
                      {follower.verified_email && (
                        <span className="ml-1 text-blue-500">✓</span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">@{follower.username}</div>
                    {follower.bio && (
                      <p className="text-sm mt-1 line-clamp-1">{follower.bio}</p>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  关注
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">暂无粉丝</p>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}

export default withAuth(FollowersPage); 