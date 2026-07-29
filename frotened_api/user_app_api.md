# 📱 Customer App — API Reference
> For Flutter Developer | All endpoints your Customer App will call

**Base URL (Local):** `http://localhost:3000/api/v1`
**Base URL (Production):** `https://your-app.railway.app/api/v1`

**Auth Header (required for all protected routes):**
```
Authorization: Bearer <access_token>
```

---

## 1. 🔐 Authentication

### 1.1 Send OTP
```
POST /auth/otp/send
```
**No auth required**

**Request Body:**
```json
{
  "phone": "9876543210"
}
```
**Response:**
```json
{
  "message": "OTP sent successfully",
  "phone": "9876543210",
  "expires_in_seconds": 300,
  "dev_otp": "123456"
}
```
> `dev_otp` only appears in development mode. In production, OTP is sent via SMS.

---

### 1.2 Verify OTP → Get Token
```
POST /auth/otp/verify
```
**No auth required**

**Request Body:**
```json
{
  "phone": "9876543210",
  "otp": "123456",
  "name": "Rahul Sharma"
}
```
**Response:**
```json
{
  "user": {
    "id": "uuid-here",
    "phone": "9876543210",
    "name": "Rahul Sharma",
    "email": null,
    "role": "CUSTOMER"
  },
  "access_token": "eyJhbGci...",
  "refresh_token": "eyJhbGci...",
  "expires_in": 900
}
```
> 💾 Save `access_token` and `refresh_token` in Flutter `SharedPreferences`

---

### 1.3 Refresh Token
```
POST /auth/refresh
```
**No auth required**

**Request Body:**
```json
{
  "refresh_token": "eyJhbGci..."
}
```
**Response:** Same as Verify OTP response (new access + refresh tokens)

---

### 1.4 Logout
```
POST /auth/logout
```
**Auth required**

**Response:**
```json
{ "message": "Logged out successfully" }
```

---

## 2. 👤 User Profile

### 2.1 Get My Profile
```
GET /users/me
```
**Auth required**

**Response:**
```json
{
  "id": "uuid",
  "phone": "9876543210",
  "name": "Rahul Sharma",
  "email": "rahul@example.com",
  "role": "CUSTOMER",
  "is_active": true,
  "addresses": [ ... ],
  "memberships": [ { "plan": { "name": "...", "price": 499 } } ]
}
```

---

### 2.2 Update Profile
```
PATCH /users/me
```
**Auth required**

**Request Body:**
```json
{
  "name": "Rahul Kumar",
  "email": "rahul@gmail.com"
}
```

---

### 2.3 Add Address
```
POST /users/me/addresses
```
**Auth required**

**Request Body:**
```json
{
  "label": "Home",
  "line1": "Flat 402, Green Valley Apartments",
  "line2": "Near City Centre",
  "city": "Haldia",
  "state": "West Bengal",
  "pincode": "721602",
  "lat": 22.0667,
  "lng": 88.0667,
  "is_default": true
}
```

---

### 2.4 Update Address
```
PATCH /users/me/addresses/:addressId
```

### 2.5 Delete Address
```
DELETE /users/me/addresses/:addressId
```

---

## 3. 📋 Membership Plans

### 3.1 View All Plans (7 tiers)
```
GET /plans
```
**No auth required**

**Response:**
```json
[
  {
    "id": "uuid",
    "tier_code": "TIER_1",
    "name": "Essential Electrical & Fan Plan",
    "price": 399,
    "coverage_rules": {
      "categories": ["ELECTRICAL", "FAN"],
      "annual_visits": 6,
      "emergency_priority": false,
      "labour_covered": true
    },
    "is_active": true
  },
  ...
]
```

### 3.2 View Single Plan
```
GET /plans/:planId
```
**No auth required**

---

## 4. 🏠 My Membership

### 4.1 Check Membership Status
```
GET /memberships/me
```
**Auth required**

**Response (Active):**
```json
{
  "active": true,
  "membership": {
    "id": "uuid",
    "status": "ACTIVE",
    "start_date": "2026-07-29T00:00:00Z",
    "end_date": "2027-07-29T00:00:00Z",
    "renewal_date": "2027-07-29T00:00:00Z",
    "plan": { "name": "Complete Home & RO Pure Care", "price": 699 },
    "inspections": [ { "scheduled_date": "2026-08-01", "status": "SCHEDULED" } ]
  }
}
```
**Response (No membership):**
```json
{ "active": false, "message": "No active membership subscription found" }
```

---

### 4.2 Buy a Membership Plan

**Step 1 — Create Razorpay Order:**
```
POST /memberships/purchase
```
**Auth required**

**Request Body:**
```json
{ "plan_id": "plan-uuid-or-tier-code-TIER_4" }
```
**Response:**
```json
{
  "order": {
    "payment_id": "uuid",
    "razorpay_order_id": "order_1234567890",
    "amount": 69900,
    "currency": "INR",
    "key_id": "rzp_test_..."
  },
  "plan": { "name": "Complete Home & RO Pure Care", "price": 699 }
}
```

**Step 2 — Open Razorpay SDK in Flutter using `razorpay_flutter` package**

**Step 3 — Confirm Payment:**
```
POST /memberships/purchase/confirm
```
**Request Body:**
```json
{
  "payment_id": "uuid-from-step-1",
  "razorpay_order_id": "order_1234567890",
  "razorpay_payment_id": "pay_29384729384",
  "razorpay_signature": "abc123..."
}
```
**Response:**
```json
{
  "membership": { "id": "uuid", "status": "ACTIVE", ... },
  "message": "Membership activated successfully! Preventive inspection auto-scheduled within 3 days."
}
```

---

### 4.3 Renew Membership
```
POST /memberships/:membershipId/renew
```
**Auth required** → Returns Razorpay order (same as purchase flow)

---

## 5. 🔧 Service Requests

### 5.1 Raise a Repair Request
```
POST /service-requests
```
**Auth required**

**Request Body:**
```json
{
  "category": "ELECTRICAL",
  "description": "Ceiling fan making loud noise in bedroom",
  "requested_time_window": "Tomorrow 10:00 AM - 1:00 PM",
  "is_emergency": false
}
```
**Categories:** `ELECTRICAL` | `PLUMBING` | `AC` | `RO` | `PUMP` | `GEYSER` | `FAN` | `OTHER`

**Response:**
```json
{
  "id": "uuid",
  "status": "ASSIGNED",
  "category": "ELECTRICAL",
  "is_emergency": false,
  "technician": { "name": "Rajesh Kumar", "phone": "9876543210" }
}
```

---

### 5.2 My Request History
```
GET /service-requests
```
**Auth required**

---

### 5.3 Track a Request
```
GET /service-requests/:requestId
```
**Auth required**

**Response includes:** status, technician info, spare parts, invoice, rating

---

### 5.4 Cancel a Request
```
PATCH /service-requests/:requestId/cancel
```
**Auth required**

---

### 5.5 Rate the Technician (after job)
```
POST /service-requests/:requestId/rate
```
**Auth required**

**Request Body:**
```json
{
  "stars": 5,
  "comment": "Excellent quick service! Punctual technician."
}
```

---

## 6. 🔩 Spare Parts Approval

### 6.1 View Proposed Spare Parts
```
GET /service-requests/:requestId/spare-parts
```
**Auth required**

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Ceiling Fan Capacitor 2.5μF",
    "cost": 180,
    "quantity": 1,
    "approval_status": "PENDING"
  }
]
```

### 6.2 Approve or Reject a Spare Part
```
PATCH /service-requests/:requestId/spare-parts/:partId/approve
```
**Auth required**

**Request Body:**
```json
{ "approval_status": "APPROVED" }
```
> Values: `APPROVED` or `REJECTED`

---

## 7. 🧾 Invoice

### 7.1 Get Invoice for a Completed Job
```
GET /invoices/service-request/:requestId
```
**Auth required**

**Response:**
```json
{
  "id": "uuid",
  "labour_cost": 0,
  "parts_total": 180,
  "tax": 32.4,
  "grand_total": 212.4,
  "pdf_url": "https://s3.amazonaws.com/invoices/INV-xxx.pdf"
}
```
> Labour is always ₹0 for active members — only approved spare parts are billed.

---

## 8. 💳 Payments

### 8.1 Payment History
```
GET /payments/history
```
**Auth required**

**Response:**
```json
[
  {
    "id": "uuid",
    "amount": 699,
    "reference_type": "MEMBERSHIP",
    "status": "SUCCESS",
    "created_at": "2026-07-29T..."
  }
]
```

---

## 9. 🎁 Rewards

### 9.1 My Points Balance
```
GET /rewards/me
```
**Auth required**

**Response:**
```json
{
  "total_points": 450,
  "ledger_history": [
    { "points": 100, "reason": "UNUSED_CYCLE", "created_at": "..." },
    { "points": 200, "reason": "TIMELY_RENEWAL", "created_at": "..." }
  ]
}
```

### 9.2 View Reward Catalog
```
GET /rewards/catalog
```
**No auth required**

### 9.3 Redeem Points
```
POST /rewards/redeem
```
**Auth required**

**Request Body:**
```json
{ "catalog_item_id": "uuid" }
```
**Response:**
```json
{
  "message": "Successfully redeemed voucher: ₹200 Off Next Spare Part Invoice",
  "voucher_code": "VOUCHER-1722249600-4321",
  "points_deducted": 500,
  "remaining_balance": 0
}
```

---

## 10. 📣 Complaints

### 10.1 Raise a Complaint
```
POST /complaints
```
**Auth required**

**Request Body:**
```json
{
  "service_request_id": "uuid (optional)",
  "subject": "Technician arrived late",
  "description": "Technician came 1 hour late without notice."
}
```

### 10.2 My Complaint History
```
GET /complaints/me
```
**Auth required**

---

## 11. 🔍 Inspection

### 11.1 View My Inspection Report
```
GET /inspections/membership/:membershipId
```
**Auth required**

**Response:**
```json
{
  "id": "uuid",
  "scheduled_date": "2026-08-01T00:00:00Z",
  "status": "SCHEDULED",
  "report_notes": null,
  "photo_urls": [],
  "technician": { "name": "Rajesh Kumar" }
}
```

---

## 💡 Flutter Code Snippet (Dio Setup)

```dart
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String baseUrl = 'https://your-app.railway.app/api/v1';
  final Dio _dio = Dio(BaseOptions(baseUrl: baseUrl));

  ApiService() {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString('access_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
    ));
  }

  // Send OTP
  Future<Map> sendOtp(String phone) async {
    final res = await _dio.post('/auth/otp/send', data: {'phone': phone});
    return res.data;
  }

  // Verify OTP
  Future<Map> verifyOtp(String phone, String otp, {String? name}) async {
    final res = await _dio.post('/auth/otp/verify',
        data: {'phone': phone, 'otp': otp, 'name': name});
    // Save token
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('access_token', res.data['access_token']);
    await prefs.setString('refresh_token', res.data['refresh_token']);
    return res.data;
  }

  // Get Plans
  Future<List> getPlans() async {
    final res = await _dio.get('/plans');
    return res.data;
  }

  // Get My Membership
  Future<Map> getMyMembership() async {
    final res = await _dio.get('/memberships/me');
    return res.data;
  }

  // Raise Service Request
  Future<Map> raiseRequest(String category, String description) async {
    final res = await _dio.post('/service-requests', data: {
      'category': category,
      'description': description,
    });
    return res.data;
  }
}
```
