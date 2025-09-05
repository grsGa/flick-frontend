"use client";

import React, { useState, useRef } from 'react';
import { useMutation, gql } from '@apollo/client';
import { useAuth } from '@/hooks/useAuth';
import { User } from '@/graphql/types';
import AvatarCrop from '@/components/ui/AvatarCrop';
import BannerCrop from '@/components/ui/BannerCrop';
import { MediaService } from '@/services/mediaService';
import { userUpdateService } from '@/services/userUpdateService';
import { Camera } from 'lucide-react';

const UPDATE_PROFILE_MUTATION = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id
      displayName
      bio
      location
      website
      avatarUrl
      bannerUrl
    }
  }
`;

interface EditProfileModalProps {
  user: User;
  onClose: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose }) => {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [bio, setBio] = useState(user.bio || '');
  const [location, setLocation] = useState(user.location || '');
  const [website, setWebsite] = useState(user.website || '');
  const [error, setError] = useState('');
  
  // Image cropping states
  const [avatarSrc, setAvatarSrc] = useState('');
  const [bannerSrc, setBannerSrc] = useState('');
  const [showAvatarCrop, setShowAvatarCrop] = useState(false);
  const [showBannerCrop, setShowBannerCrop] = useState(false);
  const [newAvatarUrl, setNewAvatarUrl] = useState(user.avatarUrl || '');
  const [newBannerUrl, setNewBannerUrl] = useState(user.bannerUrl || '');
  const [uploading, setUploading] = useState(false);
  
  // File input refs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const { updateUser } = useAuth();

  const [updateProfile, { loading }] = useMutation(UPDATE_PROFILE_MUTATION, {
    onCompleted: (data) => {
      console.log('[EditProfileModal] onCompleted triggered with data:', data);
      
      // 使用全局用户更新服务进行统一更新
      if (data?.updateProfile) {
        console.log('[EditProfileModal] Triggering global user update:', data.updateProfile);
        
        // 更新全局Auth状态
        updateUser({
          displayName: data.updateProfile.displayName,
          avatarUrl: data.updateProfile.avatarUrl,
        });
        
        // 触发全局用户数据更新（包括Apollo缓存）- 只传递有值的字段
        const updateData: any = { username: user.username };
        if (data.updateProfile.displayName !== undefined) updateData.displayName = data.updateProfile.displayName;
        if (data.updateProfile.avatarUrl !== undefined) updateData.avatarUrl = data.updateProfile.avatarUrl;
        if (data.updateProfile.bio !== undefined) updateData.bio = data.updateProfile.bio;
        if (data.updateProfile.location !== undefined) updateData.location = data.updateProfile.location;
        if (data.updateProfile.website !== undefined) updateData.website = data.updateProfile.website;
        if (data.updateProfile.bannerUrl !== undefined) updateData.bannerUrl = data.updateProfile.bannerUrl;
        
        userUpdateService.updateUserGlobally(updateData);
      }
      
      onClose();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  // Image handling functions
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarSrc(reader.result as string);
        setShowAvatarCrop(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setBannerSrc(reader.result as string);
        setShowBannerCrop(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarCropComplete = async (croppedImageBlob: Blob) => {
    setUploading(true);
    try {
      const url = await MediaService.uploadAvatar(croppedImageBlob, user.id);
      setNewAvatarUrl(url);
      setError('');
    } catch (err) {
      setError('Failed to upload avatar');
      console.error('Avatar upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleBannerCropComplete = async (croppedImageBlob: Blob) => {
    setUploading(true);
    try {
      const url = await MediaService.uploadBanner(croppedImageBlob, user.id);
      setNewBannerUrl(url);
      setError('');
    } catch (err) {
      setError('Failed to upload banner');
      console.error('Banner upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    console.log('[EditProfileModal] Submitting profile update with data:', {
      displayName: displayName || null,
      bio: bio || null,
      location: location || null,
      website: website || null,
      avatarURL: newAvatarUrl || null,
      bannerURL: newBannerUrl || null,
    });
    
    try {
      const result = await updateProfile({
        variables: {
          input: {
            displayName: displayName || null,
            bio: bio || null,
            location: location || null,
            website: website || null,
            avatarUrl: newAvatarUrl || null,
            bannerUrl: newBannerUrl || null,
          },
        },
      });
      
      console.log('[EditProfileModal] Profile update result:', result);
      onClose();
      
    } catch (err) {
      setError('Failed to update profile');
      console.error('Profile update error:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-black rounded-2xl w-full max-w-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold">Edit Profile</h2>
          <div className="flex items-center">
            <button
              onClick={handleSubmit}
              className="bg-black dark:bg-white text-white dark:text-black rounded-full px-4 py-2 font-bold mr-4"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button onClick={onClose} className="text-2xl">&times;</button>
          </div>
        </div>
        <div className="p-4">
          {/* Banner and Avatar */}
          <div className="relative mb-16">
            {/* Banner */}
            <div className="relative bg-gray-300 dark:bg-gray-700 h-48 w-full rounded-lg overflow-hidden">
              {newBannerUrl && <img src={newBannerUrl} alt="Banner" className="w-full h-full object-cover" />}
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
                disabled={uploading}
              >
                <Camera className="w-8 h-8 text-white" />
              </button>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                onChange={handleBannerSelect}
                className="hidden"
              />
            </div>
            
            {/* Avatar */}
            <div className="absolute -bottom-12 left-4">
              <div className="relative w-24 h-24 rounded-full border-4 border-white dark:border-black bg-gray-400 overflow-hidden">
                {newAvatarUrl && <img src={newAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />}
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
                  disabled={uploading}
                >
                  <Camera className="w-5 h-5 text-white" />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarSelect}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="text-gray-500">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full p-2 bg-transparent border border-gray-300 dark:border-gray-700 rounded"
              />
            </div>
            <div>
              <label className="text-gray-500">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full p-2 bg-transparent border border-gray-300 dark:border-gray-700 rounded"
              />
            </div>
            <div>
              <label className="text-gray-500">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full p-2 bg-transparent border border-gray-300 dark:border-gray-700 rounded"
              />
            </div>
            <div>
              <label className="text-gray-500">Website</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full p-2 bg-transparent border border-gray-300 dark:border-gray-700 rounded"
              />
            </div>
          </div>
          {error && <p className="text-red-500 mt-4">{error}</p>}
          {uploading && <p className="text-blue-500 mt-4">Uploading image...</p>}
        </div>
      </div>

      {/* Cropping Modals */}
      <AvatarCrop
        isOpen={showAvatarCrop}
        onClose={() => setShowAvatarCrop(false)}
        imageSrc={avatarSrc}
        onCropComplete={handleAvatarCropComplete}
      />
      
      <BannerCrop
        isOpen={showBannerCrop}
        onClose={() => setShowBannerCrop(false)}
        imageSrc={bannerSrc}
        onCropComplete={handleBannerCropComplete}
      />
    </div>
  );
};

export default EditProfileModal;
