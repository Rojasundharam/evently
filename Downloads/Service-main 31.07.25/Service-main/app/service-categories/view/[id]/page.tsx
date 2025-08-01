'use client'

import { useEffect, useState } from 'react'
import { getServiceCategoryById } from '@/lib/services'
import { ServiceCategory } from '@/lib/types'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Edit, Code, FileText, Calendar, Trash } from 'lucide-react'

export default function ViewCategoryPage() {
  const params = useParams()
  const id = params.id as string
  const [category, setCategory] = useState<ServiceCategory | null>(null)
  const [loading, setLoading] = useState(true)

  // Load the category on mount
  useEffect(() => {
    async function loadCategory() {
      try {
        setLoading(true)
        const data = await getServiceCategoryById(id)
        setCategory(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadCategory()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFFFF]">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-green-800 border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-xl text-gray-600">Loading...</div>
        </div>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="min-h-screen p-8 bg-[#FFFFFF]">
        <div className="bg-red-100 text-red-700 px-4 py-3 rounded mb-4">
          Category not found
        </div>
        <Link href="/service-categories" className="text-gray-700 hover:underline flex items-center">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Categories
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] w-full pb-6">
      {/* Top navigation */}
      <div className="flex justify-end p-4 mb-6">
        <div className="flex gap-3">
          <Link 
            href="/service-categories" 
            className="px-4 py-2 bg-white border border-gray-200 rounded-md flex items-center text-sm text-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to list
          </Link>
          <Link
            href={`/service-categories/edit/${category.id}`}
            className="px-4 py-2 bg-green-800 text-white rounded-md flex items-center text-sm"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Category
          </Link>
          {/* Optional Delete Button */}
          <button
            onClick={() => {
              // Add delete confirmation logic here
              if (confirm('Are you sure you want to delete this category?')) {
                // Add delete handler here
                // deleteCategory(category.id).then(() => router.push('/service-categories'))
              }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-md flex items-center text-sm"
          >
            <Trash className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      <div className="w-full px-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">{category.name}</h1>
        
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-8">
          {/* Category Code Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start">
              <div className="text-gray-400 mr-3">
                <Code className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-700 mb-2">Category Code</h2>
                <div className="flex items-center">
                  <span className="px-3 py-1 bg-gray-100 rounded text-sm font-mono text-gray-800">{category.code}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Unique identifier for this category</p>
              </div>
            </div>
          </div>
          
          {/* Description Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start">
              <div className="text-gray-400 mr-3">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-700 mb-2">Description</h2>
                <p className="text-gray-800">{category.description || "No description provided"}</p>
              </div>
            </div>
          </div>
          
          {/* Timestamps Section */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start">
                <div className="text-gray-400 mr-3">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Created At</h3>
                  <p className="text-gray-800">
                    {new Date(category.created_at).toLocaleDateString()} {new Date(category.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="text-gray-400 mr-3">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Last Updated</h3>
                  <p className="text-gray-800">
                    {new Date(category.updated_at).toLocaleDateString()} {new Date(category.updated_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Additional section for services using this category - if you want to add that later */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Services Using This Category</h2>
            <p className="text-gray-600">No services are currently using this category.</p>
            {/* You could add a list of services here if you implement that functionality */}
          </div>
        </div>
      </div>
    </div>
  )
}