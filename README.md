# GearUp Frontend

Customer, provider, and admin web app for the GearUp rental marketplace. Built with Next.js 16 (App Router), React 19, TypeScript, and Tailwind v4.

The backend is not included in this submission. The app talks to an external API over HTTP using `NEXT_PUBLIC_API_URL`, and Stripe is loaded with a public key. No backend code or secrets are required to run this frontend.

## Stack

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS v4, Radix primitives, Phosphor icons
- TanStack Query for server state, Zustand for client state
- Axios with request interceptor for auth and CSRF
- Stripe Elements for payments
- React Hook Form + Zod for form validation
- js-cookie for client-side access/refresh token storage

## Routes

| Path | Description |
|---|---|
| `/` | Landing page with hero, categories, featured gear, feature bento |
| `/gear` | Browseable gear catalog with filters |
| `/gear/[id]` | Gear detail page |
| `/auth/login` | Sign in |
| `/auth/register` | Sign up (role: customer or provider) |
| `/dashboard/customer` | Customer dashboard |
| `/dashboard/customer/orders/[id]` | Order detail |
| `/dashboard/customer/orders/[id]/pay` | Stripe checkout |
| `/dashboard/customer/orders/[id]/confirmation` | Post-payment return |
| `/dashboard/provider` | Provider workspace |
| `/dashboard/admin` | Admin workspace |
| `/payment/success` | Payment success landing |
| `/payment/cancel` | Payment cancelled / failed landing |

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Base URL of the GearUp backend, including `/api`. Example: `https://gearup-api.onrender.com/api` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes (for payments) | Stripe publishable key (`pk_test_...` or `pk_live_...`). Must match the mode used by the backend. |

The dev defaults baked into `src/shared/api.ts` are:

- `NEXT_PUBLIC_API_URL` falls back to `http://localhost:4000/api`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` falls back to empty string; without it, `StripePaymentForm` shows a "Stripe is not configured" message instead of a checkout

Variables prefixed with `NEXT_PUBLIC_` are inlined at build time by Next.js. Restart the dev server after changing them.

## Local Setup

You need:

- Node.js 20+
- npm 10+ (or pnpm/yarn)
- A running GearUp backend reachable from your machine (or a public URL such as the Render API URL)
- A Stripe account if you want to test payments

```bash
npm install
cp .env.example .env.local
# Edit .env.local and set NEXT_PUBLIC_API_URL (and Stripe key)
npm run dev
```

Open `http://localhost:3000`.

### Pointing the frontend at the deployed Render API

If the backend is deployed to Render and you only have its URL:

1. Set `NEXT_PUBLIC_API_URL` to `https://<your-service>.onrender.com/api` in `.env.local`.
2. Set `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to the publishable key from the Stripe dashboard. It must be from the same Stripe mode (test vs live) as the backend's `STRIPE_SECRET_KEY`.
3. Restart `npm run dev`.

The frontend will then call the deployed API over HTTPS and use Stripe's hosted payment element. There is no backend code to clone or run locally.

### Local backend instead

If you have the backend running on your machine:

1. Start it on the configured port (the example assumes `:4000`).
2. Make sure CORS on the backend allows `http://localhost:3000` (handled by `CLIENT_URL` in the backend env).
3. Set `NEXT_PUBLIC_API_URL=http://localhost:4000/api`.

## Stripe

Payments go through Stripe Elements on the frontend; the server creates the PaymentIntent. To enable real payments locally:

1. Get a test publishable key from the Stripe dashboard.
2. Put it in `.env.local` as `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
3. The backend must be configured with a matching `STRIPE_SECRET_KEY` and a webhook endpoint reachable by Stripe (or call the `/payments/:id/sync` endpoint after success as a fallback — see `src/components/StripePaymentForm.tsx`).

Test cards such as `4242 4242 4242 4242` with any future expiry and CVC work in test mode.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server with hot reload on port 3000 |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check, no emit |

## Build and Deploy

The app is a standard Next.js 16 project. To produce a production build:

```bash
npm run build
npm start
```

For deployment (Vercel, Netlify, Render static, etc.), set the same two `NEXT_PUBLIC_*` variables in the deployment environment. No other env vars are required by the frontend.

## Project Layout

```
src/
  app/                    # Next.js App Router routes
    auth/                 # login, register
    dashboard/            # role-based dashboards
    gear/                 # catalog and detail
    payment/              # success and cancel landings
  components/             # shared UI components
  shared/
    api.ts                # axios instance, auth refresh interceptor
    cookies.ts            # token cookie helpers
    csrf.ts               # double-submit CSRF header
    paymentClient.ts      # createPaymentIntent, syncPaymentStatus
    payments.ts           # payment list helpers
    ...                   # auth, gear, rentals, reviews, etc.
  store/                  # zustand stores
proxy.ts                  # Next.js 16 middleware (formerly middleware.ts)
```

## How Auth Works (Frontend)

- Login/refresh responses carry `tokens.accessToken` and `tokens.refreshToken` in JSON. The frontend writes them to `gearup_access_token` and `gearup_refresh_token` cookies.
- The axios request interceptor attaches `Authorization: Bearer <accessToken>` to every request.
- On a `401`, the response interceptor calls `/auth/refresh` once and retries. The endpoints `/auth/refresh`, `/auth/login`, `/auth/register`, and `/auth/me` are excluded from the retry path.
- `withCredentials: true` is set on the axios instance so cookies are sent cross-origin.

See `src/shared/api.ts` and `src/shared/cookies.ts` for the exact behavior.

## Notes

- The backend is required at runtime but not at build time. All data comes from API calls.
- This repository submits the frontend only. Backend source is maintained in a separate repo (`gearup-v2-server`).
- See `API_INTEGRATION.md` for the full list of API endpoints, request/response shapes, and TanStack Query keys the frontend relies on.