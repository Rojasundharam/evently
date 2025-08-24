import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, MapPin, Users, IndianRupee, Share2, Heart } from 'lucide-react'
import { formatDate, formatTime, formatPrice } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
import BookingSection from './booking-section'

async function getEvent(id: string) {
  const supabase = await createClient()
  
  const { data: event, error } = await supabase
    .from('events')
    .select(`
      *,
      profiles!organizer_id (
        id,
        email,
        full_name
      )
    `)
    .eq('id', id)
    .single()

  if (error || !event) {
    return null
  }

  return event
}

export default async function EventDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const event = await getEvent(resolvedParams.id)

  if (!event) {
    notFound()
  }

  const availableSeats = event.max_attendees - event.current_attendees
  const isFullyBooked = availableSeats === 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              Evently
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link
          href="/events"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Event Image */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-96 bg-gray-200">
                {event.image_url ? (
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0b6d41] to-[#ffde59]">
                    <span className="text-white text-6xl font-bold">
                      {event.title.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="inline-block bg-[#0b6d41]/10 text-[#0b6d41] px-3 py-1 rounded-full text-sm font-medium mb-2">
                      {event.category}
                    </span>
                    <h1 className="text-3xl font-bold">{event.title}</h1>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 rounded-full hover:bg-gray-100">
                      <Share2 className="h-5 w-5" />
                    </button>
                    <button className="p-2 rounded-full hover:bg-gray-100">
                      <Heart className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3 text-gray-600">
                    <Calendar className="h-5 w-5" />
                    <span>{formatDate(event.date)} at {formatTime(event.time)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <MapPin className="h-5 w-5" />
                    <span>{event.venue}, {event.location}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <Users className="h-5 w-5" />
                    <span>{event.current_attendees}/{event.max_attendees} attendees ({availableSeats} seats available)</span>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h2 className="text-xl font-semibold mb-3">About this event</h2>
                  <div className="text-gray-600 whitespace-pre-line">
                    {event.description}
                  </div>
                </div>

                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-2">Organized by</h3>
                  <p className="text-gray-600">{event.profiles?.full_name || 'Event Organizer'}</p>
                  <p className="text-gray-600">{event.profiles?.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <BookingSection 
              event={event}
              availableSeats={availableSeats}
              isFullyBooked={isFullyBooked}
            />
          </div>
        </div>
      </div>
    </div>
  )
}