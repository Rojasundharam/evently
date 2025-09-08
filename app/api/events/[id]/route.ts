import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = await createClient()
    
    const { data: event, error } = await supabase
      .from('events')
      .select(`
        *,
        organizer:profiles!organizer_id (
          id,
          email,
          full_name
        )
      `)
      .eq('id', id)
      .single()

    if (error || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Map start_date back to date for frontend compatibility
    const formattedEvent = {
      ...event,
      date: event.start_date // Add date field for backward compatibility
    }

    return NextResponse.json({ event: formattedEvent })
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user owns the event
    const { data: existingEvent } = await supabase
      .from('events')
      .select('organizer_id')
      .eq('id', id)
      .single()

    if (!existingEvent || existingEvent.organizer_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Update event
    const body = await request.json()
    
    // Extract special fields from body
    const { 
      seat_config, 
      ticket_template, 
      date, // Extract date field
      ...eventData 
    } = body
    
    // Prepare update data with proper column mapping
    const updateData: any = {
      ...eventData,
      ticket_template: ticket_template || null, // Include ticket_template as it's a column
      updated_at: new Date().toISOString()
    }
    
    // Map date to start_date if present
    if (date !== undefined) {
      updateData.start_date = date
      updateData.end_date = date // Also update end_date to match
    }
    
    // Update the main event data
    const { data: event, error: updateError } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating event:', updateError)
      return NextResponse.json(
        { error: `Failed to update event: ${updateError.message}` },
        { status: 500 }
      )
    }

    // Handle seat configuration update if provided
    if (seat_config && seat_config.enabled) {
      // Check if seat config exists
      const { data: existingSeatConfig } = await supabase
        .from('event_seat_config')
        .select('id')
        .eq('event_id', id)
        .single()

      if (existingSeatConfig) {
        // Update existing seat config
        await supabase
          .from('event_seat_config')
          .update({
            has_seat_allocation: seat_config.enabled,
            total_seats: seat_config.totalSeats,
            seat_layout_type: seat_config.layoutType,
            updated_at: new Date().toISOString()
          })
          .eq('event_id', id)
      } else {
        // Create new seat config
        await supabase
          .from('event_seat_config')
          .insert({
            event_id: id,
            has_seat_allocation: seat_config.enabled,
            total_seats: seat_config.totalSeats,
            seat_layout_type: seat_config.layoutType
          })
      }
    }

    return NextResponse.json({ event })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user owns the event
    const { data: existingEvent } = await supabase
      .from('events')
      .select('organizer_id')
      .eq('id', id)
      .single()

    if (!existingEvent || existingEvent.organizer_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Delete event
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting event:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete event' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
