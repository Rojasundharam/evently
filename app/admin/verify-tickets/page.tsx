'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Html5Qrcode } from 'html5-qrcode'
import { 
  QrCode, 
  CheckCircle, 
  XCircle, 
  Search,
  Scan,
  Shield,
  Ticket,
  User,
  Calendar,
  Clock,
  MapPin,
  Hash,
  AlertCircle,
  Camera,
  X
} from 'lucide-react'
import { decryptTicketData } from '@/lib/qr-generator'
import UserFlowGuard from '@/components/auth/user-flow-guard'

interface VerificationResult {
  verified: boolean
  message: string
  ticket?: {
    id: string
    ticket_number: string
    status: string
    checked_in_at?: string
    booking: {
      id: string
      user_name: string
      user_email: string
      user_phone?: string
      quantity: number
      total_amount: number
      event: {
        id: string
        title: string
        date: string
        time: string
        venue: string
        location: string
      }
    }
  }
}

export default function VerifyTicketsPage() {
  const [searchInput, setSearchInput] = useState('')
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [scannerActive, setScannerActive] = useState(false)
  const [recentVerifications, setRecentVerifications] = useState<any[]>([])
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchRecentVerifications()
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error)
      }
    }
  }, [])

  const fetchRecentVerifications = async () => {
    const { data: tickets } = await supabase
      .from('tickets')
      .select(`
        *,
        bookings (
          *,
          events (*)
        )
      `)
      .not('checked_in_at', 'is', null)
      .order('checked_in_at', { ascending: false })
      .limit(10)

    if (tickets) {
      setRecentVerifications(tickets)
    }
  }

  const verifyTicket = async (input: string) => {
    setLoading(true)
    setVerificationResult(null)

    try {
      // First try to decrypt if it's a QR code
      let searchValue = input
      let searchField = 'ticket_number'
      
      try {
        const decryptedData = decryptTicketData(input)
        if (decryptedData && decryptedData.ticketNumber) {
          searchValue = decryptedData.ticketNumber
        }
      } catch {
        // Not a QR code, treat as booking ID or ticket number
        // Check if it looks like a booking ID (UUID format)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (uuidRegex.test(input)) {
          searchField = 'booking_id'
        }
      }

      // Search for the ticket
      let query = supabase
        .from('tickets')
        .select(`
          *,
          bookings (
            *,
            events (*)
          )
        `)

      if (searchField === 'booking_id') {
        query = query.eq('booking_id', searchValue)
      } else {
        query = query.eq('ticket_number', searchValue)
      }

      const { data: tickets, error } = await query

      if (error) {
        throw error
      }

      if (tickets && tickets.length > 0) {
        const ticket = tickets[0]
        
        // Format the result
        const result: VerificationResult = {
          verified: true,
          message: ticket.status === 'used' 
            ? `Ticket already used (Checked in at ${new Date(ticket.checked_in_at).toLocaleString()})`
            : 'Valid ticket - Not yet used',
          ticket: {
            id: ticket.id,
            ticket_number: ticket.ticket_number,
            status: ticket.status,
            checked_in_at: ticket.checked_in_at,
            booking: {
              id: ticket.bookings.id,
              user_name: ticket.bookings.user_name,
              user_email: ticket.bookings.user_email,
              user_phone: ticket.bookings.user_phone,
              quantity: ticket.bookings.quantity,
              total_amount: ticket.bookings.total_amount,
              event: {
                id: ticket.bookings.events.id,
                title: ticket.bookings.events.title,
                date: ticket.bookings.events.date,
                time: ticket.bookings.events.time,
                venue: ticket.bookings.events.venue,
                location: ticket.bookings.events.location
              }
            }
          }
        }
        
        setVerificationResult(result)
        
        // Refresh recent verifications
        fetchRecentVerifications()
      } else {
        setVerificationResult({
          verified: false,
          message: 'No ticket found with this ID/Number'
        })
      }
    } catch (error) {
      console.error('Verification error:', error)
      setVerificationResult({
        verified: false,
        message: 'Error verifying ticket. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchInput.trim()) {
      verifyTicket(searchInput.trim())
    }
  }

  const startScanner = async () => {
    try {
      const html5QrCode = new Html5Qrcode("qr-reader")
      scannerRef.current = html5QrCode
      
      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          verifyTicket(decodedText)
          stopScanner()
        },
        () => {} // Ignore errors
      )
      
      setScannerActive(true)
    } catch (err) {
      console.error("Error starting scanner:", err)
      alert("Unable to access camera. Please use manual entry.")
    }
  }

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().then(() => {
        setScannerActive(false)
      }).catch(console.error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <UserFlowGuard requiredRole="admin">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-[#0b6d41]" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Ticket Verifier</h1>
                <p className="text-gray-600 mt-1">Verify printed tickets and check booking details</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Verification Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <QrCode className="h-6 w-6 text-[#ffde59]" />
                  Verify Ticket
                </h2>

                {/* Search Form */}
                <form onSubmit={handleSearch} className="mb-6">
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Enter Booking ID, Ticket Number, or scan QR code"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0b6d41] focus:border-transparent"
                        disabled={loading || scannerActive}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading || !searchInput.trim() || scannerActive}
                      className="px-6 py-3 bg-[#0b6d41] text-white rounded-xl hover:bg-[#0a5d37] disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                      {loading ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>
                </form>

                {/* QR Scanner Section */}
                <div className="mb-6">
                  {!scannerActive ? (
                    <button
                      onClick={startScanner}
                      className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#0b6d41] hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-gray-600"
                    >
                      <Camera className="h-5 w-5" />
                      Click to scan QR code with camera
                    </button>
                  ) : (
                    <div className="relative">
                      <div id="qr-reader" className="rounded-xl overflow-hidden"></div>
                      <button
                        onClick={stopScanner}
                        className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Verification Result */}
                {verificationResult && (
                  <div className={`rounded-xl p-6 ${
                    verificationResult.verified 
                      ? verificationResult.ticket?.status === 'used'
                        ? 'bg-yellow-50 border-2 border-yellow-200'
                        : 'bg-green-50 border-2 border-green-200'
                      : 'bg-red-50 border-2 border-red-200'
                  }`}>
                    <div className="flex items-start gap-4">
                      {verificationResult.verified ? (
                        verificationResult.ticket?.status === 'used' ? (
                          <AlertCircle className="h-8 w-8 text-yellow-500 flex-shrink-0" />
                        ) : (
                          <CheckCircle className="h-8 w-8 text-green-500 flex-shrink-0" />
                        )
                      ) : (
                        <XCircle className="h-8 w-8 text-red-500 flex-shrink-0" />
                      )}
                      
                      <div className="flex-1">
                        <h3 className={`text-lg font-bold mb-3 ${
                          verificationResult.verified 
                            ? verificationResult.ticket?.status === 'used'
                              ? 'text-yellow-900'
                              : 'text-green-900'
                            : 'text-red-900'
                        }`}>
                          {verificationResult.message}
                        </h3>
                        
                        {verificationResult.ticket && (
                          <div className="space-y-4">
                            {/* Ticket Info */}
                            <div className="bg-white rounded-lg p-4">
                              <h4 className="font-semibold text-gray-900 mb-3">Ticket Information</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <Hash className="h-4 w-4 text-gray-400" />
                                  <span className="text-gray-600">Ticket:</span>
                                  <span className="font-mono font-semibold">{verificationResult.ticket.ticket_number}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Ticket className="h-4 w-4 text-gray-400" />
                                  <span className="text-gray-600">Status:</span>
                                  <span className={`font-semibold ${
                                    verificationResult.ticket.status === 'valid' ? 'text-green-600' : 'text-yellow-600'
                                  }`}>
                                    {verificationResult.ticket.status.toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Event Info */}
                            <div className="bg-white rounded-lg p-4">
                              <h4 className="font-semibold text-gray-900 mb-3">Event Details</h4>
                              <div className="space-y-2 text-sm">
                                <div className="font-semibold text-lg text-gray-900">
                                  {verificationResult.ticket.booking.event.title}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <span>{formatDate(verificationResult.ticket.booking.event.date)}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-gray-400" />
                                    <span>{verificationResult.ticket.booking.event.time}</span>
                                  </div>
                                  <div className="flex items-center gap-2 md:col-span-2">
                                    <MapPin className="h-4 w-4 text-gray-400" />
                                    <span>{verificationResult.ticket.booking.event.venue}, {verificationResult.ticket.booking.event.location}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Customer Info */}
                            <div className="bg-white rounded-lg p-4">
                              <h4 className="font-semibold text-gray-900 mb-3">Customer Information</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-gray-400" />
                                  <span className="text-gray-600">Name:</span>
                                  <span className="font-semibold">{verificationResult.ticket.booking.user_name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-600">Email:</span>
                                  <span className="font-semibold">{verificationResult.ticket.booking.user_email}</span>
                                </div>
                                {verificationResult.ticket.booking.user_phone && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-600">Phone:</span>
                                    <span className="font-semibold">{verificationResult.ticket.booking.user_phone}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-600">Quantity:</span>
                                  <span className="font-semibold">{verificationResult.ticket.booking.quantity} tickets</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Verifications */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Clock className="h-6 w-6 text-[#ffde59]" />
                  Recent Check-ins
                </h2>
                
                {recentVerifications.length > 0 ? (
                  <div className="space-y-3">
                    {recentVerifications.map((ticket) => (
                      <div key={ticket.id} className="border-l-4 border-green-500 pl-4 py-2">
                        <div className="text-sm font-semibold text-gray-900">
                          {ticket.ticket_number}
                        </div>
                        <div className="text-xs text-gray-600">
                          {ticket.bookings?.events?.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(ticket.checked_in_at).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No recent check-ins</p>
                )}
              </div>

              {/* Statistics */}
              <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Scan className="h-6 w-6 text-[#ffde59]" />
                  Quick Stats
                </h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Today&apos;s Verifications</span>
                    <span className="text-2xl font-bold text-[#0b6d41]">
                      {recentVerifications.filter(t => 
                        new Date(t.checked_in_at).toDateString() === new Date().toDateString()
                      ).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Recent</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {recentVerifications.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserFlowGuard>
  )
}