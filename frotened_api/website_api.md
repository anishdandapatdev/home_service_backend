# 🌐 Public Website — API Reference
> For Web Developer (React/Next.js/HTML) | No login required for any of these endpoints

**Base URL (Local):** `http://localhost:3000/api/v1`
**Base URL (Production):** `https://your-app.railway.app/api/v1`

> ✅ All endpoints on this page are **public** — no Authorization header needed.

---

## 1. 🛠️ Service Catalog

### 1.1 Get All Service Categories
```
GET /public/services
```

**Response:**
```json
[
  {
    "category": "ELECTRICAL",
    "name": "Electrical Repairs & Wiring",
    "description": "Switches, MCB, DB boxes, lighting, short circuit fixes"
  },
  {
    "category": "PLUMBING",
    "name": "Plumbing & Pipework",
    "description": "Taps, leakages, flush tanks, pipe fittings, drain unclogging"
  },
  {
    "category": "AC",
    "name": "Air Conditioner Servicing",
    "description": "Filter cleaning, gas refill check, cooling issues, jet service"
  },
  {
    "category": "RO",
    "name": "RO & Water Purifier Care",
    "description": "Filter replacement, membrane check, TDS adjustment, leakage fix"
  },
  {
    "category": "PUMP",
    "name": "Submersible & Water Pump",
    "description": "Motor inspection, capacitor replace, pressure check, wiring"
  },
  {
    "category": "GEYSER",
    "name": "Geyser & Water Heater",
    "description": "Thermostat, coil replacement, safety valve, winter readiness"
  },
  {
    "category": "FAN",
    "name": "Ceiling & Exhaust Fans",
    "description": "Capacitor, regulator, winding repair, noise & wobble fix"
  },
  {
    "category": "OTHER",
    "name": "Custom Home General Maintenance",
    "description": "General handyman inspection, minor hardware installation"
  }
]
```
> Use this data to build your "Our Services" section on the website.

---

## 2. 💳 Membership Plans (Pricing Page)

### 2.1 Get All 7 Pricing Plans
```
GET /public/plans
```

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
      "labour_covered": true,
      "inspection_included": true
    },
    "is_active": true
  },
  {
    "id": "uuid2",
    "tier_code": "TIER_7",
    "name": "VIP Ultra Protection Plan (24/7 Priority Emergency)",
    "price": 999,
    "coverage_rules": {
      "categories": ["ELECTRICAL", "PLUMBING", "FAN", "PUMP", "GEYSER", "RO", "AC", "OTHER"],
      "annual_visits": 99,
      "emergency_priority": true,
      "labour_covered": true,
      "inspection_included": true
    },
    "is_active": true
  }
]
```
> Use this to build your pricing table / comparison section on the website.

---

## 3. 🎁 Rewards Program Info (About Page Section)

### 3.1 Get Rewards Program Details
```
GET /public/rewards-info
```

**Response:**
```json
{
  "title": "No-Waste Home Maintenance Rewards Program",
  "description": "Every month you do not raise a service request, earn 100 reward points. Redeem points for genuine spare parts, free RO filter replacements, or e-vouchers.",
  "rules": [
    "Earn 100 points for every unused monthly benefit cycle.",
    "Earn 200 bonus points upon timely annual plan renewal.",
    "Points never expire as long as your membership subscription remains active."
  ]
}
```

---

## 4. 📍 Service Coverage Area

### 4.1 Get Coverage Cities and Pincodes
```
GET /public/service-area
```

**Response:**
```json
{
  "launch_city": "Haldia",
  "covered_pincodes": ["721602", "721607", "721631", "721657"],
  "covered_areas": [
    "Durgachak",
    "Sutahata",
    "Haldia Town",
    "Basudevpur",
    "Free Trade Zone"
  ],
  "expansion_roadmap": ["Kharagpur", "Midnapore", "Howrah"]
}
```
> Show this on a map or as a badge list on the website.

---

## 5. 📩 Lead Capture Form (Contact / Callback Page)

### 5.1 Submit Lead / Callback Request
```
POST /public/leads
```

**Request Body:**
```json
{
  "name": "Siddharth Roy",
  "phone": "9876543299",
  "email": "siddharth@example.com",
  "message": "Interested in the Tier 4 plan for my 2 BHK apartment in Haldia.",
  "source": "WEBSITE_CONTACT_PAGE"
}
```

> `email` and `message` are optional. `phone` and `name` are required.

**Response:**
```json
{
  "id": "uuid",
  "name": "Siddharth Roy",
  "phone": "9876543299",
  "status": "NEW",
  "created_at": "2026-07-29T..."
}
```
> The lead is saved in the database and appears in the Admin Panel under `/admin/leads`.

---

## 6. 🛒 View Reward Catalog (Optional — for website rewards info page)

### 6.1 Get Available Vouchers
```
GET /rewards/catalog
```

**Response:**
```json
[
  {
    "id": "uuid",
    "title": "₹200 Off Next Spare Part Invoice",
    "description": "Redeem 500 points for ₹200 discount on billable spare parts.",
    "points_required": 500,
    "partner_name": "Home Maintenance Platform",
    "is_active": true
  },
  {
    "id": "uuid2",
    "title": "₹500 Flipkart Gift Card",
    "description": "Redeem 1200 points for an e-gift voucher.",
    "points_required": 1200,
    "partner_name": "Flipkart Rewards",
    "is_active": true
  }
]
```

---

## 💡 Plain HTML / JavaScript Example

For a simple website (no framework), you can use `fetch()`:

```html
<!-- Services Section -->
<div id="services"></div>

<script>
const BASE_URL = 'https://your-app.railway.app/api/v1';

// Load service catalog
fetch(`${BASE_URL}/public/services`)
  .then(res => res.json())
  .then(services => {
    const container = document.getElementById('services');
    services.forEach(service => {
      container.innerHTML += `
        <div class="service-card">
          <h3>${service.name}</h3>
          <p>${service.description}</p>
        </div>
      `;
    });
  });

// Load pricing plans
fetch(`${BASE_URL}/public/plans`)
  .then(res => res.json())
  .then(plans => {
    plans.forEach(plan => {
      console.log(`${plan.name} - ₹${plan.price}/year`);
    });
  });

// Submit lead capture form
function submitLead(event) {
  event.preventDefault();
  const data = {
    name: document.getElementById('name').value,
    phone: document.getElementById('phone').value,
    message: document.getElementById('message').value,
    source: 'WEBSITE_HERO_FORM',
  };

  fetch(`${BASE_URL}/public/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
    .then(res => res.json())
    .then(() => alert('Thank you! We will call you back shortly.'))
    .catch(() => alert('Something went wrong. Please try again.'));
}
</script>
```

---

## 💡 React / Next.js Example

```javascript
// lib/api.js (website-only public API)
const BASE_URL = 'https://your-app.railway.app/api/v1';

export const getServices = async () => {
  const res = await fetch(`${BASE_URL}/public/services`);
  return res.json();
};

export const getPlans = async () => {
  const res = await fetch(`${BASE_URL}/public/plans`);
  return res.json();
};

export const getServiceArea = async () => {
  const res = await fetch(`${BASE_URL}/public/service-area`);
  return res.json();
};

export const submitLead = async (formData) => {
  const res = await fetch(`${BASE_URL}/public/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...formData, source: 'WEBSITE' }),
  });
  return res.json();
};

// In a Next.js page (SSG/SSR for SEO)
export async function getStaticProps() {
  const [services, plans] = await Promise.all([getServices(), getPlans()]);
  return { props: { services, plans }, revalidate: 3600 }; // Refresh every 1 hour
}
```
