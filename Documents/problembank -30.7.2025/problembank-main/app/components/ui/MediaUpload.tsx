'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Plus, X, Star, Trophy, MessageCircle, AlertCircle, CheckCircle } from 'lucide-react'
import { useTheme } from '@/lib/theme'

interface MediaFile {
  id: string
  file: File
  preview: string
  type: 'image' | 'video' | 'document'
  uploading?: boolean
  uploaded?: boolean
  error?: string
}

interface MediaUploadProps {
  onFilesChange: (files: MediaFile[]) => void
  maxFiles?: number
  maxSizePerFile?: number // in MB
  acceptedTypes?: string[]
  className?: string
}

const MediaUpload: React.FC<MediaUploadProps> = ({
  onFilesChange,
  maxFiles = 5,
  maxSizePerFile = 10,
  acceptedTypes = ['image/*', 'video/*', '.pdf', '.doc', '.docx', '.txt'],
  className = ''
}) => {
  const { isDarkMode } = useTheme()
  const [files, setFiles] = useState<MediaFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getFileType = (file: File): 'image' | 'video' | 'document' => {
    if (file.type.startsWith('image/')) return 'image'
    if (file.type.startsWith('video/')) return 'video'
    return 'document'
  }

  const getFileIcon = (type: 'image' | 'video' | 'document') => {
    switch (type) {
      case 'image': return Star
      case 'video': return Trophy
      default: return MessageCircle
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSizePerFile * 1024 * 1024) {
      return `File size must be less than ${maxSizePerFile}MB`
    }

    // Check file type
    const isValidType = acceptedTypes.some(type => {
      if (type.includes('*')) {
        return file.type.startsWith(type.replace('*', ''))
      }
      return file.name.toLowerCase().endsWith(type.toLowerCase())
    })

    if (!isValidType) {
      return 'File type not supported'
    }

    return null
  }

  const createFilePreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(file)
      } else {
        resolve('') // No preview for non-images
      }
    })
  }

  const processFiles = useCallback(async (fileList: FileList) => {
    const newFiles: MediaFile[] = []
    
    for (let i = 0; i < Math.min(fileList.length, maxFiles - files.length); i++) {
      const file = fileList[i]
      const error = validateFile(file)
      
      if (error) {
        console.error(`File ${file.name}: ${error}`)
        continue
      }

      const preview = await createFilePreview(file)
      const mediaFile: MediaFile = {
        id: `${Date.now()}-${i}`,
        file,
        preview,
        type: getFileType(file),
        uploading: false,
        uploaded: false
      }

      newFiles.push(mediaFile)
    }

    const updatedFiles = [...files, ...newFiles]
    setFiles(updatedFiles)
    onFilesChange(updatedFiles)
  }, [files, maxFiles, onFilesChange])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }, [processFiles])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files)
    }
  }

  const removeFile = (fileId: string) => {
    const updatedFiles = files.filter(f => f.id !== fileId)
    setFiles(updatedFiles)
    onFilesChange(updatedFiles)
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* File Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-3 md:p-4 transition-all duration-200 cursor-pointer ${
          dragActive
            ? isDarkMode
              ? 'border-indigo-400 bg-indigo-900/20'
              : 'border-indigo-400 bg-indigo-50'
            : isDarkMode
              ? 'border-gray-600 hover:border-gray-500'
              : 'border-gray-300 hover:border-gray-400'
        } ${
          isDarkMode ? 'bg-gray-800/30' : 'bg-gray-50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="text-center">
          <Plus className={`w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-400'
          }`} />
          
          <h3 className={`text-sm md:text-base font-medium mb-1 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Upload Media Files
          </h3>
          
          <p className={`text-xs md:text-sm mb-2 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Drag files here or click to browse
          </p>

          <div className={`text-xs ${
            isDarkMode ? 'text-gray-500' : 'text-gray-500'
          }`}>
            Max {maxFiles} files, {maxSizePerFile}MB each
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className={`text-xs font-medium ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Files ({files.length}/{maxFiles})
          </h4>
          
          <div className="space-y-2">
            {files.map((mediaFile) => {
              const IconComponent = getFileIcon(mediaFile.type)
              
              return (
                <div
                  key={mediaFile.id}
                  className={`relative group rounded-lg border p-2 transition-all duration-200 ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => removeFile(mediaFile.id)}
                    className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 ${
                      isDarkMode
                        ? 'bg-red-600 hover:bg-red-500 text-white'
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    } opacity-0 group-hover:opacity-100 z-10`}
                  >
                    <X className="w-3 h-3" />
                  </button>

                  <div className="flex items-center space-x-2">
                    {/* Preview or Icon */}
                    <div className="flex-shrink-0">
                      {mediaFile.preview && mediaFile.type === 'image' ? (
                        <img
                          src={mediaFile.preview}
                          alt={mediaFile.file.name}
                          className="w-8 h-8 object-cover rounded"
                        />
                      ) : (
                        <div className={`w-8 h-8 rounded flex items-center justify-center ${
                          isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                        }`}>
                          <IconComponent className={`w-4 h-4 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`} />
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {mediaFile.file.name}
                      </p>
                      <p className={`text-xs ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {formatFileSize(mediaFile.file.size)}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="flex-shrink-0">
                      {mediaFile.uploading && (
                        <div className="flex items-center space-x-1 text-xs text-blue-500">
                          <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                      {mediaFile.uploaded && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      {mediaFile.error && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default MediaUpload 