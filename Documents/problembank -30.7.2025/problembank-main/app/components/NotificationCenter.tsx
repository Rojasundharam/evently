'use client'

import React, { useState, useRef, useEffect } from 'react'
import { 
  MessageSquare as Bell, 
  X, 
  CheckCircle as Check, 
  Trash2, 
  MessageSquare as MessageCircle, 
  Trophy, 
  MessageSquare as Megaphone, 
  ThumbsUp, 
  Plus,
  Activity as Circle,
  CheckCircle
} from 'lucide-react'
import { useNotifications, Notification, NotificationHelpers } from '@/lib/notifications'
import { formatDistanceToNow } from 'date-fns'

interface NotificationCenterProps {
  isDarkMode?: boolean
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isDarkMode = false }) => {
  const { 
    notifications, 
    unreadCount, 
    addNotification, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearAllNotifications,
    isLoading 
  } = useNotifications()
  
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen])

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'problem_reply':
        return <MessageCircle className="w-4 h-4 text-blue-500" />
      case 'leaderboard_update':
        return <Trophy className="w-4 h-4 text-yellow-500" />
      case 'product_announcement':
        return <Megaphone className="w-4 h-4 text-purple-500" />
      case 'solution_vote':
        return <ThumbsUp className="w-4 h-4 text-green-500" />
      case 'new_problem':
        return <Plus className="w-4 h-4 text-indigo-500" />
      default:
        return <Bell className="w-4 h-4 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500'
      case 'medium':
        return 'border-l-yellow-500'
      case 'low':
        return 'border-l-green-500'
      default:
        return 'border-l-gray-300'
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    
    // Navigate to related content if applicable
    if (notification.related_id) {
      switch (notification.type) {
        case 'problem_reply':
        case 'new_problem':
          window.location.href = `/problems/${notification.related_id}`
          break
        case 'solution_vote':
          window.location.href = `/solutions`
          break
        case 'leaderboard_update':
          window.location.href = `/leaderboard`
          break
      }
    }
    
    setIsOpen(false)
  }



  if (isLoading) {
    return (
      <button
        className={`relative p-2 rounded-lg ${
          isDarkMode 
            ? 'text-gray-400 hover:bg-gray-700' 
            : 'text-gray-600 hover:bg-gray-100'
        } transition-colors animate-pulse`}
        disabled
      >
        <Bell className="w-5 h-5" />
      </button>
    )
  }

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg ${
          isDarkMode 
            ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        } transition-colors duration-200 ${isOpen ? 'ring-2 ring-indigo-500' : ''}`}
      >
        <Bell className="w-5 h-5" />
        
        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        
        {/* Pulse Animation for New Notifications */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 animate-ping"></span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={`fixed sm:absolute right-2 sm:right-0 top-20 sm:top-full mt-2 w-[calc(100vw-1rem)] sm:w-96 max-w-[95vw] sm:max-w-[90vw] ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } border rounded-xl shadow-2xl z-[9999] max-h-[70vh] flex flex-col`}
        >
          {/* Header */}
          <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
            <h3 className={`text-heading-4 ${isDarkMode ? 'text-white' : 'text-gray-900'} flex items-center space-x-2`}>
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {unreadCount}
                </span>
              )}
            </h3>
            
            <div className="flex items-center space-x-2">
              {/* Mark All Read */}
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className={`text-xs ${
                    isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  } transition-colors`}
                  title="Mark all as read"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}
              
              {/* Clear All */}
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className={`text-xs ${
                    isDarkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-600 hover:text-red-600'
                  } transition-colors`}
                  title="Clear all notifications"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              
              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className={`${
                  isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                } transition-colors`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className={`p-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-body font-medium mb-1">No notifications yet</p>
                <p className="text-body-small">We'll notify you when something important happens!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 cursor-pointer transition-colors border-l-4 ${getPriorityColor(notification.priority)} ${
                      !notification.read 
                        ? isDarkMode 
                          ? 'bg-gray-700/50 hover:bg-gray-700' 
                          : 'bg-blue-50 hover:bg-blue-100'
                        : isDarkMode 
                          ? 'hover:bg-gray-700/30' 
                          : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <div className={`mt-1 p-2 rounded-lg ${
                        isDarkMode ? 'bg-gray-600' : 'bg-gray-100'
                      }`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className={`text-body ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            } ${!notification.read ? 'font-semibold' : 'font-medium'}`}>
                              {notification.title}
                            </h4>
                            <p className={`text-body-small mt-1 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                              {notification.message}
                            </p>
                            <p className={`text-caption mt-2 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </p>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center space-x-1 ml-2">
                            {/* Read Status */}
                            {!notification.read ? (
                              <Circle className="w-2 h-2 text-blue-500 fill-current" />
                            ) : (
                              <div className="w-2 h-2"></div>
                            )}
                            
                            {/* Delete Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteNotification(notification.id)
                              }}
                              className={`p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100`}
                              title="Delete notification"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className={`p-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} text-center`}>
              <button
                onClick={() => {
                  setIsOpen(false)
                  window.location.href = '/settings'
                }}
                className={`text-body-small ${
                  isDarkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'
                } transition-colors`}
              >
                Manage notification preferences →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationCenter