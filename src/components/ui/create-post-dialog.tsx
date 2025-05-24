'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { X, ImageIcon, Globe, Edit, VideoIcon, ListTodo } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { API_BASE_URL } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { getAuthHeaders, getUser, getAccessToken } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ImageCrop } from '@/components/ui/image-crop';


// 媒体文件类型
interface MediaFile {
  url: string;
  type: 'image' | 'video';
  description?: string; // 图片描述
  mime_type: string;
  size: number;
  width: number;
  height: number;
  duration: number;
  thumbnail_url: string;
  fingerprint: string;
}

// 添加类型声明部分
interface SuggestionItem {
  type: 'user' | 'topic';
  text: string;
  id?: string;
}

export interface CreatePostDialogProps {
  trigger?: React.ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
}

export function CreatePostDialog({ 
  trigger, 
  isOpen, 
  onOpenChange,
  onClose
}: CreatePostDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  // 状态
  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [imageDescriptions, setImageDescriptions] = useState<string[]>([]); // 图片描述
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [currentUserData, setCurrentUserData] = useState(user);
  const [uploadProgress, setUploadProgress] = useState(0); // 添加上传进度状态
  
  // 图片编辑状态
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [editingImageIndex, setEditingImageIndex] = useState<number>(-1);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState('');
  
  const MAX_CONTENT_LENGTH = 280; // 类似Twitter的字符限制
  
  // 增加图片加载状态跟踪
  const [loadingImages, setLoadingImages] = useState<{ [key: string]: boolean }>({});
  
  // 每次对话框打开时，强制获取最新的用户信息
  useEffect(() => {
    if (isOpen) {
      // 获取最新的用户信息
      const fetchLatestUserData = async () => {
        try {
          const headers = await getAuthHeaders();
          const response = await fetch(`${API_BASE_URL}/users/me`, {
            headers
          });

          if (response.ok) {
            const data = await response.json();
            setCurrentUserData(data);
          }
        } catch (error) {
          console.error('获取用户最新资料失败:', error);
          // 使用当前auth上下文中的用户信息作为后备
          setCurrentUserData(user);
        }
      };
      
      fetchLatestUserData();
    } else {
      // 重置所有状态
      setContent('');
      setSelectedImages([]);
      setImagePreviewUrls([]);
      setImageDescriptions([]);
      setCharCount(0);
      setEditingImageIndex(-1);
      setCropImageSrc(null);
      setIsCropperOpen(false);
    }
  }, [isOpen, user]);
  
  // 引用
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 添加输入框自动调整高度的功能
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [placeholder, setPlaceholder] = useState("有什么新鲜事？");
  
  // 自动调整文本框高度
  const autoResizeTextarea = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // 重置高度以获取正确的scrollHeight
    textarea.style.height = 'auto';
    
    // 设置新高度
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 120), 300);
    textarea.style.height = `${newHeight}px`;
  };
  
  // 处理输入框变化，自动调整高度
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setCharCount(newContent.length);
    autoResizeTextarea();
  };
  
  // 处理输入框焦点
  const handleFocus = () => {
    setInputFocused(true);
    // 更改占位符文本
    setPlaceholder("分享你的想法...");
  };
  
  // 处理输入框失焦
  const handleBlur = () => {
    if (!content.trim()) {
      setInputFocused(false);
      setPlaceholder("有什么新鲜事？");
    }
  };
  
  // 当输入框内容变化时触发高度调整
  useEffect(() => {
    autoResizeTextarea();
  }, [content]);
  
  // 获取话题和用户名提及建议
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // 检测输入文本中的@或#并显示建议
  useEffect(() => {
    if (!content) {
      setShowSuggestions(false);
      return;
    }
    
    // 获取光标位置
    const cursorPosition = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = content.substring(0, cursorPosition);
    
    // 检查是否有@或#
    const matchAt = textBeforeCursor.match(/@(\w*)$/);
    const matchHash = textBeforeCursor.match(/#(\w*)$/);
    
    if (matchAt) {
      // 处理@用户建议
      const query = matchAt[1].toLowerCase();
      // 模拟用户搜索结果 - 实际应用中应该调用API
      const mockUsers = [
        { type: 'user' as const, text: 'user1', id: '1' },
        { type: 'user' as const, text: 'user2', id: '2' },
        { type: 'user' as const, text: 'admin', id: '3' }
      ].filter(u => u.text.toLowerCase().includes(query));
      
      setSuggestions(mockUsers);
      setShowSuggestions(mockUsers.length > 0);
    } else if (matchHash) {
      // 处理#话题建议
      const query = matchHash[1].toLowerCase();
      // 模拟话题搜索结果
      const mockTopics = [
        { type: 'topic' as const, text: 'technology' },
        { type: 'topic' as const, text: 'travel' },
        { type: 'topic' as const, text: 'food' }
      ].filter(t => t.text.toLowerCase().includes(query));
      
      setSuggestions(mockTopics);
      setShowSuggestions(mockTopics.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [content, textareaRef.current?.selectionStart]);
  
  // 插入建议内容
  const insertSuggestion = (suggestion: { type: 'user' | 'topic', text: string }) => {
    // 获取光标位置
    const cursorPosition = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = content.substring(0, cursorPosition);
    const textAfterCursor = content.substring(cursorPosition);
    
    let newText = '';
    if (suggestion.type === 'user') {
      // 替换@后的文本
      const matchAt = textBeforeCursor.match(/@(\w*)$/);
      if (matchAt) {
        const beforeMatch = textBeforeCursor.substring(0, cursorPosition - matchAt[0].length);
        newText = `${beforeMatch}@${suggestion.text} ${textAfterCursor}`;
      }
    } else {
      // 替换#后的文本
      const matchHash = textBeforeCursor.match(/#(\w*)$/);
      if (matchHash) {
        const beforeMatch = textBeforeCursor.substring(0, cursorPosition - matchHash[0].length);
        newText = `${beforeMatch}#${suggestion.text} ${textAfterCursor}`;
      }
    }
    
    if (newText) {
      setContent(newText);
      setCharCount(newText.length);
      setShowSuggestions(false);
      
      // 让文本框保持焦点
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const newCursorPos = newText.length - textAfterCursor.length;
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 10);
    }
  };
  
  // 处理图片选择
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newFiles: File[] = [];
    const newPreviewUrls: string[] = [];
    const newDescriptions: string[] = [];
    
    // 限制最多4张图片
    const totalImages = selectedImages.length + files.length;
    const allowedNewImages = Math.min(files.length, 4 - selectedImages.length);
    
    if (totalImages > 4) {
      toast({
        title: "图片数量超限",
        description: "最多只能上传4张图片",
        variant: "destructive",
      });
    }
    
    // 定义最大文件大小限制为15MB
    const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
    
    // 处理选定的图片
    for (let i = 0; i < allowedNewImages; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        // 检查文件大小
        if (file.size > MAX_FILE_SIZE) {
          toast({
            title: "图片大小超限",
            description: `图片 ${file.name} 超过15MB限制`,
            variant: "destructive",
          });
          continue; // 跳过这个文件
        }
        
        // 检查图片类型限制
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          toast({
            title: "图片格式不支持",
            description: `仅支持JPG、PNG、GIF和WebP格式`,
            variant: "destructive",
          });
          continue; // 跳过这个文件
        }
        
        newFiles.push(file);
        newPreviewUrls.push(URL.createObjectURL(file));
        newDescriptions.push(''); // 为每张图片添加空描述
      }
    }
    
    setSelectedImages([...selectedImages, ...newFiles]);
    setImagePreviewUrls([...imagePreviewUrls, ...newPreviewUrls]);
    setImageDescriptions([...imageDescriptions, ...newDescriptions]);
    
    // 重置文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // 移除选定的图片
  const removeImage = (index: number) => {
    const newImages = [...selectedImages];
    const newPreviewUrls = [...imagePreviewUrls];
    const newDescriptions = [...imageDescriptions];
    
    // 释放对象URL以避免内存泄漏
    URL.revokeObjectURL(newPreviewUrls[index]);
    
    newImages.splice(index, 1);
    newPreviewUrls.splice(index, 1);
    newDescriptions.splice(index, 1);
    
    setSelectedImages(newImages);
    setImagePreviewUrls(newPreviewUrls);
    setImageDescriptions(newDescriptions);
  };
  
  // 触发文件选择对话框
  const triggerFileInput = (e: React.MouseEvent) => {
    e.preventDefault(); // 防止触发表单提交
    e.stopPropagation(); // 防止事件冒泡
    fileInputRef.current?.click();
  };
  
  // 处理图片编辑
  const handleEditImage = (index: number) => {
    setEditingImageIndex(index);
    setCropImageSrc(imagePreviewUrls[index]);
    setIsCropperOpen(true);
  };
  
  // 处理图片描述编辑
  const handleEditDescription = (index: number) => {
    setEditingImageIndex(index);
    setTempDescription(imageDescriptions[index] || '');
    setIsEditingDescription(true);
  };
  
  // 保存图片描述
  const saveImageDescription = () => {
    if (editingImageIndex >= 0) {
      const newDescriptions = [...imageDescriptions];
      newDescriptions[editingImageIndex] = tempDescription;
      setImageDescriptions(newDescriptions);
    }
    setIsEditingDescription(false);
    setEditingImageIndex(-1);
  };
  
  // 处理图片裁剪完成
  const handleCropComplete = (croppedBlob: Blob) => {
    if (editingImageIndex === -1) return;
    
    // 创建新的文件对象
    const fileType = selectedImages[editingImageIndex].type || 'image/jpeg';
    const fileName = selectedImages[editingImageIndex].name || 'cropped-image.jpg';
    const newFile = new File([croppedBlob], fileName, { type: fileType });
    
    // 更新文件和预览URL
    const newImages = [...selectedImages];
    const newPreviewUrls = [...imagePreviewUrls];
    
    // 释放旧的对象URL
    URL.revokeObjectURL(newPreviewUrls[editingImageIndex]);
    
    newImages[editingImageIndex] = newFile;
    newPreviewUrls[editingImageIndex] = URL.createObjectURL(croppedBlob);
    
    setSelectedImages(newImages);
    setImagePreviewUrls(newPreviewUrls);
    setIsCropperOpen(false);
    setCropImageSrc(null);
    setEditingImageIndex(-1);
  };
  
  // 分块上传图片文件
  const uploadImageInChunks = async (file: File, headers: HeadersInit): Promise<any> => {
    // 对于小文件（< 1MB），直接上传
    if (file.size < 1024 * 1024) {
        const formData = new FormData();
      formData.append('file', file);
        
      const response = await fetch(`${API_BASE_URL}/content/upload`, {
            method: 'POST',
            headers,
            body: formData,
          });
          
      if (!response.ok) {
        const errorText = await response.text();
            throw new Error(`上传图片失败: ${errorText}`);
          }
          
      return await response.json();
    }
    
    // 对于大文件，使用优化上传策略
    // 这里我们使用压缩处理来替代分块上传
    // 图片大小超过1MB时进行优化处理
    
    // 创建一个图片元素来加载文件
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            try {
              // 创建canvas进行压缩
              const canvas = document.createElement('canvas');
              let width = img.width;
              let height = img.height;
      
              // 保持宽高比的情况下限制最大尺寸
              const MAX_WIDTH = 1920;
              const MAX_HEIGHT = 1920;
              
              if (width > MAX_WIDTH) {
                height = Math.round(height * (MAX_WIDTH / width));
                width = MAX_WIDTH;
              }
              
              if (height > MAX_HEIGHT) {
                width = Math.round(width * (MAX_HEIGHT / height));
                height = MAX_HEIGHT;
    }
    
              canvas.width = width;
              canvas.height = height;
              
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                reject(new Error("无法创建Canvas上下文"));
                return;
      }
              
              // 绘制图片并压缩
              ctx.drawImage(img, 0, 0, width, height);
              
              // 转换为Blob
              let quality = 0.8; // 初始压缩质量
              
              // 根据原始文件大小动态调整压缩质量
              if (file.size > 10 * 1024 * 1024) {
                quality = 0.7;
              } else if (file.size > 5 * 1024 * 1024) {
                quality = 0.75;
    }
    
              canvas.toBlob(async (blob) => {
                if (!blob) {
                  reject(new Error("图片压缩失败"));
                  return;
                }
                
                // 创建具有原始文件名的新文件
                const compressedFile = new File([blob], file.name, { type: file.type });
                
                const formData = new FormData();
                formData.append('file', compressedFile);
                
                try {
                  const response = await fetch(`${API_BASE_URL}/content/upload`, {
                    method: 'POST',
                    headers,
                    body: formData,
                  });
                  
                  if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`上传压缩图片失败: ${errorText}`);
                  }
                  
                  // 返回上传结果
                  resolve(await response.json());
          } catch (error) {
                  reject(error);
                }
              }, file.type, quality);
            } catch (error) {
              reject(error);
          }
          };
          
          img.onerror = () => reject(new Error("图片加载失败"));
          img.src = e.target?.result as string;
        };
        
        reader.onerror = () => reject(new Error("读取文件失败"));
        reader.readAsDataURL(file);
      } catch (error) {
        reject(error);
      }
    });
  };
  
  // 发布帖子
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 重置上传进度
    setUploadProgress(0);
    
    // 验证表单，确保内容或图片至少有一个
    if (!content.trim() && selectedImages.length === 0) {
      toast({
        variant: "destructive",
        title: "内容不能为空",
        description: "请输入内容或选择图片",
      });
      return;
    }
    
    // 检查字符数
    if (content.length > MAX_CONTENT_LENGTH) {
      toast({
        variant: "destructive",
        title: "内容过长",
        description: `内容超过${MAX_CONTENT_LENGTH}个字符限制`,
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let mediaFiles: Array<{url: string, type: string, mime_type: string}> = [];
      
      // 如果有图片，先上传图片
      if (selectedImages.length > 0) {
        setUploadProgress(10);
        
        // 一次上传一张图片，确保每个图片都处理成功
        const uploadedMediaFiles = [];
          
          // 获取表单请求专用的授权头部（不包含Content-Type）
          const headers = await getAuthHeaders(true);
          
        for (let i = 0; i < selectedImages.length; i++) {
          // 添加重试机制
          let retryCount = 0;
          const maxRetries = 3;
          let success = false;
          
          while (!success && retryCount < maxRetries) {
            try {
              console.log(`尝试上传图片 ${i+1}/${selectedImages.length}，尝试次数: ${retryCount + 1}`);
              
              // 使用优化的分块/压缩上传方法
              const uploadResult = await uploadImageInChunks(selectedImages[i], headers);
              
              console.log(`图片(${i+1}/${selectedImages.length})上传成功，尝试次数: ${retryCount + 1}`);
          
          // 将上传的图片信息添加到数组
          uploadedMediaFiles.push({
            url: uploadResult.url,
            type: 'image',
            mime_type: selectedImages[i].type || 'image/jpeg'
          });
              
              // 标记成功
              success = true;
          
          // 更新进度
          setUploadProgress(Math.floor(((i + 1) / selectedImages.length) * 90) + 10);
            } catch (error) {
              retryCount++;
              console.error(`上传失败，尝试次数: ${retryCount}/${maxRetries}`, error);
              
              if (retryCount >= maxRetries) {
                throw new Error(`上传图片失败，已尝试 ${maxRetries} 次: ${error instanceof Error ? error.message : String(error)}`);
              }
              
              // 添加指数退避重试延迟
              const delayMs = Math.min(1000 * Math.pow(2, retryCount), 10000);
              console.log(`将在 ${delayMs}ms 后重试...`);
              await new Promise(resolve => setTimeout(resolve, delayMs));
            }
          }
        }
        
        // 所有图片上传完成
        setUploadProgress(100);
        
        // 将所有上传的图片整合到mediaFiles数组
        mediaFiles = uploadedMediaFiles;
      }
      
      // 创建帖子数据
      const postData = {
        type: mediaFiles.length > 0 ? 'image' : 'text', // 根据是否有媒体文件设置类型
        content: content.trim(),
        media_files: mediaFiles
      };
      
      console.log('创建帖子:', postData);
      
      // 发送创建帖子请求 - 使用正确的网关API路径
      console.log('使用正确的API路径发送创建帖子请求');
      const response = await fetch(`${API_BASE_URL}/content/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('创建帖子失败:', response.status, errorText);
        throw new Error(`创建帖子失败: ${response.status} ${errorText}`);
      }
      
      // 获取帖子响应，包含用户名和 permalink_id
      const postResponse = await response.json();
      console.log('帖子创建响应:', postResponse);
      
      toast({
        title: "发布成功",
        description: "您的帖子已成功发布",
      });
      
      // 重置表单
      setContent('');
      setSelectedImages([]);
      setImagePreviewUrls([]);
      setImageDescriptions([]);
      setCharCount(0);
      
      // 关闭对话框
      onOpenChange(false);
      if (onClose) onClose();
      
      // 获取当前用户信息和帖子 permalink_id 以构建 X 风格的 URL
      const currentUser = getUser();
      const username = currentUser?.username || postResponse.user?.username;
      const permalink_id = postResponse.permalink_id;
      
      if (username && permalink_id) {
        // 使用 X 风格 URL 重定向到帖子详情页
        router.push(`/${username}/status/${permalink_id}`);
      } else {
        // 如果没有足够的信息，只刷新页面
        router.refresh();
      }
      
    } catch (error) {
      console.error('提交出错:', error);
      toast({
        variant: "destructive",
        title: "发布失败",
        description: error instanceof Error ? error.message : "发布帖子时出现错误",
      });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };
  
  // 计算字符计数器的颜色
  const getCounterColor = () => {
    if (charCount > MAX_CONTENT_LENGTH) return 'text-red-500';
    if (charCount > MAX_CONTENT_LENGTH * 0.8) return 'text-yellow-500';
    return 'text-muted-foreground';
  };
  
  // 计算图片网格布局样式
  const getGridLayout = () => {
    const count = imagePreviewUrls.length;
    
    if (count === 1) return '';
    if (count === 2) return 'grid-cols-2';
    if (count === 3) return 'grid-cols-2';
    if (count === 4) return 'grid-cols-2';
    return 'grid-cols-2';
  };
  
  // 计算单张图片的最佳展示尺寸和样式
  const getSingleImageStyle = async (url: string): Promise<{
    aspectRatio: number;
    maxHeight: number;
    width: string;
  }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // 计算宽高比
        const aspectRatio = img.width / img.height;
        // 根据宽高比决定最大高度和宽度
        let maxHeight = 500;
        let width = '100%';
        
        // 极宽图片（宽高比大于3:1）
        if (aspectRatio > 3) {
          maxHeight = 280;
          width = '100%';
        } 
        // 宽图片（宽高比在2:1到3:1之间）
        else if (aspectRatio > 2) {
          maxHeight = 350;
          width = '100%';
        } 
        // 略宽图片（宽高比在1.5:1到2:1之间）
        else if (aspectRatio > 1.5) {
          maxHeight = 420;
          width = '100%';
        }
        // 方形图片（宽高比在0.8:1到1.2:1之间）
        else if (aspectRatio >= 0.8 && aspectRatio <= 1.2) {
          maxHeight = 450;
          width = '90%';
        }
        // 高图片（宽高比小于0.8:1）
        else if (aspectRatio < 0.8) {
          // 竖图需要更多高度但减少宽度
          maxHeight = 550;
          width = '65%';
        }
        
        resolve({
          aspectRatio,
          maxHeight,
          width
        });
      };
      
      img.onerror = () => {
        // 默认样式
        resolve({
          aspectRatio: 1,
          maxHeight: 450,
          width: '90%'
        });
      };
      
      img.src = url;
    });
  };
  
  // 获取图片高度样式
  const getImageHeight = (index: number) => {
    if (imagePreviewUrls.length === 1) return '';

    if (imagePreviewUrls.length === 3 && index === 0) {
      return 'h-60';
    }
    
    if (imagePreviewUrls.length >= 3) {
      return 'h-48';
    }
    
    return 'h-52';
  };

  // 获取图片容器样式
  const getImageContainerStyle = () => {
    // 当只有1张图片且没有输入文本内容时，提供特殊布局
    if (imagePreviewUrls.length === 1 && !content.trim()) {
      return 'w-full flex justify-center items-center min-h-[200px]'; // 减少上边距并居中，确保最小高度
    } else if (imagePreviewUrls.length === 1) {
      return 'w-full mt-2 flex justify-center items-center min-h-[150px]'; // 常规单张图片样式（添加flex居中布局）
    }
    return `grid gap-2 mt-3 ${getGridLayout()}`;
  };
  
  // 单张图片样式状态
  const [singleImageStyles, setSingleImageStyles] = useState<{
    [url: string]: {
      aspectRatio: number;
      maxHeight: number;
      width: string;
    }
  }>({});

  // 当图片URL变化时，计算样式
  useEffect(() => {
    if (imagePreviewUrls.length === 1) {
      const url = imagePreviewUrls[0];
      
      // 如果已经计算过这个URL的样式，不重复计算
      if (!singleImageStyles[url]) {
        getSingleImageStyle(url).then((style) => {
          setSingleImageStyles(prev => ({
            ...prev,
            [url]: style
          }));
        });
      }
    }
  }, [imagePreviewUrls]);
  
  // 处理图片加载
  const handleImageLoad = (url: string) => {
    setLoadingImages(prev => ({
      ...prev,
      [url]: false
    }));
  };

  // 处理图片加载错误
  const handleImageError = (url: string) => {
    setLoadingImages(prev => ({
      ...prev,
      [url]: false
    }));
    
    toast({
      title: "图片加载失败",
      description: "无法加载图片，请尝试重新上传",
      variant: "destructive",
    });
  };

  // 标记新图片为加载中
  useEffect(() => {
    const newLoadingState = { ...loadingImages };
    
    imagePreviewUrls.forEach(url => {
      if (newLoadingState[url] === undefined) {
        newLoadingState[url] = true;
      }
    });
    
    setLoadingImages(newLoadingState);
  }, [imagePreviewUrls]);
  
  // 为空内容单图情况提供特殊的样式
  const getSingleImageEmptyContentStyle = (url: string, defaultStyle: {
    aspectRatio: number;
    maxHeight: number;
    width: string;
  }) => {
    // 只有在内容为空且只有一张图片时应用特殊样式
    if (!content.trim() && imagePreviewUrls.length === 1) {
      // 确保宽度类型一致性
      let newWidth = defaultStyle.width;
      let newMaxHeight = defaultStyle.maxHeight;
      
      // 根据图片宽高比调整样式
      if (defaultStyle.aspectRatio > 2) {
        // 宽图片占据更大视窗
        newWidth = '100%';
        newMaxHeight = Math.min(newMaxHeight + 100, 580);
      } else if (defaultStyle.aspectRatio > 1.2) {
        // 适中宽高比图片
        newWidth = '100%';
        newMaxHeight = Math.min(newMaxHeight + 80, 550);
      } else if (defaultStyle.aspectRatio >= 0.8 && defaultStyle.aspectRatio <= 1.2) {
        // 方形图片稍微扩展
        newMaxHeight = Math.min(newMaxHeight + 50, 500);
      } else {
        // 竖图增加高度，但保持窄一些
        newMaxHeight = Math.min(newMaxHeight + 120, 650);
      }
      
      return {
        ...defaultStyle,
        maxHeight: newMaxHeight,
        width: newWidth
      };
    }
    return defaultStyle;
  };
  
  // 带记忆的当前用户数据组件，防止内容变化时重新渲染头像
  const MemoizedUserAvatar = useMemo(() => {
    const displayUser = currentUserData || user;
    return (
      <Avatar className="w-10 h-10 border">
        <AvatarImage 
          src={displayUser?.avatar_url || '/default-avatar.png'} 
          alt={displayUser?.display_name || displayUser?.username || '用户'} 
        />
        <AvatarFallback>{displayUser?.display_name?.[0] || displayUser?.username?.[0] || '用'}</AvatarFallback>
      </Avatar>
    );
  }, [currentUserData, user]); // 重新添加这些依赖项，以确保用户数据更新时头像也会更新

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {trigger}
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle>创建新帖子</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-start gap-3 flex-1 overflow-auto pt-2">
            {/* 使用记忆化的头像组件 */}
            {MemoizedUserAvatar}
            
            <div className="flex-1 min-h-[120px] flex flex-col">
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={placeholder}
                className="flex-1 min-h-[120px] resize-none border-0 shadow-none focus-visible:ring-0 text-base leading-normal p-0"
                autoFocus
              />
              
              {/* 全局可见性提示 - X风格 */}
              {inputFocused && (
                <div className="flex items-center space-x-2 mt-3 mb-4 px-1">
                  <Globe className="h-4 w-4 text-primary" />
                  <span className="text-xs text-primary font-medium">所有人可见</span>
                </div>
              )}
              
              {/* 图片预览区 */}
              {imagePreviewUrls.length > 0 && (
                <div className={getImageContainerStyle()}>
                  {imagePreviewUrls.map((url, index) => {
                    // 单张图片的特殊处理
                    if (imagePreviewUrls.length === 1) {
                      const style = singleImageStyles[url] || { 
                        aspectRatio: 1, 
                        maxHeight: 400, 
                        width: '100%' 
                      };
                      
                      // 应用空内容特殊样式
                      const enhancedStyle = getSingleImageEmptyContentStyle(url, style);
                      
                      return (
                        <div 
                          key={index} 
                          className={`relative rounded-lg overflow-hidden group ${!content.trim() ? 'mb-2' : ''}`}
                          style={{ 
                            width: enhancedStyle.width,
                            maxHeight: `${enhancedStyle.maxHeight}px`,
                          }}
                        >
                          <div className="w-full h-full flex items-center justify-center">
                            {loadingImages[url] && (
                              <div className="absolute inset-0 flex items-center justify-center bg-muted/10">
                                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                              </div>
                            )}
                            <img 
                              src={url} 
                              alt={imageDescriptions[index] || `预览图片 ${index+1}`} 
                              className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${loadingImages[url] ? 'opacity-0' : 'opacity-100'}`}
                              onLoad={() => handleImageLoad(url)}
                              onError={() => handleImageError(url)}
                              style={{
                                width: 'auto',
                                height: 'auto',
                                maxHeight: `${enhancedStyle.maxHeight}px`,
                              }}
                            />
                            
                            {/* 图片操作按钮 */}
                            <div className="absolute top-2 right-2 space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="icon"
                                variant="secondary"
                                className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditImage(index); }}
                                type="button"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="secondary"
                                className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeImage(index); }}
                                type="button"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            {/* 图片描述按钮 */}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm hover:bg-background/90 h-8 px-3 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditDescription(index); }}
                              type="button"
                            >
                              添加描述
                            </Button>
                          </div>
                        </div>
                      );
                    }
                    
                    // 多张图片的处理逻辑
                    return (
                      <div 
                        key={index} 
                        className="relative rounded-md overflow-hidden group"
                        style={{ 
                          height: getImageHeight(index),
                        }}
                      >
                        {loadingImages[url] && (
                          <div className="absolute inset-0 flex items-center justify-center bg-muted/10">
                            <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                          </div>
                        )}
                        <img 
                          src={url} 
                          alt={imageDescriptions[index] || `预览图片 ${index+1}`}
                          className={`w-full h-full object-cover transition-opacity duration-300 ${loadingImages[url] ? 'opacity-0' : 'opacity-100'}`}
                          onLoad={() => handleImageLoad(url)}
                          onError={() => handleImageError(url)}
                        />
                        
                        {/* 图片操作按钮 */}
                        <div className="absolute top-2 right-2 space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditImage(index); }}
                            type="button"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeImage(index); }}
                            type="button"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          
          {/* 操作栏 */}
          <div className="flex items-center justify-between pt-3 mt-2 border-t">
            <div className="flex items-center space-x-1">
              <input
                type="file"
                accept="image/*"
                multiple
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleImageSelect}
              />
              <Button 
                size="icon" 
                variant="ghost" 
                className="rounded-full h-8 w-8" 
                onClick={triggerFileInput}
                disabled={imagePreviewUrls.length >= 4}
                type="button"
              >
                <ImageIcon className="h-5 w-5 text-primary" />
              </Button>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="rounded-full h-8 w-8 text-primary-foreground"
                      disabled
                      type="button"
                    >
                      <VideoIcon className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">视频上传功能即将推出</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="rounded-full h-8 w-8 text-primary-foreground"
                      disabled
                      type="button"
                    >
                      <ListTodo className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">投票功能即将推出</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className={`text-xs ${getCounterColor()}`}>
                {content.length > 0 && `${content.length}/${MAX_CONTENT_LENGTH}`}
              </div>
              
              <Button 
                size="sm" 
                className="font-medium"
                onClick={handleSubmit}
                disabled={!content.trim() && imagePreviewUrls.length === 0}
                type="submit"
              >
                发布
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
      
      {/* 图片裁剪 */}
      {cropImageSrc && (
        <ImageCrop
          open={isCropperOpen}
          onOpenChange={setIsCropperOpen}
          imageSrc={cropImageSrc}
          onCropComplete={handleCropComplete}
          title="编辑图片"
        />
      )}
    </Dialog>
  );
}