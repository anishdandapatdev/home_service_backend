# Backend Development Specification
## Home Maintenance Membership Platform — Node.js Backend

**Derived from:** Project Proposal AD/2026/15/HOMEMAINT-001
**Prepared for:** Backend implementation using an AI code editor (Claude Code / Cursor / etc.)
**Client:** Tilak Jena | **Developer:** Anish Dandapat
**Scope:** This document specifies ONLY the backend (API + database + integrations) that powers the Customer App, Technician App, Admin Panel, and public Website described in the proposal.

---

## 1. Project Context

A subscription-based home maintenance platform for the Indian market. Homeowners pay a recurring membership fee (₹399–₹999 across 7 tiers) instead of booking one-off repairs — covering Electrical, Plumbing, AC, RO, Water Pump, Geyser, Ceiling Fan, and other services via vetted technicians.

Core business model pillars the backend must support:
- **Preventive maintenance** — auto-scheduled inspection within 3 days of signup.
- **Retention over transactions** — recurring plans, renewal reminders, no-waste rewards for unused benefit cycles.
- **One backend, three clients** — Customer App, Technician App, and Admin Panel all consume the same API; the Website consumes a public subset (catalog, pricing, lead capture).
- **Labour vs. parts billing split** — labour is covered by the plan; spare parts are billed separately and require customer approval before invoicing.

---

## 2. Tech Stack (as specified in proposal §4.1)

| Layer | Technology | Notes |
|---|---|---|
| Backend Framework | **Node.js + NestJS** | Modular, layered architecture (modules/controllers/services) |
| Primary Database | **PostgreSQL** | Memberships, requests, billing, users |
| ORM | Prisma or TypeORM | Not specified in proposal — recommend **Prisma** for type safety |
| Cache & Sessions | **Redis** | OTP storage, session cache, background job queue (BullMQ) |
| File Storage | **S3-compatible object storage** | Inspection photos, before/after job photos, signatures, invoices |
| Payment Gateway | **Razorpay** | UPI, Cards, Net Banking, Wallets |
| SMS / OTP | **MSG91** (primary) | Phone OTP auth |
| Push Notifications | **Firebase Cloud Messaging** (Android) + **APNs** (iOS) | |
| Hosting | Cloud VPS (AWS / DigitalOcean / Hostinger) | |
| CI/CD | GitHub Actions | Automated build & deploy |
| Auth | **JWT (Access + Refresh)** + Phone OTP verification | |
| Encryption | AES-256 at rest, TLS in transit | |
| API Security | Rate limiting, input validation, CORS protection | |

**Recommended additional libraries:**
- `class-validator` / `class-transformer` (DTO validation, native to NestJS)
- `@nestjs/bull` + `bullmq` (background jobs: OTP expiry, renewal reminders, inspection auto-scheduling)
- `@nestjs/jwt` + `@nestjs/passport` (auth)
- `@aws-sdk/client-s3` (or DigitalOcean Spaces SDK)
- `razorpay` (official Node SDK)
- `helmet`, `express-rate-limit` / `@nestjs/throttler`
- `swagger` (`@nestjs/swagger`) for auto-generated API docs to share with mobile/frontend devs

---

## 3. High-Level Architecture

```
                         ┌──────────────────────┐
                         │     Public Website    │  (read-only endpoints)
                         └──────────┬────────────┘
                                    │
┌──────────────┐        ┌──────────▼────────────┐        ┌──────────────────┐
│ Customer App  │──────▶│                        │◀──────│  Technician App   │
│ (Flutter)     │        │   NestJS Backend API   │        │  (Flutter)        │
└──────────────┘        │   (REST, JWT-secured)  │        └──────────────────┘
                         │                        │
┌──────────────┐        └──────────┬─────────────┘
│  Admin Panel  │──────────────────┘
│  (React)      │
└──────────────┘
                                    │
        ┌───────────────┬──────────┼───────────┬──────────────┬───────────────┐
        ▼               ▼          ▼           ▼              ▼               ▼
   PostgreSQL         Redis      S3 Storage   Razorpay       MSG91           FCM/APNs
   (primary DB)   (cache/queue) (photos/docs) (payments)   (OTP/SMS)   (push notifications)
```

**Modular breakdown (NestJS modules):**
`AuthModule`, `UsersModule`, `TechniciansModule`, `MembershipModule`, `PlansModule`, `ServiceRequestModule`, `InspectionModule`, `SparePartsModule`, `PaymentModule`, `RewardsModule`, `ComplaintsModule`, `NotificationsModule`, `AdminModule`, `ReportsModule`, `WebsiteModule` (public), `UploadModule`.

---

## 4. User Roles

| Role | Access |
|---|---|
| `CUSTOMER` | Own profile, memberships, service requests, ratings |
| `TECHNICIAN` | Assigned jobs only, own earnings |
| `ADMIN` | Full access — customers, technicians, pricing, complaints, reports |
| `PUBLIC` (unauthenticated) | Website: plans, service catalog, lead capture form |

Role-based guards (`@Roles()` decorator + `RolesGuard`) on every protected route.

---

## 5. Database Schema (Core Entities)

> Use this as the basis for your Prisma schema / TypeORM entities. Field lists are indicative — expand as needed during implementation.

### 5.1 `User` (Customer)
```
id (uuid, PK)
phone (unique, indexed)
name
email (nullable)
addresses (relation → Address[])
created_at, updated_at
is_active
```

### 5.2 `Address`
```
id, user_id (FK), label, line1, line2, city, state, pincode, lat, lng, is_default
```

### 5.3 `Technician`
```
id (uuid, PK)
phone (unique)
name
kyc_status (enum: PENDING, VERIFIED, REJECTED)
kyc_documents (relation → files in S3)
skills (array: ELECTRICAL, PLUMBING, AC, RO, PUMP, GEYSER, FAN, OTHER)
is_active
service_area (city / pincode list)
created_at, updated_at
```

### 5.4 `MembershipPlan`
```
id, name, tier_code, price (7 tiers ₹399–₹999)
coverage_rules (JSON — configurable per plan: categories covered, visit limits, emergency priority flag)
is_active
```

### 5.5 `Membership` (subscription instance)
```
id, user_id (FK), plan_id (FK)
status (enum: ACTIVE, EXPIRED, CANCELLED, PENDING_INSPECTION)
start_date, end_date, renewal_date
inspection_id (FK, nullable)
auto_renew (boolean)
created_at, updated_at
```

### 5.6 `Inspection`
```
id, membership_id (FK), technician_id (FK)
scheduled_date (auto-set: signup + 3 days)
status (enum: SCHEDULED, COMPLETED, MISSED)
report_notes, photo_urls (array)
completed_at
```

### 5.7 `ServiceRequest`
```
id, user_id (FK), membership_id (FK), technician_id (FK, nullable)
category (enum: ELECTRICAL, PLUMBING, AC, RO, PUMP, GEYSER, FAN, OTHER)
description
is_emergency (boolean)
status (enum: RAISED, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED)
requested_time_window
before_photos (array), after_photos (array)
customer_signature_url
created_at, updated_at, completed_at
```

### 5.8 `SparePart`
```
id, service_request_id (FK), name, cost, quantity
approval_status (enum: PENDING, APPROVED, REJECTED)
approved_at
```

### 5.9 `Invoice`
```
id, service_request_id (FK), labour_cost (0 if covered by plan), parts_total, tax, grand_total
pdf_url, created_at
```

### 5.10 `Payment`
```
id, user_id (FK), reference_type (enum: MEMBERSHIP, INVOICE)
reference_id, amount, razorpay_order_id, razorpay_payment_id
status (enum: CREATED, SUCCESS, FAILED, REFUNDED)
created_at
```

### 5.11 `RewardLedger`
```
id, user_id (FK), points, reason (enum: UNUSED_CYCLE, TIMELY_RENEWAL, OTHER)
expires_at, created_at
```

### 5.12 `RewardCatalogItem` (admin-configured)
```
id, title, description, points_required, partner_name, is_active
```

### 5.13 `Complaint`
```
id, user_id (FK), service_request_id (FK, nullable), subject, description
status (enum: OPEN, IN_PROGRESS, RESOLVED, CLOSED)
resolution_notes, created_at, resolved_at
```

### 5.14 `Rating`
```
id, service_request_id (FK), technician_id (FK), stars (1–5), comment
```

### 5.15 `Notification` (log)
```
id, user_id (nullable), technician_id (nullable), channel (PUSH/SMS), title, body, sent_at
```

### 5.16 `LeadCapture` (from public website)
```
id, name, phone, email (nullable), message, source, created_at, status (NEW/CONTACTED)
```

### 5.17 `OtpVerification` (Redis-backed, not permanent table)
```
phone → { otp_hash, expires_at, attempts }
```

---

## 6. API Modules & Endpoints

> All endpoints prefixed `/api/v1`. JWT required unless marked **Public**.

### 6.1 Auth (`/auth`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/otp/send` | **Public.** Send OTP via MSG91 to phone (rate-limited) |
| POST | `/auth/otp/verify` | **Public.** Verify OTP → issue JWT access + refresh token |
| POST | `/auth/refresh` | Exchange refresh token for new access token |
| POST | `/auth/logout` | Invalidate refresh token |
| POST | `/auth/technician/login` | Technician login (credentials issued/verified by admin) |

### 6.2 Users / Profile (`/users`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/users/me` | Get own profile |
| PATCH | `/users/me` | Update name, email |
| POST | `/users/me/addresses` | Add address |
| PATCH/DELETE | `/users/me/addresses/:id` | Update/remove address |

### 6.3 Membership Plans (`/plans`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/plans` | **Public.** List all 7 plans with coverage comparison |
| GET | `/plans/:id` | **Public.** Plan detail |
| POST | `/admin/plans` | Admin: create/configure plan tier & coverage rules |
| PATCH | `/admin/plans/:id` | Admin: update pricing/coverage |

### 6.4 Membership (`/memberships`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/memberships/purchase` | Create Razorpay order for selected plan |
| POST | `/memberships/purchase/confirm` | Verify payment signature → activate membership → auto-schedule inspection |
| GET | `/memberships/me` | Current membership status, coverage summary, renewal date |
| POST | `/memberships/:id/renew` | Renew membership (payment flow) |
| GET | `/memberships/:id/inspection` | Get inspection report |

### 6.5 Service Requests (`/service-requests`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/service-requests` | Customer raises request (category, description, time window, emergency flag) |
| GET | `/service-requests` | Customer: list own requests (history) |
| GET | `/service-requests/:id` | Request detail + live status |
| PATCH | `/service-requests/:id/cancel` | Cancel request |
| POST | `/service-requests/:id/rate` | Post-job rating & review |
| GET | `/service-requests/:id/invoice` | Download invoice |

**Technician-facing:**
| Method | Endpoint | Description |
|---|---|---|
| GET | `/technician/jobs` | Assigned jobs list for the day |
| PATCH | `/technician/jobs/:id/start` | Mark in-progress |
| POST | `/technician/jobs/:id/photos` | Upload before/after photos to S3 |
| POST | `/technician/jobs/:id/spare-parts` | Log spare parts used + cost |
| POST | `/technician/jobs/:id/complete` | Complete job with customer digital signature |
| GET | `/technician/earnings` | Earnings dashboard summary |

**Spare parts approval (customer):**
| Method | Endpoint | Description |
|---|---|---|
| GET | `/service-requests/:id/spare-parts` | View proposed spare parts & cost |
| PATCH | `/service-requests/:id/spare-parts/:partId/approve` | Approve/reject part cost before billing |

### 6.6 Rewards (`/rewards`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/rewards/me` | Points balance & history |
| GET | `/rewards/catalog` | **Public/Customer.** Vouchers & partner offers |
| POST | `/rewards/redeem` | Redeem points for a catalog item |
| POST | `/admin/rewards/catalog` | Admin: manage catalog |

### 6.7 Complaints (`/complaints`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/complaints` | Customer raises complaint |
| GET | `/complaints/me` | Own complaint history |
| GET | `/admin/complaints` | Admin: queue with filters |
| PATCH | `/admin/complaints/:id` | Admin: update status/resolution |

### 6.8 Admin Panel (`/admin`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/dashboard` | Active members, requests today, open complaints, technicians online |
| GET | `/admin/customers` | List/search/manage customer accounts |
| GET | `/admin/technicians` | List technicians, KYC/verification status |
| POST | `/admin/technicians` | Onboard new technician |
| PATCH | `/admin/technicians/:id/verify` | Approve KYC → eligible for job assignment |
| GET | `/admin/service-requests` | Full request queue |
| PATCH | `/admin/service-requests/:id/assign` | Assign/reassign technician (with SLA tracking) |
| GET | `/admin/reports/requests` | Completed requests report |
| GET | `/admin/reports/members` | Active members report |
| GET | `/admin/reports/technician-performance` | Technician performance report |

### 6.9 Website / Public (`/public`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/public/services` | Service catalog (Electrical, Plumbing, AC, RO, Pump, Geyser, Fan, Other + future categories) |
| GET | `/public/plans` | Same as `/plans`, public-facing |
| GET | `/public/rewards-info` | Explains reward program (static/CMS content) |
| POST | `/public/leads` | Lead capture / callback request form → routed to admin panel |
| GET | `/public/service-area` | Coverage area (starting Haldia, expansion roadmap) |

### 6.10 Payments (`/payments`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/payments/razorpay/order` | Create Razorpay order (membership or invoice) |
| POST | `/payments/razorpay/webhook` | **Public** (signature-verified). Razorpay webhook for payment status updates |
| GET | `/payments/history` | Customer payment history |

### 6.11 Notifications (`/notifications`)
| Method | Endpoint | Description |
|---|---|---|
| Internal service | — | Triggered by events: inspection scheduled, technician assigned, job completed, renewal reminder, emergency request confirmation. Sends via FCM/APNs (push) and MSG91 (SMS). |

---

## 7. Key Business Logic Rules to Implement

1. **Inspection auto-scheduling:** On membership activation, create an `Inspection` record with `scheduled_date = now + 3 days` and auto-assign an available technician in the service area (background job).
2. **Emergency priority:** `is_emergency` requests from premium-tier members should be flagged for priority technician assignment in the admin queue (sort order / SLA timer).
3. **Labour vs. parts billing:** Labour cost is always 0 / covered when an active membership exists; only `SparePart` costs generate a billable `Invoice` line, and only after customer approval.
4. **No-waste rewards:** A scheduled job (cron, e.g. monthly) checks each active membership for unused benefit cycles and credits `RewardLedger` points accordingly. Bonus points on timely renewal (renewed before `end_date`).
5. **Technician eligibility:** A technician can only be assigned to a job if `kyc_status = VERIFIED` and their `skills` include the request `category`.
6. **Renewal reminders:** Background job checks memberships nearing `renewal_date` (e.g., 7/3/1 days out) and sends push + SMS reminders.
7. **OTP flow:** OTP stored in Redis with short TTL (e.g. 5 min), rate-limited per phone number (e.g. max 5 requests/hour) to prevent abuse.
8. **Payment verification:** Always verify Razorpay payment signature server-side before activating membership or marking invoice paid — never trust client-side confirmation alone.
9. **Digital sign-off:** Job cannot move to `COMPLETED` without a `customer_signature_url` present.
10. **City-by-city scalability:** All location-bound entities (`Technician.service_area`, `ServiceRequest`) should be city/pincode-scoped from day one, even though launch is single-city (Haldia), to support the proposal's expansion roadmap without schema rework.

---

## 8. Security Requirements (proposal §4.2)

- **Encryption:** AES-256 at rest (DB-level or field-level for sensitive data), TLS 1.2+ in transit.
- **Auth:** JWT access (short-lived, e.g. 15 min) + refresh tokens (longer-lived, stored hashed), phone OTP as the identity verification step.
- **Payment security:** PCI-DSS compliant via Razorpay — never store raw card data on backend servers.
- **Technician verification:** KYC/ID documents required and admin-verified before job-assignment eligibility.
- **API security:** Rate limiting (`@nestjs/throttler`) on all public/auth endpoints, DTO-level input validation (`class-validator`), CORS restricted to known client origins.
- **Backups:** Automated PostgreSQL backups + documented disaster recovery/restore procedure.
- **Least privilege:** Role guards on every endpoint; admin routes fully separated from customer/technician routes at the guard level, not just UI level.

---

## 9. Suggested NestJS Folder Structure

```
src/
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/ (jwt.strategy.ts, otp.strategy.ts)
│   └── guards/ (jwt-auth.guard.ts, roles.guard.ts)
├── users/
├── technicians/
├── plans/
├── memberships/
├── inspections/
├── service-requests/
├── spare-parts/
├── invoices/
├── payments/
│   ├── razorpay.service.ts
│   └── webhook.controller.ts
├── rewards/
├── complaints/
├── ratings/
├── notifications/
│   ├── fcm.service.ts
│   ├── apns.service.ts
│   └── sms.service.ts (MSG91)
├── admin/
├── reports/
├── public/ (website-facing endpoints)
├── upload/ (S3 service)
├── common/
│   ├── decorators/ (roles.decorator.ts)
│   ├── filters/ (http-exception.filter.ts)
│   ├── interceptors/
│   └── pipes/
├── jobs/ (BullMQ processors: inspection-scheduler, renewal-reminder, rewards-cron)
├── prisma/ (schema.prisma, prisma.service.ts)
├── app.module.ts
└── main.ts
```

---

## 10. Environment Variables Checklist

```
DATABASE_URL=
REDIS_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
MSG91_API_KEY=
MSG91_SENDER_ID=
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_BUCKET=
S3_REGION=
FCM_SERVER_KEY=
APNS_KEY_ID=
APNS_TEAM_ID=
APNS_PRIVATE_KEY=
NODE_ENV=
PORT=
CORS_ORIGINS=
```

---

## 11. Development Phasing Alignment (from proposal §6)

| Phase | Backend-relevant work |
|---|---|
| Phase 1 (Days 1–4) | Finalize data model, sprint plan |
| Phase 3 (Days 11–28) | Build APIs, DB schema, OTP auth, Razorpay integration |
| Phase 4–6 (Days 18–48) | Extend APIs in parallel with Customer App, Technician App, Admin Panel development |
| Phase 7 (Days 49–58) | QA, bug fixes, security review |
| Phase 8 (Days 59–69) | Deployment (server), production hardening |

---

## 12. How to Use This Document with an AI Code Editor

Suggested prompt to give your AI coding assistant:

> "Using the attached backend specification, scaffold a NestJS project with Prisma + PostgreSQL. Start with the `AuthModule` (OTP via MSG91 + JWT), then `UsersModule` and `PlansModule`. Follow the entity definitions in Section 5 exactly for the Prisma schema, and the endpoint list in Section 6 for controllers."

Build incrementally module-by-module rather than asking for the entire backend at once — this keeps generated code reviewable and consistent with the schema above.
