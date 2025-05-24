'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { CreatePostDialog } from '@/components/ui/create-post-dialog';

// 创建上下文类型
interface PostDialogContextType {
  openPostDialog: () => void;
  closePostDialog: () => void;
  isPostDialogOpen: boolean;
}

// 创建上下文
const PostDialogContext = createContext<PostDialogContextType>({
  openPostDialog: () => {},
  closePostDialog: () => {},
  isPostDialogOpen: false,
});

// 创建Provider组件
export function PostDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openPostDialog = () => setIsOpen(true);
  const closePostDialog = () => setIsOpen(false);

  return (
    <PostDialogContext.Provider
      value={{
        openPostDialog,
        closePostDialog,
        isPostDialogOpen: isOpen,
      }}
    >
      {children}
      <CreatePostDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        onClose={closePostDialog}
      />
    </PostDialogContext.Provider>
  );
}

// 创建自定义Hook用于访问上下文
export const usePostDialog = () => useContext(PostDialogContext); 