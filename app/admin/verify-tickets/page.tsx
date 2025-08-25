'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { QrCode, Search, CheckCircle, XCircle, AlertCircle, Clock, User, Ticket } from 'lucide-react'

interface VerificationResult {
  success: boolean
  message: string
  ticket?: {
    id: string
    ticket_number: string
    status: string
    customer_name?: string
    customer_email?: string
    event_title?: string
    event_date?: string
    checked_in_at?: string
  }
}

export default function VerifyTicketsPage() {
  const [ticketInput, setTicketInput] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [recentCheckins, setRecentCheckins] = useState<any[]>([])
  const supabase = createClient()

  const handleVerify = async () => {
    if (!ticketInput.trim()) {
      setResult({
        success: false,
        message: 'Please enter a ticket number, booking ID, or QR code data'
      })
      return
    }

    setIsVerifying(true)
    setResult(null)

    try {
      // Try multiple verification methods
      let ticket: any = null
      
      // Method 1: Direct ticket number lookup
      const { data: ticketByNumber } = await supabase
        .from('tickets')
        .select(`
          *,
          bookings (
            user_name,
            user_email,
            events (
              title,
              date,
              time
            )
          )
        `)
        .eq('ticket_number', ticketInput.trim())
        .single()

      if (ticketByNumber) {
        ticket = ticketByNumber
      }

      // Method 2: Booking ID lookup
      if (!ticket) {
        const { data: ticketByBooking } = await supabase
          .from('tickets')
          .select(`
            *,
            bookings (
              user_name,
              user_email,
              events (
                title,
                date,
                time
              )
            )
          `)
          .eq('booking_id', ticketInput.trim())
          .limit(1)
          .single()

        if (ticketByBooking) {
          ticket = ticketByBooking
        }
      }

      // Method 3: Try to decrypt as QR code (primary method)
      if (!ticket) {
        try {
          // Try qr-generator decryption (this is what generates tickets)
          const { decryptTicketData, decryptTicketDataSync } = await import('@/lib/qr-generator')
          let qrData = null
          
          // Try synchronous version first
          try {
            qrData = decryptTicketDataSync(ticketInput.trim())
          } catch (syncError) {
            // Fall back to async version
            qrData = await decryptTicketData(ticketInput.trim())
          }
          
          if (qrData) {
            console.log('Successfully decrypted QR code:', qrData.ticketId)
            const { data: ticketByQR } = await supabase
              .from('tickets')
              .select(`
                *,
                bookings (
                  user_name,
                  user_email,
                  events (
                    title,
                    date,
                    time
                  )
                )
              `)
              .eq('id', qrData.ticketId)
              .single()

            if (ticketByQR) {
              ticket = ticketByQR
            }
          }
        } catch (error) {
          console.log('QR decryption failed with qr-generator:', error instanceof Error ? error.message : String(error))
        }
      }

      // Method 4: Try qr-code decryption (legacy compatibility)
      if (!ticket) {
        try {
          const { decryptQRData } = await import('@/lib/qr-code')
          const qrData = await decryptQRData(ticketInput.trim())
          
          if (qrData) {
            console.log('Successfully decrypted QR code with legacy method:', qrData.ticketId)
            const { data: ticketByQR } = await supabase
              .from('tickets')
              .select(`
                *,
                bookings (
                  user_name,
                  user_email,
                  events (
                    title,
                    date,
                    time
                  )
                )
              `)
              .eq('id', qrData.ticketId)
              .single()

            if (ticketByQR) {
              ticket = ticketByQR
            }
          }
        } catch (error) {
          console.log('QR-code decryption failed:', error instanceof Error ? error.message : String(error))
        }
      }

      if (ticket) {
        setResult({
          success: true,
          message: `Ticket found and verified successfully`,
          ticket: {
            id: ticket.id,
            ticket_number: ticket.ticket_number,
            status: ticket.status,
            customer_name: ticket.bookings?.user_name,
            customer_email: ticket.bookings?.user_email,
            event_title: ticket.bookings?.events?.title,
            event_date: ticket.bookings?.events?.date,
            checked_in_at: ticket.checked_in_at
          }
        })
      } else {
        setResult({
          success: false,
          message: 'No ticket found with this ID/Number'
        })
      }

    } catch (error) {
      console.error('Verification error:', error)
      setResult({
        success: false,
        message: 'Error verifying ticket. Please try again.'
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleScanQR = () => {
    // This would open camera for QR scanning
    alert('QR Camera scanning will be implemented. For now, paste the QR code data in the input field.')
  }

  const getStatusIcon = () => {
    if (!result) return null
    
    if (result.success) {
      return <CheckCircle className="h-8 w-8 text-green-500" />
    } else {
      return <XCircle className="h-8 w-8 text-red-500" />
    }
  }

  const getStatusColor = () => {
    if (!result) return ''
    
    if (result.success) {
      return 'bg-green-50 border-green-200 text-green-800'
    } else {
      return 'bg-red-50 border-red-200 text-red-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop-Only Header */}
      <div className="bg-white shadow-sm border-b hidden lg:block">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <QrCode className="h-7 w-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ticket Verifier</h1>
              <p className="text-gray-600">Verify printed tickets and check booking details</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Verification Form */}
          <div className="lg:col-span-2 order-1 lg:order-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Verify Ticket</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter Booking ID, Ticket Number, or scan QR code
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={ticketInput}
                      onChange={(e) => setTicketInput(e.target.value)}
                      placeholder="Enter ID or scan QR"
                      className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                    />
                    <button
                      onClick={handleVerify}
                      disabled={isVerifying}
                      className="bg-blue-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium text-sm sm:text-base whitespace-nowrap"
                    >
                      {isVerifying ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span className="hidden sm:inline">Verifying...</span>
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4" />
                          <span className="hidden sm:inline">Verify</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={handleScanQR}
                    className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-gray-400 hover:text-gray-800 transition-colors"
                  >
                    <QrCode className="h-5 w-5" />
                    Click to scan QR code with camera
                  </button>
                </div>
              </div>

              {/* Verification Result */}
              {result && (
                <div className={`mt-6 p-4 rounded-lg border ${getStatusColor()}`}>
                  <div className="flex items-start gap-3">
                    {getStatusIcon()}
                    <div className="flex-1">
                      <p className="font-medium">{result.message}</p>
                      
                      {result.ticket && (
                        <div className="mt-3 space-y-2 text-sm">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                              <span className="font-medium text-xs sm:text-sm">Ticket Number:</span>
                              <p className="text-sm sm:text-base break-all">{result.ticket.ticket_number}</p>
                            </div>
                            <div>
                              <span className="font-medium text-xs sm:text-sm">Status:</span>
                              <p className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                                result.ticket.status === 'valid' 
                                  ? 'bg-green-100 text-green-800'
                                  : result.ticket.status === 'used'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {result.ticket.status}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium text-xs sm:text-sm">Customer:</span>
                              <p className="text-sm sm:text-base">{result.ticket.customer_name}</p>
                            </div>
                            <div>
                              <span className="font-medium text-xs sm:text-sm">Email:</span>
                              <p className="text-sm sm:text-base break-all">{result.ticket.customer_email}</p>
                            </div>
                            <div>
                              <span className="font-medium text-xs sm:text-sm">Event:</span>
                              <p className="text-sm sm:text-base">{result.ticket.event_title}</p>
                            </div>
                            <div>
                              <span className="font-medium text-xs sm:text-sm">Date:</span>
                              <p className="text-sm sm:text-base">{result.ticket.event_date}</p>
                            </div>
                          </div>
                          
                          {result.ticket.checked_in_at && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-blue-600" />
                                <span className="font-medium text-blue-800">
                                  Checked in: {new Date(result.ticket.checked_in_at).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4 sm:space-y-6 order-2 lg:order-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Quick Stats</h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">Today's Verifications</span>
                  <span className="font-medium text-sm sm:text-base">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">Total Recent</span>
                  <span className="font-medium text-sm sm:text-base">0</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Recent Check-ins</h3>
              {recentCheckins.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No recent check-ins</p>
              ) : (
                <div className="space-y-3">
                  {recentCheckins.map((checkin, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {checkin.ticket_number}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(checkin.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}