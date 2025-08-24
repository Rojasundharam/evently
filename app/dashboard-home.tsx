'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Calendar, 
  Ticket, 
  TrendingUp, 
  Users, 
  Plus,
  ArrowRight,
  Clock,
  MapPin,
  Star,
  Bell,
  Search,
  Filter,
  Sparkles
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, formatPrice } from '@/lib/utils'

interface DashboardStats {
  totalEvents: number
  myBookings: number
  upcomingEvents: number
  totalSpent: number
}

interface RecentEvent {
  id: string
  title: string
  date: string
  time: string
  venue: string
  image_url?: string
  price: number
}

interface RecentBooking {
  id: string
  event: {
    title: string
    date: string
    venue: string
    image_url?: string
  }
  quantity: number
  total_amount: number
  payment_status: string
}

export default function DashboardHome() {
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>('user')
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    myBookings: 0,
    upcomingEvents: 0,
    totalSpent: 0
  })
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([])
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Get user
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          // Get user role
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
          
          setUserRole(profile?.role || 'user')

          // Get stats
          const [eventsResult, bookingsResult] = await Promise.all([
            supabase.from('events').select('*', { count: 'exact' }),
            supabase.from('bookings').select('total_amount').eq('user_id', user.id)
          ])

          const totalEvents = eventsResult.count || 0
          const myBookings = bookingsResult.data?.length || 0
          const totalSpent = bookingsResult.data?.reduce((sum, booking) => sum + booking.total_amount, 0) || 0

          setStats({
            totalEvents,
            myBookings,
            upcomingEvents: totalEvents,
            totalSpent
          })

          // Get recent events
          const { data: events } = await supabase
            .from('events')
            .select('id, title, date, time, venue, image_url, price')
            .eq('status', 'published')
            .order('created_at', { ascending: false })
            .limit(4)

          setRecentEvents(events || [])

          // Get recent bookings
          const { data: bookings } = await supabase
            .from('bookings')
            .select(`
              id,
              quantity,
              total_amount,
              payment_status,
              events (
                title,
                date,
                venue,
                image_url
              )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(3)

          setRecentBookings(bookings || [])
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0b6d41]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm border-b lg:hidden">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#0b6d41] to-[#ffde59] rounded-xl flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {user ? `Hi, ${user.email?.split('@')[0]}!` : 'Evently'}
                </h1>
                <p className="text-sm text-gray-600">
                  {userRole === 'admin' ? 'Admin Dashboard' : 
                   userRole === 'organizer' ? 'Organizer Dashboard' : 
                   user ? 'Your Dashboard' : 'Welcome'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <Bell className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <Search className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="bg-white shadow-sm border-b hidden lg:block">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {user ? `Welcome back, ${user.email?.split('@')[0]}!` : 'Welcome to Evently'}
              </h1>
              <p className="text-gray-600 mt-2">
                {user ? 'Here\'s what\'s happening with your events' : 'Discover amazing events near you'}
              </p>
              {userRole && (
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    userRole === 'admin' ? 'bg-purple-100 text-purple-800' :
                    userRole === 'organizer' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {userRole.charAt(0).toUpperCase() + userRole.slice(1)} Account
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <button className="p-3 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors">
                <Bell className="h-6 w-6" />
              </button>
              <button className="p-3 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors">
                <Search className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6 max-w-7xl mx-auto">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6 lg:mb-8">
          <Link
            href="/events"
            className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 group"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center lg:flex-col lg:items-start gap-3 lg:gap-0">
                <Calendar className="h-6 w-6 lg:h-8 lg:w-8 text-[#0b6d41] lg:mb-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm lg:text-base">Browse Events</h3>
                  <p className="text-xs lg:text-sm text-gray-600 mt-0 lg:mt-1">Find events</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400 group-hover:text-[#0b6d41] transition-colors self-end lg:self-auto mt-2 lg:mt-0" />
            </div>
          </Link>

          <Link
            href="/bookings"
            className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 group"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center lg:flex-col lg:items-start gap-3 lg:gap-0">
                <Ticket className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600 lg:mb-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm lg:text-base">My Bookings</h3>
                  <p className="text-xs lg:text-sm text-gray-600 mt-0 lg:mt-1">View tickets</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400 group-hover:text-blue-600 transition-colors self-end lg:self-auto mt-2 lg:mt-0" />
            </div>
          </Link>

          {(userRole === 'organizer' || userRole === 'admin') && (
            <Link
              href="/events/create"
              className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 group"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center lg:flex-col lg:items-start gap-3 lg:gap-0">
                  <Plus className="h-6 w-6 lg:h-8 lg:w-8 text-green-600 lg:mb-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm lg:text-base">Create Event</h3>
                    <p className="text-xs lg:text-sm text-gray-600 mt-0 lg:mt-1">Host event</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400 group-hover:text-green-600 transition-colors self-end lg:self-auto mt-2 lg:mt-0" />
              </div>
            </Link>
          )}

          {userRole === 'admin' && (
            <Link
              href="/admin/analytics"
              className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 group"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center lg:flex-col lg:items-start gap-3 lg:gap-0">
                  <TrendingUp className="h-6 w-6 lg:h-8 lg:w-8 text-purple-600 lg:mb-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm lg:text-base">Analytics</h3>
                    <p className="text-xs lg:text-sm text-gray-600 mt-0 lg:mt-1">View stats</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400 group-hover:text-purple-600 transition-colors self-end lg:self-auto mt-2 lg:mt-0" />
              </div>
            </Link>
          )}
        </div>

        {/* Stats Cards */}
        {user && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-8">
            <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm font-medium text-gray-600">Total Events</p>
                  <p className="text-xl lg:text-3xl font-bold text-gray-900 mt-1 lg:mt-2">{stats.totalEvents}</p>
                </div>
                <div className="bg-[#0b6d41]/10 p-2 lg:p-2.5 rounded-xl">
                  <Calendar className="h-5 w-5 lg:h-6 lg:w-6 text-[#0b6d41]" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm font-medium text-gray-600">My Bookings</p>
                  <p className="text-xl lg:text-3xl font-bold text-gray-900 mt-1 lg:mt-2">{stats.myBookings}</p>
                </div>
                <div className="bg-blue-600/10 p-2 lg:p-2.5 rounded-xl">
                  <Ticket className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm font-medium text-gray-600">Upcoming</p>
                  <p className="text-xl lg:text-3xl font-bold text-gray-900 mt-1 lg:mt-2">{stats.upcomingEvents}</p>
                </div>
                <div className="bg-orange-600/10 p-2 lg:p-2.5 rounded-xl">
                  <Clock className="h-5 w-5 lg:h-6 lg:w-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm font-medium text-gray-600">Total Spent</p>
                  <p className="text-xl lg:text-3xl font-bold text-gray-900 mt-1 lg:mt-2">₹{formatPrice(stats.totalSpent)}</p>
                </div>
                <div className="bg-green-600/10 p-2 lg:p-2.5 rounded-xl">
                  <TrendingUp className="h-5 w-5 lg:h-6 lg:w-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Recent Events */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-4 lg:p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg lg:text-xl font-semibold text-gray-900">Recent Events</h2>
                <Link
                  href="/events"
                  className="text-[#0b6d41] hover:text-[#0a5d37] font-medium text-xs lg:text-sm flex items-center gap-1"
                >
                  View all
                  <ArrowRight className="h-3 w-3 lg:h-4 lg:w-4" />
                </Link>
              </div>
            </div>
            <div className="p-4 lg:p-6">
              <div className="space-y-4">
                {recentEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-[#0b6d41] to-[#ffde59] rounded-xl flex items-center justify-center">
                      {event.image_url ? (
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <Calendar className="h-8 w-8 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate group-hover:text-[#0b6d41] transition-colors">
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDate(event.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {event.venue}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatPrice(event.price)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Bookings */}
          {user && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">My Recent Bookings</h2>
                  <Link
                    href="/bookings"
                    className="text-[#0b6d41] hover:text-[#0a5d37] font-medium text-sm flex items-center gap-1"
                  >
                    View all
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentBookings.length > 0 ? (
                    recentBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center gap-4 p-4 rounded-xl bg-gray-50"
                      >
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                          {booking.event?.image_url ? (
                            <img
                              src={booking.event.image_url}
                              alt={booking.event.title}
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            <Ticket className="h-8 w-8 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {booking.event?.title}
                          </h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <span>{booking.quantity} ticket{booking.quantity > 1 ? 's' : ''}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              booking.payment_status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : booking.payment_status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {booking.payment_status}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatPrice(booking.total_amount)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No bookings yet</p>
                      <Link
                        href="/events"
                        className="text-[#0b6d41] hover:text-[#0a5d37] font-medium text-sm mt-2 inline-block"
                      >
                        Browse events to get started
                      </Link>
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
