// ─── Base ────────────────────────────────────────────────────────────────────

export interface BaseEntity {
  id: number;
  uuid: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  country?: string;
  sector?: string;
  heardAboutUs?: string;
  privacyPolicy?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

// ─── User ────────────────────────────────────────────────────────────────────

export interface User extends BaseEntity {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  username?: string;
  admin?: boolean;
}

// ─── Business ────────────────────────────────────────────────────────────────

export type BusinessStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED';

export interface Business extends BaseEntity {
  name: string;
  slug: string;
  description: string;
  logo: string | null;
  ownerId: number;
  status: BusinessStatus;
  themeColor: string | null;
  pickupAddressLine: string | null;
  pickupCity: string | null;
  pickupState: string | null;
  pickupPhone: string | null;
  pickupAddressCode: string | null;
}

// ─── Store setup checklist ────────────────────────────────────────────────────

export type SetupStepKey = 'store' | 'product' | 'payout' | 'pickup' | 'logo';

export interface SetupStep {
  key: SetupStepKey;
  done: boolean;
  /** Required steps block selling (payout, product); optional ones just help. */
  required: boolean;
}

export interface SetupStatus {
  steps: SetupStep[];
  completed: number;
  total: number;
}

export interface RegisterBusinessRequest {
  name: string;
  slug: string;
  description?: string;
  logo?: string;
}

export interface UpdateSettingsRequest {
  name?: string;
  description?: string;
  themeColor?: string;
}

export interface UpdateBusinessStatusRequest {
  status: BusinessStatus;
}

export interface BusinessStats {
  totalOrders: number;
  processingOrders: number;
  dispatchedOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  /** Pickup orders still PROCESSING that the seller has already told the buyer are ready. */
  readyForPickupOrders: number;
  totalRevenue: number;
}

/** Paid vs. still-pending payment attempts — total can exceed the order count since a
 * retried or abandoned checkout attempt leaves behind a pending row alongside the one order. */
export interface PaymentSummary {
  total: number;
  paid: number;
  pending: number;
}

// ─── Storefront ──────────────────────────────────────────────────────────────

export interface StorefrontInfo {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  themeColor: string | null;
  /** The published storefront design (see lib/storefront/design.ts); null until the seller publishes one. */
  design: unknown | null;
  /** True when this response is a private draft preview (the design above is the unpublished draft). */
  previewing?: boolean;
  /** The store's own live domain (e.g. "shop.theirbrand.com"), or null/absent when it only has its Shelflyd address. */
  customDomain?: string | null;
}

// ─── Category ────────────────────────────────────────────────────────────────

export interface Category extends BaseEntity {
  name: string;
  description?: string;
  icon?: string;
  productCount: number;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  icon?: string;
}

// ─── Product ─────────────────────────────────────────────────────────────────

export type ProductStatus = 'COMING_SOON' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
export type Currency = 'NGN' | 'USD' | 'EUR' | 'GBP';

export interface Price extends BaseEntity {
  productId: number;
  unitId: number;
  price: number;
  currency: Currency;
}

export interface PriceDetail {
  id: number;
  price: number;
  unit: number;      // unitId
  unitName: string;
  currency: Currency;
  isBaseUnit: boolean;
}

export interface Product extends BaseEntity {
  name: string;
  type: string;
  description: string;
  category: number;
  /** The cover photo (always the first of `images`); kept for everything that shows a single picture. */
  image: string;
  /** Every photo in order, cover first, at most MAX_PRODUCT_IMAGES. Use `productImages(product)` to read it safely. */
  images?: string[];
  status: ProductStatus;
  businessId: number;
  prices: PriceDetail[];  // backend field name: "prices" (PriceDetail shape)
  /** Units in stock, when the seller tracks it and the backend includes it in the list response. */
  stock?: number | null;
  /** True while the seller has hidden the product from shoppers. Only the seller's own list can contain hidden products. */
  hidden?: boolean;
}

export interface CreateProductRequest {
  name: string;
  type?: string;
  description?: string;
  category?: number;
  image?: string;
  /** Photos in order, cover first (at most 5). When sent it replaces the whole list. */
  images?: string[];
  status?: ProductStatus;
  priceDetails?: PriceDetail[];
}

/** One-step product setup: creates the product, its first unit and price, and optional stock together. */
export interface QuickProductRequest {
  name: string;
  description?: string;
  category?: number;
  image?: string;
  images?: string[];
  unitName: string;
  price: number;
  stock?: number;
}

export interface UpdateProductRequest {
  name?: string;
  type?: string;
  description?: string;
  category?: number;
  image?: string;
  /** Photos in order, cover first (at most 5). When sent it replaces the whole list; send [] to remove them all. */
  images?: string[];
  status?: ProductStatus;
  /** Hide the product from shoppers (true) or show it again (false). Leave out to keep it as it is. */
  hidden?: boolean;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface CartProduct {
  productId: number;
  name: string;
  type: string;
  image: string;
  unit: string;
  unitId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  note?: string;
  /** Set this line belongs to, if any. `quantity` is already the full total (quantityPerSet × sets). */
  groupId?: number | null;
  /** Units of this item in ONE set. */
  quantityPerSet?: number | null;
  /** How much of this item is left, in this line's unit; null/absent when the seller doesn't track stock. */
  availableQuantity?: number | null;
}

/** A "set": the same combination of items ordered several times (see lib/cart-sets.ts). */
export interface CartGroup {
  groupId: number;
  name: string;
  sets: number;
  totalPrice: number;
}

export interface CartResponse {
  cartId: number;
  businessId: number;
  products: CartProduct[];
  totalCost: number;
  groups?: CartGroup[];
}

export interface CartGroupItemRequest {
  productId: number;
  unitId: number;
  quantityPerSet: number;
  note?: string;
}

export interface CartGroupRequest {
  businessId: number;
  name?: string;
  sets: number;
  items: CartGroupItemRequest[];
  /** Create only: remove the cart's ordinary lines for these same items (used when grouping what's already in the cart). */
  absorbLoose?: boolean;
}

export interface CartUpdateRequest {
  productId: number;
  unitId: number;
  quantity: number;
  note?: string;
}

export type OrderType = 'PICKUP' | 'DELIVERY';

export interface CheckoutRequest {
  cartId: number;
  orderType: OrderType;
  locationId?: number;
  // Required alongside locationId (flat-rate delivery only — the courier path's address
  // was already collected at the quote step and doesn't need resending here).
  contactName?: string;
  contactPhone?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  // Courier delivery — set together, instead of locationId, when the buyer chose a
  // real courier quote from POST /carts/{cartId}/delivery-quotes.
  courierRequestToken?: string;
  courierServiceCode?: string;
  courierId?: number;
}

// ─── Courier delivery (Shipbubble) ────────────────────────────────────────────

export interface DeliveryAddress {
  name: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
}

export interface DeliveryRateOption {
  courierId: number;
  courierName: string;
  serviceCode: string;
  amount: number;
  currency: string;
  pickupEta: string | null;
  deliveryEta: string | null;
}

export interface DeliveryQuoteResponse {
  requestToken: string;
  options: DeliveryRateOption[];
}

export type ShipmentStatus = 'PENDING' | 'CONFIRMED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';

export interface Shipment extends BaseEntity {
  orderId: number;
  provider: string;
  externalOrderId: string;
  courierName: string | null;
  serviceCode: string;
  cost: number | null;
  currency: string;
  trackingUrl: string | null;
  status: ShipmentStatus;
}

export type PaymentType = 'paystack' | 'flutterwave' | 'stripe';

export interface CheckoutResponse {
  message: string;
  amount: string;
  payment_type: PaymentType;
  url: string;
  reference: string;
}

// ─── Order Items ─────────────────────────────────────────────────────────────

export interface OrderItem {
  productId: number;
  name: string;
  image: string | null;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  note?: string;
  /** Set this line was ordered in, if any (name and sets repeated on each member line). */
  groupId?: number | null;
  groupName?: string | null;
  groupSets?: number | null;
  quantityPerSet?: number | null;
}

// ─── Orders ───────────────────────────────────────────────────────────────────

/**
 * Pickup orders go PROCESSING → COMPLETED; delivery orders PROCESSING → DISPATCHED → COMPLETED; either can end
 * CANCELLED (with a refund) while still PROCESSING. "Ready for pickup" is not a status, see readyForPickupAt.
 */
export type OrderStatus = 'PROCESSING' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED';

export interface Order extends BaseEntity {
  userId: number;
  cartId: number;
  businessId: number;
  orderType: OrderType;
  status: OrderStatus;
  deliveryLocationId: number | null;
  deliveryContactName: string | null;
  deliveryContactPhone: string | null;
  deliveryAddressLine: string | null;
  deliveryCity: string | null;
  deliveryState: string | null;
  /** Pickup orders: when the seller told the buyer it's ready to collect (ISO), else null. */
  readyForPickupAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  /** Seller-only: stock ran short between checkout and payment, e.g. "Chicken wrap (2 short)". The buyer has paid. */
  stockShortfall?: string | null;
  /** Seller's order list only: who ordered, how many lines, and what the items cost. */
  buyerName?: string | null;
  itemCount?: number | null;
  itemsTotal?: number | null;
}

/** The buyer's proof of purchase for an in-person pickup — the code (or its QR image) is what the seller checks. */
export interface PickupPass {
  orderId: number;
  /** 6 digits, e.g. "482913" */
  code: string;
  /** Grouped for reading aloud, e.g. "482 913" */
  formattedCode: string;
  collected: boolean;
}

export interface PatronizedBusiness {
  business: Business;
  orderCount: number;
  lastOrderAt: string;
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface Payment extends BaseEntity {
  reference: string;
  paidBy: number;
  paymentGateway: PaymentType;
  currency: string;
  status: PaymentStatus;
  amount: number;
  cartId: number;
  /** Absent on payment rows created before this field existed. */
  orderId?: number;
  businessId: number;
  /** Breakdown of what the customer paid — null on payments made before it was recorded. */
  sellerShare?: number | null;
  itemsAmount?: number | null;
  deliveryFee?: number | null;
  processingFee?: number | null;
  commissionAmount?: number | null;
  /** Set when the order was cancelled and the buyer refunded; such a payment is not part of the seller's earnings. */
  refundStatus?: 'REQUESTED' | 'FAILED' | null;
  refundAmount?: number | null;
}

// ─── Delivery Locations ───────────────────────────────────────────────────────

export interface DeliveryLocation extends BaseEntity {
  location: string;
  amount: number;
}

export interface CreateDeliveryLocationRequest {
  location: string;
  amount: number;
}

// ─── Inventory ───────────────────────────────────────────────────────────────

export interface Inventory extends BaseEntity {
  productId: number;
  unitId: number;
  quantity: number;
}

export interface CreateInventoryRequest {
  productId: number;
  quantity: number;
}

export interface UpdateInventoryRequest {
  quantity: number;
}

// ─── Units ───────────────────────────────────────────────────────────────────

export interface Unit extends BaseEntity {
  name: string;
  symbol: string;
  description?: string;
  productId: number;
  isBaseUnit: boolean;
  weight: number;
}

// ─── Pricing ─────────────────────────────────────────────────────────────────

export interface CreatePriceRequest {
  productId: number;
  unitId: number;
  price: number;
  currency: Currency;
}

export interface AddProductPriceRequest {
  unitName: string;
  price: number;
  currency: Currency;
  /** Required when adding a new unit to a product that already has a base unit. */
  conversionFactor?: number;
}

// ─── Teams ────────────────────────────────────────────────────────────────────

export type TeamRole = 'ADMIN' | 'MEMBER';
export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'CANCELLED';

export interface TeamMember extends BaseEntity {
  businessId: number;
  userId: number;
  role: TeamRole;
}

export interface TeamInvite extends BaseEntity {
  businessId: number;
  email: string;
  token: string;
  status: InviteStatus;
  invitedBy: number;
  role: TeamRole;
}

export interface InviteTeammateRequest {
  email: string;
  role: TeamRole;
}

export interface AcceptInviteRequest {
  token: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface SpringPage<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export type PagedProducts = SpringPage<Product>;
export type PagedOrders = SpringPage<Order>;
export type PagedPayments = SpringPage<Payment>;
export type PagedEarnings = SpringPage<EarningRow>;

// ─── Seller earnings ─────────────────────────────────────────────────────────

export interface EarningsSummary {
  currency: string;
  totalEarned: number;
  thisMonth: number;
  last30Days: number;
  paidOrders: number;
  averageOrder: number;
}

/** What a seller receives for one paid order. The breakdown is null for older payments. */
export interface EarningRow {
  paymentId: number;
  reference: string;
  orderId: number | null;
  paidAt: string;
  itemsAmount: number | null;
  deliveryFee: number | null;
  courierDelivery: boolean;
  earnings: number;
  customerPaid: number;
  /** Set when the order was cancelled and refunded; shown but not part of the earnings. */
  refundStatus?: 'REQUESTED' | 'FAILED' | null;
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface RevenueDataPoint {
  date: string;    // "YYYY-MM-DD"
  revenue: number;
}

// ─── Product visit analytics ─────────────────────────────────────────────────

export interface ProductVisitDay {
  date: string; // "YYYY-MM-DD", Lagos time
  views: number;
  /** The most visited product that day; null when nobody visited. */
  top: { productId: number; name: string; views: number } | null;
}

export interface ProductVisitStat {
  productId: number;
  name: string;
  image: string | null;
  /** False once the seller has removed the product. */
  available: boolean;
  /** True while the seller has the product hidden from shoppers. */
  hidden: boolean;
  views: number;
  previousViews: number;
  /** One number per day of the period, oldest first. */
  series: number[];
}

export interface ProductAnalytics {
  from: string;
  to: string;
  days: number;
  totalViews: number;
  /** Views in the equally long period just before this one. */
  previousViews: number;
  daily: ProductVisitDay[];
  products: ProductVisitStat[];
}

// ─── Custom domains ───────────────────────────────────────────────────────────

export type CustomDomainSource = 'CONNECTED' | 'PURCHASED';
export type CustomDomainStatus = 'AWAITING_VERIFICATION' | 'AWAITING_DNS' | 'ACTIVE';

/** One DNS record the seller has to add at their domain provider. */
export interface DnsRecord {
  type: string;
  name: string;
  value: string;
  note: string | null;
}

export interface CustomDomain {
  hostname: string;
  source: CustomDomainSource;
  status: CustomDomainStatus;
  /** The ownership (TXT) record; null once ownership is proven, or for bought domains. */
  verification: DnsRecord | null;
  /** Records that point the domain at the store; empty for bought domains (Shelflyd sets them up). */
  routing: DnsRecord[];
  /** What is still missing, in plain words; null when nothing is wrong. */
  message: string | null;
  lastCheckedAt: string | null;
  activatedAt: string | null;
  /** When a bought domain's registration ends. */
  expiresAt: string | null;
}

export type DomainPurchaseStatus = 'PENDING_PAYMENT' | 'PAID' | 'REGISTERED' | 'FAILED';

export interface DomainPurchaseStatusInfo {
  reference: string;
  domain: string;
  status: DomainPurchaseStatus;
  amountNgn: number;
  message: string | null;
}

export interface DomainState {
  /** False where custom domains are switched off (staging): show nothing about them. */
  enabled: boolean;
  /** Only the business owner may connect, buy or remove a domain. */
  canManage: boolean;
  /** Whether Shelflyd issues HTTPS for the domain itself. */
  automaticHttps: boolean;
  domain: CustomDomain | null;
  /** Whether the "Buy a domain" search (names and prices) is available. */
  searchEnabled: boolean;
  /** Whether paying for and registering a domain is allowed. Search can be on while this is off. */
  purchasingEnabled: boolean;
  /** The most recent domain purchase, when one is in flight or just failed. */
  purchase: DomainPurchaseStatusInfo | null;
}

export interface DomainSearchResult {
  domain: string;
  available: boolean;
  priceNgn: number;
  years: number;
}

export interface DomainSearchResponse {
  query: string;
  searchEnabled: boolean;
  purchasingEnabled: boolean;
  results: DomainSearchResult[];
}

/** The owner details registered with the domain (they appear in the domain's public WHOIS record). */
export interface DomainContact {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface PurchaseDomainRequest {
  domain: string;
  years: number;
  contact: DomainContact;
}

export interface PurchaseDomainResponse {
  reference: string;
  /** The Paystack page to send the seller to for payment. */
  authorizationUrl: string;
  amountNgn: number;
}

// ─── API Error ────────────────────────────────────────────────────────────────

export interface ApiError {
  status: number;
  code: string;
  message: string;
  timestamp: string;
}

// ─── Payout account & payment fees ───────────────────────────────────────────

export interface Bank {
  name: string;
  code: string;
}

export interface PayoutAccount {
  configured: boolean;
  bankName: string | null;
  accountName: string | null;
  accountNumberMasked: string | null;
}

export interface SavePayoutAccountRequest {
  bankCode: string;
  accountNumber: string;
}

export interface ProcessingFeeQuote {
  amount: number;
  /** Platform fee, a percentage of the items subtotal. */
  serviceFee: number;
  processingFee: number;
  total: number;
}

/** Older orders only carry `total`; the breakdown fields are null for them. */
export interface OrderPaymentSummary {
  reference: string;
  itemsAmount: number | null;
  deliveryFee: number | null;
  serviceFee: number | null;
  processingFee: number | null;
  total: number;
  /** Set once the order was cancelled: REQUESTED (on its way back to the buyer) or FAILED (being handled by hand). */
  refundStatus?: 'REQUESTED' | 'FAILED' | null;
  refundAmount?: number | null;
}

// ─── Seller subscription ─────────────────────────────────────────────────────

export type SubscriptionState = 'TRIAL' | 'ACTIVE' | 'GRACE' | 'LAPSED';

export interface SubscriptionCharge {
  reference: string;
  kind: 'SUBSCRIPTION' | 'CARD_SETUP';
  amountNaira: number;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  createdAt: string;
}

export interface Subscription {
  state: SubscriptionState;
  priceNaira: number;
  trialEndsAt: string;
  paidUntil: string | null;
  /** End of the trial or the paid period, whichever is later. */
  accessEndsAt: string;
  /** accessEndsAt + the grace period; the storefront is hidden after this. */
  graceEndsAt: string;
  /** Whole days until accessEndsAt (TRIAL/ACTIVE) or graceEndsAt (GRACE); 0 when LAPSED. */
  daysLeft: number;
  autoRenew: boolean;
  card: { brand: string | null; last4: string | null } | null;
  cardSetupAmountNaira: number;
  charges: SubscriptionCharge[];
  /** False while the platform isn't enforcing subscriptions: nothing is hidden, so nothing should warn. */
  enforced: boolean;
  /** False while Shelflyd is free: no plan, card or payment applies. */
  billingEnabled?: boolean;
}

export interface SubscriptionCheckout {
  url: string;
  reference: string;
}
