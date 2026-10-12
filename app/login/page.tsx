'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BarChart3, Boxes, LockKeyhole, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { FormError, Input } from '@/components/ui/Form';
import { errorMessage } from '@/lib/format';

/** Only allow redirects back into the admin (never to another site). */
function safeRedirect(value: string | null): string {
  if (value && value.startsWith('/admin') && !value.startsWith('//')) return value;
  return '/admin';
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const destination = safeRedirect(params.get('redirect'));

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace(destination);
  }, [isLoading, isAuthenticated, router, destination]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await login(email.trim(), password);
      router.replace(destination);
    } catch (err) {
      setError(errorMessage(err, 'Could not sign in. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FormError message={error} />
      <Input
        label="Email"
        type="email"
        autoComplete="username"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />
      <Button type="submit" size="lg" loading={submitting} className="mt-1 h-12 w-full">
        Sign in
      </Button>
    </form>
  );
}

const POINTS = [
  { icon: ShoppingCart, title: 'Orders', text: 'Confirm, pick, pack and ship from one screen.' },
  { icon: Boxes, title: 'Stock', text: 'Live stock across every warehouse.' },
  { icon: BarChart3, title: 'Reports', text: 'Sales, profit and GST in one place.' },
];

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 px-14 py-12 text-white lg:flex">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
        <Brand dark />
        <div className="relative max-w-md space-y-8">
          <h2 className="text-4xl font-extrabold leading-[1.15] tracking-tight">
            Every order, <span className="text-indigo-300">from payment to doorstep.</span>
          </h2>
          <ul className="space-y-5">
            {POINTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-4">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                  <Icon className="h-5 w-5 text-indigo-200" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-bold">{title}</span>
                  <span className="block text-sm text-slate-300">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-slate-400">Staff accounts only. Ask the store owner for access.</p>
      </aside>
      <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-7 flex justify-center lg:hidden">
            <Brand />
          </div>
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_20px_60px_-20px_rgba(30,27,75,0.25)] sm:p-9">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-[28px]">Staff sign in</h1>
            <p className="mb-7 mt-1.5 text-sm text-slate-500">Use your staff email and password.</p>
            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>
          </div>
          <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
            Keep your password private. Never share it with anyone.
          </p>
        </div>
      </section>
    </main>
  );
}

function Brand({ dark = false }: { dark?: boolean }) {
  return (
    <div className="relative inline-flex items-center gap-3">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-900 text-lg font-black text-white shadow-lg shadow-indigo-900/30 ring-1 ring-white/10">
        RG
      </span>
      <span className="leading-tight">
        <span className={`block text-xl font-extrabold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>
          RG<span className={dark ? 'text-indigo-300' : 'text-indigo-600'}>Enterprises</span>
        </span>
        <span className={`block text-[9px] font-bold uppercase tracking-[0.2em] ${dark ? 'text-indigo-200/70' : 'text-slate-400'}`}>Admin</span>
      </span>
    </div>
  );
}
