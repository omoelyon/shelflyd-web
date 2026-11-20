'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { DnsRecord } from '@/types';

/** A small copy button that confirms with a tick, and with a toast for screen readers and the keyboard. */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label} copied.`);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error('Could not copy. Select the text and copy it by hand.');
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy ${label.toLowerCase()}`}
      className="sf-press flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#64748b] outline-none transition-colors hover:bg-[#eff4ff] hover:text-[#0058be] focus-visible:ring-2 focus-visible:ring-[#0058be]/40"
    >
      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

function Field({ label, value, mono = true, copyLabel }: { label: string; value: string; mono?: boolean; copyLabel?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#64748b]">{label}</p>
      <div className="flex items-center gap-1">
        <p className={`min-w-0 break-all text-sm text-[#091426] ${mono ? 'font-mono text-[13px]' : ''}`}>{value}</p>
        {copyLabel && <CopyButton value={value} label={copyLabel} />}
      </div>
    </div>
  );
}

/** One DNS record to add at the domain provider: its type, name and value, each copyable. */
export default function DnsRecordRow({ record }: { record: DnsRecord }) {
  return (
    <div className="space-y-2 rounded-xl border border-[rgba(9,20,38,0.1)] bg-[#f8f9ff] p-3">
      <div className="grid gap-x-4 gap-y-2 sm:grid-cols-[5rem_1fr]">
        <Field label="Type" value={record.type} mono={false} />
        <Field label="Name / Host" value={record.name} copyLabel="Name" />
      </div>
      <Field label="Value / Points to" value={record.value} copyLabel="Value" />
      {record.note && <p className="text-xs text-[#64748b]">{record.note}</p>}
    </div>
  );
}
