# GearUp Frontend — API Integration Map

> Source of truth for every active client-side endpoint, its HTTP method, request shape, response shape, helper, and consuming UI surface.
> Base URL: `process.env.NEXT_PUBLIC_API_URL` → defaults to `http://localhost:4000/api`.

---

## 1. Cross-cutting infrastructure

### 1.1 Axios client

- File: `src/shared/api.ts`
- Behavior:
  - Single `axios` instance with `withCredentials: true` and a 15s timeout.
  - Request interceptor injects `Authorization: Bearer <accessToken>` from the `gearup_access_token` cookie (`src/shared/cookies.ts`).
  - Response interceptor:
    - On `401`, runs a single in-flight `POST /auth/refresh` (deduplicated via module-level `refreshRequest`).
    - On refresh success, retries the original request once with a fresh access token.
    - On refresh failure, clears the `gearup_access_token` and `gearup_refresh_token` cookies and rejects.
    - Skips the refresh-and-retry path for these auth endpoints, where a 401 is the final answer: `/auth/refresh`, `/auth/login`, `/auth/register`, `/auth/me`.
  - All client helpers use the envelope type:
    ```ts
    interface ApiEnvelope<T> {
      success: boolean;
      message: string;
      data: T;
    }
    ```

### 1.2 Auth store

- File: `src/store/authStore.ts`
- Persists only `user` + `isAuthenticated` to `localStorage` (`gearup-auth`). JWTs live in cookies only.
- Boots via `AuthInitializer` (called from `app/layout.tsx`); the initializer delegates to `useAuthStore().initialize()`, which in turn calls `fetchProfile` when a cookie is present.
- Exposes: `login`, `register`, `logout`, `refresh`, `fetchProfile`, `setUser`, and `reset` (full store reset).

### 1.3 Cookie helpers

- File: `src/shared/cookies.ts`
- Cookie names: `gearup_access_token` (7-day expiry) and `gearup_refresh_token` (30-day expiry).
- `setTokenCookie(token, isRefresh = false)`, `getTokenCookie(isRefresh = false)`, `removeTokenCookies()`.
- Uses `js-cookie` with `SameSite=Lax`, `Path=/`, and `secure` in production.

---

## 2. Auth endpoints

| Method | Endpoint | Helper | Used by | Auth |
| --- | --- | --- | --- | --- |
| `POST` | `/auth/register` | `useAuthStore().register` | `src/app/auth/register/page.tsx` (`RegisterForm`) | Public |
| `POST` | `/auth/login` | `useAuthStore().login` | `src/app/auth/login/page.tsx` (`LoginForm`) | Public |
| `POST` | `/auth/refresh` | `refreshAccessToken` (interceptor) + `useAuthStore().refresh` | `src/shared/api.ts` (401 retry, excluded from retry list), `useAuthStore().refresh` | Public (cookie) |
| `POST` | `/auth/logout` | `useAuthStore().logout` | `src/components/Navbar.tsx` (profile menu) | Required |
| `GET` | `/auth/me` | `useAuthStore().fetchProfile` | `src/store/authStore.ts` (`initialize` flow) | Required |
| `PATCH` | `/auth/me` | `updateMyProfile` | `src/app/dashboard/customer/profile/page.tsx`, `src/app/dashboard/provider/profile/page.tsx`, `src/app/dashboard/admin/profile/page.tsx` | Required |

Navbar's "Sign in" / "Get started" CTAs (`src/components/Navbar.tsx`) are pure navigation; they link to `/auth/login` and `/auth/register` and do not call `useAuthStore().login` directly.

`updateMyProfile` payload:

```ts
{ name?: string; email?: string; }
```

Request / response contract (login, register, refresh):

```ts
type AuthEnvelope = ApiEnvelope<{
  user: AuthUser;
  tokens: { accessToken: string; refreshToken: string; expiresIn: number };
}>;
```

---

## 3. Catalog endpoints

### 3.1 Categories

| Method | Endpoint | Helper | Used by | Auth |
| --- | --- | --- | --- | --- |
| `GET` | `/categories?limit=100&page=1` | `fetchCategories` | `src/app/page.tsx` (Home), `src/app/gear/page.tsx` (`GearBrowser`) | Public |

- Cached at the Next.js edge with `revalidate: 300`.

### 3.2 Gear

| Method | Endpoint | Helper | Used by | Auth |
| --- | --- | --- | --- | --- |
| `GET` | `/gear?limit=N&isAvailable=true&sortBy=createdAt&sortOrder=desc` | `fetchFeaturedGear` | `src/app/page.tsx` (Home) | Public |
| `GET` | `/gear?...` (full search) | `fetchGearList` | `src/app/gear/GearBrowser.tsx` (search results) | Public |
| `GET` | `/gear/:id` | `fetchGearById` | `src/app/gear/[id]/page.tsx` (detail), `generateMetadata` | Public |
| `GET` | `/reviews/gear/:id?page=1&limit=10` | `fetchGearReviews` | `src/app/gear/[id]/page.tsx` (review list) | Public |

Supported query params (server side): `page`, `limit`, `search`, `categoryId`, `category`, `brand`, `priceMin`, `priceMax`, `isAvailable`, `providerId`, `startDate`, `endDate`, `sortBy`, `sortOrder`.

`fetchFeaturedGear` uses ISR (`revalidate: 60`); the other gear calls use `cache: "no-store"`.

---

## 4. Rentals / orders

| Method | Endpoint | Helper | Used by | Auth |
| --- | --- | --- | --- | --- |
| `GET` | `/rentals/occupied/:gearItemId` | `fetchOccupiedDates` | `src/components/BookingCard.tsx` (calendar grey-out, query key `["gear-occupied-dates", itemId]`) | Public |
| `GET` | `/rentals?...` | `fetchMyRentals` *(defined but not currently imported by any UI — see note)* | `src/components/OrdersTable.tsx` *(inline `fetchOrders` calls `/rentals?limit=N`)*, `src/app/dashboard/customer/orders/page.tsx` | Customer |
| `GET` | `/rentals/:id` | `fetchRentalOrder` | `src/app/dashboard/customer/orders/[id]/confirmation/page.tsx`, `src/app/dashboard/customer/orders/[id]/pay/page.tsx`, `src/app/dashboard/customer/orders/[id]/page.tsx`, `src/app/payment/success/page.tsx` (poll), `src/app/payment/cancel/page.tsx` | Customer |
| `POST` | `/rentals` | `createRentalOrder` | `src/components/BookingCard.tsx` (place rental) | Customer |
| `PATCH` | `/rentals/:id/status` | `cancelRentalOrder` | `src/app/dashboard/customer/orders/[id]/page.tsx` (customer-side cancellation while order is `placed` or `confirmed`) | Customer |

`createRentalOrder` body:

```ts
{
  startDate: string;            // ISO yyyy-mm-dd
  endDate: string;              // ISO yyyy-mm-dd
  notes?: string;
  items: [{ gearItemId: string; quantity: number }];
}
```

`cancelRentalOrder` body:

```ts
{ status: "cancelled"; reason?: string; }
```

Server response payload (used by confirmation + pay + detail pages) is `ApiEnvelope<{ order: RentalOrder }>`.

> **Note on `fetchMyRentals`**: the helper is exported from `src/shared/rentals.ts`, but the two tables that read `/rentals` (`OrdersTable.tsx`, `dashboard/customer/page.tsx`) call `api.get('/rentals?…')` directly with locally typed `RentalListResult` shapes. `fetchMyRentals` is dead code at the moment and is preserved only because the doc tracks the shared surface.

---

## 5. Payments (Stripe)

| Method | Endpoint | Helper | Used by | Auth |
| --- | --- | --- | --- | --- |
| `POST` | `/payments/create` | `createPaymentIntent` | `src/components/StripePaymentForm.tsx` | Customer |
| `GET` | `/payments?...` | `fetchPayments` | `src/components/PaymentsTable.tsx`, `src/app/dashboard/customer/payments/page.tsx` | Customer |
| `POST` | `/payments/:id/sync` | `syncPaymentStatus` | `src/components/StripePaymentForm.tsx` (post-confirm reconciliation nudge) | Customer |
| (Stripe webhook) | `/payments/confirm` | server-side only | triggers `paid` status update via Stripe signature | Public |

`createPaymentIntent` body: `{ rentalOrderId: string }`.

`syncPaymentStatus` has no body; it asks the server to reconcile the payment against Stripe and return `{ status, orderStatus, synced }`.

`StripePaymentForm` flow:
1. POST `/payments/create` → `{ clientSecret, paymentId, amount, status }`.
2. Mount `<Elements stripe={loadStripe(pk)} options={{ clientSecret, appearance: dark/light per theme }}>`.
3. Call `stripe.confirmPayment({ confirmParams: { return_url: <origin>/dashboard/customer/orders/<orderId>/confirmation }, redirect: "if_required" })`.
4. On success, POST `/payments/:id/sync` to nudge the server to mark the order paid (webhook fallback).
5. Server webhook flips the rental order to `paid`; the success page (`src/app/payment/success/page.tsx`) polls `GET /rentals/:id` until status changes.

---

## 6. Reviews

| Method | Endpoint | Helper | Used by | Auth |
| --- | --- | --- | --- | --- |
| `GET` | `/reviews/gear/:id?page=1&limit=10` | `fetchGearReviews` | `src/app/gear/[id]/page.tsx` | Public |
| `POST` | `/reviews` | `createReview` | `src/components/ReviewModal.tsx`, mounted from `src/app/dashboard/customer/orders/[id]/page.tsx` (opened via the `Review` link shown on `returned` orders in `OrdersTable.tsx`) | Customer |

`createReview` body:

```ts
{
  rentalOrderId: string;
  rating: number;              // 1-5 enforced client-side in ReviewModal
  comment?: string;            // max 1000 chars (client validation)
}
```

Note: `OrdersTable.tsx` does **not** mount `ReviewModal` directly. For a `returned` order it surfaces a "Review" link that anchors to `#review` on the order detail page; the modal itself lives there.

---

## 7. Provider workspace

### 7.1 Provider gear (CRUD)

| Method | Endpoint | Helper | Used by | Auth |
| --- | --- | --- | --- | --- |
| `POST` | `/provider/gear` | `createProviderGear` | `src/components/AddGearModal.tsx` (create mode), `src/app/dashboard/provider/page.tsx` (open modal) | Provider |
| `PUT` | `/provider/gear/:id` | `updateProviderGear` | `src/components/AddGearModal.tsx` (edit mode) | Provider |
| `DELETE` | `/provider/gear/:id` | `deleteProviderGear` | `src/components/AddGearModal.tsx` (delete mode) | Provider |

Payload mirrors `CreateGearPayload` / `UpdateGearPayload` in `src/shared/providerGear.ts`. Image URLs are submitted as `string[]`; specs as a free-form JSON object.

### 7.2 Provider orders

| Method | Endpoint | Helper | Used by | Auth |
| --- | --- | --- | --- | --- |
| `GET` | `/provider/orders?...` | `fetchProviderOrders` | `src/components/ProviderOrdersTable.tsx`, `src/app/dashboard/provider/orders/page.tsx` | Provider |
| `PATCH` | `/provider/orders/:id` | `updateProviderOrderStatus` | `src/components/ProviderOrdersTable.tsx` (confirm / picked-up / returned) | Provider |

Body: `{ status: 'placed' | 'confirmed' | 'paid' | 'picked_up' | 'returned' | 'cancelled', reason?: string }`.

`ProviderOrdersTable` performs optimistic updates with TanStack Query (`onMutate` snapshot + `onError` rollback) under query key `["provider-orders", limit]`, and invalidates `["provider-orders"]`, `["customer-orders"]`, and `["rental-order", id]` on settle.

---

## 8. Admin workspace

| Method | Endpoint | Helper | Used by | Auth |
| --- | --- | --- | --- | --- |
| `GET` | `/admin/stats` | `fetchAdminStats` | `src/components/AdminStats.tsx`, `src/app/dashboard/admin/page.tsx` | Admin |
| `GET` | `/admin/users?...` | `fetchAdminUsers` | `src/components/UsersTable.tsx`, recent-users card on `src/app/dashboard/admin/page.tsx` | Admin |
| `PATCH` | `/admin/users/:id` | `updateAdminUserStatus` | `src/components/UsersTable.tsx` (suspend/activate) | Admin |
| `GET` | `/admin/rentals?...` | `fetchAdminRentals` | `src/app/dashboard/admin/rentals/page.tsx` | Admin |

- `UsersTable` mutation self-protects `admin` accounts and the current session user.
- Admin stats auto-refresh every 60 seconds via `refetchInterval` in `useQuery`.

---

## 9. UI → Endpoint surface map

| UI surface | Primary endpoints | Component / page |
| --- | --- | --- |
| Home hero + featured grid | `GET /gear`, `GET /categories` | `src/app/page.tsx` (RSC), `src/components/CategoryCarousel.tsx`, `src/components/GearCard.tsx`. (`HeroSearch` is render-only; it just navigates to `/gear`.) |
| Catalog browser | `GET /gear`, `GET /categories` | `src/app/gear/page.tsx`, `src/app/gear/GearBrowser.tsx`, `src/app/gear/GearResults.tsx`, `src/components/FilterSidebar.tsx`, `src/components/GearCard.tsx`, `src/components/GearGrid.tsx` |
| Gear detail + booking | `GET /gear/:id`, `GET /reviews/gear/:id`, `GET /rentals/occupied/:id`, `POST /rentals` | `src/app/gear/[id]/page.tsx` (RSC for detail + reviews), `src/components/BookingCard.tsx`. (`GearGallery` is render-only — it does not call any helper.) |
| Customer orders + payments | `GET /rentals`, `GET /payments`, `POST /payments/create` | `src/app/dashboard/customer/page.tsx`, `src/app/dashboard/customer/orders/page.tsx`, `src/components/OrdersTable.tsx`, `src/components/PaymentsTable.tsx` |
| Customer order detail + review | `GET /rentals/:id`, `PATCH /rentals/:id/status`, `POST /reviews` | `src/app/dashboard/customer/orders/[id]/page.tsx`, `src/components/ReviewModal.tsx` |
| Profile (customer / provider / admin) | `PATCH /auth/me` | `src/app/dashboard/customer/profile/page.tsx`, `src/app/dashboard/provider/profile/page.tsx`, `src/app/dashboard/admin/profile/page.tsx` |
| Order confirmation + payment | `GET /rentals/:id`, `POST /payments/create`, `POST /payments/:id/sync` | `src/app/dashboard/customer/orders/[id]/confirmation/page.tsx`, `src/app/dashboard/customer/orders/[id]/pay/page.tsx`, `src/components/StripePaymentForm.tsx` |
| Payment landing | `GET /rentals/:id` (poll) | `src/app/payment/success/page.tsx`, `src/app/payment/cancel/page.tsx` |
| Reviews | `POST /reviews`, `GET /reviews/gear/:id` | `src/components/ReviewModal.tsx` (mounted by the order detail page) |
| Provider gear CRUD | `POST /provider/gear`, `PUT /provider/gear/:id`, `DELETE /provider/gear/:id` | `src/app/dashboard/provider/page.tsx`, `src/components/AddGearModal.tsx` |
| Provider order queue | `GET /provider/orders`, `PATCH /provider/orders/:id` | `src/app/dashboard/provider/orders/page.tsx`, `src/components/ProviderOrdersTable.tsx` |
| Admin overview | `GET /admin/stats`, `GET /admin/users` (5) | `src/app/dashboard/admin/page.tsx`, `src/components/AdminStats.tsx` |
| Admin user management | `GET /admin/users`, `PATCH /admin/users/:id` | `src/app/dashboard/admin/users/page.tsx`, `src/components/UsersTable.tsx` |
| Admin rental audit | `GET /admin/rentals` | `src/app/dashboard/admin/rentals/page.tsx` |
| Auth + navbar | `/auth/login`, `/auth/register`, `/auth/me`, `/auth/logout`, `/auth/refresh` | `src/components/Navbar.tsx` (links only), `src/components/AuthInitializer.tsx`, `src/app/auth/login/page.tsx`, `src/app/auth/register/page.tsx` |
| Error + 404 fallbacks | none | `src/app/error.tsx`, `src/app/not-found.tsx` |

---

## 10. Data state pattern

- All client-side `GET` calls run through TanStack Query (`useQuery`). Active query keys:
  - `["admin-stats"]`
  - `["admin-users", params]`
  - `["admin-rentals", params]`
  - `["provider-orders", limit]`
  - `["customer-orders", limit]` *(OrdersTable)*
  - `["customer-orders", "overview"]` *(customer dashboard)*
  - `["customer-payments", limit]`
  - `["rental-order", orderId]` *(order detail)*
  - `["gear", params]` *(catalog)*
  - `["gear-occupied-dates", itemId]` *(booking calendar)*
- Mutations invalidate the relevant query keys on success. Examples:
  - `createReview` invalidates `["rental-order", id]`, `["customer-orders"]`, `["customer-payments"]`, `["gear-reviews"]`, `["gear"]`, `["featured-gear"]`.
  - `updateProviderOrderStatus` invalidates `["provider-orders"]`, `["customer-orders"]`, `["rental-order", id]`.
  - `updateAdminUserStatus` invalidates `["admin-users"]`, `["admin-stats"]`.
- Server data is rendered in `src/app/.../page.tsx` via RSC when the page can be statically generated (`fetch` with `revalidate`); interactive tables live in client components.
- The `["my-rentals", …]` key mentioned in earlier revisions is unused — see the note on `fetchMyRentals` in §4.

---

## 11. Build verification

| Step | Command | Result (Phase 25) |
| --- | --- | --- |
| TypeScript check | `npm run typecheck` | passes (`tsc --noEmit`) |
| Production build | `npm run build` | passes; 17 routes generated |
| Phase verification | `node phase-manager.js verify` | passes |
| Commit | `node phase-manager.js commit` | `docs: compile api integration mappings and finalize project build` |

The frontend is deployment-ready at this point: every server route referenced by the UI is mapped above, all helpers in `src/shared/*` are typed, and the production build compiles without warnings beyond the known Next.js 16 `middleware → proxy` advisory.

> **Known drift to verify before next release:**
> - `src/app/dashboard/admin/page.tsx` has a "Moderate gear" button linking to `/dashboard/admin/gear`, but no `app/dashboard/admin/gear/` route exists. Either add the route or remove the button.
> - `fetchMyRentals` (`src/shared/rentals.ts`) is exported but no UI imports it. The two consumers (`OrdersTable.tsx`, `dashboard/customer/page.tsx`) call `api.get('/rentals?…')` with inline types. Either route them through `fetchMyRentals` or delete the helper.
