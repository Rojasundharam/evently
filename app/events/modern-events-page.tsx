'use client'

import Link from 'next/link'
import { Calendar, MapPin, Users, Search, AlertCircle, X, Clock, Star, Filter } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

import { formatDate, formatTime, formatPrice } from '@/lib/utils'

interface Event {
  id: string
  title: string
  description: string
  date: string
  time: string
  venue: string
  location: string
  price: number
  max_attendees: number
  category: string
  image_url?: string
  organizer_id: string
  profiles?: {
    full_name: string
    email: string
  }
}

export default function ModernEventsPage() {
  const searchParams = useSearchParams()

  const [showMessage, setShowMessage] = useState(false)
  const [message, setMessage] = useState('')
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error('Error checking user:', error)
        setUser(null)
      }
    }

    checkUser()

    // Check for messages from URL params
    const messageParam = searchParams.get('message')
    if (messageParam) {
      setMessage(decodeURIComponent(messageParam))
      setShowMessage(true)
    }
  }, [searchParams, supabase])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/events?category=all&limit=50')
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
      } else {
        console.error('Failed to fetch events')
        setEvents([])
      }
    } catch (error) {
      console.error('Error fetching events:', error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || 
                           event.category.toLowerCase() === selectedCategory.toLowerCase()
    
    return matchesSearch && matchesCategory
  })

  const categories = [
    { value: 'all', label: 'All Categories', icon: '🎯' },
    { value: 'technology', label: 'Technology', icon: '💻' },
    { value: 'music', label: 'Music', icon: '🎵' },
    { value: 'business', label: 'Business', icon: '💼' },
    { value: 'art', label: 'Art', icon: '🎨' },
    { value: 'sports', label: 'Sports', icon: '⚽' },
    { value: 'food', label: 'Food', icon: '🍕' },
    { value: 'education', label: 'Education', icon: '📚' },
    { value: 'community', label: 'Community', icon: '🤝' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Discover Events</h1>
                <p className="text-gray-600 mt-2">Find amazing events happening near you</p>
              </div>
              <div className="hidden md:flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>{events.length} events available</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Message Alert */}
        {showMessage && (
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 flex items-start justify-between shadow-sm">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 rounded-full p-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Information</h3>
                <p className="text-blue-800">{message}</p>
              </div>
            </div>
            <button
              onClick={() => setShowMessage(false)}
              className="text-blue-600 hover:text-blue-800 p-1 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Search and Filter */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search events, venues, or locations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b6d41] focus:border-transparent bg-gray-50 transition-all"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="lg:w-64">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b6d41] focus:border-transparent bg-gray-50 transition-all"
                >
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.icon} {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {filteredEvents.length} events found
                </span>
                {searchTerm && (
                  <span className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Searching for &quot;{searchTerm}&quot;
                  </span>
                )}
                {selectedCategory !== 'all' && (
                  <span className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    {categories.find(c => c.value === selectedCategory)?.label}
                  </span>
                )}
              </div>
              {(searchTerm || selectedCategory !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedCategory('all')
                  }}
                  className="text-[#0b6d41] hover:text-[#0a5d37] font-medium text-sm"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse border border-gray-100">
                <div className="h-56 bg-gray-200"></div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 max-w-lg mx-auto">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">No events found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Try adjusting your search criteria or browse all categories.'
                  : 'Check back later for new events or create your own!'}
              </p>
              {(searchTerm || selectedCategory !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedCategory('all')
                  }}
                  className="bg-[#0b6d41] text-white px-6 py-3 rounded-xl hover:bg-[#0a5d37] transition-colors font-medium"
                >
                  Show all events
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100 group transform hover:-translate-y-1"
              >
                <div className="relative h-56">
                  {event.image_url ? (
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#0b6d41] via-[#15a862] to-[#ffde59] flex items-center justify-center">
                      <Calendar className="h-16 w-16 text-white" />
                    </div>
                  )}
                  
                  {/* Category Badge */}
                  <div className="absolute top-4 right-4">
                    <span className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold text-gray-900 capitalize shadow-sm">
                      {categories.find(c => c.value === event.category.toLowerCase())?.icon} {event.category}
                    </span>
                  </div>

                  {/* Free Badge */}
                  {event.price === 0 && (
                    <div className="absolute top-4 left-4">
                      <span className="bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
                        FREE
                      </span>
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#0b6d41] transition-colors">
                        {event.title}
                      </h3>
                    </div>
                    <div className="ml-4 text-right">
                      {event.price === 0 ? (
                        <span className="text-lg font-bold text-green-600">FREE</span>
                      ) : (
                        <span className="text-lg font-bold text-[#0b6d41]">₹{formatPrice(event.price)}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Event Details */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="bg-blue-50 p-1.5 rounded-lg">
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-medium">{formatDate(event.date)}</span>
                      <div className="bg-orange-50 p-1.5 rounded-lg">
                        <Clock className="h-4 w-4 text-orange-600" />
                      </div>
                      <span>{formatTime(event.time)}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="bg-green-50 p-1.5 rounded-lg">
                        <MapPin className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="truncate font-medium">{event.venue}, {event.location}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="bg-purple-50 p-1.5 rounded-lg">
                        <Users className="h-4 w-4 text-purple-600" />
                      </div>
                      <span>{event.max_attendees} max attendees</span>
                    </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#0b6d41] to-[#ffde59] rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {event.profiles?.full_name?.charAt(0) || 'O'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        by {event.profiles?.full_name || 'Organizer'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-sm font-medium text-gray-600">4.8</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
