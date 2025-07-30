'use client'

import React, { useEffect, useState } from 'react'
import { 
  ArrowRight, 
  ArrowLeft, 
  Plus, 
  Search, 
  Activity, 
  Target, 
  Lightbulb, 
  MessageSquare, 
  Trophy, 
  User, 
  Star, 
  Users,
  X
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useTheme } from '@/lib/theme'
import { useUserPresence } from '@/lib/hooks/useUserPresence'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface EnhancedSidebarProps {
  isSidebarCollapsed: boolean
  setIsSidebarCollapsed: (collapsed: boolean) => void
  currentPath: string
}

// Magic Navigation Item Component
interface MagicNavItemProps {
  icon: React.ComponentType<any>
  label: string
  href: string
  isActive: boolean
  isCollapsed: boolean
  isDarkMode: boolean
  gradient?: string
  activeGradient?: string
}

const MagicNavItem: React.FC<MagicNavItemProps> = ({
  icon: Icon,
  label,
  href,
  isActive,
  isCollapsed,
  isDarkMode,
  gradient = 'from-blue-500 to-purple-600',
  activeGradient = 'from-indigo-600/20 to-purple-600/20'
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  return (
    <Link href={href}>
      <div 
        className={`relative flex items-center ${isCollapsed ? 'justify-center px-2 py-4 mx-2' : 'space-x-3 px-4 py-3.5'} rounded-xl transition-all duration-300 group overflow-hidden cursor-pointer`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={handleMouseMove}
        title={isCollapsed ? label : ''}
      >
        {/* Magic spotlight effect */}
        {isHovered && !isActive && (
          <div
            className="absolute pointer-events-none opacity-20 transition-opacity duration-300"
            style={{
              background: `radial-gradient(300px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(139, 92, 246, 0.15), transparent 40%)`,
              left: 0,
              top: 0,
              right: 0,
              bottom: 0,
            }}
          />
        )}

        {/* Active background with enhanced gradient */}
        {isActive && (
          <>
            <div className={`absolute inset-0 ${isDarkMode ? `bg-gradient-to-r ${activeGradient}` : `bg-gradient-to-r from-indigo-50 to-purple-50`} rounded-xl`} />
            <div className={`absolute inset-0 border border-gradient-to-r ${gradient} rounded-xl opacity-30`} />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500 rounded-r-full" />
            
            {/* Active glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/5 to-transparent animate-pulse" />
          </>
        )}
        
        {/* Hover background effect */}
        {!isActive && (
          <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-r from-gray-800/0 via-gray-700/30 to-gray-800/0' : 'bg-gradient-to-r from-gray-50/0 via-gray-100/50 to-gray-50/0'} opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl`} />
        )}
        
        {/* Border glow on hover */}
        {isHovered && !isActive && (
          <div className={`absolute inset-0 border border-gradient-to-r ${gradient} opacity-20 rounded-xl transition-opacity duration-300`} />
        )}
        
        {/* Content */}
        <div className={`relative flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3 flex-1'} z-10`}>
          <div className={`${isActive ? 'text-indigo-500' : isDarkMode ? 'text-gray-400' : 'text-gray-600'} group-hover:${isActive ? 'text-indigo-500' : 'text-indigo-400'} transition-all duration-300 ${isHovered ? 'scale-110' : ''}`}>
            <Icon className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <>
              <span className={`font-medium text-sm ${
                isActive 
                  ? isDarkMode ? 'text-white' : 'text-gray-900' 
                  : isDarkMode ? 'text-gray-300' : 'text-gray-700'
              } group-hover:${isActive ? '' : isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                {label}
              </span>
              {isActive && (
                <div className="ml-auto">
                  <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse shadow-lg" />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Link>
  )
}

// Magic User Profile Card Component
interface MagicUserProfileProps {
  user: any
  profile: any
  isDarkMode: boolean
  isCollapsed: boolean
  userStatus: 'online' | 'offline'
}

const MagicUserProfile: React.FC<MagicUserProfileProps> = ({ user, profile, isDarkMode, isCollapsed, userStatus }) => {
  const [isHovered, setIsHovered] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  if (isCollapsed) return null

  return (
    <div 
      className={`relative px-4 py-3 rounded-xl border transition-all duration-300 overflow-hidden group ${
        isDarkMode 
          ? 'bg-gradient-to-br from-slate-800/60 via-slate-700/40 to-slate-800/60 border-slate-600/30' 
          : 'bg-gradient-to-br from-white via-gray-50/50 to-white border-gray-200/50'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
    >
      {/* Magic spotlight effect */}
      {isHovered && (
        <div
          className="absolute pointer-events-none opacity-20 transition-opacity duration-300"
          style={{
            background: `radial-gradient(200px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(139, 92, 246, 0.2), transparent 40%)`,
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
          }}
        />
      )}

      {/* Border glow on hover */}
      {isHovered && (
        <div className="absolute inset-0 border border-purple-500/30 rounded-xl transition-opacity duration-300" />
      )}
      
      <div className="relative flex items-center space-x-3 z-10">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full blur-sm opacity-60 group-hover:opacity-80 transition-opacity" />
          <div className="relative w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-white" />
            )}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} truncate`}>
            {profile?.full_name || user.email?.split('@')[0] || 'User'}
          </p>
          <div className="flex items-center space-x-2">
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} capitalize`}>
              {profile?.role || 'student'}
            </p>
            <div className={`w-1 h-1 rounded-full ${userStatus === 'online' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className={`text-xs font-medium ${userStatus === 'online' ? 'text-green-500' : 'text-gray-400'}`}>
              {userStatus === 'online' ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

const EnhancedSidebar: React.FC<EnhancedSidebarProps> = ({
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  currentPath
}) => {
  const { isDarkMode, setIsDarkMode } = useTheme()
  const { user, profile, signOut, loading } = useAuth()
  const { userStatus } = useUserPresence()
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarCollapsed(true)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setIsSidebarCollapsed])

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return

    const currentTouch = e.touches[0].clientX
    const diff = touchStart - currentTouch

    if (diff > 50) { // Swipe left
      setIsSidebarCollapsed(true)
    } else if (diff < -50) { // Swipe right
      setIsSidebarCollapsed(false)
    }
  }

  const handleTouchEnd = () => {
    setTouchStart(null)
  }

  const navItems = [
    { icon: Activity, label: 'Dashboard', href: '/', gradient: 'from-blue-500 to-indigo-600' },
    { icon: Plus, label: 'Submit Problem', href: '/submit-problem', gradient: 'from-green-500 to-emerald-600' },
    { icon: Target, label: 'Problem Bank', href: '/problems', gradient: 'from-purple-500 to-violet-600' },
    { icon: Star, label: 'Starred', href: '/starred', gradient: 'from-yellow-500 to-orange-600' },
    { icon: Lightbulb, label: 'Solutions', href: '/solutions', gradient: 'from-amber-500 to-yellow-600' },
    { icon: MessageSquare, label: 'Discussions', href: '/discussions', gradient: 'from-cyan-500 to-blue-600' },
    { icon: Trophy, label: 'Leaderboard', href: '/leaderboard', gradient: 'from-rose-500 to-pink-600' }
  ]

  // Admin navigation items
  const adminNavItems = [
    { icon: Activity, label: 'Analytics', href: '/admin/analytics', gradient: 'from-red-500 to-rose-600' },
    { icon: Users, label: 'User Management', href: '/admin/users', gradient: 'from-orange-500 to-red-600' }
  ]

  // Check if user is admin
  const isAdmin = profile?.role === 'admin'

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity md:hidden ${!isSidebarCollapsed ? 'block' : 'hidden'}`}
        onClick={() => setIsSidebarCollapsed(true)}
      />

      <div 
        className={`fixed left-0 top-0 h-full ${isSidebarCollapsed ? 'w-20' : 'w-80'} 
          transition-all duration-300 z-50 shadow-2xl lg:shadow-xl hidden md:block`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Enhanced Gradient Background */}
        <div className={`absolute inset-0 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
            : 'bg-gradient-to-br from-white via-gray-50/80 to-white'
        }`} />
        
        {/* Enhanced Glass Effect with subtle pattern */}
        <div className={`absolute inset-0 ${
          isDarkMode 
            ? 'bg-slate-800/90 backdrop-blur-xl' 
            : 'bg-white/90 backdrop-blur-xl'
        } border-r ${
          isDarkMode 
            ? 'border-slate-700/50' 
            : 'border-gray-200/80'
        }`} />

        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-purple-500/10 to-transparent" />
        </div>
        
        {/* Content */}
        <div className={`relative h-full flex flex-col ${isSidebarCollapsed ? 'p-3' : 'p-6'} transition-all duration-300`}>
          
          {/* Enhanced Logo Section */}
          <div className={`flex items-center justify-between ${isSidebarCollapsed ? 'mb-6' : 'mb-8'}`}>
            <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
              <div className="relative group">
                {/* Enhanced glow effect */}
                <div className={`absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-60 group-hover:opacity-80 transition-all duration-300 ${isSidebarCollapsed ? 'blur-lg' : ''}`} />
                <div className={`relative ${isSidebarCollapsed ? 'w-12 h-12' : 'w-16 h-16'} bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white font-bold ${isSidebarCollapsed ? 'text-lg' : 'text-2xl'} shadow-2xl transition-all duration-300 group-hover:scale-105`}>
                  PB
                </div>
                
                {/* Animated ring */}
                <div className="absolute inset-0 rounded-2xl border-2 border-purple-500/30 animate-pulse" />
              </div>
              {!isSidebarCollapsed && (
                <div className="group">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent group-hover:from-indigo-500 group-hover:to-purple-500 transition-all duration-300">
                    Problem Bank
                  </h1>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} font-medium uppercase tracking-wider opacity-80`}>
                    Innovation Platform
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={`p-2.5 rounded-xl ${
                isDarkMode 
                  ? 'bg-slate-700/50 hover:bg-slate-600/80 border border-slate-600/30' 
                  : 'bg-gray-100/80 hover:bg-gray-200/80 border border-gray-200/50'
              } transition-all duration-300 hover:scale-105 group`}
            >
                             {isSidebarCollapsed ? 
                 <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" /> : 
                 <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
               }
            </button>
          </div>

          {/* Navigation Menu */}
          <div className="flex-1 overflow-y-auto">
            {!isSidebarCollapsed && (
              <p className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mb-4 px-2`}>
                Main Menu
              </p>
            )}
            
            <nav className="space-y-1 mb-6">
              {navItems.map((item, index) => (
                <MagicNavItem
                    key={index}
                  icon={item.icon}
                  label={item.label}
                    href={item.href}
                  isActive={currentPath === item.href}
                  isCollapsed={isSidebarCollapsed}
                  isDarkMode={isDarkMode}
                  gradient={item.gradient}
                />
              ))}
            </nav>

            {/* Admin Navigation */}
            {isAdmin && (
              <>
                {!isSidebarCollapsed && (
                  <>
                    <div className={`my-6 mx-4 h-px bg-gradient-to-r ${isDarkMode ? 'from-transparent via-slate-600 to-transparent' : 'from-transparent via-gray-300 to-transparent'}`} />
                    <p className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-red-400/80' : 'text-red-500/80'} mb-4 px-2`}>
                      Admin Panel
                    </p>
                  </>
                )}
                
                <nav className="space-y-1 mb-6">
                  {adminNavItems.map((item, index) => (
                    <MagicNavItem
                        key={`admin-${index}`}
                      icon={item.icon}
                      label={item.label}
                        href={item.href}
                      isActive={currentPath === item.href}
                      isCollapsed={isSidebarCollapsed}
                      isDarkMode={isDarkMode}
                      gradient={item.gradient}
                      activeGradient="from-red-600/20 to-pink-600/20"
                    />
                  ))}
                </nav>
              </>
            )}

            {/* User Profile Section */}
            {user && !isSidebarCollapsed && (
              <>
                <div className={`my-6 mx-4 h-px bg-gradient-to-r ${isDarkMode ? 'from-transparent via-slate-600 to-transparent' : 'from-transparent via-gray-300 to-transparent'}`} />
                
                <p className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mb-4 px-2`}>
                  Account
                </p>
                
                <div className="space-y-3">
                  <MagicUserProfile 
                    user={user}
                    profile={profile}
                    isDarkMode={isDarkMode}
                    isCollapsed={isSidebarCollapsed}
                    userStatus={userStatus}
                  />
                  
                                     <MagicNavItem
                     icon={User}
                     label="Settings"
                        href="/settings"
                     isActive={currentPath === '/settings'}
                     isCollapsed={isSidebarCollapsed}
                     isDarkMode={isDarkMode}
                     gradient="from-gray-500 to-slate-600"
                   />
                      
                      <button 
                        onClick={handleSignOut}
                        disabled={loading}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl ${
                      isDarkMode 
                        ? 'text-red-400 hover:bg-red-900/20 border border-red-800/20 hover:border-red-700/40' 
                        : 'text-red-600 hover:bg-red-50 border border-red-200/50 hover:border-red-300/60'
                    } transition-all duration-300 disabled:opacity-50 group`}
                  >
                                         <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium">
                          {loading ? 'Signing out...' : 'Logout'}
                        </span>
                      </button>
                </div>
                    </>
            )}

            {/* Login Section for Non-authenticated Users */}
            {!user && !isSidebarCollapsed && (
                    <>
                <div className={`my-6 mx-4 h-px bg-gradient-to-r ${isDarkMode ? 'from-transparent via-slate-600 to-transparent' : 'from-transparent via-gray-300 to-transparent'}`} />
                
                <div className="space-y-3">
                      <Link 
                        href="/auth/login"
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white transition-all duration-300 group shadow-lg hover:shadow-xl`}
                      >
                    <User className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium">Sign In</span>
                      </Link>
                      
                  <div className={`px-4 py-3 rounded-xl ${
                    isDarkMode 
                      ? 'bg-slate-700/30 border border-slate-600/30' 
                      : 'bg-gray-50 border border-gray-200/50'
                  }`}>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-center`}>
                          Sign in to access all features
                        </p>
                      </div>
                </div>
              </>
            )}
          </div>

          {/* Enhanced Theme Toggle */}
          <div className={`border-t ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'} pt-4`}>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`w-full p-3 ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-slate-800/70 to-slate-700/70 hover:from-slate-700/80 hover:to-slate-600/80 text-slate-200 border border-slate-600/30' 
                  : 'bg-gradient-to-r from-gray-100/80 to-gray-50/80 hover:from-gray-200/80 hover:to-gray-100/80 text-gray-700 border border-gray-200/50'
              } rounded-xl transition-all duration-300 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'} group hover:scale-105 shadow-sm hover:shadow-md`}
            >
                             {isDarkMode ? 
                 <Star className="w-5 h-5 text-yellow-400 group-hover:rotate-90 transition-transform duration-300" /> : 
                 <Star className="w-5 h-5 text-slate-600 group-hover:-rotate-12 transition-transform duration-300" />
               }
              {!isSidebarCollapsed && (
                <span className="text-sm font-medium">
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Search Modal */}
      {showAdvancedSearch && (
        <AdvancedSearchModal 
          isDarkMode={isDarkMode}
          onClose={() => setShowAdvancedSearch(false)}
        />
      )}
    </>
  )
}

// Keep the existing AdvancedSearchModal component as is...
interface AdvancedSearchModalProps {
  isDarkMode: boolean
  onClose: () => void
}

const AdvancedSearchModal: React.FC<AdvancedSearchModalProps> = ({ isDarkMode, onClose }) => {
  const router = useRouter()
  const [searchData, setSearchData] = useState({
    query: '',
    category: '',
    difficulty: '',
    tags: '',
    author: '',
    dateRange: ''
  })
  const [isSearching, setIsSearching] = useState(false)

  const categories = [
    { id: 'technology', name: 'Technology' },
    { id: 'healthcare', name: 'Healthcare' },
    { id: 'education', name: 'Education' },
    { id: 'environment', name: 'Environment' },
    { id: 'finance', name: 'Finance' },
    { id: 'social', name: 'Social Impact' }
  ]

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSearching(true)

    try {
    // Build search URL with query parameters
    const params = new URLSearchParams()
      if (searchData.query.trim()) params.append('q', searchData.query.trim())
    if (searchData.category) params.append('category', searchData.category)
    if (searchData.difficulty) params.append('difficulty', searchData.difficulty)
      if (searchData.tags.trim()) params.append('tags', searchData.tags.trim())
      if (searchData.author.trim()) params.append('author', searchData.author.trim())
    if (searchData.dateRange) params.append('date', searchData.dateRange)

      // Use Next.js router to navigate
    const searchUrl = `/problems?${params.toString()}`
      router.push(searchUrl)
    
      onClose()
    } catch (error) {
      console.error('Search error:', error)
    } finally {
    setIsSearching(false)
    }
  }

  const clearSearch = () => {
    setSearchData({
      query: '',
      category: '',
      difficulty: '',
      tags: '',
      author: '',
      dateRange: ''
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className={`${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6`}>Advanced Search</h3>
        
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Search Query
            </label>
              <input 
                type="text" 
                value={searchData.query}
                onChange={(e) => setSearchData(prev => ({ ...prev, query: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              placeholder="Enter keywords..."
              />
          </div>

            <div>
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Category
              </label>
              <select
                value={searchData.category}
                onChange={(e) => setSearchData(prev => ({ ...prev, category: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              >
                <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Difficulty
              </label>
              <select
                value={searchData.difficulty}
                onChange={(e) => setSearchData(prev => ({ ...prev, difficulty: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              >
                <option value="">All Difficulties</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={clearSearch}
              className={`flex-1 py-2 px-4 border rounded-lg ${isDarkMode ? 'border-slate-600 text-gray-300 hover:bg-slate-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} transition-colors`}
            >
              Clear
              </button>
              <button 
                type="submit"
                disabled={isSearching}
              className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isSearching ? 'Searching...' : 'Search'}
              </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EnhancedSidebar 