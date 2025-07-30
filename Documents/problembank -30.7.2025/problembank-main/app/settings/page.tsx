'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  User, 
  MessageCircle, 
  User as Camera, 
  Save, 
  ArrowLeft, 
  CheckCircle,
  User as Trash2,
  ArrowRight,
  User as Settings,
  User as Smartphone,
  MessageCircle as Mail,
  MessageCircle as Megaphone,
  Trophy,
  User as Lock,
  User as AlertTriangle
} from 'lucide-react'
import EnhancedSidebar from '../components/layout/EnhancedSidebar'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { useTheme } from '@/lib/theme'
import { supabase, UserPreferences } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/lib/notifications'

const SettingsPage = () => {
  const { user, profile, updateProfile, signOut } = useAuth()
  const { isDarkMode, setIsDarkMode } = useTheme()
  const { preferences, updatePreferences } = useNotifications()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    bio: '',
    country: '',
    avatar_url: '',
    role: ''
  })
  

  
  // Show confirmation dialogs
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)

  // Countries list for dropdown
  const countries = [
    'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Armenia', 'Australia', 'Austria', 
    'Bangladesh', 'Belgium', 'Brazil', 'Bulgaria', 'Canada', 'Chile', 'China', 'Colombia', 
    'Croatia', 'Czech Republic', 'Denmark', 'Egypt', 'Estonia', 'Finland', 'France', 'Germany', 
    'Ghana', 'Greece', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 
    'Israel', 'Italy', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kuwait', 'Latvia', 'Lebanon', 
    'Lithuania', 'Luxembourg', 'Malaysia', 'Mexico', 'Morocco', 'Netherlands', 'New Zealand', 
    'Nigeria', 'Norway', 'Pakistan', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 
    'Russia', 'Saudi Arabia', 'Singapore', 'Slovakia', 'Slovenia', 'South Africa', 'South Korea', 
    'Spain', 'Sri Lanka', 'Sweden', 'Switzerland', 'Thailand', 'Turkey', 'Ukraine', 'United Arab Emirates', 
    'United Kingdom', 'United States', 'Vietnam'
  ]

  // Initialize form data
  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        country: profile.country || '',
        avatar_url: profile.avatar_url || '',
        role: profile.role || 'student'
      })
    }
  }, [profile])

  

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const { error } = await updateProfile({
        full_name: profileForm.full_name,
        bio: profileForm.bio,
        country: profileForm.country,
        avatar_url: profileForm.avatar_url,
        role: profileForm.role as 'student' | 'industry_expert' | 'admin'
      })
      
      if (error) {
        setMessage({ type: 'error', text: 'Failed to update profile' })
      } else {
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while updating profile' })
    } finally {
      setLoading(false)
    }
  }

  const handlePreferencesUpdate = async (key: keyof typeof preferences, value: boolean) => {
    if (!user) return
    
    updatePreferences({ [key]: value })
    setMessage({ type: 'success', text: 'Notification preferences updated!' })
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' })
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image file must be less than 2MB' })
      return
    }

    setLoading(true)
    
    try {
      // Convert image to base64
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const base64String = e.target?.result as string
          
          // Update profile with new avatar URL
          setProfileForm(prev => ({ ...prev, avatar_url: base64String }))
          
          const { error: updateError } = await updateProfile({
            avatar_url: base64String
          })

          if (updateError) {
            console.error('Profile update error:', updateError)
            setMessage({ type: 'error', text: 'Failed to update avatar' })
          } else {
            setMessage({ type: 'success', text: 'Avatar updated successfully!' })
          }
        } catch (error) {
          console.error('Error updating avatar:', error)
          setMessage({ type: 'error', text: 'Error updating avatar' })
        } finally {
          setLoading(false)
        }
      }

      reader.onerror = () => {
        setMessage({ type: 'error', text: 'Error reading image file' })
        setLoading(false)
      }

      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error uploading avatar:', error)
      setMessage({ type: 'error', text: 'Error uploading avatar' })
      setLoading(false)
    }
  }



  const handleAccountDeletion = async () => {
    if (!user) return
    
    setLoading(true)
    
    try {
      // In a real implementation, you'd want to delete user data and then the account
      // For now, we'll just sign out and show a message
      await signOut()
      setMessage({ type: 'success', text: 'Account deletion requested. You have been signed out.' })
      router.push('/auth/login')
    } catch (error) {
      setMessage({ type: 'error', text: 'Error processing account deletion' })
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: MessageCircle },
    { id: 'privacy', label: 'Privacy', icon: Lock },
  ]

  const notificationItems = [
    {
      key: 'problem_replies' as keyof typeof preferences,
      title: 'Problem Replies',
      description: 'Get notified when someone replies to your problems',
      icon: MessageCircle
    },
    {
      key: 'leaderboard_updates' as keyof typeof preferences,
      title: 'Leaderboard Updates',
      description: 'Notifications about your ranking changes',
      icon: Trophy
    },
    {
      key: 'product_announcements' as keyof typeof preferences,
      title: 'Product Announcements',
      description: 'Updates about new features and platform changes',
      icon: Megaphone
    },
    {
      key: 'email_notifications' as keyof typeof preferences,
      title: 'Email Notifications',
      description: 'Receive notifications via email',
      icon: Mail
    },
    {
      key: 'push_notifications' as keyof typeof preferences,
      title: 'Push Notifications',
      description: 'Receive push notifications on your device',
      icon: Smartphone
    }
  ]

  // Clear message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">Please sign in to access settings.</p>
          <Link
            href="/auth/login"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      <EnhancedSidebar
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        currentPath="/settings"
      />

      <div className={`${isSidebarCollapsed ? 'ml-0 md:ml-20' : 'ml-0 md:ml-80'} p-3 sm:p-4 md:p-8 transition-all duration-300`}>
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center mb-3 sm:mb-4">
            <Link 
              href="/" 
              className={`flex items-center ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors mr-4 text-sm sm:text-base`}
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Back to Dashboard
            </Link>
          </div>
          
          <div className="flex items-center">
            <Settings className={`w-6 h-6 sm:w-7 sm:h-7 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'} mr-2 sm:mr-3`} />
            <div>
              <h1 className={`text-xl sm:text-2xl md:text-heading-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Settings
              </h1>
              <p className={`text-sm sm:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Manage your account preferences and security settings
              </p>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {message && (
          <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg flex items-center text-sm sm:text-base ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
            )}
            {message.text}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Mobile-optimized Sidebar Navigation */}
          <div className="lg:w-64">
            <nav className={`p-1 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              {/* Mobile Tabs - Horizontal Scroll */}
              <div className="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-shrink-0 lg:w-full flex items-center space-x-2 lg:space-x-3 px-3 lg:px-4 py-2 lg:py-3 text-left rounded-lg transition-all duration-200 whitespace-nowrap ${
                        activeTab === tab.id
                          ? isDarkMode
                            ? 'bg-indigo-600 text-white'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : isDarkMode
                            ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
                      <span className="font-medium text-sm lg:text-base">{tab.label}</span>
                    </button>
                  )
                })}
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'profile' && (
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-4 sm:p-6`}>
                <h2 className={`text-lg sm:text-xl md:text-heading-3 ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4 sm:mb-6`}>
                  Profile Information
                </h2>
                
                <form onSubmit={handleProfileUpdate} className="space-y-4 sm:space-y-6">
                  {/* Avatar Upload */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                    <div className="relative">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-indigo-100 rounded-full flex items-center justify-center overflow-hidden">
                        {profileForm.avatar_url ? (
                          <img 
                            src={profileForm.avatar_url} 
                            alt="Avatar" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-600" />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-7 h-7 sm:w-8 sm:h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white hover:bg-indigo-700 transition-colors"
                      >
                        <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </div>
                    <div className="text-center sm:text-left">
                      <h3 className={`font-medium text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Profile Picture
                      </h3>
                      <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Click the camera icon to upload a new picture
                      </p>
                    </div>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg border ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                      placeholder="Enter your full name"
                    />
                  </div>

                  {/* Bio */}
                  <div>
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                      Bio <span className="text-gray-400">(max 160 characters)</span>
                    </label>
                    <textarea
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                      maxLength={160}
                      rows={3}
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg border ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none`}
                      placeholder="Tell us about yourself..."
                    />
                    <div className={`text-right text-xs sm:text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {profileForm.bio.length}/160
                    </div>
                  </div>

                  {/* Country */}
                  <div>
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                      Country
                    </label>
                    <select
                      value={profileForm.country}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, country: e.target.value }))}
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg border ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                    >
                      <option value="">Select your country</option>
                      {countries.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* User Role Selection and Status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                        Role
                      </label>
                      <select
                        value={profileForm.role || profile?.role || 'student'}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, role: e.target.value }))}
                        className={`w-full px-4 py-3 rounded-lg border ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        } focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 capitalize`}
                      >
                        <option value="student">Student</option>
                        <option value="industry_expert">Industry Expert</option>
                      </select>
                      <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Choose your role to get relevant features and notifications
                      </p>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                        Status
                      </label>
                      <div className={`px-4 py-3 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-300' 
                          : 'bg-gray-50 border-gray-300 text-gray-600'
                      } capitalize flex items-center space-x-2`}>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>{profile?.status || 'Active'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-6`}>
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6`}>
                  Notification Preferences
                </h2>
                
                <div className="space-y-6">
                  {notificationItems.map((item) => {
                    const Icon = item.icon
                    const isEnabled = preferences[item.key] as boolean
                    
                    return (
                      <div key={item.key} className="flex items-center justify-between p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-medium text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {item.title}
                            </h3>
                            <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                              {item.description}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handlePreferencesUpdate(item.key, !isEnabled)}
                          className={`relative inline-flex h-8 w-14 sm:h-7 sm:w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                            isEnabled ? 'bg-indigo-600' : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                          } border-2 ${isDarkMode ? 'border-gray-500' : 'border-gray-200'}`}
                        >
                          <span
                            className={`inline-block h-6 w-6 sm:h-5 sm:w-5 transform rounded-full transition-transform shadow-lg border-2 border-white ${
                              isEnabled 
                                ? 'translate-x-7 sm:translate-x-6 bg-white' 
                                : 'translate-x-0.5 sm:translate-x-1 bg-white'
                            }`}
                          />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}



            {activeTab === 'privacy' && (
              <div className="space-y-6">
                {/* Account Actions */}
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-6`}>
                  <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6`}>
                    Account Actions
                  </h2>
                  
                  <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20">
                      <div>
                        <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                        Sign Out
                        </h3>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Sign out of your account on this device
                        </p>
                      </div>
                      <button
                      onClick={async () => {
                        try {
                          await signOut()
                          router.push('/auth/login')
                        } catch (error) {
                          setMessage({ type: 'error', text: 'Error signing out' })
                        }
                      }}
                      className={`px-6 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                        isDarkMode 
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      <User className="w-4 h-4" />
                      <span>Sign Out</span>
                      </button>
                  </div>
                </div>

                {/* Account Deletion */}
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl border border-red-200 dark:border-red-800 p-6`}>
                  <h2 className="text-xl font-semibold text-red-600 mb-6">
                    Danger Zone
                  </h2>
                  
                  <div className="flex items-center justify-between p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                    <div>
                      <h3 className="font-medium text-red-800 dark:text-red-300 mb-1">
                        Delete Account
                      </h3>
                      <p className="text-sm text-red-600 dark:text-red-400">
                        Permanently delete your account and all data
                      </p>
                    </div>
                    <button
                      onClick={() => setShowDeleteAccount(true)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Account</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Delete Account Confirmation Modal */}
        {showDeleteAccount && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`max-w-md w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6`}>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Delete Account
                </h3>
              </div>
              
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
                Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleAccountDeletion}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Deleting...' : 'Yes, Delete Account'}
                </button>
                <button
                  onClick={() => setShowDeleteAccount(false)}
                  className={`flex-1 px-4 py-2 rounded-lg border ${
                    isDarkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  } transition-colors`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SettingsPage 