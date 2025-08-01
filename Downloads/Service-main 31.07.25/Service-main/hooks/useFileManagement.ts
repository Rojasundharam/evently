import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { FileManagementService, type FileUploadResult, type FileMetadata } from '@/lib/file-management';

export function useFileManagement() {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const { toast } = useToast();

  // Upload single file
  const uploadFile = useCallback(async (
    file: File,
    options: {
      category?: string;
      description?: string;
      tags?: string[];
      isPublic?: boolean;
      folder?: string;
    } = {}
  ): Promise<FileUploadResult | null> => {
    try {
      setUploading(true);
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

      const result = await FileManagementService.uploadFile(file, options);

      setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
      
      toast({
        title: "Success",
        description: `${file.name} uploaded successfully.`,
      });

      return result;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Failed to upload file.',
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[file.name];
        return newProgress;
      });
    }
  }, [toast]);

  // Upload multiple files
  const uploadMultipleFiles = useCallback(async (
    files: File[],
    options: {
      category?: string;
      description?: string;
      tags?: string[];
      isPublic?: boolean;
      folder?: string;
    } = {}
  ): Promise<{ successful: FileUploadResult[]; failed: { file: File; error: string }[] }> => {
    try {
      setUploading(true);
      
      // Initialize progress for all files
      const initialProgress: Record<string, number> = {};
      files.forEach(file => {
        initialProgress[file.name] = 0;
      });
      setUploadProgress(initialProgress);

      const result = await FileManagementService.uploadMultipleFiles(files, options);

      // Update progress to 100% for successful uploads
      result.successful.forEach(file => {
        setUploadProgress(prev => ({ ...prev, [file.originalName]: 100 }));
      });

      toast({
        title: "Upload Complete",
        description: `${result.successful.length} files uploaded successfully. ${result.failed.length} failed.`,
        variant: result.failed.length > 0 ? "destructive" : "default",
      });

      // Show individual error messages for failed uploads
      result.failed.forEach(({ file, error }) => {
        toast({
          title: `Failed: ${file.name}`,
          description: error,
          variant: "destructive",
        });
      });

      return result;
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Failed to upload files.',
        variant: "destructive",
      });
      return { successful: [], failed: [] };
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  }, [toast]);

  // Get file metadata
  const getFileMetadata = useCallback(async (fileId: string): Promise<FileMetadata | null> => {
    try {
      return await FileManagementService.getFileMetadata(fileId);
    } catch (error) {
      console.error('Error getting file metadata:', error);
      toast({
        title: "Error",
        description: "Failed to get file information.",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  // Download file
  const downloadFile = useCallback(async (fileId: string, filename?: string): Promise<void> => {
    try {
      const url = await FileManagementService.getFileDownloadUrl(fileId);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download Started",
        description: "File download has started.",
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : 'Failed to download file.',
        variant: "destructive",
      });
    }
  }, [toast]);

  // Delete file
  const deleteFile = useCallback(async (fileId: string): Promise<boolean> => {
    try {
      await FileManagementService.deleteFile(fileId);
      
      // Remove from local state
      setFiles(prev => prev.filter(file => file.id !== fileId));
      
      toast({
        title: "Success",
        description: "File deleted successfully.",
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : 'Failed to delete file.',
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  // List files
  const listFiles = useCallback(async (options: {
    category?: string;
    tags?: string[];
    uploadedBy?: string;
    isPublic?: boolean;
    limit?: number;
    offset?: number;
    sortBy?: 'created_at' | 'filename' | 'size' | 'download_count';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{ files: FileMetadata[]; total: number }> => {
    try {
      setLoading(true);
      const result = await FileManagementService.listFiles(options);
      setFiles(result.files);
      return result;
    } catch (error) {
      console.error('Error listing files:', error);
      toast({
        title: "Error",
        description: "Failed to load files.",
        variant: "destructive",
      });
      return { files: [], total: 0 };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Search files
  const searchFiles = useCallback(async (
    searchTerm: string,
    options: {
      category?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ files: FileMetadata[]; total: number }> => {
    try {
      setLoading(true);
      const result = await FileManagementService.searchFiles(searchTerm, options);
      setFiles(result.files);
      return result;
    } catch (error) {
      console.error('Error searching files:', error);
      toast({
        title: "Search Failed",
        description: "Failed to search files.",
        variant: "destructive",
      });
      return { files: [], total: 0 };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Update file metadata
  const updateFileMetadata = useCallback(async (
    fileId: string,
    updates: {
      description?: string;
      tags?: string[];
      category?: string;
      isPublic?: boolean;
    }
  ): Promise<FileMetadata | null> => {
    try {
      const updatedFile = await FileManagementService.updateFileMetadata(fileId, updates);
      
      // Update local state
      setFiles(prev => prev.map(file => 
        file.id === fileId ? updatedFile : file
      ));
      
      toast({
        title: "Success",
        description: "File information updated successfully.",
      });
      
      return updatedFile;
    } catch (error) {
      console.error('Error updating file metadata:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : 'Failed to update file information.',
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  // Get storage statistics
  const getStorageStats = useCallback(async () => {
    try {
      return await FileManagementService.getStorageStats();
    } catch (error) {
      console.error('Error getting storage stats:', error);
      toast({
        title: "Error",
        description: "Failed to load storage statistics.",
        variant: "destructive",
      });
      return {
        totalFiles: 0,
        totalSize: 0,
        filesByCategory: {},
        filesByType: {}
      };
    }
  }, [toast]);

  // Helper function to format file size
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Helper function to get file type icon
  const getFileTypeIcon = useCallback((mimeType: string): string => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('text')) return '📄';
    return '📎';
  }, []);

  return {
    files,
    uploading,
    loading,
    uploadProgress,
    uploadFile,
    uploadMultipleFiles,
    getFileMetadata,
    downloadFile,
    deleteFile,
    listFiles,
    searchFiles,
    updateFileMetadata,
    getStorageStats,
    formatFileSize,
    getFileTypeIcon
  };
}

export default useFileManagement; 