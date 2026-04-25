# Memoirs: Digital Yearbook Platform

Memoirs is a full-stack digital yearbook platform built with Next.js, designed to help graduating classes capture, share, and preserve memories. It provides a structured system for collecting student profiles, managing users, and generating a complete yearbook experience—both interactive and exportable.

Instead of treating a yearbook as a static artifact, Memoirs models it as a dynamic system. Users contribute structured data, media, and responses, while administrators control schema, access, and content. This results in a flexible and extensible platform that adapts to different institutions and use cases.

![Memoirs Demo](./image.png)

## Features

Memoirs provides a comprehensive set of features for building and managing a digital yearbook:

* User authentication with role-based access (Admin / User)
* Dynamic profile system powered by configurable questions
* Memory wall for sharing posts and media
* Admin panel for managing users, questions, and imports
* CSV-based bulk user import
* Profile completion tracking
* Secure password policies with lockout and reset flows
* PDF export of the full yearbook
* Clean, responsive UI with reusable components

All data flows through structured APIs, ensuring consistency between the frontend and backend.

## Architecture

```
memoirs/
├── app/                 # Next.js App Router (pages + API routes)
│   ├── (app)/           # Authenticated application routes
│   ├── api/             # Backend API endpoints
│   └── login/           # Public auth pages
├── components/          # Reusable UI and feature components
├── lib/                 # Core utilities (DB, validation, helpers)
├── prisma/              # Database schema and migrations
├── public/              # Static assets (fonts, images)
├── types/               # TypeScript type definitions
├── auth.ts              # Authentication logic (NextAuth)
├── middleware.ts        # Route protection and access control
└── package.json         # Dependencies and scripts
```

The system is structured around Next.js App Router, combining frontend pages and backend APIs in a single unified framework. Prisma is used for database access, while NextAuth handles authentication and session management.

## Core Components

Memoirs revolves around a few key systems:

**Authentication System**

* Credential-based login
* JWT-backed sessions
* Role-based authorization
* Forced password reset and account lock handling

**Dynamic Question Engine**

* Admin-defined profile fields
* Multiple input types (text, select, media, etc.)
* Ordered and validated schema
* Extensible configuration per field

**User Management**

* Create, search, and manage users
* Bulk import via CSV
* Password reset workflows
* Role assignment (ADMIN / USER)

**Content Systems**

* Profile builder (structured responses)
* Memory wall (shared posts)
* Yearbook directory view
* PDF export pipeline

## How It Works

1. Users authenticate via the login system
2. The app fetches dynamic questions defined by admins
3. Users fill out structured profile data
4. Data is stored via API routes using Prisma
5. Admins manage users, schema, and imports
6. The system aggregates data into:

   * Profiles
   * Yearbook directory
   * Memory wall
   * Exportable PDF

All interactions go through typed API endpoints, ensuring consistent validation and state.

## Quick Start

Install dependencies:

```bash
npm install
```

Set up environment variables:

```env
# Database
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"

# Auth
AUTH_SECRET="your-random-secret"
NEXTAUTH_URL="http://localhost:3000"

# Sanity CMS
SANITY_PROJECT_ID="your-project-id"
SANITY_DATASET="production"
SANITY_API_TOKEN="your-sanity-api-token"

NEXT_PUBLIC_SANITY_PROJECT_ID="your-project-id"
NEXT_PUBLIC_SANITY_DATASET="production"

# Seed Admin User
SEED_ADMIN_FIRSTNAME="Admin"
SEED_ADMIN_LASTNAME="User"
SEED_ADMIN_QUOTE="quote"
SEED_ADMIN_EMAIL="admin@example.com"
SEED_ADMIN_PASSWORD="secure-password"

# App Config
NEXT_PUBLIC_GRADUATION_DATE="2026-06-15T10:00:00+05:30"
NEXT_PUBLIC_SUPPORT_EMAIL="support@example.com"
```

Run database setup:

```bash
npx prisma db push
npm run build
```

Start development server:

```bash
npm run dev
```

Open:

```
http://localhost:3000
```

## Design Principles

Memoirs is built around a few key ideas:

* **Structured over freeform** — Data is schema-driven, not arbitrary
* **Admin-controlled flexibility** — Questions define the system dynamically
* **Single source of truth** — APIs mediate all data access
* **Separation of concerns** — UI, logic, and data layers are clearly divided
* **Predictable behavior** — Validation and typing reduce runtime errors

These constraints make the system scalable and maintainable as features grow.

## Limitations

* No sandboxing for admin actions (full control over data)
* Sequential workflows (no multi-step orchestration)
* PDF generation may be resource-intensive for large datasets
* Relies on correct schema configuration for optimal UX

## Future Work

Potential improvements include:

* Real-time collaboration and updates
* Better media handling and optimization
* Advanced search and filtering in yearbook
* Role-based customization of views
* Improved PDF layout and theming
* Analytics and engagement tracking

## Contributing

Contributions are welcome. Fork the repository, make your changes, and open a pull request.

Keep changes focused, well-structured, and aligned with the system’s design principles to maintain clarity and reliability.
