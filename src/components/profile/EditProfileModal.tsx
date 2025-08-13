"use client";

import React, { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { useAuth } from '@/hooks/useAuth';
import { User } from '@/graphql/types';

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

  const [updateProfile, { loading }] = useMutation(UPDATE_PROFILE_MUTATION, {
    onCompleted: (data) => {
      // Update Apollo Client cache to reflect the changes immediately
      // This ensures the profile page shows updated data without needing to refetch
      onClose();
    },
    onError: (err) => {
      setError(err.message);
    },
    // Refetch the UserByUsername query to ensure UI updates immediately
    refetchQueries: [
      {
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
      },
    ],
    // Also update cache directly for immediate UI response
    update: (cache, { data }) => {
      if (data?.updateProfile) {
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
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      variables: {
        input: {
          displayName,
          bio,
          location,
          website,
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
            <div className="bg-gray-300 dark:bg-gray-700 h-48 w-full">
              {user.bannerUrl && <img src={user.bannerUrl} alt="Banner" className="w-full h-full object-cover" />}
            </div>
            <div className="absolute -bottom-12 left-4 w-24 h-24 rounded-full border-4 border-white dark:border-black bg-gray-400">
              {user.avatarUrl && <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />}
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
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
