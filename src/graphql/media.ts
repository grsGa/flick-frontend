import { gql } from '@apollo/client'

// GraphQL mutations for media operations
export const UPLOAD_AVATAR = gql`
  mutation UploadAvatar($input: UploadAvatarInput!) {
    uploadAvatar(input: $input) {
      fileId
      fileUrl
      success
      message
    }
  }
`

export const UPLOAD_BANNER = gql`
  mutation UploadBanner($input: UploadBannerInput!) {
    uploadBanner(input: $input) {
      fileId
      fileUrl
      success
      message
    }
  }
`

export const UPLOAD_POST_MEDIA = gql`
  mutation UploadPostMedia($input: UploadPostMediaInput!) {
    uploadPostMedia(input: $input) {
      fileId
      fileUrl
      success
      message
    }
  }
`

export const DELETE_MEDIA = gql`
  mutation DeleteMedia($input: DeleteMediaInput!) {
    deleteMedia(input: $input)
  }
`

// Input types for TypeScript
export interface UploadAvatarInput {
  file: File
  userId: string
}

export interface UploadBannerInput {
  file: File
  userId: string
}

export interface UploadPostMediaInput {
  files: File[]
  userId: string
  altTexts?: string[]
}

export interface DeleteMediaInput {
  fileUrl: string
}

// Response types
export interface MediaUploadResult {
  fileId: string
  fileUrl: string
  success: boolean
  message?: string
}

export interface MediaDeleteResult {
  success: boolean
  message?: string
}
