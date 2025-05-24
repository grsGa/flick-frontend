'use client';

import { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { API_BASE_URL } from '@/lib/utils';
import { getAccessToken } from '@/lib/auth';

interface UploadButtonProps {
  endpoint: string; // 上传API端点
  fieldName: string; // 表单字段名
  accept?: string; // 接受的文件类型
  maxSize?: number; // 最大文件大小(字节)
  buttonText?: string; // 按钮文本
  onSuccess?: (response: Record<string, unknown> | string) => void; // 成功回调
  onError?: (error: Error) => void; // 错误回调
}

export function UploadButton({ 
  endpoint,
  fieldName,
  accept = "image/*",
  maxSize = 5 * 1024 * 1024, // 默认5MB
  buttonText = "上传文件",
  onSuccess,
  onError
}: UploadButtonProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // 处理文件选择
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 检查文件类型
    if (accept && !file.type.match(accept.replace(/\*/g, '.*'))) {
      toast({
        title: "文件类型错误",
        description: `请选择${accept}类型的文件`,
        variant: "destructive",
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    
    // 检查文件大小
    if (maxSize && file.size > maxSize) {
      toast({
        title: "文件太大",
        description: `文件大小不能超过${(maxSize / 1024 / 1024).toFixed(1)}MB`,
        variant: "destructive",
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    
    // 开始上传
    setIsLoading(true);
    
    try {
      // 创建FormData
      const formData = new FormData();
      formData.append(fieldName, file);
      
      console.log(`开始上传文件: ${file.name}, 大小: ${file.size}字节, 字段名: ${fieldName}`);
      
      // 发送请求
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
          // 不要设置Content-Type，让浏览器自动设置
        },
        body: formData,
      });
      
      // 读取响应文本
      const responseText = await response.text();
      console.log(`上传响应状态: ${response.status}, 响应内容:`, responseText);
      
      // 检查响应状态
      if (!response.ok) {
        console.error('上传错误:', responseText);
        throw new Error(`上传失败: ${response.statusText}`);
      }
      
      // 清空文件输入
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // 显示成功提示
      toast({
        title: "上传成功",
        description: "文件已成功上传",
      });
      
      // 调用成功回调
      if (onSuccess) {
        try {
          const jsonResponse = JSON.parse(responseText);
          onSuccess(jsonResponse);
        } catch {
          // 解析JSON失败，直接返回原始文本
          onSuccess(responseText);
        }
      }
    } catch (error) {
      console.error('上传过程中出错:', error);
      
      // 显示错误提示
      toast({
        title: "上传失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
      
      // 调用错误回调
      if (onError && error instanceof Error) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // 点击按钮触发文件选择
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  return (
    <div>
      <Input
        type="file"
        ref={fileInputRef}
        accept={accept}
        className="hidden"
        onChange={handleFileChange}
        disabled={isLoading}
      />
      <Button
        onClick={handleButtonClick}
        disabled={isLoading}
        variant="outline"
        className="flex items-center gap-2"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        {isLoading ? "上传中..." : buttonText}
      </Button>
    </div>
  );
} 