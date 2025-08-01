'use client'

import { useEffect, useState } from 'react'
import { getServiceCategories, deleteServiceCategory } from '@/lib/services'
import { ServiceCategory } from '@/lib/types'
import Link from 'next/link'
import { PlusCircle, Eye, Edit, Trash2, XCircle, Loader } from 'lucide-react'

export default function ServiceCategoriesPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Load categories on mount
  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    try {
      setLoading(true)
      const data = await getServiceCategories()
      setCategories(data)
    } catch (err) {
      setError('Failed to load service categories')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return
    }

    setDeleting(id)
    try {
      await deleteServiceCategory(id)
      setCategories(categories.filter(cat => cat.id !== id))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete category'
      setError(message)
      console.error(err)
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFFFF]">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-green-800 border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-xl text-gray-600">Loading categories...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8 bg-[#FFFFFF]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Service Categories</h1>
        <Link 
          href="/service-categories/new" 
          className="px-4 py-2 bg-green-800 text-white rounded-md flex items-center gap-2 hover:bg-green-700 transition-colors"
        >
          <PlusCircle className="h-5 w-5" /> New Category
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button 
            onClick={() => setError(null)}
            className="ml-4 text-red-700 hover:text-red-900 p-1 rounded-full hover:bg-red-100 transition-colors"
            aria-label="Dismiss"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      )}

      {categories.length === 0 ? (
        <div className="bg-white border border-gray-200 p-8 text-center rounded-lg shadow-sm">
          <p className="text-gray-600 mb-4">No service categories found.</p>
          <Link 
            href="/service-categories/new" 
            className="px-4 py-2 bg-green-800 text-white rounded-md inline-flex items-center gap-2 hover:bg-green-700 transition-colors"
          >
            <PlusCircle className="h-5 w-5" /> Create your first category
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categories.map((category, index) => (
                <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm text-gray-500">{index + 1}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-mono rounded">{category.code}</span>
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-800">{category.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {category.description ? (
                      category.description.length > 100 ? 
                        `${category.description.substring(0, 100)}...` : 
                        category.description
                    ) : (
                      <span className="text-gray-400 italic">No description</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex gap-3">
                      <Link 
                        href={`/service-categories/view/${category.id}`} 
                        className="text-yellow-400 hover:text-yellow-400 flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                      <Link 
                        href={`/service-categories/edit/${category.id}`} 
                        className="text-green-800 hover:text-green-900 flex items-center"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Link>
                      <button 
                        onClick={() => handleDelete(category.id)} 
                        className="text-red-600 hover:text-red-800 flex items-center"
                        disabled={deleting === category.id}
                      >
                        {deleting === category.id ? (
                          <>
                            <Loader className="h-4 w-4 mr-1 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}