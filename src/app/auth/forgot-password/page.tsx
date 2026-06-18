'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { authApi } from '@/lib/api/auth';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getApiError } from '@/lib/utils';
import { Store, Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: ForgotPasswordFormValues) => authApi.forgotPassword(data.email),
    onSuccess: (_, variables) => {
      setSentEmail(variables.email);
      setSent(true);
    },
    onError: (error) => toast.error(getApiError(error, 'Something went wrong. Please try again.')),
  });

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-primary font-bold text-2xl">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Store className="h-4 w-4 text-white" />
            </div>
            Shelflyd
          </Link>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle className="h-7 w-7 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold">Check your email</h1>
            <p className="text-muted-foreground text-sm">
              If an account exists for <span className="font-medium text-foreground">{sentEmail}</span>,
              we&apos;ve sent a 6-digit reset code. It expires in 15 minutes.
            </p>
            <Link
              href={`/auth/reset-password?email=${encodeURIComponent(sentEmail)}`}
              className="inline-block w-full"
            >
              <Button className="w-full bg-primary text-primary-foreground hover:opacity-90">
                Enter Reset Code
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground">
              Didn&apos;t receive it?{' '}
              <button
                onClick={() => setSent(false)}
                className="text-primary hover:underline font-medium"
              >
                Try again
              </button>
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold">Forgot your password?</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Enter your email and we&apos;ll send you a reset code.
              </p>
            </div>

            <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="h-10 pl-9"
                    {...register('email')}
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <Button
                type="submit"
                className="w-full h-10 bg-primary text-primary-foreground hover:opacity-90 font-medium"
                disabled={isPending}
              >
                {isPending ? 'Sending…' : 'Send Reset Code'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
