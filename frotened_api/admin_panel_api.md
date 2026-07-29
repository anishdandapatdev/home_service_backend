# 🖥️ Admin Panel — API Reference
> For React/Web Developer | All endpoints the Admin Panel will call

**Base URL (Local):** `http://localhost:3000/api/v1`
**Base URL (Production):** `https://your-app.railway.app/api/v1`

**Auth Header (required for all admin routes):**
```
Authorization: Bearer <access_token>
```

> All routes in this doc require `ADMIN` role. Regular customers/technicians are blocked.

---

## 1. 🔐 Admin Login

### 1.1 Login
```
POST /auth/admin/login
```
**No auth required**

**Request Body:**
```json
{
  "email": "admin@homemaintenance.com",
  "password": "AdminPassword123!"
}
```
**Response:**
```json
{
  "admin": {
    "id": "uuid",
    "name": "Super Admin",
    "email": "admin@homemaintenance.com",
    "role": "ADMIN"
  },
  "access_token": "eyJhbGci...",
  "refresh_token": "eyJhbGci...",
  "expires_in": 900
}
```

---

## 2. 📊 Dashboard

### 2.1 Real-time KPI Metrics
```
GET /admin/dashboard
```
**Auth required**

**Response:**
```json
{
  "active_members": 142,
  "requests_today": 18,
  "open_complaints": 3,
  "online_technicians": 7
}
```
> Use this to build the dashboard cards — refresh every 30 seconds.

---

## 3. 👥 Customer Management

### 3.1 List All Customers
```
GET /admin/customers
```
**Auth required**

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Rahul Sharma",
    "phone": "9876543210",
    "email": "rahul@gmail.com",
    "is_active": true,
    "created_at": "2026-07-29T...",
    "memberships": [
      { "status": "ACTIVE", "plan": { "name": "Complete Home & RO", "price": 699 } }
    ],
    "addresses": [ { "city": "Haldia", "pincode": "721602" } ]
  }
]
```

---

## 4. 🔧 Technician Management

### 4.1 List All Technicians
```
GET /admin/technicians
```
**Auth required**

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Rajesh Kumar",
    "phone": "9876543210",
    "kyc_status": "VERIFIED",
    "skills": ["ELECTRICAL", "FAN", "AC"],
    "service_area": ["721602", "Haldia"],
    "is_active": true,
    "ratings": [ { "stars": 5 }, { "stars": 4 } ]
  }
]
```

---

### 4.2 Onboard New Technician
```
POST /admin/technicians
```
**Auth required**

**Request Body:**
```json
{
  "phone": "9876543299",
  "name": "Ramesh Sen",
  "skills": ["PLUMBING", "PUMP"],
  "service_area": ["721602", "721657"],
  "password": "TechPassword123!"
}
```
**Response:** Created technician object

---

### 4.3 Approve / Reject Technician KYC
```
PATCH /admin/technicians/:technicianId/verify
```
**Auth required**

**Request Body:**
```json
{ "kyc_status": "VERIFIED" }
```
> Values: `VERIFIED` | `REJECTED`
> ⚠️ Only VERIFIED technicians can be assigned to jobs (Rule #5 from spec).

---

## 5. 📋 Service Request Management

### 5.1 View Full Request Queue
```
GET /admin/service-requests
```
**Auth required**

**Response:**
```json
[
  {
    "id": "uuid",
    "category": "AC",
    "description": "AC not cooling",
    "is_emergency": true,
    "status": "RAISED",
    "created_at": "2026-07-29T...",
    "user": { "name": "Rahul Sharma", "phone": "9876543210" },
    "technician": null,
    "membership": { "plan": { "name": "VIP Ultra Protection Plan" } }
  }
]
```
> Sort by `is_emergency: true` first for priority dispatch.

---

### 5.2 Assign / Reassign Technician to a Request
```
PATCH /admin/service-requests/:requestId/assign
```
**Auth required**

**Request Body:**
```json
{ "technician_id": "technician-uuid" }
```
**Response:** Updated service request with technician details

---

## 6. 💬 Complaints Management

### 6.1 View Complaint Queue
```
GET /admin/complaints
```
**Auth required**

**Query Params (optional):**
```
?status=OPEN        → filter by status
?status=IN_PROGRESS
?status=RESOLVED
```

**Response:**
```json
[
  {
    "id": "uuid",
    "subject": "Technician arrived late",
    "description": "...",
    "status": "OPEN",
    "created_at": "...",
    "user": { "name": "Rahul Sharma", "phone": "9876543210" },
    "service_request": { "category": "FAN" }
  }
]
```

---

### 6.2 Resolve a Complaint
```
PATCH /admin/complaints/:complaintId
```
**Auth required**

**Request Body:**
```json
{
  "status": "RESOLVED",
  "resolution_notes": "Apologized to customer and credited 200 bonus reward points."
}
```
> Status values: `OPEN` | `IN_PROGRESS` | `RESOLVED` | `CLOSED`

---

## 7. 📋 Membership Plans

### 7.1 Create a New Plan
```
POST /admin/plans
```
**Auth required**

**Request Body:**
```json
{
  "tier_code": "TIER_8",
  "name": "Business Property Shield",
  "price": 1499,
  "coverage_rules": {
    "categories": ["ELECTRICAL", "PLUMBING", "AC", "FAN", "PUMP", "GEYSER", "RO", "OTHER"],
    "annual_visits": 99,
    "emergency_priority": true,
    "labour_covered": true
  },
  "is_active": true
}
```

### 7.2 Update Plan Pricing / Coverage
```
PATCH /admin/plans/:planId
```
**Auth required**

**Request Body (any field to update):**
```json
{
  "price": 1299,
  "is_active": false
}
```

---

## 8. 🎁 Reward Catalog Management

### 8.1 Add Partner Voucher to Catalog
```
POST /admin/rewards/catalog
```
**Auth required**

**Request Body:**
```json
{
  "title": "Free AC Filter Replacement",
  "description": "Redeem 1000 points for a free genuine AC air filter.",
  "points_required": 1000,
  "partner_name": "Daikin India",
  "is_active": true
}
```

---

## 9. 📊 Reports

### 9.1 Service Requests Report
```
GET /admin/reports/requests
```
**Auth required**

**Response:**
```json
{
  "total": 156,
  "completed": 120,
  "in_progress": 14,
  "cancelled": 22
}
```

---

### 9.2 Active Members Report
```
GET /admin/reports/members
```
**Auth required**

**Response:**
```json
{
  "total_subscriptions": 200,
  "active": 142,
  "expired": 58
}
```

---

### 9.3 Technician Performance Report
```
GET /admin/reports/technician-performance
```
**Auth required**

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Rajesh Kumar",
    "phone": "9876543210",
    "completed_jobs": 48,
    "avg_rating": 4.8
  },
  {
    "id": "uuid2",
    "name": "Amitabh Roy",
    "completed_jobs": 36,
    "avg_rating": 4.5
  }
]
```

---

## 10. 📩 Leads (from Website)

### 10.1 View Website Lead Captures
```
GET /admin/leads
```
**Auth required**

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Siddharth Roy",
    "phone": "9876543299",
    "email": "sid@example.com",
    "message": "Interested in Tier 4 plan for 2 BHK in Haldia",
    "source": "WEBSITE",
    "status": "NEW",
    "created_at": "2026-07-29T..."
  }
]
```

---

## 💡 JavaScript / Axios Setup for React Admin Panel

```javascript
// api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://your-app.railway.app/api/v1',
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Admin login
export const adminLogin = async (email, password) => {
  const res = await api.post('/auth/admin/login', { email, password });
  localStorage.setItem('admin_token', res.data.access_token);
  return res.data;
};

// Dashboard metrics
export const getDashboard = () => api.get('/admin/dashboard');

// Customers
export const getCustomers = () => api.get('/admin/customers');

// Technicians
export const getTechnicians = () => api.get('/admin/technicians');
export const onboardTechnician = (data) => api.post('/admin/technicians', data);
export const verifyTechKyc = (id, status) =>
  api.patch(`/admin/technicians/${id}/verify`, { kyc_status: status });

// Service Requests
export const getRequests = () => api.get('/admin/service-requests');
export const assignTechnician = (requestId, techId) =>
  api.patch(`/admin/service-requests/${requestId}/assign`, { technician_id: techId });

// Complaints
export const getComplaints = (status) =>
  api.get('/admin/complaints', { params: status ? { status } : {} });
export const resolveComplaint = (id, data) =>
  api.patch(`/admin/complaints/${id}`, data);

// Reports
export const getRequestsReport = () => api.get('/admin/reports/requests');
export const getMembersReport = () => api.get('/admin/reports/members');
export const getTechPerformance = () => api.get('/admin/reports/technician-performance');
```
