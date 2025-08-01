'use client'

import { useEffect, useState } from 'react'
import { getServices, deleteService, Service } from '@/lib/services'
import Link from 'next/link'

export default function ServiceListPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    async function fetchServices() {
      try {
        const data = await getServices()
        setServices(data as Service[])
      } catch {
        setError('Failed to fetch services')
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return
    }
    
    try {
      setDeleteLoading(true)
      await deleteService(id)
      // Refresh the services list
      const data = await getServices()
      setServices(data as Service[])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete service'
      alert(message)
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-background w-full">
      <h1 className="text-2xl font-bold mb-4">Service List</h1>

      <div className="flex justify-between items-center mb-6">
        <div></div>
        <Link
          href="/services/new"
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-4 py-2 rounded shadow"
        >
          ➕ New Service
        </Link>
      </div>

      {loading && <p>Loading services...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && services.length === 0 && <p>No services found.</p>}

      {!loading && services.length > 0 && (
        <div className="overflow-x-auto bg-white shadow rounded-lg w-full">
          <table className="min-w-full w-full text-sm text-left text-gray-800">
            <thead className="bg-gray-100 text-xs uppercase text-gray-600 border-b">
              <tr>
                <th className="px-6 py-3">#</th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3">Payment</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {services.map((service, idx) => (
                <tr
                  key={service.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-3 align-middle">{idx + 1}</td>
                  <td className="px-6 py-3 align-middle font-medium text-gray-900 whitespace-nowrap">
                    {service.name || 'Unnamed Service'}
                  </td>
                  <td className="px-6 py-3 align-middle text-gray-700 max-w-md truncate">
                    {service.description || 'No description available'}
                  </td>
                  <td className="px-6 py-3 align-middle">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      service.payment_method === 'free' ? 'bg-green-100 text-green-800' : 
                      service.payment_method === 'prepaid' ? 'bg-blue-100 text-blue-800' : 
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {service.payment_method?.charAt(0).toUpperCase() + service.payment_method?.slice(1) || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-3 align-middle">
                    {service.payment_method === 'free' ? (
                      <span className="text-green-600 font-medium">Free</span>
                    ) : (
                      <span className="text-gray-900 font-medium">
                        {service.currency || 'INR'} {(service.amount || 0).toFixed(2)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 align-middle">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      service.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {service.status || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-3 align-middle text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Link
                        href={`/services/${service.id}`}
                        className="text-primary hover:underline font-medium px-2"
                      >
                        View
                      </Link>
                      <Link
                        href={`/services/edit/${service.id}`}
                        className="text-amber-600 hover:underline font-medium px-2"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(service.id, service.name)}
                        disabled={deleteLoading}
                        className="text-red-600 hover:underline font-medium px-2 disabled:opacity-50"
                      >
                        Delete
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
