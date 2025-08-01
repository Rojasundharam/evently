'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createServiceCategory, getNextCategoryCode } from '@/lib/services'
import Link from 'next/link'
import { ArrowLeft, Code, User, FileText } from 'lucide-react'

export default function NewCategoryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [code, setCode] = useState('')

  useEffect(() => {
    getNextCategoryCode().then(setCode).catch(() => setCode('SNO1'))
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const categoryData = {
      code: (formData.get('code') as string).trim().toUpperCase(),
      name: (formData.get('name') as string).trim(),
      description: (formData.get('description') as string || '').trim() || null
    }

    try {
      const { success, data } = await createServiceCategory(categoryData)
      if (!success || !data) {
        throw new Error('Failed to create category')
      }
      router.push('/service-categories')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create category'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white w-full pb-8">
      {/* Top navigation */}
      <div className="flex justify-between items-center p-5 mb-6 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50">
        <h1 className="text-xl font-bold text-gray-800 tracking-tight">Create Category</h1>
        <Link 
          href="/service-categories" 
          className="px-4 py-2 bg-white border border-gray-200 rounded-md flex items-center text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to list
        </Link>
      </div>

      {error && (
        <div className="w-full max-w-3xl mx-auto px-6 mb-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto px-6">
        <div className="bg-white shadow-md rounded-lg border border-gray-100 overflow-hidden">
          <div className="p-6 space-y-6">
            {/* Code */}
            <div className="mb-6">
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                Category Code <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-gray-500 mb-2">Unique identifier for this category</p>
              <div className="flex items-center mb-2">
                <div className="text-gray-400 mr-2">
                  <Code className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  id="code"
                  name="code"
                  required
                  value={code}
                  readOnly
                  pattern="[A-Za-z0-9_]+"
                  title="Only use letters, numbers, and underscores"
                  className="form-input bg-gray-100 text-gray-500 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-gray-500">Use only uppercase letters, numbers, and underscores.</p>
            </div>

            {/* Name */}
            <div className="mb-8">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-gray-500 mb-2">Display name visible to users</p>
              <div className="flex items-center">
                <div className="text-gray-400 mr-2">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  placeholder="Enter category name"
                  className="form-input"
                />
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <p className="text-sm text-gray-500 mb-2">Additional details about this category</p>
              <div className="flex items-start">
                <div className="text-gray-400 mr-2 mt-2">
                  <FileText className="h-5 w-5" />
                </div>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  placeholder="Enter category description"
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Form actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </span>
              ) : 'Create Category'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}