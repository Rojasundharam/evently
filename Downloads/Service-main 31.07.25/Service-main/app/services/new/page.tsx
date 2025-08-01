'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  createService, 
  getServiceCategories, 
  Constants,
  type ServiceCategory,
  type ApplicableTo,
  type PaymentMethod,
  type ServiceStatus,
  getNextServiceRequestNo
} from '@/lib/services'
import AllowServiceToConfig, { ServiceProgramConfig } from '@/components/services/AllowServiceToConfig'
import { saveServiceProgramConfigs } from '@/lib/service-program-configs'
import StaffSelector from '@/components/services/StaffSelector'
import { StaffData } from '@/lib/myjkkn-api'

interface GroupAssignment {
  id: string;
  type: 'degree' | 'department';
  staff: StaffData[];
  targetType: 'all' | 'selective';
}

export default function NewServicePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [requestNo, setRequestNo] = useState('')
  const [serviceToType, setServiceToType] = useState<'all' | 'program_specific'>('all')
  const [programConfigs, setProgramConfigs] = useState<ServiceProgramConfig[]>([])
  const [groupAssignments, setGroupAssignments] = useState<GroupAssignment[]>([])
  const [showGroupDropdown, setShowGroupDropdown] = useState(false)
  
  // Staff assignment states
  const [slaEscalationStaff, setSlaEscalationStaff] = useState<StaffData | null>(null)
  const [assignedStaff, setAssignedStaff] = useState<StaffData[]>([])

  // Load categories and request number on mount
  useEffect(() => {
    getServiceCategories().then(setCategories).catch(console.error)
    getNextServiceRequestNo().then(setRequestNo).catch(() => setRequestNo('SNO1'))
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showGroupDropdown) {
        const target = event.target as HTMLElement;
        if (!target.closest('.group-dropdown')) {
          setShowGroupDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showGroupDropdown]);

  const handleServiceToConfigChange = (type: 'all' | 'program_specific', configs: ServiceProgramConfig[]) => {
    setServiceToType(type)
    setProgramConfigs(configs)
  }

  const addGroupAssignment = (type: 'degree' | 'department') => {
    const newGroup: GroupAssignment = {
      id: Date.now().toString(),
      type,
      staff: [],
      targetType: 'all'
    };
    setGroupAssignments([...groupAssignments, newGroup]);
    setShowGroupDropdown(false);
  };

  const removeGroupAssignment = (id: string) => {
    setGroupAssignments(groupAssignments.filter(group => group.id !== id));
  };

  const updateGroupAssignment = (id: string, field: keyof GroupAssignment, value: any) => {
    setGroupAssignments(groupAssignments.map(group => 
      group.id === id ? { ...group, [field]: value } : group
    ));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const data = {
        category_id: formData.get('category_id') as string,
        request_no: formData.get('request_no') as string,
        name: formData.get('name') as string,
        description: formData.get('description') as string || null,
        start_date: formData.get('start_date') as string || null,
        end_date: formData.get('end_date') as string || null,
        applicable_to: formData.get('applicable_to') as ApplicableTo,
        status: formData.get('status') as ServiceStatus,
        service_limit: parseInt(formData.get('service_limit') as string) || 1,
        attachment_url: formData.get('attachment_url') as string || null,
        sla_period: parseInt(formData.get('sla_period') as string) || null,
        payment_method: formData.get('payment_method') as PaymentMethod,
        // Only include amount and currency if migration has been run
        ...(formData.get('amount') && { amount: parseFloat(formData.get('amount') as string) || null }),
        ...(formData.get('currency') && { currency: formData.get('currency') as string || 'INR' }),
      }

      // Create the service first
      const serviceResult = await createService(data)
      
      if (serviceResult.success && serviceResult.data) {
        const serviceId = serviceResult.data.id

        // Save program configurations if service is program-specific
        if (serviceToType === 'program_specific' && programConfigs.length > 0) {
          try {
            await saveServiceProgramConfigs(serviceId, serviceToType, programConfigs)
          } catch (programConfigError) {
            console.error('Error saving program configurations:', programConfigError)
            // We don't fail the whole process if program configs fail
          }
        }
      }
      
      router.push('/services')
      router.refresh()
    } catch (error) {
      console.error('Error creating service:', error)
      
      let errorMessage = 'Failed to create service'
      
      if (error instanceof Error) {
        if (error.message.includes('column "amount" of relation "services" does not exist')) {
          errorMessage = 'Database migration required: Please run the ADD_SERVICE_PRICING.sql script in Supabase SQL Editor to add pricing fields to the services table.'
        } else if (error.message.includes('column "currency" of relation "services" does not exist')) {
          errorMessage = 'Database migration required: Please run the ADD_SERVICE_PRICING.sql script in Supabase SQL Editor to add pricing fields to the services table.'
        } else if (error.message.includes('Authentication required')) {
          errorMessage = 'Please log in to create services.'
        } else if (error.message.includes('already exists')) {
          errorMessage = 'A service with this request number already exists. Please try again.'
        } else {
          errorMessage = error.message
        }
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-background w-full min-w-full">
      <h1 className="text-2xl font-bold mb-6">Create New Service</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full min-w-full space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Category */}
          <div>
            <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">
              Category *
            </label>
            <select
              id="category_id"
              name="category_id"
              required
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

          {/* Request Number */}
          <div>
            <label htmlFor="request_no" className="block text-sm font-medium text-gray-700">
              Request Number *
            </label>
            <input
              type="text"
              id="request_no"
              name="request_no"
              required
              value={requestNo}
              readOnly
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary focus:outline-none focus:ring-primary bg-gray-100"
            />
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
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
            >
              <option value="">Select applicable to</option>
              {Constants.public.Enums.applicable_to.map((value) => (
                <option key={value} value={value}>
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </option>
              ))}
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
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
            >
              <option value="">Select status</option>
              {Constants.public.Enums.service_status.map((value) => (
                <option key={value} value={value}>
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </option>
              ))}
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
              defaultValue={1}
              min={1}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
            />
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
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
            >
              <option value="">Select payment method</option>
              {Constants.public.Enums.payment_method.map((value) => (
                <option key={value} value={value}>
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </option>
              ))}
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
                placeholder="0.00"
                className="block w-full pl-7 pr-12 border border-gray-300 rounded-md py-2 px-3 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Leave empty for free services. Amount will be auto-set based on payment method if not specified.
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
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
            >
              <option value="INR">INR (Indian Rupee)</option>
              <option value="USD">USD (US Dollar)</option>
              <option value="EUR">EUR (Euro)</option>
              <option value="GBP">GBP (British Pound)</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Default currency is INR. Change only if needed for international services.
            </p>
          </div>
        </div>

        {/* Allow Service To Configuration */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <AllowServiceToConfig
            initialValue={serviceToType}
            initialProgramConfigs={programConfigs}
            onChange={handleServiceToConfigChange}
          />
        </div>

        {/* General Information section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-6">General Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Service Level Agreement */}
            <div>
              <label htmlFor="service_level_agreement" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                Service level agreement
                <div className="ml-2 relative group">
                  <div className="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center text-xs text-gray-500 cursor-help">
                    ?
                  </div>
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    Service level agreement in days
                  </div>
                </div>
              </label>
              <input
                type="number"
                id="service_level_agreement"
                name="service_level_agreement"
                placeholder="No. of days"
                min="0"
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
              />
            </div>

            {/* Approval of higher authority */}
            <div className="flex items-center justify-between">
              <label className="flex items-center text-sm font-medium text-gray-700">
                Approval of higher authority
                <div className="ml-2 relative group">
                  <div className="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center text-xs text-gray-500 cursor-help">
                    ?
                  </div>
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    Requires approval from higher authority
                  </div>
                </div>
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="approval_higher_authority"
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {/* Service closure email */}
            <div className="flex items-center justify-between">
              <label className="flex items-center text-sm font-medium text-gray-700">
                Service closure email
                <div className="ml-2 relative group">
                  <div className="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center text-xs text-gray-500 cursor-help">
                    ?
                  </div>
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    Send email when service is closed
                  </div>
                </div>
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="service_closure_email"
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {/* SLA escalation */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Sla escalation
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="sla_escalation"
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {/* SLA escalation staff - Full width */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sla escalation staff <span className="text-red-500">*</span>
              </label>
              <StaffSelector
                value={slaEscalationStaff}
                onChange={(staff) => setSlaEscalationStaff(staff as StaffData | null)}
                placeholder="Search and select SLA escalation staff..."
                multiple={false}
                required={true}
                showDetails={true}
              />
            </div>

            {/* Show to student */}
            <div className="flex items-center justify-between">
              <label className="flex items-center text-sm font-medium text-gray-700">
                Show to student
                <div className="ml-2 relative group">
                  <div className="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center text-xs text-gray-500 cursor-help">
                    ?
                  </div>
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    Display this service to students
                  </div>
                </div>
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="show_to_student"
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {/* Eligibility to raise this category of requests */}
            <div className="flex items-center justify-between">
              <label className="flex items-center text-sm font-medium text-gray-700">
                Eligibility to raise this category of requests
                <div className="ml-2 relative group">
                  <div className="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center text-xs text-gray-500 cursor-help">
                    ?
                  </div>
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    Who can raise requests for this service
                  </div>
                </div>
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="eligibility_raise_requests"
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {/* Terms and conditions */}
            <div className="flex items-center justify-between">
              <label className="flex items-center text-sm font-medium text-gray-700">
                Terms and conditions
                <div className="ml-2 relative group">
                  <div className="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center text-xs text-gray-500 cursor-help">
                    ?
                  </div>
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    Include terms and conditions
                  </div>
                </div>
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="terms_conditions"
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Assign Staff section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Assign staff</h2>
          
          <div className="space-y-6">
            {/* Add staff field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add staff <span className="text-red-500">*</span>
              </label>
              <StaffSelector
                value={assignedStaff}
                onChange={(staff) => setAssignedStaff(staff as StaffData[])}
                placeholder="Search and select staff members..."
                multiple={true}
                required={true}
                showDetails={true}
              />
            </div>



            {/* Add new group button with dropdown */}
            <div className="relative group-dropdown">
              <button
                type="button"
                onClick={() => setShowGroupDropdown(!showGroupDropdown)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center space-x-2"
              >
                <span>Add new group</span>
                <svg className={`w-4 h-4 transition-transform ${showGroupDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Dropdown menu */}
              {showGroupDropdown && (
                <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                  <button
                    type="button"
                    onClick={() => addGroupAssignment('degree')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                  >
                    Degree
                  </button>
                  <button
                    type="button"
                    onClick={() => addGroupAssignment('department')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                  >
                    Department
                  </button>
                </div>
              )}
            </div>

            {/* Group Assignments */}
            {groupAssignments.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-base font-medium text-gray-900">Group Assignments</h3>
                {groupAssignments.map((group, index) => (
                  <div key={group.id} className="space-y-4 p-4 border border-gray-300 rounded-lg bg-gray-50">
                    {/* Group Type Header */}
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900 capitalize">
                        {group.type === 'degree' ? 'Degree' : 'Department'}
                      </h4>
                      <button
                        type="button"
                        onClick={() => removeGroupAssignment(group.id)}
                        className="w-6 h-6 flex items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                        title="Remove group assignment"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {group.type === 'degree' ? (
                      // Degree Group Section
                      <div className="space-y-4">
                        {/* All degrees / Selective degrees radio buttons */}
                        <div className="flex space-x-6">
                          <div className="flex items-center">
                            <input
                              type="radio"
                              id={`all_degrees_group_${group.id}`}
                              name={`group_assignments[${index}][target_type]`}
                              value="all"
                              checked={group.targetType === 'all'}
                              onChange={(e) => updateGroupAssignment(group.id, 'targetType', e.target.value as 'all' | 'selective')}
                              className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                            />
                            <label htmlFor={`all_degrees_group_${group.id}`} className="ml-2 text-sm font-medium text-gray-700">
                              All degrees
                            </label>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="radio"
                              id={`selective_degrees_group_${group.id}`}
                              name={`group_assignments[${index}][target_type]`}
                              value="selective"
                              checked={group.targetType === 'selective'}
                              onChange={(e) => updateGroupAssignment(group.id, 'targetType', e.target.value as 'all' | 'selective')}
                              className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                            />
                            <label htmlFor={`selective_degrees_group_${group.id}`} className="ml-2 text-sm font-medium text-gray-700">
                              Selective degrees
                            </label>
                          </div>
                        </div>

                        {/* Assign staff to degrees */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Assign staff to degrees <span className="text-red-500">*</span>
                          </label>
                          <StaffSelector
                            value={group.staff}
                            onChange={(staff) => updateGroupAssignment(group.id, 'staff', staff as StaffData[])}
                            placeholder="Search and select staff for degree..."
                            multiple={true}
                            required={true}
                            showDetails={true}
                          />
                        </div>
                      </div>
                    ) : (
                      // Department Group Section
                      <div className="space-y-4">
                        {/* All department / Selective department radio buttons */}
                        <div className="flex space-x-6">
                          <div className="flex items-center">
                            <input
                              type="radio"
                              id={`all_department_group_${group.id}`}
                              name={`group_assignments[${index}][target_type]`}
                              value="all"
                              checked={group.targetType === 'all'}
                              onChange={(e) => updateGroupAssignment(group.id, 'targetType', e.target.value as 'all' | 'selective')}
                              className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                            />
                            <label htmlFor={`all_department_group_${group.id}`} className="ml-2 text-sm font-medium text-gray-700">
                              All department
                            </label>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="radio"
                              id={`selective_department_group_${group.id}`}
                              name={`group_assignments[${index}][target_type]`}
                              value="selective"
                              checked={group.targetType === 'selective'}
                              onChange={(e) => updateGroupAssignment(group.id, 'targetType', e.target.value as 'all' | 'selective')}
                              className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                            />
                            <label htmlFor={`selective_department_group_${group.id}`} className="ml-2 text-sm font-medium text-gray-700">
                              Selective department
                            </label>
                          </div>
                        </div>

                        {/* Assign staff to department */}
                        <div>
                          <label htmlFor={`staff_to_department_${group.id}`} className="block text-sm font-medium text-gray-700 mb-2">
                            Assign staff to department <span className="text-red-500">*</span>
                          </label>
                          <StaffSelector
                            value={group.staff}
                            onChange={(staff) => updateGroupAssignment(group.id, 'staff', staff as StaffData[])}
                            placeholder="Search and select staff for department..."
                            multiple={true}
                            required={true}
                            showDetails={true}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Service'}
          </button>
        </div>
      </form>
    </div>
  )
}
