import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getApiError(error: unknown, fallback: string): string {
  return (
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback
  );
}

const RESERVED_SUBDOMAINS = ['www', 'app', 'api', 'admin', 'localhost'];

export function getBusinessSlug(): string | null {
  if (typeof window === 'undefined') return null;
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  if (parts.length >= 3 && !RESERVED_SUBDOMAINS.includes(parts[0])) {
    return parts[0];
  }
  return null;
}
