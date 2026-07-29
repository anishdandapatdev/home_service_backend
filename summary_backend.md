# 📦 Home Maintenance Backend — Summary Guide

> Written for: Anish Dandapat (Flutter Developer, new to backend)
> Stack: **Node.js + NestJS + PostgreSQL + Prisma**

---

## 🧠 What Is This Backend?

This is the **brain of your Home Maintenance app**.

Your Flutter app (Customer App, Technician App, Admin Panel) does NOT talk to the database directly.
Instead, Flutter sends **HTTP requests (like API calls)** to this backend, and the backend does all the heavy work:
- Checks login (OTP / JWT)
- Reads/writes to the database
- Charges payments via Razorpay
- Sends SMS via MSG91
- Sends push notifications via FCM

```
Flutter App  ──→  Backend (this code)  ──→  PostgreSQL Database
                          │
                          ├──→ Razorpay (payments)
                          ├──→ MSG91 (OTP SMS)
                          └──→ Firebase (push notifications)
```

---

## 📁 Folder Structure — Simple Explanation

```
home_service_backend/
│
├── prisma/                     ← Database setup
│   ├── schema.prisma           ← All DB tables defined here (like a blueprint)
│   └── seed.ts                 ← Pre-fills DB with plans, admin, technicians
│
├── src/                        ← All backend code lives here
│   │
│   ├── main.ts                 ← Entry point. App starts from here. Sets up Swagger docs.
│   ├── app.module.ts           ← Root file. Connects all modules together.
│   │
│   ├── prisma/                 ← Database connection helper
│   │   ├── prisma.service.ts   ← Connects/disconnects from PostgreSQL
│   │   └── prisma.module.ts    ← Makes DB available to all modules
│   │
│   ├── auth/                   ← LOGIN SYSTEM
│   │   ├── auth.controller.ts  ← API routes: /auth/otp/send, /auth/otp/verify, /auth/refresh
│   │   ├── auth.service.ts     ← Logic: generate OTP, verify OTP, create JWT tokens
│   │   └── strategies/         ← JWT strategy (checks token on every request)
│   │
│   ├── users/                  ← CUSTOMER PROFILE
│   │   ├── users.controller.ts ← API routes: /users/me, /users/me/addresses
│   │   └── users.service.ts    ← Logic: get/update profile, manage addresses
│   │
│   ├── plans/                  ← MEMBERSHIP PLANS (7 tiers ₹399-₹999)
│   │   ├── plans.controller.ts ← API routes: /plans (public), /admin/plans
│   │   └── plans.service.ts    ← Logic: list plans, admin creates/updates plans
│   │
│   ├── memberships/            ← SUBSCRIPTION (buy a plan)
│   │   ├── memberships.controller.ts ← API: /memberships/purchase, /memberships/me
│   │   └── memberships.service.ts    ← Logic: pay → activate → auto-schedule inspection
│   │
│   ├── inspections/            ← PREVENTIVE INSPECTION (auto-scheduled after signup)
│   │   ├── inspections.controller.ts ← API: /inspections/membership/:id
│   │   └── inspections.service.ts    ← Logic: schedule inspection 3 days after signup
│   │
│   ├── service-requests/       ← REPAIR REQUESTS (main feature)
│   │   ├── service-requests.controller.ts ← API: /service-requests (customer)
│   │   │                                      /technician/jobs (technician)
│   │   └── service-requests.service.ts    ← Logic: raise request → assign tech → complete job
│   │
│   ├── spare-parts/            ← SPARE PARTS APPROVAL
│   │   ├── spare-parts.controller.ts ← API: /service-requests/:id/spare-parts
│   │   └── spare-parts.service.ts    ← Logic: tech logs parts → customer approves/rejects
│   │
│   ├── invoices/               ← BILLING (labour = ₹0, parts only)
│   │   ├── invoices.controller.ts ← API: /invoices/service-request/:id
│   │   └── invoices.service.ts    ← Logic: auto-generate invoice after job complete
│   │
│   ├── payments/               ← RAZORPAY PAYMENTS
│   │   ├── payments.controller.ts ← API: /payments/razorpay/order, /payments/razorpay/webhook
│   │   └── payments.service.ts    ← Logic: create order, verify payment signature
│   │
│   ├── rewards/                ← REWARD POINTS
│   │   ├── rewards.controller.ts ← API: /rewards/me, /rewards/catalog, /rewards/redeem
│   │   └── rewards.service.ts    ← Logic: earn points, redeem vouchers
│   │
│   ├── complaints/             ← COMPLAINTS
│   │   ├── complaints.controller.ts ← API: /complaints (customer), /admin/complaints
│   │   └── complaints.service.ts    ← Logic: raise complaint, admin resolves it
│   │
│   ├── admin/                  ← ADMIN PANEL
│   │   ├── admin.controller.ts ← API: /admin/dashboard, /admin/customers, /admin/technicians
│   │   └── admin.service.ts    ← Logic: metrics, KYC approval, assign technicians, reports
│   │
│   ├── public/                 ← PUBLIC WEBSITE (no login needed)
│   │   ├── public.controller.ts ← API: /public/services, /public/plans, /public/leads
│   │   └── public.service.ts    ← Logic: service catalog, lead capture form
│   │
│   ├── notifications/          ← SMS + PUSH NOTIFICATIONS
│   │   └── notifications.service.ts ← Sends SMS (MSG91) and Push (FCM/APNs)
│   │
│   ├── upload/                 ← FILE UPLOADS (photos, signatures)
│   │   ├── upload.controller.ts ← API: /upload/file, /upload/presigned-url
│   │   └── upload.service.ts    ← Logic: saves files to AWS S3
│   │
│   ├── jobs/                   ← BACKGROUND TASKS (auto-run)
│   │   └── jobs.service.ts      ← Renewal reminders (7/3/1 days), monthly rewards cron
│   │
│   └── common/                 ← SHARED UTILITIES
│       ├── decorators/         ← @GetUser(), @Roles(), @Public() helpers
│       ├── guards/             ← JwtAuthGuard (checks login), RolesGuard (checks role)
│       └── filters/            ← HttpExceptionFilter (nice error messages)
│
├── .env                        ← 🔑 All secret keys go here (DO NOT share publicly)
├── .env.example                ← Template showing which keys are needed
├── docker-compose.yml          ← Start PostgreSQL + Redis locally with one command
├── package.json                ← All npm libraries used
└── tsconfig.json               ← TypeScript settings
```

---

## 🔑 Key Concepts in Simple Words

| Term | What it means |
|---|---|
| **Module** | A feature folder (auth, payments, etc.) — each is self-contained |
| **Controller** | Receives the API request from Flutter and calls the right service |
| **Service** | Does the actual work (database queries, business logic) |
| **DTO** | Data shape validator — checks that Flutter sends correct data |
| **Guard** | Bouncer — checks JWT token before allowing access to an endpoint |
| **Prisma** | The tool that talks to PostgreSQL in TypeScript |
| **JWT Token** | A secure key Flutter gets after login — sent with every request |
| **Swagger** | Auto-generated docs at `http://localhost:3000/api/docs` — try all APIs |

---

## 🔐 User Roles

| Role | Who | What they can access |
|---|---|---|
| `CUSTOMER` | App users | Own profile, membership, service requests, rewards |
| `TECHNICIAN` | Field workers | Assigned jobs only, earnings |
| `ADMIN` | You/Tilak | Everything — customers, technicians, complaints, reports |
| `PUBLIC` | Website visitors | Plans, service list, lead form (no login) |

---

## 🌊 How a Typical Flutter → Backend Flow Works

### Example: Customer buys a membership plan

```
1. Flutter calls  →  POST /api/v1/auth/otp/send        (sends OTP to phone)
2. Flutter calls  →  POST /api/v1/auth/otp/verify       (gets JWT token back)
3. Flutter calls  →  GET  /api/v1/plans                 (shows 7 plan options)
4. Flutter calls  →  POST /api/v1/memberships/purchase  (backend creates Razorpay order)
5. Flutter opens Razorpay SDK with the order details
6. Customer pays  →  Flutter calls POST /api/v1/memberships/purchase/confirm
7. Backend verifies payment → activates membership → auto-schedules inspection
8. Flutter shows "Membership Active!" screen
```

### Example: Customer raises a repair request

```
1. Flutter calls  →  POST /api/v1/service-requests      (AC not cooling, emergency: false)
2. Backend assigns nearest VERIFIED technician automatically
3. Technician gets push notification (FCM) on his Flutter app
4. Technician arrives → marks job IN_PROGRESS via /technician/jobs/:id/start
5. Technician logs spare parts → Customer approves on Flutter app
6. Technician uploads photos + collects signature → marks COMPLETED
7. Backend auto-generates invoice (₹0 labour + parts cost + 18% GST)
```

---

## 📡 All API Endpoints at a Glance

| Group | Base URL | Purpose |
|---|---|---|
| Auth | `/api/v1/auth/...` | OTP login, JWT tokens |
| User Profile | `/api/v1/users/...` | Profile, addresses |
| Plans | `/api/v1/plans/...` | 7 membership tiers |
| Memberships | `/api/v1/memberships/...` | Buy, renew, check status |
| Inspections | `/api/v1/inspections/...` | Preventive inspection |
| Service Requests | `/api/v1/service-requests/...` | Raise repair request |
| Technician Jobs | `/api/v1/technician/...` | Tech job queue |
| Spare Parts | `/api/v1/service-requests/:id/spare-parts/...` | Part approval |
| Invoices | `/api/v1/invoices/...` | View/download invoice |
| Payments | `/api/v1/payments/...` | Razorpay integration |
| Rewards | `/api/v1/rewards/...` | Points balance, redeem |
| Complaints | `/api/v1/complaints/...` | Raise/track complaint |
| Admin | `/api/v1/admin/...` | Dashboard, reports |
| Public | `/api/v1/public/...` | Website (no login) |
| Uploads | `/api/v1/upload/...` | Photo/file upload |

---

## 🚀 To Start the Backend

```bash
# 1. Start server in development mode (auto-reloads on file save)
npm run start:dev

# 2. Open Swagger UI in browser (try all APIs interactively)
http://localhost:3000/api/docs

# 3. When you have a real database (Neon.tech):
npx prisma migrate dev --name init
npm run prisma:seed
```

---

## 📌 Files You'll Touch Most Often

| File | When you'd edit it |
|---|---|
| `.env` | Adding real API keys (Razorpay, MSG91, etc.) |
| `prisma/schema.prisma` | Adding new DB fields or tables |
| `src/*/dto/*.dto.ts` | Changing what data Flutter sends to an endpoint |
| `src/*/*.service.ts` | Changing business logic |
| `src/*/*.controller.ts` | Adding new API routes |
