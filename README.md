# 🚚 Bublix Shipping — Project

> **Full-Stack Logistics Management Platform**

## 📁 Project Structure

```
bublixshipping/
├── backend/          ← Node.js + Express.js + PostgreSQL API
├── website/          ← Next.js Public Website (port 3000)
├── admin/            ← Next.js Admin Dashboard (port 3001)
└── srd.txt           ← System Requirements Document
```

---

## 🚀 Quick Start

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your PostgreSQL credentials

npm install
npm run seed          # Creates tables + seed data
npm run dev           # Starts on http://localhost:5000
```

**Default Admin:**
- Email: `admin@bublixshipping.com`
- Password: `Admin@123456`

### 2. Public Website

```bash
cd website
cp .env.local.example .env.local
npm run dev           # Starts on http://localhost:3000
```

### 3. Admin Dashboard

```bash
cd admin
cp .env.local.example .env.local
npm install
npm run dev           # Starts on http://localhost:3001
```

---

## 📡 API Endpoints

Base URL: `http://localhost:5000/api/v1`

| Group | Endpoints |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` |
| Users | `GET/POST /users`, `GET/PATCH /users/:id` |
| Hubs | `GET/POST /hubs`, `GET/PATCH /hubs/:id`, `GET /hubs/:id/shipments` |
| Locations | `GET /locations/countries`, `GET /locations/countries/:id/cities` |
| Customers | `GET/POST /customers`, `GET/PATCH /customers/:id`, `POST /customers/:id/merchant` |
| Shipments | `GET/POST /shipments`, `GET /shipments/:id`, `POST /shipments/:id/events`, `POST /shipments/:id/cancel` |
| Tracking | `GET /tracking/:trackingNumber` (public) |
| Pricing | `GET /pricing/services`, `POST /pricing/quote`, `GET/POST /pricing/rules`, `GET/POST /pricing/currencies` |
| Finance | `GET/POST /finance/invoices`, `GET/POST /finance/payments`, `POST /finance/payments/:id/verify` |
| COD | `GET/POST /finance/cod`, `POST /finance/cod/:id/settle` |
| Reports | `GET /reports/dashboard`, `GET /reports/shipments`, `GET /reports/revenue`, `GET /reports/branches` |

---

## 🗄️ Database Tables

| Module | Tables |
|---|---|
| Organization | Organizations |
| Locations | Countries, Cities, Hubs |
| Auth | Users, Roles, Permissions, RolePermissions, UserRoles, RefreshTokens |
| Audit | AuditLogs |
| Customers | Customers, CustomerAddresses, MerchantProfiles |
| Pricing | ShippingServices, PricingRules, CurrencyRates |
| Shipments | Shipments, ShipmentItems, ShipmentEvents, ShipmentAssignments, ShipmentCharges, DeliveryProofs |
| Finance | Invoices, Payments, PaymentAllocations, CODCollections |

---

## 🔐 Roles

| Role | Access |
|---|---|
| SUPER_ADMIN | Full system |
| ADMIN | General administration |
| BRANCH_MANAGER | Branch management |
| STAFF | Shipping operations |
| ACCOUNTANT | Financial records |
| DRIVER | Delivery tasks |
| MERCHANT | Business customer |
| CUSTOMER | Track own shipments |

---

## 📦 Shipment Tracking Number Format

```
BBLX-XXXXXX
```

## 📊 Shipment Status Flow

```
CREATED → PICKED_UP → AT_ORIGIN_HUB → IN_TRANSIT → AT_DESTINATION_HUB
       ↘ CUSTOMS_CLEARANCE ↗                    ↓
                                        OUT_FOR_DELIVERY
                                       ↙           ↘
                                 DELIVERED    DELIVERY_FAILED
                                                    ↓
                                              RETURNED / ON_HOLD
```

---

## 🌍 Currencies Supported
- USD (US Dollar)
- UGX (Ugandan Shilling)
- SDG (Sudanese Pound)
- AED (UAE Dirham)

## 📄 Shipping Documents
- Waybill
- Shipping Label (Code128 barcode)
- Commercial Invoice
- Payment Receipt
- Delivery Receipt
- Account Statement

---

## 🏗️ Implementation Phases

| Phase | Status |
|---|---|
| Phase 1: Foundation (Auth, DB, Backend) | ✅ Complete |
| Phase 2: APIs (Users, Customers, Finance, Reports) | ✅ Complete |
| Phase 3: Next.js Website + Admin Dashboard | ✅ Complete |
| Phase 4: Documents (PDF Waybill, Labels) | 🔜 Next |
| Phase 5: Notifications (Email/WhatsApp/SMS) | 🔜 Next |
| Phase 6: Testing + Production Deploy | 🔜 Next |
