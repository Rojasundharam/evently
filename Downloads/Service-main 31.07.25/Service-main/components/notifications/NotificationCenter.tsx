'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  BellIcon,
  CheckIcon,
  XIcon,
  UserIcon,
  AlertTriangleIcon,
  InfoIcon,
  CheckCircleIcon,
  ClockIcon,
  SettingsIcon,
  Trash2Icon,
  Loader2Icon
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'user_action';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

interface NotificationCenterProps {
  className?: string;
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    handleNotificationClick
  } = useNotifications();

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangleIcon className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XIcon className="h-4 w-4 text-red-500" />;
      case 'user_action':
        return <UserIcon className="h-4 w-4 text-blue-500" />;
      case 'info':
      default:
        return <InfoIcon className="h-4 w-4 text-blue-500" />;
    }
  };

  const getNotificationBgColor = (type: NotificationType, read: boolean) => {
    if (read) return 'bg-gray-50';
    
    switch (type) {
      case 'success':
        return 'bg-green-50 border-l-4 border-green-400';
      case 'warning':
        return 'bg-yellow-50 border-l-4 border-yellow-400';
      case 'error':
        return 'bg-red-50 border-l-4 border-red-400';
      case 'user_action':
        return 'bg-blue-50 border-l-4 border-blue-400';
      case 'info':
      default:
        return 'bg-blue-50 border-l-4 border-blue-400';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={`relative p-2 ${className}`}>
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-96 p-0">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Notifications</CardTitle>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                    disabled={loading}
                  >
                    <CheckIcon className="h-3 w-3 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="text-xs">
                  <SettingsIcon className="h-3 w-3" />
                </Button>
              </div>
            </div>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-600">
                You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </CardHeader>
          
          <CardContent className="p-0">
            <ScrollArea className="h-80">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2Icon className="h-6 w-6 animate-spin text-gray-500" />
                  <span className="ml-2 text-sm text-gray-500">Loading notifications...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4">
                  <BellIcon className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500 text-center">
                    No notifications yet
                  </p>
                  <p className="text-xs text-gray-400 text-center mt-1">
                    You'll see your notifications here
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification, index) => (
                    <div key={notification.id}>
                      <div
                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                          getNotificationBgColor(notification.type, notification.read)
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <h4 className={`text-sm font-medium ${
                                notification.read ? 'text-gray-700' : 'text-gray-900'
                              }`}>
                                {notification.title}
                              </h4>
                              <div className="flex items-center space-x-1 ml-2">
                                <span className="text-xs text-gray-400">
                                  {formatTimestamp(notification.timestamp)}
                                </span>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                )}
                              </div>
                            </div>
                            
                            <p className={`text-sm mt-1 ${
                              notification.read ? 'text-gray-500' : 'text-gray-700'
                            }`}>
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center space-x-2">
                                {!notification.read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead(notification.id);
                                    }}
                                    className="text-xs h-6 px-2"
                                  >
                                    <CheckIcon className="h-3 w-3 mr-1" />
                                    Mark read
                                  </Button>
                                )}
                                {notification.actionUrl && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs h-6 px-2 text-blue-600"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleNotificationClick(notification);
                                    }}
                                  >
                                    View
                                  </Button>
                                )}
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                                className="text-xs h-6 px-2 text-red-600 hover:text-red-700"
                              >
                                <Trash2Icon className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                      {index < notifications.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            
            {notifications.length > 0 && (
              <>
                <Separator />
                <div className="p-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllNotifications}
                    className="w-full text-xs text-red-600 hover:text-red-700"
                    disabled={loading}
                  >
                    <Trash2Icon className="h-3 w-3 mr-1" />
                    Clear all notifications
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NotificationCenter; 