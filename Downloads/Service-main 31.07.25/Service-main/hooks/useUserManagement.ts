import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import {
  getAllUsers,
  getUserStats,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  updateUserRole,
  subscribeToUserChanges,
  type UserProfile,
  type CreateUserData,
  type UpdateUserData,
  type UserRole,
  type UserStats
} from '@/lib/user-management';

export function useUserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    staffUsers: 0,
    studentUsers: 0,
    inactiveUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const subscriptionRef = useRef<any>(null);
  const { toast } = useToast();

  // Load data on mount and setup real-time subscription
  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 5;

    const initializeData = async () => {
      // Wait for auth to be ready
      while (mounted && retryCount < maxRetries) {
        try {
          console.log(`🔄 Attempt ${retryCount + 1}/${maxRetries} - Checking auth status...`);
          
          // Import supabase here to ensure it's ready
          const { supabase } = await import('@/lib/supabase');
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (session && !error) {
            console.log('✅ Auth session found, loading data...');
            await loadData();
    setupRealtimeSubscription();
            break;
          } else {
            console.log(`❌ No session found (attempt ${retryCount + 1}), retrying in 1s...`);
            retryCount++;
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        } catch (error) {
          console.error('Error checking auth:', error);
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      if (retryCount >= maxRetries) {
        console.warn('❌ Max retries reached, auth session not found');
        setLoading(false);
      }
    };

    initializeData();

    // Cleanup subscription on unmount
    return () => {
      mounted = false;
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [usersData, statsData] = await Promise.all([
        getAllUsers(),
        getUserStats()
      ]);
      
      setUsers(usersData);
      if (statsData) {
      setStats(statsData);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load user data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    try {
      subscriptionRef.current = subscribeToUserChanges(async (updatedUsers) => {
        console.log('Real-time user update received');
        setUsers(updatedUsers);
        
        // Update stats
        try {
          const newStats = await getUserStats();
          if (newStats) {
          setStats(newStats);
          }
        } catch (error) {
          console.error('Error updating stats from real-time:', error);
        }
      });
    } catch (error) {
      console.error('Error setting up real-time subscription:', error);
    }
  };

  const handleCreateUser = async (userData: CreateUserData) => {
    try {
      setActionLoading('create');
      await createUser(userData);
      
      // Data will be updated via real-time subscription
      // But also refresh manually to ensure consistency
      await loadData();
      
      toast({
        title: "Success",
        description: "User created successfully.",
      });
      return true;
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create user",
        variant: "destructive",
      });
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateUser = async (userId: string, userData: UpdateUserData) => {
    try {
      setActionLoading(userId);
      await updateUser(userId, userData);
      
      toast({
        title: "Success",
        description: "User updated successfully.",
      });
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user",
        variant: "destructive",
      });
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      setActionLoading(userId);
      await deleteUser(userId);
      
      toast({
        title: "Success",
        description: "User deactivated successfully.",
      });
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to deactivate user",
        variant: "destructive",
      });
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      setActionLoading(userId);
      await toggleUserStatus(userId);
      
      toast({
        title: "Success",
        description: "User status updated successfully.",
      });
      return true;
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user status",
        variant: "destructive",
      });
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      setActionLoading(userId);
      await updateUserRole(userId, newRole);
      
      toast({
        title: "Success",
        description: "User role updated successfully.",
      });
      return true;
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user role",
        variant: "destructive",
      });
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  return {
    users,
    stats,
    loading,
    actionLoading,
    loadData,
    handleCreateUser,
    handleUpdateUser,
    handleDeleteUser,
    handleToggleStatus,
    handleRoleChange
  };
} 