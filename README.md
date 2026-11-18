# JARVIS — Personal AI Assistant
## Phase 1: Foundation, Architecture & Environment Setup

JARVIS is a private, single-user personal productivity and AI management web application engineered with a clean modular monolithic architecture, strict TypeScript validation, secure credentials-based authentication, and a futuristic dark interface.

---

## 1. Architecture & Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router, Server Components & Route Handlers)
- **UI Library**: React 19
- **Type Safety**: TypeScript 5.7+ (strict mode enabled)
- **Styling**: Tailwind CSS with custom JARVIS design system palette
- **Icons**: Lucide React
- **Notifications**: Custom React Context Toast & Real-Time Popover

### Backend & Business Logic
- **Server Framework**: Next.js 15 Route Handlers & Server Actions
- **Data Validation**: Zod
- **Hashing**: bcryptjs (12 salt rounds)
- **Authentication**: Auth.js (NextAuth v5 beta) with private Credentials provider & JWT sessions

### Database & Storage
- **Database Engine**: PostgreSQL 16
- **Containerization**: Docker Compose (`docker-compose.yml`)
- **ORM**: Prisma 6 with complete relational schema & UUID keys
- **Storage Foundation**: `LocalStorageProvider` abstraction in `data/uploads/` with path traversal defense & UUID hashing

---

## 2. Directory Hierarchy

```text
c:\Users\webez\Desktop\JARVIS - CK
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── tasks/page.tsx
│   │   │   ├── social/page.tsx
│   │   │   ├── reminders/page.tsx
│   │   │   ├── meetings/page.tsx
│   │   │   ├── notes/page.tsx
│   │   │   ├── files/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── user/password/route.ts
│   │   │   └── notifications/route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/          (Button, Card, Input, Label, Badge, Avatar, Toast, Spinner)
│   │   ├── layout/      (Sidebar, Header, UserNav, NotificationsPopover)
│   │   └── shared/      (EmptyState, StatCard, LoadingCard, PageHeader)
│   ├── modules/         (Tasks, Social, Reminders, Meetings, Notes, Files)
│   ├── lib/
│   │   ├── auth/        (Auth.js configuration, callbacks, session helpers)
│   │   ├── prisma/      (Singleton Prisma client)
│   │   ├── validations/ (Zod schemas for login and passwords)
│   │   ├── notifications/ (INotificationService interface & db implementation)
│   │   ├── storage/     (IStorageProvider interface & LocalStorageProvider)
│   │   └── utils/       (cn, formatters)
│   ├── hooks/           (useToast, useSidebar)
│   ├── types/           (Global types & NextAuth module augmentation)
│   └── config/          (Navigation, branding, site parameters)
├── prisma/
│   ├── schema.prisma    (17 complete models with UUID keys & indices)
│   └── migrations/      (Initial database migration)
├── data/
│   ├── uploads/         (Private file repository, outside public/)
│   └── backups/
├── scripts/
│   ├── seed.mjs         (Administrator bootstrap script)
│   └── start-local-db.ps1
├── docker-compose.yml   (PostgreSQL container configuration)
├── .env.example         (Template with placeholder secrets)
├── .env.local           (Active environment variables)
└── package.json
```

---

## 3. Database Schema Overview

The database foundation in `prisma/schema.prisma` implements UUID primary keys, timestamp tracking (`createdAt`, `updatedAt`), strict foreign key relations, and indexes:

1. **User**: Administrator credentials and relations.
2. **UserSettings**: UI and notification preferences.
3. **Project**: Grouping for tasks.
4. **TaskCategory**: Categories for tasks.
5. **Task**: Priority, status, due dates, relation to projects/categories.
6. **Reminder**: Timed alerts and status.
7. **Meeting & MeetingAttendee**: Schedules, URLs, attendees.
8. **SocialAccount & SocialPost & SocialMediaAsset**: Connected accounts, scheduled drafts, and assets.
9. **Note, NoteTag & NoteTagOnNote**: Markdown knowledge base and many-to-many tag relations.
10. **Folder & StoredFile**: Hierarchical directory structure and stored file metadata.
11. **Notification**: In-app alerts, unread counts, and deep links.

---

## 4. Setup and Installation

### Prerequisites
- Node.js LTS (v20+ or v22+)
- Docker Compose OR Local PostgreSQL 16
- npm

### Step 1: Clone and Configure Environment
Copy `.env.example` to `.env.local` and `.env`:
```bash
cp .env.example .env.local
cp .env.example .env
```
Ensure `AUTH_SECRET` and `DATABASE_URL` are configured.

### Step 2: Start PostgreSQL

**Option A (Using Docker Compose):**
```bash
docker compose up -d
```

**Option B (Using Local Standalone PostgreSQL):**
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-local-db.ps1
```

### Step 3: Run Database Migrations
```bash
npx prisma migrate dev
```

### Step 4: Start Development Server and Complete First-Time Setup
```bash
npm run dev
```
1. Open [http://localhost:3000](http://localhost:3000) in your browser.
2. The system automatically redirects to the first-time setup wizard (`/setup`).
3. Set your preferred administrator email (e.g. `ck@jarvis.local`), name, and secure passphrase.
4. Once created, the setup route permanently locks, external registration is disabled, and only your configured administrator account has access.

---

## 5. Security & Private Access Guarantees

- **No Public Signup**: There is zero registration endpoint. The application is strictly single-user.
- **Password Protection**: Passwords are saved only as bcrypt hashes with 12 salt rounds.
- **Protected Routes**: Next.js Edge Middleware and server-side `requireAuth()` guards prevent unauthenticated access to `/dashboard` and all sub-routes.
- **Localhost Binding**: The dev server binds explicitly to `localhost` (`-H localhost -p 3000`).
- **File Storage Sandbox**: Files stored by `LocalStorageProvider` are kept outside `public/` in `data/uploads/` with path normalization and validation to eliminate directory traversal attacks.

---

## 6. Verification Commands

```bash
# Verify TypeScript types
npx tsc --noEmit

# Lint check
npm run lint

# Production build verification
npm run build
```
