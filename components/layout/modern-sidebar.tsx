'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Calendar, 
  Ticket, 
  CreditCard, 
  User as UserIcon,
  Menu,
  X,
  Plus,
  BarChart3,
  Sparkles,
  Users,
  Settings,
  ChevronDown,
  Mail,
  LogOut
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

// Navigation items for different user types
const guestNavigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Events', href: '/events', icon: Calendar },
]

const userNavigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Events', href: '/events', icon: Calendar },
  { name: 'My Bookings', href: '/bookings', icon: Ticket },
]

const organizerNavigation = [
  { name: 'My Events', href: '/organizer/my-events', icon: Calendar },
  { name: 'Payments', href: '/payments', icon: CreditCard },
]

const adminNavigation = [
  { name: 'Admin Users', href: '/admin/users', icon: Users },
  { name: 'Admin Payments', href: '/admin/payments', icon: CreditCard },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
]

interface ModernSidebarProps {
  children: React.ReactNode
}

export default function ModernSidebar({ children }: ModernSidebarProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        if (user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
          
          const role = profile?.role || 'user'
          setUserRole(role)
        } else {
          setUserRole(null)
        }
      } catch (error) {
        console.error('Error checking user:', error)
        setUser(null)
        setUserRole(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setIsLoading(true)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()
          
          const role = profile?.role || 'user'
          setUserRole(role)
        } catch (error) {
          console.error('Error fetching user role:', error)
          setUserRole('user')
        }
      } else {
        setUserRole(null)
      }
      
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Get navigation based on user role
  const getNavigation = () => {
    if (isLoading || !mounted) {
      return guestNavigation
    }
    
    if (!user) return guestNavigation
    
    let navigation = [...userNavigation]
    
    if (userRole === 'organizer' || userRole === 'admin') {
      navigation = [...navigation, ...organizerNavigation]
    }
    
    if (userRole === 'admin') {
      navigation = [...navigation, ...adminNavigation]
    }
    
    return navigation
  }

  const navigation = getNavigation()

  // Google Sign In function
  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    
    if (error) {
      console.error('Error signing in:', error)
    }
  }

  // Sign Out function
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
    }
    setShowProfileMenu(false)
  }

  return (
    <>
      {/* Mobile menu button - Hidden since mobile uses bottom navigation */}
      <div className="hidden lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-white shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          {sidebarOpen ? (
            <X className="h-5 w-5 text-gray-600" />
          ) : (
            <Menu className="h-5 w-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex h-screen relative">
        <div className={`${desktopSidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col`}>
          
          {/* Logo Section */}
          <div className="p-4 border-b border-gray-100">
            {desktopSidebarOpen ? (
              <div className="flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#0b6d41] rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900">Evently</h1>
                    <p className="text-xs text-gray-500">Event Platform</p>
                  </div>
                </Link>
                <button
                  onClick={() => setDesktopSidebarOpen(false)}
                  className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setDesktopSidebarOpen(true)}
                className="w-8 h-8 bg-[#0b6d41] rounded-lg flex items-center justify-center hover:bg-[#0a5d37] transition-colors"
              >
                <Menu className="w-4 w-4 text-white" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-1">
              {isLoading ? (
                // Loading skeleton
                [...Array(3)].map((_, index) => (
                  <li key={index}>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-100 animate-pulse">
                      <div className="w-5 h-5 bg-gray-300 rounded"></div>
                      {desktopSidebarOpen && <div className="h-4 bg-gray-300 rounded flex-1"></div>}
                    </div>
                  </li>
                ))
              ) : (
                navigation.map((item) => {
                  const isActive = pathname === item.href || 
                    (item.href !== '/' && pathname.startsWith(item.href))
                  
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-[#0b6d41] text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {desktopSidebarOpen && (
                          <span className="font-medium">{item.name}</span>
                        )}
                      </Link>
                    </li>
                  )
                })
              )}
            </ul>
          </nav>

          {/* Create Event Button */}
          {!isLoading && desktopSidebarOpen && (
            <div className="p-4 border-t border-gray-100">
              {(userRole === 'organizer' || userRole === 'admin') ? (
                <Link
                  href="/events/create"
                  className="w-full flex items-center justify-center gap-2 p-3 bg-[#0b6d41] text-white rounded-lg hover:bg-[#0a5d37] transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Event</span>
                </Link>
              ) : user && userRole === 'user' ? (
                <Link
                  href="/profile/upgrade-to-organizer"
                  className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <UserIcon className="h-4 w-4" />
                  <span>Become Organizer</span>
                </Link>
              ) : (
                <button
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-[#0b6d41] text-white rounded-lg hover:bg-[#0a5d37] transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  <span>Sign in with Google</span>
                </button>
              )}
            </div>
          )}

          {/* Profile Menu */}
          {!isLoading && user && desktopSidebarOpen && (
            <div className="p-4 border-t border-gray-100">
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-[#0b6d41] rounded-full flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-gray-900">
                      {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {userRole || 'user'}
                    </div>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown */}
                {showProfileMenu && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                    <Link
                      href="/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">Profile Settings</span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      <LogOut className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-600">Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed left-0 top-0 h-full w-64 bg-white shadow-xl transform transition-transform duration-300 z-50 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        {/* Mobile Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#0b6d41] rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Evently</h1>
              <p className="text-xs text-gray-500">Event Platform</p>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="p-4 flex-1">
          <ul className="space-y-1">
            {isLoading ? (
              // Loading skeleton
              [...Array(3)].map((_, index) => (
                <li key={index}>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-100 animate-pulse">
                    <div className="w-5 h-5 bg-gray-300 rounded"></div>
                    <div className="h-4 bg-gray-300 rounded flex-1"></div>
                  </div>
                </li>
              ))
            ) : (
              navigation.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/' && pathname.startsWith(item.href))
                
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-[#0b6d41] text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </li>
                )
              })
            )}
          </ul>
        </nav>

        {/* Mobile Action Buttons */}
        {!isLoading && (
          <div className="p-4 border-t border-gray-100 space-y-3">
            {(userRole === 'organizer' || userRole === 'admin') ? (
              <Link
                href="/events/create"
                onClick={() => setSidebarOpen(false)}
                className="w-full flex items-center justify-center gap-2 p-3 bg-[#0b6d41] text-white rounded-lg hover:bg-[#0a5d37] transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Create Event</span>
              </Link>
            ) : user && userRole === 'user' ? (
              <Link
                href="/profile/upgrade-to-organizer"
                onClick={() => setSidebarOpen(false)}
                className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <UserIcon className="h-4 w-4" />
                <span>Become Organizer</span>
              </Link>
            ) : (
              <button
                onClick={() => {
                  handleGoogleSignIn()
                  setSidebarOpen(false)
                }}
                className="w-full flex items-center justify-center gap-2 p-3 bg-[#0b6d41] text-white rounded-lg hover:bg-[#0a5d37] transition-colors"
              >
                <Mail className="h-4 w-4" />
                <span>Sign in with Google</span>
              </button>
            )}

            {/* Mobile Profile Menu */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-[#0b6d41] rounded-full flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-gray-900">
                      {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {userRole || 'user'}
                    </div>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Mobile Profile Dropdown */}
                {showProfileMenu && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                    <Link
                      href="/profile"
                      onClick={() => {
                        setShowProfileMenu(false)
                        setSidebarOpen(false)
                      }}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">Profile Settings</span>
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut()
                        setSidebarOpen(false)
                      }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      <LogOut className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-600">Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Content */}
      <div className="lg:hidden pt-16">
        {children}
      </div>
    </>
  )
}
