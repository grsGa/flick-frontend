'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';

import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { PostCard } from '@/components/ui/post-card';
import { usePostDetailStore, Comment } from '@/lib/post-store';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/use-toast';

import { 
  ArrowLeft, 
  Heart, 
  MessageCircle, 
  Share, 
  Bookmark,
  X
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/utils';
import { getAuthHeaders } from '@/lib/auth';
import { User } from '@/lib/user-hooks';
import { MediaGrid } from '@/components/ui/media-grid';

// 检测是否为移动设备
const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768;

export function PostDetailDialog() {
  const { 
    isOpen, 
    post, 
    comments, 
    currentUsername, 
    currentPermalinkId,
    closePostDetail, 
    likePost, 
    savePost, 
    addComment, 
    likeComment 
  } = usePostDetailStore();
  
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [likeInProgress, setLikeInProgress] = useState<Record<string, boolean>>({});
  const [isMobileView, setIsMobileView] = useState(isMobile());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 监听窗口大小变化以检测移动视图
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(isMobile());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 处理ESC键关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closePostDetail();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, closePostDetail]);

  // 处理帖子点赞
  const handleLike = async () => {
    if (!post || !currentUsername || !currentPermalinkId) return;
    
    try {
      await likePost(post.id, currentUsername, currentPermalinkId);
      
      // 显示操作提示
      const message = post.is_liked ? '已取消点赞' : '已点赞';
      toast({
        title: message,
        duration: 2000
      });
    } catch {
      toast({
        title: '操作失败',
        description: '点赞操作失败，请重试',
        variant: 'destructive'
      });
    }
  };

  // 处理帖子收藏
  const handleSave = async () => {
    if (!post || !currentUsername || !currentPermalinkId) return;
    
    try {
      await savePost(post.id, currentUsername, currentPermalinkId);
      
      // 显示操作提示
      const message = post.is_saved ? '已取消收藏' : '已收藏';
      toast({
        title: message,
        duration: 2000
      });
    } catch {
      toast({
        title: '操作失败',
        description: '收藏操作失败，请重试',
        variant: 'destructive'
      });
    }
  };

  // 处理提交评论
  const handleSubmitComment = async () => {
    if (!commentText.trim() || submitting) return;
    
    setSubmitting(true);
    try {
      const success = await addComment(commentText.trim());
      
      if (success) {
        setCommentText('');
        toast({
          title: '评论已发布',
          duration: 2000
        });
      } else {
        toast({
          title: '评论发布失败',
          description: '请重试',
          variant: 'destructive'
        });
      }
    } catch {
      toast({
        title: '评论发布失败',
        description: '请重试',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 处理评论点赞
  const handleLikeComment = async (commentId: string) => {
    if (likeInProgress[commentId]) return;
    
    setLikeInProgress(prev => ({ ...prev, [commentId]: true }));
    try {
      await likeComment(commentId);
    } catch {
      toast({
        title: '操作失败',
        description: '点赞操作失败，请重试',
        variant: 'destructive'
      });
    } finally {
      setLikeInProgress(prev => ({ ...prev, [commentId]: false }));
    }
  };

  // 处理关闭对话框
  const handleClose = () => {
    closePostDetail();
  };
  
  // 渲染评论
  const renderComment = (comment: Comment) => {
    const isLiked = comment.is_liked || false;
    
    return (
      <div key={comment.id} className="py-3">
        <div className="flex gap-2">
          <Link href={`/${comment.user.username}`}>
            <Avatar className="w-8 h-8">
              <AvatarImage src={comment.user.avatar_url || '/default-avatar.png'} alt={comment.user.username} />
              <AvatarFallback>{comment.user.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Link>
          
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <Link href={`/${comment.user.username}`} className="font-semibold text-sm hover:underline">
                {comment.user.display_name || comment.user.username}
              </Link>
              <Link href={`/${comment.user.username}`} className="text-xs text-muted-foreground hover:underline">
                @{comment.user.username}
              </Link>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: zhCN })}
              </span>
            </div>
            
            <div className="mt-1 text-sm">{comment.content}</div>
            
            <div className="mt-2 flex items-center gap-4">
              <button 
                className={cn(
                  "flex items-center gap-1 text-xs text-muted-foreground",
                  isLiked && "text-red-500"
                )}
                onClick={() => handleLikeComment(comment.id)}
                disabled={likeInProgress[comment.id]}
              >
                <Heart 
                  className={cn(
                    "w-4 h-4",
                    isLiked && "fill-red-500 text-red-500"
                  )} 
                />
                <span>{comment.like_count || 0}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // 可能的URL状态同步（当对话框打开时更新URL，关闭时恢复）
  useEffect(() => {
    if (isOpen && currentUsername && currentPermalinkId) {
      // 如果不是从帖子详情页打开的，更新URL
      const currentPath = window.location.pathname;
      const detailPath = `/${currentUsername}/status/${currentPermalinkId}`;
      
      if (currentPath !== detailPath) {
        router.push(detailPath, { scroll: false });
      }
    }
    
    return () => {
      // 恢复URL可能不需要，因为浏览器的返回按钮会处理这个
    };
  }, [isOpen, currentUsername, currentPermalinkId, router]);

  // 如果没有帖子数据，直接返回null
  if (!isOpen) return null;

  // 移动设备视图
  if (isMobileView) {
    return (
      <div className={cn(
        "fixed inset-0 z-50 bg-background p-4 transition-opacity",
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        {/* 导航头部 */}
        <div className="sticky top-0 flex items-center justify-between p-4 border-b bg-background/90 backdrop-blur-sm z-10">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={handleClose}>
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">返回</span>
          </Button>
          
          <h1 className="text-lg font-semibold">帖子</h1>
          
          <div className="w-10"></div> {/* 占位元素保持标题居中 */}
        </div>
        
        {/* 帖子内容和评论 */}
        <div className="p-2">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-red-500">{error}</p>
              <Button variant="outline" className="mt-4" onClick={handleClose}>
                关闭
              </Button>
            </div>
          ) : post ? (
            <>
              {/* 帖子详情 */}
              <div className="mb-4">
                <PostCard
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
                  disableNavigation={true}
                />
              </div>
              
              {/* 帖子操作栏 */}
              <div className="flex justify-around py-3 border-y mb-4">
                <Button variant="ghost" size="sm" onClick={handleLike} className={cn(post.is_liked && "text-red-500")}>
                  <Heart className={cn("mr-1 h-5 w-5", post.is_liked && "fill-current")} />
                  <span>喜欢</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => commentInputRef.current?.focus()}>
                  <MessageCircle className="mr-1 h-5 w-5" />
                  <span>评论</span>
                </Button>
                <Button variant="ghost" size="sm">
                  <Share className="mr-1 h-5 w-5" />
                  <span>分享</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleSave} className={cn(post.is_saved && "text-blue-500")}>
                  <Bookmark className={cn("mr-1 h-5 w-5", post.is_saved && "fill-current")} />
                  <span>收藏</span>
                </Button>
              </div>
              
              {/* 评论输入框 */}
              <div className="mb-4 flex gap-2">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={currentUser?.avatar_url} alt={currentUser?.display_name || currentUser?.username} />
                  <AvatarFallback>{currentUser?.username?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 flex flex-col">
                  <Textarea
                    ref={commentInputRef}
                    placeholder="添加评论..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="min-h-[60px] resize-none"
                  />
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      {commentText.length}/280
                    </span>
                    <Button 
                      size="sm" 
                      onClick={handleSubmitComment}
                      disabled={!commentText.trim() || submitting}
                    >
                      发布
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* 评论列表 */}
              <div className="space-y-2">
                {comments.length > 0 ? (
                  comments.map(renderComment)
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    还没有评论，成为第一个评论的人吧！
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    );
  }

  // 桌面视图 - 使用对话框
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closePostDetail()}>
      <DialogContent className="sm:max-w-[600px] h-[85vh] p-6">
        {/* 关闭按钮 */}
        <DialogClose className="absolute right-4 top-4 rounded-full opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none bg-muted/20 p-1">
          <X className="h-4 w-4" />
          <span className="sr-only">关闭</span>
        </DialogClose>
        
        {/* 标题栏 */}
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">帖子</h2>
        </div>
        
        {/* 帖子内容和评论 */}
        <div className="max-h-[calc(100vh-160px)] overflow-y-auto p-0">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-red-500">{error}</p>
              <Button variant="outline" className="mt-4" onClick={handleClose}>
                关闭
              </Button>
            </div>
          ) : post ? (
            <div className="pb-4">
              {/* 帖子详情 */}
              <div className="px-6 py-4">
                <div className="flex items-start space-x-3">
                  <Link href={`/${post.user.username}`}>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.user.avatar_url || '/default-avatar.png'} alt={post.user.username} />
                      <AvatarFallback>{post.user.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1">
                    <div className="flex flex-col">
                      <Link href={`/${post.user.username}`} className="font-semibold hover:underline">
                        {post.user.display_name || post.user.username}
                      </Link>
                      <Link href={`/${post.user.username}`} className="text-sm text-muted-foreground hover:underline">
                        @{post.user.username}
                      </Link>
                    </div>
                  </div>
                </div>
                
                {/* 帖子内容 */}
                <div className="mt-3 space-y-4">
                  <div className="text-base whitespace-pre-wrap break-words">
                    {post.content}
                  </div>
                  
                  {/* 媒体文件展示 */}
                  {post.media_files && post.media_files.length > 0 && (
                    <div className="mt-3 w-full overflow-hidden">
                      <MediaGrid 
                        media={post.media_files} 
                        maxDisplay={post.media_files.length} 
                        permalink_id={post.permalink_id}
                        username={post.user.username}
                        className="w-full"
                      />
                    </div>
                  )}
                  
                  {/* 时间戳 */}
                  <div className="text-sm text-muted-foreground pt-2">
                    {format(new Date(post.created_at), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                  </div>
                </div>
              </div>
              
              {/* 帖子统计 */}
              {(post?.like_count || post?.comment_count || post?.share_count) && (
                <div className="px-6 py-3 border-y flex space-x-6 text-sm text-muted-foreground">
                  {post?.comment_count && post.comment_count > 0 && (
                    <div>
                      <span className="font-semibold text-foreground">{post.comment_count}</span> 条评论
                    </div>
                  )}
                  {post?.like_count && post.like_count > 0 && (
                    <div>
                      <span className="font-semibold text-foreground">{post.like_count}</span> 次喜欢
                    </div>
                  )}
                  {post?.share_count && post.share_count > 0 && (
                    <div>
                      <span className="font-semibold text-foreground">{post.share_count}</span> 次转发
                    </div>
                  )}
                </div>
              )}
              
              {/* 帖子操作栏 */}
              <div className="flex justify-around py-3 px-6 border-b">
                <Button variant="ghost" size="sm" onClick={handleLike} className={cn(post.is_liked && "text-red-500")}>
                  <Heart className={cn("mr-1 h-5 w-5", post.is_liked && "fill-current")} />
                  <span>喜欢</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => commentInputRef.current?.focus()}>
                  <MessageCircle className="mr-1 h-5 w-5" />
                  <span>评论</span>
                </Button>
                <Button variant="ghost" size="sm">
                  <Share className="mr-1 h-5 w-5" />
                  <span>分享</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleSave} className={cn(post.is_saved && "text-blue-500")}>
                  <Bookmark className={cn("mr-1 h-5 w-5", post.is_saved && "fill-current")} />
                  <span>收藏</span>
                </Button>
              </div>
              
              {/* 评论输入框 */}
              <div className="px-6 py-4 border-b flex gap-2">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={currentUser?.avatar_url} alt={currentUser?.display_name || currentUser?.username} />
                  <AvatarFallback>{currentUser?.username?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 flex flex-col">
                  <Textarea
                    ref={commentInputRef}
                    placeholder="添加评论..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="min-h-[60px] resize-none"
                  />
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      {commentText.length}/280
                    </span>
                    <Button 
                      size="sm" 
                      onClick={handleSubmitComment}
                      disabled={!commentText.trim() || submitting}
                    >
                      发布
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* 评论列表 */}
              <div className="px-6 pt-4 space-y-2">
                {comments.length > 0 ? (
                  comments.map(renderComment)
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    还没有评论，成为第一个评论的人吧！
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              <p>没有可显示的帖子</p>
              <Button variant="outline" className="mt-4" onClick={handleClose}>
                关闭
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 