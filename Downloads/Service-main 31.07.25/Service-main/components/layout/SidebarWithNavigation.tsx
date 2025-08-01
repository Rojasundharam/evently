'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Sidebar,
  SidebarProvider,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarFooter,
  useSidebar
} from '@/components/ui/sidebar';
import { 
  MenuIcon,
  ArrowLeftIcon, 
  ArrowRightIcon,
  LayoutDashboardIcon,
  FolderPlusIcon,
  FoldersIcon,
  FilePlusIcon,
  FileTextIcon,
  ClipboardListIcon,
  GraduationCapIcon,
  BuildingIcon,
  LogOutIcon,
  UserIcon,
  SettingsIcon,
  UsersIcon,
  UserCheckIcon,
  FolderIcon,
  BarChartIcon,
  BellIcon,
  CogIcon,
  DatabaseIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import MobileHeader from './MobileHeader';
import { getAccessibleNavItems, NavigationItem, UserRole } from '@/lib/rbac';

// Persistent toggle visible when sidebar is collapsed on desktop/tablet
function PersistentSidebarOpener() {
  const { isMobile, state, setOpen } = useSidebar();
  
  // Only show when sidebar is collapsed and not on mobile
  if (isMobile || state !== 'collapsed') return null;
  
  return (
    <Button
      variant="outline"
      size="icon"
      className="hidden md:flex fixed top-4 left-4 z-50 bg-white/90 backdrop-blur-sm shadow-md border border-gray-200 rounded-full transition-all hover:bg-gray-50"
      onClick={() => setOpen(true)}
    >
      <MenuIcon className="h-5 w-5 text-gray-700" />
      <span className="sr-only">Open Sidebar</span>
    </Button>
  );
}

function ViewportIndicator() {
  return (
    <div className="hidden">
      {/* Only shown for development purposes if needed */}
      <div className="md:hidden">Mobile View</div>
      <div className="hidden md:block lg:hidden">Tablet View</div>
      <div className="hidden lg:block">Desktop View</div>
    </div>
  );
}

// Icon mapping function
function getIcon(iconName: string): React.ElementType {
  const iconMap: Record<string, React.ElementType> = {
    LayoutDashboardIcon,
    FolderPlusIcon,
    FoldersIcon,
    FilePlusIcon,
    FileTextIcon,
    ClipboardListIcon,
    GraduationCapIcon,
    BuildingIcon,
    UsersIcon,
    UserCheckIcon,
    BarChartIcon,
    BellIcon,
    CogIcon,
    DatabaseIcon,
    UserIcon,
    LogOutIcon
  };
  return iconMap[iconName] || FoldersIcon; // Default icon
}

// Create a wrapper for menu items that handles closing the sidebar on mobile
function MobileAwareMenuItem({ 
  children, 
  href, 
  icon: Icon 
}: { 
  children: React.ReactNode, 
  href: string, 
  icon: React.ElementType 
}) {
  const { isMobile, openMobile, setOpenMobile } = useSidebar();
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href);
  
  const handleClick = () => {
    if (isMobile && openMobile) {
      setOpenMobile(false);
    }
  };
  
  return (
    <SidebarMenuItem>
      <Link href={href} onClick={handleClick} className="w-full">
        <SidebarMenuButton 
          isActive={isActive}
          className={`relative text-sm py-2 px-2 w-full transition-all duration-200 rounded-md ${
            isActive 
              ? 'bg-primary-50 text-primary-700 font-medium after:absolute after:top-1/2 after:-translate-y-1/2 after:left-0 after:h-3/5 after:w-0.5 after:bg-primary-700 after:rounded-r-full' 
              : 'hover:bg-gray-50 hover:text-gray-800 text-gray-600'
          }`}
        >
          <div className="flex items-center space-x-3 pl-2">
            <Icon className={`h-4 w-4 ${isActive ? 'text-primary-700' : 'text-gray-500'}`} />
            <span className="sidebar-expanded-only font-medium text-xs">{children}</span>
          </div>
        </SidebarMenuButton>
      </Link>
    </SidebarMenuItem>
  );
}

interface SidebarWithNavigationProps {
  children: React.ReactNode;
  user?: any;
  userRole?: string | null;
}

export default function SidebarWithNavigation({ children, user, userRole }: SidebarWithNavigationProps) {
  // Determine if we should show expanded sidebar by default based on viewport
  const [defaultOpen, setDefaultOpen] = useState(true);
  
  useEffect(() => {
    // Set sidebar expanded state based on screen size
    const handleResize = () => {
      setDefaultOpen(window.innerWidth >= 1024); // Desktop: expanded, Tablet/Mobile: collapsed
    };
    
    // Set initial state
    handleResize();
    
    // Add event listener for resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get accessible navigation items based on user role
  const accessibleNavItems = getAccessibleNavItems(userRole as UserRole);

  // Group navigation items by section
  const groupedNavItems = accessibleNavItems.reduce((groups, item) => {
    const section = item.section || 'Other';
    if (!groups[section]) {
      groups[section] = [];
    }
    groups[section].push(item);
    return groups;
  }, {} as Record<string, NavigationItem[]>);

  // Render navigation items for a section
  const renderNavSection = (sectionName: string, items: NavigationItem[]) => (
    <div key={sectionName}>
      <div className="mt-3 mb-1 px-3 sidebar-expanded-only">
        <div className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider">
          {sectionName}
        </div>
      </div>
      {items.map((item) => {
        const Icon = getIcon(item.icon);
        return (
          <MobileAwareMenuItem key={item.href} href={item.href} icon={Icon}>
            {item.label}
          </MobileAwareMenuItem>
        );
      })}
    </div>
  );

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <div className="flex min-h-screen w-full overflow-hidden">
        <Sidebar className="border-r border-gray-200 shadow-lg w-[170px] md:w-[175px] lg:w-[200px] sidebar-collapsed:w-[50px] bg-white z-40">
          <SidebarHeader>
            <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-white">
              <div className="flex items-center">
                <div className="w-7 h-7 rounded-md bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center text-white font-bold mr-2 shadow-sm">
                  <span className="text-xs">J</span>
                </div>
                <div className="sidebar-expanded-only">
                  <h2 className="text-sm font-bold text-gray-800 tracking-tight">JKKN Admin</h2>
                  <p className="text-xs text-gray-500">Service Management</p>
                </div>
              </div>
              <SidebarTrigger className="flex md:flex lg:flex text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1 rounded-md">
                <ArrowLeftIcon className="h-3 w-3 sidebar-expanded-only" />
                <ArrowRightIcon className="h-3 w-3 sidebar-collapsed-only" />
              </SidebarTrigger>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="py-2">
            <SidebarMenu>
              {Object.entries(groupedNavItems)
                .filter(([sectionName]) => sectionName !== 'Account') // Handle Account section separately
                .map(([sectionName, items]) => renderNavSection(sectionName, items))}
            </SidebarMenu>
          </SidebarContent>
          
          <SidebarFooter className="mt-auto border-t border-gray-100 pt-2 pb-3">
            <SidebarMenu>
              {groupedNavItems['Account'] && renderNavSection('Account', groupedNavItems['Account'])}
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="bg-white flex-1">
          <MobileHeader />
          <PersistentSidebarOpener />
          <ViewportIndicator />
          <div className="w-full h-full max-w-full overflow-x-hidden">
            <div className="md:pt-0 pt-12">
              {children}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}