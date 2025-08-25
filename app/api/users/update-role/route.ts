import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if current user is admin
    const { data: currentUserProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (currentUserProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    // Get request body
    const body = await request.json()
    const { userId, newRole } = body

    // Validate input
    if (!userId || !newRole) {
      return NextResponse.json(
        { error: 'Missing userId or newRole' },
        { status: 400 }
      )
    }

    // Validate role value
    const validRoles = ['user', 'organizer', 'admin']
    if (!validRoles.includes(newRole)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be user, organizer, or admin' },
        { status: 400 }
      )
    }

    // Prevent removing the last admin
    if (newRole !== 'admin') {
      const { data: adminCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('role', 'admin')

      if (adminCount && adminCount.length <= 1) {
        const { data: targetUser } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single()

        if (targetUser?.role === 'admin') {
          return NextResponse.json(
            { error: 'Cannot remove the last admin' },
            { status: 400 }
          )
        }
      }
    }

    // Update user role
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user role:', error)
      return NextResponse.json(
        { error: 'Failed to update user role' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      user: data,
      message: `User role updated to ${newRole}` 
    })
  } catch (error) {
    console.error('Error in update-role API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}