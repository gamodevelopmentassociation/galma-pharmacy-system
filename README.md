# Galma Pharmacy & Healthcare Management System

A modern, full-stack pharmacy management and Point of Sale (POS) application built with **Next.js 14**, **Prisma ORM**, **Neon PostgreSQL**, **Tailwind CSS v4**, and **TypeScript**.

---

## Key Features

- **Point of Sale (POS)**
  - Fast barcode and keyword search (brand name, generic name, SKU).
  - FIFO automated batch allocation (dispenses earliest-expiring stock first).
  - Automated tax calculations, discounts, and multiple payment methods (Cash, Card, Mobile Money, Credit).
  - Printable receipt generator and instant invoice records.

- **Inventory & Batch Tracking**
  - Granular batch management with expiry date tracking.
  - Expiry status indicators (Active, Near Expiry < 60 days, Urgent < 30 days, Expired).
  - Low-stock reorder level monitoring and stock adjustment logging (damage, returns, corrections).

- **Financial Analytics & Reporting**
  - Consolidated revenue, Cost of Goods Sold (COGS), gross margin, and profit metrics.
  - Filterable sales trends by date range, cashier, and payment method.
  - Interactive financial charts powered by Recharts.

- **Staff & Role-Based Access Control**
  - Built-in roles: **ADMIN**, **PHARMACIST**, and **CASHIER**.
  - Secure JWT session authentication stored in HTTP-only cookies.
  - Comprehensive audit logs tracking logins, inventory edits, sales, and settings changes.

---

## Tech Stack

- **Framework**: Next.js 14 (App Router, Server Actions)
- **Database**: PostgreSQL (Neon Serverless PostgreSQL)
- **ORM**: Prisma ORM 5
- **Styling**: Tailwind CSS v4, Lucide Icons, Sonner Notifications
- **Charts**: Recharts

---

## Getting Started

### 1. Prerequisites
- Node.js 18+ (Node 20+ recommended)
- npm, pnpm, or yarn

### 2. Environment Configuration
Create a `.env` file in the root directory (based on `.env.example`):

```env
# Neon PostgreSQL Connection Strings
DATABASE_URL="postgresql://[user]:[password]@[ep-host]-pooler.[region].aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://[user]:[password]@[ep-host].[region].aws.neon.tech/neondb?sslmode=require"

# Authentication Secrets
JWT_SECRET="your-secure-jwt-secret"
AUTH_SECRET="your-secure-auth-secret"

# App URL & Environment
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="production"

# Initial Admin Credentials (for seed)
ADMIN_EMAIL="admin@galmapharmacy.com"
ADMIN_PASSWORD="admin123456"
```

### 3. Database Migration & Seeding

Synchronize your schema with Neon PostgreSQL and seed initial data:

```bash
# Push schema to Neon
npm run db:push

# Seed default administrator & medication catalog
npm run db:seed
```

### 4. Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Default Credentials
- **Email**: `admin@galmapharmacy.com`
- **Password**: `admin123456` *(Change after first login in Settings)*

---

## Production Build & Deployment

To generate a production build:

```bash
npm run build
npm start
```

### Deploying to Vercel
1. Push this repository to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. Add the environment variables (`DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `AUTH_SECRET`, `NODE_ENV=production`).
4. Build command will automatically run `prisma generate && next build`.

---

## License
Proprietary - Galma Pharmacy & Healthcare. All rights reserved.
