# BMS Services — AI Automation Website

A production-ready, full-stack website built with Next.js 14, featuring a 3D animated landing page, client authentication dashboard with real-time analytics, automations showcase, and calendar booking system.

---

## Tech Stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Styling:** Tailwind CSS + Framer Motion
- **3D:** React Three Fiber + Three.js
- **Auth:** NextAuth.js (email + password)
- **Database:** Prisma + SQLite
- **Charts:** Recharts

---

## Prerequisites

Install these before proceeding:

1. **Node.js 18+** — https://nodejs.org/en/download
   - Download the Windows Installer (.msi) — LTS version recommended
   - Run the installer and restart your terminal after

2. **Git** (optional) — https://git-scm.com/download/win

---

## Quick Start

Open **PowerShell** or **Command Prompt** and run these commands:

```bash
# Navigate to the project
cd C:\Users\singa\Desktop\bms-services

# Install dependencies
npm install

# Set up the database
npx prisma generate
npx prisma migrate dev --name init

# Start the development server
npm run dev
```

Then open your browser to: **http://localhost:3000**

---

## First-Run Walkthrough

1. **Landing Page** — Visit http://localhost:3000 to see the full landing page with 3D microchip animation and particle effects

2. **Create an Account** — Click "Book a Demo" or go to http://localhost:3000/signup

3. **Load Demo Analytics** — After signing up and logging in, click the **"Load Demo Data"** button on the dashboard (or visit http://localhost:3000/api/seed via POST — easiest using the dashboard button)

4. **Explore the Dashboard** — View charts, stat cards, insights, and activity feed

5. **Browse Automations** — http://localhost:3000/automations — click any card to see full details

6. **Book a Demo** — http://localhost:3000/booking — full 3-step calendar booking flow

---

## Project Structure

```
bms-services/
├── prisma/
│   └── schema.prisma          # Database schema (SQLite)
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── page.tsx           # Landing page
│   │   ├── (auth)/            # Login + Signup
│   │   ├── (dashboard)/       # Protected client dashboard
│   │   ├── automations/       # Public automations page
│   │   ├── booking/           # Public booking page
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   ├── ui/                # Reusable primitives
│   │   ├── layout/            # Navbar, Footer, Sidebar
│   │   ├── landing/           # Landing page sections
│   │   ├── three/             # 3D microchip (React Three Fiber)
│   │   ├── dashboard/         # Analytics charts + stat cards
│   │   ├── automations/       # Automation cards + modal
│   │   └── booking/           # Calendar + booking form
│   ├── lib/                   # Utilities, auth config, constants
│   ├── hooks/                 # Custom React hooks
│   ├── providers/             # React context providers
│   └── types/                 # TypeScript types
├── .env                       # Environment variables
└── package.json
```

---

## Environment Variables

Defined in `.env` (already configured for local development):

```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="bms-services-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

**For production**, change `NEXTAUTH_SECRET` to a long random string and update `NEXTAUTH_URL` to your domain.

---

## API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/[...nextauth]` | ANY | — | NextAuth handler |
| `/api/register` | POST | None | Create user account |
| `/api/analytics` | GET | Required | Dashboard analytics data |
| `/api/booking` | GET | None | Available time slots for a date |
| `/api/booking` | POST | None | Create a booking |
| `/api/seed` | POST | Required | Seed 30 days mock analytics (dev only) |

---

## Production Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
```

> **Note:** For production, switch from SQLite to PostgreSQL by updating the Prisma provider and `DATABASE_URL`.

---

## Database Commands

```bash
# View database in browser UI
npx prisma studio

# Reset database (careful — deletes all data)
npx prisma migrate reset

# Push schema changes without migration file
npx prisma db push
```

---

## Customisation

- **Brand colours** — Edit `tailwind.config.ts` (look for `bms-cyan`, `bms-purple`, `bms-dark`)
- **Automations content** — Edit `src/lib/constants.ts` (`AUTOMATIONS` array)
- **Company copy** — Edit landing page components in `src/components/landing/`
- **Time slots** — Edit `TIME_SLOTS` in `src/lib/constants.ts`
- **Email notifications** — Replace console.log in `/api/booking/route.ts` with Resend (https://resend.com)
