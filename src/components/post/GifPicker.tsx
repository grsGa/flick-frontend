'use client';

import React, { useState, useEffect } from 'react';

interface GifData {
  id: string;
  title: string;
  media_formats: {
    gif: {
      url: string;
      dims: number[];
    };
    tinygif: {
      url: string;
      dims: number[];
    };
    nanogif: {
      url: string;
      dims: number[];
    };
  };
}

interface GifPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onGifSelect: (gifUrl: string) => void;
}

const GifPicker: React.FC<GifPickerProps> = ({ isOpen, onClose, onGifSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gifs, setGifs] = useState<GifData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_KEY = 'AIzaSyArSGS5Rwl5sMFi13xuEKUsMVNap1l2soQ';
  const CLIENT_KEY = 'flick_social_app';

  // 搜索热门GIF
  const searchTrendingGifs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `https://tenor.googleapis.com/v2/featured?key=${API_KEY}&client_key=${CLIENT_KEY}&limit=20`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch trending GIFs');
      }
      
      const data = await response.json();
      setGifs(data.results || []);
    } catch (err) {
      setError('Failed to load trending GIFs');
      console.error('Error fetching trending GIFs:', err);
    } finally {
      setLoading(false);
    }
  };

  // 搜索GIF
  const searchGifs = async (query: string) => {
    if (!query.trim()) {
      searchTrendingGifs();
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${API_KEY}&client_key=${CLIENT_KEY}&limit=20`
      );
      
      if (!response.ok) {
        throw new Error('Failed to search GIFs');
      }
      
      const data = await response.json();
      setGifs(data.results || []);
    } catch (err) {
      setError('Failed to search GIFs');
      console.error('Error searching GIFs:', err);
    } finally {
      setLoading(false);
    }
  };

  // 处理搜索输入
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // 防抖搜索
    const timeoutId = setTimeout(() => {
      searchGifs(value);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  };

  // 处理GIF选择
  const handleGifClick = (gif: GifData) => {
    onGifSelect(gif.media_formats.gif.url);
    onClose();
  };

  // 初始加载热门GIF
  useEffect(() => {
    if (isOpen) {
      searchTrendingGifs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-10 bg-white rounded-lg shadow-lg border border-gray-200 w-80 h-80 overflow-hidden">
      {/* 聊天气泡箭头 */}
      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-l border-t border-gray-200 rotate-45"></div>
      
      {/* 搜索框 */}
      <div className="p-4 border-b border-gray-200">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search for GIFs..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* GIF网格 */}
      <div className="flex-1 overflow-y-auto p-2" style={{ height: 'calc(100% - 100px)' }}>
        {loading && (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-32 text-red-500">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-2 gap-2">
            {gifs.map((gif) => (
              <div
                key={gif.id}
                onClick={() => handleGifClick(gif)}
                className="cursor-pointer rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
              >
                <img
                  src={gif.media_formats.nanogif.url}
                  alt={gif.title}
                  className="w-full h-20 object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}

        {!loading && !error && gifs.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-500">
            No GIFs found
          </div>
        )}
      </div>

      {/* Tenor Attribution */}
      <div className="p-2 border-t border-gray-200 text-xs text-gray-500 text-center">
        Powered by Tenor
      </div>
    </div>
  );
};

export default GifPicker;
