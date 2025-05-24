'use client';

import { useState, memo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Heart, MessageCircle, Share, Bookmark, BadgeCheck, Send, Smile } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { MediaGrid, MediaFile } from './media-grid';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

// VerifiedBadge组件
const VerifiedBadge = ({ size = 'small' }: { size?: 'small' | 'medium' | 'large' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6'
  };
  
  return (
    <span className="text-primary flex items-center justify-center" title="已验证用户">
      <BadgeCheck className={sizeClasses[size]} />
    </span>
  );
};

// 创建记忆化的头像组件
const MemoizedAvatar = memo(({ src, alt, fallback }: { src?: string, alt: string, fallback: string }) => {
  return (
    <Avatar className="h-8 w-8">
      <AvatarImage src={src} alt={alt} />
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  );
});
MemoizedAvatar.displayName = 'MemoizedAvatar';

// 大号头像组件
const MemoizedLargeAvatar = memo(({ src, alt, fallback }: { src?: string, alt: string, fallback: string }) => {
  return (
    <Avatar className="h-10 w-10">
      <AvatarImage src={src} alt={alt} />
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  );
});
MemoizedLargeAvatar.displayName = 'MemoizedLargeAvatar';

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

interface PostDetailProps {
  post: Post;
  comments: Comment[];
  currentUser: User | null;
  onLike: () => Promise<void>;
  onSave: () => Promise<void>;
  onShare: () => void;
  onSubmitComment: (text: string) => Promise<void>;
  onLikeComment: (commentId: string) => Promise<void>;
  onUserProfileClick?: (username: string) => void;
  className?: string;
}

export function PostDetail({
  post,
  comments,
  currentUser,
  onLike,
  onSave,
  onShare,
  onSubmitComment,
  onLikeComment,
  onUserProfileClick,
  className
}: PostDetailProps) {
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  
  // 提交评论
  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    if (commentText.length > 500) return;
    
    try {
      setSubmitting(true);
      await onSubmitComment(commentText);
      setCommentText('');
    } catch {
      toast({
        title: "评论失败",
        description: "提交评论时出错，请重试",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  // 处理点赞，添加防抖
  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      await onLike();
    } catch (error) {
      console.error('点赞操作失败', error);
    } finally {
      // 延迟重置状态，避免快速点击导致的闪烁
      setTimeout(() => {
        setIsLiking(false);
      }, 300);
    }
  };
  
  // 处理收藏，添加防抖
  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await onSave();
    } catch (error) {
      console.error('收藏操作失败', error);
    } finally {
      // 延迟重置状态，避免快速点击导致的闪烁
      setTimeout(() => {
        setIsSaving(false);
      }, 300);
    }
  };
  
  // 格式化文本内容（支持@用户和#话题）
  const formatContent = (text: string) => {
    // 将@用户名替换为链接
    const userPattern = /@(\w+)/g;
    let formattedText = text.replace(userPattern, '<a href="/$1" class="text-primary hover:underline">@$1</a>');
    
    // 将#话题替换为链接
    const topicPattern = /#(\w+)/g;
    formattedText = formattedText.replace(topicPattern, '<a href="/topic/$1" class="text-primary hover:underline">#$1</a>');
    
    // 转换URL为链接
    const urlPattern = /https?:\/\/\S+/g;
    formattedText = formattedText.replace(urlPattern, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">${url}</a>`;
    });
    
    return formattedText;
  };
  
  // 渲染评论
  const renderComment = (comment: Comment) => {
    const isLiked = comment.is_liked || false;
    const displayName = comment.user.display_name || comment.user.username;
    const userProfileClickHandler = onUserProfileClick;
    
    return (
      <div key={comment.id} className="py-4 hover:bg-muted/10 rounded-lg transition-colors">
        <div className="flex space-x-3">
          <Link 
            href={`/${comment.user.username}`}
            onClick={() => {
              console.log('用户点击了评论者头像', { 
                username: comment.user.username,
                commentId: comment.id 
              });
              userProfileClickHandler?.(comment.user.username);
            }}
          >
            <MemoizedAvatar 
              src={comment.user.avatar_url} 
              alt={displayName} 
              fallback={displayName[0]} 
            />
          </Link>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <Link 
                  href={`/${comment.user.username}`} 
                  className="font-semibold hover:underline"
                  onClick={() => {
                    console.log('用户点击了评论者名称', { 
                      username: comment.user.username,
                      commentId: comment.id 
                    });
                    userProfileClickHandler?.(comment.user.username);
                  }}
                >
                  {comment.user.display_name || comment.user.username}
                </Link>
                {comment.user.verified_email && <VerifiedBadge />}
                <Link 
                  href={`/${comment.user.username}`} 
                  className="text-sm text-muted-foreground hover:underline"
                  onClick={() => {
                    console.log('用户点击了评论者用户名', { 
                      username: comment.user.username,
                      commentId: comment.id 
                    });
                    userProfileClickHandler?.(comment.user.username);
                  }}
                >
                  @{comment.user.username}
                </Link>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: zhCN })}
                </span>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "h-8 w-8 p-0 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20",
                  isLiked ? "text-red-500" : "text-muted-foreground"
                )}
                onClick={() => onLikeComment(comment.id)}
              >
                <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                <span className="sr-only">喜欢</span>
              </Button>
            </div>
            
            <div className="text-sm text-foreground">
              <div 
                className="comment-content" 
                dangerouslySetInnerHTML={{ 
                  __html: formatContent(comment.content) 
                }} 
              />
            </div>
            
            <div className="flex items-center space-x-4 pt-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => onLikeComment(comment.id)}>
                <Heart className={cn("h-4 w-4", isLiked ? "fill-red-500 text-red-500" : "")} />
              </Button>
              <span className="text-xs text-muted-foreground">{comment.like_count || 0} {comment.like_count === 1 ? '喜欢' : '喜欢'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn("max-w-2xl mx-auto", className)}>
      {/* 1. 帖子内容主题区域 */}
      <Card className="border-b border-t-0 border-x-0 rounded-none shadow-none mb-4">
        <CardContent className="p-4 pb-0">
          {/* 发帖用户信息 */}
          <div className="flex items-start gap-3">
            <Link 
              href={`/${post.user.username}`}
              onClick={() => {
                console.log('User avatar clicked:', post.user.username);
                onUserProfileClick?.(post.user.username);
              }}
            >
              <MemoizedAvatar 
                src={post.user.avatar_url || ''} 
                alt={post.user.display_name || post.user.username} 
                fallback={(post.user.display_name || post.user.username).substring(0, 2)} 
              />
            </Link>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <Link 
                  href={`/${post.user.username}`}
                  className="font-semibold hover:underline"
                  onClick={() => {
                    console.log('User display name clicked:', post.user.username);
                    onUserProfileClick?.(post.user.username);
                  }}
                >
                  {post.user.display_name || post.user.username}
                </Link>
                {post.user.verified_email && <VerifiedBadge />}
              </div>
              <Link 
                href={`/${post.user.username}`}
                className="text-muted-foreground text-sm hover:underline"
                onClick={() => {
                  console.log('Username clicked:', post.user.username);
                  onUserProfileClick?.(post.user.username);
                }}
              >
                @{post.user.username}
              </Link>
              <div className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: zhCN })}
              </div>
            </div>
          </div>
          
          {/* 帖子文本内容 */}
          {post.content && (
            <div className="mb-3">
              <div 
                className="text-base whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{ 
                  __html: formatContent(post.content) 
                }} 
              />
            </div>
          )}
          
          {/* 帖子媒体内容 */}
          {post.media_files && post.media_files.length > 0 && (
            <div className="mb-3 w-full overflow-hidden">
              <MediaGrid media={post.media_files} className="w-full" />
            </div>
          )}
        </CardContent>
        
        <Separator />
        
        {/* 2. 交互操作区 */}
        <CardFooter className="flex justify-between items-center py-3 px-4">
          <div className="flex gap-6">
            {/* 点赞数量 */}
            <div className="flex items-center gap-2">
              <span className="font-semibold">{post.like_count || 0}</span>
              <span className="text-muted-foreground">喜欢</span>
            </div>
            
            {/* 评论数量 */}
            <div className="flex items-center gap-2">
              <span className="font-semibold">{post.comment_count || 0}</span>
              <span className="text-muted-foreground">评论</span>
            </div>
            
            {/* 分享数量 */}
            {post.share_count && post.share_count > 0 && (
              <div className="flex items-center gap-2">
                <span className="font-semibold">{post.share_count}</span>
                <span className="text-muted-foreground">分享</span>
              </div>
            )}
          </div>
          
          <Separator orientation="vertical" className="h-6" />
          
          {/* 快速交互按钮组 */}
          <div className="flex gap-1">
            {/* 点赞 */}
            <Button 
              variant="ghost" 
              size="icon"
              className={cn(
                "rounded-full h-10 w-10 transition-colors duration-200",
                post.is_liked ? "text-red-500" : "text-muted-foreground",
                isLiking && "opacity-70 cursor-not-allowed"
              )}
              onClick={handleLike}
              disabled={isLiking}
            >
              <div className="flex items-center justify-center w-full h-full">
                <Heart className={cn("h-5 w-5", post.is_liked && "fill-current")} />
              </div>
            </Button>
            
            {/* 评论 */}
            <Button 
              variant="ghost" 
              size="icon"
              className="rounded-full h-10 w-10 text-muted-foreground transition-colors duration-200"
              onClick={() => document.getElementById('comment-input')?.focus()}
            >
              <div className="flex items-center justify-center w-full h-full">
                <MessageCircle className="h-5 w-5" />
              </div>
            </Button>
            
            {/* 转发 */}
            <Button 
              variant="ghost" 
              size="icon"
              className="rounded-full h-10 w-10 text-muted-foreground transition-colors duration-200"
              onClick={onShare}
            >
              <div className="flex items-center justify-center w-full h-full">
                <Share className="h-5 w-5" />
              </div>
            </Button>
            
            {/* 收藏 */}
            <Button 
              variant="ghost" 
              size="icon"
              className={cn(
                "rounded-full h-10 w-10 transition-colors duration-200",
                post.is_saved ? "text-yellow-500" : "text-muted-foreground",
                isSaving && "opacity-70 cursor-not-allowed"
              )}
              onClick={handleSave}
              disabled={isSaving}
            >
              <div className="flex items-center justify-center w-full h-full">
                <Bookmark className={cn("h-5 w-5", post.is_saved && "fill-current")} />
              </div>
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      {/* 3. 评论区域 */}
      <div className="px-4">
        <Separator className="my-4" />
        
        {/* 评论输入框 - 只为登录用户显示 */}
        {currentUser ? (
          <div className="flex space-x-3 mb-6">
            <Link href={`/${currentUser.username}`}>
              <MemoizedLargeAvatar 
                src={currentUser.avatar_url} 
                alt={currentUser.display_name || currentUser.username} 
                fallback={(currentUser.display_name || currentUser.username)[0]} 
              />
            </Link>
            <div className="flex-1 space-y-2">
              <Textarea
                id="comment-input"
                placeholder="写下您的评论..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="resize-none min-h-[80px] focus:ring-2 focus:ring-primary/20"
                maxLength={500}
              />
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-muted-foreground">
                    <Smile className="h-5 w-5" />
                    <span className="sr-only">表情</span>
                  </Button>
                  <div className={`text-xs ${commentText.length > 450 ? (commentText.length > 500 ? 'text-destructive' : 'text-amber-500') : 'text-muted-foreground'}`}>
                    {commentText.length}/500
                  </div>
                </div>
                <Button 
                  onClick={handleSubmitComment} 
                  disabled={!commentText.trim() || commentText.length > 500 || submitting}
                  className="flex items-center gap-1"
                >
                  {submitting ? (
                    <div className="h-4 w-4 border-2 border-current border-t-transparent animate-spin rounded-full"></div>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span>{submitting ? '发送中...' : '发送'}</span>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 mb-4 bg-muted/20 rounded-lg">
            <p className="text-muted-foreground">登录后才能发表评论</p>
            <Button 
              variant="outline" 
              className="mt-2"
              onClick={() => router.push('/login')}
            >
              去登录
            </Button>
          </div>
        )}
        
        {/* 热门评论 */}
        {comments.length > 0 && (
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-3">评论 ({comments.length})</h3>
            <div className="space-y-1 divide-y divide-border/40">
              {comments.map(comment => renderComment(comment))}
            </div>
          </div>
        )}
        
        {/* 无评论提示 */}
        {comments.length === 0 && (
          <div className="text-center py-8 text-muted-foreground bg-muted/10 rounded-lg">
            <p className="mb-2">还没有评论</p>
            <p className="text-sm">成为第一个评论的人吧！</p>
          </div>
        )}
      </div>
      
      {/* 4. 底部操作栏 (移动端固定在底部) */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-background/80 backdrop-blur-md border-t p-3 z-50">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="icon"
              className={cn(
                "rounded-full h-10 w-10 transition-colors duration-200",
                post.is_liked ? "text-red-500" : "text-muted-foreground",
                isLiking && "opacity-70 cursor-not-allowed"
              )}
              onClick={handleLike}
              disabled={isLiking}
            >
              <div className="flex items-center justify-center w-full h-full">
                <Heart className={cn("h-5 w-5", post.is_liked && "fill-current")} />
              </div>
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              className="rounded-full h-10 w-10 text-muted-foreground transition-colors duration-200"
              onClick={() => document.getElementById('comment-input')?.focus()}
            >
              <div className="flex items-center justify-center w-full h-full">
                <MessageCircle className="h-5 w-5" />
              </div>
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              className="rounded-full h-10 w-10 text-muted-foreground transition-colors duration-200"
              onClick={onShare}
            >
              <div className="flex items-center justify-center w-full h-full">
                <Share className="h-5 w-5" />
              </div>
            </Button>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon"
            className={cn(
              "rounded-full h-10 w-10 transition-colors duration-200",
              post.is_saved ? "text-yellow-500" : "text-muted-foreground",
              isSaving && "opacity-70 cursor-not-allowed"
            )}
            onClick={handleSave}
            disabled={isSaving}
          >
            <div className="flex items-center justify-center w-full h-full">
              <Bookmark className={cn("h-5 w-5", post.is_saved && "fill-current")} />
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
} 