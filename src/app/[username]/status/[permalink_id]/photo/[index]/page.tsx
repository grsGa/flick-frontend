'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageLayout } from '@/components/layout/page-layout';
import { API_BASE_URL } from '@/lib/utils';
import { getAuthHeaders } from '@/lib/auth';
import { ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

// 媒体文件类型
interface MediaFile {
  url: string;
  type: 'image' | 'video';
  description?: string;
  mime_type?: string;
  width?: number;
  height?: number;
}

function MediaViewPage() {
  const { username, permalink_id, index } = useParams();
  const router = useRouter();
  const [mediaFile, setMediaFile] = useState<MediaFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 获取媒体文件
  useEffect(() => {
    const fetchMedia = async () => {
      try {
        setLoading(true);
        const headers = await getAuthHeaders();
        
        // 获取帖子的特定媒体文件
        const response = await fetch(`${API_BASE_URL}/${username}/status/${permalink_id}/photo/${index}`, {
          headers
        });
        
        if (response.ok) {
          const data = await response.json();
          setMediaFile(data);
        } else {
          console.error('获取媒体文件失败:', response.status);
          if (response.status === 404) {
            setError('媒体文件不存在或已被删除');
          } else {
            setError('获取媒体文件时出错');
          }
        }
      } catch (error) {
        console.error('获取媒体文件失败:', error);
        setError('获取媒体文件时出错');
      } finally {
        setLoading(false);
      }
    };
    
    if (username && permalink_id && index) {
      fetchMedia();
    }
  }, [username, permalink_id, index]);
  
  // 返回帖子详情页
  const handleBack = () => {
    router.push(`/${username}/status/${permalink_id}`);
  };
  
  // 关闭媒体查看器
  const handleClose = () => {
    router.push(`/${username}/status/${permalink_id}`);
  };
  
  // 渲染媒体内容
  const renderMedia = () => {
    if (!mediaFile) return null;
    
    if (mediaFile.type === 'image') {
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <Image
            src={mediaFile.url}
            alt={mediaFile.description || '图片'}
            className="max-h-[calc(100vh-120px)] object-contain"
            width={mediaFile.width || 1200}
            height={mediaFile.height || 800}
          />
        </div>
      );
    } else if (mediaFile.type === 'video') {
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <video
            src={mediaFile.url}
            controls
            className="max-h-[calc(100vh-120px)] max-w-full"
            autoPlay
          />
        </div>
      );
    }
    
    return <div>不支持的媒体类型</div>;
  };

  return (
    <PageLayout>
      <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col">
        {/* 导航头部 */}
        <div className="flex items-center justify-between p-4 border-b">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">返回</span>
          </Button>
          
          <h1 className="text-lg font-semibold">
            <Link 
              href={`/${username}`} 
              className="hover:underline"
              onClick={() => {
                console.log('User profile link clicked in media view');
                // 可以在这里添加用户点击分析
              }}
            >
              @{username}
            </Link>
            的媒体
          </h1>
          
          <Button variant="ghost" size="icon" className="rounded-full" onClick={handleClose}>
            <X className="h-5 w-5" />
            <span className="sr-only">关闭</span>
          </Button>
        </div>
        
        {/* 媒体内容 */}
        <div className="flex-1 flex items-center justify-center p-4">
          {loading ? (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          ) : error ? (
            <div className="text-center text-muted-foreground">
              <p>{error}</p>
              <Button variant="outline" className="mt-4" onClick={handleBack}>
                返回帖子
              </Button>
            </div>
          ) : (
            renderMedia()
          )}
        </div>
        
        {/* 描述（如果有） */}
        {mediaFile && mediaFile.description && (
          <div className="p-4 border-t">
            <p className="text-sm">{mediaFile.description}</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
}

export default MediaViewPage; 