import React, { useState, useRef } from 'react';
import { ComposeState, MediaFile } from '@/types';
import Avatar from '@/components/core/Avatar';
import MediaPreview from '@/components/media/MediaPreview';
import { validateMediaFile, compressImage } from '@/lib/media';

interface PostEditorProps {
  onSubmit: (content: string, mediaIds?: string[]) => void;
  onCancel?: () => void;
  placeholder?: string;
  buttonText?: string;
  initialState?: ComposeState;
}

const PostEditor: React.FC<PostEditorProps> = ({
  onSubmit,
  onCancel,
  placeholder = "有什么新鲜事？",
  buttonText = "发布",
  initialState = { content: '', media: [] },
}) => {
  const [state, setState] = useState<ComposeState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setState(prev => ({
      ...prev,
      content: e.target.value,
    }));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newMedia: MediaFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = validateMediaFile(file);
      
      if (!validation.valid) {
        alert(validation.error);
        continue;
      }

      // Compress image if needed
      let processedFile = file;
      if (file.type.startsWith('image/')) {
        try {
          processedFile = await compressImage(file);
        } catch (error) {
          console.error('Error compressing image:', error);
        }
      }

      newMedia.push({
        url: URL.createObjectURL(processedFile),
        type: file.type.startsWith('image/') ? 'image' : 'video',
        file: processedFile,
      });
    }

    setState(prev => ({
      ...prev,
      media: [...prev.media, ...newMedia].slice(0, 4), // Max 4 media items
    }));

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeMedia = (index: number) => {
    setState(prev => {
      const newMedia = [...prev.media];
      newMedia.splice(index, 1);
      return { ...prev, media: newMedia };
    });
  };

  const handleSubmit = async () => {
    console.log('[PostEditor] handleSubmit called');
    console.log('[PostEditor] State:', { content: state.content, mediaCount: state.media.length });
    console.log('[PostEditor] isSubmitting:', isSubmitting);
    
    if ((!state.content.trim() && state.media.length === 0) || isSubmitting) {
      console.log('[PostEditor] Submit blocked - no content or already submitting');
      return;
    }

    console.log('[PostEditor] Starting submission process');
    setIsSubmitting(true);
    
    try {
      // 暂时只支持纯文本发帖，媒体功能待实现
      const mediaUrls = state.media.length > 0 ? [] : undefined; // 暂时忽略媒体
      console.log('[PostEditor] Calling onSubmit with:', { content: state.content, mediaUrls });
      
      await onSubmit(state.content, mediaUrls);
      
      console.log('[PostEditor] onSubmit completed successfully');
      // Reset form
      setState({ content: '', media: [] });
    } catch (error) {
      console.error('[PostEditor] Error submitting post:', error);
      alert('发布失败，请重试');
    } finally {
      console.log('[PostEditor] Setting isSubmitting to false');
      setIsSubmitting(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const isSubmittable = state.content.trim().length > 0 || state.media.length > 0;

  return (
    <div className="border-b border-gray-200 p-4">
      <div className="flex">
        <div className="flex-shrink-0 mr-3">
          <Avatar size="md" alt="Your avatar" />
        </div>
        
        <div className="flex-grow">
          <textarea
            value={state.content}
            onChange={handleContentChange}
            placeholder={placeholder}
            className="w-full text-xl placeholder-gray-500 border-none outline-none resize-none mb-4"
            rows={3}
          />
          
          {state.media.length > 0 && (
            <div className="mb-4">
              <MediaPreview 
                media={state.media} 
                onRemove={removeMedia}
              />
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={triggerFileSelect}
                className="p-2 text-blue-500 hover:bg-blue-100 rounded-full"
                aria-label="添加媒体"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,video/*"
                multiple
                className="hidden"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-full"
                >
                  取消
                </button>
              )}
              
              <button
                onClick={handleSubmit}
                disabled={!isSubmittable || isSubmitting}
                className={`px-4 py-2 rounded-full font-bold ${
                  isSubmittable 
                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                    : 'bg-blue-300 text-white cursor-not-allowed'
                }`}
              >
                {isSubmitting ? '发布中...' : buttonText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostEditor;