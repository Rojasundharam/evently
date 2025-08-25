import { lazy, Suspense } from 'react'
import LoadingOptimizer from '@/components/performance/loading-optimizer'

// Lazy load heavy components
const ModernSidebar = lazy(() => import('./modern-sidebar'))
const BottomNavigation = lazy(() => import('./bottom-navigation'))
const FloatingActionButton = lazy(() => import('./floating-action-button'))

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <>
      {/* Modern Layout with Sidebar */}
      <Suspense fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4 w-48"></div>
            <div className="h-4 bg-gray-200 rounded mb-2 w-32"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      }>
        <ModernSidebar>
          <div className="min-h-screen bg-gray-50">
            {/* Main Content - Mobile-optimized padding */}
            <main className="p-0 lg:p-6">
              {children}
            </main>
          </div>
        </ModernSidebar>
      </Suspense>

      {/* Mobile Bottom Navigation */}
      <Suspense fallback={null}>
        <BottomNavigation />
      </Suspense>

      {/* Mobile FAB */}
      <Suspense fallback={null}>
        <FloatingActionButton />
      </Suspense>
    </>
  )
}
