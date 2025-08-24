import UserFlowGuard from '@/components/auth/user-flow-guard'

export default function AdminUsersPage() {
  return (
    <UserFlowGuard requiredRole="admin">
      <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage users and their roles</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">User Management</h2>
          <p className="text-gray-600">Admin user management functionality will be available here.</p>
        </div>
      </div>
      </div>
    </UserFlowGuard>
  )
}
