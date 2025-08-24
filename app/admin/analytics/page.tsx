import { BarChart3, Users, Calendar, DollarSign, TrendingUp } from 'lucide-react'
import UserFlowGuard from '@/components/auth/user-flow-guard'

export default function AdminAnalyticsPage() {
  return (
    <UserFlowGuard requiredRole="admin">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-[#0b6d41]" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">System Analytics</h1>
                <p className="text-gray-600 mt-1">Overview of platform performance</p>
              </div>
            </div>
          </div>
          
          {/* Simplified Analytics */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">System Analytics</h2>
            <p className="text-gray-600">Analytics dashboard will be available here.</p>
          </div>
        </div>
      </div>
    </UserFlowGuard>
  )
}
