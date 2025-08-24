import { lazy, Suspense } from 'react'

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
      <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
        <ModernSidebar>
          <div className="min-h-screen bg-gray-50">
            {/* Main Content */}
            <main className="p-6">
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
