'use client';

import Link from 'next/link';
import { ArrowRight, ShoppingBag, Store, Users, Sparkles, CheckCircle, TrendingUp, Shield, Layers } from 'lucide-react';
import FeaturedBusinesses from '@/components/features/business/featured-businesses';
import StatCard from '@/components/ui/stat-card';
import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '@/lib/api/categories';
import { Skeleton } from '@/components/ui/skeleton';

const platformStats = [
  { icon: Store,    label: 'Active Businesses', value: '500+',    accent: '#0058be', bg: '#eff4ff' },
  { icon: ShoppingBag, label: 'Products Listed', value: '12,000+', accent: '#059669', bg: '#ecfdf5' },
  { icon: Users,    label: 'Happy Customers',   value: '35,000+', accent: '#d97706', bg: '#fffbeb' },
];

const steps = [
  {
    step: '01',
    title: 'Create an Account',
    desc: 'Sign up in seconds and set up your profile on Shelflyd.',
  },
  {
    step: '02',
    title: 'Register Your Business',
    desc: 'Add your business details, logo, and brand colors. Get approved quickly.',
  },
  {
    step: '03',
    title: 'Start Selling',
    desc: 'List your products and start receiving orders from customers across Africa.',
  },
];

const sellerPerks = [
  'Your own subdomain storefront (yourbrand.shelflyd.com)',
  'Manage products, inventory, and orders from one dashboard',
  'Accept payments via Paystack, Flutterwave, or Stripe',
  'Invite team members to manage your store',
];

export default function LandingPage() {
  const { data: categories, isLoading: catsLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.list,
  });

  return (
    <div className="flex flex-col">
      {/* ── Hero — dark editorial ── */}
      <section className="relative overflow-hidden bg-[#091426] py-28 md:py-36 px-4">
        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        {/* Glow blobs */}
        <div className="pointer-events-none absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-[#0058be]/20 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-[#0058be]/10 blur-[100px]" />

        <div className="relative max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 border border-white/15 rounded-full px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-[#60a5fa]" />
            Africa&apos;s Multi-Tenant Marketplace
          </div>

          <h1 className="text-5xl md:text-[4.5rem] font-bold text-white leading-[1.05] tracking-tight font-heading">
            Every business deserves
            <br />
            <span className="text-[#60a5fa]">its own storefront</span>
          </h1>

          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
            Discover thousands of businesses, shop fresh produce, and connect with sellers across Africa.
            Launch your own branded store in minutes.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/businesses"
              className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-lg font-semibold text-base bg-[#0058be] text-white hover:bg-[#0058be]/90 shadow-lg shadow-[#0058be]/30 transition-all"
            >
              Browse Businesses <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center h-12 px-8 rounded-lg font-semibold text-base bg-white/10 text-white border border-white/20 hover:bg-white/15 backdrop-blur-sm transition-all"
            >
              Start Selling Free
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-sm text-white/50">
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-[#60a5fa]" /> Verified Businesses
            </span>
            <span className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-[#60a5fa]" /> 35,000+ Happy Customers
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-[#60a5fa]" /> Secure Payments
            </span>
          </div>
        </div>
      </section>

      {/* ── Stats — tonal layering ── */}
      <section className="bg-[#f8f9ff] py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {platformStats.map((s) => (
              <StatCard key={s.label} {...s} className="p-7 shadow-card-lg" />
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="bg-[#eff4ff] py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold text-[#0058be] uppercase tracking-[0.1em] mb-2">Browse</p>
            <h2 className="text-3xl font-bold text-[#091426] font-heading">Shop by Category</h2>
          </div>

          {catsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </div>
          ) : categories && categories.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${encodeURIComponent(cat.name)}`}
                  className="group flex flex-col items-center gap-2.5 p-5 rounded-2xl bg-white hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5"
                >
                  {cat.icon ? (
                    <span className="text-3xl">{cat.icon}</span>
                  ) : (
                    <Layers className="h-7 w-7 text-[#0058be]" />
                  )}
                  <span className="text-sm font-semibold text-[#0b1c30] text-center leading-tight">
                    {cat.name}
                  </span>
                  <span className="text-[11px] text-[#64748b]">{cat.productCount} items</span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* ── Featured Businesses ── */}
      <section className="py-16 px-4 bg-[#f8f9ff]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-semibold text-[#0058be] uppercase tracking-[0.1em] mb-2">Explore</p>
              <h2 className="text-3xl font-bold text-[#091426] font-heading">Featured Businesses</h2>
            </div>
            <Link
              href="/businesses"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0058be] hover:text-[#091426] transition-colors shrink-0"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <FeaturedBusinesses limit={6} />
        </div>
      </section>

      {/* ── Seller CTA ── */}
      <section className="py-20 px-4 bg-[#eff4ff]">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-3xl p-10 md:p-14 text-white relative overflow-hidden gradient-primary">
            <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/[0.05]" />
            <div className="absolute -bottom-24 -left-12 h-80 w-80 rounded-full bg-white/[0.05]" />

            <div className="relative grid md:grid-cols-2 gap-10 items-center">
              <div className="space-y-6">
                <p className="text-xs font-semibold text-white/60 uppercase tracking-[0.1em]">
                  For Sellers
                </p>
                <h2 className="text-3xl md:text-4xl font-bold leading-tight font-heading">
                  Ready to grow your business on Shelflyd?
                </h2>
                <p className="text-white/65 text-base leading-relaxed">
                  Get your own branded storefront and start selling to customers across Africa today.
                </p>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center justify-center gap-2 rounded-lg font-semibold bg-white text-[#091426] hover:bg-white/90 h-12 px-7 text-base shadow-lg transition-all"
                >
                  Get Started Free <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <ul className="space-y-3.5">
                {sellerPerks.map((perk) => (
                  <li key={perk} className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-sm text-white/80 leading-relaxed">{perk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 px-4 bg-[#f8f9ff]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-[#0058be] uppercase tracking-[0.1em] mb-2">
              Simple Process
            </p>
            <h2 className="text-3xl font-bold text-[#091426] font-heading">How It Works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-[calc(33%+1rem)] right-[calc(33%+1rem)] h-px bg-gradient-to-r from-transparent via-[#0058be]/30 to-transparent" />

            {steps.map(({ step, title, desc }) => (
              <div key={step} className="relative bg-white rounded-2xl p-7 text-center shadow-card-lg">
                <div className="h-14 w-14 rounded-2xl bg-[#091426] text-white text-lg font-bold font-heading flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#091426]/30">
                  {step}
                </div>
                <h3 className="font-bold text-base mb-2 text-[#091426] font-heading">{title}</h3>
                <p className="text-[#64748b] text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
