'use client';

import { useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Edit, X, Upload, Camera, PlusCircleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { API_BASE_URL, fixMinioUrl } from '@/lib/utils';
import { getAccessToken, updateUserInLocalStorage } from '@/lib/auth';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProfileImageCrop } from '@/components/profile/profile-image-crop';
import { usePostDialog } from '@/components/providers/post-dialog-provider';

interface User {
  id: string;
  username: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  cover_image_url?: string;
  location?: string;
  website?: string;
  verified_email: boolean;
  created_at: string;
}

interface FixedEditButtonProps {
  user: User | null;
  onProfileUpdated: () => void;
}

export function FixedEditButton({ user, onProfileUpdated }: FixedEditButtonProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { openPostDialog } = usePostDialog();
  
  // 表单状态
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.location || '');
  const [website, setWebsite] = useState(user?.website || '');
  
  // 文件上传状态
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // 图像裁剪状态
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [cropType, setCropType] = useState<'avatar' | 'cover'>('avatar');
  
  // 文件输入引用
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  
  // 组件挂载时输出日志
  useEffect(() => {
    console.log('FixedEditButton组件已挂载，用户数据:', user);
  }, [user]);
  
  // 每次对话框打开时更新表单状态
  const handleOpenChange = (isOpen: boolean) => {
    console.log('对话框状态变化:', isOpen);
    
    setOpen(isOpen);
    
    if (isOpen && user) {
      console.log('填充表单数据:', user);
      setDisplayName(user.display_name || '');
      setBio(user.bio || '');
      setLocation(user.location || '');
      setWebsite(user.website || '');
      // 重置文件上传状态
      setAvatarFile(null);
      setCoverImageFile(null);
      setAvatarPreview(null);
      setCoverImagePreview(null);
    }
  };
  
  // 处理头像文件选择
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      toast({
        title: "文件类型错误",
        description: "请选择图片文件",
        variant: "destructive",
      });
      return;
    }
    
    // 打开裁剪对话框
    const reader = new FileReader();
    reader.onloadend = () => {
      setCropImageSrc(reader.result as string);
      setCropType('avatar');
      setIsCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };
  
  // 处理封面图片文件选择
  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      toast({
        title: "文件类型错误",
        description: "请选择图片文件",
        variant: "destructive",
      });
      return;
    }
    
    // 打开裁剪对话框
    const reader = new FileReader();
    reader.onloadend = () => {
      setCropImageSrc(reader.result as string);
      setCropType('cover');
      setIsCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };
  
  // 处理裁剪完成的回调
  const handleCropComplete = (croppedBlob: Blob) => {
    console.log(`裁剪完成: ${cropType}, 大小: ${croppedBlob.size}字节`);
    
    // 创建File对象用于上传
    const fileName = cropType === 'avatar' ? 'avatar.jpg' : 'cover.jpg';
    const croppedFile = new File([croppedBlob], fileName, { 
      type: 'image/jpeg',
      lastModified: Date.now()
    });
    
    // 创建预览URL
    const previewUrl = URL.createObjectURL(croppedBlob);
    console.log(`创建预览URL: ${previewUrl.substring(0, 30)}`);
    
    if (cropType === 'avatar') {
      console.log(`设置新头像文件: ${fileName}, 大小: ${croppedFile.size}字节`);
      setAvatarFile(croppedFile);
      setAvatarPreview(previewUrl);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    } else {
      console.log(`设置新封面图文件: ${fileName}, 大小: ${croppedFile.size}字节`);
      setCoverImageFile(croppedFile);
      setCoverImagePreview(previewUrl);
      if (coverImageInputRef.current) {
        coverImageInputRef.current.value = '';
      }
    }
    
    // 关闭裁剪对话框后，延迟一下再更新状态，确保 UI 正确显示
    setTimeout(() => {
      setOpen(true); // 确保编辑对话框保持打开状态
    }, 100);
  };
  
  // 清除头像预览
  const clearAvatarPreview = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  };
  
  // 清除封面图片预览
  const clearCoverImagePreview = () => {
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
      console.log('已获取认证头信息');
      
      // 1. 更新用户基本信息
      const userData: {
        display_name: string;
        bio: string;
        location: string;
        website: string;
      } = {
        display_name: displayName,
        bio,
        location,
        website,
      };
      
      console.log('准备上传数据:', userData);
      
      const userResponse = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        console.error('API错误:', errorText);
        throw new Error('更新用户信息失败');
      }
      
      // 更新localStorage中的用户信息
      updateUserInLocalStorage(userData);
      
      // 2. 如果有新头像文件，上传头像
      let newAvatarUrl = null;
      if (avatarFile) {
        console.log(`准备上传头像文件: ${avatarFile.name}, 大小: ${avatarFile.size}字节, 类型: ${avatarFile.type}`);
        
        if (avatarFile.size === 0) {
          console.error('头像文件大小为0，跳过上传');
          throw new Error('头像文件无效');
        }
        
        const avatarFormData = new FormData();
        avatarFormData.append('avatar', avatarFile, 'avatar.jpg');
        
        try {
          const avatarResponse = await fetch(`${API_BASE_URL}/users/me/avatar`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${getAccessToken()}`,
              // 不要设置 Content-Type，让浏览器自动设置
            },
            body: avatarFormData,
          });
          
          // 先尝试读取响应文本
          const responseText = await avatarResponse.text();
          console.log(`头像上传响应状态: ${avatarResponse.status}, 响应内容:`, responseText);
          
          if (!avatarResponse.ok) {
            console.error('头像上传错误:', responseText);
            throw new Error('上传头像失败');
          }
          
          // 尝试从响应中获取新的头像URL
          try {
            const responseData = JSON.parse(responseText);
            if (responseData && responseData.avatar_url) {
              newAvatarUrl = responseData.avatar_url;
              // 更新localStorage中的头像URL
              updateUserInLocalStorage({ avatar_url: newAvatarUrl });
              console.log(`获取到新的头像URL: ${newAvatarUrl}`);
            }
          } catch (e) {
            console.warn('无法解析头像上传响应为JSON:', e);
          }
        } catch (error) {
          console.error('头像上传出现异常:', error);
          throw new Error('上传头像过程中出错');
        }
      }
      
      // 3. 如果有新封面图文件，上传封面图
      let newCoverImageUrl = null;
      if (coverImageFile) {
        console.log(`准备上传封面图文件: ${coverImageFile.name}, 大小: ${coverImageFile.size}字节, 类型: ${coverImageFile.type}`);
        
        if (coverImageFile.size === 0) {
          console.error('封面图文件大小为0，跳过上传');
          throw new Error('封面图文件无效');
        }
        
        const coverImageFormData = new FormData();
        coverImageFormData.append('cover_image', coverImageFile, 'cover.jpg');
        
        try {
          const coverImageResponse = await fetch(`${API_BASE_URL}/users/me/cover-image`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${getAccessToken()}`,
              // 不要设置 Content-Type，让浏览器自动设置
            },
            body: coverImageFormData,
          });
          
          // 先尝试读取响应文本
          const responseText = await coverImageResponse.text();
          console.log(`封面图上传响应状态: ${coverImageResponse.status}, 响应内容:`, responseText);
          
          if (!coverImageResponse.ok) {
            console.error('封面图上传错误:', responseText);
            throw new Error('上传封面图失败');
          }
          
          // 尝试从响应中获取新的封面图URL
          try {
            const responseData = JSON.parse(responseText);
            if (responseData && responseData.cover_image_url) {
              newCoverImageUrl = responseData.cover_image_url;
              // 更新localStorage中的封面图URL
              updateUserInLocalStorage({ cover_image_url: newCoverImageUrl });
              console.log(`获取到新的封面图URL: ${newCoverImageUrl}`);
            }
          } catch (e) {
            console.warn('无法解析封面图上传响应为JSON:', e);
          }
        } catch (error) {
          console.error('封面图上传出现异常:', error);
          throw new Error('上传封面图过程中出错');
        }
      }
      
      console.log('个人资料保存成功');
      
      // 先关闭对话框
      setOpen(false);
      
      // 显示成功消息
      toast({
        title: "个人资料已更新",
        description: "您的个人资料已成功更新。",
      });
      
      // 确保异步回调被执行并加入一个短暂延迟以确保 API 缓存更新
      setTimeout(() => {
        console.log('调用 onProfileUpdated 回调函数');
        onProfileUpdated();
      }, 100);
      
    } catch (error) {
      console.error('更新个人资料失败:', error);
      toast({
        title: "更新失败",
        description: "无法更新个人资料，请稍后再试。",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 在编辑按钮被点击时添加日志
  const handleTriggerClick = () => {
    console.log('编辑按钮被点击');
  };

  return (
    <>
      <div className="fixed right-6 bottom-6 flex flex-col gap-4 items-center">
        <button
          onClick={openPostDialog}
          className="p-4 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
          aria-label="发布内容"
        >
          <PlusCircleIcon className="h-6 w-6" />
        </button>
        
        <button
          onClick={handleTriggerClick}
          className="p-4 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
          aria-label="编辑个人资料"
        >
          <Edit className="h-6 w-6" />
        </button>
      </div>
      
      {/* 图像裁剪组件 */}
      {cropImageSrc && (
        <ProfileImageCrop
          open={isCropperOpen}
          onOpenChange={setIsCropperOpen}
          imageSrc={cropImageSrc}
          cropType={cropType}
          onCropComplete={handleCropComplete}
          title={cropType === 'avatar' ? '裁剪头像' : '裁剪封面图片'}
        />
      )}
      
      {/* 对话框内容 */}
      <Dialog.Root open={open} onOpenChange={handleOpenChange}>
        <Dialog.Trigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="bg-background"
            onClick={handleTriggerClick}
          >
            <Edit className="h-4 w-4 mr-2" />
            编辑资料
          </Button>
        </Dialog.Trigger>
        
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80" />
          <Dialog.Content className="fixed z-50 top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-[90vw] max-w-md max-h-[85vh] overflow-y-auto">
            <Dialog.Title className="text-lg font-semibold">
              编辑个人资料
            </Dialog.Title>
            <Dialog.Description className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              更新您的个人资料信息
            </Dialog.Description>
            
            <div className="mt-6 space-y-6">
              {/* 封面图片 */}
              <div className="space-y-2">
                <Label htmlFor="coverImage" className="font-medium">封面图片</Label>
                <div className="relative w-full h-40 overflow-hidden rounded-lg bg-muted">
                  {coverImagePreview ? (
                    <>
                      <img
                        src={coverImagePreview}
                        alt="封面图片预览"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8"
                        onClick={clearCoverImagePreview}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : user?.cover_image_url ? (
                    <>
                      <img
                        src={fixMinioUrl(user.cover_image_url)}
                        alt="当前封面图片"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-white text-sm">点击更换封面图片</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">添加封面图片</span>
                    </div>
                  )}
                  
                  <div className="absolute left-4 bottom-4">
                    <Label
                      htmlFor="coverImageInput"
                      className="cursor-pointer rounded-full bg-background p-2 shadow-sm hover:bg-accent"
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
              </div>
              
              {/* 头像 */}
              <div className="space-y-2">
                <Label htmlFor="avatar" className="font-medium">头像</Label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      {avatarPreview ? (
                        <AvatarImage src={avatarPreview} alt="头像预览" />
                      ) : user?.avatar_url ? (
                        <AvatarImage src={fixMinioUrl(user.avatar_url)} alt={user.display_name || user.username} />
                      ) : (
                        <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                          {user?.username?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      )}
                      
                      {avatarPreview && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={clearAvatarPreview}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </Avatar>
                    
                    <Label
                      htmlFor="avatarInput"
                      className="cursor-pointer absolute -bottom-2 -right-2 rounded-full bg-primary text-primary-foreground p-2 shadow-sm hover:bg-primary/90"
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
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">上传新头像</h4>
                    <p className="text-xs text-muted-foreground">
                      支持JPG, PNG或GIF格式。建议尺寸为400x400像素。
                    </p>
                  </div>
                </div>
              </div>
              
              {/* 用户基本信息 */}
              <div className="space-y-2">
                <Label htmlFor="displayName">名称</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="您的显示名称"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">简介</Label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 p-2 min-h-[100px]"
                  placeholder="介绍一下您自己..."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">位置</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="您的位置"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="website">网站</Label>
                <Input
                  id="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="您的网站"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-2">
              <Dialog.Close asChild>
                <Button variant="outline" disabled={isLoading}>取消</Button>
              </Dialog.Close>
              <Button onClick={saveProfile} disabled={isLoading}>
                {isLoading ? '保存中...' : '保存'}
              </Button>
            </div>
            
            <Dialog.Close asChild>
              <button 
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
                aria-label="关闭"
                disabled={isLoading}
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}