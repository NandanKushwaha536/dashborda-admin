'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type { AdminUser } from '@/lib/api/types';
import { isAdminRole, roleHasPermission, type Permission } from './permissions';

interface AuthContextValue {
  user: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  /** True when the signed-in role/permissions allow this (display only; the backend enforces). */
  can: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function pickUser(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const object = raw as Record<string, unknown>;
  const data = object.data && typeof object.data === 'object' ? (object.data as Record<string, unknown>) : null;
  if (data?.user && typeof data.user === 'object') return data.user as Record<string, unknown>;
  if (data) return data;
  if (object.user && typeof object.user === 'object') return object.user as Record<string, unknown>;
  return object;
}

/** Converts GET /users/me into the admin user shape. */
export function normalizeAdminUser(raw: unknown): AdminUser | null {
  const user = pickUser(raw);
  if (!user) return null;
  const id = String(user._id ?? user.id ?? '');
  const email = typeof user.email === 'string' ? user.email : '';
  if (!id && !email) return null;
  const avatar = user.avatar;
  return {
    id: id || email,
    name: typeof user.name === 'string' && user.name ? user.name : email.split('@')[0] || 'Admin',
    email,
    phone: typeof user.phone === 'string' ? user.phone : undefined,
    role: typeof user.role === 'string' ? user.role.toUpperCase() : 'USER',
    status: typeof user.status === 'string' ? user.status.toUpperCase() : 'ACTIVE',
    avatar:
      typeof avatar === 'string'
        ? avatar
        : avatar && typeof avatar === 'object' && typeof (avatar as Record<string, unknown>).url === 'string'
          ? String((avatar as Record<string, unknown>).url)
          : null,
    lastLogin: typeof user.lastLogin === 'string' ? user.lastLogin : undefined,
    permissions: Array.isArray(user.permissions) ? user.permissions.filter((p): p is string => typeof p === 'string') : [],
    permissionsConfigured: Boolean(user.permissionsConfigured),
  };
}

async function fetchCurrentUser(): Promise<AdminUser> {
  const user = normalizeAdminUser(await api.get<unknown>(ENDPOINTS.auth.me));
  if (!user) throw new Error('Could not read your account details.');
  return user;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const current = await fetchCurrentUser();
      setUser(isAdminRole(current.role) ? current : null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener('rg:auth-unauthorized', onUnauthorized);
    return () => window.removeEventListener('rg:auth-unauthorized', onUnauthorized);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      await api.post(ENDPOINTS.auth.login, { email, password });
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 400)) {
        throw new Error('Email or password is incorrect.');
      }
      throw error instanceof Error ? error : new Error('Could not sign in. Please try again.');
    }
    const current = await fetchCurrentUser();
    if (!isAdminRole(current.role)) {
      // A customer account signed in: end that session so it cannot linger here.
      await api.post(ENDPOINTS.auth.logout).catch(() => undefined);
      setUser(null);
      throw new Error('This account is not a staff account. Use an admin login.');
    }
    if (current.status !== 'ACTIVE') {
      await api.post(ENDPOINTS.auth.logout).catch(() => undefined);
      setUser(null);
      throw new Error('This staff account is blocked. Ask the store owner to reactivate it.');
    }
    setUser(current);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post(ENDPOINTS.auth.logout);
    } finally {
      setUser(null);
    }
  }, []);

  const can = useCallback(
    (permission: Permission) =>
      Boolean(user) && roleHasPermission(user!.role, permission, user!.permissions, user!.permissionsConfigured),
    [user]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      logout,
      refreshUser,
      can,
    }),
    [user, isLoading, login, logout, refreshUser, can]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
