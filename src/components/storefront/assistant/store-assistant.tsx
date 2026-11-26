'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Sparkles, SquarePen, X } from 'lucide-react';
import { assistantApi, streamChat } from '@/lib/api/assistant';
import { useAuthStore } from '@/stores/auth.store';
import { useGuestCartStore } from '@/stores/guest-cart.store';
import type { AssistantCartLine, ChatRequestBody, CheckoutQuote, ProposedLine } from '@/types/assistant';
import type { Product } from '@/types';
import { useAiChat, type AnyCard, type ChatTransport } from '@/components/features/ai-chat/use-ai-chat';
import { ChatView, QuickReplies } from '@/components/features/ai-chat/chat-view';
import { useStorefront } from '../storefront-context';
import { CartCard, CheckoutCard, ProductsCard } from './assistant-cards';

const STARTERS = ['What’s popular?', 'What can I get for ₦5,000?', 'Do you deliver?', 'Show me everything'];

/**
 * The store's AI shopping assistant: a launcher in the corner that opens a chat (full screen on a phone, a panel on
 * larger screens). Shoppers describe what they want; the assistant shows products, puts a cart together and shows a
 * checkout card with the real total and a Pay button. Hidden in the editor preview and when the store has it off.
 */
export default function StoreAssistant() {
  const { info, slug, preview } = useStorefront();
  const [open, setOpen] = useState(false);
  if (preview || !info?.assistant) return null;
  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-[60] flex h-12 items-center gap-2 rounded-full bg-primary pl-4 pr-5 text-sm font-semibold text-primary-foreground shadow-[0_10px_30px_-8px_rgba(9,20,38,0.45)] transition-transform duration-200 hover:scale-[1.03] active:scale-95 sf-pop"
          aria-label={`Ask ${info.name}`}
        >
          <Sparkles className="h-4.5 w-4.5" aria-hidden="true" />
          <span className="max-w-[9rem] truncate">Ask {info.name}</span>
        </button>
      )}
      {open && <AssistantPanel slug={slug} businessId={info.id} onClose={() => setOpen(false)} />}
    </>
  );
}

function AssistantPanel({ slug, businessId, onClose }: { slug: string; businessId: number; onClose: () => void }) {
  const { info } = useStorefront();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  /** The guest cart at this store (signed-in carts are read on the server). */
  const cartLines = useCallback((): AssistantCartLine[] => {
    if (isAuthenticated) return [];
    const cart = useGuestCartStore.getState().getCart(businessId);
    return (cart?.items ?? []).map((i) => ({ productId: i.productId, unitId: i.unitId, quantity: i.quantity }));
  }, [isAuthenticated, businessId]);

  const transport = useMemo<ChatTransport<ChatRequestBody>>(
    () => ({
      storageKey: `sf-chat-${slug}`,
      stream: (body, onEvent, signal) => streamChat(slug, body, onEvent, signal),
      load: (id) => assistantApi.conversation(slug, id),
      messageBody: (message) => ({ message, cart: cartLines() }),
    }),
    [slug, cartLines],
  );
  const chat = useAiChat(transport);

  useEffect(() => {
    chat.restore();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  const openCheckout = async () => {
    try {
      chat.addLocalCard((await assistantApi.quote(slug, { fulfilment: 'pickup', cart: cartLines() })) as unknown as AnyCard);
    } catch {
      // the card simply doesn't appear; the cart page still works
    }
  };
  const closeOnPhone = () => window.innerWidth < 640 && onClose();

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={`Chat with ${info?.name ?? 'the store'}`}
      className="fixed inset-0 z-[70] flex flex-col bg-background sm:inset-auto sm:bottom-4 sm:right-4 sm:h-[min(720px,calc(100dvh-2rem))] sm:w-[400px] sm:overflow-hidden sm:rounded-2xl sm:border sm:border-border sm:shadow-[0_24px_60px_-20px_rgba(9,20,38,0.45)] sf-rise"
    >
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-3 pt-[env(safe-area-inset-top)] sm:pt-0">
        <StoreMark />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{info?.name}</p>
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" aria-hidden="true" />
            Shopping assistant
          </p>
        </div>
        {chat.turns.length > 0 && (
          <button type="button" onClick={chat.reset} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="New chat" title="New chat">
            <SquarePen className="h-4.5 w-4.5" />
          </button>
        )}
        <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close chat">
          <X className="h-5 w-5" />
        </button>
      </div>

      <ChatView
        chat={chat}
        placeholder="Tell me what you need…"
        footnote="AI can make mistakes. Prices and totals come from the store."
        welcome={<Welcome onPick={chat.send} />}
        renderCard={(card, ctx) => {
          switch (card.type) {
            case 'products':
              return <ProductsCard products={card.products as Product[]} onNavigate={closeOnPhone} />;
            case 'replies':
              return ctx.latest ? <QuickReplies options={card.options as string[]} onPick={ctx.send} disabled={ctx.busy} /> : null;
            case 'cart':
              return <CartCard lines={card.lines as ProposedLine[]} total={card.total as number} onCheckout={openCheckout} />;
            case 'checkout':
              return <CheckoutCard initial={card as unknown as CheckoutQuote} cart={cartLines} />;
            default:
              return null;
          }
        }}
      />
    </div>
  );
}

function StoreMark({ size = 32 }: { size?: number }) {
  const { info } = useStorefront();
  if (info?.logo) {
    return <Image src={info.logo} alt="" width={size} height={size} unoptimized className="shrink-0 rounded-lg object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <div className="flex shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground" style={{ width: size, height: size }} aria-hidden="true">
      {(info?.name ?? '?').slice(0, 1).toUpperCase()}
    </div>
  );
}

function Welcome({ onPick }: { onPick: (text: string) => void }) {
  const { info } = useStorefront();
  return (
    <div className="flex min-h-full flex-col justify-end gap-4 pb-2">
      <div className="space-y-2">
        <StoreMark size={40} />
        <p className="text-lg font-semibold leading-snug">Hi! What can I get you today?</p>
        <p className="text-sm text-muted-foreground">
          Tell me what you need, your budget, or how many people you’re buying for. I’ll find it in {info?.name ?? 'the store'}, put your order together and get you to checkout.
        </p>
      </div>
      <QuickReplies options={STARTERS} onPick={onPick} />
    </div>
  );
}
