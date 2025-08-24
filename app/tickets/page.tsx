'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Ticket, Calendar, Clock, MapPin, Download, QrCode, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface TicketData {
  id: string
  ticket_number: string
  status: string
  qr_code_image?: string
  event: {
    id: string
    title: string
    date: string
    time: string
    venue: string
    location: string
    image_url: string
  }
  booking: {
    id: string
    user_name: string
    user_email: string
    total_amount: number
    quantity: number
  }
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null)
  const [userRole, setUserRole] = useState<string>('user')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const supabase = createClient()

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Get user role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      setUserRole(profile?.role || 'user')

      // For admin/organizer, fetch all tickets; for users, fetch only their tickets
      let bookingsQuery = supabase
        .from('bookings')
        .select(`
          id,
          user_name,
          user_email,
          total_amount,
          quantity,
          payment_status,
          user_id,
          events (
            id,
            title,
            date,
            time,
            venue,
            location,
            image_url,
            organizer_id
          )
        `)
        .eq('payment_status', 'completed')
        .order('created_at', { ascending: false })

      // Filter based on role
      if (profile?.role === 'admin') {
        // Admin sees all tickets
      } else if (profile?.role === 'organizer') {
        // Organizer sees tickets for their events
        const { data: organizerEvents } = await supabase
          .from('events')
          .select('id')
          .eq('organizer_id', user.id)
        
        if (organizerEvents && organizerEvents.length > 0) {
          const eventIds = organizerEvents.map(e => e.id)
          bookingsQuery = bookingsQuery.in('event_id', eventIds)
        }
      } else {
        // Regular users see only their tickets
        bookingsQuery = bookingsQuery.eq('user_id', user.id)
      }

      const { data: bookings } = await bookingsQuery

      if (bookings && bookings.length > 0) {
        const allTickets: TicketData[] = []
        
        for (const booking of bookings) {
          const response = await fetch('/api/tickets/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingId: booking.id })
          })
          
          if (response.ok) {
            const { tickets: bookingTickets } = await response.json()
            if (bookingTickets) {
              allTickets.push(...bookingTickets.map((ticket: any) => ({
                ...ticket,
                event: booking.events,
                booking: {
                  id: booking.id,
                  user_name: booking.user_name,
                  user_email: booking.user_email,
                  total_amount: booking.total_amount,
                  quantity: booking.quantity
                }
              })))
            }
          }
        }
        
        setTickets(allTickets)
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadTicket = (ticket: TicketData) => {
    if (!ticket.qr_code_image) return
    
    const link = document.createElement('a')
    link.download = `ticket-${ticket.ticket_number}.png`
    link.href = ticket.qr_code_image
    link.click()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const filteredTickets = filterStatus === 'all' 
    ? tickets 
    : tickets.filter(t => t.status === filterStatus)

  const getRoleBadge = () => {
    const badges = {
      admin: 'bg-purple-100 text-purple-800 border-purple-300',
      organizer: 'bg-blue-100 text-blue-800 border-blue-300',
      user: 'bg-gray-100 text-gray-800 border-gray-300'
    }
    const labels = {
      admin: 'Admin View',
      organizer: 'Organizer View',
      user: 'My Tickets'
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${badges[userRole as keyof typeof badges]}`}>
        {labels[userRole as keyof typeof labels]}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ffde59]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <Ticket className="h-10 w-10 text-[#ffde59]" />
              {userRole === 'admin' ? 'All Tickets' : userRole === 'organizer' ? 'Event Tickets' : 'My Tickets'}
            </h1>
            {getRoleBadge()}
          </div>
          <p className="text-gray-600">
            {userRole === 'admin' 
              ? 'Manage all tickets across the platform' 
              : userRole === 'organizer' 
              ? 'View tickets for your events' 
              : 'View and manage your event tickets'}
          </p>
        </div>

        {/* Filter buttons */}
        {tickets.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterStatus === 'all' 
                  ? 'bg-[#ffde59] text-[#0b6d41]' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              All ({tickets.length})
            </button>
            <button
              onClick={() => setFilterStatus('valid')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterStatus === 'valid' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Valid ({tickets.filter(t => t.status === 'valid').length})
            </button>
            <button
              onClick={() => setFilterStatus('used')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterStatus === 'used' 
                  ? 'bg-gray-500 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Used ({tickets.filter(t => t.status === 'used').length})
            </button>
          </div>
        )}

        {tickets.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <QrCode className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No tickets yet</h2>
            <p className="text-gray-600 mb-6">Your purchased tickets will appear here</p>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ffde59] to-[#f5c842] text-[#0b6d41] px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Browse Events
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all cursor-pointer"
                onClick={() => setSelectedTicket(ticket)}
              >
                <div className="relative h-48">
                  {ticket.event.image_url ? (
                    <Image
                      src={ticket.event.image_url}
                      alt={ticket.event.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#ffde59] to-[#f5c842] flex items-center justify-center">
                      <Ticket className="h-16 w-16 text-white/50" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      ticket.status === 'valid' 
                        ? 'bg-green-500 text-white' 
                        : ticket.status === 'used'
                        ? 'bg-gray-500 text-white'
                        : 'bg-red-500 text-white'
                    }`}>
                      {ticket.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{ticket.event.title}</h3>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#ffde59]" />
                      <span>{formatDate(ticket.event.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[#ffde59]" />
                      <span>{ticket.event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#ffde59]" />
                      <span>{ticket.event.venue}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 font-mono">#{ticket.ticket_number}</p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      downloadTicket(ticket)
                    }}
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#ffde59] to-[#f5c842] text-[#0b6d41] px-4 py-2 rounded-lg font-semibold hover:shadow-md transition-all"
                  >
                    <Download className="h-4 w-4" />
                    Download Ticket
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedTicket && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setSelectedTicket(null)}
          >
            <div 
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                {selectedTicket.event.title}
              </h2>
              
              {selectedTicket.qr_code_image && (
                <div className="mb-6 bg-gradient-to-br from-[#ffde59]/10 to-[#f5c842]/10 p-6 rounded-2xl">
                  <img 
                    src={selectedTicket.qr_code_image} 
                    alt="QR Code" 
                    className="w-full max-w-[300px] mx-auto"
                  />
                </div>
              )}

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ticket Number:</span>
                  <span className="font-mono font-semibold">{selectedTicket.ticket_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-semibold">{formatDate(selectedTicket.event.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-semibold">{selectedTicket.event.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Venue:</span>
                  <span className="font-semibold">{selectedTicket.event.venue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-semibold ${
                    selectedTicket.status === 'valid' ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {selectedTicket.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => downloadTicket(selectedTicket)}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#ffde59] to-[#f5c842] text-[#0b6d41] px-4 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  <Download className="h-5 w-5" />
                  Download
                </button>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}