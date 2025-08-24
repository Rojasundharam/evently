'use client'

import { useEffect, useState } from 'react'
import { Calendar, MapPin, Clock, User, Ticket } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'
// Lazy load QR code generation
const generateQRCodeDataURL = async (data: string) => {
  const { generateQRCodeDataURL: qrGen } = await import('@/lib/qr-code')
  return qrGen(data)
}

// Lazy load heavy PDF generation
const generatePDF = async () => {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf')
  ])
  return { html2canvas, jsPDF }
}

interface TicketData {
  id: string
  ticket_number: string
  qr_code: string
  event: {
    title: string
    date: string
    time: string
    venue: string
    location: string
  }
  booking: {
    user_name: string
    user_email: string
  }
}

interface TicketTemplateProps {
  ticket: TicketData
  onDownload?: () => void
}

export default function TicketTemplate({ ticket, onDownload }: TicketTemplateProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')

  useEffect(() => {
    // Generate QR code
    generateQRCodeDataURL(ticket.qr_code).then(setQrCodeUrl).catch(console.error)
  }, [ticket.qr_code])

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = async () => {
    try {
      // Dynamic import to avoid SSR issues
      const html2canvas = (await import('html2canvas')).default
      const jsPDF = (await import('jspdf')).default

      const element = document.getElementById(`ticket-${ticket.id}`)
      if (!element) return

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff'
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [200, 100] // Ticket size
      })

      pdf.addImage(imgData, 'PNG', 0, 0, 200, 100)
      pdf.save(`ticket-${ticket.ticket_number}.pdf`)

      onDownload?.()
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try printing instead.')
    }
  }

  return (
    <>
      {/* Ticket Container */}
      <div
        id={`ticket-${ticket.id}`}
        className="bg-white border-2 border-gray-300 rounded-lg shadow-lg max-w-2xl mx-auto overflow-hidden print:shadow-none"
      >
        <div className="flex flex-col md:flex-row">
          {/* Left Section - Event Details */}
          <div className="flex-1 p-6 border-r-2 border-dashed border-gray-300">
            <div className="mb-4">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Ticket className="h-5 w-5" />
                <span className="text-sm font-semibold">EVENT TICKET</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{ticket.event.title}</h2>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-gray-700">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>{formatDate(ticket.event.date)}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>{formatTime(ticket.event.time)}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <MapPin className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="font-semibold">{ticket.event.venue}</div>
                  <div className="text-gray-600">{ticket.event.location}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <User className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="font-semibold">{ticket.booking.user_name}</div>
                  <div className="text-gray-600">{ticket.booking.user_email}</div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500">Ticket Number</div>
              <div className="font-mono text-sm font-semibold">{ticket.ticket_number}</div>
            </div>
          </div>

          {/* Right Section - QR Code */}
          <div className="w-full md:w-48 p-6 flex flex-col items-center justify-center bg-gray-50">
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="Ticket QR Code" className="w-40 h-40" />
            ) : (
              <div className="w-40 h-40 bg-gray-200 animate-pulse rounded" />
            )}
            <p className="text-xs text-gray-600 mt-2 text-center">
              Scan this code at the venue
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 px-6 py-3 text-xs text-gray-600 flex justify-between items-center">
          <span>Powered by Evently</span>
          <span>Valid for one-time entry only</span>
        </div>
      </div>

      {/* Action Buttons (not printed) */}
      <div className="mt-6 flex justify-center gap-4 print:hidden">
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Print Ticket
        </button>
        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Download PDF
        </button>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #ticket-${ticket.id}, #ticket-${ticket.id} * {
            visibility: visible;
          }
          #ticket-${ticket.id} {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </>
  )
}
