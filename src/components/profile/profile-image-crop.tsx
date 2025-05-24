'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Crop, ZoomIn, ZoomOut, Move } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Slider } from '@/components/ui/slider';

// 裁剪比例设置
const CROP_RATIOS = {
  avatar: 1, // 头像为正方形 1:1
  cover: 8/3,  // 封面图为横向矩形 8:3
};

// 最小/最大裁剪尺寸
const MIN_CROP_SIZE = {
  avatar: { width: 100, height: 100 },
  cover: { width: 300, height: 112 },
};

const MAX_CROP_SIZE = {
  avatar: { width: 500, height: 500 },
  cover: { width: 1000, height: 375 },
};

// 在文件中更新缩放范围的最小值
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;

interface ProfileImageCropProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  title?: string;
  cropType: 'avatar' | 'cover';
}

export function ProfileImageCrop({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
  title = '编辑个人图片',
  cropType = 'avatar'
}: ProfileImageCropProps) {
  // 图片状态
  const [imageLoaded, setImageLoaded] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  
  // 裁剪状态
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, width: 300, height: 300 });
  
  // 图片位置与缩放
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // 拖动与调整状态
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isDraggingCropBox, setIsDraggingCropBox] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState('');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [dragStartSize, setDragStartSize] = useState({ width: 0, height: 0 });
  
  // UI 加载状态
  const [isLoading, setIsLoading] = useState(false);
  
  // 定义裁剪比例
  const aspectRatio = CROP_RATIOS[cropType];
  
  // 引用
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const cropAreaRef = useRef<HTMLDivElement>(null);
  
  // 当对话框打开时初始化
  useEffect(() => {
    if (open) {
      resetState();
    }
  }, [open]);
  
  // 重置所有状态
  const resetState = () => {
    setImageLoaded(false);
    setNaturalSize({ width: 0, height: 0 });
    setDisplaySize({ width: 0, height: 0 });
    setCropBox({ x: 0, y: 0, width: 300, height: 300 });
    setImagePosition({ x: 0, y: 0 });
    setZoomLevel(1);
    setIsDraggingImage(false);
    setIsDraggingCropBox(false);
    setIsResizing(false);
  };
  
  // 处理图片加载完成
  const handleImageLoad = () => {
    if (!imgRef.current || !containerRef.current) return;
    
    const img = imgRef.current;
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    // 记录图片原始尺寸
    const imgNaturalWidth = img.naturalWidth;
    const imgNaturalHeight = img.naturalHeight;
    setNaturalSize({ width: imgNaturalWidth, height: imgNaturalHeight });
    
    console.log("图片原始尺寸:", imgNaturalWidth, "x", imgNaturalHeight);
    console.log("容器尺寸:", containerRect.width, "x", containerRect.height);
    
    // 计算图片方向和比例
    const imgRatio = imgNaturalWidth / imgNaturalHeight;
    const isLandscape = imgRatio >= 1; // 是否为横图
    const isPortrait = imgRatio < 1; // 是否为竖图
    
    console.log("图片比例:", imgRatio, isLandscape ? "横图" : "竖图");
    
    // 初始化裁剪框大小 - 先确定裁剪框的大小和位置
    let cropWidth, cropHeight;
    if (cropType === 'avatar') {
      // 头像为正方形，尺寸较小
      cropWidth = Math.min(containerRect.width * 0.6, containerRect.height * 0.6, MAX_CROP_SIZE.avatar.width);
      cropHeight = cropWidth;
    } else {
      // 封面图为特定比例
      if (containerRect.width / aspectRatio > containerRect.height * 0.6) {
        // 以高度为限制
        cropHeight = containerRect.height * 0.6;
        cropWidth = cropHeight * aspectRatio;
      } else {
        // 以宽度为限制
        cropWidth = containerRect.width * 0.6;
        cropHeight = cropWidth / aspectRatio;
      }
      
      // 确保不超过最大尺寸
      if (cropWidth > MAX_CROP_SIZE.cover.width) {
        cropWidth = MAX_CROP_SIZE.cover.width;
        cropHeight = cropWidth / aspectRatio;
      }
    }
    
    // 裁剪框居中
    const cropX = (containerRect.width - cropWidth) / 2;
    const cropY = (containerRect.height - cropHeight) / 2;
    
    setCropBox({
      x: cropX,
      y: cropY,
      width: cropWidth,
      height: cropHeight
    });
    
    console.log("裁剪框尺寸:", cropWidth, "x", cropHeight);
    
    // 基于裁剪框大小计算图片的初始显示尺寸
    let initialWidth, initialHeight;
    
    // 根据图片长宽比和裁剪框大小确定初始显示大小
    // 关键改进：确保图片初始比裁剪框小，方便用户看到整个图片
    if (cropType === 'avatar') {
      // 头像裁剪 - 确保图片比裁剪框稍小
      const scaleFactor = 0.85; // 将图片初始大小设为裁剪框的85%
      const cropBoxRatio = cropWidth / cropHeight; // 应该是1:1
      
      if (imgRatio > cropBoxRatio) {
        // 图片更宽，以宽度为基准
        initialWidth = cropWidth * scaleFactor;
        initialHeight = initialWidth / imgRatio;
      } else {
        // 图片更高，以高度为基准
        initialHeight = cropHeight * scaleFactor;
        initialWidth = initialHeight * imgRatio;
      }
    } else {
      // 封面图裁剪 - 根据图片方向性优化初始显示
      const scaleFactor = 0.85; // 将图片初始大小设为裁剪框的85%
      
      if (isPortrait) {
        // 竖图 - 图片的宽度与裁剪框的宽度对比
        initialWidth = cropWidth * scaleFactor;
        initialHeight = initialWidth / imgRatio;
        
        // 检查是否超出了合理高度（4倍裁剪框高度）
        const maxReasonableHeight = cropHeight * 4;
        if (initialHeight > maxReasonableHeight) {
          initialHeight = maxReasonableHeight;
          initialWidth = initialHeight * imgRatio;
        }
      } else {
        // 横图 - 图片的高度与裁剪框的高度对比
        initialHeight = cropHeight * scaleFactor;
        initialWidth = initialHeight * imgRatio;
        
        // 检查宽度是否足够，如果太窄则放大
        if (initialWidth < cropWidth * 0.85) {
          initialWidth = cropWidth * 0.85;
          initialHeight = initialWidth / imgRatio;
        }
      }
    }
    
    console.log("图片初始显示尺寸:", initialWidth, "x", initialHeight);
    
    // 更新显示尺寸
    setDisplaySize({ width: initialWidth, height: initialHeight });
    
    // 初始化图片位置为容器中心
    setImagePosition({
      x: containerRect.width / 2,
      y: containerRect.height / 2
    });
    
    // 重置缩放级别
    setZoomLevel(1);
    
    setImageLoaded(true);
  };
  
  // 图片加载错误处理
  const handleImageError = () => {
    toast({
      title: "图片加载失败",
      description: "无法加载图片，请尝试使用其他图片",
      variant: "destructive"
    });
  };
  
  // 缩放控制 - 更新缩放范围和描述
  const handleZoomChange = (value: number[]) => {
    setZoomLevel(value[0]);
  };
  
  // ----- 图片拖动处理 -----
  const handleImageMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDraggingImage(true);
    
    // 记录当前鼠标位置和图片位置
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragStartPos({ ...imagePosition });
  };
  
  // ----- 裁剪框拖动处理 -----
  const handleCropBoxMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDraggingCropBox(true);
    
    // 记录当前鼠标位置和裁剪框位置
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragStartPos({ ...cropBox });
  };
  
  // ----- 裁剪框调整大小处理 -----
  const handleResizeMouseDown = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizeDirection(direction);
    
    // 记录当前鼠标位置、裁剪框位置和尺寸
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragStartPos({ x: cropBox.x, y: cropBox.y });
    setDragStartSize({ width: cropBox.width, height: cropBox.height });
  };
  
  // 全局鼠标移动和释放事件处理
  useEffect(() => {
    if (!isDraggingImage && !isDraggingCropBox && !isResizing) return;
    
    // 鼠标事件处理函数
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleDragMove(e.clientX, e.clientY);
    };
    
    // 触摸事件处理函数
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        handleDragMove(touch.clientX, touch.clientY);
      }
    };
    
    // 统一拖动处理逻辑
    const handleDragMove = (clientX: number, clientY: number) => {
      if (isDraggingImage) {
        // 计算移动距离
        const deltaX = clientX - dragStart.x;
        const deltaY = clientY - dragStart.y;
        
        // 更新图片位置
        setImagePosition({
          x: dragStartPos.x + deltaX,
          y: dragStartPos.y + deltaY
        });
      } 
      else if (isDraggingCropBox) {
        // 计算移动距离
        const deltaX = clientX - dragStart.x;
        const deltaY = clientY - dragStart.y;
        
        // 获取容器尺寸限制
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (!containerRect) return;
        
        // 计算新位置，确保不超出容器
        let newX = dragStartPos.x + deltaX;
        let newY = dragStartPos.y + deltaY;
        
        // 边界限制
        newX = Math.max(0, Math.min(newX, containerRect.width - cropBox.width));
        newY = Math.max(0, Math.min(newY, containerRect.height - cropBox.height));
        
        // 更新裁剪框位置
        setCropBox(prev => ({
          ...prev,
          x: newX,
          y: newY
        }));
      } 
      else if (isResizing) {
        // 获取容器尺寸限制
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (!containerRect) return;
        
        // 计算移动距离
        const deltaX = clientX - dragStart.x;
        const deltaY = clientY - dragStart.y;
        
        // 初始值
        let newWidth = dragStartSize.width;
        let newHeight = dragStartSize.height;
        let newX = dragStartPos.x;
        let newY = dragStartPos.y;
        
        // 根据调整方向计算新尺寸和位置
    switch (resizeDirection) {
          // 右边和右下角 - 只调整宽度，高度跟随
          case 'e':
          case 'se':
            newWidth = Math.max(MIN_CROP_SIZE[cropType].width, dragStartSize.width + deltaX);
        newHeight = newWidth / aspectRatio;
        break;
            
          // 下边 - 只调整高度，宽度跟随
          case 's':
            newHeight = Math.max(MIN_CROP_SIZE[cropType].height, dragStartSize.height + deltaY);
        newWidth = newHeight * aspectRatio;
        break;
            
          // 左边和左下角 - 调整宽度和X位置
          case 'w':
          case 'sw':
            newWidth = Math.max(MIN_CROP_SIZE[cropType].width, dragStartSize.width - deltaX);
        newHeight = newWidth / aspectRatio;
            newX = dragStartPos.x - (newWidth - dragStartSize.width);
        break;
            
          // 上边和右上角 - 调整高度和Y位置
          case 'n':
          case 'ne':
            newHeight = Math.max(MIN_CROP_SIZE[cropType].height, dragStartSize.height - deltaY);
        newWidth = newHeight * aspectRatio;
            newY = dragStartPos.y - (newHeight - dragStartSize.height);
            if (resizeDirection === 'ne') {
              // 右上角特殊处理
              newX = dragStartPos.x;
            }
        break;
            
          // 左上角 - 调整宽度、高度和位置
          case 'nw':
            newWidth = Math.max(MIN_CROP_SIZE[cropType].width, dragStartSize.width - deltaX);
        newHeight = newWidth / aspectRatio;
            newX = dragStartPos.x - (newWidth - dragStartSize.width);
            newY = dragStartPos.y - (newHeight - dragStartSize.height);
        break;
    }
    
    // 限制最大尺寸
    if (newWidth > MAX_CROP_SIZE[cropType].width) {
      newWidth = MAX_CROP_SIZE[cropType].width;
      newHeight = newWidth / aspectRatio;
    }
    
        // 确保裁剪框不超出容器
        if (newX < 0) {
          newX = 0;
        }
        if (newY < 0) {
          newY = 0;
        }
        if (newX + newWidth > containerRect.width) {
          newWidth = containerRect.width - newX;
      newHeight = newWidth / aspectRatio;
    }
        if (newY + newHeight > containerRect.height) {
          newHeight = containerRect.height - newY;
      newWidth = newHeight * aspectRatio;
    }
    
        // 更新裁剪框
        setCropBox({
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight
        });
      }
    };
    
    // 释放事件处理
    const handleMouseUp = () => {
      setIsDraggingImage(false);
      setIsDraggingCropBox(false);
      setIsResizing(false);
    };
    
    const handleTouchEnd = () => {
      setIsDraggingImage(false);
      setIsDraggingCropBox(false);
      setIsResizing(false);
    };
    
    // 添加事件监听
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    
    // 清理
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [
    isDraggingImage, 
    isDraggingCropBox, 
    isResizing, 
    dragStart, 
    dragStartPos, 
    dragStartSize, 
    resizeDirection, 
    cropBox, 
    imagePosition,
    aspectRatio,
    cropType
  ]);
  
  // 窗口大小变化处理
  useEffect(() => {
    const handleResize = () => {
      if (imageLoaded && imgRef.current) {
        handleImageLoad();
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [imageLoaded]);
  
  // 应用裁剪
  const applyCrop = async () => {
    if (!imgRef.current || !imageLoaded || naturalSize.width === 0) {
      toast({
        title: "无法裁剪",
        description: "图片未完全加载",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const img = imgRef.current;
      
      // 计算裁剪框相对于图片的位置
      // 图片在容器中的渲染尺寸 (考虑缩放)
      const renderedImgWidth = displaySize.width * zoomLevel;
      const renderedImgHeight = displaySize.height * zoomLevel;
      
      // 图片在容器中的左上角坐标
      const imgLeft = imagePosition.x - renderedImgWidth / 2;
      const imgTop = imagePosition.y - renderedImgHeight / 2;
      
      // 裁剪框相对于图片左上角的位置
      const cropRelativeToImgX = cropBox.x - imgLeft;
      const cropRelativeToImgY = cropBox.y - imgTop;
      
      // 将相对坐标转换为原始图片上的坐标
      const scaleRatio = naturalSize.width / renderedImgWidth;
      
      // 原始图片上的裁剪坐标和尺寸
      const originalCropX = cropRelativeToImgX * scaleRatio;
      const originalCropY = cropRelativeToImgY * scaleRatio;
      const originalCropWidth = cropBox.width * scaleRatio;
      const originalCropHeight = cropBox.height * scaleRatio;
      
      // 确保裁剪区域在原图范围内
      const adjustedCropX = Math.max(0, Math.min(originalCropX, naturalSize.width - 1));
      const adjustedCropY = Math.max(0, Math.min(originalCropY, naturalSize.height - 1));
      const adjustedCropWidth = Math.min(originalCropWidth, naturalSize.width - adjustedCropX);
      const adjustedCropHeight = Math.min(originalCropHeight, naturalSize.height - adjustedCropY);
      
      // 创建canvas进行裁剪
      const canvas = document.createElement('canvas');
      
      // 设置输出尺寸
      if (cropType === 'avatar') {
        canvas.width = 400;
        canvas.height = 400;
      } else {
        canvas.width = 1200;
        canvas.height = 450;
      }
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('无法创建Canvas上下文');
      }
      
      // 绘制裁剪后的图片
      ctx.drawImage(
        img,
        adjustedCropX, adjustedCropY, adjustedCropWidth, adjustedCropHeight,
        0, 0, canvas.width, canvas.height
      );
      
      // 转换为Blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('无法生成图片'));
            }
          },
          'image/jpeg',
          0.95
        );
      });
      
      // 调用回调并关闭对话框
      onCropComplete(blob);
      onOpenChange(false);
    } catch (error) {
      console.error('裁剪失败:', error);
      toast({
        title: "裁剪失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // 渲染裁剪框的调整手柄
  const renderResizeHandles = () => {
    const handles = [
      { position: 'n', cursor: 'ns-resize', top: '-4px', left: '50%', width: '12px', height: '8px', transform: 'translateX(-50%)' },
      { position: 'e', cursor: 'ew-resize', top: '50%', right: '-4px', width: '8px', height: '12px', transform: 'translateY(-50%)' },
      { position: 's', cursor: 'ns-resize', bottom: '-4px', left: '50%', width: '12px', height: '8px', transform: 'translateX(-50%)' },
      { position: 'w', cursor: 'ew-resize', top: '50%', left: '-4px', width: '8px', height: '12px', transform: 'translateY(-50%)' },
      { position: 'ne', cursor: 'nesw-resize', top: '-4px', right: '-4px', width: '8px', height: '8px' },
      { position: 'se', cursor: 'nwse-resize', bottom: '-4px', right: '-4px', width: '8px', height: '8px' },
      { position: 'sw', cursor: 'nesw-resize', bottom: '-4px', left: '-4px', width: '8px', height: '8px' },
      { position: 'nw', cursor: 'nwse-resize', top: '-4px', left: '-4px', width: '8px', height: '8px' },
    ];
    
    return handles.map((handle) => (
      <div
        key={handle.position}
        style={{
          position: 'absolute',
          cursor: handle.cursor,
          top: handle.top,
          right: handle.right,
          bottom: handle.bottom,
          left: handle.left,
          width: handle.width,
          height: handle.height,
          transform: handle.transform,
          backgroundColor: 'white',
          borderRadius: '2px',
          zIndex: 20
        }}
        onMouseDown={(e) => handleResizeMouseDown(e, handle.position)}
        onTouchStart={(e) => {
          e.preventDefault();
          const touch = e.touches[0];
          setIsResizing(true);
          setResizeDirection(handle.position);
          setDragStart({ x: touch.clientX, y: touch.clientY });
          setDragStartPos({ x: cropBox.x, y: cropBox.y });
          setDragStartSize({ width: cropBox.width, height: cropBox.height });
        }}
      />
    ));
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-4 pb-0 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Crop className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-4 grow overflow-hidden flex flex-col">
          <div 
            ref={containerRef}
            className="relative w-full h-[50vh] overflow-hidden bg-neutral-800 flex items-center justify-center"
          >
            {/* 缩放控制 */}
            {imageLoaded && (
              <div className="absolute top-3 right-3 z-30 bg-black/50 rounded-md p-2 flex items-center gap-2 text-white">
                <button 
                  onClick={() => setZoomLevel(Math.max(MIN_ZOOM, zoomLevel - 0.1))}
                  className="hover:bg-black/30 rounded-full p-1"
                >
                <ZoomOut className="h-4 w-4" />
                </button>
                <Slider
                  value={[zoomLevel]}
                  min={MIN_ZOOM}
                  max={MAX_ZOOM}
                  step={0.05}
                  className="w-24"
                  onValueChange={handleZoomChange}
                />
                <button 
                  onClick={() => setZoomLevel(Math.min(MAX_ZOOM, zoomLevel + 0.1))}
                  className="hover:bg-black/30 rounded-full p-1"
                >
                <ZoomIn className="h-4 w-4" />
                </button>
              </div>
            )}
            
            {/* 可拖动的图片 */}
            <div 
              className="relative w-full h-full flex items-center justify-center overflow-hidden"
              onMouseDown={handleImageMouseDown}
              onTouchStart={(e) => {
                // 触摸事件处理，兼容移动设备
                e.preventDefault();
                
                const touch = e.touches[0];
                setIsDraggingImage(true);
                setDragStart({ x: touch.clientX, y: touch.clientY });
                setDragStartPos({ ...imagePosition });
              }}
              style={{ cursor: isDraggingImage ? 'grabbing' : 'grab' }}
            >
              {/* 背景网格，帮助用户看清图片边界 */}
              <div className="absolute inset-0 bg-[linear-gradient(45deg,#222_25%,transparent_25%,transparent_75%,#222_75%,#222),linear-gradient(45deg,#222_25%,transparent_25%,transparent_75%,#222_75%,#222)] bg-[length:20px_20px] bg-[position:0_0,10px_10px] opacity-10" />
              
              {/* 这是调试边框，帮助看清图片位置 */}
              {imageLoaded && (
                <div style={{
                  position: 'absolute',
                  left: `${imagePosition.x}px`,
                  top: `${imagePosition.y}px`,
                  width: `${displaySize.width * zoomLevel}px`,
                  height: `${displaySize.height * zoomLevel}px`,
                  transform: 'translate(-50%, -50%)',
                  border: '1px dashed rgba(255, 255, 255, 0.3)',
                  pointerEvents: 'none',
                  zIndex: 5
                }} />
              )}
              
              <img
                ref={imgRef}
                src={imageSrc}
                alt="待裁剪图片"
                className="pointer-events-none select-none"
                style={{ 
                  position: 'absolute',
                  left: `${imagePosition.x}px`,
                  top: `${imagePosition.y}px`,
                  transform: `translate(-50%, -50%) scale(${zoomLevel})`,
                  transformOrigin: 'center',
                  maxWidth: 'none',
                  maxHeight: 'none',
                  width: `${displaySize.width}px`,
                  height: `${displaySize.height}px`,
                  objectFit: 'contain',
                  userSelect: 'none',
                  WebkitUserSelect: 'none'
                }}
                onLoad={handleImageLoad}
                onError={handleImageError}
                draggable="false"
              />
            </div>
            
            {/* 裁剪框 */}
            {imageLoaded && (
              <div
                ref={cropAreaRef}
                style={{
                  position: 'absolute',
                  left: `${cropBox.x}px`,
                  top: `${cropBox.y}px`,
                  width: `${cropBox.width}px`,
                  height: `${cropBox.height}px`,
                  border: '2px solid white',
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)',
                  overflow: 'visible',
                  zIndex: 10,
                  borderRadius: cropType === 'avatar' ? '8px' : '0',
                  cursor: 'move'
                }}
                onMouseDown={handleCropBoxMouseDown}
                onTouchStart={(e) => {
                  // 触摸事件处理，兼容移动设备
                  e.preventDefault();
                  
                  const touch = e.touches[0];
                  setIsDraggingCropBox(true);
                  setDragStart({ x: touch.clientX, y: touch.clientY });
                  setDragStartPos({ ...cropBox });
                }}
              >
                {/* 裁剪框内的辅助线 */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* 九宫格辅助线 */}
                  <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30" />
                  <div className="absolute right-1/3 top-0 bottom-0 w-px bg-white/30" />
                  <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30" />
                  <div className="absolute bottom-1/3 left-0 right-0 h-px bg-white/30" />
                </div>
                
                {/* 调整大小手柄 */}
                {renderResizeHandles()}
                
                {/* 中心点指示 */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-50">
                  <Move className="text-white h-6 w-6" />
                </div>
              </div>
            )}
            
            {/* 加载提示 */}
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center text-white">
                正在加载图片...
              </div>
            )}
          </div>
          
          {/* 操作提示 */}
          {imageLoaded && (
            <div className="mt-2 text-center text-sm text-muted-foreground">
              <p className="mb-1">
                {cropType === 'avatar' 
                  ? '拖动图片调整位置，使用滑块可放大缩小图片' 
                  : '拖动图片调整位置，使用滑块可放大缩小图片'}
              </p>
              <p className="text-xs">
                当前尺寸: {Math.round(cropBox.width)} × {Math.round(cropBox.height)} 像素
                {zoomLevel !== 1 && ` · 缩放: ${Math.round(zoomLevel * 100)}%`}
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter className="p-4 border-t shrink-0">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            取消
          </Button>
          <Button 
            onClick={applyCrop}
            disabled={!imageLoaded || isLoading}
          >
            {isLoading ? '处理中...' : '应用裁剪'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 