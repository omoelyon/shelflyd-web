'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AssistantError } from '@/lib/api/assistant';
import type { ChatStreamEvent, ConversationView } from '@/types/assistant';

/** A card under an assistant reply. Each assistant has its own kinds; all have a {@code type}. */
export type AnyCard = { type: string } & Record<string, unknown>;

export interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  cards: AnyCard[];
  /** The assistant is still writing this reply. */
  streaming?: boolean;
  /** What it's doing right now ("Checking stock"), and since when, while busy. */
  status?: { label: string; since: number } | null;
  /** The reply failed; retry re-sends the message. */
  error?: { message: string; retryable: boolean } | null;
  /** How long the reply took, for "Answered in 6.1s". */
  tookMs?: number;
}

/** How to talk to one assistant: where messages go and how a chat is read back. */
export interface ChatTransport<B extends object> {
  /** Kept in this browser so the chat survives a reload. */
  storageKey: string;
  stream: (body: B & { conversationId?: string | null }, onEvent: (e: ChatStreamEvent) => void, signal: AbortSignal) => Promise<void>;
  load: (conversationId: string) => Promise<ConversationView>;
  /** The request body for a typed message (e.g. the store assistant adds the guest cart). */
  messageBody: (message: string) => B;
}

const newId = () => Math.random().toString(36).slice(2, 10);

function readId(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeId(key: string, id: string | null) {
  try {
    if (id) window.localStorage.setItem(key, id);
    else window.localStorage.removeItem(key);
  } catch {
    // storage blocked: the chat lasts until the page closes
  }
}

/** Card types where a newer card replaces the older one in the same reply. */
const SINGLE = new Set(['cart', 'checkout', 'replies']);

function withCard(cards: AnyCard[], card: AnyCard): AnyCard[] {
  return SINGLE.has(card.type) ? [...cards.filter((c) => c.type !== card.type), card] : [...cards, card];
}

/**
 * One conversation with an assistant: sending, streaming the reply in, stopping, retrying, starting over, opening an
 * earlier chat, and picking the chat back up after a reload. The transport decides which assistant it talks to.
 */
export function useAiChat<B extends object>(transport: ChatTransport<B>) {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const restored = useRef(false);
  const idRef = useRef<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const lastText = useRef<string | null>(null);
  const t = useRef(transport);
  useEffect(() => {
    t.current = transport;
  });
  const key = transport.storageKey;

  const setId = useCallback(
    (id: string | null) => {
      idRef.current = id;
      setConversationId(id);
      writeId(key, id);
    },
    [key],
  );

  /** Opens an earlier chat. */
  const open = useCallback(
    async (id: string) => {
      abort.current?.abort();
      const view = await t.current.load(id);
      setId(view.conversationId);
      setTurns(view.messages.map((m) => ({ id: m.id, role: m.role, text: m.text ?? '', cards: (m.cards ?? []) as unknown as AnyCard[] })));
    },
    [setId],
  );

  /** Loads the previous chat, once, the first time the panel opens. */
  const restore = useCallback(async () => {
    if (restored.current) return;
    restored.current = true;
    const id = readId(key);
    if (!id) return;
    try {
      await open(id);
    } catch {
      setId(null);
    }
  }, [key, open, setId]);

  const run = useCallback(
    async (message: string) => {
      if (busy) return;
      lastText.current = message;
      const replyId = newId();
      const started = Date.now();
      setTurns((ts) => [
        ...ts.map((turn) => (turn.role === 'assistant' ? { ...turn, cards: turn.cards.filter((c) => c.type !== 'replies') } : turn)),
        { id: newId(), role: 'user', text: message, cards: [] },
        { id: replyId, role: 'assistant', text: '', cards: [], streaming: true, status: { label: 'Thinking', since: started } },
      ]);
      setBusy(true);
      const update = (fn: (turn: ChatTurn) => ChatTurn) => setTurns((ts) => ts.map((turn) => (turn.id === replyId ? fn(turn) : turn)));

      const controller = new AbortController();
      abort.current = controller;
      const onEvent = (e: ChatStreamEvent) => {
        switch (e.event) {
          case 'start':
            setId(e.conversationId);
            break;
          case 'status':
            update((turn) => ({ ...turn, status: { label: e.label, since: Date.now() } }));
            break;
          case 'delta':
            update((turn) => ({ ...turn, text: turn.text + e.text, status: null }));
            break;
          case 'replace':
            update((turn) => ({ ...turn, text: e.text, cards: turn.cards.filter((c) => c.type === 'replies'), status: null }));
            break;
          case 'card':
            update((turn) => ({ ...turn, cards: withCard(turn.cards, e.card as unknown as AnyCard) }));
            break;
          case 'done':
            update((turn) => ({
              ...turn,
              text: e.text,
              cards: (e.cards as unknown as AnyCard[]) ?? turn.cards,
              streaming: false,
              status: null,
              tookMs: Date.now() - started,
            }));
            break;
          case 'error':
            update((turn) => ({ ...turn, streaming: false, status: null, error: { message: e.message, retryable: e.retryable } }));
            break;
        }
      };
      try {
        await t.current.stream({ ...t.current.messageBody(message), conversationId: idRef.current }, onEvent, controller.signal);
        update((turn) => (turn.streaming ? { ...turn, streaming: false, status: null } : turn));
      } catch (err) {
        if (controller.signal.aborted) {
          update((turn) => ({ ...turn, streaming: false, status: null, text: turn.text || 'Stopped.' }));
        } else {
          const msg = err instanceof AssistantError ? err.message : 'The connection dropped before the reply finished.';
          const retryable = err instanceof AssistantError ? err.retryable : true;
          update((turn) => ({ ...turn, streaming: false, status: null, error: { message: msg, retryable } }));
        }
      } finally {
        abort.current = null;
        setBusy(false);
      }
    },
    [busy, setId],
  );

  const send = useCallback((text: string) => {
    const message = text.trim();
    if (message) run(message);
  }, [run]);

  const stop = useCallback(() => abort.current?.abort(), []);

  /** Re-sends the last message after a failed reply (dropping the failed exchange first). */
  const retry = useCallback(() => {
    const message = lastText.current;
    if (!message || busy) return;
    setTurns((ts) => {
      const copy = [...ts];
      if (copy.at(-1)?.role === 'assistant' && copy.at(-1)?.error) copy.pop();
      if (copy.at(-1)?.role === 'user') copy.pop();
      return copy;
    });
    run(message);
  }, [busy, run]);

  const reset = useCallback(() => {
    abort.current?.abort();
    setId(null);
    setTurns([]);
  }, [setId]);

  /** Puts a card into the last reply without asking the AI (e.g. checkout opened from the cart card). */
  const addLocalCard = useCallback((card: AnyCard) => {
    setTurns((ts) => {
      const copy = [...ts];
      for (let i = copy.length - 1; i >= 0; i--) {
        if (copy[i].role === 'assistant') {
          copy[i] = { ...copy[i], cards: withCard(copy[i].cards, card) };
          return copy;
        }
      }
      return [...copy, { id: newId(), role: 'assistant', text: '', cards: [card] }];
    });
  }, []);

  useEffect(() => () => abort.current?.abort(), []);

  return { turns, busy, conversationId, send, stop, retry, reset, restore, open, addLocalCard };
}

export type AiChat = ReturnType<typeof useAiChat>;
