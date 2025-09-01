import { createClient } from '@/lib/supabase/client'

export interface StorageUploadResult {
  success: boolean
  publicUrl?: string
  error?: string
}

/**
 * Safe upload function with fallback options
 */
export async function uploadEventImage(
  file: File,
  eventId: string
): Promise<StorageUploadResult> {
  try {
    const supabase = createClient()
    
    // Check authentication first
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${eventId}/${Date.now()}.${fileExt}`
    const filePath = `event-images/${fileName}`

    // First, check if bucket exists
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
      
      if (bucketsError) {
        console.error('Cannot access storage:', bucketsError)
        
        // Return a placeholder image URL if storage is not available
        return {
          success: true,
          publicUrl: '/placeholder-event.jpg', // You should add this placeholder image
          error: 'Storage not available - using placeholder'
        }
      }

      const eventImagesBucket = buckets?.find(bucket => bucket.id === 'event-images')
      
      if (!eventImagesBucket) {
        console.error('event-images bucket not found')
        
        // Try to create the bucket
        const { error: createError } = await supabase.rpc('create_storage_bucket', {
          bucket_name: 'event-images',
          is_public: true
        }).catch(() => ({ error: 'Cannot create bucket' }))

        if (createError) {
          return {
            success: true,
            publicUrl: '/placeholder-event.jpg',
            error: 'Storage bucket not configured - using placeholder'
          }
        }
      }
    } catch (error) {
      console.error('Storage check failed:', error)
      return {
        success: true,
        publicUrl: '/placeholder-event.jpg',
        error: 'Storage check failed - using placeholder'
      }
    }

    // Attempt upload
    const { data, error: uploadError } = await supabase.storage
      .from('event-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true // Allow overwrite if exists
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      
      // Try alternative path without user ID
      const altPath = `${eventId}-${Date.now()}.${fileExt}`
      const { data: altData, error: altError } = await supabase.storage
        .from('event-images')
        .upload(altPath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (altError) {
        return {
          success: true,
          publicUrl: '/placeholder-event.jpg',
          error: `Upload failed: ${altError.message}`
        }
      }

      // Get public URL for alternative upload
      const { data: { publicUrl: altPublicUrl } } = supabase.storage
        .from('event-images')
        .getPublicUrl(altPath)

      return {
        success: true,
        publicUrl: altPublicUrl
      }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('event-images')
      .getPublicUrl(filePath)

    return {
      success: true,
      publicUrl
    }

  } catch (error) {
    console.error('Storage helper error:', error)
    return {
      success: true, // Still return success to not block event creation
      publicUrl: '/placeholder-event.jpg',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Check if storage is properly configured
 */
export async function checkStorageHealth(): Promise<{
  isHealthy: boolean
  bucket: boolean
  canUpload: boolean
  message: string
}> {
  try {
    const supabase = createClient()
    
    // Check if we can list buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      return {
        isHealthy: false,
        bucket: false,
        canUpload: false,
        message: `Storage API error: ${bucketsError.message}`
      }
    }

    // Check for event-images bucket
    const eventImagesBucket = buckets?.find(bucket => bucket.id === 'event-images')
    
    if (!eventImagesBucket) {
      return {
        isHealthy: false,
        bucket: false,
        canUpload: false,
        message: 'event-images bucket not found. Run the SQL setup script.'
      }
    }

    // Check if bucket is public
    if (!eventImagesBucket.public) {
      return {
        isHealthy: false,
        bucket: true,
        canUpload: false,
        message: 'event-images bucket is not public. Images won\'t be visible.'
      }
    }

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return {
        isHealthy: true,
        bucket: true,
        canUpload: false,
        message: 'Storage configured but user not authenticated'
      }
    }

    return {
      isHealthy: true,
      bucket: true,
      canUpload: true,
      message: 'Storage is properly configured'
    }

  } catch (error) {
    return {
      isHealthy: false,
      bucket: false,
      canUpload: false,
      message: error instanceof Error ? error.message : 'Unknown error checking storage'
    }
  }
}