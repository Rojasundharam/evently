'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  UserIcon,
  UsersIcon,
  UserCheckIcon,
  GraduationCapIcon,
  SearchIcon,
  RefreshCwIcon,
  MoreHorizontalIcon,
  EditIcon,
  TrashIcon,
  BanIcon,
  Loader2Icon,
  AlertTriangleIcon,
  ShieldIcon,
  CheckCircleIcon,
  XCircleIcon
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUserManagement } from '@/hooks/useUserManagement';
import type { UserProfile, UpdateUserData, UserRole } from '@/lib/user-management';

export default function UserManagementPage() {
  const {
    users,
    stats,
    loading,
    actionLoading,
    loadData,
    handleUpdateUser,
    handleDeleteUser,
    handleToggleStatus,
    handleRoleChange
  } = useUserManagement();

  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filter users when dependencies change
  useEffect(() => {
    try {
      filterUsers();
      setError(null);
    } catch (error) {
      console.error('Error filtering users:', error);
      setError('Error filtering users');
    }
  }, [users, searchTerm, roleFilter, statusFilter]);

  const filterUsers = () => {
    try {
      let filtered = users || [];

      if (searchTerm) {
        filtered = filtered.filter(user => 
          (user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (roleFilter !== 'all') {
        filtered = filtered.filter(user => user.role === roleFilter);
      }

      if (statusFilter !== 'all') {
        filtered = filtered.filter(user => user.status === statusFilter);
      }

      setFilteredUsers(filtered);
    } catch (error) {
      console.error('Error in filterUsers:', error);
      setFilteredUsers([]);
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'staff': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'student': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-red-500';
      case 'staff': return 'bg-blue-500';
      case 'student': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const onEditUser = async (userData: UpdateUserData) => {
    if (!editingUser) return;
    try {
      const success = await handleUpdateUser(editingUser.id, userData);
      if (success) {
        setEditingUser(null);
      }
    } catch (error) {
      console.error('Error editing user:', error);
      setError('Failed to edit user');
    }
  };

  const onRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await handleRoleChange(userId, newRole);
    } catch (error) {
      console.error('Error changing role:', error);
    }
  };

  const onDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await handleDeleteUser(userId);
      } catch (error) {
        console.error('Error deleting user:', error);
        setError('Failed to delete user');
      }
    }
  };

  const onToggleStatus = async (userId: string) => {
    try {
      await handleToggleStatus(userId);
    } catch (error) {
      console.error('Error toggling status:', error);
      setError('Failed to toggle user status');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Loading state */}
      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2">
              <Loader2Icon className="h-6 w-6 animate-spin" />
              <span>Loading user data...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
            <h3 className="text-lg font-medium text-red-800">Error Loading User Management</h3>
          </div>
          <p className="text-red-700 mt-2">{error}</p>
          <div className="mt-4">
            <Button onClick={() => { setError(null); loadData(); }} variant="outline" className="border-red-300 text-red-700">
              <RefreshCwIcon className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Main content - only show if not loading */}
      {!loading && (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-3">
              <UserIcon className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                <p className="text-gray-600">Manage users, roles, and permissions across the platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <Button onClick={loadData} variant="outline" size="sm" disabled={loading} className="flex-1 sm:flex-none">
                <RefreshCwIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <UsersIcon className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Users</div>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircleIcon className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Active Users</div>
                  <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                  <ShieldIcon className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Admins</div>
                  <div className="text-2xl font-bold text-red-600">{stats.adminUsers}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <UserCheckIcon className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Staff</div>
                  <div className="text-2xl font-bold text-blue-600">{stats.staffUsers}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <GraduationCapIcon className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Students</div>
                  <div className="text-2xl font-bold text-green-600">{stats.studentUsers}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <XCircleIcon className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Inactive</div>
                  <div className="text-2xl font-bold text-gray-600">{stats.inactiveUsers}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Users ({filteredUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 rounded-full ${getAvatarColor(user.role)} flex items-center justify-center text-white text-sm font-medium`}>
                                {getInitials(user.full_name)}
                              </div>
                              <div>
                                <div className="font-medium">{user.full_name || 'No Name'}</div>
                                <div className="text-sm text-muted-foreground">{user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getRoleColor(user.role)}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusColor(user.status)}>
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontalIcon className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setEditingUser(user)}>
                                  <EditIcon className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onToggleStatus(user.id)}>
                                  <BanIcon className="h-4 w-4 mr-2" />
                                  {user.status === 'active' ? 'Deactivate' : 'Activate'}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => onDeleteUser(user.id)}
                                  className="text-red-600"
                                >
                                  <TrashIcon className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No users found matching your criteria
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Edit User Dialog */}
      {editingUser && (
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent>
            <EditUserDialog 
              user={editingUser} 
              onClose={() => setEditingUser(null)}
              onSave={onEditUser}
              loading={actionLoading === editingUser.id}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function EditUserDialog({ 
  user, 
  onClose, 
  onSave,
  loading
}: { 
  user: UserProfile; 
  onClose: () => void; 
  onSave: (userData: UpdateUserData) => void;
  loading?: boolean;
}) {
  const [formData, setFormData] = useState<UpdateUserData>({
    full_name: user.full_name || '',
    role: user.role || 'student',
    status: user.status
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit User</DialogTitle>
        <DialogDescription>
          Update user information and permissions.
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="edit-name">Full Name</Label>
          <Input
            id="edit-name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            placeholder="Enter full name"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="edit-email">Email</Label>
          <Input
            id="edit-email"
            type="email"
            value={user.email}
            disabled
            className="bg-gray-50"
          />
          <p className="text-xs text-gray-500">Email cannot be changed</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="edit-role">Role</Label>
          <Select 
            value={formData.role} 
            onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="edit-status">Status</Label>
          <Select 
            value={formData.status} 
            onValueChange={(value: 'active' | 'inactive') => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
} 