import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { eventFormSchema } from '@/lib/validations/event'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('events')
      .select(`
        *,
        profiles!organizer_id (
          id,
          email,
          full_name
        )
      `)
      .eq('status', 'published')
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true })
      .range(offset, offset + limit - 1)

    // Apply category filter if provided
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    const { data: events, error } = await query

    if (error) {
      console.error('Error fetching events:', error)
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      )
    }

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user profile exists, if not create one
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      // Create profile if it doesn't exist
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
        })

      if (profileError) {
        console.error('Error creating profile:', profileError)
        return NextResponse.json(
          { error: 'Failed to create user profile. Please try again.' },
          { status: 500 }
        )
      }
    }

    // Parse and validate request body
    const body = await request.json()
    console.log('Request body:', body)
    
    const validatedData = eventFormSchema.parse(body)

    // Create event
    const { data: event, error: createError } = await supabase
      .from('events')
      .insert({
        ...validatedData,
        organizer_id: user.id,
        status: 'published'
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating event:', createError)
      console.error('Event data:', { ...validatedData, organizer_id: user.id })
      return NextResponse.json(
        { error: `Failed to create event: ${createError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      console.error('Validation error:', error)
      return NextResponse.json(
        { error: 'Invalid event data', details: error },
        { status: 400 }
      )
    }
    
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
