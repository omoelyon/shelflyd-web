'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, Sparkles, SquarePen, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { assistantApi, sellerAssistantApi } from '@/lib/api/assistant';
import { useAiChat, type ChatTransport } from '@/components/features/ai-chat/use-ai-chat';
import { ChatView, QuickReplies } from '@/components/features/ai-chat/chat-view';
import { SellerCard } from './seller-cards';

const STARTERS = [
  'How were sales this week?',
  'What’s running low?',
  'What needs my attention today?',
  'Was I profitable this month?',
];

/**
 * The business assistant in the dashboard header: a button that opens a chat panel on the right (full screen on a
 * phone). It answers questions about the seller's own sales, stock, orders and profit, explains how to do things on
 * Shelflyd and links to the right page. Hidden while Shelflyd has the assistant switched off.
 */
export default function SellerAssistant() {
  const [open, setOpen] = useState(false);
  const { data: settings } = useQuery({
    queryKey: ['assistant-settings'],
    queryFn: assistantApi.settings,
    retry: false,
    staleTime: 5 * 60_000,
    meta: { silentError: true },
  });
  if (!settings?.available) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex h-8 items-center gap-1.5 rounded-lg bg-[#091426] px-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#091426]/90"
      >
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">Ask AI</span>
      </button>
      {open && <SellerPanel onClose={() => setOpen(false)} />}
    </>
  );
}

function SellerPanel({ onClose }: { onClose: () => void }) {
  const transport = useMemo<ChatTransport<{ message: string }>>(
    () => ({
      storageKey: 'seller-assistant-chat',
      stream: (body, onEvent, signal) => sellerAssistantApi.stream(body, onEvent, signal),
      load: sellerAssistantApi.conversation,
      messageBody: (message) => ({ message }),
    }),
    [],
  );
  const chat = useAiChat(transport);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    chat.restore();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  const closeOnPhone = () => window.innerWidth < 768 && onClose();

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Business assistant"
      className="fixed inset-0 z-[70] flex flex-col bg-[#f8f9ff] md:inset-y-0 md:left-auto md:right-0 md:w-[420px] md:border-l md:border-[rgba(9,20,38,0.08)] md:shadow-[-24px_0_60px_-30px_rgba(9,20,38,0.35)] sf-rise"
    >
      <div className="relative flex h-14 shrink-0 items-center gap-2.5 border-b border-[rgba(9,20,38,0.08)] bg-white px-3 pt-[env(safe-area-inset-top)] md:pt-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#091426] text-white" aria-hidden="true">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#091426]">Business assistant</p>
          <p className="truncate text-[11px] text-[#64748b]">Sales, stock, profit and how-tos</p>
        </div>
        <button
          type="button"
          onClick={() => setHistoryOpen((h) => !h)}
          aria-expanded={historyOpen}
          className="rounded-lg p-2 text-[#64748b] hover:bg-[#091426]/5 hover:text-[#091426]"
          aria-label="Earlier chats"
          title="Earlier chats"
        >
          <History className="h-4.5 w-4.5" />
        </button>
        {chat.turns.length > 0 && (
          <button type="button" onClick={chat.reset} className="rounded-lg p-2 text-[#64748b] hover:bg-[#091426]/5 hover:text-[#091426]" aria-label="New chat" title="New chat">
            <SquarePen className="h-4.5 w-4.5" />
          </button>
        )}
        <button type="button" onClick={onClose} className="rounded-lg p-2 text-[#64748b] hover:bg-[#091426]/5 hover:text-[#091426]" aria-label="Close assistant">
          <X className="h-5 w-5" />
        </button>
        {historyOpen && (
          <ChatHistory
            current={chat.conversationId}
            onPick={(id) => {
              setHistoryOpen(false);
              chat.open(id).catch(() => undefined);
            }}
            onClose={() => setHistoryOpen(false)}
          />
        )}
      </div>

      <ChatView
        chat={chat}
        placeholder="Ask about your business…"
        footnote="Answers come from your store’s data. AI can make mistakes."
        welcome={
          <div className="flex min-h-full flex-col justify-end gap-4 pb-2">
            <div className="space-y-2">
              <p className="text-lg font-semibold leading-snug text-[#091426]">What would you like to know?</p>
              <p className="text-sm text-[#64748b]">
                I can look at your sales, orders, stock, profit and expenses, explain what changed, suggest what to do next, and show you where things are in your dashboard.
              </p>
            </div>
            <QuickReplies options={STARTERS} onPick={chat.send} />
          </div>
        }
        renderCard={(card, ctx) => <SellerCard card={card} ctx={ctx} onNavigate={closeOnPhone} />}
      />
    </div>
  );
}

function ChatHistory({ current, onPick, onClose }: { current: string | null; onPick: (id: string) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useQuery({ queryKey: ['seller-assistant-history'], queryFn: sellerAssistantApi.conversations, staleTime: 0 });
  useEffect(() => {
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && onClose();
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [onClose]);
  return (
    <div ref={ref} className="absolute right-3 top-12 z-10 w-72 overflow-hidden rounded-xl border border-[rgba(9,20,38,0.1)] bg-white shadow-lg">
      <p className="border-b border-[#eef2f7] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Earlier chats</p>
      <div className="max-h-72 overflow-y-auto py-1">
        {isLoading && <p className="px-3 py-2 text-xs text-[#64748b]">Loading…</p>}
        {data?.length === 0 && <p className="px-3 py-2 text-xs text-[#64748b]">No earlier chats yet.</p>}
        {data?.map((c) => (
          <button
            key={c.conversationId}
            type="button"
            onClick={() => onPick(c.conversationId)}
            className={cn('block w-full px-3 py-2 text-left hover:bg-[#f8f9ff]', c.conversationId === current && 'bg-[#eff4ff]')}
          >
            <span className="block truncate text-[13px] text-[#091426]">{c.title}</span>
            {c.lastMessageAt && <span className="text-[11px] text-[#94a3b8]">{new Date(c.lastMessageAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
