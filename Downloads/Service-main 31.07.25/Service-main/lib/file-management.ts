import { supabase } from '@/lib/supabase';

export interface FileUploadResult {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  url: string;
  path: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface FileMetadata {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  path: string;
  uploadedAt: Date;
  uploadedBy: string;
  category?: string;
  tags?: string[];
  description?: string;
  isPublic: boolean;
  downloadCount: number;
}

export class FileManagementService {
  private static readonly BUCKET_NAME = 'documents';
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];

  /**
   * Upload a file to Supabase storage
   */
  static async uploadFile(
    file: File,
    options: {
      category?: string;
      description?: string;
      tags?: string[];
      isPublic?: boolean;
      folder?: string;
    } = {}
  ): Promise<FileUploadResult> {
    try {
      // Check authentication first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Authentication required for file upload');
      }

      // Validate file
      if (!file) {
        throw new Error('No file provided');
      }

      if (file.size > this.MAX_FILE_SIZE) {
        throw new Error(`File size exceeds maximum limit of ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`);
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const folder = options.folder || 'uploads';
      const filePath = `${folder}/${fileName}`;

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      // Try to save metadata to database
      try {
        const { data: metadataResult, error: metadataError } = await supabase
          .from('file_metadata')
          .insert({
            filename: fileName,
            original_name: file.name,
            size: file.size,
            mime_type: file.type,
            path: filePath,
            uploaded_by: session.user.id,
            category: options.category,
            description: options.description,
            tags: options.tags,
            is_public: options.isPublic || false
          })
          .select()
          .single();

        if (metadataError) {
          // Check if it's a table not found error
          if (metadataError.message.includes('does not exist') || metadataError.message.includes('relation') || metadataError.code === 'PGRST116') {
            console.warn('File metadata table not found. File uploaded but metadata not saved. Please run database migrations.');
            // Return result without metadata persistence
            return {
              id: `file-${Date.now()}`,
              filename: fileName,
              originalName: file.name,
              size: file.size,
              mimeType: file.type,
              url: urlData.publicUrl,
              path: filePath,
              uploadedAt: new Date(),
              uploadedBy: session.user.id
            };
          }
          
          // If metadata save fails for other reasons, clean up uploaded file
          await supabase.storage
            .from(this.BUCKET_NAME)
            .remove([filePath]);
          throw new Error(`Metadata save failed: ${metadataError.message}`);
        }

        return {
          id: metadataResult.id,
          filename: metadataResult.filename,
          originalName: metadataResult.original_name,
          size: metadataResult.size,
          mimeType: metadataResult.mime_type,
          url: urlData.publicUrl,
          path: metadataResult.path,
          uploadedAt: new Date(metadataResult.created_at),
          uploadedBy: metadataResult.uploaded_by
        };
      } catch (metadataError) {
        console.error('Metadata save error:', metadataError);
        // Don't clean up file, just warn about metadata
        console.warn('File uploaded successfully but metadata could not be saved');
        
        return {
          id: `file-${Date.now()}`,
          filename: fileName,
          originalName: file.name,
          size: file.size,
          mimeType: file.type,
          url: urlData.publicUrl,
          path: filePath,
          uploadedAt: new Date(),
          uploadedBy: session.user.id
        };
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Upload multiple files
   */
  static async uploadMultipleFiles(
    files: File[],
    options: {
      category?: string;
      description?: string;
      tags?: string[];
      isPublic?: boolean;
      folder?: string;
    } = {}
  ): Promise<{ successful: FileUploadResult[]; failed: { file: File; error: string }[] }> {
    const successful: FileUploadResult[] = [];
    const failed: { file: File; error: string }[] = [];

    for (const file of files) {
      try {
        const result = await this.uploadFile(file, options);
        successful.push(result);
      } catch (error) {
        failed.push({
          file,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return { successful, failed };
  }

  /**
   * Get file metadata by ID
   */
  static async getFileMetadata(fileId: string): Promise<FileMetadata | null> {
    try {
      const { data, error } = await supabase
        .from('file_metadata')
        .select('*')
        .eq('id', fileId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // File not found
        }
        throw new Error(`Failed to get file metadata: ${error.message}`);
      }

      return {
        id: data.id,
        filename: data.filename,
        originalName: data.original_name,
        size: data.size,
        mimeType: data.mime_type,
        path: data.path,
        uploadedAt: new Date(data.created_at),
        uploadedBy: data.uploaded_by,
        category: data.category,
        tags: data.tags,
        description: data.description,
        isPublic: data.is_public,
        downloadCount: data.download_count
      };
    } catch (error) {
      console.error('Error getting file metadata:', error);
      throw error;
    }
  }

  /**
   * Get file download URL
   */
  static async getFileDownloadUrl(fileId: string): Promise<string> {
    try {
      const metadata = await this.getFileMetadata(fileId);
      if (!metadata) {
        throw new Error('File not found');
      }

      // Check permissions
      const { data: { session } } = await supabase.auth.getSession();
      if (!metadata.isPublic && (!session || session.user.id !== metadata.uploadedBy)) {
        // For non-public files, check if user has access
        const hasAccess = await this.checkFileAccess(fileId, session?.user.id);
        if (!hasAccess) {
          throw new Error('Access denied');
        }
      }

      // Increment download count
      await this.incrementDownloadCount(fileId);

      // Generate signed URL for private files or return public URL
      if (metadata.isPublic) {
        const { data } = supabase.storage
          .from(this.BUCKET_NAME)
          .getPublicUrl(metadata.path);
        return data.publicUrl;
      } else {
        const { data, error } = await supabase.storage
          .from(this.BUCKET_NAME)
          .createSignedUrl(metadata.path, 3600); // 1 hour expiry

        if (error) {
          throw new Error(`Failed to create signed URL: ${error.message}`);
        }

        return data.signedUrl;
      }
    } catch (error) {
      console.error('Error getting file download URL:', error);
      throw error;
    }
  }

  /**
   * Delete a file
   */
  static async deleteFile(fileId: string): Promise<void> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Authentication required');
      }

      // Get file metadata
      const metadata = await this.getFileMetadata(fileId);
      if (!metadata) {
        throw new Error('File not found');
      }

      // Check permissions (only owner or admin can delete)
      const isOwner = metadata.uploadedBy === session.user.id;
      const isAdmin = await this.isUserAdmin(session.user.id);
      
      if (!isOwner && !isAdmin) {
        throw new Error('Permission denied');
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([metadata.path]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
        // Continue with metadata deletion even if storage fails
      }

      // Delete metadata from database
      const { error: dbError } = await supabase
        .from('file_metadata')
        .delete()
        .eq('id', fileId);

      if (dbError) {
        throw new Error(`Failed to delete file metadata: ${dbError.message}`);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  /**
   * List files with filters
   */
  static async listFiles(options: {
    category?: string;
    tags?: string[];
    uploadedBy?: string;
    isPublic?: boolean;
    limit?: number;
    offset?: number;
    sortBy?: 'created_at' | 'filename' | 'size' | 'download_count';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{ files: FileMetadata[]; total: number }> {
    try {
      let query = supabase
        .from('file_metadata')
        .select('*', { count: 'exact' });

      // Apply filters
      if (options.category) {
        query = query.eq('category', options.category);
      }
      
      if (options.tags && options.tags.length > 0) {
        query = query.overlaps('tags', options.tags);
      }
      
      if (options.uploadedBy) {
        query = query.eq('uploaded_by', options.uploadedBy);
      }
      
      if (options.isPublic !== undefined) {
        query = query.eq('is_public', options.isPublic);
      }

      // Apply sorting
      const sortBy = options.sortBy || 'created_at';
      const sortOrder = options.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to list files: ${error.message}`);
      }

      const files: FileMetadata[] = (data || []).map(file => ({
        id: file.id,
        filename: file.filename,
        originalName: file.original_name,
        size: file.size,
        mimeType: file.mime_type,
        path: file.path,
        uploadedAt: new Date(file.created_at),
        uploadedBy: file.uploaded_by,
        category: file.category,
        tags: file.tags,
        description: file.description,
        isPublic: file.is_public,
        downloadCount: file.download_count
      }));

      return { files, total: count || 0 };
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  /**
   * Search files by name or description
   */
  static async searchFiles(
    searchTerm: string,
    options: {
      category?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ files: FileMetadata[]; total: number }> {
    try {
      let query = supabase
        .from('file_metadata')
        .select('*', { count: 'exact' })
        .or(`original_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);

      if (options.category) {
        query = query.eq('category', options.category);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to search files: ${error.message}`);
      }

      const files: FileMetadata[] = (data || []).map(file => ({
        id: file.id,
        filename: file.filename,
        originalName: file.original_name,
        size: file.size,
        mimeType: file.mime_type,
        path: file.path,
        uploadedAt: new Date(file.created_at),
        uploadedBy: file.uploaded_by,
        category: file.category,
        tags: file.tags,
        description: file.description,
        isPublic: file.is_public,
        downloadCount: file.download_count
      }));

      return { files, total: count || 0 };
    } catch (error) {
      console.error('Error searching files:', error);
      throw error;
    }
  }

  /**
   * Update file metadata
   */
  static async updateFileMetadata(
    fileId: string,
    updates: {
      description?: string;
      tags?: string[];
      category?: string;
      isPublic?: boolean;
    }
  ): Promise<FileMetadata> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Authentication required');
      }

      // Check permissions
      const metadata = await this.getFileMetadata(fileId);
      if (!metadata) {
        throw new Error('File not found');
      }

      const isOwner = metadata.uploadedBy === session.user.id;
      const isAdmin = await this.isUserAdmin(session.user.id);
      
      if (!isOwner && !isAdmin) {
        throw new Error('Permission denied');
      }

      const { data, error } = await supabase
        .from('file_metadata')
        .update({
          description: updates.description,
          tags: updates.tags,
          category: updates.category,
          is_public: updates.isPublic
        })
        .eq('id', fileId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update file metadata: ${error.message}`);
      }

      return {
        id: data.id,
        filename: data.filename,
        originalName: data.original_name,
        size: data.size,
        mimeType: data.mime_type,
        path: data.path,
        uploadedAt: new Date(data.created_at),
        uploadedBy: data.uploaded_by,
        category: data.category,
        tags: data.tags,
        description: data.description,
        isPublic: data.is_public,
        downloadCount: data.download_count
      };
    } catch (error) {
      console.error('Error updating file metadata:', error);
      throw error;
    }
  }

  /**
   * Get storage usage statistics
   */
  static async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    filesByCategory: Record<string, number>;
    filesByType: Record<string, number>;
  }> {
    try {
      const { data, error } = await supabase
        .from('file_metadata')
        .select('size, category, mime_type');

      if (error) {
        throw new Error(`Failed to get storage stats: ${error.message}`);
      }

      const stats = {
        totalFiles: data.length,
        totalSize: data.reduce((sum, file) => sum + file.size, 0),
        filesByCategory: {} as Record<string, number>,
        filesByType: {} as Record<string, number>
      };

      data.forEach(file => {
        // Count by category
        const category = file.category || 'uncategorized';
        stats.filesByCategory[category] = (stats.filesByCategory[category] || 0) + 1;

        // Count by MIME type
        stats.filesByType[file.mime_type] = (stats.filesByType[file.mime_type] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting storage stats:', error);
      throw error;
    }
  }

  // Private helper methods
  private static validateFile(file: File): void {
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum allowed size of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed`);
    }
  }

  private static async isUserAdmin(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        roles!inner (name)
      `)
      .eq('user_id', userId)
      .eq('roles.name', 'admin')
      .limit(1);

    return !error && data && data.length > 0;
  }

  private static async checkFileAccess(fileId: string, userId?: string): Promise<boolean> {
    if (!userId) return false;

    // File owners and admins always have access
    const metadata = await this.getFileMetadata(fileId);
    if (!metadata) return false;

    if (metadata.uploadedBy === userId) return true;
    return await this.isUserAdmin(userId);
  }

  private static async incrementDownloadCount(fileId: string): Promise<void> {
    try {
      await supabase
        .from('file_metadata')
        .update({ download_count: supabase.raw('download_count + 1') })
        .eq('id', fileId);
    } catch (error) {
      console.error('Error incrementing download count:', error);
      // Don't throw error as this is not critical
    }
  }
}

export default FileManagementService; 