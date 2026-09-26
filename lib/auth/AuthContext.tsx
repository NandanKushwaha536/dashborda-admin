'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { api, ApiError } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { AdminUser, AdminRole } from '@/lib/api/types';

interface AuthContextType {
  user: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (roles: AdminRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeAdminUser(raw: unknown): AdminUser | null {
  if (!raw || typeof raw !== 'object') return null;

  const obj = raw as Record<string, unknown>;

  // Check potential wrapper objects: { data: { user: ... } }, { data: ... }, { user: ... }, or direct
  let candidate: Record<string, unknown> = obj;
  if (obj.data && typeof obj.data === 'object') {
    const dataObj = obj.data as Record<string, unknown>;
    if (dataObj.user && typeof dataObj.user === 'object') {
      candidate = dataObj.user as Record<string, unknown>;
    } else {
      candidate = dataObj;
    }
  } else if (obj.user && typeof obj.user === 'object') {
    candidate = obj.user as Record<string, unknown>;
  }

  const id = typeof candidate.id === 'string'
    ? candidate.id
    : typeof candidate._id === 'string'
    ? candidate._id
    : '';

  const email = typeof candidate.email === 'string' ? candidate.email : '';
  if (!email && !id) return null;

  const name = typeof candidate.name === 'string' ? candidate.name : email.split('@')[0] || 'Admin User';

  const rawRole = typeof candidate.role === 'string' ? candidate.role.toUpperCase() : 'VIEWER';
  const role: AdminRole = (
    rawRole === 'SUPER_ADMIN' ||
    rawRole === 'DEVELOPER' ||
    rawRole === 'ADMIN' ||
    rawRole === 'MANAGER' ||
    rawRole === 'VIEWER' ||
    rawRole === 'SUPPORT'
  ) ? rawRole : 'VIEWER';

  const rawStatus = typeof candidate.status === 'string' ? candidate.status.toUpperCase() : 'ACTIVE';
  const status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' = (
    rawStatus === 'ACTIVE' || rawStatus === 'INACTIVE' || rawStatus === 'SUSPENDED'
  ) ? rawStatus : 'ACTIVE';

  const permissions: string[] = Array.isArray(candidate.permissions)
    ? candidate.permissions.filter((p): p is string => typeof p === 'string')
    : [];

  return {
    id: id || email,
    name,
    email,
    phone: typeof candidate.phone === 'string' ? candidate.phone : undefined,
    role,
    status,
    // Backend stores avatar as { url, publicId } (or null) — never a plain
    // string — so it must be unwrapped here rather than type-checked as one.
    avatar:
      typeof candidate.avatar === 'string'
        ? candidate.avatar
        : candidate.avatar && typeof candidate.avatar === 'object'
        ? (typeof (candidate.avatar as Record<string, unknown>).url === 'string'
            ? ((candidate.avatar as Record<string, unknown>).url as string)
            : null)
        : null,
    isEmailVerified: typeof candidate.isEmailVerified === 'boolean' ? candidate.isEmailVerified : true,
    lastLogin: typeof candidate.lastLogin === 'string' ? candidate.lastLogin : undefined,
    permissions,
  };
}

async function fetchCurrentUser(): Promise<AdminUser> {
  let res: unknown;
  try {
    res = await api.get(ENDPOINTS.auth.me);
  } catch (err: unknown) {
    // If the primary endpoint returns 404, probe fallback /auth/me in case backend routing changes
    if (err instanceof ApiError && err.status === 404) {
      try {
        res = await api.get('/auth/me');
      } catch {
        throw err;
      }
    } else {
      throw err;
    }
  }

  const normalized = normalizeAdminUser(res);
  if (!normalized) {
    throw new Error('Invalid user profile structure returned from backend.');
  }
  return normalized;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const authenticatedUser = await fetchCurrentUser();
      setUser(authenticatedUser);
    } catch (err: unknown) {
      setUser(null);
      // On initial page mount or passive refresh, 401 is normal for unauthenticated guests
      if (err instanceof ApiError && err.status !== 401) {
        if (err.status === 403) {
          setError('Backend authorization error: Access forbidden (HTTP 403).');
        } else if (err.status === 404) {
          setError('Endpoint contract mismatch: Current-user endpoint not found (HTTP 404).');
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('rg:auth-unauthorized', handleUnauthorized);
      return () => window.removeEventListener('rg:auth-unauthorized', handleUnauthorized);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      setError(null);

      // 1. Submit credentials to authenticate and establish backend session cookie
      try {
        await api.post(ENDPOINTS.auth.login, { email, password });
      } catch (err: unknown) {
        let msg = 'Invalid login credentials.';
        if (err instanceof ApiError) {
          if (err.status === 403) {
            msg = 'Access forbidden: Your account does not have permission to access the admin portal.';
          } else if (err.status === 401) {
            msg = 'Invalid email or password.';
          } else if (err.message) {
            msg = err.message;
          }
        } else if (err instanceof Error) {
          msg = err.message;
        }
        setError(msg);
        throw new Error(msg);
      }

      // 2. Query authenticated current-user endpoint and verify authorization
      try {
        const authenticatedUser = await fetchCurrentUser();
        setUser(authenticatedUser);
      } catch (err: unknown) {
        setUser(null);
        let msg = 'Authentication verification failed.';
        if (err instanceof ApiError) {
          if (err.status === 401) {
            msg = 'Session authentication problem: Session cookie was not accepted or created (HTTP 401).';
          } else if (err.status === 403) {
            msg = 'Backend authorization error: User does not have required administrative role (HTTP 403).';
          } else if (err.status === 404) {
            msg = 'Endpoint contract mismatch: Current-user endpoint not found on backend (HTTP 404).';
          } else if (err.message) {
            msg = err.message;
          }
        } else if (err instanceof Error) {
          msg = err.message;
        }
        setError(msg);
        throw new Error(msg);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await api.post(ENDPOINTS.auth.logout);
    } catch {
      // Proceed with local state clearing even if network logout fails
    } finally {
      setUser(null);
    }
  }, []);

  const hasPermission = useCallback(
    (perm: string) => {
      if (!user) return false;
      if (user.role === 'SUPER_ADMIN') return true;
      if (user.role === 'DEVELOPER' && (perm === 'DEVELOPER_TOOLS' || perm.startsWith('DEV_'))) return true;
      return user.permissions?.includes(perm) ?? false;
    },
    [user]
  );

  const hasRole = useCallback(
    (roles: AdminRole[]) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      error,
      login,
      logout,
      refreshUser,
      hasPermission,
      hasRole,
    }),
    [user, isLoading, error, login, logout, refreshUser, hasPermission, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
