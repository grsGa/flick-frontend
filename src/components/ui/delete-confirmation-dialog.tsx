'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title = '确认删除',
  description = '此操作无法撤消，并且它将从您的个人资料、关注您的任何帐户的时间线以及搜索结果中删除。',
  confirmLabel = '删除',
  cancelLabel = '取消',
}: DeleteConfirmationDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      
      await onConfirm();
      
      // 显示成功通知
      toast({
        title: "删除成功",
        description: "内容已被删除"
      });
      
      // 关闭对话框
      onClose();
    } catch (err) {
      // 处理错误
      console.error('删除操作失败:', err);
      
      // 提取错误消息并设置错误状态
      let errorMessage = '删除失败，请稍后再试';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      
      // 保持对话框打开状态，但停止加载状态
      setIsDeleting(false);
      
      // 也显示错误通知
      toast({
        title: "删除失败",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {
      // 只有在未删除状态才允许通过点击外部关闭对话框
      if (!isDeleting) {
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        {/* 显示错误消息 */}
        {error && (
          <div className="bg-destructive/10 p-3 rounded-md flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        
        <DialogFooter className="flex flex-row justify-end gap-2 sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            {cancelLabel}
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={isDeleting}
            className="gap-2"
          >
            {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 