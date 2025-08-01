'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BellIcon, 
  SearchIcon, 
  CheckIcon, 
  TrashIcon, 
  RefreshCwIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  XIcon,
  UserIcon,
  InfoIcon,
  FilterIcon,
  Loader2Icon,
  MailIcon
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import type { Notification, NotificationType } from '@/lib/notifications-service';

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    handleNotificationClick
  } = useNotifications();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Filter notifications based on search and filters
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = searchTerm === '' || 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || notification.type === filterType;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'read' && notification.read) ||
      (filterStatus === 'unread' && !notification.read);

    return matchesSearch && matchesType && matchesStatus;
  });

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XIcon className="h-5 w-5 text-red-500" />;
      case 'user_action':
        return <UserIcon className="h-5 w-5 text-blue-500" />;
      case 'info':
      default:
        return <InfoIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  const getNotificationBgColor = (type: NotificationType, read: boolean) => {
    if (read) return 'bg-gray-50 border-gray-200';
    
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 border-l-4 border-l-green-400';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 border-l-4 border-l-yellow-400';
      case 'error':
        return 'bg-red-50 border-red-200 border-l-4 border-l-red-400';
      case 'user_action':
        return 'bg-blue-50 border-blue-200 border-l-4 border-l-blue-400';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 border-l-4 border-l-blue-400';
    }
  };

  const getTypeColor = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'user_action':
        return 'bg-blue-100 text-blue-800';
      case 'info':
      default:
        return 'bg-blue-100 text-blue-800';
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
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  const getTypeStats = () => {
    const stats = {
      total: notifications.length,
      unread: unreadCount,
      success: notifications.filter(n => n.type === 'success').length,
      warning: notifications.filter(n => n.type === 'warning').length,
      error: notifications.filter(n => n.type === 'error').length,
      info: notifications.filter(n => n.type === 'info').length,
      user_action: notifications.filter(n => n.type === 'user_action').length,
    };
    return stats;
  };

  const stats = getTypeStats();

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2Icon className="h-8 w-8 animate-spin text-gray-500 mr-3" />
          <span className="text-gray-600">Loading notifications...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-3">
          <BellIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600">Manage your notifications and stay updated</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={loadNotifications} variant="outline" size="sm" disabled={loading}>
            <RefreshCwIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              <CheckIcon className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button onClick={clearAllNotifications} variant="destructive" size="sm">
              <TrashIcon className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <BellIcon className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total</div>
              <div className="text-2xl font-bold">{stats.total}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
              <MailIcon className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Unread</div>
              <div className="text-2xl font-bold text-orange-600">{stats.unread}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircleIcon className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Success</div>
              <div className="text-2xl font-bold text-green-600">{stats.success}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
              <AlertTriangleIcon className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Warning</div>
              <div className="text-2xl font-bold text-yellow-600">{stats.warning}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
              <XIcon className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Error</div>
              <div className="text-2xl font-bold text-red-600">{stats.error}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
              <UserIcon className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">User Actions</div>
              <div className="text-2xl font-bold text-purple-600">{stats.user_action}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="user_action">User Action</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Notifications ({filteredNotifications.length})
            {searchTerm || filterType !== 'all' || filterStatus !== 'all' ? (
              <span className="text-sm font-normal text-gray-500 ml-2">
                (filtered from {notifications.length} total)
              </span>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <AlertTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                <p className="text-yellow-800">
                  Unable to load notifications from database. Showing sample data.
                </p>
              </div>
            </div>
          )}

          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <BellIcon className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">
                {notifications.length === 0 ? 'No notifications' : 'No matching notifications'}
              </h3>
              <p className="text-gray-400 text-center">
                {notifications.length === 0 
                  ? "You'll see your notifications here when you receive them."
                  : "Try adjusting your search or filter criteria."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-all ${
                    getNotificationBgColor(notification.type, notification.read)
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className={`text-sm font-medium ${
                              notification.read ? 'text-gray-700' : 'text-gray-900'
                            }`}>
                              {notification.title}
                            </h4>
                            <Badge className={`text-xs ${getTypeColor(notification.type)}`}>
                              {notification.type}
                            </Badge>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                          <p className={`text-sm ${
                            notification.read ? 'text-gray-500' : 'text-gray-700'
                          }`}>
                            {notification.message}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <span className="text-xs text-gray-400">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                          <div className="flex items-center space-x-1">
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
                                <CheckIcon className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="text-xs h-6 px-2 text-red-600 hover:text-red-700"
                            >
                              <TrashIcon className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 