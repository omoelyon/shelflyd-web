'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/auth.store';
import { loginSchema, type LoginFormValues } from '@/lib/validations';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getApiError } from '@/lib/utils';
import { ShieldCheck, Eye, EyeOff, Store } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const { setToken } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: authApi.login,
    onSuccess: async ({ token }) => {
      setToken(token);
      await fetch('/api/auth/set-cookie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      router.push('/admin');
    },
    onError: (error) => toast.error(getApiError(error, 'Invalid credentials.')),
  });

  return (
    <div className="min-h-screen bg-[#091426] flex items-center justify-center px-4">
      {/* Background texture */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      {/* Glow */}
      <div className="pointer-events-none absolute top-0 left-1/3 h-[500px] w-[500px] rounded-full bg-[#0058be]/15 blur-[120px]" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-[#0058be] shadow-lg shadow-[#0058be]/30 mb-4">
            <Store className="h-7 w-7 text-white" />
          </div>
          <h1
            className="text-2xl font-bold text-white mb-1"
            style={{ fontFamily: 'var(--font-manrope)' }}
          >
            Admin Console
          </h1>
          <div className="inline-flex items-center gap-1.5 bg-white/8 border border-white/12 rounded-full px-3 py-1 text-xs text-slate-400">
            <ShieldCheck className="h-3 w-3 text-[#60a5fa]" />
            Shelflyd Platform Admin
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/8 backdrop-blur-xl border border-white/12 rounded-2xl p-7 shadow-[0_24px_64px_rgba(0,0,0,0.3)]">
          <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-slate-300">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@shelflyd.com"
                className="h-10 bg-white/8 border-white/15 text-white placeholder:text-slate-500 focus:border-[#0058be] focus:ring-[#0058be]"
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-slate-300">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="h-10 pr-10 bg-white/8 border-white/15 text-white placeholder:text-slate-500 focus:border-[#0058be] focus:ring-[#0058be]"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full h-10 rounded-lg font-semibold text-sm bg-[#0058be] text-white hover:bg-[#0058be]/90 disabled:opacity-60 transition-colors shadow-lg shadow-[#0058be]/20 mt-1"
            >
              {isPending ? 'Signing in…' : 'Sign In to Admin'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Not an admin?{' '}
          <Link href="/auth/login" className="text-slate-400 hover:text-white transition-colors">
            Go to regular login
          </Link>
        </p>
      </div>
    </div>
  );
}
