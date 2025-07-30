'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

interface HeaderProps {
  user?: {
    name: string
    role: 'Student' | 'Industry Expert' | 'Admin'
    avatar?: string
  }
}

export default function Header({ user }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  // const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      // setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const navigation = [
    { name: 'Problem Bank', href: '/problems' },
    { name: 'Submit Problem', href: '/submit-problem' },
    { name: 'Solutions', href: '/solutions' },
    { name: 'Discussions', href: '/discussions' },
    { name: 'Leaderboard', href: '/leaderboard' },
  ]

  const adminNavigation = [
    { name: 'Analytics', href: '/admin/analytics' },
    { name: 'User Management', href: '/admin/users' },
    { name: 'Reports', href: '/admin/reports' },
  ]

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">PB</span>
              </div>
              <span className="text-heading-4 font-bold text-gray-900 hidden sm:inline">Problem Bank</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-lg text-body font-medium transition-colors"
              >
                {item.name}
              </Link>
            ))}
            {user?.role === 'Admin' && (
              <>
                <div className="border-l border-gray-200 mx-2"></div>
                {adminNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg text-body font-medium transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
              </>
            )}
          </nav>

          {/* User Menu & Mobile Menu Button */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex items-center space-x-3 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden md:block">
                    <p className="text-body font-semibold text-gray-900">{user.name}</p>
                    <p className="text-body-small text-gray-500">{user.role}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-3">
                <Link
                  href="/auth/login"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-body font-semibold hover:bg-blue-700 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span className="sr-only">Open menu</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-black/50"
              onClick={() => setIsMenuOpen(false)}
            />
            
            {/* Menu panel */}
            <div className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-xl">
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">PB</span>
                      </div>
                      <span className="text-heading-4 font-bold text-gray-900">Problem Bank</span>
                    </div>
                    <button
                      onClick={() => setIsMenuOpen(false)}
                      className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <nav className="px-4 py-6 space-y-2">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="block px-4 py-3 text-base font-medium text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                    {user?.role === 'Admin' && (
                      <>
                        <div className="border-t border-gray-200 my-4"></div>
                        {adminNavigation.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            className="block px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            {item.name}
                          </Link>
                        ))}
                      </>
                    )}
                  </nav>
                </div>

                <div className="p-4 border-t border-gray-200">
                  {user ? (
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.role}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-2">
                      <Link
                        href="/auth/login"
                        className="w-full text-center bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Sign In
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
} 