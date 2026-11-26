import type { Product } from '@/types';

/** A line the store assistant suggests adding (checked against the catalog on the server). */
export interface ProposedLine {
  productId: number;
  name: string;
  image: string | null;
  unitId: number;
  unitName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  note: string | null;
}

export interface QuoteLine {
  productId: number;
  name: string;
  image: string | null;
  unit: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface DeliveryArea {
  id: number;
  name: string;
  fee: number;
}

/** The chat's checkout card: worked out exactly as checkout charges it. */
export interface CheckoutQuote {
  type: 'checkout';
  cartId: number | null;
  signedIn: boolean;
  lines: QuoteLine[];
  fulfilment: 'pickup' | 'delivery';
  pickupAvailable: boolean;
  pickupAddress: string | null;
  areas: DeliveryArea[];
  areaId: number | null;
  courierAvailable: boolean;
  courierOnly: boolean;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  processingFee: number;
  total: number;
  problem: string | null;
}

export type AssistantCard =
  | { type: 'products'; products: Product[] }
  | { type: 'replies'; options: string[] }
  | { type: 'cart'; lines: ProposedLine[]; total: number }
  | CheckoutQuote;

export interface AssistantCartLine {
  productId: number;
  unitId: number;
  quantity: number;
}

export interface ChatRequestBody {
  conversationId?: string | null;
  message?: string;
  event?: { type: 'cart_added' | 'cart_dismissed' | 'signed_in'; detail?: string };
  cart: AssistantCartLine[];
}

/** What streams back while the assistant answers. */
export type ChatStreamEvent =
  | { event: 'start'; conversationId: string }
  | { event: 'status'; label: string; tool: string }
  | { event: 'delta'; text: string }
  /** The reply is replaced with this exact text (e.g. a polite decline for an off-topic request). */
  | { event: 'replace'; text: string }
  | { event: 'card'; card: AssistantCard }
  | { event: 'done'; messageId: string; text: string; cards: AssistantCard[] }
  | { event: 'error'; message: string; retryable: boolean };

export interface ConversationView {
  conversationId: string;
  title?: string | null;
  messages: { id: string; role: 'user' | 'assistant'; text: string; cards: AssistantCard[] | null; createdAt: string | null }[];
}

export interface AssistantSettings {
  enabled: boolean;
  available: boolean;
  balance: number;
  billingEnforced: boolean;
  /** Free credit added each month (0 when businesses buy all their credit). */
  monthlyFree: number;
}

export interface TopUpResult {
  reference: string;
  status: 'PENDING' | 'PAID' | 'FAILED';
  amount: number;
  balance: number;
}

/** Shelflyd staff: AI usage across all businesses. */
/** A live test call to the AI provider (admin). `error` is the provider's own message; it never contains the API key. */
export interface AiConnectionCheck {
  ok: boolean;
  provider: string;
  model: string;
  millis: number;
  reply: string | null;
  error: string | null;
}

export interface AdminAiOverview {
  available: boolean;
  provider: string;
  model: string;
  days: number;
  charged: number;
  providerCostUsd: number;
  providerCostNaira: number;
  calls: number;
  activeBusinesses: number;
  topUpsPaid: number;
  daily: { date: string; shopper: number; seller: number; providerCostUsd: number }[];
  models: { model: string; provider: string; charged: number; providerCostUsd: number; calls: number; inputTokens: number; outputTokens: number }[];
  topBusinesses: { businessId: number; name: string; slug: string | null; charged: number; providerCost: number; calls: number; balance: number }[];
}

export interface ConversationSummary {
  conversationId: string;
  title: string;
  lastMessageAt: string | null;
}

/** What a business's AI assistants have cost (Settings, AI assistant & credit). */
export interface AiUsageReport {
  available: boolean;
  billingEnforced: boolean;
  /** What the business pays per million tokens. */
  nairaPerMillionTokens: number;
  balance: number;
  monthlyFree: number;
  monthSpend: number;
  monthCalls: number;
  byAssistant: { assistant: 'shopper' | 'seller'; cost: number; calls: number; inputTokens: number; outputTokens: number }[];
  daily: { date: string; shopper: number; seller: number }[];
  credits: { type: 'MONTHLY_FREE' | 'TOP_UP' | 'ADJUSTMENT'; amount: number; note: string | null; createdAt: string | null }[];
}

/** Seller assistant cards. */
export interface MetricItem {
  label: string;
  value: number;
  previous: number | null;
  changePct: number | null;
  format: 'money' | 'count' | 'percent';
}
