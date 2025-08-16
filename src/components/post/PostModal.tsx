'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Avatar from '@/components/core/Avatar';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { useAuth } from '@/hooks/useAuth';
import GifPicker from './GifPicker';

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PostModal: React.FC<PostModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const maxLength = 280;

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

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

  // Image handling functions
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Convert FileList to array and limit to 4 images
    const newFiles = Array.from(files).slice(0, 4 - selectedImages.length);
    
    // Check for mutual exclusivity with GIF
    if (selectedGif && newFiles.length > 0) {
      setSelectedGif(null);
    }

    // Filter only image files
    const imageFiles = newFiles.filter(file => 
      file.type.startsWith('image/') && 
      ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)
    );

    if (imageFiles.length > 0) {
      const updatedImages = [...selectedImages, ...imageFiles].slice(0, 4);
      setSelectedImages(updatedImages);
      
      // Create preview URLs
      const newUrls = imageFiles.map(file => URL.createObjectURL(file));
      setImagePreviewUrls(prev => [...prev, ...newUrls].slice(0, 4));
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
    setSelectedGif(gifUrl);
    setShowGifPicker(false);
  };

  const handlePost = () => {
    if (content.trim() || selectedGif || selectedImages.length > 0) {
      // TODO: Implement post submission logic
      console.log('Posting:', { 
        content, 
        gif: selectedGif, 
        images: selectedImages 
      });
      
      // Cleanup
      setContent('');
      setSelectedGif(null);
      imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
      setSelectedImages([]);
      setImagePreviewUrls([]);
      onClose();
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
              
              {/* Selected Images Preview */}
              {selectedImages.length > 0 && (
                <div className="mt-3">
                  {/* Single Image Layout */}
                  {selectedImages.length === 1 && (
                    <div className="relative">
                      <img 
                        src={imagePreviewUrls[0]} 
                        alt="Selected image" 
                        className="w-full max-h-80 rounded-xl object-cover"
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
                  )}
                  
                  {/* Two Images Layout */}
                  {selectedImages.length === 2 && (
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
                className="w-9 h-9 rounded-full hover:bg-blue-50 flex items-center justify-center text-blue-500"
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
              disabled={selectedImages.length >= 4 || !!selectedGif}
              className={`w-9 h-9 rounded-full hover:bg-blue-50 flex items-center justify-center ${
                selectedImages.length >= 4 || !!selectedGif ? 'text-gray-400 cursor-not-allowed' : 'text-blue-500'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
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
                className="w-9 h-9 rounded-full hover:bg-blue-50 flex items-center justify-center text-blue-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-9 0a2 2 0 00-2 2v14a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2" />
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
            <button className="w-9 h-9 rounded-full hover:bg-blue-50 flex items-center justify-center text-blue-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
          </div>

          {/* Post Button */}
          <button
            onClick={handlePost}
            disabled={(!content.trim() && !selectedGif && selectedImages.length === 0) || content.length > maxLength}
            className={`px-6 py-2 rounded-full font-bold text-sm ${
              (content.trim() || selectedGif || selectedImages.length > 0) && content.length <= maxLength
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

export default PostModal;
