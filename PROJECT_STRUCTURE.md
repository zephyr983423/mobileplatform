# Project Folder Structure

```
mobile-aftersales/
├── app/                          # Next.js 14 App Router
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx          # Login page
│   ├── (customer)/
│   │   └── me/
│   │       ├── page.tsx          # Customer: My devices overview
│   │       └── devices/
│   │           └── [id]/
│   │               └── page.tsx  # Customer: Device detail & history
│   ├── (staff)/
│   │   └── staff/
│   │       ├── dashboard/
│   │       │   └── page.tsx      # Staff dashboard
│   │       ├── cases/
│   │       │   ├── page.tsx      # Staff: Case list
│   │       │   ├── new/
│   │       │   │   └── page.tsx  # Staff: Create case
│   │       │   └── [id]/
│   │       │       └── page.tsx  # Staff: Case detail & update
│   │       └── shipments/
│   │           └── page.tsx      # Staff: Shipment management
│   ├── (boss)/
│   │   └── admin/
│   │       ├── dashboard/
│   │       │   └── page.tsx      # Boss dashboard
│   │       ├── users/
│   │       │   ├── page.tsx      # Boss: User management
│   │       │   └── new/
│   │       │       └── page.tsx  # Boss: Create user
│   │       ├── permissions/
│   │       │   └── page.tsx      # Boss: Permission assignment
│   │       ├── cases/
│   │       │   └── page.tsx      # Boss: All cases (global search)
│   │       └── audit/
│   │           └── page.tsx      # Boss: Audit logs
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts      # NextAuth handler
│   │   ├── me/
│   │   │   ├── overview/
│   │   │   │   └── route.ts      # GET customer overview
│   │   │   └── devices/
│   │   │       └── [id]/
│   │   │           └── route.ts  # GET device detail
│   │   ├── staff/
│   │   │   ├── cases/
│   │   │   │   ├── route.ts      # GET list, POST create
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts  # GET/PATCH/DELETE case
│   │   │   ├── rounds/
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts  # PATCH round
│   │   │   │       └── status/
│   │   │   │           └── route.ts # POST status update
│   │   │   └── shipments/
│   │   │       ├── route.ts      # GET/POST shipments
│   │   │       └── [id]/
│   │   │           └── route.ts  # PATCH shipment
│   │   └── admin/
│   │       ├── users/
│   │       │   ├── route.ts      # GET/POST users
│   │       │   └── [id]/
│   │       │       ├── route.ts  # GET/PATCH/DELETE user
│   │       │       └── permissions/
│   │       │           └── route.ts # POST assign permissions
│   │       ├── cases/
│   │       │   └── route.ts      # GET all cases (global)
│   │       └── audit/
│   │           └── route.ts      # GET audit logs
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page (redirect)
├── components/
│   ├── ui/                       # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   ├── toast.tsx
│   │   └── ...
│   ├── auth/
│   │   └── login-form.tsx        # Login form component
│   ├── customer/
│   │   ├── device-card.tsx       # Device summary card
│   │   └── status-timeline.tsx   # Status history timeline
│   ├── staff/
│   │   ├── case-form.tsx         # Create/edit case form
│   │   ├── status-update-form.tsx
│   │   └── shipment-form.tsx
│   ├── admin/
│   │   ├── user-form.tsx
│   │   └── permission-selector.tsx
│   └── shared/
│       ├── navbar.tsx
│       ├── sidebar.tsx
│       └── data-table.tsx        # Reusable table component
├── lib/
│   ├── auth/
│   │   ├── config.ts             # NextAuth configuration
│   │   ├── authorize.ts          # Authorization helpers
│   │   └── session.ts            # Session helpers
│   ├── db.ts                     # Prisma client
│   ├── audit.ts                  # Audit logging
│   ├── api-response.ts           # API response helpers
│   ├── validations.ts            # Zod schemas
│   └── utils.ts                  # Utility functions
├── prisma/
│   ├── schema.prisma             # Database schema
│   ├── seed.ts                   # Seed script
│   └── migrations/               # Database migrations
├── types/
│   ├── next-auth.d.ts            # NextAuth type extensions
│   └── index.ts                  # Shared types
├── middleware.ts                 # Next.js middleware (auth)
├── .env.example
├── .env.local
├── docker-compose.yml            # Local PostgreSQL
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```
