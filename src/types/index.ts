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
}

export interface RegisterBusinessRequest {
  name: string;
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
  createdOrders: number;
  paidOrders: number;
  preparingOrders: number;
  deliveredOrders: number;
  pickedUpOrders: number;
  totalRevenue: number;
}

// ─── Storefront ──────────────────────────────────────────────────────────────

export interface StorefrontInfo {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  themeColor: string | null;
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
  unitId: number;
  price: number;
  currency: Currency;
}

export interface Product extends BaseEntity {
  name: string;
  type: string;
  description: string;
  category: number;
  image: string;
  status: ProductStatus;
  businessId: number;
  prices: Price[];
}

export interface CreateProductRequest {
  name: string;
  type?: string;
  description?: string;
  category?: number;
  image?: string;
  status?: ProductStatus;
  priceDetails?: PriceDetail[];
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface CartProduct {
  name: string;
  type: string;
  image: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CartResponse {
  cartId: number;
  products: CartProduct[];
  totalCost: number;
}

export interface CartUpdateRequest {
  productId: number;
  unitId: number;
  quantity: number;
}

export type OrderType = 'PICKUP' | 'DELIVERY';

export interface CheckoutRequest {
  cartId: number;
  orderType: OrderType;
  locationId?: number;
}

export type PaymentType = 'paystack' | 'flutterwave' | 'stripe';

export interface CheckoutResponse {
  message: string;
  amount: string;
  payment_type: PaymentType;
  url: string;
  reference: string;
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'CREATED'
  | 'PAID'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'READY_FOR_DELIVERY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'PICKED_UP';

export interface Order extends BaseEntity {
  userId: number;
  cartId: number;
  businessId: number;
  orderType: OrderType;
  status: OrderStatus;
  deliveryLocationId: number | null;
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export type PaymentStatus = 'pending' | 'paid';

export interface Payment extends BaseEntity {
  reference: string;
  paidBy: number;
  paymentGateway: PaymentType;
  currency: string;
  status: PaymentStatus;
  amount: number;
  cartId: number;
  businessId: number;
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
  unitId: number;
  quantity: number;
}

export interface UpdateInventoryRequest {
  quantity: number;
}

// ─── Pricing ─────────────────────────────────────────────────────────────────

export interface CreatePriceRequest {
  productId: number;
  unitId: number;
  price: number;
  currency: Currency;
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

// ─── API Error ────────────────────────────────────────────────────────────────

export interface ApiError {
  status: number;
  code: string;
  message: string;
  timestamp: string;
}
