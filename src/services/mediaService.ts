import { ApolloClient, NormalizedCacheObject, gql } from '@apollo/client'
import { 
  UPLOAD_AVATAR, 
  UPLOAD_BANNER, 
  UPLOAD_POST_MEDIA, 
  DELETE_MEDIA,
  UploadAvatarInput,
  UploadBannerInput,
  UploadPostMediaInput,
  DeleteMediaInput,
  MediaUploadResult,
  MediaDeleteResult
} from '../graphql/media'

// Media upload service using GraphQL mutations
export class MediaService {
  private static apolloClient: ApolloClient<NormalizedCacheObject> | null = null

  static setApolloClient(client: ApolloClient<NormalizedCacheObject>) {
    this.apolloClient = client
  }

  private static getClient() {
    if (!this.apolloClient) {
      throw new Error('Apollo client not initialized. Call setApolloClient first.')
    }
    return this.apolloClient
  }

  // Validate JWT token before operations
  private static validateToken(): boolean {
    if (typeof window === 'undefined') return false;
    
    const token = localStorage.getItem('token');
    if (!token) {
      this.handleAuthenticationError('No authentication token found. Please log in.');
      return false;
    }

    try {
      // Parse JWT token payload
      const parts = token.split('.');
      if (parts.length !== 3) {
        this.handleAuthenticationError('Invalid token format');
        return false;
      }
      
      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);
      
      // Check if token is expired
      if (payload.exp && payload.exp < now) {
        this.handleAuthenticationError('Token expired. Please log in again.');
        return false;
      }
      
      // Check required fields
      if (!payload.user_id || !payload.username) {
        this.handleAuthenticationError('Invalid token claims');
        return false;
      }
      
      return true;
    } catch (error) {
      this.handleAuthenticationError(`Token validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  // Handle authentication errors with automatic redirect
  private static handleAuthenticationError(message: string): void {
    console.error('Authentication error:', message);
    
    // Clear invalid token
    localStorage.removeItem('token');
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/?modal=login';
    }
    
    throw new Error(message);
  }

  /**
   * Upload avatar image via multipart form data
   */
  static async uploadAvatar(imageBlob: Blob, userId: string): Promise<string> {
    // Validate token before upload
    this.validateToken();
    
    try {
      const file = new File([imageBlob], `avatar-${userId}-${Date.now()}.jpg`, {
        type: imageBlob.type || 'image/jpeg'
      })

      const formData = new FormData()
      formData.append('operations', JSON.stringify({
        query: `
          mutation UploadAvatar($input: UploadAvatarInput!) {
            uploadAvatar(input: $input) {
              fileId
              fileUrl
              success
              message
            }
          }
        `,
        variables: { input: { file: null, userId } }
      }))
      formData.append('map', JSON.stringify({ '0': ['variables.input.file'] }))
      formData.append('0', file)

      const token = localStorage.getItem('token')
      const response = await fetch(
        process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:8080/graphql',
        {
          method: 'POST',
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: formData
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.errors) {
        throw new Error(result.errors[0]?.message || 'GraphQL error')
      }

      if (!result.data?.uploadAvatar.success) {
        throw new Error(result.data?.uploadAvatar.message || 'Upload failed')
      }

      return result.data.uploadAvatar.fileUrl
    } catch (error) {
      console.error('Avatar upload error:', error)
      throw error
    }
  }

  /**
   * Upload banner image via multipart form data
   */
  static async uploadBanner(imageBlob: Blob, userId: string): Promise<string> {
    // Validate token before upload
    this.validateToken();
    
    try {
      const file = new File([imageBlob], `banner-${userId}-${Date.now()}.jpg`, {
        type: imageBlob.type || 'image/jpeg'
      })

      const formData = new FormData()
      formData.append('operations', JSON.stringify({
        query: `
          mutation UploadBanner($input: UploadBannerInput!) {
            uploadBanner(input: $input) {
              fileId
              fileUrl
              success
              message
            }
          }
        `,
        variables: { input: { file: null, userId } }
      }))
      formData.append('map', JSON.stringify({ '0': ['variables.input.file'] }))
      formData.append('0', file)

      const token = localStorage.getItem('token')
      const response = await fetch(
        process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:8080/graphql',
        {
          method: 'POST',
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: formData
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.errors) {
        throw new Error(result.errors[0]?.message || 'GraphQL error')
      }

      if (!result.data?.uploadBanner.success) {
        throw new Error(result.data?.uploadBanner.message || 'Upload failed')
      }

      return result.data.uploadBanner.fileUrl
    } catch (error) {
      console.error('Banner upload error:', error)
      throw error
    }
  }

  /**
   * Upload post media files via multipart form data
   */
  static async uploadPostMedia(files: File[], userId: string): Promise<string[]> {
    // Validate token before upload
    this.validateToken();
    
    try {
      const formData = new FormData()
      const altTexts = files.map((_, index) => `Media ${index + 1}`)
      
      formData.append('operations', JSON.stringify({
        query: `
          mutation UploadPostMedia($input: UploadPostMediaInput!) {
            uploadPostMedia(input: $input) {
              fileId
              fileUrl
              success
              message
            }
          }
        `,
        variables: { 
          input: { 
            files: files.map(() => null), 
            userId, 
            altTexts 
          } 
        }
      }))
      
      // Create file mapping for multiple files
      const fileMap: Record<string, string[]> = {}
      files.forEach((_, index) => {
        fileMap[index.toString()] = [`variables.input.files.${index}`]
      })
      formData.append('map', JSON.stringify(fileMap))
      
      // Append each file
      files.forEach((file, index) => {
        formData.append(index.toString(), file)
      })

      const token = localStorage.getItem('token')
      const response = await fetch(
        process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:8080/graphql',
        {
          method: 'POST',
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: formData
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.errors) {
        throw new Error(result.errors[0]?.message || 'GraphQL error')
      }

      if (!result.data?.uploadPostMedia || result.data.uploadPostMedia.length === 0) {
        throw new Error('Upload failed - no results returned')
      }

      // Check if any uploads failed
      const failedUploads = result.data.uploadPostMedia.filter((upload: MediaUploadResult) => !upload.success)
      if (failedUploads.length > 0) {
        throw new Error(`Upload failed: ${failedUploads.map((f: MediaUploadResult) => f.message).join(', ')}`)
      }

      return result.data.uploadPostMedia.map((upload: MediaUploadResult) => upload.fileUrl)
    } catch (error) {
      console.error('Post media upload error:', error)
      throw error
    }
  }

  /**
   * Delete media file via GraphQL mutation
   */
  static async deleteMedia(fileUrl: string): Promise<void> {
    // Validate token before delete
    this.validateToken();
    
    try {
      const { data } = await this.getClient().mutate<
        { deleteMedia: boolean },
        { input: DeleteMediaInput }
      >({
        mutation: DELETE_MEDIA,
        variables: {
          input: { fileUrl }
        }
      })

      if (!data?.deleteMedia) {
        throw new Error('Delete failed')
      }
    } catch (error) {
      console.error('Media delete error:', error)
      throw error
    }
  }

  /**
   * Get media file list for user via GraphQL query
   */
  static async getUserMedia(userId: string, page = 1, pageSize = 20): Promise<any[]> {
    // Validate token before query
    if (!this.validateToken()) {
      return [];
    }

    try {
      const { data } = await this.getClient().query({
        query: gql`
          query UserMedia($userId: ID!, $first: Int!, $after: String) {
            userMedia(userId: $userId, first: $first, after: $after) {
              edges {
                node {
                  ... on Post {
                    id
                    media {
                      id
                      url
                      type
                      mimeType
                      width
                      height
                      variants {
                        thumbnail {
                          url
                          width
                          height
                        }
                        small {
                          url
                          width
                          height
                        }
                      }
                    }
                    createdAt
                  }
                }
                cursor
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        `,
        variables: {
          userId,
          first: pageSize,
          after: page > 1 ? btoa(`cursor:${(page - 1) * pageSize}`) : null
        }
      })

      // Extract media from posts and flatten the array
      const posts = data?.userMedia?.edges?.map((edge: any) => edge.node) || []
      const mediaFiles: any[] = []
      
      posts.forEach((post: any) => {
        if (post.media && post.media.length > 0) {
          mediaFiles.push(...post.media.map((media: any) => ({
            ...media,
            postId: post.id,
            createdAt: post.createdAt
          })))
        }
      })
      
      return mediaFiles
    } catch (error) {
      console.error('Media list error:', error)
      throw error
    }
  }

  /**
   * Convert File to Blob
   */
  static fileToBlob(file: File): Promise<Blob> {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer
        const blob = new Blob([arrayBuffer], { type: file.type })
        resolve(blob)
      }
      reader.readAsArrayBuffer(file)
    })
  }

  /**
   * Create object URL from Blob for preview
   */
  static createPreviewUrl(blob: Blob): string {
    return URL.createObjectURL(blob)
  }

  /**
   * Revoke object URL to free memory
   */
  static revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url)
  }
}
