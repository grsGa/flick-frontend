'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Avatar from '@/components/core/Avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import GifPicker from '@/components/post/GifPicker';
import { MediaService } from '@/services/mediaService';
import { useCreateReply } from '@/hooks/useReplies';
import { Send, Image, Smile, Loader2 } from 'lucide-react';
import { toast } from '@/lib/toast';

interface UniversalReplyComposerProps {
  postId: string;
  onReplySuccess?: () => void;
  placeholder?: string;
  className?: string;
  // Feature flags for different modes
  mode?: 'simple' | 'basic' | 'advanced';
  showMediaUpload?: boolean;
  showEmojiPicker?: boolean;
  showGifPicker?: boolean;
  maxLength?: number;
}

const UniversalReplyComposer: React.FC<UniversalReplyComposerProps> = ({
  postId,
  onReplySuccess,
  placeholder = "Post your reply",
  className = "",
  mode = 'advanced',
  showMediaUpload = true,
  showEmojiPicker = true,
  showGifPicker = true,
  maxLength = 280
}) => {
  const [isExpanded, setIsExpanded] = useState(mode === 'simple');
  const [replyText, setReplyText] = useState('');
  const [showEmojiPickerState, setShowEmojiPickerState] = useState(false);
  const [showGifPickerState, setShowGifPickerState] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();
  const [createReply] = useCreateReply();

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreviewUrls]);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // Auto-resize textarea on mount and when expanded
  useEffect(() => {
    if (isExpanded && textareaRef.current) {
      adjustTextareaHeight();
      textareaRef.current.focus();
    }
  }, [isExpanded]);

  // Handle emoji selection
  const handleEmojiSelect = (emojiData: any) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const newContent = replyText.slice(0, start) + emojiData.emoji + replyText.slice(end);
      setReplyText(newContent);
      
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(start + emojiData.emoji.length, start + emojiData.emoji.length);
        }
      }, 0);
    }
    setShowEmojiPickerState(false);
  };

  // Handle media file selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files).slice(0, 4 - selectedImages.length);

    if (selectedGif && newFiles.length > 0) {
      setSelectedGif(null);
    }

    const mediaFiles = newFiles.filter(file => {
      const isImage = file.type.startsWith('image/') && 
        ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type);
      const isVideo = file.type.startsWith('video/') && 
        ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'].includes(file.type);
      
      return isImage || isVideo;
    });

    if (mediaFiles.length > 0) {
      const updatedImages = [...selectedImages, ...mediaFiles].slice(0, 4);
      setSelectedImages(updatedImages);

      const newPreviewUrls = mediaFiles.map(file => URL.createObjectURL(file));
      setImagePreviewUrls(prev => [...prev, ...newPreviewUrls].slice(0, 4));
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(imagePreviewUrls[index]);
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleGifSelect = (gifUrl: string) => {
    setSelectedGif(gifUrl);
    setSelectedImages([]);
    setImagePreviewUrls([]);
    setShowGifPickerState(false);
  };

  const handleRemoveGif = () => {
    setSelectedGif(null);
  };

  // Handle reply submission
  const handleSubmit = async () => {
    if (!user || (!replyText.trim() && selectedImages.length === 0 && !selectedGif)) return;

    setIsSubmitting(true);
    try {
      let mediaUrls: string[] = [];

      if (selectedImages.length > 0) {
        setIsUploadingMedia(true);
        try {
          mediaUrls = await MediaService.uploadPostMedia(selectedImages);
        } catch (error) {
          console.error('Media upload failed:', error);
          toast.error('媒体上传失败，请重试');
          return;
        } finally {
          setIsUploadingMedia(false);
        }
      }

      const result = await createReply({
        variables: {
          input: {
            postId,
            content: replyText,
            mediaUrls,
            mentionedUsers: []
          }
        }
      });
      
      console.log('Reply created successfully:', result.data?.createReply);

      // Reset form
      setReplyText('');
      setSelectedImages([]);
      setImagePreviewUrls([]);
      setSelectedGif(null);
      setIsExpanded(mode === 'simple');
      
      toast.success('回复发布成功！');
      onReplySuccess?.();
    } catch (error) {
      console.error('Reply submission failed:', error);
      toast.error('回复发送失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!user) {
    return (
      <div className={`p-4 text-center text-gray-500 bg-gray-50 rounded-lg ${className}`}>
        <p>请先登录以发表回复</p>
      </div>
    );
  }

  // Simple mode - minimal UI
  if (mode === 'simple') {
    return (
      <div className={`flex space-x-3 ${className}`}>
        <Avatar 
          src={user.avatarUrl || undefined}
          alt={user.displayName || user.username}
          size="md"
        />
        <div className="flex-1 space-y-3">
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="min-h-[80px] bg-transparent border-gray-200 resize-none focus:border-blue-500"
            maxLength={maxLength}
          />
          <div className="flex items-center justify-between">
            <span className={`text-sm ${
              replyText.length > maxLength * 0.9 ? 'text-red-400' : 'text-gray-400'
            }`}>
              {replyText.length}/{maxLength}
            </span>
            <Button
              onClick={handleSubmit}
              disabled={!replyText.trim() || isSubmitting}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-1" />
                  回复
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Basic mode - with basic controls
  if (mode === 'basic') {
    return (
      <div className={`flex space-x-3 ${className}`}>
        <Avatar 
          src={user.avatarUrl || undefined}
          alt={user.displayName || user.username}
          size="md"
        />
        <div className="flex-1 space-y-3">
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="min-h-[100px] bg-transparent border-gray-200 resize-none focus:border-blue-500"
            maxLength={maxLength}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {showMediaUpload && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleImageUploadClick}
                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                >
                  <Image className="h-4 w-4" />
                </Button>
              )}
              {showEmojiPicker && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                  disabled
                >
                  <Smile className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <span className={`text-sm ${
                replyText.length > maxLength * 0.9 ? 'text-red-400' : 'text-gray-400'
              }`}>
                {replyText.length}/{maxLength}
              </span>
              <Button
                onClick={handleSubmit}
                disabled={!replyText.trim() || isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>发布中...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Send className="h-4 w-4" />
                    <span>回复</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>
      </div>
    );
  }

  // Advanced mode - full featured (existing UnifiedReplyComposer functionality)
  return (
    <div className={`bg-white ${className}`}>
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <Avatar 
            src={user.avatarUrl || undefined}
            alt={user.displayName || user.username}
            size="md"
          />
          <div className="flex-1">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={replyText}
                onChange={(e) => {
                  setReplyText(e.target.value);
                  adjustTextareaHeight();
                }}
                onFocus={() => setIsExpanded(true)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full p-3 text-lg border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={isExpanded ? 3 : 1}
                maxLength={maxLength}
              />
              
              {isExpanded && (
                <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                  {replyText.length}/{maxLength}
                </div>
              )}
            </div>

            {/* GIF Preview */}
            {selectedGif && (
              <div className="mt-3">
                <div className="relative max-w-xs">
                  <img 
                    src={selectedGif} 
                    alt="Selected GIF" 
                    className="w-full max-w-full max-h-40 rounded-lg object-contain"
                  />
                  <button
                    onClick={handleRemoveGif}
                    className="absolute top-2 right-2 w-6 h-6 bg-black bg-opacity-70 text-white rounded-full flex items-center justify-center hover:bg-opacity-90"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            {/* Media Previews */}
            {selectedImages.length > 0 && (
              <div className="mt-3">
                {selectedImages.length === 1 ? (
                  <div className="relative max-w-xs">
                    {selectedImages[0].type.startsWith('image/') ? (
                      <img 
                        src={imagePreviewUrls[0]} 
                        alt="Selected image" 
                        className="w-full max-w-full max-h-40 rounded-lg object-contain"
                      />
                    ) : (
                      <video 
                        src={imagePreviewUrls[0]} 
                        controls
                        className="w-full max-w-full max-h-40 rounded-lg object-contain"
                      />
                    )}
                    <button
                      onClick={() => handleRemoveImage(0)}
                      className="absolute top-2 right-2 w-6 h-6 bg-black bg-opacity-70 text-white rounded-full flex items-center justify-center hover:bg-opacity-90"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-w-full">
                    {imagePreviewUrls.map((url, index) => (
                      <div key={index} className="relative overflow-hidden">
                        {selectedImages[index].type.startsWith('image/') ? (
                          <img 
                            src={url} 
                            alt={`Selected image ${index + 1}`} 
                            className="w-full h-24 rounded-lg object-cover"
                          />
                        ) : (
                          <video 
                            src={url} 
                            controls
                            className="w-full h-24 rounded-lg object-cover"
                          />
                        )}
                        <button
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1 right-1 w-5 h-5 bg-black bg-opacity-70 text-white rounded-full flex items-center justify-center hover:bg-opacity-90"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Expanded Controls */}
            {isExpanded && (
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center space-x-3">
                  {/* Emoji Button */}
                  {showEmojiPicker && (
                    <div className="relative">
                      <button 
                        onClick={() => {
                          setShowEmojiPickerState(!showEmojiPickerState);
                          setShowGifPickerState(false);
                        }}
                        className="p-2 rounded-full hover:bg-gray-100 text-blue-500"
                      >
                        <Smile className="w-5 h-5" />
                      </button>
                      
                      {showEmojiPickerState && (
                        <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-10 bg-white rounded-lg shadow-lg border border-gray-200">
                          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-l border-t border-gray-200 rotate-45"></div>
                          <EmojiPicker
                            onEmojiClick={handleEmojiSelect}
                            width={300}
                            height={350}
                            previewConfig={{
                              showPreview: false
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* GIF Button */}
                  {showGifPicker && (
                    <div className="relative">
                      <button 
                        onClick={() => {
                          setShowGifPickerState(!showGifPickerState);
                          setShowEmojiPickerState(false);
                        }}
                        disabled={selectedImages.length > 0}
                        className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${
                          selectedImages.length > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-500'
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-9 0a2 2 0 00-2 2v14a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2" />
                        </svg>
                      </button>

                      {showGifPickerState && (
                        <div className="absolute top-10 left-1/2 transform -translate-x-1/2 z-20">
                          <GifPicker
                            isOpen={showGifPickerState}
                            onClose={() => setShowGifPickerState(false)}
                            onGifSelect={handleGifSelect}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Media Upload Button */}
                  {showMediaUpload && (
                    <button 
                      onClick={handleImageUploadClick}
                      disabled={selectedImages.length >= 4 || !!selectedGif}
                      className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${
                        selectedImages.length >= 4 || !!selectedGif ? 'text-gray-400 cursor-not-allowed' : 'text-blue-500'
                      }`}
                    >
                      <Image className="w-5 h-5" />
                    </button>
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime,video/x-msvideo,.mp4,.webm,.mov,.avi"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={(!replyText.trim() && selectedImages.length === 0 && !selectedGif) || isSubmitting || isUploadingMedia}
                  className={`px-6 py-2 rounded-full font-medium transition-colors ${
                    (!replyText.trim() && selectedImages.length === 0 && !selectedGif) || isSubmitting || isUploadingMedia
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-black hover:bg-gray-800 text-white'
                  }`}
                >
                  {isUploadingMedia ? 'Uploading...' : isSubmitting ? 'Sending...' : 'Reply'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniversalReplyComposer;
