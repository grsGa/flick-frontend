import React, { useState, useRef, useEffect } from 'react';
import { Media, Post } from '@/graphql/types';
import Avatar from '@/components/core/Avatar';
import UserName from '@/components/core/UserName';
import TimeAgo from '@/components/core/TimeAgo';
import { useAuth } from '@/hooks/useAuth';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import GifPicker from '@/components/post/GifPicker';
import { MediaService } from '@/services/mediaService';

interface ImageViewerSidebarProps {
  post?: Post;
  currentMedia: Media;
  onLike?: () => void;
  onComment?: () => void;
  onRepost?: () => void;
  onBookmark?: () => void;
  onShare?: () => void;
}

const ImageViewerSidebar: React.FC<ImageViewerSidebarProps> = ({
  post,
  currentMedia,
  onLike,
  onComment,
  onRepost,
  onBookmark,
  onShare,
}) => {
  const [isReplyExpanded, setIsReplyExpanded] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreviewUrls]);

  // Auto-resize textarea on mount and when expanded
  useEffect(() => {
    if (isReplyExpanded && textareaRef.current) {
      adjustTextareaHeight();
    }
  }, [isReplyExpanded]);

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
      
      // Create preview URLs
      const newUrls = mediaFiles.map(file => URL.createObjectURL(file));
      setImagePreviewUrls(prev => [...prev, ...newUrls].slice(0, 4));
    }

    // Reset input value
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle image removal
  const handleRemoveImage = (index: number) => {
    if (imagePreviewUrls[index]) {
      URL.revokeObjectURL(imagePreviewUrls[index]);
    }
    
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Handle GIF selection
  const handleGifSelect = (gifUrl: string) => {
    if (selectedImages.length > 0) {
      // Clear images when selecting GIF
      imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
      setSelectedImages([]);
      setImagePreviewUrls([]);
    }
    setSelectedGif(gifUrl);
    setShowGifPicker(false);
  };

  // Handle GIF removal
  const handleRemoveGif = () => {
    setSelectedGif(null);
  };

  // Handle media upload click
  const handleImageUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // Handle text change with auto-resize
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReplyText(e.target.value);
    adjustTextareaHeight();
  };

  return (
    <div className="h-full flex flex-col p-4">
      {post && (
        <>
          {/* 帖子作者信息 */}
          <div className="flex items-start space-x-3 mb-4">
            <Avatar
              src={post.author.avatarUrl}
              alt={post.author.displayName || post.author.username}
              size="md"
            />
            <div className="flex-1">
              <div className="flex items-center">
                <UserName 
                  user={post.author} 
                  verified={post.author.isVerified}
                />
              </div>
              <TimeAgo date={post.createdAt} className="text-sm text-gray-500" />
            </div>
          </div>

          {/* 帖子内容 */}
          {post.content && (
            <div className="mb-4">
              <p className="text-gray-900">{post.content}</p>
            </div>
          )}

          {/* 发帖时间和浏览量 */}
          <div className="text-sm text-gray-500 mb-3">
            <TimeAgo date={post.createdAt} />
            <span className="text-gray-400"> · </span>
            <span className="font-bold">{(post.interaction.viewCount || 0) >= 1000000 ? `${Math.floor((post.interaction.viewCount || 0) / 1000000)}M` : (post.interaction.viewCount || 0) >= 1000 ? `${Math.floor((post.interaction.viewCount || 0) / 1000)}K` : (post.interaction.viewCount || 0)} Views</span>
          </div>

          {/* 分割线 - 更贴近按钮 */}
          <div className="border-t border-gray-200 mb-1"></div>

          {/* 互动按钮 - 水平排列，计数在右侧 */}
          <div className="flex items-center justify-between mb-1">
            {/* Reply */}
            <button 
              onClick={onComment}
              className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-500"
              title="Reply"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {post.interaction.commentCount > 0 && (
                <span className="ml-2 text-xs text-gray-400">{post.interaction.commentCount}</span>
              )}
            </button>

            {/* Repost */}
            <button 
              onClick={onRepost}
              className={`flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors ${
                post.interaction.isReposted ? 'text-green-500' : 'text-gray-500'
              }`}
              title="Repost"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {post.interaction.repostCount > 0 && (
                <span className="ml-2 text-xs text-gray-400">{post.interaction.repostCount}</span>
              )}
            </button>

            {/* Like */}
            <button 
              onClick={onLike}
              className={`flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors ${
                post.interaction.isLiked ? 'text-red-500' : 'text-gray-500'
              }`}
              title="Like"
            >
              {post.interaction.isLiked ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.638h-.014C9.403 21.59 1.95 14.856 1.95 8.478c0-3.064 2.525-5.754 5.403-5.754 2.29 0 3.83 1.58 4.646 2.73.814-1.148 2.354-2.73 4.645-2.73 2.88 0 5.404 2.69 5.404 5.755 0 6.376-7.454 13.11-10.037 13.157H12z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              )}
              {post.interaction.likeCount > 0 && (
                <span className="ml-2 text-xs text-gray-400">{post.interaction.likeCount}</span>
              )}
            </button>

            {/* Bookmark */}
            <button 
              onClick={onBookmark}
              className={`flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors ${
                post.interaction.isBookmarked ? 'text-blue-500' : 'text-gray-500'
              }`}
              title="Bookmark"
            >
              {post.interaction.isBookmarked ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 2h14a1 1 0 011 1v19.143a.5.5 0 01-.757.429L12 18.03l-7.243 4.543A.5.5 0 014 22.143V3a1 1 0 011-1z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              )}
              {(post.interaction.bookmarkCount || 0) > 0 && (
                <span className="ml-2 text-xs text-gray-400">{post.interaction.bookmarkCount}</span>
              )}
            </button>

            {/* Share */}
            <button 
              onClick={onShare}
              className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-500"
              title="Share"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </button>
          </div>

          {/* 分割线 - 更贴近按钮 */}
          <div className="border-t border-gray-200 mt-1 mb-1"></div>

          {/* 回复功能区域 */}
          <div className="flex-1">
            {!isReplyExpanded ? (
              /* 收起状态 - Post your reply */
              <div className="flex items-center justify-between w-full py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                <button
                  onClick={() => setIsReplyExpanded(true)}
                  className="flex items-center flex-1 text-gray-500 cursor-text"
                >
                  <Avatar
                    src={user?.avatarUrl || "/api/placeholder/32/32"}
                    alt={user?.displayName || user?.username || "Your avatar"}
                    size="sm"
                  />
                  <span className="ml-3 text-gray-400 cursor-text">Post your reply</span>
                </button>
                <button
                  onClick={() => setIsReplyExpanded(true)}
                  className="px-4 py-2 bg-gray-400 text-white rounded-full hover:bg-gray-500 transition-colors text-sm"
                >
              {/* ... */}
                  Reply
                </button>
              </div>
            ) : (
              /* 展开状态 - 回复输入框 */
              <div className="space-y-3">
                {/* Replying to @username */}
                <div className="text-sm text-gray-500 text-center">
                  Replying to <span className="text-blue-500">@{post.author.username}</span>
                </div>
                
                {/* 回复输入区域 */}
                <div className="flex space-x-3">
                  <Avatar
                    src={user?.avatarUrl || "/api/placeholder/32/32"}
                    alt={user?.displayName || user?.username || "Your avatar"}
                    size="sm"
                  />
                  <div className="flex-1">
                    <textarea
                      ref={textareaRef}
                      value={replyText}
                      onChange={handleTextChange}
                      placeholder="Post your reply"
                      className="w-full p-3 resize-none focus:outline-none bg-transparent min-h-[2.5rem] max-h-32 overflow-y-auto"
                      rows={1}
                      style={{ height: 'auto' }}
                    />

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

                    {/* Selected Media Preview */}
                    {selectedImages.length > 0 && (
                      <div className="mt-3 max-w-full overflow-hidden">
                        {selectedImages.length === 1 && (
                          <div className="relative max-w-full">
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
                    
                    {/* 底部工具栏 */}
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
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 9h6v6H9z" />
                              <circle cx="12" cy="12" r="1" fill="currentColor" />
                            </svg>
                          </button>
                          
                          {/* GIF Picker */}
                          <GifPicker
                            isOpen={showGifPicker}
                            onClose={() => setShowGifPicker(false)}
                            onGifSelect={handleGifSelect}
                          />
                        </div>
                      </div>
                      
                      {/* Reply 按钮 */}
                      <button
                        onClick={async () => {
                          if (!user?.id) {
                            alert('请先登录');
                            return;
                          }

                          if (!replyText.trim() && selectedImages.length === 0 && !selectedGif) {
                            return;
                          }

                          try {
                            let mediaUrls: string[] = [];
                            
                            // Upload media files if any
                            if (selectedImages.length > 0) {
                              setIsUploadingMedia(true);
                              mediaUrls = await MediaService.uploadPostMedia(selectedImages, user.id);
                              setIsUploadingMedia(false);
                            }
                            
                            // Handle reply submission (you can customize this)
                            console.log('Reply submission:', {
                              text: replyText,
                              mediaUrls,
                              gif: selectedGif,
                              replyTo: post.id
                            });
                            
                            // Call the onComment handler if provided
                            onComment?.();
                            
                            // Reset form
                            setReplyText('');
                            setSelectedImages([]);
                            imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
                            setImagePreviewUrls([]);
                            setSelectedGif(null);
                            setIsReplyExpanded(false);
                            
                          } catch (error) {
                            console.error('Reply submission failed:', error);
                            alert('回复失败，请重试');
                            setIsUploadingMedia(false);
                          }
                        }}
                        disabled={(!replyText.trim() && selectedImages.length === 0 && !selectedGif) || isUploadingMedia}
                        className={`px-4 py-2 text-white rounded-full transition-colors ${
                          (!replyText.trim() && selectedImages.length === 0 && !selectedGif) || isUploadingMedia
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-black hover:bg-gray-800'
                        }`}
                      >
                        {isUploadingMedia ? '上传中...' : 'Reply'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ImageViewerSidebar;
