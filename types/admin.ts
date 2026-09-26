export type AdminUser = {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  role: string;
  status?: string;
  avatar?: string | { url?: string; publicId?: string } | null;
  isEmailVerified?: boolean;
  lastLogin?: string;
  permissions?: string[];
  permissionsConfigured?: boolean;
};

export type DashboardStats = {
  totalRevenue?: number;
  totalOrders?: number;
  customers?: number;
  pendingOrders?: number;
};

export type AdminDashboardData = {
  overview?: unknown;
  sales?: unknown[];
  recentOrders?: unknown[];
  topProducts?: unknown[];
  lowStockProducts?: unknown[];
  recentUsers?: unknown[];
};
