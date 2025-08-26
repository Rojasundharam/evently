'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Calendar, MapPin, Users, IndianRupee, Image as ImageIcon, LogIn, Upload, X, CheckCircle } from 'lucide-react'
import { eventFormSchema, type EventFormData, eventCategories } from '@/lib/validations/event'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import ImageUploadDropzone from './image-upload-dropzone'
import SeatConfiguration from '@/components/events/SeatConfiguration'
import type { SeatConfig } from '@/components/events/SeatConfiguration'
import EnhancedTicketTemplate, { type TicketTemplate } from '@/components/events/enhanced-ticket-template'

export default function CreateEventPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [isUploading, setIsUploading] = useState(false)
  const [seatConfig, setSeatConfig] = useState<SeatConfig>({
    enabled: false,
    totalSeats: 100,
    layoutType: 'sequential'
  })
  const [enableTicketTemplate, setEnableTicketTemplate] = useState(false)
  const [ticketTemplate, setTicketTemplate] = useState<TicketTemplate>({
    // Event Branding
    eventName: '',
    themeColor: '#0b6d41',
    secondaryColor: '#15a862',
    
    // Ticket Details
    ticketTypes: [
      {
        name: 'General Admission',
        price: 0,
        color: '#0b6d41',
        benefits: []
      }
    ],
    includeQRCode: true,
    includeBarcodeNumber: true,
    seatAllocation: 'none',
    
    // Event Information (will be filled from form)
    eventDate: '',
    eventTime: '',
    venue: '',
    location: '',
    entryTime: '',
    gateDetails: '',
    
    // Attendee Information
    showAttendeeName: true,
    showContactInfo: false,
    showRegistrationId: true,
    
    // Pricing & Terms
    currency: 'INR',
    showPrice: true,
    refundPolicy: 'no-refunds',
    idProofRequired: true,
    nonTransferable: true,
    additionalTerms: [
      'This ticket is valid for one-time entry only',
      'Please carry a valid government-issued ID proof',
      'Entry subject to security check'
    ],
    
    // Security & Verification
    enableWatermark: true,
    enableHologram: false,
    verificationMethod: 'qr',
    
    // Additional Info
    organizerName: '',
    organizerContact: '',
    organizerEmail: '',
    sponsorLogos: [],
    socialMedia: {
      website: '',
      instagram: '',
      twitter: '',
      facebook: '',
      linkedin: ''
    },
    
    // Layout
    layoutStyle: 'modern'
  })
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
  })

  const watchedValues = watch()
  const watchedImageUrl = watchedValues.image_url
  const watchedPrice = watchedValues.price
  const supabase = useMemo(() => createClient(), [])

  const checkUserAndRole = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    setLoading(false)
    
    // If no user, redirect to events page with login prompt
    if (!user) {
      router.push('/events?message=Please sign in to create an event. Fill in your organizer details to get started.')
      return
    }

    // Check if user has organizer or admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role || 'user'
    
    if (userRole !== 'organizer' && userRole !== 'admin') {
      router.push('/profile/upgrade-to-organizer?message=You need to become an organizer to create events.')
      return
    }
  }, [supabase, router])

  useEffect(() => {
    checkUserAndRole()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
        router.push('/events?message=Please sign in to create an event. Fill in your organizer details to get started.')
      } else {
        checkUserAndRole()
      }
    })

    return () => subscription.unsubscribe()
  }, [checkUserAndRole, supabase.auth, router])

  const handleImageSelect = (file: File) => {
    setImageFile(file)
    const previewUrl = URL.createObjectURL(file)
    setImagePreview(previewUrl)
    
    // Clear any existing URL in the form
    setValue('image_url', '')
  }

  const handleImageRemove = () => {
    setImageFile(null)
    setImagePreview('')
    setValue('image_url', '')
    
    // Clean up object URL
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview)
    }
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true)
      setUploadProgress(0)

      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `event-images/${fileName}`

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      // Check if bucket exists first
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
      
      if (bucketsError) {
        console.error('Error checking buckets:', bucketsError)
      }

      const eventImagesBucket = buckets?.find(bucket => bucket.id === 'event-images')
      
      if (!eventImagesBucket) {
        clearInterval(progressInterval)
        setIsUploading(false)
        setUploadProgress(0)
        
        alert('Image storage is not configured. Please run the storage setup script or contact the administrator.')
        return null
      }

      const { error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      clearInterval(progressInterval)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        
        // Handle specific error cases
        if (uploadError.message.includes('Bucket not found')) {
          alert('Image storage bucket not found. Please run the storage setup script.')
        } else if (uploadError.message.includes('File size')) {
          alert('Image file is too large. Please choose a smaller image (max 5MB).')
        } else if (uploadError.message.includes('duplicate')) {
          alert('An image with this name already exists. Please try again.')
        } else {
          alert(`Failed to upload image: ${uploadError.message}`)
        }
        
        throw new Error(`Failed to upload image: ${uploadError.message}`)
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('event-images')
        .getPublicUrl(filePath)

      setUploadProgress(100)
      
      setTimeout(() => {
        setIsUploading(false)
        setUploadProgress(0)
      }, 1000)

      return publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      setIsUploading(false)
      setUploadProgress(0)
      throw error
    }
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0b6d41] mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="max-w-md mx-auto text-center p-8 bg-white rounded-lg shadow-lg">
          <LogIn className="h-16 w-16 text-[#0b6d41] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to create an event. Fill in your organizer details to get started.</p>
          <Link
            href="/events"
            className="inline-flex items-center px-6 py-3 bg-[#0b6d41] text-white font-semibold rounded-lg hover:bg-[#0a5d37] transition-colors"
          >
            Go to Events
          </Link>
        </div>
      </div>
    )
  }

  const onSubmit = async (data: EventFormData) => {
    console.log('Form submitted with data:', data)
    try {
      setIsSubmitting(true)
      
      let finalImageUrl = data.image_url

      // Upload image if file is selected
      if (imageFile) {
        try {
          const uploadedUrl = await uploadImage(imageFile)
          if (uploadedUrl) {
            finalImageUrl = uploadedUrl
          }
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError)
          // Ask user if they want to continue without image
          const continueWithoutImage = confirm(
            'Image upload failed. Would you like to create the event without an image? You can add an image later by editing the event.'
          )
          if (!continueWithoutImage) {
            setIsSubmitting(false)
            return
          }
          // Continue with event creation without image
          finalImageUrl = null
        }
      }

      // Only include ticket template if enabled
      let completeTicketTemplate = null
      if (enableTicketTemplate) {
        // Update ticket template with form data
        completeTicketTemplate = {
          ...ticketTemplate,
          eventDate: data.date,
          eventTime: data.time,
          venue: data.venue,
          location: data.location,
          ticketTypes: ticketTemplate.ticketTypes.map(type => ({
            ...type,
            price: type.name === 'General Admission' ? (data.price || 0) : type.price
          }))
        }
      }

      const eventData = {
        ...data,
        image_url: finalImageUrl || null,
        seat_config: seatConfig, // Include seat configuration
        ticket_template: completeTicketTemplate // Include ticket template only if enabled
      }
      
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      })

      if (!response.ok) {
        const error = await response.json()
        if (response.status === 401) {
          alert('Please sign in to create an event')
          return
        }
        throw new Error(error.error || 'Failed to create event')
      }

      const { event } = await response.json()
      router.push(`/events/${event.id}?message=Event created successfully!`)
    } catch (error) {
      console.error('Error creating event:', error)
      alert(error instanceof Error ? error.message : 'Failed to create event. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header */}
      <header className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-[#0b6d41] to-[#15a862] bg-clip-text text-transparent">
              Evently
            </Link>
            <Link
              href="/events"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-gray-100">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Event</h1>
            <p className="text-gray-600">Share your event with the world and bring people together</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit, (errors) => {
            console.log('Form validation errors:', errors)
            alert('Please check all required fields are filled correctly.')
          })} className="space-y-8">
            {/* Event Banner Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                <ImageIcon className="inline h-5 w-5 mr-2" />
                Event Banner Image
              </label>
              
              <ImageUploadDropzone 
                onImageSelect={handleImageSelect}
                imagePreview={imagePreview}
                onImageRemove={handleImageRemove}
                isUploading={isUploading}
                uploadProgress={uploadProgress}
              />
              
              {/* Alternative URL Input */}
              <div className="mt-4">
                <div className="text-center text-sm text-gray-500 mb-3">
                  <span className="bg-white px-2">OR</span>
                </div>
                <input
                  {...register('image_url')}
                  type="url"
                  placeholder="Enter image URL"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b6d41] focus:border-transparent"
                  disabled={!!imageFile}
                />
                {errors.image_url && (
                  <p className="mt-2 text-sm text-red-600">{errors.image_url.message}</p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Event Title */}
              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Event Title *
                </label>
                <input
                  {...register('title')}
                  type="text"
                  id="title"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b6d41] focus:border-transparent text-lg"
                  placeholder="Enter an engaging event title"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  {...register('category')}
                  id="category"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b6d41] focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {eventCategories.map((category) => (
                    <option key={category} value={category} className="capitalize">
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                )}
              </div>

              {/* Price */}
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                  <IndianRupee className="inline h-4 w-4 mr-1" />
                  Ticket Price (INR) *
                </label>
                <input
                  {...register('price')}
                  type="number"
                  id="price"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b6d41] focus:border-transparent"
                  placeholder="0.00 (Free event)"
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Event Description *
              </label>
              <textarea
                {...register('description')}
                id="description"
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b6d41] focus:border-transparent"
                placeholder="Describe your event in detail - what attendees can expect, agenda, speakers, etc."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Date and Time */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Event Date *
                </label>
                <input
                  {...register('date')}
                  type="date"
                  id="date"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b6d41] focus:border-transparent"
                  min={new Date().toISOString().split('T')[0]}
                />
                {errors.date && (
                  <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                  Event Time *
                </label>
                <input
                  {...register('time')}
                  type="time"
                  id="time"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b6d41] focus:border-transparent"
                />
                {errors.time && (
                  <p className="mt-1 text-sm text-red-600">{errors.time.message}</p>
                )}
              </div>
            </div>

            {/* Venue and Location */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-2">
                  Venue Name *
                </label>
                <input
                  {...register('venue')}
                  type="text"
                  id="venue"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b6d41] focus:border-transparent"
                  placeholder="e.g., Convention Center, Online"
                />
                {errors.venue && (
                  <p className="mt-1 text-sm text-red-600">{errors.venue.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Location *
                </label>
                <input
                  {...register('location')}
                  type="text"
                  id="location"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b6d41] focus:border-transparent"
                  placeholder="City, State or Online"
                />
                {errors.location && (
                  <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
                )}
              </div>
            </div>

            {/* Max Attendees */}
            <div>
              <label htmlFor="max_attendees" className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="inline h-4 w-4 mr-1" />
                Maximum Attendees *
              </label>
              <input
                {...register('max_attendees')}
                type="number"
                id="max_attendees"
                min="1"
                max="10000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b6d41] focus:border-transparent"
                placeholder="100"
                onChange={(e) => {
                  // Update seat config when max attendees changes
                  const value = parseInt(e.target.value) || 100
                  if (seatConfig.enabled) {
                    setSeatConfig(prev => ({ ...prev, totalSeats: value }))
                  }
                }}
              />
              {errors.max_attendees && (
                <p className="mt-1 text-sm text-red-600">{errors.max_attendees.message}</p>
              )}
            </div>

            {/* Seat Configuration */}
            <div>
              <SeatConfiguration 
                value={seatConfig}
                onChange={setSeatConfig}
                basePrice={watchedPrice || 0}
              />
            </div>

            {/* Enhanced Ticket Template Configuration - Optional */}
            <div>
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableTicketTemplate}
                      onChange={(e) => setEnableTicketTemplate(e.target.checked)}
                      className="mr-3 h-4 w-4 text-[#0b6d41] rounded focus:ring-[#0b6d41]"
                    />
                    <span className="text-lg font-semibold text-gray-900">🎟️ Enable Advanced Ticket Template (Optional)</span>
                  </label>
                  <p className="text-sm text-gray-500 mt-1 ml-7">
                    Design professional tickets with QR codes, security features, branding, and complete event information
                  </p>
                </div>
                {enableTicketTemplate && (
                  <div className="p-1">
                    <EnhancedTicketTemplate
                      template={ticketTemplate}
                      onChange={setTicketTemplate}
                      eventData={{
                        name: watchedValues.title,
                        date: watchedValues.date,
                        time: watchedValues.time,
                        venue: watchedValues.venue,
                        location: watchedValues.location,
                        price: watchedValues.price
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="w-full bg-gradient-to-r from-[#0b6d41] to-[#15a862] text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-[#0a5d37] to-[#138a56] focus:outline-none focus:ring-2 focus:ring-[#0b6d41] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating Event...
                  </span>
                ) : (
                  'Create Event'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}