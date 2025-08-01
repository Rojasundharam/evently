'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getServiceById, updateService, getServiceCategories, ApplicableTo, ServiceStatus, Service, PaymentMethod } from '@/lib/services'
import { ServiceCategory } from '@/lib/types'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function EditServicePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [service, setService] = useState<Service | null>(null)
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load the service on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        
        // Load service and categories in parallel
        const [serviceData, categoriesData] = await Promise.all([
          getServiceById(id),
          getServiceCategories()
        ])
        
        setService(serviceData)
        setCategories(categoriesData)
      } catch (err) {
        setError('Failed to load service')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const updateData = {
      category_id: formData.get('category_id') as string,
      name: formData.get('name') as string,
      description: formData.get('description') as string || null,
      start_date: formData.get('start_date') as string || null,
      end_date: formData.get('end_date') as string || null,
      applicable_to: formData.get('applicable_to') as ApplicableTo,
      status: formData.get('status') as ServiceStatus,
      service_limit: parseInt(formData.get('service_limit') as string) || 1,
      sla_period: parseInt(formData.get('sla_period') as string) || null,
      payment_method: formData.get('payment_method') as PaymentMethod,
      amount: parseFloat(formData.get('amount') as string) || null,
      currency: formData.get('currency') as string || 'INR',
      attachment_url: formData.get('attachment_url') as string || null
    }

    try {
      await updateService(id, updateData)
      router.push('/services')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update service'
      setError(message)
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="min-h-screen p-8 bg-[#FFFFFF]">
        <div className="bg-red-100 text-red-700 px-4 py-3 rounded mb-4">
          Service not found or you don&apos;t have permission to edit it
        </div>
        <Link href="/services" className="text-primary hover:underline">
          Back to Services
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8 bg-[#FFFFFF] w-full min-w-full">
      <h1 className="text-2xl font-bold mb-6">Edit Service</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full min-w-full space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Request Number - Display only */}
          <div>
            <label htmlFor="request_no" className="block text-sm font-medium text-gray-700">
              Request Number
            </label>
            <input
              type="text"
              id="request_no"
              value={service.request_no}
              disabled
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">Request number cannot be changed</p>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">
              Category *
            </label>
            <select
              id="category_id"
              name="category_id"
              required
              defaultValue={service.category_id || ''}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              defaultValue={service.name}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={service.description || ''}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
            />
          </div>

          {/* Start Date */}
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              id="start_date"
              name="start_date"
              defaultValue={service.start_date || ''}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
            />
          </div>

          {/* End Date */}
          <div>
            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              type="date"
              id="end_date"
              name="end_date"
              defaultValue={service.end_date || ''}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
            />
          </div>

          {/* Applicable To */}
          <div>
            <label htmlFor="applicable_to" className="block text-sm font-medium text-gray-700">
              Applicable To *
            </label>
            <select
              id="applicable_to"
              name="applicable_to"
              required
              defaultValue={service.applicable_to}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
            >
              <option value="student">Student</option>
              <option value="staff">Staff</option>
              <option value="both">Both</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status *
            </label>
            <select
              id="status"
              name="status"
              required
              defaultValue={service.status}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Service Limit */}
          <div>
            <label htmlFor="service_limit" className="block text-sm font-medium text-gray-700">
              Service Limit
            </label>
            <input
              type="number"
              id="service_limit"
              name="service_limit"
              defaultValue={service.service_limit || 1}
              min={1}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
            />
          </div>

          {/* SLA Period */}
          <div>
            <label htmlFor="sla_period" className="block text-sm font-medium text-gray-700">
              SLA Period (days)
            </label>
            <input
              type="number"
              id="sla_period"
              name="sla_period"
              defaultValue={service.sla_period || ''}
              min={0}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700">
              Payment Method *
            </label>
            <select
              id="payment_method"
              name="payment_method"
              required
              defaultValue={service.payment_method}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
            >
              <option value="free">Free</option>
              <option value="prepaid">Prepaid</option>
              <option value="postpaid">Postpaid</option>
            </select>
          </div>

          {/* Service Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              Service Fee Amount
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">₹</span>
              </div>
              <input
                type="number"
                id="amount"
                name="amount"
                step="0.01"
                min="0"
                defaultValue={service.amount || ''}
                placeholder="0.00"
                className="block w-full pl-7 pr-12 border border-gray-300 rounded-md py-2 px-3 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Leave empty for free services.
            </p>
          </div>

          {/* Currency */}
          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
              Currency
            </label>
            <select
              id="currency"
              name="currency"
              defaultValue={service.currency || 'INR'}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
            >
              <option value="INR">INR (Indian Rupee)</option>
              <option value="USD">USD (US Dollar)</option>
              <option value="EUR">EUR (Euro)</option>
              <option value="GBP">GBP (British Pound)</option>
            </select>
          </div>

          {/* Attachment URL */}
          <div>
            <label htmlFor="attachment_url" className="block text-sm font-medium text-gray-700">
              Attachment URL
            </label>
            <input
              type="url"
              id="attachment_url"
              name="attachment_url"
              defaultValue={service.attachment_url || ''}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary border border-transparent rounded-md shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
} 