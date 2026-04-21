'use client';

import { useQuery } from '@tanstack/react-query';
import { businessesApi } from '@/lib/api/businesses';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, CheckCircle, Clock, Ban, ArrowUpRight, TrendingUp, Package } from 'lucide-react';
import Link from 'next/link';
import { formatStatus } from '@/lib/utils';

export default function AdminPage() {
  const { data: businesses, isLoading } = useQuery({
    queryKey: ['admin-businesses'],
    queryFn: businessesApi.adminListAll,
  });

  const stats = businesses
    ? {
        total: businesses.length,
        active: businesses.filter((b) => b.status === 'ACTIVE').length,
        pending: businesses.filter((b) => b.status === 'PENDING').length,
        suspended: businesses.filter((b) => b.status === 'SUSPENDED').length,
      }
    : null;

  const kpiCards = [
    {
      label: 'Total Businesses',
      value: stats?.total ?? 0,
      icon: Building2,
      accent: '#0058be',
      bg: '#eff4ff',
      href: '/admin/businesses',
    },
    {
      label: 'Active',
      value: stats?.active ?? 0,
      icon: CheckCircle,
      accent: '#059669',
      bg: '#ecfdf5',
      href: '/admin/businesses',
    },
    {
      label: 'Pending Approval',
      value: stats?.pending ?? 0,
      icon: Clock,
      accent: '#d97706',
      bg: '#fffbeb',
      href: '/admin/businesses',
    },
    {
      label: 'Suspended',
      value: stats?.suspended ?? 0,
      icon: Ban,
      accent: '#dc2626',
      bg: '#fef2f2',
      href: '/admin/businesses',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold text-[#0058be] uppercase tracking-[0.1em] mb-1">Overview</p>
        <h1
          className="text-2xl font-bold text-[#091426]"
          style={{ fontFamily: 'var(--font-manrope)' }}
        >
          Platform Overview
        </h1>
        <p className="text-sm text-[#64748b] mt-1">Manage the Shelflyd marketplace from here.</p>
      </div>

      {/* KPI Bento Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpiCards.map(({ label, value, icon: Icon, accent, bg, href }) => (
            <Link
              key={label}
              href={href}
              className="group flex flex-col gap-3 p-5 bg-white rounded-2xl shadow-[0_2px_12px_rgba(9,20,38,0.06)] hover:shadow-[0_4px_20px_rgba(9,20,38,0.1)] transition-all"
            >
              <div className="flex items-center justify-between">
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: bg }}
                >
                  <Icon className="h-5 w-5" style={{ color: accent }} />
                </div>
                <ArrowUpRight className="h-4 w-4 text-[#cbd5e1] group-hover:text-[#0058be] transition-colors" />
              </div>
              <div>
                <p
                  className="text-3xl font-bold text-[#091426]"
                  style={{ fontFamily: 'var(--font-manrope)' }}
                >
                  {value}
                </p>
                <p className="text-xs text-[#64748b] mt-0.5">{label}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2
          className="text-sm font-bold text-[#091426] mb-3"
          style={{ fontFamily: 'var(--font-manrope)' }}
        >
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/admin/businesses"
            className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-[0_2px_12px_rgba(9,20,38,0.05)] hover:shadow-[0_4px_20px_rgba(9,20,38,0.1)] transition-all group"
          >
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#091426]">Review Pending Businesses</p>
              <p className="text-xs text-[#64748b]">
                {stats?.pending ?? 0} awaiting approval
              </p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-[#cbd5e1] group-hover:text-[#0058be] transition-colors shrink-0" />
          </Link>

          <Link
            href="/admin/products"
            className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-[0_2px_12px_rgba(9,20,38,0.05)] hover:shadow-[0_4px_20px_rgba(9,20,38,0.1)] transition-all group"
          >
            <div className="h-10 w-10 rounded-xl bg-[#eff4ff] flex items-center justify-center shrink-0">
              <Package className="h-5 w-5 text-[#0058be]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#091426]">Browse All Products</p>
              <p className="text-xs text-[#64748b]">View marketplace inventory</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-[#cbd5e1] group-hover:text-[#0058be] transition-colors shrink-0" />
          </Link>
        </div>
      </div>

      {/* Recent businesses */}
      {businesses && businesses.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2
              className="text-sm font-bold text-[#091426]"
              style={{ fontFamily: 'var(--font-manrope)' }}
            >
              Recent Businesses
            </h2>
            <Link
              href="/admin/businesses"
              className="text-xs font-medium text-[#0058be] hover:text-[#091426] transition-colors inline-flex items-center gap-1"
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(9,20,38,0.05)] overflow-hidden">
            {businesses.slice(0, 5).map((biz, idx) => (
              <div
                key={biz.id}
                className={`flex items-center justify-between px-5 py-3.5 hover:bg-[#f8f9ff] transition-colors ${
                  idx < Math.min(4, businesses.length - 1) ? 'border-b border-[#f1f5f9]' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: biz.themeColor ?? '#091426' }}
                  >
                    {biz.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#0b1c30]">{biz.name}</p>
                    <p className="text-xs text-[#64748b]">{biz.slug}</p>
                  </div>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                    biz.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700'
                      : biz.status === 'PENDING'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {formatStatus(biz.status)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
