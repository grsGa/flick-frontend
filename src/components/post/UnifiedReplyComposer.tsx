'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Avatar from '@/components/core/Avatar';
import { Button } from '@/components/ui/button';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import GifPicker from '@/components/post/GifPicker';
import { MediaService } from '@/services/MediaService';
import { useCreateReply } from '@/hooks/useReplies';

interface UnifiedReplyComposerProps {
  postId: string;
  onReplySuccess?: () => void;
  placeholder?: string;
  className?: string;
}

const UnifiedReplyComposer: React.FC<UnifiedReplyComposerProps> = ({
  postId,
  onReplySuccess,
  placeholder = "Post your reply",
  className = ""
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
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
      
      // Focus back to textarea and set cursor position
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(start + emojiData.emoji.length, start + emojiData.emoji.length);
        }
      }, 0);
    }
    setShowEmojiPicker(false);
  };

  // Handle media file selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Convert FileList to array and limit to 4 media files
    const newFiles = Array.from(files).slice(0, 4 - selectedImages.length);

    // Check for mutual exclusivity with GIF
    if (selectedGif && newFiles.length > 0) {
      setSelectedGif(null);
    }

    // Filter image and video files
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

      // Create preview URLs for new files
      const newPreviewUrls = mediaFiles.map(file => URL.createObjectURL(file));
      setImagePreviewUrls(prev => [...prev, ...newPreviewUrls].slice(0, 4));
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle image upload click
  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Remove selected image
  const handleRemoveImage = (index: number) => {
    // Revoke the URL to free memory
    URL.revokeObjectURL(imagePreviewUrls[index]);
    
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Handle GIF selection
  const handleGifSelect = (gifUrl: string) => {
    setSelectedGif(gifUrl);
    setSelectedImages([]); // Clear images when GIF is selected
    setImagePreviewUrls([]);
    setShowGifPicker(false);
  };

  // Remove selected GIF
  const handleRemoveGif = () => {
    setSelectedGif(null);
  };

  // Handle reply submission
  const handleSubmit = async () => {
    if (!user || (!replyText.trim() && selectedImages.length === 0 && !selectedGif)) return;

    setIsSubmitting(true);
    try {
      let mediaUrls: string[] = [];

      // Upload media if any
      if (selectedImages.length > 0) {
        setIsUploadingMedia(true);
        try {
          mediaUrls = await MediaService.uploadPostMedia(selectedImages);
        } catch (error) {
          console.error('Media upload failed:', error);
          alert('媒体上传失败，请重试');
          return;
        } finally {
          setIsUploadingMedia(false);
        }
      }

      // Submit reply via GraphQL mutation
      const result = await createReply({
        variables: {
          input: {
            postId,
            content: replyText,
            mediaUrls,
            mentionedUsers: [] // TODO: Extract mentions from content
          }
        }
      });
      
      console.log('Reply created successfully:', result.data?.createReply);

      // Reset form
      setReplyText('');
      setSelectedImages([]);
      setImagePreviewUrls([]);
      setSelectedGif(null);
      setIsExpanded(false);
      
      onReplySuccess?.();
    } catch (error) {
      console.error('Reply submission failed:', error);
      alert('回复发送失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className={`p-4 text-center text-gray-500 bg-gray-50 rounded-lg ${className}`}>
        <p>请先登录以发表回复</p>
      </div>
    );
  }

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
            {/* Reply Input */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={replyText}
                onChange={(e) => {
                  setReplyText(e.target.value);
                  adjustTextareaHeight();
                }}
                onFocus={() => setIsExpanded(true)}
                placeholder={placeholder}
                className="w-full p-3 text-lg border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={isExpanded ? 3 : 1}
                maxLength={280}
              />
              
              {/* Character count */}
              {isExpanded && (
                <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                  {replyText.length}/280
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
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Media Previews */}
            {selectedImages.length > 0 && (
              <div className="mt-3">
                {selectedImages.length === 1 && (
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
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                
                {selectedImages.length > 1 && (
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
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
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
                  {/* Emoji 按钮 */}
                  <div className="relative">
                    <button 
                      onClick={() => {
                        setShowEmojiPicker(!showEmojiPicker);
                        setShowGifPicker(false);
                      }}
                      className="p-2 rounded-full hover:bg-gray-100 text-blue-500"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    
                    {/* Emoji Picker */}
                    {showEmojiPicker && (
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

                  {/* GIF 按钮 */}
                  <div className="relative">
                    <button 
                      onClick={() => {
                        setShowGifPicker(!showGifPicker);
                        setShowEmojiPicker(false);
                      }}
                      disabled={selectedImages.length > 0}
                      className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${
                        selectedImages.length > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-500'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-9 0a2 2 0 00-2 2v14a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9h6v6H9z" />
                        <circle cx="12" cy="12" r="1" fill="currentColor" />
                      </svg>
                    </button>

                    {/* GIF Picker */}
                    {showGifPicker && (
                      <div className="absolute top-10 left-1/2 transform -translate-x-1/2 z-20">
                        <GifPicker
                          isOpen={showGifPicker}
                          onClose={() => setShowGifPicker(false)}
                          onGifSelect={handleGifSelect}
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* 媒体上传按钮 */}
                  <button 
                    onClick={handleImageUploadClick}
                    disabled={selectedImages.length >= 4 || !!selectedGif}
                    className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${
                      selectedImages.length >= 4 || !!selectedGif ? 'text-gray-400 cursor-not-allowed' : 'text-blue-500'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                  
                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime,video/x-msvideo,.mp4,.webm,.mov,.avi"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>

                {/* Submit Button */}
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

export default UnifiedReplyComposer;
