'use client';

import { useState, useEffect, useRef } from 'react';
import { Camera, X, User, Image as ImageIcon } from 'lucide-react';
import { API_BASE_URL, fixMinioUrl } from '@/lib/utils';
import { getAccessToken } from '@/lib/auth';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ProfileImageCrop } from '@/components/profile/profile-image-crop';

// 定义用户类型
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

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onProfileUpdated: () => void;
}

export function EditProfileDialog({
  open,
  onOpenChange,
  user,
  onProfileUpdated
}: EditProfileDialogProps) {
  const { toast } = useToast();
  
  // 表单状态
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.location || '');
  const [website, setWebsite] = useState(user?.website || '');
  
  // 封面图和头像状态
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar_url || null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(user?.cover_image_url || null);
  
  // 图像裁剪状态
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [cropType, setCropType] = useState<'avatar' | 'cover'>('avatar');
  
  // 添加随机主题功能状态
  const [applyRandomTheme, setApplyRandomTheme] = useState(false);
  
  // 加载状态
  const [isLoading, setIsLoading] = useState(false);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  
  // 每次对话框打开时重置状态
  useEffect(() => {
    if (open && user) {
      setDisplayName(user.display_name || '');
      setBio(user.bio || '');
      setLocation(user.location || '');
      setWebsite(user.website || '');
      setAvatarPreview(user.avatar_url ? fixMinioUrl(user.avatar_url) : null);
      setCoverImagePreview(user.cover_image_url ? fixMinioUrl(user.cover_image_url) : null);
      setAvatarFile(null);
      setCoverImageFile(null);
      setApplyRandomTheme(false);
    }
  }, [open, user]);
  
  // 处理头像文件更改
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    console.log(`选择头像文件: ${file.name}, 大小: ${file.size}字节, 类型: ${file.type}`);
    
    // 重置input的值，确保即使选择相同文件也能触发onChange事件
    if (avatarInputRef.current) {
      // 保存文件引用后立即重置input，这样即使用户取消也能重新选择相同文件
      setTimeout(() => {
        if (avatarInputRef.current) {
          avatarInputRef.current.value = '';
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
      console.log(`设置新头像文件和预览: ${fileName}, 大小: ${croppedFile.size}字节`);
      setAvatarFile(croppedFile);
      setAvatarPreview(previewUrl);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    } else {
      console.log(`设置新封面图文件和预览: ${fileName}, 大小: ${croppedFile.size}字节`);
      setCoverImageFile(croppedFile);
      setCoverImagePreview(previewUrl);
      if (coverImageInputRef.current) {
        coverImageInputRef.current.value = '';
      }
    }
  };
  
  // 清除头像预览
  const clearAvatarPreview = () => {
    setAvatarPreview(null);
    setAvatarFile(null);
  };
  
  // 清除封面图预览
  const clearCoverImagePreview = () => {
    setCoverImagePreview(null);
    setCoverImageFile(null);
  };
  
  // 应用随机主题
  const handleApplyRandomTheme = () => {
    setApplyRandomTheme(!applyRandomTheme);
  };
  
  // 保存个人资料
  const saveProfile = async () => {
    if (!user) return;
    
    console.log('尝试保存个人资料...');
    setIsLoading(true);
    
    try {
      // 1. 首先更新用户基本信息
      const userData = {
        display_name: displayName,
        bio,
        location,
        website,
        apply_random_theme: applyRandomTheme // 发送随机主题请求
      };
      
      console.log('准备上传基本信息:', userData);
      
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
        console.error('更新用户信息失败:', errorText);
        throw new Error('更新用户信息失败');
      }
      
      // 2. 如果有新头像文件，上传头像
      if (avatarFile) {
        console.log(`准备上传头像文件: ${avatarFile.name}, 大小: ${avatarFile.size}字节, 类型: ${avatarFile.type}`);
        
        if (avatarFile.size === 0) {
          console.error('头像文件大小为0，跳过上传');
          throw new Error('头像文件无效');
        }
        
        const avatarFormData = new FormData();
        avatarFormData.append('avatar', avatarFile);
        
        const avatarResponse = await fetch(`${API_BASE_URL}/users/me/avatar`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getAccessToken()}`,
          },
          body: avatarFormData,
        });
        
        if (!avatarResponse.ok) {
          const errorText = await avatarResponse.text();
          console.error('上传头像失败:', errorText);
          throw new Error('上传头像失败');
        } else {
          console.log('头像上传成功');
        }
      }
      
      // 3. 如果有新封面图文件，上传封面图
      if (coverImageFile) {
        console.log(`准备上传封面图文件: ${coverImageFile.name}, 大小: ${coverImageFile.size}字节, 类型: ${coverImageFile.type}`);
        
        if (coverImageFile.size === 0) {
          console.error('封面图文件大小为0，跳过上传');
          throw new Error('封面图文件无效');
        }
        
        const coverImageFormData = new FormData();
        coverImageFormData.append('cover_image', coverImageFile);
        
        const coverImageResponse = await fetch(`${API_BASE_URL}/users/me/cover-image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getAccessToken()}`,
          },
          body: coverImageFormData,
        });
        
        if (!coverImageResponse.ok) {
          const errorText = await coverImageResponse.text();
          console.error('上传封面图失败:', errorText);
          throw new Error('上传封面图失败');
        } else {
          console.log('封面图上传成功');
        }
      }
      
      // 更新成功
      console.log('个人资料更新成功');
      onProfileUpdated();
      onOpenChange(false);
      toast({
        title: "资料已更新",
        description: "您的个人资料已成功更新",
        duration: 3000,
      });
    } catch (error) {
      console.error('个人资料更新失败:', error);
      toast({
        title: "更新失败",
        description: `无法更新个人资料: ${error instanceof Error ? error.message : '未知错误'}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
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
                src={coverImagePreview}
                alt="封面图片"
                className="w-full h-full object-cover"
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
              <Avatar className="h-24 w-24 border-4 border-background shadow-md">
                {avatarPreview ? (
                  <AvatarImage src={avatarPreview} alt="头像预览" />
                ) : user?.avatar_url ? (
                  <AvatarImage src={fixMinioUrl(user.avatar_url)} alt={user.display_name || user.username} />
                ) : (
                  <AvatarFallback className="bg-primary text-xl text-primary-foreground">
                    {displayName ? displayName.charAt(0).toUpperCase() : user?.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
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
              </Avatar>
            </div>
            
            <div className="pb-2">
              <p className="text-sm font-medium">更改个人头像</p>
              <p className="text-xs text-muted-foreground mt-1">
                推荐使用正方形图片，最佳尺寸为400×400像素
              </p>
            </div>
          </div>
          
          {/* 表单 */}
          <div className="px-6 pb-6 space-y-5">
            {/* 名称 */}
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-sm font-medium">
                名称
              </Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="您的显示名称"
                maxLength={50}
              />
            </div>
            
            {/* 简介 */}
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-medium flex justify-between">
                简介
                <span className="text-xs text-muted-foreground">{bio.length}/200</span>
              </Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="介绍一下您自己..."
                maxLength={200}
                className="resize-none"
                rows={3}
              />
            </div>
            
            {/* 位置 */}
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium">
                位置
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="您的位置"
              />
            </div>
            
            {/* 网站 */}
            <div className="space-y-2">
              <Label htmlFor="website" className="text-sm font-medium">
                网站
              </Label>
              <Input
                id="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="您的网站或社交媒体链接"
              />
            </div>
            
            {/* 主题选项 */}
            <div className="pt-2">
              <div className="flex items-center space-x-2">
                <input
                  id="randomTheme"
                  type="checkbox"
                  className="w-4 h-4 text-primary border-primary rounded focus:ring-primary"
                  checked={applyRandomTheme}
                  onChange={handleApplyRandomTheme}
                />
                <Label htmlFor="randomTheme" className="text-sm cursor-pointer">
                  为我的个人资料应用随机主题
                </Label>
              </div>
              <p className="text-xs text-muted-foreground mt-1 ml-6">
                系统将自动创建一个符合您个性的有趣主题
              </p>
            </div>
          </div>
          
          {/* 底部按钮 */}
          <DialogFooter className="p-4 border-t bg-muted/50">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button
              onClick={saveProfile}
              disabled={isLoading}
            >
              {isLoading ? "保存中..." : "保存更改"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 图像裁剪组件 */}
      {cropImageSrc && (
        <ProfileImageCrop
          open={isCropperOpen}
          onOpenChange={(open) => {
            setIsCropperOpen(open);
            // 当关闭裁剪对话框时，重置cropImageSrc以确保下次可以重新打开
            if (!open) {
              // 立即重置裁剪状态
              setCropImageSrc(null);
            }
          }}
          imageSrc={cropImageSrc || ''}
          cropType={cropType}
          onCropComplete={(blob) => {
            handleCropComplete(blob);
          }}
          title={cropType === 'avatar' ? '裁剪头像' : '裁剪封面图片'}
        />
      )}
    </>
  );
} 