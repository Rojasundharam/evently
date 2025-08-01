'use client';

import React from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

export default function MobileHeader() {
  const { openMobile, setOpenMobile } = useSidebar();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center h-12 px-3 bg-white shadow-sm md:static md:bg-transparent md:shadow-none md:h-auto md:py-4 md:px-8 border-b border-gray-100 md:border-0">
      <Button 
        variant="ghost" 
        size="sm"
        className="p-1.5 md:hidden text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors"
        onClick={() => setOpenMobile(!openMobile)}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle Menu</span>
      </Button>
      <div className="flex-1 md:hidden">
        <div className="flex justify-center">
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center text-white font-bold shadow-sm">
              <span className="text-[10px]">J</span>
            </div>
            <h2 className="text-sm font-bold text-gray-800 tracking-tight ml-2">JKKN Admin</h2>
          </div>
        </div>
      </div>
      
      {/* Notification Center */}
      <div className="md:hidden">
        <NotificationCenter />
      </div>
    </div>
  );
} 