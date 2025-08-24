import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateQRCode, generateTicketNumber, TicketData } from '@/lib/qr-generator'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile with role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    const userRole = profile?.role || 'user'

    const { bookingId } = await request.json()
    
    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      )
    }

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        events (*)
      `)
      .eq('id', bookingId)
      .eq('user_id', user.id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    if (booking.payment_status !== 'completed') {
      return NextResponse.json(
        { error: 'Payment not completed for this booking' },
        { status: 400 }
      )
    }

    const { data: existingTickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('*')
      .eq('booking_id', bookingId)

    if (existingTickets && existingTickets.length > 0) {
      const ticketsWithQR = await Promise.all(
        existingTickets.map(async (ticket) => {
          const ticketData: TicketData = {
            ticketId: ticket.id,
            eventId: ticket.event_id,
            bookingId: ticket.booking_id,
            userId: user.id,
            ticketNumber: ticket.ticket_number,
            ticketType: ticket.ticket_type,
            eventDate: booking.events.date,
          }
          
          const qrCode = await generateQRCode(ticketData)
          
          return {
            ...ticket,
            qr_code_image: qrCode,
            event: booking.events
          }
        })
      )
      
      return NextResponse.json({ 
        tickets: ticketsWithQR,
        message: 'Tickets already exist for this booking' 
      })
    }

    const tickets = []
    for (let i = 0; i < booking.quantity; i++) {
      const ticketNumber = generateTicketNumber(booking.event_id)
      
      const ticketData: TicketData = {
        ticketId: `temp-${i}`,
        eventId: booking.event_id,
        bookingId: bookingId,
        userId: user.id,
        ticketNumber: ticketNumber,
        ticketType: 'General Admission',
        eventDate: booking.events.date,
      }
      
      const qrCodeData = await generateQRCode(ticketData)
      
      const { data: newTicket, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          booking_id: bookingId,
          event_id: booking.event_id,
          ticket_number: ticketNumber,
          qr_code: ticketNumber,
          status: 'valid',
          ticket_type: 'General Admission',
          metadata: {
            user_name: booking.user_name,
            user_email: booking.user_email,
            user_role: userRole,
            generated_at: new Date().toISOString(),
            generated_by: user.id
          }
        })
        .select()
        .single()

      if (ticketError) {
        console.error('Error creating ticket:', ticketError)
        continue
      }

      ticketData.ticketId = newTicket.id
      const finalQRCode = await generateQRCode(ticketData)
      
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ qr_code: newTicket.id })
        .eq('id', newTicket.id)

      tickets.push({
        ...newTicket,
        qr_code_image: finalQRCode,
        event: booking.events
      })
    }

    return NextResponse.json({ 
      tickets,
      message: 'Tickets generated successfully' 
    })

  } catch (error) {
    console.error('Error generating tickets:', error)
    return NextResponse.json(
      { error: 'Failed to generate tickets' },
      { status: 500 }
    )
  }
}