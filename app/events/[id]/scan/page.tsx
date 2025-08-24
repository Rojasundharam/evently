'use client'

import { useEffect, useState, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { 
  QrCode, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  User, 
  Ticket,
  Calendar,
  Clock,
  ArrowLeft,
  Users,
  Scan
} from 'lucide-react'
import Link from 'next/link'

interface ScanResult {
  success: boolean
  message: string
  scan_result: 'success' | 'already_used' | 'invalid' | 'expired' | 'wrong_event' | 'cancelled'
  ticket_info?: {
    ticket_number: string
    customer_name: string
    customer_email?: string
    event_title?: string
    seat_number?: string
    checked_in_at?: string
  }
}

export default function ScanTicketsPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [event, setEvent] = useState<any>(null)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [manualCode, setManualCode] = useState('')
  const [stats, setStats] = useState({
    totalScanned: 0,
    successfulScans: 0,
    duplicateScans: 0,
    invalidScans: 0,
    totalTickets: 0,
    checkedInTickets: 0
  })
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const supabase = createClient()

  useEffect(() => {
    checkAuthorization()
    fetchEvent()
    loadTicketStats()
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error)
      }
    }
  }, [eventId])

  const checkAuthorization = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/signin')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'admin' || profile?.role === 'organizer') {
        setIsAuthorized(true)
      } else {
        const { data: staffMember } = await supabase
          .from('event_staff')
          .select('*')
          .eq('event_id', eventId)
          .eq('user_id', user.id)
          .single()

        if (staffMember) {
          setIsAuthorized(true)
        }
      }
    } catch (error) {
      console.error('Error checking authorization:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEvent = async () => {
    try {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (data) {
        setEvent(data)
      }
    } catch (error) {
      console.error('Error fetching event:', error)
    }
  }

  const loadTicketStats = async () => {
    try {
      const { data: tickets } = await supabase
        .from('tickets')
        .select('status')
        .eq('event_id', eventId)

      if (tickets) {
        setStats(prev => ({
          ...prev,
          totalTickets: tickets.length,
          checkedInTickets: tickets.filter(t => t.status === 'used').length
        }))
      }
    } catch (error) {
      console.error('Error loading ticket stats:', error)
    }
  }

  const startScanning = async () => {
    try {
      const html5QrCode = new Html5Qrcode("qr-reader")
      scannerRef.current = html5QrCode

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        async (decodedText) => {
          await handleScan(decodedText)
          html5QrCode.stop()
          setIsScanning(false)
        },
        (errorMessage) => {
          console.log(errorMessage)
        }
      )
      
      setIsScanning(true)
    } catch (error) {
      console.error("Error starting scanner:", error)
      alert("Unable to access camera. Please ensure you've granted camera permissions or use manual code entry.")
    }
  }

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop()
        .then(() => {
          setIsScanning(false)
        })
        .catch(console.error)
    }
  }

  const handleScan = async (qrCode: string) => {
    try {
      const response = await fetch('/api/tickets/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode, eventId })
      })

      const result: ScanResult = await response.json()
      setScanResult(result)

      setStats(prev => ({
        ...prev,
        totalScanned: prev.totalScanned + 1,
        successfulScans: result.scan_result === 'success' ? prev.successfulScans + 1 : prev.successfulScans,
        duplicateScans: result.scan_result === 'already_used' ? prev.duplicateScans + 1 : prev.duplicateScans,
        invalidScans: result.scan_result === 'invalid' ? prev.invalidScans + 1 : prev.invalidScans,
        checkedInTickets: result.scan_result === 'success' ? prev.checkedInTickets + 1 : prev.checkedInTickets
      }))

      setTimeout(() => {
        setScanResult(null)
      }, 5000)
    } catch (error) {
      console.error('Error validating ticket:', error)
      setScanResult({
        success: false,
        message: 'Error validating ticket',
        scan_result: 'invalid'
      })
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualCode.trim()) {
      handleScan(manualCode.trim())
      setManualCode('')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ffde59]"></div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You are not authorized to scan tickets for this event.</p>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-[#0b6d41] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Events
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href={`/events/${eventId}/dashboard`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <QrCode className="h-8 w-8 text-[#ffde59]" />
            Ticket Scanner
          </h1>
          {event && (
            <p className="text-gray-600 mt-2">{event.title} - {new Date(event.date).toLocaleDateString()}</p>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-md">
            <p className="text-sm text-gray-600">Progress</p>
            <p className="text-2xl font-bold text-gray-900">{stats.checkedInTickets}/{stats.totalTickets}</p>
            <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#0b6d41] h-full transition-all duration-300"
                style={{ width: `${(stats.checkedInTickets / stats.totalTickets) * 100 || 0}%` }}
              />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md">
            <p className="text-sm text-gray-600">Session Scans</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalScanned}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md">
            <p className="text-sm text-gray-600">Successful</p>
            <p className="text-2xl font-bold text-green-600">{stats.successfulScans}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md">
            <p className="text-sm text-gray-600">Duplicates</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.duplicateScans}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md">
            <p className="text-sm text-gray-600">Invalid</p>
            <p className="text-2xl font-bold text-red-600">{stats.invalidScans}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <Scan className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <h2 className="text-xl font-semibold">Scan Ticket QR Code</h2>
            <p className="text-gray-600">Point camera at QR code or enter code manually</p>
          </div>

          <div className="mb-6">
            {!isScanning ? (
              <button
                onClick={startScanning}
                className="w-full inline-flex items-center justify-center gap-3 bg-gradient-to-r from-[#ffde59] to-[#f5c842] text-[#0b6d41] px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all"
              >
                <QrCode className="h-6 w-6" />
                Start Camera Scanner
              </button>
            ) : (
              <button
                onClick={stopScanning}
                className="w-full inline-flex items-center justify-center gap-3 bg-red-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-red-600 transition-all"
              >
                Stop Scanning
              </button>
            )}
          </div>

          <div id="qr-reader" className="mx-auto mb-6" style={{ width: '100%', maxWidth: '500px' }}></div>

          <div className="border-t pt-6">
            <p className="text-sm text-gray-600 text-center mb-4">Or enter ticket code manually:</p>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Enter ticket code or QR data"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffde59] focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="px-6 py-2 bg-[#0b6d41] text-white rounded-lg font-semibold hover:bg-[#0a5d37] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Validate
              </button>
            </form>
          </div>

          {scanResult && (
            <div className={`mt-6 p-6 rounded-xl animate-slide-in ${
              scanResult.success 
                ? 'bg-green-50 border-2 border-green-500' 
                : scanResult.scan_result === 'already_used'
                ? 'bg-yellow-50 border-2 border-yellow-500'
                : 'bg-red-50 border-2 border-red-500'
            }`}>
              <div className="flex items-start gap-4">
                {scanResult.success ? (
                  <CheckCircle className="h-8 w-8 text-green-500 flex-shrink-0" />
                ) : scanResult.scan_result === 'already_used' ? (
                  <AlertCircle className="h-8 w-8 text-yellow-500 flex-shrink-0" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-500 flex-shrink-0" />
                )}
                
                <div className="flex-1">
                  <h3 className={`text-lg font-bold mb-2 ${
                    scanResult.success 
                      ? 'text-green-900' 
                      : scanResult.scan_result === 'already_used'
                      ? 'text-yellow-900'
                      : 'text-red-900'
                  }`}>
                    {scanResult.message}
                  </h3>
                  
                  {scanResult.ticket_info && (
                    <div className="space-y-2 text-sm">
                      {scanResult.ticket_info.customer_name && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-semibold">{scanResult.ticket_info.customer_name}</span>
                        </div>
                      )}
                      {scanResult.ticket_info.ticket_number && (
                        <div className="flex items-center gap-2">
                          <Ticket className="h-4 w-4 text-gray-500" />
                          <span className="font-mono">{scanResult.ticket_info.ticket_number}</span>
                        </div>
                      )}
                      {scanResult.ticket_info.seat_number && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Seat:</span>
                          <span className="font-semibold">{scanResult.ticket_info.seat_number}</span>
                        </div>
                      )}
                      {scanResult.ticket_info.checked_in_at && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">
                            Already checked in at {new Date(scanResult.ticket_info.checked_in_at).toLocaleString()}
                          </span>
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
    </div>
  )
}