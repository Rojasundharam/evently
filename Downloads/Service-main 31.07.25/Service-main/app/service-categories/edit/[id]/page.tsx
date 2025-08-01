'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getServiceCategoryById, updateServiceCategory } from '@/lib/services'
import { ServiceCategory } from '@/lib/types'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function EditCategoryPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [category, setCategory] = useState<ServiceCategory | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load the category on mount
  useEffect(() => {
    async function loadCategory() {
      try {
        setLoading(true)
        const data = await getServiceCategoryById(id)
        setCategory(data)
      } catch (err) {
        setError('Failed to load category')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadCategory()
  }, [id])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const updateData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string || null
    }

    try {
      const result = await updateServiceCategory(id, updateData)
      if (result instanceof Error) {
        throw result
      }
      router.push('/service-categories')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update category'
      setError(message)
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="min-h-screen p-8 bg-white">
        <div className="bg-red-100 text-red-700 px-4 py-3 rounded mb-4">
          Category not found or you don&apos;t have permission to edit it
        </div>
        <Link href="/service-categories" className="text-primary hover:underline">
          Back to Categories
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white w-full pb-6">
      {/* Top navigation */}
      <div className="flex justify-end p-4 mb-6">
        <Link 
          href="/service-categories" 
          className="px-4 py-2 bg-white border border-gray-200 rounded-md flex items-center text-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to list
        </Link>
      </div>

      {error && (
        <div className="w-full px-8 mb-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full px-8">
        {/* Code - Display only */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category Code
          </label>
          <p className="text-sm text-gray-500 mb-2">Unique identifier for this category</p>
          <div className="flex items-center mb-2">
            <div className="text-gray-400 mr-2">&lt;&gt;</div>
            <input
              type="text"
              value={category.code}
              disabled
              className="block w-full rounded-md border border-gray-200 bg-white py-2 px-3 text-gray-500"
            />
          </div>
          <p className="text-xs text-gray-500">Code cannot be changed after creation</p>
        </div>

        {/* Name */}
        <div className="mb-8">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Name <span className="text-red-500">*</span>
          </label>
          <p className="text-sm text-gray-500 mb-2">Display name visible to users</p>
          <div className="flex items-center">
            <div className="text-gray-400 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <input
              type="text"
              id="name"
              name="name"
              required
              defaultValue={category.name}
              className="block w-full rounded-md border border-gray-200 py-2 px-3 bg-white"
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
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={category.description || ''}
              className="block w-full rounded-md border border-gray-200 py-2 px-3 bg-white"
            />
          </div>
        </div>

        {/* Divider line */}
        <div className="border-t border-gray-200 my-6"></div>

        {/* Created/Updated info */}
        <div className="flex justify-between text-sm text-gray-500 mb-6">
          <div>Created: {new Date(category.created_at).toLocaleDateString()}</div>
          <div>Last Updated: {new Date(category.updated_at).toLocaleDateString()}</div>
        </div>

        {/* Divider line */}
        <div className="border-t border-gray-200 my-6"></div>

        {/* Form actions */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 bg-white border border-gray-200 rounded-md text-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-green-800 text-white rounded-md"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}