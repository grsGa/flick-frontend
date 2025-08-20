'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Avatar from '@/components/core/Avatar';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { useAuth } from '@/hooks/useAuth';
import { useCreatePost } from '@/hooks/usePosts';
import { MediaService } from '@/services/mediaService';
import GifPicker from './GifPicker';

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PostModal: React.FC<PostModalProps> = ({ isOpen, onClose }) => {
  console.log('[PostModal] Component rendered, isOpen:', isOpen);
  
  const { user } = useAuth();
  const { createPost, loading: postLoading, error: postError } = useCreatePost();
  
  console.log('[PostModal] useCreatePost hook result:', { createPost: !!createPost, postLoading, postError });
  const [content, setContent] = useState('');
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Reply permission state
  const [replyPermission, setReplyPermission] = useState<'EVERYONE' | 'FOLLOWING' | 'MENTIONED_ONLY'>('EVERYONE');
  const [showReplyPermissionDropdown, setShowReplyPermissionDropdown] = useState(false);
  const replyPermissionRef = useRef<HTMLDivElement>(null);
  
  // Poll state management
  const [showPollEditor, setShowPollEditor] = useState(false);
  const [pollData, setPollData] = useState<{
    options: { id: string; text: string }[];
    durationMinutes: number;
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const maxLength = 280;

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  // Click outside handler for reply permission dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (replyPermissionRef.current && !replyPermissionRef.current.contains(event.target as Node)) {
        setShowReplyPermissionDropdown(false);
      }
    };

    if (showReplyPermissionDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showReplyPermissionDropdown]);

  if (!isOpen) return null;

  const handleEmojiSelect = (emojiData: any) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const newContent = content.slice(0, start) + emojiData.emoji + content.slice(end);
      setContent(newContent);
      
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


  const handleRemoveGif = () => {
    setSelectedGif(null);
  };

  // Media handling functions (images and videos)
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    console.log('[PostModal] Files selected:', files?.length || 0);
    if (!files) return;

    // Convert FileList to array and limit to 4 media files
    const newFiles = Array.from(files).slice(0, 4 - selectedImages.length);
    
    // Check for mutual exclusivity with GIF and Poll
    if (selectedGif && newFiles.length > 0) {
      setSelectedGif(null);
    }
    if (pollData && newFiles.length > 0) {
      setPollData(null);
      setShowPollEditor(false);
    }

    // Filter image and video files
    const mediaFiles = newFiles.filter(file => {
      console.log('[PostModal] Processing file:', {
        name: file.name,
        type: file.type,
        size: file.size
      });
      
      const isImage = file.type.startsWith('image/') && 
        ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type);
      const isVideo = file.type.startsWith('video/') && 
        ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'].includes(file.type);
      
      const isValid = isImage || isVideo;
      console.log('[PostModal] File validation:', { isImage, isVideo, isValid });
      
      return isValid;
    });

    console.log('[PostModal] Valid media files:', mediaFiles.length);

    if (mediaFiles.length > 0) {
      const updatedImages = [...selectedImages, ...mediaFiles].slice(0, 4);
      setSelectedImages(updatedImages);
      
      // Create preview URLs
      const newUrls = mediaFiles.map(file => URL.createObjectURL(file));
      setImagePreviewUrls(prev => [...prev, ...newUrls].slice(0, 4));
      
      console.log('[PostModal] Media files added successfully');
    }

    // Reset input value
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    // Revoke the object URL to free memory
    if (imagePreviewUrls[index]) {
      URL.revokeObjectURL(imagePreviewUrls[index]);
    }
    
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle GIF selection with mutual exclusivity
  const handleGifSelectWithExclusivity = (gifUrl: string) => {
    if (selectedImages.length > 0) {
      // Clear images when selecting GIF
      imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
      setSelectedImages([]);
      setImagePreviewUrls([]);
    }
    // Clear poll when selecting GIF
    if (pollData) {
      setPollData(null);
      setShowPollEditor(false);
    }
    setSelectedGif(gifUrl);
    setShowGifPicker(false);
  };

  // Poll handling functions
  const handlePollToggle = () => {
    if (showPollEditor) {
      // Close poll editor
      setShowPollEditor(false);
      setPollData(null);
    } else {
      // Open poll editor and clear other media
      if (selectedGif) {
        setSelectedGif(null);
      }
      if (selectedImages.length > 0) {
        imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
        setSelectedImages([]);
        setImagePreviewUrls([]);
      }
      setShowPollEditor(true);
      // Initialize with 2 empty options
      setPollData({
        options: [
          { id: crypto.randomUUID(), text: '' },
          { id: crypto.randomUUID(), text: '' }
        ],
        durationMinutes: 1440 // Default 1 day
      });
    }
  };

  const handlePollOptionChange = (optionId: string, text: string) => {
    if (!pollData) return;
    setPollData({
      ...pollData,
      options: pollData.options.map(option => 
        option.id === optionId ? { ...option, text } : option
      )
    });
  };

  const handleAddPollOption = () => {
    if (!pollData || pollData.options.length >= 4) return;
    setPollData({
      ...pollData,
      options: [...pollData.options, { id: crypto.randomUUID(), text: '' }]
    });
  };

  const handleRemovePollOption = (optionId: string) => {
    if (!pollData || pollData.options.length <= 2) return;
    setPollData({
      ...pollData,
      options: pollData.options.filter(option => option.id !== optionId)
    });
  };

  const handlePollDurationChange = (minutes: number) => {
    if (!pollData) return;
    setPollData({
      ...pollData,
      durationMinutes: minutes
    });
  };

  const handlePost = async () => {
    if (content.trim() || selectedGif || selectedImages.length > 0 || pollData) {
      console.log('[PostModal] Starting post submission:', { 
        content, 
        gif: selectedGif, 
        images: selectedImages,
        poll: pollData
      });

      if (!user?.id) {
        console.log('[PostModal] Submit blocked - user not authenticated');
        alert('请先登录');
        return;
      }
      
      try {
        // Build input data for GraphQL mutation
        const inputData: any = {
          content: content.trim(),
        };

        // Add reply permission if not default
        if (replyPermission !== 'EVERYONE') {
          inputData.replyPermission = replyPermission;
        }

        // Handle media uploads
        if (selectedImages.length > 0) {
          console.log('[PostModal] Uploading media files...');
          setIsUploadingMedia(true);
          
          try {
            const mediaUrls = await MediaService.uploadPostMedia(selectedImages, user.id);
            console.log('[PostModal] Media uploaded successfully:', mediaUrls);
            inputData.mediaUrls = mediaUrls;
          } catch (uploadError) {
            console.error('[PostModal] Media upload failed:', uploadError);
            const errorMessage = uploadError instanceof Error ? uploadError.message : '媒体上传失败，请重试';
            
            // Show user-friendly error messages
            if (errorMessage.includes('File size too large')) {
              alert('文件过大！图片最大10MB，视频最大100MB');
            } else if (errorMessage.includes('File type not supported')) {
              alert('文件格式不支持！请使用JPG、PNG、GIF、WebP格式的图片或MP4、WebM、MOV、AVI格式的视频');
            } else if (errorMessage.includes('File too large or invalid format')) {
              alert('文件过大或格式无效！请检查文件大小和格式');
            } else {
              alert(`上传失败：${errorMessage}`);
            }
            
            setIsUploadingMedia(false);
            return;
          }
          
          setIsUploadingMedia(false);
        }

        // TODO: Handle GIF and poll data in future iterations
        if (selectedGif) {
          console.log('[PostModal] GIF support not yet implemented');
        }
        if (pollData) {
          console.log('[PostModal] Poll support not yet implemented');
        }

        console.log('[PostModal] Calling createPost with input:', inputData);
        
        const result = await createPost({
          variables: {
            input: inputData,
          },
        });

        console.log('[PostModal] Post created successfully:', result);
        
        // Cleanup on success
        setContent('');
        setSelectedGif(null);
        imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
        setSelectedImages([]);
        setImagePreviewUrls([]);
        setPollData(null);
        setShowPollEditor(false);
        setReplyPermission('EVERYONE');
        onClose();
        
      } catch (err: any) {
        console.error('[PostModal] Failed to create post:', err);
        setIsUploadingMedia(false);
        // Don't close modal on error so user can retry
      }
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 pt-16"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl w-full max-w-xl mx-4 relative">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="w-8"></div> {/* Spacer for centering */}
          <h2 className="text-lg font-bold">Post</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex space-x-3">
            {/* User Avatar */}
            <div className="flex-shrink-0">
              <Avatar 
                src={user?.avatarUrl} 
                alt={user?.username || ''} 
                size="md" 
              />
            </div>

            {/* Post Input Area */}
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's happening?"
                className="w-full text-xl placeholder-gray-500 border-none outline-none resize-none min-h-[120px]"
                maxLength={maxLength}
                autoFocus
              />
              
              {/* Character Count */}
              <div className="flex justify-end mt-2">
                <span className={`text-sm ${content.length > maxLength * 0.8 ? 'text-red-500' : 'text-gray-500'}`}>
                  {content.length}/{maxLength}
                </span>
              </div>

              {/* Selected GIF Preview */}
              {selectedGif && (
                <div className="mt-3 relative inline-block">
                  <img 
                    src={selectedGif} 
                    alt="Selected GIF" 
                    className="max-w-full h-32 rounded-lg object-cover"
                  />
                  <button
                    onClick={handleRemoveGif}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-black bg-opacity-70 text-white rounded-full flex items-center justify-center hover:bg-opacity-90"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              
              {/* Poll Editor */}
              {showPollEditor && pollData && (
                <div className="mt-3 border border-gray-200 rounded-xl p-4">
                  <div className="space-y-3">
                    {pollData.options.map((option, index) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder={`Choice ${index + 1}`}
                            value={option.text}
                            onChange={(e) => handlePollOptionChange(option.id, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            maxLength={25}
                          />
                        </div>
                        {pollData.options.length > 2 && (
                          <button
                            onClick={() => handleRemovePollOption(option.id)}
                            className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center text-red-500"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                    
                    {/* Add Option Button */}
                    {pollData.options.length < 4 && (
                      <button
                        onClick={handleAddPollOption}
                        className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-blue-500 hover:bg-blue-50 flex items-center justify-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Add choice</span>
                      </button>
                    )}
                    
                    {/* Poll Duration Settings */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <span className="text-sm text-gray-600">Poll length</span>
                      <select
                        value={pollData.durationMinutes}
                        onChange={(e) => handlePollDurationChange(Number(e.target.value))}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={5}>5 minutes</option>
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={60}>1 hour</option>
                        <option value={240}>4 hours</option>
                        <option value={480}>8 hours</option>
                        <option value={1440}>1 day</option>
                        <option value={2880}>2 days</option>
                        <option value={4320}>3 days</option>
                        <option value={10080}>7 days</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Selected Media Preview */}
              {selectedImages.length > 0 && (
                <div className="mt-3">
                  {/* Single Media Layout */}
                  {selectedImages.length === 1 && (
                    <div className="relative">
                      {selectedImages[0].type.startsWith('image/') ? (
                        <img 
                          src={imagePreviewUrls[0]} 
                          alt="Selected image" 
                          className="w-full max-h-80 rounded-xl object-cover"
                        />
                      ) : (
                        <video 
                          src={imagePreviewUrls[0]} 
                          controls
                          className="w-full max-h-80 rounded-xl object-cover"
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
                  
                  {/* Two Media Layout */}
                  {selectedImages.length === 2 && (
                    <div className="grid grid-cols-2 gap-2">
                      {imagePreviewUrls.map((url, index) => (
                        <div key={index} className="relative">
                          {selectedImages[index].type.startsWith('image/') ? (
                            <img 
                              src={url} 
                              alt={`Selected image ${index + 1}`} 
                              className="w-full h-48 rounded-xl object-cover"
                            />
                          ) : (
                            <video 
                              src={url} 
                              controls
                              className="w-full h-48 rounded-xl object-cover"
                            />
                          )}
                          <button
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-2 right-2 w-6 h-6 bg-black bg-opacity-70 text-white rounded-full flex items-center justify-center hover:bg-opacity-90"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Three Images Layout */}
                  {selectedImages.length === 3 && (
                    <div className="grid grid-cols-2 gap-2 h-96">
                      <div className="relative row-span-2">
                        <img 
                          src={imagePreviewUrls[0]} 
                          alt="Selected image 1" 
                          className="w-full h-full rounded-xl object-cover"
                        />
                        <button
                          onClick={() => handleRemoveImage(0)}
                          className="absolute top-2 right-2 w-6 h-6 bg-black bg-opacity-70 text-white rounded-full flex items-center justify-center hover:bg-opacity-90"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      {imagePreviewUrls.slice(1).map((url, index) => (
                        <div key={index + 1} className="relative">
                          <img 
                            src={url} 
                            alt={`Selected image ${index + 2}`} 
                            className="w-full h-full rounded-xl object-cover"
                          />
                          <button
                            onClick={() => handleRemoveImage(index + 1)}
                            className="absolute top-2 right-2 w-6 h-6 bg-black bg-opacity-70 text-white rounded-full flex items-center justify-center hover:bg-opacity-90"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Four Images Layout */}
                  {selectedImages.length === 4 && (
                    <div className="grid grid-cols-2 gap-2">
                      {imagePreviewUrls.map((url, index) => (
                        <div key={index} className="relative">
                          <img 
                            src={url} 
                            alt={`Selected image ${index + 1}`} 
                            className="w-full h-48 rounded-xl object-cover"
                          />
                          <button
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-2 right-2 w-6 h-6 bg-black bg-opacity-70 text-white rounded-full flex items-center justify-center hover:bg-opacity-90"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            {/* Emoji Button */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowEmojiPicker(!showEmojiPicker);
                  setShowGifPicker(false);
                }}
                className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-700 hover:text-black transition-colors"
                title="Emoji"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              
              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-10 bg-white rounded-lg shadow-lg border border-gray-200">
                  {/* 聊天气泡箭头 */}
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-l border-t border-gray-200 rotate-45"></div>
                  <EmojiPicker
                    onEmojiClick={handleEmojiSelect}
                    width={350}
                    height={400}
                    previewConfig={{
                      showPreview: false
                    }}
                  />
                </div>
              )}
            </div>

            {/* Image Upload Button */}
            <button 
              onClick={handleImageUploadClick}
              disabled={selectedImages.length >= 4 || !!selectedGif || !!pollData}
              className={`w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors ${
                selectedImages.length >= 4 || !!selectedGif || !!pollData ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:text-black'
              }`}
              title="Media"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
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

            {/* GIF Button */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowGifPicker(!showGifPicker);
                  setShowEmojiPicker(false);
                }}
                disabled={selectedImages.length > 0 || !!pollData}
                className={`w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors ${
                  selectedImages.length > 0 || !!pollData ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:text-black'
                }`}
                title="GIF"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-9 0a2 2 0 00-2 2v14a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9h6v6H9z" />
                  <circle cx="12" cy="12" r="1" fill="currentColor" />
                </svg>
              </button>
              
              {/* GIF Picker */}
              <GifPicker
                isOpen={showGifPicker}
                onClose={() => setShowGifPicker(false)}
                onGifSelect={handleGifSelectWithExclusivity}
              />
            </div>

            {/* Poll Button */}
            <button 
              onClick={handlePollToggle}
              disabled={!!selectedGif || selectedImages.length > 0}
              className={`w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors ${
                selectedGif || selectedImages.length > 0 ? 'text-gray-400 cursor-not-allowed' : 
                showPollEditor ? 'text-black bg-gray-100' : 'text-gray-700 hover:text-black'
              }`}
              title="Poll"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          </div>

          {/* Who can reply button */}
          <div className="relative" ref={replyPermissionRef}>
            <button
              onClick={() => setShowReplyPermissionDropdown(!showReplyPermissionDropdown)}
              className="text-blue-500 font-bold text-sm hover:text-blue-600 transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              {replyPermission === 'EVERYONE' ? 'Everyone can reply' : 
               replyPermission === 'FOLLOWING' ? 'Accounts you follow' : 
               'Only accounts you mention'}
            </button>

            {/* Reply Permission Dropdown */}
            {showReplyPermissionDropdown && (
              <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-48 z-20">
                {/* 聊天气泡箭头 */}
                <div className="absolute -top-2 left-6 w-4 h-4 bg-white border-l border-t border-gray-200 rotate-45"></div>
                <div className="px-4 py-2 text-sm font-semibold text-gray-900 border-b border-gray-100">
                  Who can reply?
                </div>
                
                <button
                  onClick={() => {
                    setReplyPermission('EVERYONE');
                    setShowReplyPermissionDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                    replyPermission === 'EVERYONE' ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">Everyone</div>
                      <div className="text-sm text-gray-500">Anyone can reply</div>
                    </div>
                    {replyPermission === 'EVERYONE' && (
                      <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => {
                    setReplyPermission('FOLLOWING');
                    setShowReplyPermissionDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                    replyPermission === 'FOLLOWING' ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">Accounts you follow</div>
                      <div className="text-sm text-gray-500">Only people you follow can reply</div>
                    </div>
                    {replyPermission === 'FOLLOWING' && (
                      <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => {
                    setReplyPermission('MENTIONED_ONLY');
                    setShowReplyPermissionDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                    replyPermission === 'MENTIONED_ONLY' ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">Only accounts you mention</div>
                      <div className="text-sm text-gray-500">Only mentioned users can reply</div>
                    </div>
                    {replyPermission === 'MENTIONED_ONLY' && (
                      <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Post Button */}
          <button
            onClick={handlePost}
            disabled={postLoading || isUploadingMedia || (!content.trim() && !selectedGif && selectedImages.length === 0 && !pollData) || content.length > maxLength}
            className={`px-6 py-2 rounded-full font-bold text-sm transition-colors ${
              (content.trim() || selectedGif || selectedImages.length > 0 || pollData) && content.length <= maxLength && !postLoading && !isUploadingMedia
                ? 'bg-black text-white hover:bg-gray-800'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            title="Post"
          >
            {isUploadingMedia ? 'Uploading...' : postLoading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

export default PostModal;
