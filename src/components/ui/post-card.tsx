'use client';

import { useState, memo, useEffect, useCallback, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Heart, 
  MessageCircle, 
  Share, 
  Bookmark, 
  MoreHorizontal,
  Trash2
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn, getPostUrl, fixMinioUrl, API_BASE_URL, fetchWithDebug } from '@/lib/utils';
import { MediaGrid, MediaFile } from './media-grid';
import { getAuthHeaders } from '@/lib/auth';
import { DeleteConfirmationDialog } from './delete-confirmation-dialog';

// 创建记忆化的头像组件
const MemoizedAvatar = memo(({ src, alt, fallback, className }: { src?: string, alt: string, fallback: string, className?: string }) => {
  return (
    <Avatar className={className || "h-8 w-8"}>
      <AvatarImage src={src} alt={alt} />
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  );
});
MemoizedAvatar.displayName = 'MemoizedAvatar';

// 自定义验证徽章组件
const VerifiedBadge = ({ size = 'small' }: { size?: 'small' | 'medium' | 'large' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6'
  };
  
  return (
    <span className="text-primary" title="已验证用户">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={sizeClasses[size]}>
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
        <path d="m9 12 2 2 4-4"></path>
      </svg>
    </span>
  );
};

// 用户信息类型
interface User {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  verified_email?: boolean;
}

// 帖子属性类型
export interface PostCardProps {
  id: string;
  permalink_id?: string; // 添加永久链接ID
  content: string;
  user: User;
  created_at: string;
  media_files?: MediaFile[];
  like_count?: number;
  comment_count?: number;
  share_count?: number;
  bookmark_count?: number; // 添加收藏计数
  isLiked?: boolean;
  isSaved?: boolean;
  className?: string;
  disableNavigation?: boolean; // 是否禁用导航功能（在帖子详情页使用时）
  onUnlike?: (postId: string) => void; // 添加取消点赞的回调
  onDelete?: (postId: string) => void; // 添加删除帖子的回调
}

export function PostCard({
  id,
  permalink_id,
  content,
  user,
  created_at,
  media_files = [],
  like_count = 0,
  comment_count = 0,
  share_count = 0,
  bookmark_count = 0,
  isLiked = false,
  isSaved = false,
  className,
  disableNavigation = false,
  onUnlike,
  onDelete
}: PostCardProps) {
  // 状态
  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(like_count);
  const [saved, setSaved] = useState(isSaved);
  const [saveCount, setSaveCount] = useState(bookmark_count);
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const router = useRouter();
  
  // 从服务器和本地存储中获取交互状态，优先使用服务器状态
  useEffect(() => {
    // 优先使用服务器返回的状态
    // 明确将isLiked和isSaved转换为布尔值
    const serverLiked = typeof isLiked === 'boolean' ? isLiked : false;
    const serverSaved = typeof isSaved === 'boolean' ? isSaved : false;
    
    // 更新状态 - 优先使用服务器状态
    setLiked(serverLiked);
    setSaved(serverSaved);

    // 存储到localStorage，使本地状态与服务器保持同步
    const storageKey = `post_interaction_${id}`;
    localStorage.setItem(storageKey, JSON.stringify({
      liked: serverLiked,
      saved: serverSaved,
      timestamp: Date.now(),
      // 添加服务器同步时间戳，以便知道何时与服务器同步
      synced_at: Date.now()
    }));
  }, [id, isLiked, isSaved]); // 依赖项只包含服务器状态
  
  // 在组件挂载时从服务器检查帖子最新的点赞/收藏状态
  useEffect(() => {
    // 确保帖子和用户信息存在
    if (!id || !permalink_id || !user?.username) {
      return;
    }

    // 检查是否有令牌
    const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
    if (!token) {
      console.log('未登录，跳过获取帖子交互状态');
      return;
    }

    // 解析JWT获取用户ID
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        return;
      }
      const payload = JSON.parse(atob(tokenParts[1]));
      const currentUserID = payload.user_id;
      
      if (!currentUserID) {
        return;
      }

      // 检查最后同步时间，如果最近同步过（15分钟内），则跳过
      const storageKey = `post_interaction_${id}`;
      const storedInteraction = localStorage.getItem(storageKey);
      if (storedInteraction) {
        try {
          const interaction = JSON.parse(storedInteraction);
          const syncedAt = interaction.synced_at || 0;
          const now = Date.now();
          // 如果在过去15分钟内已同步，则跳过
          if (now - syncedAt < 15 * 60 * 1000) {
            return;
          }
        } catch {
          // 解析错误，继续获取最新状态
        }
      }

      // 获取最新的点赞和收藏状态
      const fetchPostInteractions = async () => {
        try {
          const headers = await getAuthHeaders();
          
          // 并行请求点赞和收藏状态
          const [likeResponse, saveResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/posts/${id}/is-liked?user_id=${currentUserID}`, {
              headers,
              credentials: 'include'
            }),
            fetch(`${API_BASE_URL}/posts/${id}/is-saved?user_id=${currentUserID}`, {
              headers,
              credentials: 'include'
            })
          ]);

          let updatedLiked = liked;
          let updatedSaved = saved;
          
          // 处理点赞状态
          if (likeResponse.ok) {
            const likeData = await likeResponse.json();
            if (typeof likeData.is_liked === 'boolean' && likeData.is_liked !== liked) {
              updatedLiked = likeData.is_liked;
              setLiked(updatedLiked);
              console.log(`更新帖子 ${id} 点赞状态: ${updatedLiked}`);
            }
          }

          // 处理收藏状态
          if (saveResponse.ok) {
            const saveData = await saveResponse.json();
            if (typeof saveData.is_bookmarked === 'boolean' && saveData.is_bookmarked !== saved) {
              updatedSaved = saveData.is_bookmarked;
              setSaved(updatedSaved);
              console.log(`更新帖子 ${id} 收藏状态: ${updatedSaved}`);
            }
          }

          // 保存最新状态到本地存储
          localStorage.setItem(storageKey, JSON.stringify({
            liked: updatedLiked,
            saved: updatedSaved,
            timestamp: Date.now(),
            synced_at: Date.now(),
            synced_with_server: true
          }));
        } catch (error) {
          console.warn('获取帖子交互状态失败:', error);
        }
      };

      fetchPostInteractions();
    // eslint-disable-next-line no-empty
    } catch {
      // 忽略令牌解析错误
    }
  }, [id, permalink_id, user?.username]);
  
  // 在组件挂载时如果没有服务器状态，尝试从localStorage加载
  useEffect(() => {
    // 只有当服务器未提供状态时才使用localStorage
    if (typeof isLiked !== 'boolean' && typeof isSaved !== 'boolean') {
      const storageKey = `post_interaction_${id}`;
      const storedInteraction = localStorage.getItem(storageKey);
      
      if (storedInteraction) {
        try {
          const interaction = JSON.parse(storedInteraction);
          // 只在没有服务器状态时从localStorage加载
          if (typeof isLiked !== 'boolean' && interaction.liked !== undefined) {
            setLiked(interaction.liked);
          }
          if (typeof isSaved !== 'boolean' && interaction.saved !== undefined) {
            setSaved(interaction.saved);
          }
        } catch (error) {
          console.error('解析存储的交互状态失败:', error);
        }
      }
    }
  }, [id, isLiked, isSaved]); // 确保这个效果也依赖于服务器状态
  
  // 当从props接收到新的计数时更新本地状态
  useEffect(() => {
    setLikeCount(like_count);
    setSaveCount(bookmark_count);
  }, [like_count, bookmark_count]);
  
  // 保存交互状态到本地存储
  const saveInteractionState = useCallback((newLiked: boolean, newSaved: boolean) => {
    const storageKey = `post_interaction_${id}`;
    localStorage.setItem(storageKey, JSON.stringify({
      liked: newLiked,
      saved: newSaved,
      timestamp: Date.now()
    }));
  }, [id]);

  // 处理媒体区域点击，阻止冒泡
  const handleMediaClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡，这样就不会触发父容器的点击事件
  }, []);

  // 优化媒体文件处理，确保非空且格式正确
  const finalMediaFilesMemo = useMemo(() => {
    if (!media_files || media_files.length === 0) return null;
    
    // 去重处理
    const uniqueUrls = new Set();
    const uniqueMediaFiles = media_files
      .filter(file => file && file.url) // 确保每个文件有URL
      .filter(file => {
        // 如果URL已经出现过，则过滤掉
        if (uniqueUrls.has(file.url)) return false;
        uniqueUrls.add(file.url);
        return true;
      })
      .map(file => ({
        ...file,
        url: fixMinioUrl(file.url) // 确保URL格式正确
      }));
    
    return uniqueMediaFiles.length > 0 ? uniqueMediaFiles : null;
  }, [media_files]);

  // 使用useMemo缓存媒体网格组件
  const mediaGridComponent = useMemo(() => {
    if (!finalMediaFilesMemo || finalMediaFilesMemo.length === 0) return null;
    
    return (
      <div onClick={handleMediaClick} className="mb-3 w-full overflow-hidden">
        <MediaGrid 
          media={finalMediaFilesMemo} 
          maxDisplay={4}
          permalink_id={permalink_id}
          username={user?.username}
          className="w-full"
        />
      </div>
    );
  }, [finalMediaFilesMemo, permalink_id, user?.username, handleMediaClick]);
  
  // 用户信息部分组件 - 修改为使用记忆化头像组件
  const UserInfoSection = () => {
    const displayName = user.display_name || user.username;
    const avatarLetter = displayName.substring(0, 1).toUpperCase();
    
    return (
      <div className="flex items-center gap-2">
        <Link href={`/${user.username}`}>
          <MemoizedAvatar 
            src={user.avatar_url} 
            alt={displayName} 
            fallback={avatarLetter} 
          />
        </Link>
        <div>
          <div className="flex items-center">
            <Link href={`/${user.username}`} className="font-semibold hover:underline">
              {displayName}
            </Link>
            {user.verified_email && (
              <span className="ml-1">
                <VerifiedBadge />
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/${user.username}`} className="text-xs text-muted-foreground hover:underline">
              @{user.username}
            </Link>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground" title={new Date(created_at).toLocaleString()}>
              {formatDistanceToNow(new Date(created_at), { addSuffix: true, locale: zhCN })}
            </span>
          </div>
        </div>
      </div>
    );
  };
  
  // 处理点赞
  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡
    
    if (isLiking) return; // 防止重复点击
    
    try {
      setIsLiking(true);
      
      // 先更新UI状态，实现乐观UI更新 - 使用函数式更新确保状态更新的原子性
      const newLiked = !liked;
      setLiked(newLiked);
      setLikeCount(prev => newLiked ? prev + 1 : Math.max(0, prev - 1));
      
      // 立即保存到本地存储
      saveInteractionState(newLiked, saved);
      
      const headers = await getAuthHeaders();
      
      // 检查是否有必要的参数
      if (!id) {
        console.error('点赞帖子失败：缺少帖子ID');
        return;
      }
      
      // 验证用户是否可以执行操作（匿名用户或登录用户）
      const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
      if (!token) {
        // 匿名用户，显示登录提示
        toast({
          title: "需要登录",
          description: "请登录后执行此操作",
          variant: "destructive",
        });
        return;
      }
      
      // 解析JWT获取用户信息
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        console.error('点赞失败：令牌格式无效');
        return;
      }
      
      // 解码JWT负载部分
      const payload = JSON.parse(atob(tokenParts[1]));
      const currentUserID = payload.user_id;
      
      if (!currentUserID) {
        console.error('点赞失败：无法获取用户ID');
        return;
      }
      
      const method = newLiked ? 'POST' : 'DELETE';
      let url = '';
      
      // 根据可用参数选择合适的URL
      if (permalink_id && user?.username) {
        // 优先使用X风格URL结构 (更友好)
        url = `${API_BASE_URL}/${user.username}/status/${permalink_id}/like`;
      } else {
        // 回退到基础API URL
        url = `${API_BASE_URL}/posts/${id}/like`;
      }
      
      // 创建请求体，包含用户ID
      const requestBody = {
        user_id: currentUserID
      };
      
      // 添加详细日志，帮助调试
      console.log(`发送${newLiked ? '点赞' : '取消点赞'}请求:`, {
        url,
        method,
        user_id: currentUserID
      });
      
      const response = await fetch(url, {
        method,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        // 如果请求失败，记录更多详情并回滚UI状态
        console.error('点赞操作失败', {
          status: response.status,
          statusText: response.statusText,
          url,
          method
        });
        try {
          // 尝试解析错误响应内容
          const errorData = await response.text();
          console.error('错误详情:', errorData);
        } catch {
          // 忽略解析错误
        }
        // 回滚UI状态
        setLiked(!newLiked);
        setLikeCount(prev => !newLiked ? prev + 1 : Math.max(0, prev - 1));
        // 更新本地存储以保持一致性
        saveInteractionState(!newLiked, saved);
      } else {
        console.log(`${newLiked ? '点赞' : '取消点赞'}成功`);
        
        // 服务器操作成功，使用更新的状态同步到localStorage，带上服务器同步时间戳
        const storageKey = `post_interaction_${id}`;
        localStorage.setItem(storageKey, JSON.stringify({
          liked: newLiked,
          saved: saved,
          timestamp: Date.now(),
          synced_at: Date.now(), // 添加服务器同步时间戳
          synced_with_server: true // 标记此状态已与服务器同步
        }));

        // 如果是取消点赞操作并且提供了onUnlike回调，则通知父组件
        if (!newLiked && onUnlike) {
          onUnlike(id);
        }
      }
    } catch (error) {
      console.error('点赞操作出错:', error);
      // 发生错误时回滚UI状态
      setLiked(prev => !prev);
      setLikeCount(prev => liked ? prev - 1 : prev + 1);
      // 更新本地存储以保持一致性
      saveInteractionState(!liked, saved);
    } finally {
      // 延迟重置状态，避免快速点击导致的抖动
      setTimeout(() => {
        setIsLiking(false);
      }, 300);
    }
  };
  
  // 处理保存
  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡
    
    if (isSaving) return; // 防止重复点击
    
    try {
      setIsSaving(true);
      
      // 先更新UI状态，实现乐观UI更新 - 使用函数式更新确保状态更新的原子性
      const newSaved = !saved;
      setSaved(newSaved);
      setSaveCount(prevCount => newSaved ? prevCount + 1 : Math.max(0, prevCount - 1));
      
      // 立即保存到本地存储
      saveInteractionState(liked, newSaved);
      
      const headers = await getAuthHeaders();
      
      // 检查是否有必要的参数
      if (!id) {
        console.error('保存帖子失败：缺少帖子ID');
        return;
      }
      
      // 验证用户是否可以执行操作（匿名用户或登录用户）
      const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
      if (!token) {
        // 匿名用户，显示登录提示
        toast({
          title: "需要登录",
          description: "请登录后执行此操作",
          variant: "destructive",
        });
        return;
      }
      
      // 解析JWT获取用户信息
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        console.error('保存失败：令牌格式无效');
        return;
      }
      
      // 解码JWT负载部分
      const payload = JSON.parse(atob(tokenParts[1]));
      const currentUserID = payload.user_id;
      
      if (!currentUserID) {
        console.error('保存失败：无法获取用户ID');
        return;
      }
      
      const method = newSaved ? 'POST' : 'DELETE';
      let url = '';
      
      // 根据可用参数选择合适的URL
      if (permalink_id && user?.username) {
        // 优先使用X风格URL结构
        url = `${API_BASE_URL}/${user.username}/status/${permalink_id}/save`;
      } else {
        // 回退到基础API URL
        url = `${API_BASE_URL}/posts/${id}/save`;
      }
      
      // 创建请求体，包含用户ID
      const requestBody = {
        user_id: currentUserID
      };
      
      // 添加详细日志
      console.log(`发送${newSaved ? '收藏' : '取消收藏'}请求:`, {
        url,
        method,
        user_id: currentUserID
      });
      
      const response = await fetch(url, {
        method,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        // 如果请求失败，回滚UI状态
        console.error('收藏操作失败', {
          status: response.status,
          statusText: response.statusText
        });
        try {
          // 尝试解析错误响应内容
          const errorData = await response.text();
          console.error('错误详情:', errorData);
        } catch {
          // 忽略解析错误
        }
        setSaved(!newSaved);
        setSaveCount(prevCount => !newSaved ? prevCount + 1 : Math.max(0, prevCount - 1));
        // 更新本地存储以保持一致性
        saveInteractionState(liked, !newSaved);
      } else {
        console.log(`${newSaved ? '收藏' : '取消收藏'}成功`);
        
        // 服务器操作成功，使用更新的状态同步到localStorage，带上服务器同步时间戳
        const storageKey = `post_interaction_${id}`;
        localStorage.setItem(storageKey, JSON.stringify({
          liked: liked,
          saved: newSaved,
          timestamp: Date.now(),
          synced_at: Date.now(), // 添加服务器同步时间戳
          synced_with_server: true // 标记此状态已与服务器同步
        }));
      }
    } catch (error) {
      console.error('收藏操作出错:', error);
      // 发生错误时回滚UI状态
      setSaved(prev => !prev);
      setSaveCount(prevCount => saved ? prevCount - 1 : prevCount + 1);
      // 更新本地存储以保持一致性
      saveInteractionState(liked, !saved);
    } finally {
      // 延迟重置状态，避免快速点击导致的抖动
      setTimeout(() => {
        setIsSaving(false);
      }, 300);
    }
  };
  
  // 处理内容格式化（如将@用户和#标签转为链接）
  const formatContent = (text: string) => {
    // 简单的格式化，将@用户和#标签转为蓝色
    const formattedText = text
      .replace(/@(\w+)/g, '<span class="text-primary font-semibold">@$1</span>')
      .replace(/#(\w+)/g, '<span class="text-primary font-semibold">#$1</span>');
    
    return (
      <div dangerouslySetInnerHTML={{ __html: formattedText }} />
    );
  };

  // 生成帖子详情页URL
  const getPostDetailUrl = () => {
    // 检查必要参数
    if (!user || !user.username) {
      console.error('无法生成帖子URL：缺少用户名', user);
      return '/';
    }

    // 如果没有permalink_id，使用帖子ID作为备选
    const postIdentifier = permalink_id || id;
    
    // 如果是使用帖子ID代替permalink_id，记录一个警告但不阻止导航
    if (!permalink_id) {
      console.warn(`帖子 ${id} 缺少permalink_id，使用ID代替`);
    }

    // 使用统一的URL生成函数
    return getPostUrl(user.username, postIdentifier);
  };

  // 处理帖子点击导航到详情页 - 添加防重复点击逻辑
  const handlePostClick = () => {
    if (!disableNavigation && !isNavigating) {
      // 获取URL并验证有效性
      const url = getPostDetailUrl();
      if (url === '/') {
        console.warn('帖子URL无效，无法导航');
        return;
      }
      
      // 设置导航状态防止重复点击
      setIsNavigating(true);
      // 导航到详情页
      router.push(url);
      // 300ms后重置状态
      setTimeout(() => {
        setIsNavigating(false);
      }, 300);
    }
  };

  // 检查当前登录用户是否是帖子作者
  useEffect(() => {
    const checkCurrentUser = async () => {
      try {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
        if (!token) {
          return null;
        }
        
        // 解析JWT获取用户ID
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) return;
        
        const payload = JSON.parse(atob(tokenParts[1]));
        const currentUserID = payload.user_id;
        
        if (!currentUserID) return;
        
        // 如果当前用户ID与帖子作者ID匹配，则是当前用户的帖子
        setIsCurrentUser(currentUserID === user.id);
      } catch (error) {
        console.error('检查当前用户失败:', error);
      }
    };
    
    checkCurrentUser();
  }, [user.id]);
  
  // 删除帖子
  const handleDeletePost = async () => {
    try {
      if (!permalink_id || !user?.username) {
        throw new Error('缺少删除帖子所需的信息');
      }
      
      // 记录请求详情，帮助调试
      console.log("准备删除帖子:", {
        id,
        permalink_id,
        username: user.username
      });
      
      const headers = await getAuthHeaders();
      // 修复API URL格式，确保正确的路径
      // 注意：需要确保最终URL不包含双斜杠
      const apiUrl = API_BASE_URL.endsWith('/') 
        ? `${API_BASE_URL}${user.username}/status/${permalink_id}`
        : `${API_BASE_URL}/${user.username}/status/${permalink_id}`;
      
      console.log(`发送删除帖子请求: ${apiUrl}`);
      
      // 使用fetchWithDebug替代原生fetch以获取更多调试信息
      const response = await fetchWithDebug(apiUrl, {
        method: 'DELETE',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        // 尝试获取并记录详细错误信息
        let errorMessage = `状态码: ${response.status}`;
        try {
          const errorText = await response.text();
          errorMessage += ` - ${errorText}`;
        } catch {
          // 忽略读取响应错误
        }
        throw new Error(`删除帖子失败: ${errorMessage}`);
      }
      
      // 删除成功后调用回调函数
      if (onDelete) {
        onDelete(id);
      }
      
      console.log(`帖子 ${id} 删除成功`);
    } catch (error) {
      console.error('删除帖子出错:', error);
      throw error; // 重新抛出错误以便确认对话框处理
    }
  };

  // 确保用户对象存在
  if (!user) {
    return null;
  }

  return (
    <>
      <Card className={cn("overflow-hidden border-b hover:bg-muted/20 transition-colors duration-200", className)}>
        <CardContent className="p-4">
          {/* 帖子头部 - 用户信息和操作 */}
          <div className="flex items-start justify-between mb-4">
            <UserInfoSection />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">操作菜单</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => {
                  if (navigator.clipboard) {
                    // 使用getPostDetailUrl获取URL，确保一致性
                    const postUrl = `${window.location.origin}${getPostDetailUrl()}`;
                    navigator.clipboard.writeText(postUrl);
                  }
                }}>复制链接</DropdownMenuItem>
                
                {/* 只有帖子作者才能看到删除选项 */}
                {isCurrentUser && (
                  <DropdownMenuItem 
                    className="text-destructive" 
                    onSelect={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    删除
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuItem className="text-destructive">举报</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* 可点击的帖子内容区域 */}
          <div 
            className={cn(
              "block", 
              !disableNavigation && "cursor-pointer",
              isNavigating && "opacity-70" // 添加点击反馈
            )}
            onClick={handlePostClick}
          >
            <div className="mb-3 text-base whitespace-pre-wrap">
              {formatContent(content)}
            </div>
          </div>
          
          {/* 媒体内容 - 使用缓存的组件 */}
          {mediaGridComponent}
        </CardContent>
        
        {/* 帖子操作栏 */}
        <CardFooter className="p-2 pt-0 flex justify-between border-t border-border/40">
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              "flex gap-1 items-center w-[calc(25%-8px)] justify-center transition-colors duration-200", 
              liked ? "text-red-500" : "text-muted-foreground",
              isLiking && "opacity-70 cursor-not-allowed"
            )}
            onClick={handleLike}
            disabled={isLiking}
          >
            <div className="flex items-center gap-1 min-w-[36px] justify-center">
              <Heart className={cn("h-4 w-4", liked && "fill-current")} />
              <span className="min-w-[16px] text-center">{likeCount > 0 ? likeCount : ''}</span>
            </div>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex gap-1 items-center w-[calc(25%-8px)] justify-center transition-colors duration-200 text-muted-foreground"
            onClick={(e) => {
              e.stopPropagation();
              if (!disableNavigation && !isNavigating) {
                // 获取URL并验证有效性
                const url = getPostDetailUrl();
                if (url === '/') {
                  console.warn('帖子URL无效，无法导航');
                  return;
                }
                
                setIsNavigating(true);
                router.push(url);
                setTimeout(() => {
                  setIsNavigating(false);
                }, 300);
              }
            }}
            disabled={isNavigating}
          >
            <div className="flex items-center gap-1 min-w-[36px] justify-center">
              <MessageCircle className="h-4 w-4" />
              <span className="min-w-[16px] text-center">{comment_count > 0 ? comment_count : ''}</span>
            </div>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex gap-1 items-center w-[calc(25%-8px)] justify-center transition-colors duration-200 text-muted-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-1 min-w-[36px] justify-center">
              <Share className="h-4 w-4" />
              <span className="min-w-[16px] text-center">{share_count > 0 ? share_count : ''}</span>
            </div>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              "flex gap-1 items-center w-[calc(25%-8px)] justify-center transition-colors duration-200", 
              saved ? "text-primary" : "text-muted-foreground",
              isSaving && "opacity-70 cursor-not-allowed"
            )}
            onClick={handleSave}
            disabled={isSaving}
          >
            <div className="flex items-center gap-1 min-w-[36px] justify-center">
              <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
              <span className="min-w-[16px] text-center">{saveCount > 0 ? saveCount : ''}</span>
            </div>
          </Button>
        </CardFooter>
      </Card>
      
      {/* 删除确认对话框 */}
      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeletePost}
      />
    </>
  );
} 