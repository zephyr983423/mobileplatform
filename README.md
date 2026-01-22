# Mobile Phone After-Sales Service Platform

A comprehensive full-stack web application for managing mobile phone repairs, built with Next.js 14, PostgreSQL, and Prisma.

## 🎯 Features

### Three-Role System

#### 👨‍💼 BOSS (Administrator)
- View all information in the system (customers, phones, service cases, logistics, audit logs)
- Create and manage staff and customer accounts
- Assign granular permissions to staff members
- Freeze/disable user accounts
- View comprehensive audit logs
- Global search and filtering across all cases

#### 👷 STAFF (Service Personnel)
- Create, update, and view service cases (based on assigned permissions)
- Update repair status and service round information
- Manage logistics and tracking information
- Enter warehouse inbound/outbound records
- Permission-based access to specific operations

#### 👤 CUSTOMER
- View personal devices and their repair status
- Track real-time repair progress with status timeline
- View complete service history across all cases
- Access logistics tracking information
- Ownership-based data isolation for security

### Core Capabilities

- **Multi-Device Support**: Customers can own and track multiple devices
- **Service Case Management**: Each device can have multiple repair cases over time
- **Rework Handling**: Support for multiple service rounds per case (e.g., if customer returns device)
- **Status Timeline**: Detailed tracking of status transitions with timestamps and operator info
- **Logistics Integration**: Inbound/outbound shipment tracking with carrier information
- **Audit Logging**: Complete audit trail of all important actions
- **Role-Based Access Control (RBAC)**: Fine-grained permission system for staff
- **Secure Authentication**: NextAuth with credential-based login

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14 (App Router) + TypeScript |
| **Database** | PostgreSQL 16 |
| **ORM** | Prisma |
| **Authentication** | NextAuth.js |
| **UI Components** | shadcn/ui (Radix UI) |
| **Styling** | Tailwind CSS |
| **Validation** | Zod |
| **Password Hashing** | bcryptjs |
| **Deployment** | Vercel-ready (local dev with Docker Compose) |

---

## 📁 Project Structure

```
mobile-aftersales/
├── app/                          # Next.js 14 App Router
│   ├── (auth)/login/            # Authentication pages
│   ├── (customer)/me/           # Customer dashboard & device views
│   ├── (staff)/staff/           # Staff dashboard & case management
│   ├── (boss)/admin/            # Boss dashboard & admin functions
│   └── api/                     # API route handlers
│       ├── auth/[...nextauth]/  # NextAuth endpoints
│       ├── me/                  # Customer APIs
│       ├── staff/               # Staff APIs
│       └── admin/               # Boss/admin APIs
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── customer/                # Customer-specific components
│   ├── staff/                   # Staff-specific components
│   └── admin/                   # Admin-specific components
├── lib/
│   ├── auth/                    # Authentication & authorization
│   ├── db.ts                    # Prisma client
│   ├── audit.ts                 # Audit logging utilities
│   ├── api-response.ts          # API response helpers
│   └── validations.ts           # Zod schemas
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── seed.ts                  # Sample data seeding
├── types/                       # TypeScript type definitions
├── middleware.ts                # Route protection middleware
└── docker-compose.yml           # Local PostgreSQL setup
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm/yarn/pnpm
- **Docker** & Docker Compose (for local PostgreSQL)
- **Git**

### 1. Clone the Repository

```bash
git clone <repository-url>
cd mobile-aftersales
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set Up Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and set your values:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mobile_aftersales"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-secret-key"  # Use: openssl rand -base64 32
NODE_ENV="development"
```

### 4. Start PostgreSQL Database

```bash
docker-compose up -d
```

Verify the database is running:

```bash
docker-compose ps
```

### 5. Set Up Database Schema

```bash
# Generate Prisma Client
npm run db:generate

# Run migrations to create database tables
npm run db:migrate

# Seed the database with sample data
npm run db:seed
```

### 6. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

---

## 🔐 Default Accounts (After Seeding)

| Role | Username | Password | Description |
|------|----------|----------|-------------|
| BOSS | `boss` | `password123` | Full administrative access |
| STAFF | `staff1` | `password123` | Warehouse & repair staff with full case permissions |
| STAFF | `staff2` | `password123` | Logistics staff with limited permissions |
| CUSTOMER | `customer1` | `password123` | Customer with 2 devices (iPhone 14 Pro, Galaxy S23) |
| CUSTOMER | `customer2` | `password123` | Customer with 1 device (iPhone 13) |

---

## 📊 Database Schema Overview

### Core Models

#### User
- Stores authentication credentials
- Links to Customer profile (for CUSTOMER role)
- Supports BOSS, STAFF, CUSTOMER roles

#### Customer
- Extended profile for CUSTOMER users
- Contains contact info and address

#### StaffPermission
- Assigns fine-grained permissions to STAFF users
- Permissions: `CASE_READ_ALL`, `CASE_WRITE`, `DEVICE_READ`, `SHIPMENT_WRITE`, etc.

#### Device
- Represents a mobile phone owned by a customer
- Tracks brand, model, IMEI, color, storage

#### ServiceCase
- A repair request for a device
- Has unique case number (e.g., `CS20240115001`)
- Contains one or more ServiceRounds

#### ServiceRound
- Represents a single repair attempt (supports rework)
- Tracks issue, diagnosis, resolution, cost, warranty
- Has a status: `PENDING`, `RECEIVED`, `DIAGNOSING`, `REPAIRING`, `QA`, `READY_TO_SHIP`, `SHIPPING`, `DELIVERED`, `CLOSED`, etc.

#### StatusEvent
- Audit trail of status transitions
- Records who changed the status, when, and where

#### Shipment
- Tracks inbound/outbound logistics
- Contains tracking number, carrier, current location

#### AuditLog
- System-wide audit logging
- Tracks user actions, IP addresses, timestamps

### Relationships

```
User (1) ──< (N) Customer
User (1) ──< (N) StaffPermission
Customer (1) ──< (N) Device
Device (1) ──< (N) ServiceCase
ServiceCase (1) ──< (N) ServiceRound
ServiceRound (1) ──< (N) StatusEvent
ServiceRound (1) ──< (N) Shipment
User (1) ──< (N) AuditLog
```

---

## 🔒 Authorization & Permissions

### Authorization Levels

1. **Role-Based**: Users have one of three roles (BOSS, STAFF, CUSTOMER)
2. **Permission-Based**: STAFF users have specific permissions assigned by BOSS
3. **Data-Scope**: CUSTOMER users can only access their own data (filtered by `customerId`)

### Permission Examples

| Permission | Description |
|------------|-------------|
| `CASE_READ_ALL` | View all service cases |
| `CASE_READ_ASSIGNED` | View only assigned cases |
| `CASE_WRITE` | Create/update service cases |
| `CASE_DELETE` | Delete service cases |
| `DEVICE_READ` | View device information |
| `DEVICE_WRITE` | Create/update devices |
| `SHIPMENT_READ` | View shipment info |
| `SHIPMENT_WRITE` | Create/update shipments |
| `USER_MANAGE` | Create/manage users |
| `AUDIT_READ` | View audit logs |

### Authorization Example

```typescript
import { authorize } from "@/lib/auth/authorize";
import { Permission } from "@prisma/client";

// In API route
await authorize(session.user, Permission.CASE_WRITE);

// For CUSTOMER routes - automatically filters by customerId
const devices = await prisma.device.findMany({
  where: {
    customerId: session.user.customerId, // CRITICAL: ownership check
  },
});
```

---

## 🎨 UI Components

Using **shadcn/ui** for consistent, accessible components:

- `Button`, `Input`, `Label`, `Textarea`
- `Card`, `Badge`, `Separator`
- `Select`, `Dialog`, `Toast`
- `Table` (for data lists)
- Custom timeline component for status history

### Install Additional Components

```bash
npx shadcn-ui@latest add button card input label
npx shadcn-ui@latest add select dialog toast table
```

---

## 📡 API Routes

### Customer APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/me/overview` | Get all customer's devices with latest status |
| GET | `/api/me/devices/[id]` | Get device detail with full service history |

### Staff APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/staff/cases` | List service cases (permission-based) |
| POST | `/api/staff/cases` | Create new service case |
| GET | `/api/staff/cases/[id]` | Get case details |
| PATCH | `/api/staff/rounds/[id]` | Update service round details |
| POST | `/api/staff/rounds/[id]/status` | Update status (creates StatusEvent) |
| GET | `/api/staff/shipments` | List shipments |
| POST | `/api/staff/shipments` | Create shipment |
| PATCH | `/api/staff/shipments/[id]` | Update shipment |

### Boss/Admin APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users |
| POST | `/api/admin/users` | Create new user (staff/customer) |
| GET | `/api/admin/users/[id]` | Get user details |
| PATCH | `/api/admin/users/[id]` | Update user |
| POST | `/api/admin/users/[id]/permissions` | Assign permissions to staff |
| GET | `/api/admin/users/[id]/permissions` | Get staff permissions |
| GET | `/api/admin/cases` | Global case search (all cases) |
| GET | `/api/admin/audit` | View audit logs |

### API Response Format

All APIs return a consistent JSON structure:

```typescript
// Success
{
  "success": true,
  "data": { ... }
}

// Error
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": { ... }  // Optional validation errors
  }
}
```

---

## 🧪 Development Workflow

### Run in Development Mode

```bash
npm run dev
```

### Database Management

```bash
# Open Prisma Studio (visual database editor)
npm run db:studio

# Create a new migration
npm run db:migrate

# Reset database (WARNING: deletes all data)
npm run db:reset

# Re-seed database
npm run db:seed
```

### Code Quality

```bash
# Lint code
npm run lint

# Type checking
npx tsc --noEmit
```

---

## 🚢 Deployment

### Deploy to Vercel

1. **Push to GitHub**

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Set Environment Variables** in Vercel Dashboard:
   - `DATABASE_URL` (use a cloud PostgreSQL like Supabase, Neon, or Vercel Postgres)
   - `NEXTAUTH_URL` (your production URL)
   - `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)

4. **Run Database Migrations** (one-time):

```bash
# From local with production DATABASE_URL
npx prisma migrate deploy
npx prisma db seed  # Optional: seed production data
```

5. **Deploy**
   - Vercel will automatically deploy on push to main branch

### Database Options for Production

- **Vercel Postgres** (recommended for Vercel deployments)
- **Supabase** (free tier available)
- **Neon** (serverless PostgreSQL)
- **Railway** or **Render** (full PostgreSQL instances)

---

## 🔍 Key Features Explained

### 1. Multi-Round Service Cases (Rework Support)

A single service case can have multiple rounds. Example:
- **Round 1**: Battery replaced, device returned to customer
- **Round 2**: Customer unhappy, device returned, charging port also replaced

Each round has its own:
- Issue description
- Diagnosis & resolution
- Cost & warranty
- Status timeline

### 2. Status Timeline

Every status change is recorded:
- **From**: Previous status
- **To**: New status
- **When**: Timestamp
- **Who**: Operator username
- **Where**: Location (e.g., "Repair Desk 3", "Main Warehouse")
- **Notes**: Additional context

Displayed as a visual timeline on customer and staff pages.

### 3. Ownership-Based Security

Customer APIs **always** filter by `customerId`:

```typescript
// CRITICAL: This prevents customers from accessing others' data
where: {
  customerId: session.user.customerId
}
```

### 4. Audit Logging

All important actions are logged:
- User creation/updates
- Permission assignments
- Case creation/updates
- Status changes

Logs include:
- User ID
- Action type
- Resource type & ID
- Before/after details
- IP address & user agent (optional)
- Timestamp

---

## 🎓 Learning Resources

### Next.js 14
- [Next.js Documentation](https://nextjs.org/docs)
- [App Router Guide](https://nextjs.org/docs/app)

### Prisma
- [Prisma Docs](https://www.prisma.io/docs)
- [Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)

### NextAuth.js
- [NextAuth Documentation](https://next-auth.js.org)
- [Credentials Provider](https://next-auth.js.org/providers/credentials)

### shadcn/ui
- [Component Library](https://ui.shadcn.com)
- [Installation Guide](https://ui.shadcn.com/docs/installation/next)

---

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart database
docker-compose restart

# View logs
docker-compose logs postgres
```

### Migration Errors

```bash
# Reset and re-migrate
npm run db:reset

# Or manually
npx prisma migrate reset --force
npx prisma migrate dev
```

### Port Already in Use

```bash
# Kill process on port 3000
npx kill-port 3000

# Or change port in package.json
"dev": "next dev -p 3001"
```

### NextAuth Session Issues

- Clear browser cookies
- Verify `NEXTAUTH_URL` and `NEXTAUTH_SECRET` in `.env.local`
- Restart dev server

---

## 📝 TODO / Future Enhancements

- [ ] **Search & Filters**: Advanced search by IMEI, case number, customer name
- [ ] **Export to CSV**: Boss can export case reports
- [ ] **Email Notifications**: Notify customers of status changes
- [ ] **SMS Integration**: Send tracking updates via SMS
- [ ] **Multi-Store Support**: Support for multiple repair centers
- [ ] **Real-time Updates**: WebSocket support for live status updates
- [ ] **File Uploads**: Attach photos of device damage/repair
- [ ] **Customer Portal**: Self-service case creation for customers
- [ ] **Mobile App**: React Native companion app
- [ ] **Analytics Dashboard**: Charts and reports for BOSS

---

## 📄 License

This project is provided as-is for educational and commercial use.

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Database ORM by [Prisma](https://www.prisma.io)
- Authentication by [NextAuth.js](https://next-auth.js.org)

---

## 📧 Support

For questions or issues:
1. Check the [Troubleshooting](#-troubleshooting) section
2. Review the database schema and API documentation above
3. Consult official documentation for the tech stack

---

**Happy Coding! 🚀**
