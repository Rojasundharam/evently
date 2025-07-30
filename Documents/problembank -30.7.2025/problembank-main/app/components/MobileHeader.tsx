'use client'

import React, { useState, useEffect } from 'react'
import { useTheme } from '@/lib/theme'
import { useAuth } from '@/lib/auth'
import NotificationCenter from './NotificationCenter'
import { Lightbulb, Zap, Search, X, Target } from 'lucide-react'
import { useRouter } from 'next/navigation'

const MobileHeader = () => {
  const { isDarkMode, setIsDarkMode } = useTheme()
  const { user, profile } = useAuth()
  const router = useRouter()
  const [isLogoPressed, setIsLogoPressed] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleLogoPress = () => {
    setIsLogoPressed(true)
    // Add haptic feedback on mobile
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(50)
    }
    setTimeout(() => setIsLogoPressed(false), 200)
  }

  const handleDarkModeToggle = () => {
    setIsDarkMode(!isDarkMode)
    // Add haptic feedback
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(30)
    }
  }

  const handleSearchToggle = () => {
    setShowSearch(!showSearch)
    // Add haptic feedback
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(30)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Navigate to problems page with search query
      router.push(`/problems?q=${encodeURIComponent(searchQuery.trim())}`)
      setShowSearch(false)
      setSearchQuery('')
    }
  }

  return (
    <>
      <div className={`md:hidden fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      } ${
        isDarkMode 
          ? 'bg-slate-900/95 border-slate-700' 
          : 'bg-white/95 border-gray-200'
      } backdrop-blur-xl border-b shadow-sm`}>
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo and App Name */}
          <div 
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => {
              router.push('/')
              handleLogoPress()
            }}
          >
            {/* Interactive Logo */}
            <div 
              className={`w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 flex items-center justify-center shadow-lg transition-all duration-200 ${
                isLogoPressed ? 'scale-95 shadow-md' : 'hover:scale-105 hover:shadow-xl'
              }`}
            >
              <span className="text-white font-bold text-lg select-none">PB</span>
            </div>
            
            {/* App Name */}
            <div className="flex flex-col">
              <h1 className={`font-bold text-lg transition-colors duration-200 hover:scale-105 transform ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Problem Bank
              </h1>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-2">
            {/* Dark Mode Toggle */}
            <button
              onClick={handleDarkModeToggle}
              className={`p-2 rounded-lg transition-all duration-200 transform hover:rotate-12 ${
                isDarkMode 
                  ? 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              } active:scale-95 active:rotate-45`}
              aria-label="Toggle dark mode"
            >
              <div className="transition-transform duration-200">
                {isDarkMode ? (
                  <Lightbulb className="w-5 h-5" />
                ) : (
                  <Zap className="w-5 h-5" />
                )}
              </div>
            </button>

            {/* Search Button */}
            <button
              onClick={handleSearchToggle}
              className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              } active:scale-95 ${showSearch ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : ''}`}
              aria-label="Search"
            >
              {showSearch ? (
                <X className="w-5 h-5" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </button>

            {/* Notifications */}
            <div className="relative">
              <NotificationCenter isDarkMode={isDarkMode} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {showSearch && (
        <div className="md:hidden fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm">
          <div className={`absolute top-20 left-4 right-4 ${
            isDarkMode ? 'bg-slate-900' : 'bg-white'
          } rounded-2xl shadow-2xl border ${
            isDarkMode ? 'border-slate-700' : 'border-gray-200'
          } p-6 transform transition-all duration-300`}>
            
            {/* Search Form */}
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <Target className="w-6 h-6 text-indigo-500" />
                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Search Problems
                </h2>
              </div>

              <div className="relative">
                <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, description, tags..."
                  className={`w-full pl-12 pr-4 py-4 text-lg ${
                    isDarkMode 
                      ? 'bg-slate-800 border-slate-600 text-white placeholder-gray-400' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
                  } border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200`}
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setShowSearch(false)}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-slate-700 hover:bg-slate-600 text-gray-300' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={!searchQuery.trim()}
                  className={`px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
                    searchQuery.trim() 
                      ? 'hover:shadow-lg hover:scale-105' 
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <Search className="w-4 h-4" />
                  <span>Search</span>
                </button>
              </div>

              {/* Quick suggestions */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className={`text-sm font-medium mb-3 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Quick categories:
                </p>
                <div className="flex flex-wrap gap-2">
                  {['technology', 'healthcare', 'education', 'environment'].map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => {
                        router.push(`/problems?category=${category}`)
                        setShowSearch(false)
                      }}
                      className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all duration-200 ${
                        isDarkMode 
                          ? 'bg-slate-700 hover:bg-slate-600 text-gray-300' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default MobileHeader 