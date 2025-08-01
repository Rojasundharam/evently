'use client';

import React from 'react';
import { ReactNode } from 'react';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

/**
 * A responsive container for page content with appropriate padding for different viewport sizes
 * Use this component to wrap all page content for consistent layout across the application
 */
export default function PageContainer({ 
  children, 
  className = '',
  maxWidth = 'xl',
}: PageContainerProps) {
  const { isMobile, openMobile, state } = useSidebar();
  
  const maxWidthClasses = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    full: 'max-w-full',
  };
  
  return (
    <div 
      className={cn(
        'min-h-screen w-full transition-all duration-200',
        isMobile 
          ? `p-4 pt-16 ${openMobile ? 'ml-64' : 'ml-0'}` // Add margin when mobile sidebar is open
          : state === 'expanded' 
            ? 'p-6' 
            : 'p-4',
        maxWidthClasses[maxWidth],
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Responsive page title component with appropriate sizing for different viewports
 */
export function PageTitle({ 
  children, 
  className 
}: { 
  children: ReactNode;
  className?: string;
}) {
  return (
    <h1 className={cn(
      "text-2xl md:text-3xl font-bold tracking-tight",
      className
    )}>
      {children}
    </h1>
  );
}

/**
 * Responsive grid container with automatic column adjustment based on viewport size
 */
export function ResponsiveGrid({ 
  children, 
  className = '', 
  cols = { 
    base: 1,   // Mobile: 1 column
    sm: 2,     // Tablet: 2 columns
    lg: 3      // Desktop: 3 columns
  } 
}: { 
  children: ReactNode, 
  className?: string,
  cols?: {
    base: number,
    sm?: number,
    md?: number,
    lg?: number,
    xl?: number
  }
}) {
  const getColsClass = () => {
    let colsClass = `grid-cols-${cols.base}`;
    
    if (cols.sm) colsClass += ` sm:grid-cols-${cols.sm}`;
    if (cols.md) colsClass += ` md:grid-cols-${cols.md}`;
    if (cols.lg) colsClass += ` lg:grid-cols-${cols.lg}`;
    if (cols.xl) colsClass += ` xl:grid-cols-${cols.xl}`;
    
    return colsClass;
  };
  
  return (
    <div className={`grid gap-4 md:gap-6 ${getColsClass()} ${className}`}>
      {children}
    </div>
  );
}

/**
 * Card component optimized for mobile and desktop views
 */
export function ResponsiveCard({ 
  children, 
  className 
}: { 
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      "rounded-lg border bg-card p-4 shadow-sm",
      className
    )}>
      {children}
    </div>
  );
} 