// Role-Based Access Control (RBAC) System
// Defines permissions for each user role

export type UserRole = 'admin' | 'staff' | 'student';

export interface Permission {
  resource: string;
  actions: string[];
}

export interface RolePermissions {
  [key: string]: Permission[];
}

// Define all available routes and their required permissions
export const ROUTES = {
  // Dashboard
  DASHBOARD: '/',
  
  // Categories
  CATEGORIES_LIST: '/service-categories',
  CATEGORIES_CREATE: '/service-categories/new',
  CATEGORIES_EDIT: '/service-categories/edit',
  CATEGORIES_VIEW: '/service-categories/view',
  
  // Services
  SERVICES_LIST: '/services',
  SERVICES_CREATE: '/services/new',
  SERVICES_EDIT: '/services/edit',
  SERVICES_VIEW: '/services',
  
  // Service Requests
  SERVICE_REQUESTS: '/service-requests',
  
  // Student Portal
  STUDENT_PORTAL: '/student',
  
  // Payment Pages
  PAYMENT_FORM: '/payment',
  PAYMENT_SUCCESS: '/payment/success',
  PAYMENT_FAILURE: '/payment/failure',
  PAYMENT_ERROR: '/payment/error',
  
  // MyJKKN Data
  STUDENT_DATA: '/myjkkn/students',
  STAFF_DATA: '/myjkkn/staff',
  
  // Academic Management
  PROGRAMS: '/programs',
  INSTITUTIONS: '/institutions',
  DEPARTMENTS: '/departments',
  
  // Administration
  USER_MANAGEMENT: '/user-management',
  ANALYTICS: '/analytics',
  NOTIFICATIONS: '/notifications',
  TRANSACTION_TRACKING: '/admin/transaction-tracking',
  API_RESPONSE_CHECKER: '/admin/api-response-checker',
  
  // Account
  PROFILE: '/profile',
  LOGOUT: '/logout'
} as const;

// Define permissions for each role
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    // Admin has access to ALL routes
    ROUTES.DASHBOARD,
    ROUTES.CATEGORIES_LIST,
    ROUTES.CATEGORIES_CREATE,
    ROUTES.CATEGORIES_EDIT,
    ROUTES.CATEGORIES_VIEW,
    ROUTES.SERVICES_LIST,
    ROUTES.SERVICES_CREATE,
    ROUTES.SERVICES_EDIT,
    ROUTES.SERVICES_VIEW,
    ROUTES.SERVICE_REQUESTS,
    ROUTES.STUDENT_PORTAL,
    ROUTES.PAYMENT_FORM,
    ROUTES.PAYMENT_SUCCESS,
    ROUTES.PAYMENT_FAILURE,
    ROUTES.PAYMENT_ERROR,
    ROUTES.STUDENT_DATA,
    ROUTES.STAFF_DATA,
    ROUTES.PROGRAMS,
    ROUTES.INSTITUTIONS,
    ROUTES.DEPARTMENTS,
    ROUTES.USER_MANAGEMENT,
    ROUTES.ANALYTICS,
    ROUTES.NOTIFICATIONS,
    ROUTES.TRANSACTION_TRACKING,
    ROUTES.API_RESPONSE_CHECKER,
    ROUTES.PROFILE,
    ROUTES.LOGOUT
  ],
  
  staff: [
    // Staff has limited access
    ROUTES.DASHBOARD,
    ROUTES.CATEGORIES_LIST,
    ROUTES.CATEGORIES_CREATE,
    ROUTES.CATEGORIES_EDIT,
    ROUTES.CATEGORIES_VIEW,
    ROUTES.SERVICES_LIST,
    ROUTES.SERVICES_CREATE,
    ROUTES.SERVICES_EDIT,
    ROUTES.SERVICES_VIEW,
    ROUTES.SERVICE_REQUESTS,
    ROUTES.PAYMENT_FORM,
    ROUTES.PAYMENT_SUCCESS,
    ROUTES.PAYMENT_FAILURE,
    ROUTES.PAYMENT_ERROR,
    ROUTES.PROFILE,
    ROUTES.LOGOUT
  ],
  
  student: [
    // Students have access to Student Portal and Payment pages
    ROUTES.STUDENT_PORTAL,
    ROUTES.PAYMENT_FORM,
    ROUTES.PAYMENT_SUCCESS,
    ROUTES.PAYMENT_FAILURE,
    ROUTES.PAYMENT_ERROR,
    ROUTES.PROFILE,
    ROUTES.LOGOUT
  ]
};

// Navigation items with role requirements
export interface NavigationItem {
  href: string;
  label: string;
  icon: string;
  section?: string;
  requiredRoles: UserRole[];
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  // Main Menu
  {
    href: ROUTES.DASHBOARD,
    label: 'Dashboard',
    icon: 'LayoutDashboardIcon',
    section: 'Main Menu',
    requiredRoles: ['admin', 'staff']
  },
  
  // Categories
  {
    href: ROUTES.CATEGORIES_CREATE,
    label: 'Create Categories',
    icon: 'FolderPlusIcon',
    section: 'Categories',
    requiredRoles: ['admin', 'staff']
  },
  {
    href: ROUTES.CATEGORIES_LIST,
    label: 'Categories List',
    icon: 'FoldersIcon',
    section: 'Categories',
    requiredRoles: ['admin', 'staff']
  },
  
  // Services
  {
    href: ROUTES.SERVICES_CREATE,
    label: 'Create Services',
    icon: 'FilePlusIcon',
    section: 'Services',
    requiredRoles: ['admin', 'staff']
  },
  {
    href: ROUTES.SERVICES_LIST,
    label: 'Services List',
    icon: 'FileTextIcon',
    section: 'Services',
    requiredRoles: ['admin', 'staff']
  },
  
  // Student Portal - Dedicated Section
  {
    href: ROUTES.STUDENT_PORTAL,
    label: 'Services Portal',
    icon: 'GraduationCapIcon',
    section: 'Student Portal',
    requiredRoles: ['student']
  },
  
  // Other
  {
    href: ROUTES.SERVICE_REQUESTS,
    label: 'Service Requests',
    icon: 'ClipboardListIcon',
    section: 'Other',
    requiredRoles: ['admin', 'staff']
  },
  
  // Student Portal for Admin (View Only)
  {
    href: ROUTES.STUDENT_PORTAL,
    label: 'Student Portal',
    icon: 'GraduationCapIcon',
    section: 'Student Portal',
    requiredRoles: ['admin']
  },
  
  // MyJKKN Data (Admin only)
  {
    href: ROUTES.STUDENT_DATA,
    label: 'Student Data',
    icon: 'UsersIcon',
    section: 'Other',
    requiredRoles: ['admin']
  },
  {
    href: ROUTES.STAFF_DATA,
    label: 'Staff Data',
    icon: 'UserCheckIcon',
    section: 'Other',
    requiredRoles: ['admin']
  },
  
  // Academic Management (Admin only)
  {
    href: ROUTES.PROGRAMS,
    label: 'Programs',
    icon: 'GraduationCapIcon',
    section: 'Other',
    requiredRoles: ['admin']
  },
  {
    href: ROUTES.INSTITUTIONS,
    label: 'Institutions',
    icon: 'BuildingIcon',
    section: 'Other',
    requiredRoles: ['admin']
  },
  {
    href: ROUTES.DEPARTMENTS,
    label: 'Departments',
    icon: 'GraduationCapIcon',
    section: 'Other',
    requiredRoles: ['admin']
  },
  
  // Administration (Admin only)
  {
    href: ROUTES.USER_MANAGEMENT,
    label: 'User Management',
    icon: 'UsersIcon',
    section: 'Administration',
    requiredRoles: ['admin']
  },
  {
    href: ROUTES.ANALYTICS,
    label: 'Analytics',
    icon: 'BarChartIcon',
    section: 'Administration',
    requiredRoles: ['admin']
  },
  {
    href: ROUTES.NOTIFICATIONS,
    label: 'Notifications',
    icon: 'BellIcon',
    section: 'Administration',
    requiredRoles: ['admin']
  },
  {
    href: ROUTES.TRANSACTION_TRACKING,
    label: 'Transaction Tracking',
    icon: 'DatabaseIcon',
    section: 'Administration',
    requiredRoles: ['admin']
  },
  {
    href: ROUTES.API_RESPONSE_CHECKER,
    label: 'API Response Checker',
    icon: 'CogIcon',
    section: 'Administration',
    requiredRoles: ['admin']
  },
  
  // Account (All roles)
  {
    href: ROUTES.PROFILE,
    label: 'My Profile',
    icon: 'UserIcon',
    section: 'Account',
    requiredRoles: ['admin', 'staff', 'student']
  },
  {
    href: ROUTES.LOGOUT,
    label: 'Logout',
    icon: 'LogOutIcon',
    section: 'Account',
    requiredRoles: ['admin', 'staff', 'student']
  }
];

/**
 * Check if a user has access to a specific route
 */
export function hasAccess(userRole: UserRole | null, route: string): boolean {
  if (!userRole) return false;
  return ROLE_PERMISSIONS[userRole].some(allowedRoute => 
    route === allowedRoute || route.startsWith(allowedRoute)
  );
}

/**
 * Get accessible navigation items for a user role
 */
export function getAccessibleNavItems(userRole: UserRole | null): NavigationItem[] {
  if (!userRole) return [];
  
  return NAVIGATION_ITEMS.filter(item => 
    item.requiredRoles.includes(userRole)
  );
}

/**
 * Check if user can access a navigation item
 */
export function canAccessNavItem(userRole: UserRole | null, item: NavigationItem): boolean {
  if (!userRole) return false;
  return item.requiredRoles.includes(userRole);
}

/**
 * Get default route for a user role
 */
export function getDefaultRoute(userRole: UserRole): string {
  switch (userRole) {
    case 'admin':
    case 'staff':
      return ROUTES.DASHBOARD;
    case 'student':
      return ROUTES.STUDENT_PORTAL;
    default:
      return ROUTES.DASHBOARD;
  }
}

/**
 * Redirect user to appropriate page based on role
 */
export function getRedirectPath(userRole: UserRole | null, currentPath: string): string | null {
  if (!userRole) return '/login';
  
  // If user has access to current path, no redirect needed
  if (hasAccess(userRole, currentPath)) {
    return null;
  }
  
  // Redirect to default route for their role
  return getDefaultRoute(userRole);
} 