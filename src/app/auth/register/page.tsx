'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { registerSchema, type RegisterFormValues } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getApiError } from '@/lib/utils';
import { Store, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

const passwordHints = [
  'At least 8 characters',
  'One uppercase letter',
  'One number',
  'One special character',
];

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      toast.success('Account created! Please sign in.');
      router.push('/auth/login');
    },
    onError: (error) => toast.error(getApiError(error, 'Registration failed.')),
  });

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-col w-[42%] p-12 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #091426 0%, #0058be 100%)' }}>
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
            Join thousands of<br />African businesses
          </h2>
          <p className="text-white/70 text-base mb-10">
            Create your account and start selling to customers across Africa today.
          </p>

          <div className="space-y-4">
            <p className="text-sm font-medium text-white/60 uppercase tracking-wide">Password requirements</p>
            <ul className="space-y-2.5">
              {passwordHints.map((hint) => (
                <li key={hint} className="flex items-center gap-3">
                  <CheckCircle2 className="h-4.5 w-4.5 text-white/60 shrink-0" />
                  <span className="text-sm text-white/80">{hint}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-auto relative z-10 text-sm text-white/50">
          © {new Date().getFullYear()} Shelflyd. All rights reserved.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-background overflow-y-auto">
        <div className="w-full max-w-md">
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
            <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
            <p className="text-muted-foreground text-sm mt-1">Join Shelflyd and start buying or selling.</p>
          </div>

          <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                <Input id="firstName" placeholder="Adeola" className="h-10" {...register('firstName')} />
                {errors.firstName && (
                  <p className="text-xs text-destructive">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                <Input id="lastName" placeholder="Bello" className="h-10" {...register('lastName')} />
                {errors.lastName && (
                  <p className="text-xs text-destructive">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
              <Input id="email" type="email" placeholder="you@example.com" className="h-10" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phoneNumber" className="text-sm font-medium">Phone Number</Label>
              <Input id="phoneNumber" placeholder="08012345678" className="h-10" {...register('phoneNumber')} />
              {errors.phoneNumber && (
                <p className="text-xs text-destructive">{errors.phoneNumber.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
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
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="country" className="text-sm font-medium">Country</Label>
                <Input id="country" placeholder="Nigeria" className="h-10" {...register('country')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sector" className="text-sm font-medium">Sector</Label>
                <Input id="sector" placeholder="Agriculture" className="h-10" {...register('sector')} />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-10 bg-primary text-primary-foreground hover:opacity-90 font-medium"
              disabled={isPending}
            >
              {isPending ? 'Creating account…' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
