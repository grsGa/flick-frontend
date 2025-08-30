"use client";

import React, { useState, useRef } from 'react';
import { useMutation, gql } from '@apollo/client';
import { useAuth } from '@/hooks/useAuth';
import { User } from '@/graphql/types';
import AvatarCrop from '@/components/ui/AvatarCrop';
import BannerCrop from '@/components/ui/BannerCrop';
import { MediaService } from '@/services/mediaService';
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
      
      // Sync with global auth state for sidebar and other components
      if (data?.updateProfile) {
        console.log('[EditProfileModal] Updating user state with new avatar:', data.updateProfile.avatarUrl);
        updateUser({
          displayName: data.updateProfile.displayName,
          avatarUrl: data.updateProfile.avatarUrl,
        });
      }
      
      onClose();
    },
    onError: (err) => {
      setError(err.message);
    },
    // Use a more aggressive cache reset strategy
    refetchQueries: 'all',
    // Also update cache directly for immediate UI response
    update: (cache, { data }) => {
      console.log('[EditProfileModal] Cache update function called with data:', data);
      
      if (data?.updateProfile) {
        console.log('[EditProfileModal] Starting cache update for user:', user.username);
        
        try {
          // Write the updated user data to cache
          cache.writeQuery({
            query: gql`
              query UserByUsername($username: String!) {
                userByUsername(username: $username) {
                  id
                  username
                  displayName
                  bio
                  location
                  website
                  avatarUrl
                  bannerUrl
                  followersCount
                  followingCount
                  isFollowing
                  isVerified
                  createdAt
                }
              }
            `,
            variables: { username: user.username },
            data: {
              userByUsername: {
                ...user,
                ...data.updateProfile,
                __typename: 'User',
              },
            },
          });
          console.log('[EditProfileModal] User profile cache updated successfully');

          // Use nuclear option: reset entire cache to force all data to refetch
          console.log('[EditProfileModal] Resetting entire Apollo cache...');
          cache.reset();
          console.log('[EditProfileModal] Cache reset completed');
          
          console.log('[EditProfileModal] Cache update completed successfully');
          
        } catch (error) {
          console.error('[EditProfileModal] Cache update failed:', error);
        }
      }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      variables: {
        input: {
          displayName,
          bio,
          location,
          website,
          avatarUrl: newAvatarUrl,
          bannerUrl: newBannerUrl,
        },
      },
    });
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
