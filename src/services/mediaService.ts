// Media upload service for handling file uploads to MinIO via backend
export class MediaService {
  private static readonly API_BASE = 'http://localhost:8080'

  /**
   * Upload avatar image to MinIO
   */
  static async uploadAvatar(imageBlob: Blob, userId: string): Promise<string> {
    const formData = new FormData()
    formData.append('file', imageBlob, `avatar-${userId}-${Date.now()}.jpg`)
    formData.append('type', 'avatars')
    formData.append('userId', userId)

    // Get JWT token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    try {
      const response = await fetch(`${this.API_BASE}/api/media/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const result = await response.json()
      return result.url
    } catch (error) {
      console.error('Avatar upload error:', error)
      throw error
    }
  }

  /**
   * Upload banner image to MinIO
   */
  static async uploadBanner(imageBlob: Blob, userId: string): Promise<string> {
    const formData = new FormData()
    formData.append('file', imageBlob, `banner-${userId}-${Date.now()}.jpg`)
    formData.append('type', 'banners')
    formData.append('userId', userId)

    // Get JWT token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    try {
      const response = await fetch(`${this.API_BASE}/api/media/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const result = await response.json()
      return result.url
    } catch (error) {
      console.error('Banner upload error:', error)
      throw error
    }
  }

  /**
   * Upload post media files to MinIO
   */
  static async uploadPostMedia(files: File[], userId: string): Promise<string[]> {
    const uploadPromises = files.map(async (file, index) => {
      const formData = new FormData()
      formData.append('file', file, `post-${userId}-${Date.now()}-${index}.${file.name.split('.').pop()}`)
      formData.append('type', 'posts')
      formData.append('userId', userId)

      // Get JWT token from localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      try {
        const response = await fetch(`${this.API_BASE}/api/media/upload`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: response.statusText }))
          const errorMessage = errorData.error || response.statusText
          throw new Error(errorMessage)
        }

        const result = await response.json()
        return result.url
      } catch (error) {
        console.error('Post media upload error:', error)
        throw error
      }
    })

    return Promise.all(uploadPromises)
  }

  /**
   * Delete media file from MinIO
   */
  static async deleteMedia(fileUrl: string): Promise<void> {
    // Get JWT token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    try {
      const response = await fetch(`${this.API_BASE}/api/media/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ url: fileUrl }),
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Media delete error:', error)
      throw error
    }
  }

  /**
   * Get media file list for user
   */
  static async getUserMedia(userId: string, page = 1, pageSize = 20): Promise<any[]> {
    // Get JWT token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    try {
      const response = await fetch(
        `${this.API_BASE}/api/media/list?userId=${userId}&page=${page}&pageSize=${pageSize}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.statusText}`)
      }

      const result = await response.json()
      return result.files || []
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
