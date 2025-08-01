'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import components that need client-side only rendering
const Sidebar = dynamic(() => import('@/components/layout/SidebarWithNavigation'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center min-h-screen">Loading sidebar...</div>
});

const MyJkknApiProvider = dynamic(() => import('@/components/providers/MyJkknApiProvider'), {
  ssr: false,
  loading: () => <div>Loading API provider...</div>
});

interface ClientWrapperProps {
  children: React.ReactNode;
  showSidebar: boolean;
  user?: any;
  userRole?: string | null;
}

export default function ClientWrapper({ children, showSidebar, user, userRole }: ClientWrapperProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (showSidebar) {
    return (
      <MyJkknApiProvider>
        <div className="flex">
          <Sidebar user={user} userRole={userRole}>{children}</Sidebar>
        </div>
      </MyJkknApiProvider>
    );
  }

  // Always wrap with MyJkknApiProvider to prevent context errors
  return (
    <MyJkknApiProvider>
      {children}
    </MyJkknApiProvider>
  );
} 