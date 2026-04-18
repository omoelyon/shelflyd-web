# Shelflyd — Multi-Tenant Marketplace

Shelflyd is a multi-tenant B2B marketplace where every business gets its own public storefront at `businessname.shelflyd.com`. Customers can browse products, add to cart, and checkout. Business owners manage their inventory, orders, payments, and team from a dashboard.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| State | Zustand (auth, cart, theme) |
| Data fetching | TanStack React Query v5 |
| Forms | React Hook Form + Zod |
| HTTP client | Axios |
| Backend | Spring Boot REST API |
| Payments | Paystack · Flutterwave · Stripe |

---

## Features

### Customer
- Browse active businesses and products
- Business storefront at `slug.shelflyd.com` with custom branding and theme colour
- Add to cart, view cart, checkout with delivery or pickup
- Payment redirect (Paystack / Flutterwave / Stripe, selected by IP)
- Accept team invites and view team memberships

### Business Owner
- Register a business (pending admin approval)
- Full dashboard: products, orders, payments, team, settings
- Upload or generate a logo; set a brand colour
- Invite team members by email (ADMIN or MEMBER role)
- Manage product inventory (create / update stock quantities)

### Admin
- Approve, suspend, or set businesses back to pending
- Manage delivery locations, categories, units and price conversions

---

## Project Structure

```
src/
├── app/
│   ├── (public)/          # Landing, businesses list, products list
│   ├── (customer)/        # Cart, checkout, account, invites
│   ├── (dashboard)/       # Business owner dashboard
│   ├── admin/             # Platform admin panel
│   ├── auth/              # Login & register
│   ├── storefront/[slug]/ # Business storefront (subdomain target)
│   ├── payment/           # Success & cancel pages
│   └── api/auth/          # Cookie set/clear API routes
├── components/
│   ├── features/          # Business, product, settings components
│   ├── layout/            # Navbar, footer, dashboard sidebar/header
│   └── ui/                # shadcn primitives
├── lib/
│   ├── api/               # Axios modules per resource
│   └── validations/       # Zod schemas
├── stores/                # Zustand stores (auth, cart, theme)
├── types/                 # TypeScript interfaces
└── middleware.ts          # Auth protection + subdomain rewriting
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- The [Shelflyd backend](https://github.com/omoelyon/shelflyd-api) running locally on port `8080`

### Installation

```bash
git clone https://github.com/omoelyon/shelflyd-web.git
cd shelflyd-web
npm install
```

### Environment

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Subdomain Routing

In production, each business storefront is served at `slug.shelflyd.com`. The Next.js middleware detects the subdomain from the `host` header and rewrites the request to `/storefront/[slug]` internally.

```
adeola-farms.shelflyd.com/          → /storefront/adeola-farms
adeola-farms.shelflyd.com/products/1 → /storefront/adeola-farms/products/1
```

For this to work in production you need:

**DNS (wildcard record)**
```
A  *  →  <your server IP>
```

**Vercel / hosting**  
Add `*.shelflyd.com` as a wildcard domain in your project settings.

> Subdomain routing does not work on `localhost`. Test storefront pages locally via `/businesses/{id}`.

---

## Authentication

- JWT returned from `POST /auth/login` is stored in `localStorage` and as an `httpOnly` cookie via `/api/auth/set-cookie`.
- The cookie is read by Next.js middleware to protect dashboard, admin, cart, checkout, account, and invites routes.
- On logout the cookie is cleared via `/api/auth/clear-cookie` and Zustand state is reset.

---

## API

All requests are proxied through Next.js rewrites:

```
/api/v1/* → NEXT_PUBLIC_API_URL/*
```

The backend base URL defaults to `http://localhost:8080`. See `next.config.ts` for the rewrite rule and `src/lib/api/` for per-resource modules.

---

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```

---

## Deployment

Deploy to [Vercel](https://vercel.com) with one click or via the CLI:

```bash
npx vercel --prod
```

Set the `NEXT_PUBLIC_API_URL` environment variable in your Vercel project settings to point to the production backend (`https://api.shelflyd.com`).
