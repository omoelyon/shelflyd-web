'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/auth.store';
import { loginSchema, type LoginFormValues } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getApiError } from '@/lib/utils';
import { Store, Eye, EyeOff, ShoppingBag, Users, TrendingUp } from 'lucide-react';

const features = [
  { icon: ShoppingBag, text: 'Browse thousands of products from African businesses' },
  { icon: Store, text: 'Launch your own storefront in minutes' },
  { icon: Users, text: 'Connect with customers across Africa' },
  { icon: TrendingUp, text: 'Track orders, revenue, and growth' },
];

export default function LoginPage() {
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
      toast.success('Welcome back!');
      router.push('/dashboard');
    },
    onError: (error) => toast.error(getApiError(error, 'Invalid email or password.')),
  });

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-col w-[45%] p-12 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #091426 0%, #0058be 100%)' }}>
        {/* Background blobs */}
        <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-white/5" />
        <div className="absolute top-1/3 -right-16 h-80 w-80 rounded-full bg-white/5" />
        <div className="absolute -bottom-24 left-1/4 h-72 w-72 rounded-full bg-white/5" />

        <Link href="/" className="flex items-center gap-2.5 font-bold text-2xl relative z-10">
          <div className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Store className="h-5 w-5 text-white" />
          </div>
          Shelflyd
        </Link>

        <div className="mt-16 relative z-10">
          <h2 className="text-3xl font-bold leading-tight mb-3">
            Africa&apos;s marketplace<br />for growing businesses
          </h2>
          <p className="text-white/70 text-base mb-10">
            Sign in to manage your storefront, track orders, and grow your business.
          </p>

          <ul className="space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm text-white/85">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-auto relative z-10 text-sm text-white/50">
          © {new Date().getFullYear()} Shelflyd. All rights reserved.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-background">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-primary font-bold text-2xl">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Store className="h-4.5 w-4.5 text-white" />
              </div>
              Shelflyd
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
            <p className="text-muted-foreground text-sm mt-1">Sign in to your account to continue.</p>
          </div>

          <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="h-10"
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="h-10 pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              className="w-full h-10 bg-primary text-primary-foreground hover:opacity-90 font-medium"
              disabled={isPending}
            >
              {isPending ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-primary font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
