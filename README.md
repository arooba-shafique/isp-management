# NetLink ISP Management Portal

A full-stack ISP management web application for **NetLink ISP (Sahiwal, Pakistan)** serving 200+ customers. Features separate admin and customer portals with password-based authentication.

## Features

### Admin Portal
- Dashboard with charts (package distribution, expiring soon, overdue)
- Customer management with bulk CSV import
- Package CRUD operations
- Subscription management
- Payment verification (approve/reject with admin notes)
- Complaint triage
- Bulk announcements with zone filtering

### Customer Portal
- View subscription status
- Browse and subscribe to packages
- Submit payment proofs
- File complaints/support tickets

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, Tailwind CSS, shadcn/ui, wouter router |
| Backend | Express 5, Node.js |
| Database | PostgreSQL, Drizzle ORM |
| Validation | Zod |
| Auth | JWT (Bearer tokens), bcrypt password hashing |
| Charts | Recharts |

## Project Structure

```
isp-management/
├── artifacts/
│   ├── api-server/        # Express API server
│   │   └── src/routes/    # API route handlers
│   └── isp-portal/        # React frontend
│       └── src/pages/     # Customer & admin pages
├── lib/
│   ├── db/                # Drizzle ORM schema definitions
│   ├── api-spec/          # OpenAPI spec
│   └── api-client-react/  # Auto-generated React Query hooks
├── scripts/
└── package.json
```

## Getting Started

### Prerequisites
- Node.js 24+
- pnpm
- PostgreSQL

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/arooba-shafique/isp-management.git
   cd isp-management
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   DATABASE_URL=your_postgres_connection_string
   SESSION_SECRET=your_jwt_signing_key
   ```

4. Push database schema:
   ```bash
   pnpm --filter @workspace/db run push
   ```

5. Run the development server:
   ```bash
   pnpm --filter @workspace/api-server run dev
   ```

## Live Demo

[isp-management-api-server.vercel.app](https://isp-management-api-server.vercel.app)
