'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, User, Image as ImageIcon, Edit } from 'lucide-react';
import { fixMinioUrl } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { ProfileImageCrop } from '@/components/profile/profile-image-crop';
import { useMutation } from '@apollo/client';
import { UserMutations } from '@/graphql';
import { useUpdateProfile } from '@/lib/user-hooks';

// 定义用户类型
interface User {
  id: string;
  username: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  location?: string;
  website?: string;
  isVerified?: boolean;
  createdAt?: string;
  created_at?: string; // 兼容snake_case格式
  // 可选的社交统计信息
  followersCount?: number;
  followingCount?: number;
  followers_count?: number; // 兼容snake_case格式
  following_count?: number; // 兼容snake_case格式
}

interface ProfileEditorProps {
  user: User | null;
  onProfileUpdated: () => void;
  triggerVariant?: 'default' | 'outline' | 'ghost'; // 触发按钮的样式
  triggerSize?: 'default' | 'sm' | 'lg'; // 触发按钮的大小
  triggerClassName?: string; // 自定义按钮类名
  buttonLabel?: string; // 自定义按钮文本
}

export function ProfileEditor({
  user,
  onProfileUpdated,
  triggerVariant = 'outline',
  triggerSize = 'sm',
  triggerClassName = 'bg-background',
  buttonLabel = '编辑资料'
}: ProfileEditorProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  // 使用GraphQL钩子
  const { updateProfile, loading: updateProfileLoading } = useUpdateProfile();
  const [uploadAvatar] = useMutation(UserMutations.UPLOAD_AVATAR);
  const [uploadCoverImage] = useMutation(UserMutations.UPLOAD_COVER_IMAGE);
  
  // 表单状态
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  
  // 封面图和头像状态
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  
  // 图像裁剪状态
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [cropType, setCropType] = useState<'avatar' | 'cover'>('avatar');
  
  // 加载状态
  const [isLoading, setIsLoading] = useState(false);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  
  // 每次对话框打开时重置状态
  useEffect(() => {
    if (open && user) {
      setDisplayName(user.displayName || user.username || '');
      setBio(user.bio || '');
      setLocation(user.location || '');
      setWebsite(user.website || '');
      setAvatarPreview(null);
      setCoverImagePreview(null);
      setAvatarFile(null);
      setCoverImageFile(null);
    }
  }, [open, user]);
  
  // 处理对话框状态变化
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    
    if (isOpen && user) {
      // 如果打开对话框，填充表单数据
      setDisplayName(user.displayName || user.username || '');
      setBio(user.bio || '');
      setLocation(user.location || '');
      setWebsite(user.website || '');
      // 重置文件上传状态
      setAvatarFile(null);
      setCoverImageFile(null);
      setAvatarPreview(null);
      setCoverImagePreview(null);
      
      console.log('对话框已打开，填充用户数据:', user);
    }
  };
  
  // 处理头像文件更改
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('头像选择器触发onChange事件');
    const files = e.target.files;
    if (!files || files.length === 0) {
      console.log('没有选择头像文件');
      return;
    }
    
    const file = files[0];
    console.log(`选择头像文件: ${file.name}, 大小: ${file.size}字节, 类型: ${file.type}`);
    
    // 重置input的值，确保即使选择相同文件也能触发onChange事件
    if (avatarInputRef.current) {
      // 保存文件引用后立即重置input，这样即使用户取消也能重新选择相同文件
      setTimeout(() => {
        if (avatarInputRef.current) {
          avatarInputRef.current.value = '';
          console.log('重置头像文件输入框');
        }
      }, 0);
    }
    
    // 打开裁剪对话框
    const reader = new FileReader();
    reader.onloadend = () => {
      console.log('头像文件读取完成，准备打开裁剪对话框');
      setCropImageSrc(reader.result as string);
      setCropType('avatar');
      setIsCropperOpen(true);
    };
    reader.onerror = (error) => {
      console.error('读取头像文件失败:', error);
      toast({
        title: "文件读取失败",
        description: "无法读取所选文件，请重试",
        variant: "destructive",
      });
    };
    reader.readAsDataURL(file);
  };
  
  // 处理封面图文件更改
  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    console.log(`选择封面图文件: ${file.name}, 大小: ${file.size}字节, 类型: ${file.type}`);
    
    // 重置input的值，确保即使选择相同文件也能触发onChange事件
    if (coverImageInputRef.current) {
      // 保存文件引用后立即重置input，这样即使用户取消也能重新选择相同文件
      setTimeout(() => {
        if (coverImageInputRef.current) {
          coverImageInputRef.current.value = '';
        }
      }, 0);
    }
    
    // 打开裁剪对话框
    const reader = new FileReader();
    reader.onloadend = () => {
      console.log('封面图文件读取完成，准备打开裁剪对话框');
      setCropImageSrc(reader.result as string);
      setCropType('cover');
      setIsCropperOpen(true);
    };
    reader.onerror = (error) => {
      console.error('读取封面图文件失败:', error);
      toast({
        title: "文件读取失败",
        description: "无法读取所选文件，请重试",
        variant: "destructive",
      });
    };
    reader.readAsDataURL(file);
  };
  
  // 处理裁剪完成的回调
  const handleCropComplete = (croppedBlob: Blob) => {
    console.log(`裁剪完成: ${cropType}, 大小: ${croppedBlob.size}字节`);
    
    // 确保文件大小有效
    if (croppedBlob.size === 0) {
      console.error('裁剪后的图片大小为0，无效的Blob');
      toast({
        title: "图片处理失败",
        description: "裁剪后的图片无效，请重试",
        variant: "destructive",
      });
      return;
    }
    
    // 创建File对象用于上传
    const fileName = cropType === 'avatar' ? 'avatar.jpg' : 'cover.jpg';
    const croppedFile = new File([croppedBlob], fileName, { 
      type: 'image/jpeg',
      lastModified: Date.now()
    });
    
    // 在继续处理之前先释放旧的预览URL
    if (cropType === 'avatar' && avatarPreview && avatarPreview.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(avatarPreview);
        console.log('释放旧的头像URL:', avatarPreview);
      } catch (e) {
        console.warn('释放旧URL失败:', e);
      }
    } else if (cropType === 'cover' && coverImagePreview && coverImagePreview.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(coverImagePreview);
        console.log('释放旧的封面图URL:', coverImagePreview);
      } catch (e) {
        console.warn('释放旧URL失败:', e);
      }
    }
    
    // 创建新的预览Blob和URL
    const previewBlob = new Blob([croppedBlob], { type: 'image/jpeg' });
    const previewUrl = URL.createObjectURL(previewBlob);
    console.log('创建新的预览URL:', previewUrl);
    
    // 提前创建图片元素并预加载，确保有效性
    const preloadImg = new Image();
    preloadImg.onload = () => {
      console.log('预览图片预加载成功');
      
      if (cropType === 'avatar') {
        console.log(`设置新头像文件: ${fileName}, 大小: ${croppedFile.size}字节, 类型: ${croppedFile.type}`);
        
        // 先设置文件，再设置预览URL
        setAvatarFile(croppedFile);
        setAvatarPreview(previewUrl);
        
        console.log('头像预览URL已设置:', previewUrl);
        
        // 重置文件输入
        if (avatarInputRef.current) {
          avatarInputRef.current.value = '';
        }
        
        // 延迟强制更新DOM，确保状态已完全更新
        setTimeout(() => {
          // 找到所有头像预览元素并更新
          const avatarPreviewElements = document.querySelectorAll('.avatar-preview-img') as NodeListOf<HTMLImageElement>;
          
          if (avatarPreviewElements && avatarPreviewElements.length > 0) {
            console.log(`找到 ${avatarPreviewElements.length} 个头像预览元素，强制更新`);
            
            avatarPreviewElements.forEach(img => {
              // 完全清除原始属性，然后重新设置
              img.removeAttribute('src');
              
              // 添加唯一键以防止缓存
              const uniqueKey = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
              img.setAttribute('key', uniqueKey);
              
              // 使用RAF确保DOM更新队列已处理
              requestAnimationFrame(() => {
                // 设置新的src属性
                img.src = previewUrl;
                console.log('强制更新头像预览元素:', img);
                
                // 重置图片样式，确保正确渲染
                img.style.opacity = '0';
                
                // 再次使用RAF来分离样式更新
                requestAnimationFrame(() => {
                  img.style.opacity = '1';
                  img.style.transition = 'opacity 0.3s ease';
                });
              });
            });
          } else {
            console.warn('未找到头像预览元素');
          }
        }, 100);
        
      } else {
        console.log(`设置新封面图文件: ${fileName}, 大小: ${croppedFile.size}字节, 类型: ${croppedFile.type}`);
        
        // 先设置文件，再设置预览URL
        setCoverImageFile(croppedFile);
        setCoverImagePreview(previewUrl);
        
        console.log('封面图预览URL已设置:', previewUrl);
        
        // 重置文件输入
        if (coverImageInputRef.current) {
          coverImageInputRef.current.value = '';
        }
        
        // 延迟强制更新DOM，确保状态已完全更新
        setTimeout(() => {
          // 找到所有封面图预览元素并更新
          const coverPreviewElements = document.querySelectorAll('.cover-preview-img') as NodeListOf<HTMLImageElement>;
          
          if (coverPreviewElements && coverPreviewElements.length > 0) {
            console.log(`找到 ${coverPreviewElements.length} 个封面图预览元素，强制更新`);
            
            coverPreviewElements.forEach(img => {
              // 完全清除原始属性，然后重新设置
              img.removeAttribute('src');
              
              // 添加唯一键以防止缓存
              const uniqueKey = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
              img.setAttribute('key', uniqueKey);
              
              // 使用RAF确保DOM更新队列已处理
              requestAnimationFrame(() => {
                // 设置新的src属性
                img.src = previewUrl;
                console.log('强制更新封面图预览元素:', img);
                
                // 重置图片样式，确保正确渲染
                img.style.opacity = '0';
                
                // 再次使用RAF来分离样式更新
                requestAnimationFrame(() => {
                  img.style.opacity = '1';
                  img.style.transition = 'opacity 0.3s ease';
                });
              });
            });
          } else {
            console.warn('未找到封面图预览元素');
          }
        }, 100);
      }
    };
    
    preloadImg.onerror = (e) => {
      console.error('预览图片加载失败:', e);
      toast({
        title: "图片预览失败",
        description: "裁剪后的图片无法正确加载，请重试",
        variant: "destructive"
      });
    };
    
    // 强制设置crossOrigin，避免潜在的CORS问题
    preloadImg.crossOrigin = "anonymous";
    preloadImg.src = previewUrl;
    
    // 确保裁剪对话框关闭但编辑对话框保持打开
    setIsCropperOpen(false);
    setCropImageSrc(null);
    
    // 延迟一下，确保状态更新后再显示对话框
    setTimeout(() => {
      setOpen(true); // 确保编辑对话框保持打开状态
    }, 500); // 延长时间以确保状态更新完成
  };
  
  // 清除头像预览
  const clearAvatarPreview = () => {
    // 释放Blob URL以避免内存泄漏
    if (avatarPreview && avatarPreview.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(avatarPreview);
        console.log('已释放头像预览URL:', avatarPreview);
      } catch (e) {
        console.warn('释放预览URL失败:', e);
      }
    }
    
    setAvatarFile(null);
    setAvatarPreview(null);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  };
  
  // 清除封面图预览
  const clearCoverImagePreview = () => {
    // 释放Blob URL以避免内存泄漏
    if (coverImagePreview && coverImagePreview.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(coverImagePreview);
        console.log('已释放封面图预览URL:', coverImagePreview);
      } catch (e) {
        console.warn('释放预览URL失败:', e);
      }
    }
    
    setCoverImageFile(null);
    setCoverImagePreview(null);
    if (coverImageInputRef.current) {
      coverImageInputRef.current.value = '';
    }
  };
  
  // 保存个人资料
  const saveProfile = async () => {
    if (!user) return;
    
    console.log('尝试保存个人资料...');
    setIsLoading(true);
    
    try {
      // 1. 首先更新用户基本信息
      const profileData = {
        displayName: displayName,
        bio: bio,
        location: location,
        website: website
      };
      
      console.log('准备更新个人资料:', profileData);
      
      // 使用GraphQL更新个人资料
      const updated = await updateProfile(profileData);
      
      if (!updated) {
        throw new Error('更新个人资料失败');
      }
      
      // 2. 如果有新头像文件，上传头像
      if (avatarFile) {
        console.log(`准备上传头像文件: ${avatarFile.name}, 大小: ${avatarFile.size}字节, 类型: ${avatarFile.type}`);
        
        if (avatarFile.size === 0) {
          console.error('头像文件大小为0，跳过上传');
          throw new Error('头像文件无效');
        }
        
        try {
          // 直接使用原始File对象进行上传，不需要重新创建
          console.log('开始上传头像...');
          
          // 设置Apollo上传选项
          const uploadResult = await uploadAvatar({
            variables: { file: avatarFile },
            refetchQueries: ['Me', 'UserByUsername'],
            context: {
              hasUpload: true, // 告知Apollo这是一个文件上传请求
            }
          });
          
          if (!uploadResult.data?.uploadAvatar) {
            throw new Error('头像上传响应无效');
          }
          
          console.log('头像上传成功:', uploadResult.data.uploadAvatar.avatarUrl);
        } catch (error) {
          console.error('上传头像失败:', error);
          toast({
            title: "头像上传失败",
            description: error instanceof Error ? error.message : "服务器处理请求时出错",
            variant: "destructive",
          });
          // 不抛出错误，允许继续处理封面图
        }
      }
      
      // 3. 如果有新封面图文件，上传封面图
      if (coverImageFile) {
        console.log(`准备上传封面图文件: ${coverImageFile.name}, 大小: ${coverImageFile.size}字节, 类型: ${coverImageFile.type}`);
        
        if (coverImageFile.size === 0) {
          console.error('封面图文件大小为0，跳过上传');
          throw new Error('封面图文件无效');
        }
        
        try {
          // 直接使用原始File对象进行上传，不需要重新创建
          console.log('开始上传封面图...');
          
          // 设置Apollo上传选项
          const uploadResult = await uploadCoverImage({
            variables: { file: coverImageFile },
            refetchQueries: ['Me', 'UserByUsername'],
            context: {
              hasUpload: true, // 告知Apollo这是一个文件上传请求
            }
          });
          
          if (!uploadResult.data?.uploadCoverImage) {
            throw new Error('封面图上传响应无效');
          }
          
          console.log('封面图上传成功:', uploadResult.data.uploadCoverImage.coverImageUrl);
        } catch (error) {
          console.error('上传封面图失败:', error);
          toast({
            title: "封面图上传失败",
            description: error instanceof Error ? error.message : "服务器处理请求时出错",
            variant: "destructive",
          });
          // 不抛出错误，让流程能完成
        }
      }
      
      // 更新成功
      console.log('个人资料更新成功');
      
      // 更新状态的顺序很重要：先关闭对话框，再显示成功提示，最后调用刷新回调
      setOpen(false);
      
      // 显示成功提示
      toast({
        title: "资料已更新",
        description: "您的个人资料已成功更新",
        duration: 3000,
      });
      
      // 延迟调用刷新回调，避免UI更新冲突
      setTimeout(() => {
        onProfileUpdated();
      }, 500);
      
    } catch (error) {
      console.error('个人资料更新失败:', error);
      toast({
        title: "更新失败",
        description: `无法更新个人资料: ${error instanceof Error ? error.message : '未知错误'}`,
        variant: "destructive",
      });
    } finally {
      // 使用延迟确保其他状态已更新
      setTimeout(() => {
        setIsLoading(false);
      }, 200);
    }
  };
  
  return (
    <>
      {/* 图像裁剪组件 */}
      {cropImageSrc && (
        <ProfileImageCrop
          open={isCropperOpen}
          onOpenChange={(isOpen) => {
            setIsCropperOpen(isOpen);
            // 如果用户关闭了裁剪对话框而没有裁剪，确保主对话框依然打开
            if (!isOpen) {
              console.log('裁剪对话框关闭，确保主对话框保持打开');
            }
          }}
          imageSrc={cropImageSrc}
          cropType={cropType}
          onCropComplete={handleCropComplete}
          title={cropType === 'avatar' ? '裁剪头像' : '裁剪封面图片'}
        />
      )}
      
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button
            variant={triggerVariant}
            size={triggerSize}
            className={triggerClassName}
          >
            <Edit className="h-4 w-4 mr-2" />
            {buttonLabel}
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-xl flex items-center gap-2">
              <User className="h-5 w-5" />
              编辑个人资料
            </DialogTitle>
          </DialogHeader>
          
          {/* 封面图 */}
          <div className="relative w-full h-48 bg-muted">
            {coverImagePreview ? (
              <img
                key={`cover-preview-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`}
                src={coverImagePreview}
                alt="封面图片"
                className="w-full h-full object-cover cover-preview-img"
                loading="eager"
                decoding="sync"
                style={{ transition: 'opacity 0.2s ease-in-out' }}
                onLoad={() => console.log('封面图预览图片加载成功')}
                onError={(e) => {
                  console.error('封面图预览图片加载失败', e);
                  // 尝试重新加载
                  const img = e.currentTarget;
                  if (img.src) {
                    const src = img.src;
                    img.src = '';
                    setTimeout(() => {
                      img.src = src;
                    }, 10);
                  }
                }}
              />
            ) : user?.coverImageUrl ? (
              <img
                src={fixMinioUrl(user.coverImageUrl)}
                alt="封面图片"
                className="w-full h-full object-cover"
                loading="eager"
                decoding="sync"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">添加封面图片</span>
              </div>
            )}
            
            {/* 封面图编辑按钮 */}
            <div className="absolute right-4 bottom-4 flex gap-2">
              {coverImagePreview && (
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={clearCoverImagePreview}
                  className="bg-black/50 hover:bg-black/70 text-white border-none rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
              <Label
                htmlFor="coverImageInput"
                className="cursor-pointer rounded-full bg-black/50 hover:bg-black/70 p-2.5 text-white transition-colors"
              >
                <Camera className="h-5 w-5" />
                <span className="sr-only">上传封面图片</span>
              </Label>
              <Input
                id="coverImageInput"
                ref={coverImageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverImageChange}
              />
            </div>
          </div>
          
          {/* 头像 - 放在封面图上 */}
          <div className="px-6 relative -mt-12 mb-6 flex items-end gap-4">
            <div className="relative">
              <div className="h-24 w-24 border-4 border-background shadow-md rounded-full overflow-hidden">
                {avatarPreview ? (
                  <img
                    key={`avatar-preview-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`}
                    src={avatarPreview}
                    alt="头像预览"
                    className="w-full h-full object-cover avatar-preview-img"
                    loading="eager"
                    decoding="sync"
                    style={{ transition: 'opacity 0.2s ease-in-out' }}
                    onLoad={() => console.log('头像预览图片加载成功')}
                    onError={(e) => {
                      console.error('头像预览图片加载失败', e);
                      // 尝试重新加载
                      const img = e.currentTarget;
                      if (img.src) {
                        const src = img.src;
                        img.src = '';
                        setTimeout(() => {
                          img.src = src;
                        }, 10);
                      }
                    }}
                  />
                ) : user?.avatarUrl ? (
                  <img
                    src={fixMinioUrl(user.avatarUrl)}
                    alt={user.displayName || user.username}
                    className="w-full h-full object-cover"
                    loading="eager"
                    decoding="sync"
                  />
                ) : (
                  <div className="bg-muted w-full h-full flex items-center justify-center">
                    <Camera className="h-8 w-8 opacity-30" />
                  </div>
                )}
                
                {/* 头像编辑按钮 */}
                <Label
                  htmlFor="avatarInput"
                  className="cursor-pointer absolute bottom-0 right-0 rounded-full bg-primary p-1.5 text-primary-foreground shadow-md hover:bg-primary/90 transition-colors"
                >
                  <Camera className="h-4 w-4" />
                  <span className="sr-only">上传头像</span>
                </Label>
                <Input
                  id="avatarInput"
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                
                {/* 删除头像按钮 */}
                {avatarPreview && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={clearAvatarPreview}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            
            <h2 className="text-lg font-medium">
              {user?.displayName || user?.username}
            </h2>
          </div>
          
          {/* 表单内容 */}
          <div className="px-6 pb-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">显示名称</Label>
              <Input
                id="displayName"
                placeholder="显示名称"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio">个人简介</Label>
              <Textarea
                id="bio"
                placeholder="介绍一下你自己..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">位置</Label>
              <Input
                id="location"
                placeholder="例如: 北京，中国"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="website">网站</Label>
              <Input
                id="website"
                placeholder="例如: https://example.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
            
            <DialogFooter className="pt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button onClick={saveProfile} disabled={isLoading || updateProfileLoading}>
                {isLoading || updateProfileLoading ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 