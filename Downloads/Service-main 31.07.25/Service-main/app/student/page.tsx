'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getServiceCategories, getServices } from '@/lib/services'
import { createServiceRequest } from '@/lib/service-requests'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface ServiceCategory {
  id: string
  name: string
  code: string
  description: string | null
}

interface Service {
  id: string
  category_id: string | null
  name: string
  description: string | null
  payment_method: 'prepaid' | 'postpaid' | 'free'
  amount: number | null
  currency: string | null
}

interface ServiceRequest {
  id: string
  service_name: string
  category_name: string
  status: string
  level: number
  max_approval_level: number
  created_at: string
  updated_at: string
}

export default function RequestServicePage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  
  // Form state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [selectedServiceId, setSelectedServiceId] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [file, setFile] = useState<File | null>(null)
  
  // Data state
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [filteredServices, setFilteredServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  
  // UI state
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<'request' | 'my-requests'>('request')
  const [myRequests, setMyRequests] = useState<ServiceRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<ServiceRequest[]>([])
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'approved' | 'completed'>('all')
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  
  // Fetch categories and services on mount
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        
        // Fetch categories and services in parallel
        const [categoriesData, servicesData] = await Promise.all([
          getServiceCategories(),
          getServices()
        ])
        
        console.log('Fetched services:', servicesData)
        console.log('First service structure:', servicesData[0])
        
        setCategories(categoriesData)
        setServices(servicesData)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load services. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [])
  
  // Filter services when category changes
  useEffect(() => {
    if (selectedCategoryId) {
      const filtered = services.filter(service => service.category_id === selectedCategoryId)
      setFilteredServices(filtered)
    } else {
      setFilteredServices([])
    }
    
    // Reset service selection when category changes
    setSelectedServiceId('')
    setSelectedService(null)
  }, [selectedCategoryId, services])
  
  // Update selected service when service ID changes
  useEffect(() => {
    if (selectedServiceId) {
      const service = services.find(service => service.id === selectedServiceId)
      setSelectedService(service || null)
    } else {
      setSelectedService(null)
    }
  }, [selectedServiceId, services])
  
  // Fetch user's requests when "My Requests" tab is active
  useEffect(() => {
    console.log('🔄 EFFECT TRIGGERED - activeTab:', activeTab, 'user:', !!user)
    if (activeTab === 'my-requests' && user) {
      console.log('🎯 CALLING UPDATED fetchMyRequests function')
      fetchMyRequestsV2024()
    }
  }, [activeTab, user])
  
  // Filter requests based on selected filter
  useEffect(() => {
    if (selectedFilter === 'all') {
      setFilteredRequests(myRequests)
    } else {
      const filtered = myRequests.filter(request => {
        if (selectedFilter === 'pending') {
          return request.status === 'pending'
        } else if (selectedFilter === 'approved') {
          return request.status === 'approved'
        } else if (selectedFilter === 'completed') {
          return request.status === 'completed'
        }
        return true
      })
      setFilteredRequests(filtered)
    }
  }, [selectedFilter, myRequests])
  
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategoryId(e.target.value)
  }
  
  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    console.log('Service selected:', value, 'Type:', typeof value)
    setSelectedServiceId(value)
  }
  
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value)
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedServiceId) {
      setError('Please select a service')
      return
    }
    
    if (!user) {
      setError('You must be logged in to submit a request')
      return
    }
    
    // Debug logging
    console.log('Submitting service request with:', {
      selectedServiceId,
      selectedServiceIdType: typeof selectedServiceId,
      userId: user.id,
      userIdType: typeof user.id
    })
    
    setIsSubmitting(true)
    setError(null)
      
    try {
      const result = await createServiceRequest(selectedServiceId, user.id)
      
      if (result) {
        setSuccess(true)
        // Reset form
        setSelectedCategoryId('')
        setSelectedServiceId('')
        setNotes('')
        setFile(null)
        // Reset file input
        const fileInput = document.getElementById('file') as HTMLInputElement
        if (fileInput) {
          fileInput.value = ''
        }
      
        // Refresh the requests list
        fetchMyRequestsV2024()
      
        // Hide success message after 5 seconds
        setTimeout(() => {
          setSuccess(false)
        }, 5000)
      } else {
        setError('Failed to submit request')
      }
    } catch (err) {
      console.error('Error submitting request:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePaymentSubmit = async () => {
    if (!selectedServiceId || !selectedService) {
      setError('Please select a service')
      return
    }

    if (!user) {
      setError('You must be logged in to make a payment')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Use dynamic pricing from service data
      const serviceAmount = selectedService.amount || 100; // Fallback to 100 if no amount set
      
      // Create payment session with service details
      const paymentData = {
        amount: serviceAmount,
        customerName: user.user_metadata?.full_name || user.email || 'Student',
        customerEmail: user.email || '',
        customerPhone: user.user_metadata?.phone || '+91 9876543210', // Default phone or get from user
        description: `Payment for ${selectedService.name} service request`
      }

      console.log('Creating HDFC payment session:', {
        service: selectedService.name,
        amount: serviceAmount,
        currency: selectedService.currency || 'INR'
      })

      const response = await fetch('/api/payment/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment session')
      }

      if (data.success && (data.redirect_url || data.session?.payment_links?.web || data.session?.redirect_url)) {
        console.log('HDFC payment session created, redirecting to gateway...')
        
        // Store service request data in localStorage to create request after payment
        localStorage.setItem('pendingServiceRequest', JSON.stringify({
          selectedServiceId,
          selectedCategoryId,
          notes,
          orderId: data.order_id,
          amount: serviceAmount
        }))
        
        // Get the redirect URL from HDFC response
        const redirectUrl = data.redirect_url || 
                           data.session?.redirect_url || 
                           data.session?.payment_links?.web;
        
        if (redirectUrl) {
          // Redirect to HDFC payment gateway
          window.location.href = redirectUrl;
        } else {
          throw new Error('No redirect URL received from HDFC');
        }
      } else {
        throw new Error('Invalid response from HDFC payment service')
      }

    } catch (err) {
      console.error('Payment initiation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to initiate payment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const fetchMyRequestsV2024 = async () => {
    if (!user) {
      console.log('No user found, skipping fetch')
      return
    }
    
    if (!supabase) {
      console.error('Supabase client not available')
      setMyRequests([])
      return
    }
    
    console.log('🚀 Fetching requests for user (UPDATED CODE - ' + new Date().toISOString() + '):', user.id)
    
    try {
      // Test connection and table existence
      console.log('Testing Supabase connection and table existence...')
      
      // Test service_requests table
      const { data: testRequestsData, error: testRequestsError } = await supabase
        .from('service_requests')
        .select('count')
        .limit(1)
      
      if (testRequestsError) {
        console.error('service_requests table test failed:', testRequestsError)
      } else {
        console.log('service_requests table exists and is accessible')
      }
      
      // Test services table
      const { data: testServicesData, error: testServicesError } = await supabase
        .from('services')
        .select('count')
        .limit(1)
      
      if (testServicesError) {
        console.error('services table test failed:', testServicesError)
        console.error('This indicates the services table is missing. Please run the CREATE_MISSING_TABLES.sql script.')
      } else {
        console.log('services table exists and is accessible')
      }


      // Simple approach - just get the service requests without joins
      console.log('🔍 Executing NEW simplified Supabase query (v2.0)...')
      const { data: requestsData, error: requestsError } = await supabase
        .from('service_requests')
        .select('*')
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false })

      if (requestsError) {
        console.error('Error fetching requests:', requestsError)
        console.error('Error details:', {
          message: requestsError.message,
          details: requestsError.details,
          hint: requestsError.hint,
          code: requestsError.code
        })
        
        // Check if the error is related to missing tables
        if (requestsError.message?.includes('Could not find a relationship') || 
            requestsError.message?.includes('services') ||
            requestsError.code === 'PGRST200') {
          console.error('Database schema issue detected. Missing tables may need to be created.')
          console.error('Please run the CREATE_MISSING_TABLES.sql script in your Supabase SQL editor.')
        }
        
        setMyRequests([])
        return
      }

      console.log('Fetched requests data:', requestsData)

      if (!requestsData || requestsData.length === 0) {
        console.log('No requests found for user')
        setMyRequests([])
        return
      }

      console.log('Found', requestsData.length, 'requests')

      // Create simple formatted requests without service/category names for now
      const formattedRequests: ServiceRequest[] = requestsData.map((request: any) => {
        const formatted = {
          id: request.id,
          service_name: request.service_id ? `Service ${request.service_id.slice(0, 8)}...` : 'Unknown Service',
          category_name: 'General',
          status: request.status || 'pending',
          level: request.level || 1,
          max_approval_level: request.max_approval_level || 1,
          created_at: request.created_at,
          updated_at: request.updated_at
        }
        
        console.log('Formatted request:', formatted)
        return formatted
      })

      console.log('Final formatted requests:', formattedRequests)
      setMyRequests(formattedRequests)
    } catch (err) {
      console.error('Error fetching requests:', err)
      console.error('Error type:', typeof err)
      console.error('Error stack:', err instanceof Error ? err.stack : 'No stack')
      setMyRequests([])
    }
  }


  
  const handleView = (request: ServiceRequest) => {
    setSelectedRequest(request)
    setIsViewModalOpen(true)
  }

  const handleDownload = async (request: ServiceRequest) => {
    setIsDownloading(true)
    try {
      // TODO: Implement download functionality
      console.log('Downloading request:', request.id)
      // Simulate download delay
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (err) {
      console.error('Error downloading:', err)
    } finally {
      setIsDownloading(false)
    }
  }

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])
  
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  if (!user) {
    return null
  }
  
  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Student Portal</h1>
      
        {/* Mobile-Optimized Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm p-2">
          <div className="flex space-x-2">
          <button
              className={`flex-1 py-3 px-4 text-sm sm:text-base font-medium rounded-md transition-colors ${
              activeTab === 'request'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('request')}
          >
              Request Service
          </button>
          <button
              className={`flex-1 py-3 px-4 text-sm sm:text-base font-medium rounded-md transition-colors ${
              activeTab === 'my-requests'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('my-requests')}
          >
            My Requests
          </button>
          </div>
        </div>
      </div>
      
      {activeTab === 'request' ? (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white shadow-sm rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Request a Service</h2>
            
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
                Your service request has been submitted successfully!
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Service Category */}
              <div className="space-y-2">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Service Category *
                </label>
                <select
                  id="category"
                  value={selectedCategoryId}
                  onChange={handleCategoryChange}
                  className="w-full rounded-md border border-gray-300 py-3 px-4 shadow-sm focus:border-primary focus:outline-none focus:ring-primary text-base"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Service Type */}
              <div className="space-y-2">
                <label htmlFor="service" className="block text-sm font-medium text-gray-700">
                  Service Type *
                </label>
                <select
                  id="service"
                  value={selectedServiceId}
                  onChange={handleServiceChange}
                  className="w-full rounded-md border border-gray-300 py-3 px-4 shadow-sm focus:border-primary focus:outline-none focus:ring-primary text-base"
                  required
                  disabled={!selectedCategoryId}
                >
                  <option value="">Select a service</option>
                  {filteredServices.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Service Description */}
              {selectedService && (
                <div className="rounded-md bg-gray-50 p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Service Description</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {selectedService.description || 'No description available.'}
                  </p>
                  
                  {/* Payment Information */}
                  {selectedService.payment_method !== 'free' && (
                    <div className="space-y-2">
                      <div className="inline-flex items-center rounded-md bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                        {selectedService.payment_method === 'prepaid' 
                          ? '💳 Payment Required Before Processing' 
                          : '💰 Payment Required After Approval'}
                      </div>
                      
                      {selectedService.payment_method === 'prepaid' && (
                        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                          <div className="flex items-center gap-2 mb-1">
                            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-yellow-800 font-medium text-sm">Payment Details</span>
                          </div>
                                                     <p className="text-yellow-700 text-xs">
                             Service Fee: {selectedService?.currency || 'INR'} {(selectedService?.amount || 100).toFixed(2)} 
                             {selectedService?.amount ? '' : ' (Default fee)'}
                           </p>
                           <p className="text-yellow-700 text-xs">
                             Secure payment through HDFC SmartGateway
                           </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Purpose / Notes */}
              <div className="space-y-2">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Purpose / Notes
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={handleNotesChange}
                  rows={4}
                  className="w-full rounded-md border border-gray-300 py-3 px-4 shadow-sm focus:border-primary focus:outline-none focus:ring-primary text-base"
                  placeholder="Please describe the purpose of your request..."
                />
              </div>
              
              {/* File Upload */}
              <div className="space-y-2">
                <label htmlFor="file" className="block text-sm font-medium text-gray-700">
                  Supporting Documents (Optional)
                </label>
                <input
                  type="file"
                  id="file"
                  onChange={handleFileChange}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90 file:cursor-pointer"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <p className="text-xs text-gray-500">
                  Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
                </p>
              </div>
              
              {/* Submit Button */}
              <div className="pt-4">
                {selectedService?.payment_method === 'prepaid' ? (
                  /* For prepaid services, show payment button */
                  <div className="space-y-3">
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <h4 className="font-medium text-blue-800">Payment Required</h4>
                      </div>
                      <p className="text-sm text-blue-700">
                        This service requires prepayment. You'll be redirected to our secure payment gateway.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handlePaymentSubmit}
                      disabled={isSubmitting || !selectedServiceId}
                      className="w-full sm:w-auto min-w-[200px] bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Proceed to Payment
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  /* For free and postpaid services, show regular submit button */
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedServiceId}
                    className="w-full sm:w-auto min-w-[200px] bg-primary text-white py-3 px-6 rounded-md font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            {/* Header with filters */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">My Service Requests</h2>
                
                {/* Mobile-friendly filter */}
                <div className="w-full sm:w-auto">
                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value as 'all' | 'pending' | 'approved' | 'completed')}
                    className="w-full sm:w-auto rounded-md border border-gray-300 py-2 px-3 text-sm focus:border-primary focus:outline-none focus:ring-primary"
                  >
                    <option value="all">All Requests</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Mobile-optimized table */}
            <div className="overflow-hidden">
              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.length === 0 ? (
                    <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                        No requests found
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((request) => (
                      <tr key={request.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{request.service_name}</div>
                          <div className="text-sm text-gray-500">{request.category_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(request.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {request.status === 'pending' ? (
                            <span className="inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">
                              Pending Approval (Level {request.level}/{request.max_approval_level})
                            </span>
                          ) : request.status === 'completed' ? (
                            <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                              Completed
                            </span>
                          ) : request.status === 'rejected' ? (
                            <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                              Rejected
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => handleView(request)}
                            className="text-primary hover:text-primary/80 mr-3"
                          >
                            View
                          </button>
                          {request.status === 'completed' && (
                            <button
                              onClick={() => handleDownload(request)}
                              disabled={isDownloading}
                              className="text-green-600 hover:text-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isDownloading ? 'Downloading...' : 'Download'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
              {/* Mobile Card View */}
              <div className="sm:hidden">
                {filteredRequests.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-500">
                    No requests found
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredRequests.map((request) => (
                      <div key={request.id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {request.service_name}
                            </h3>
                            <p className="text-sm text-gray-500 truncate">
                              {request.category_name}
                            </p>
                          </div>
                          <div className="ml-3 flex-shrink-0">
                            {request.status === 'pending' ? (
                              <span className="inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">
                                Pending ({request.level}/{request.max_approval_level})
                              </span>
                            ) : request.status === 'completed' ? (
                              <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                                Completed
                              </span>
                            ) : request.status === 'rejected' ? (
                              <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                                Rejected
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">
                            {new Date(request.created_at).toLocaleDateString()}
                          </span>
                          <div className="flex space-x-3">
                            <button 
                              onClick={() => handleView(request)}
                              className="text-sm font-medium text-primary hover:text-primary/80"
                            >
                              View
                            </button>
                            {request.status === 'completed' && (
                <button
                                onClick={() => handleDownload(request)}
                                disabled={isDownloading}
                                className="text-sm font-medium text-green-600 hover:text-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isDownloading ? 'Downloading...' : 'Download'}
                </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile-optimized Modal */}
      {isViewModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Request Details</h3>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 p-2 -m-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Service</label>
                  <p className="mt-1 text-sm">{selectedRequest.service_name}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <p className="mt-1 text-sm">{selectedRequest.category_name}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    {selectedRequest.status === 'pending' ? (
                      <span className="inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">
                        Pending Approval (Level {selectedRequest.level}/{selectedRequest.max_approval_level})
                      </span>
                    ) : selectedRequest.status === 'completed' ? (
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                        Completed
                      </span>
                    ) : selectedRequest.status === 'rejected' ? (
                      <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                        Rejected
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                        {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                      </span>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Submitted</label>
                  <p className="mt-1 text-sm">{new Date(selectedRequest.created_at).toLocaleString()}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="mt-1 text-sm">{new Date(selectedRequest.updated_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
