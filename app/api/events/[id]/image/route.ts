import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: eventId } = await params

    // Get image from database
    const { data: imageData, error } = await supabase
      .rpc('get_event_image', {
        p_event_id: eventId
      })
      .single()

    if (error || !imageData) {
      // Fallback to checking the events table image_url
      const { data: event } = await supabase
        .from('events')
        .select('image_url')
        .eq('id', eventId)
        .single()

      if (event?.image_url) {
        // Redirect to external URL if available
        return NextResponse.redirect(event.image_url)
      }

      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageData.image_data, 'base64')
    
    // Return image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': imageData.image_type || 'image/jpeg',
        'Content-Length': imageBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })

  } catch (error) {
    console.error('Error fetching event image:', error)
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 }
    )
  }
}