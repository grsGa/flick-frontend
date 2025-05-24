'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, Square, MonitorSmartphone, Maximize } from 'lucide-react';
import { cn } from '@/lib/utils';

// 预设图片比例类型
export type AspectPreset = 'original' | 'wide' | 'square';

// 预设比例配置
const ASPECT_PRESETS = {
  original: { label: '原始比例', value: 0, icon: Maximize },
  wide: { label: '宽屏', value: 16/9, icon: MonitorSmartphone },
  square: { label: '正方形', value: 1, icon: Square },
};

// 缩放范围
const MIN_SCALE = 0.1; // 10% = 最小缩放比例，可以完全展示原始图片尺寸
const MAX_SCALE = 3.0; // 300% = 放大3倍

interface ImageCropProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  title?: string;
}

export function ImageCrop({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
  title = '编辑图片'
}: ImageCropProps) {
  // 基础状态
  const [imageLoaded, setImageLoaded] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<AspectPreset>('original');
  const [isLoading, setIsLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0);
  const [imageOriginalSize, setImageOriginalSize] = useState({ width: 0, height: 0 });
  const [cropSize, setCropSize] = useState({ width: 300, height: 300 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  
  // 引用
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const cropAreaRef = useRef<HTMLDivElement>(null);
  const dialogContentRef = useRef<HTMLDivElement>(null);
  
  // 将滑块值转换为缩放比例
  const currentScale = useMemo(() => {
    // 0-100 转换为 0.5-3.0
    return MIN_SCALE + (zoomLevel / 100) * (MAX_SCALE - MIN_SCALE);
  }, [zoomLevel]);
  
  // 添加是否图片完全显示在裁剪框内的计算
  const isImageFullyVisible = useMemo(() => {
    if (!imgRef.current || !cropAreaRef.current || !imageLoaded) return true;
    
    const img = imgRef.current;
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;
    
    // 当前图片的显示尺寸
    const displayWidth = imgWidth * currentScale;
    const displayHeight = imgHeight * currentScale;
    
    // 如果缩放后的尺寸不超过裁剪框的尺寸，则图片完全可见
    return displayWidth <= cropSize.width && displayHeight <= cropSize.height;
  }, [currentScale, cropSize.width, cropSize.height, imageLoaded]);
  
  // 图片变换样式 - 添加边框强调视觉效果
  const imageTransformStyle = useMemo(() => ({
    transform: `translate(-50%, -50%) translate(${imagePosition.x}px, ${imagePosition.y}px) scale(${currentScale})`,
    transformOrigin: 'center',
    position: 'absolute' as const,
    left: '50%',
    top: '50%',
    maxWidth: 'none',
    transition: isDragging ? 'none' : 'transform 0.1s ease-out',
    // 添加边框突出显示图片边界 - 非拖动时显示
    outline: !isDragging && isImageFullyVisible ? '1px dashed rgba(255,255,255,0.5)' : 'none',
  }), [imagePosition.x, imagePosition.y, currentScale, isDragging, isImageFullyVisible]);
  
  // 对话框打开时重置状态
  useEffect(() => {
    if (open) {
      setImageLoaded(false);
      setSelectedPreset('original');
      setZoomLevel(0);
      setImagePosition({ x: 0, y: 0 });
      setImageOriginalSize({ width: 0, height: 0 });
      
      // 重置裁剪框尺寸到默认值
      setCropSize({ width: 300, height: 300 });
    }
  }, [open]);

  // 预加载图片获取原始尺寸
  useEffect(() => {
    if (!imageSrc || !open) return;
    
    const img = new Image();
    img.onload = () => {
      console.log('图片加载完成, 尺寸:', img.width, 'x', img.height);
      setImageOriginalSize({
        width: img.width,
        height: img.height
      });
    };
    img.onerror = (e) => {
      console.error('图片加载失败:', e);
    };
    img.src = imageSrc;
  }, [imageSrc, open]);

  // 图片加载完成处理
  const handleImageLoad = () => {
    if (!imgRef.current) return;
    
    const img = imgRef.current;
    console.log('图片已加载, 尺寸:', img.naturalWidth, 'x', img.naturalHeight);
    
    // 确保原始尺寸已设置
    if (imageOriginalSize.width === 0) {
      setImageOriginalSize({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    }
    
    setImageLoaded(true);
    
    // 使用setTimeout确保状态更新后再更新裁剪框
    setTimeout(() => {
      // 只有在初次加载时设置裁剪框尺寸，防止重复调整
      if (cropSize.width === 300 && cropSize.height === 300) {
        console.log('初次加载，设置初始裁剪框尺寸');
    updateCropSize(selectedPreset);
      } else {
        console.log('非初次加载，保持当前裁剪框尺寸');
        // 仅调整缩放比例以适应当前裁剪框
        resetZoomAndPosition();
      }
    }, 0);
  };

  // 更新裁剪框大小
  const updateCropSize = (preset: AspectPreset) => {
    if (!dialogContentRef.current || !imageOriginalSize.width) {
      console.warn('无法更新裁剪框: dialogContent不存在或图片尺寸未知');
      return;
    }
    
    // 限制裁剪框的最大尺寸，防止无限增大
    const MAX_CROP_WIDTH = 2000;  // 设置合理的最大值
    const MAX_CROP_HEIGHT = 2000;
    
    // 获取对话框可用空间
    const dialogWidth = dialogContentRef.current.clientWidth;
    const dialogHeight = dialogContentRef.current.clientHeight;
    const availableHeight = dialogHeight - 220; // 增加减去的高度，为底部和顶部菜单留出更多空间
    
    console.log('对话框可用空间:', dialogWidth, 'x', availableHeight);
    
    // 增加可用最大空间百分比 - 使用95%的空间确保更好地显示图片
    const maxWidth = Math.min(dialogWidth * 0.95, MAX_CROP_WIDTH); 
    const maxHeight = Math.min(availableHeight * 0.95, MAX_CROP_HEIGHT);
    
    // 获取图片原始尺寸和比例
    const imgWidth = Math.min(imageOriginalSize.width, MAX_CROP_WIDTH);  // 限制图片原始尺寸的上限
    const imgHeight = Math.min(imageOriginalSize.height, MAX_CROP_HEIGHT);
    const imgRatio = imgWidth / imgHeight;
    const isLandscape = imgRatio >= 1; // 横图
    
    console.log('图片原始尺寸(受限):', imgWidth, 'x', imgHeight, '比例:', imgRatio, isLandscape ? '(横图)' : '(竖图)');
    console.log('最大可用空间:', maxWidth, 'x', maxHeight);
    
    let width = 0, height = 0;
    let initialScale = 1.0; // 初始缩放比例
    
    // 添加静态检查以防止裁剪框尺寸异常
    const hasExistingCropSize = cropSize.width > 0 && cropSize.height > 0;
    const isCropSizeReasonable = cropSize.width <= MAX_CROP_WIDTH && cropSize.height <= MAX_CROP_HEIGHT;
    
    // 如果已有合理的裁剪框尺寸且当前预设没变，尝试保留尺寸只调整缩放
    if (hasExistingCropSize && isCropSizeReasonable && selectedPreset === preset) {
      console.log('保留当前裁剪框尺寸:', cropSize.width, 'x', cropSize.height);
      
      // 计算适合的缩放比例
      if (imgWidth > cropSize.width || imgHeight > cropSize.height) {
        const scaleX = cropSize.width / imgWidth;
        const scaleY = cropSize.height / imgHeight;
        initialScale = Math.min(scaleX, scaleY);
      }
      
      // 跳过下面的尺寸计算
      width = cropSize.width;
      height = cropSize.height;
    } else {
      // 没有合理的裁剪框尺寸或预设变了，重新计算
      switch (preset) {
        case 'original': 
          // 原始比例 - 关键改进：确保裁剪框内显示整个图片，必要时缩小图片
          if (isLandscape) { // 横图
            if (imgWidth <= maxWidth && imgHeight <= maxHeight) {
              // 图片尺寸小于可用空间，直接使用原始尺寸
              width = imgWidth;
              height = imgHeight;
              initialScale = 1.0; // 原始大小，不需要缩放
            } else {
              // 需要缩小适应可用空间 - 关键改变：采用固定裁剪框并缩小图片的策略
              
              // 计算可用空间内最大可能的裁剪框尺寸（保持原始比例）
              const scaleByWidth = maxWidth / imgWidth;
              const scaleByHeight = maxHeight / imgHeight;
              const scale = Math.min(scaleByWidth, scaleByHeight);
              
              // 确定裁剪框尺寸为图片原始尺寸
              width = imgWidth;
              height = imgHeight;
              
              // 设置初始缩放比例小于1.0，以使图片缩小到可见范围
              initialScale = scale;
              console.log('图片需要缩小显示，缩放比例:', scale);
            }
          } else { // 竖图
            if (imgWidth <= maxWidth && imgHeight <= maxHeight) {
              // 图片尺寸小于可用空间，直接使用原始尺寸
              width = imgWidth;
              height = imgHeight;
              initialScale = 1.0; // 原始大小，不需要缩放
            } else {
              // 需要缩小适应可用空间 - 关键改变：采用固定裁剪框并缩小图片的策略
              
              // 计算可用空间内最大可能的裁剪框尺寸（保持原始比例）
              const scaleByWidth = maxWidth / imgWidth;
              const scaleByHeight = maxHeight / imgHeight;
              const scale = Math.min(scaleByWidth, scaleByHeight);
              
              // 确定裁剪框尺寸为图片原始尺寸
              width = imgWidth;
              height = imgHeight;
              
              // 设置初始缩放比例小于1.0，以使图片缩小到可见范围
              initialScale = scale;
              console.log('图片需要缩小显示，缩放比例:', scale);
            }
          }
          
          // 特殊处理：如果图片尺寸非常小
          if (imgWidth < 200 && imgHeight < 200) {
            // 适当放大小图片，但最多放大3倍
            const scaleFactor = Math.min(3, 300 / Math.max(imgWidth, imgHeight));
            if (scaleFactor > 1) {
              width = imgWidth;
              height = imgHeight;
              initialScale = 1.0; // 小图始终从原始大小开始
              console.log('小图片，使用原始大小以便查看');
            }
          }
          break;
        
        case 'wide':
          // 16:9 宽屏比例
          const wideRatio = 16/9;
          
          // 设置裁剪框为16:9，同时考虑适应图片
          if (isLandscape) {
            // 横图先适应宽度
            width = Math.min(maxWidth, imgWidth);
            height = width / wideRatio;
            
            // 检查高度是否超出
          if (height > maxHeight) {
            height = maxHeight;
              width = height * wideRatio;
            }
            
            // 计算适配后的缩放比例
            const imgAreaWide = imgWidth * imgHeight;
            const cropAreaWide = width * height;
            initialScale = Math.min(1.0, Math.sqrt(cropAreaWide / imgAreaWide));
          } else {
            // 竖图先适应高度
            height = Math.min(maxHeight, imgHeight);
            width = height * wideRatio;
            
            // 检查宽度是否超出
            if (width > maxWidth) {
              width = maxWidth;
              height = width / wideRatio;
            }
            
            // 计算适配后的缩放比例
            const imgAreaWide = imgWidth * imgHeight;
            const cropAreaWide = width * height;
            initialScale = Math.min(1.0, Math.sqrt(cropAreaWide / imgAreaWide));
          }
          break;
        
        case 'square':
          // 1:1 正方形
          const size = Math.min(maxWidth, maxHeight);
          width = size;
          height = size;
          
          // 适配图片到正方形裁剪框
          if (isLandscape) {
            // 横图以高为基准
            initialScale = Math.min(1.0, height / imgHeight);
          } else {
            // 竖图以宽为基准
            initialScale = Math.min(1.0, width / imgWidth);
          }
          break;
        }
      
      // 确保裁剪框尺寸不小于最小值
      width = Math.max(width, 300);
      height = Math.max(height, 300);
      
      // 如果裁剪框太大超出最大可用空间，则等比例缩小裁剪框
      if (width > maxWidth || height > maxHeight) {
        const cropScaleByWidth = maxWidth / width;
        const cropScaleByHeight = maxHeight / height;
        const cropScale = Math.min(cropScaleByWidth, cropScaleByHeight);
        
        width = width * cropScale;
        height = height * cropScale;
        
        // 调整缩放比例以适应新的裁剪框尺寸
        initialScale = initialScale * cropScale;
      }
    }
    
    // 最终安全检查：确保尺寸在合理范围内
    width = Math.max(300, Math.min(width, MAX_CROP_WIDTH));
    height = Math.max(300, Math.min(height, MAX_CROP_HEIGHT));
    
    // 确保初始缩放比例不低于最小值
    initialScale = Math.max(initialScale, MIN_SCALE);
    
    // 设置裁剪区域大小
      const roundedWidth = Math.round(width);
      const roundedHeight = Math.round(height);
      
    console.log('最终裁剪框尺寸:', roundedWidth, 'x', roundedHeight, '初始缩放比例:', initialScale);
    
      setCropSize({ 
        width: roundedWidth, 
        height: roundedHeight 
      });
      
    // 重置位置
    setImagePosition({ x: 0, y: 0 });
    
    // 计算初始缩放级别
    // 将缩放比例(initialScale)转换为滑块值(0-100)
    // MIN_SCALE 到 MAX_SCALE 对应 0-100
    const initialZoomLevel = Math.round(((initialScale - MIN_SCALE) / (MAX_SCALE - MIN_SCALE)) * 100);
      
    console.log('设置初始缩放级别:', initialZoomLevel);
    setZoomLevel(initialZoomLevel);
  };

  // 处理预设变更
  const handlePresetChange = (preset: AspectPreset) => {
    // 修改预设
    setSelectedPreset(preset);
    
    // 记录当前裁剪框尺寸，用于检测变化
    const prevWidth = cropSize.width;
    const prevHeight = cropSize.height;
    
    // 更新裁剪框
    updateCropSize(preset);
    
    // 添加日志以便调试
    console.log(`预设变更为 ${preset}，裁剪框: ${prevWidth}x${prevHeight} -> ${cropSize.width}x${cropSize.height}`);
  };

  // 图片拖动处理
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!imageLoaded) return;
    
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragStartPos({ ...imagePosition });
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // 全局鼠标事件处理
  useEffect(() => {
      if (!isDragging) return;
      
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      
      setImagePosition({
        x: dragStartPos.x + dx,
        y: dragStartPos.y + dy
      });
    };
    
    const handleMouseUpGlobal = () => {
      setIsDragging(false);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUpGlobal);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUpGlobal);
    };
  }, [isDragging, dragStart, dragStartPos]);
  
  // 处理滑块缩放变化
  const handleZoomChange = (values: number[]) => {
    setZoomLevel(values[0]);
    
    // 缩放到最小值时重置位置
    if (values[0] === 0) {
      setImagePosition({ x: 0, y: 0 });
    }
  };
  
  // 重置位置和缩放 - 修复无限扩大问题
  const resetZoomAndPosition = () => {
    // 不再调用updateCropSize，避免每次重置都调整裁剪框尺寸
    
    // 只重置位置和缩放
    setImagePosition({ x: 0, y: 0 });
    
    // 获取图片原始尺寸和比例
    const imgWidth = imageOriginalSize.width;
    const imgHeight = imageOriginalSize.height;
    
    // 根据当前裁剪框尺寸计算适合的缩放比例
    let newScale = 1.0;
    
    // 如果图片大于裁剪框，需要计算适当的缩放比例
    if (imgWidth > cropSize.width || imgHeight > cropSize.height) {
      const scaleX = cropSize.width / imgWidth;
      const scaleY = cropSize.height / imgHeight;
      newScale = Math.min(scaleX, scaleY);
      
      // 确保不低于最小缩放比例
      newScale = Math.max(newScale, MIN_SCALE);
    }
    
    // 计算并设置缩放级别
    const newZoomLevel = Math.round(((newScale - MIN_SCALE) / (MAX_SCALE - MIN_SCALE)) * 100);
    console.log('重置: 新缩放比例:', newScale, '缩放级别:', newZoomLevel);
    
    setZoomLevel(newZoomLevel);
  };
  
  // 应用裁剪
  const applyCrop = async () => {
    if (!imgRef.current || !cropAreaRef.current || !imageLoaded) {
      console.error('裁剪失败：图片未加载或引用缺失');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const img = imgRef.current;
      const cropArea = cropAreaRef.current;
      
      // 获取元素的位置和尺寸
      const imgRect = img.getBoundingClientRect();
      const cropRect = cropArea.getBoundingClientRect();
      
      // 图片中心与裁剪框中心的偏移量
      const imgCenterX = imgRect.left + imgRect.width / 2;
      const imgCenterY = imgRect.top + imgRect.height / 2;
      const cropCenterX = cropRect.left + cropRect.width / 2;
      const cropCenterY = cropRect.top + cropRect.height / 2;
      const offsetX = imgCenterX - cropCenterX;
      const offsetY = imgCenterY - cropCenterY;
      
      // 计算原始图片与显示图片的比例
      const displayRatio = img.naturalWidth / imgRect.width;
      
      // 将偏移量转换为原始图片上的像素偏移
      const offsetInOriginalX = offsetX * displayRatio;
      const offsetInOriginalY = offsetY * displayRatio;
      
      // 计算原始图片上的裁剪区域
      const cropWidthInOriginal = cropRect.width * displayRatio;
      const cropHeightInOriginal = cropRect.height * displayRatio;
      
      // 计算裁剪起始点(以原始图片中心为参考点)
      const cropStartX = (img.naturalWidth / 2) - offsetInOriginalX - (cropWidthInOriginal / 2);
      const cropStartY = (img.naturalHeight / 2) - offsetInOriginalY - (cropHeightInOriginal / 2);
      
      // 确保裁剪区域在原始图片范围内
      const finalCropX = Math.max(0, cropStartX);
      const finalCropY = Math.max(0, cropStartY);
      let finalCropWidth = cropWidthInOriginal;
      let finalCropHeight = cropHeightInOriginal;
      
      // 如果裁剪区域超出了原始图片的边界，则调整宽高
      if (finalCropX + finalCropWidth > img.naturalWidth) {
        finalCropWidth = img.naturalWidth - finalCropX;
      }
      
      if (finalCropY + finalCropHeight > img.naturalHeight) {
        finalCropHeight = img.naturalHeight - finalCropY;
      }
      
      // 创建Canvas绘制裁剪后的图片
      const canvas = document.createElement('canvas');
      canvas.width = cropWidthInOriginal;
      canvas.height = cropHeightInOriginal;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('无法创建Canvas上下文');
      }
      
      // 绘制裁剪后的图片
      ctx.drawImage(
        img,
        finalCropX, finalCropY, finalCropWidth, finalCropHeight,
        0, 0, cropWidthInOriginal, cropHeightInOriginal
      );
      
      // 转换为Blob
      const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Canvas转换Blob失败'));
              }
            },
            'image/jpeg',
            0.95
          );
      });
      
      // 调用回调函数并关闭对话框
      onCropComplete(blob);
      onOpenChange(false);
    } catch (error) {
      console.error('裁剪失败:', error);
      alert('裁剪失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 当图片原始尺寸发生变化时更新裁剪框
  useEffect(() => {
    if (imageOriginalSize.width > 0 && imageOriginalSize.height > 0) {
      updateCropSize(selectedPreset);
    }
  }, [imageOriginalSize.width, imageOriginalSize.height]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-5xl max-h-[95vh] p-0 overflow-hidden flex flex-col"
        ref={dialogContentRef}
      >
        <DialogHeader className="p-3 pb-0 shrink-0">
            <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        {/* 预设比例选择 */}
        <div className="flex flex-col items-center gap-1 p-2 border-b shrink-0">
          {/* 原始尺寸显示 */}
          <div className="w-full text-center">
            {imageLoaded ? (
              <div className="text-sm text-primary font-medium mb-1">
                {imageOriginalSize.width} × {imageOriginalSize.height}像素
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">加载中...</div>
            )}
          </div>
          
          <div className="flex justify-center gap-2">
            {Object.entries(ASPECT_PRESETS).map(([key, preset]) => {
              const PresetIcon = preset.icon;
              return (
                <Button
                  key={key}
                  variant={selectedPreset === key ? "default" : "outline"}
                  className={cn(
                    "h-8 px-3 py-1 text-xs",
                    selectedPreset === key && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => handlePresetChange(key as AspectPreset)}
                >
                  <PresetIcon className="h-4 w-4 mr-1" />
                  {preset.label}
                </Button>
              );
            })}
          </div>
        </div>
        
        {/* 图片编辑区域 - 增加高度并减少内边距 */}
        <div 
          className="flex-1 flex items-center justify-center p-4 min-h-[300px] bg-neutral-900 overflow-auto"
          ref={containerRef}
        >
            {/* 裁剪区域 */}
            <div 
            className="relative overflow-hidden bg-black/50"
              style={{
                width: cropSize.width,
                height: cropSize.height,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)',
              border: '2px solid white',
            }}
            ref={cropAreaRef}
          >
            {/* 裁剪区域背景网格 */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="w-full h-full bg-[repeating-conic-gradient(#ffffff10_0_25%,transparent_0_50%)_50%_50%_/_40px_40px]"></div>
            </div>
            
            {/* 裁剪区域网格辅助线 */}
            <div className="absolute inset-0 pointer-events-none">
              {/* 横向辅助线 */}
              <div className="absolute left-0 top-1/3 w-full h-px bg-white/30"></div>
              <div className="absolute left-0 top-2/3 w-full h-px bg-white/30"></div>
              {/* 纵向辅助线 */}
              <div className="absolute top-0 left-1/3 h-full w-px bg-white/30"></div>
              <div className="absolute top-0 left-2/3 h-full w-px bg-white/30"></div>
              {/* 中心点标记 */}
              <div className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-white/70 -translate-x-1/2 -translate-y-1/2"></div>
            </div>
            
            {/* 可拖动的图片 */}
            {imageSrc && (
              <div 
                className="absolute inset-0 overflow-hidden cursor-grab"
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                style={{ touchAction: 'none' }}
              >
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="待裁剪图片"
                  className="pointer-events-none select-none"
                  style={imageTransformStyle}
                  onLoad={handleImageLoad}
                  onError={(e) => console.error('图片加载失败:', e)}
                  draggable={false}
                />
                </div>
              )}
            
            {/* 尺寸信息提示 */}
            <div className="absolute flex flex-col gap-1 bottom-2 left-1/2 -translate-x-1/2 text-xs">
              {/* 完全显示提示 */}
              {isImageFullyVisible && (
                <div className="text-white/80 bg-black/50 rounded-sm px-1.5 py-0.5 text-center">
                  完整显示中
                </div>
              )}
              
              {/* 图片原始尺寸提示 */}
              {imageLoaded && imageOriginalSize.width > 0 && (
                <div className="text-white/70 bg-black/40 rounded-sm px-1.5 py-0.5 text-center">
                  {imageOriginalSize.width}×{imageOriginalSize.height}
                  <span className="text-primary-500/80 ml-1">
                    {currentScale < 1.0 ? `(${Math.round(currentScale * 100)}%)` : ''}
                  </span>
                </div>
              )}
            </div>

            {/* 裁剪区域四角标记 */}
              <div className="absolute left-0 top-0 w-3 h-3 border-l-2 border-t-2 border-white"></div>
              <div className="absolute right-0 top-0 w-3 h-3 border-r-2 border-t-2 border-white"></div>
              <div className="absolute left-0 bottom-0 w-3 h-3 border-l-2 border-b-2 border-white"></div>
              <div className="absolute right-0 bottom-0 w-3 h-3 border-r-2 border-b-2 border-white"></div>
            </div>
          
          {/* 加载中提示 */}
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center text-white bg-black/50">
              <p>图片加载中...</p>
          </div>
          )}
        </div>
        
        {/* 缩放控制 - 缩小高度 */}
        <div className="px-6 py-2 border-t shrink-0">
          <div className="flex items-center w-full space-x-4">
            <ZoomOut className="h-4 w-4 text-muted-foreground" />
            <Slider 
              value={[zoomLevel]}
              onValueChange={handleZoomChange}
              min={0}
              max={100}
              step={1}
              className="flex-1"
            />
            <ZoomIn className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground w-14 text-right">
              {Math.round(currentScale * 100)}%
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 px-2 text-xs"
              onClick={resetZoomAndPosition}
            >
              重置
            </Button>
          </div>
          
          <div className="flex justify-between items-center mt-1 text-xs">
            <p className="text-muted-foreground">
              {isImageFullyVisible 
                ? "图片完整显示" 
                : "图片超出裁剪框，部分区域不可见"}
            </p>
            <p className="text-xs text-primary/70 font-medium">
              {currentScale < 1.0 
                ? `缩小至${Math.round(currentScale * 100)}%` 
                : `放大至${Math.round(currentScale * 100)}%`}
            </p>
            </div>
        </div>
        
        {/* 底部按钮 - 减小高度 */}
        <DialogFooter className="p-3 pt-2 border-t shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="h-8 px-3 py-1 text-xs"
          >
            取消
          </Button>
          <Button 
            onClick={applyCrop} 
            disabled={!imageLoaded || isLoading}
            className="h-8 px-3 py-1 text-xs"
          >
            {isLoading ? '处理中...' : '应用裁剪'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 