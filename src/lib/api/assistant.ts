import apiClient from './client';
import type {
  AdminAiOverview,
  AiUsageReport,
  TopUpResult,
  AssistantCartLine,
  ConversationSummary,
  AssistantSettings,
  ChatRequestBody,
  ChatStreamEvent,
  CheckoutQuote,
  ConversationView,
} from '@/types/assistant';

const VISITOR_KEY = 'sf-visitor-id';

/**
 * An anonymous id for this browser, so a guest's chats can be read back by them and nobody else. Kept in
 * localStorage; when storage is blocked a fresh id is used per page load (the chat then simply starts over).
 */
export function visitorId(): string {
  let id: string | null = null;
  try {
    id = window.localStorage.getItem(VISITOR_KEY);
  } catch {
    // storage blocked
  }
  if (!id || !/^[A-Za-z0-9-]{8,64}$/.test(id)) {
    id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `v-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    try {
      window.localStorage.setItem(VISITOR_KEY, id);
    } catch {
      // storage blocked
    }
  }
  return id;
}

/** Thrown when the assistant refuses the request outright (rate limit, switched off, out of credit…). */
export class AssistantError extends Error {
  constructor(message: string, readonly status: number, readonly retryable: boolean) {
    super(message);
  }
}

/**
 * Sends one message to an assistant and calls {@code onEvent} for each streamed event (server-sent events over a POST,
 * so the stream is read by hand rather than with EventSource). Resolves when the reply has finished.
 */
export async function streamTo(url: string, body: object, onEvent: (e: ChatStreamEvent) => void, signal?: AbortSignal, headers: Record<string, string> = {}) {
  const res = await fetch(url, {
    method: 'POST',
    // application/json too: when the server refuses before streaming (no AI credit, AI switched off, a limit), its
    // explanation comes back as JSON. Asking for the stream alone turned every refusal into an empty 500.
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream, application/json', ...headers },
    body: JSON.stringify(body),
    credentials: 'same-origin',
    signal,
  });
  if (!res.ok || !res.body) {
    let message = 'The assistant is unavailable right now.';
    try {
      const data = await res.json();
      if (data?.message) message = data.message;
    } catch {
      // not JSON
    }
    throw new AssistantError(message, res.status, res.status === 429 || res.status >= 500);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let eventName = 'message';
  let data = '';
  const flush = () => {
    if (!data) return;
    try {
      onEvent({ event: eventName, ...JSON.parse(data) } as ChatStreamEvent);
    } catch {
      // ignore a malformed event
    }
    eventName = 'message';
    data = '';
  };
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let newline: number;
    while ((newline = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, newline).replace(/\r$/, '');
      buffer = buffer.slice(newline + 1);
      if (line === '') flush();
      else if (line.startsWith('event:')) eventName = line.slice(6).trim();
      else if (line.startsWith('data:')) data += line.slice(5).replace(/^ /, '');
    }
  }
  flush();
}

/** The store's shopping assistant (guests included: their chats are tied to an id kept in this browser). */
export function streamChat(slug: string, body: ChatRequestBody, onEvent: (e: ChatStreamEvent) => void, signal?: AbortSignal) {
  return streamTo(`/api/v1/storefront/${encodeURIComponent(slug)}/assistant/chat`, body, onEvent, signal, { 'X-Visitor-Id': visitorId() });
}

/** The seller's business assistant in the dashboard. */
export const sellerAssistantApi = {
  stream: (body: { message: string; conversationId?: string | null }, onEvent: (e: ChatStreamEvent) => void, signal?: AbortSignal) =>
    streamTo('/api/v1/business/assistant/chat', body, onEvent, signal),

  conversations: async (): Promise<ConversationSummary[]> => {
    const res = await apiClient.get('/business/assistant/conversations');
    return res.data;
  },

  conversation: async (id: string): Promise<ConversationView> => {
    const res = await apiClient.get(`/business/assistant/conversations/${id}`);
    return res.data;
  },

  usage: async (days = 30): Promise<AiUsageReport> => {
    const res = await apiClient.get('/business/ai/usage', { params: { days } });
    return res.data;
  },

  /** Starts buying AI credit; returns the Paystack page to send the owner to. */
  topUp: async (amount: number): Promise<{ url: string; reference: string }> => {
    const res = await apiClient.post('/business/ai/credits/top-up', { amount });
    return res.data;
  },

  /** After returning from Paystack: confirms the payment and adds the credit (once). */
  verifyTopUp: async (reference: string): Promise<TopUpResult> => {
    const res = await apiClient.post(`/business/ai/credits/top-up/${encodeURIComponent(reference)}/verify`);
    return res.data;
  },
};

/** Shelflyd staff: AI usage across businesses, and adjusting a business's credit. */
export const adminAiApi = {
  usage: async (days = 30): Promise<AdminAiOverview> => {
    const res = await apiClient.get('/admin/ai/usage', { params: { days } });
    return res.data;
  },

  adjust: async (businessId: number, amount: number, note: string): Promise<{ businessId: number; balance: number }> => {
    const res = await apiClient.post('/admin/ai/credits', { businessId, amount, note });
    return res.data;
  },
};

export const assistantApi = {
  conversation: async (slug: string, conversationId: string): Promise<ConversationView> => {
    const res = await apiClient.get(`/storefront/${encodeURIComponent(slug)}/assistant/conversations/${conversationId}`, {
      headers: { 'X-Visitor-Id': visitorId() },
    });
    return res.data;
  },

  quote: async (slug: string, body: { fulfilment: 'pickup' | 'delivery'; areaId?: number | null; cart: AssistantCartLine[] }): Promise<CheckoutQuote> => {
    const res = await apiClient.post(`/storefront/${encodeURIComponent(slug)}/assistant/checkout-quote`, body);
    return res.data;
  },

  settings: async (): Promise<AssistantSettings> => {
    const res = await apiClient.get('/business/settings/assistant');
    return res.data;
  },

  saveSettings: async (enabled: boolean): Promise<AssistantSettings> => {
    const res = await apiClient.patch('/business/settings/assistant', { enabled });
    return res.data;
  },
};
