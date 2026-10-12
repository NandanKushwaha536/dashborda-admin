'use client';

import { api } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';

/**
 * Refunds and staff changes need the admin to re-enter their password.
 * The backend returns a token valid for 10 minutes, sent as X-Step-Up-Token.
 */
export async function getStepUpToken(password: string): Promise<string> {
  const res = await api.post<{ data?: { stepUpToken?: string } }>(ENDPOINTS.auth.stepUp, { password });
  const token = res.data?.stepUpToken;
  if (!token) throw new Error('Password check failed. Please try again.');
  return token;
}

export function stepUpHeaders(token: string): Record<string, string> {
  return { 'X-Step-Up-Token': token };
}
