'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SidebarLayout } from '@/components/layout/sidebar-layout';
import { PostDetail } from '@/components/ui/post-detail';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { API_BASE_URL, fixMinioUrl } from '@/lib/utils';
import { getAuthHeaders } from '@/lib/auth';
import { ArrowLeft, AlertCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { withAuth } from '@/lib/auth-context';
import Head from 'next/head';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

// 用户信息类型
interface User {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  verified_email?: boolean;
}

// 评论类型
interface Comment {
  id: string;
  content: string;
  user: User;
  created_at: string;
  like_count: number;
  is_liked?: boolean;
}

// 媒体文件类型
interface MediaFile {
  url: string;
  type: 'image' | 'video';
  description?: string;
  mime_type?: string;
  size?: number;
  width?: number;
  height?: number;
  duration?: number;
  thumbnail_url?: string;
}

// 帖子类型
interface Post {
  id: string;
  permalink_id: string;
  content: string;
  user: User;
  created_at: string;
  updated_at: string;
  media_files?: MediaFile[];
  like_count?: number;
  comment_count?: number;
  share_count?: number;
  is_liked?: boolean;
  is_saved?: boolean;
}

function PostDetailPage() {
  const { username, permalink_id } = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likeInProgress, setLikeInProgress] = useState(false);
  const [saveInProgress, setSaveInProgress] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(true);

  // 获取帖子和评论数据
  useEffect(() => {
    const fetchPostData = async () => {
      try {
        setLoading(true);
        setError(null);
        const headers = await getAuthHeaders();
        
        // 添加详细日志
        console.log(`正在获取帖子: 用户名=${username}, ID=${permalink_id}`);
        
        // 使用X风格的URL获取帖子详情
        const postResponse = await fetch(`${API_BASE_URL}/${username}/status/${permalink_id}`, {
          headers,
          cache: 'no-cache'
        });
        
        if (!postResponse.ok) {
          console.error('获取帖子详情失败:', postResponse.status);
          
          // 尝试解析错误响应
          let errorText = '';
          try {
            const errorBody = await postResponse.text();
            const errorResponse = JSON.parse(errorBody);
            errorText = errorResponse.error || errorResponse.message || '未知错误';
          } catch (error) {
            errorText = '服务器返回了无效的响应';
          }
          
          if (postResponse.status === 404) {
            setError('帖子不存在或已被删除');
            setTimeout(() => router.push('/'), 5000);
          } else if (postResponse.status === 403) {
            setError('您没有权限查看此帖子');
          } else {
            setError(`加载帖子时出错：${errorText || '请稍后再试'}`);
          }
          
          setLoading(false);
          return;
        }
        
        const postData = await postResponse.json();
        console.log('帖子数据:', postData);
        
        if (!postData || !postData.id) {
          setError('服务器返回了无效的帖子数据');
          setLoading(false);
          return;
        }
        
        // 处理帖子的媒体文件URL
        if (postData.media_files && Array.isArray(postData.media_files) && postData.media_files.length > 0) {
          postData.media_files = postData.media_files.map((file: MediaFile) => {
            if (!file || !file.url) {
              console.warn(`帖子 ${postData.id} 包含无效的媒体文件:`, file);
              return file;
            }
            return {
              ...file,
              url: fixMinioUrl(file.url)
            };
          });
        }
        
        setPost(postData);
        
        // 获取评论
        try {
          const commentsResponse = await fetch(`${API_BASE_URL}/${username}/status/${permalink_id}/comments`, {
            headers
          });
          
          if (commentsResponse.ok) {
            const commentsData = await commentsResponse.json();
            const commentsArray = commentsData.comments || [];
            
            // 处理评论，确保点赞状态存在
            const processedComments = commentsArray.map((comment: Comment) => ({
              ...comment,
              is_liked: comment.is_liked || false
            }));
            
            setComments(processedComments);
          } else {
            console.warn('获取评论失败:', commentsResponse.status);
            setComments([]);
          }
        } catch (commentError) {
          console.error('获取评论出错:', commentError);
          setComments([]);
        }
        
        // 获取相关帖子推荐
        try {
          setLoadingRelated(true);
          // 使用用户ID获取其他帖子
          const relatedResponse = await fetch(`${API_BASE_URL}/content/posts?user_id=${postData.user.id}&limit=3`, {
            headers
          });
          
          if (relatedResponse.ok) {
            const relatedData = await relatedResponse.json();
            // 过滤掉当前帖子
            const filteredPosts = (relatedData.posts || []).filter(
              (p: Post) => p.id !== postData.id
            ).slice(0, 3);
            setRelatedPosts(filteredPosts);
          }
        } catch (error) {
          console.error('获取相关帖子失败:', error);
        } finally {
          setLoadingRelated(false);
        }
      } catch (error) {
        console.error('获取帖子详情失败:', error);
        setError('网络错误，请检查您的连接并重试');
      } finally {
        setLoading(false);
      }
    };
    
    if (username && permalink_id) {
      fetchPostData();
    }
  }, [username, permalink_id, router, toast]);
  
  // 点赞帖子
  const handleLike = async () => {
    if (!post || likeInProgress) return;
    
    try {
      setLikeInProgress(true);
      const headers = await getAuthHeaders();
      
      const method = post.is_liked ? 'DELETE' : 'POST';
      const response = await fetch(`${API_BASE_URL}/${username}/status/${permalink_id}/like`, {
        method,
        headers
      });
      
      if (response.ok) {
        setPost({
          ...post,
          is_liked: !post.is_liked,
          like_count: post.is_liked ? (post.like_count || 1) - 1 : (post.like_count || 0) + 1
        });
      } else {
        toast({
          title: "操作失败",
          description: "点赞操作失败，请稍后再试",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('点赞操作失败:', error);
    } finally {
      setLikeInProgress(false);
    }
  };
  
  // 收藏帖子
  const handleSave = async () => {
    if (!post || saveInProgress) return;
    
    try {
      setSaveInProgress(true);
      const headers = await getAuthHeaders();
      
      const method = post.is_saved ? 'DELETE' : 'POST';
      const response = await fetch(`${API_BASE_URL}/${username}/status/${permalink_id}/save`, {
        method,
        headers
      });
      
      if (response.ok) {
        setPost({
          ...post,
          is_saved: !post.is_saved
        });
        
        toast({
          title: post.is_saved ? "已取消收藏" : "已收藏",
          description: post.is_saved ? "已从收藏中移除" : "已添加到收藏",
        });
      } else {
        toast({
          title: "操作失败",
          description: "收藏操作失败，请稍后再试",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
    } finally {
      setSaveInProgress(false);
    }
  };
  
  // 分享帖子
  const handleShare = () => {
    if (!post) return;
    
    // 构建分享URL
    const shareUrl = `${window.location.origin}/${post.user.username}/status/${post.permalink_id}`;
    
    // 尝试使用Web Share API
    if (navigator.share) {
      navigator.share({
        title: `${post.user.display_name || post.user.username}的帖子`,
        text: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
        url: shareUrl
      }).catch(error => {
        console.error('分享失败:', error);
        // 降级处理：复制链接
        copyToClipboard(shareUrl);
      });
    } else {
      // 浏览器不支持分享API，复制链接
      copyToClipboard(shareUrl);
    }
  };
  
  // 复制到剪贴板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "链接已复制",
        description: "帖子链接已复制到剪贴板",
      });
    }).catch(err => {
      console.error('复制失败:', err);
      toast({
        title: "复制失败",
        description: "无法复制链接，请手动复制",
        variant: "destructive",
      });
    });
  };
  
  // 提交评论
  const handleSubmitComment = async (commentText: string) => {
    if (!commentText.trim() || !username || !permalink_id) return;
    if (commentText.length > 500) return;
    
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/${username}/status/${permalink_id}/comments`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: commentText
        })
      });
      
      if (response.ok) {
        const newComment = await response.json();
        const processedComment = {
          ...newComment,
          is_liked: false,
          like_count: 0
        };
        
        setComments(prev => [processedComment, ...prev]);
        
        // 更新评论计数
        if (post) {
          setPost({
            ...post,
            comment_count: (post.comment_count || 0) + 1
          });
        }
        
        toast({
          title: "评论已发布",
          description: "您的评论已成功发布",
        });
      } else {
        let errorMsg = "发表评论失败";
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            errorMsg = errorData.error;
          }
        } catch (error) {
          console.error('解析评论错误响应失败:', error);
        }
        
        toast({
          title: "评论失败",
          description: errorMsg,
          variant: "destructive",
        });
        
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('提交评论失败:', error);
      throw error;
    }
  };
  
  // 评论点赞
  const handleLikeComment = async (commentId: string) => {
    try {
      const headers = await getAuthHeaders();
      
      // 查找并更新评论
      const commentIndex = comments.findIndex(c => c.id === commentId);
      if (commentIndex === -1) return;
      
      const comment = comments[commentIndex];
      const isLiked = comment.is_liked || false;
      
      // 发送API请求
      const method = isLiked ? 'DELETE' : 'POST';
      const response = await fetch(`${API_BASE_URL}/interactions/comments/${commentId}/like`, {
        method,
        headers
      });
      
      if (response.ok) {
        // 更新评论状态
        const newComments = [...comments];
        newComments[commentIndex] = {
          ...comment,
          is_liked: !isLiked,
          like_count: isLiked ? comment.like_count - 1 : comment.like_count + 1
        };
        setComments(newComments);
      }
    } catch (error) {
      console.error('评论点赞失败:', error);
    }
  };
  
  // 返回上一页
  const handleBack = () => {
    router.back();
  };

  // 添加用户资料点击事件处理
  const handleUserProfileClick = (username: string) => {
    console.log('用户点击了帖子作者信息', { username });
    router.push(`/${username}`);
  };
  
  // 右侧边栏
  const RightSidebar = () => (
    <div className="space-y-6">
      {/* 发布者其他内容 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">发布者其他内容</CardTitle>
          <CardDescription>
            {post?.user?.display_name || post?.user?.username || '用户'}的其他帖子
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingRelated ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : relatedPosts.length > 0 ? (
            <div className="space-y-3">
              {relatedPosts.map(relatedPost => (
                <div 
                  key={relatedPost.id} 
                  className="border rounded-lg p-3 hover:bg-muted/20 cursor-pointer transition-colors"
                  onClick={() => router.push(`/${relatedPost.user.username}/status/${relatedPost.permalink_id}`)}
                >
                  <p className="text-sm line-clamp-2">{relatedPost.content}</p>
                  <div className="text-xs text-muted-foreground mt-1">
                    发布于 {new Date(relatedPost.created_at).toLocaleDateString('zh-CN')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">暂无其他内容</p>
          )}
        </CardContent>
      </Card>

      {/* 热门话题 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">热门话题</CardTitle>
          <CardDescription>当前热门讨论</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">暂无热门话题</p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      {post && (
        <Head>
          <title>{`${post.user.display_name || post.user.username}发布: ${post.content.substring(0, 50)}${post.content.length > 50 ? '...' : ''}`}</title>
          <meta name="description" content={post.content.substring(0, 160)} />
          <meta property="og:title" content={`${post.user.display_name || post.user.username}的帖子`} />
          <meta property="og:description" content={post.content.substring(0, 160)} />
          {post.media_files && post.media_files.length > 0 && post.media_files[0].url && (
            <meta property="og:image" content={post.media_files[0].url} />
          )}
        </Head>
      )}

      <SidebarLayout rightSidebar={<RightSidebar />}>
        <div className="relative">
          {/* 导航头部 */}
          <div className="sticky top-0 z-10 flex items-center p-3 bg-background/80 backdrop-blur-sm border-b">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={handleBack}>
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">返回</span>
            </Button>
            <h1 className="ml-2 text-xl font-semibold">帖子</h1>
          </div>
          
          {/* 错误显示 */}
          {error && (
            <div className="bg-destructive/10 text-destructive p-4 m-4 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">{error}</p>
                {error === '帖子不存在或已被删除' && (
                  <p className="text-sm mt-1">将在5秒后返回首页...</p>
                )}
              </div>
            </div>
          )}
          
          {/* 加载状态 */}
          {loading ? (
            <div className="flex flex-col gap-4 p-4">
              <div className="flex gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-[300px] w-full rounded-xl" />
              <div className="flex justify-between">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-32" />
              </div>
            </div>
          ) : (
            <>
              {/* 帖子详情组件 */}
              {post && (
                <PostDetail
                  post={post}
                  comments={comments}
                  currentUser={currentUser}
                  onLike={handleLike}
                  onSave={handleSave}
                  onShare={handleShare}
                  onSubmitComment={handleSubmitComment}
                  onLikeComment={handleLikeComment}
                  onUserProfileClick={handleUserProfileClick}
                />
              )}
            </>
          )}
        </div>
      </SidebarLayout>
    </>
  );
}

export default withAuth(PostDetailPage, { requireAuth: false }); 