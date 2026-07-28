# AGENTS.md — AI Agent Guidance & Project Context

> **Project Name:** Next.js Event Registration & Data Management System
> **Repository Scope:** Full-stack Progressive Web App (PWA) with offline-first data entry, administrative analytics, and Vercel deployment.

---

## 1. Project Overview

This project is a production-ready **Event Registration and Data Management System** designed to provide a reliable experience in both **online and offline environments**.

The system is optimized for high-volume event registration and data entry, with a focus on:

* Offline-first registration workflows
* Reliable local data persistence
* Automatic synchronization when connectivity returns
* Administrative dashboards and analytics
* CSV data export
* Progressive Web App (PWA) capabilities
* PostgreSQL-based persistent storage
* Server-side data mutations using Next.js Server Actions
* Vercel-based production deployment

The application must prioritize **data reliability, fast data entry, and resilience to unstable network connections**.

---

## 2. Technology Stack

| Category                 | Technology               |
| ------------------------ | ------------------------ |
| Framework                | Next.js 16               |
| Architecture             | App Router               |
| Bundler                  | Turbopack                |
| Backend Mutations        | Server Actions           |
| Language                 | TypeScript (Strict Mode) |
| Database                 | PostgreSQL               |
| ORM                      | Prisma ORM               |
| Prisma Client            | `/generated/prisma`      |
| Styling                  | Tailwind CSS             |
| UI Components            | shadcn/ui                |
| Icons                    | Lucide Icons             |
| Notifications            | Sonner                   |
| PWA                      | `@ducanh2912/next-pwa`   |
| Offline Storage          | IndexedDB                |
| IndexedDB Wrapper        | Dexie                    |
| Reactive IndexedDB Hooks | dexie-react-hooks        |
| Hosting                  | Vercel                   |
| Managed PostgreSQL       | Neon          |

---

# 3. Core Architecture Rules

## A. Offline-First Data Entry

Offline-first behavior is a core requirement of this application.

### Rule 1: Never Block Data Entry When Offline

Users must be able to continue entering registration data even when the network connection is unavailable.

Data-entry forms must use **Dexie / IndexedDB as the immediate local write target** when operating offline.

The user should not have to wait for the server before continuing with the next registration.

---

### Rule 2: Online Submission

When the application is online:

1. The user submits the form.
2. The application sends the data to the server.
3. Server Actions or API routes process the request.
4. Prisma persists the data in PostgreSQL.
5. The UI displays success or error feedback using Sonner.

Server Actions should be preferred for standard server-side mutations.

Primary location:

```text
app/actions/
```

---

### Rule 3: Offline Submission

When the application is offline:

1. The user submits the form.
2. The record is immediately stored in IndexedDB using Dexie.
3. A local temporary ID is assigned.
4. The record is marked with:

```ts
synced: false
```

5. The form is reset immediately so the user can continue entering additional records.
6. The record remains in the local pending queue until synchronization succeeds.

Example conceptual record:

```ts
interface PendingRegistration {
  localId: string
  synced: boolean
  createdAt: string
  data: RegistrationPayload
}
```

Do not lose locally stored records because of temporary network failures.

---

### Rule 4: Automatic Synchronization

Pending offline records must automatically synchronize when connectivity is restored.

The synchronization flow should support:

* `window.addEventListener('online')`
* Service Worker background synchronization where supported
* Batch synchronization of pending IndexedDB records
* Retry handling for failed synchronization attempts
* Duplicate prevention
* Updating local records after successful synchronization

The application should drain the pending queue and send records to the server once the connection becomes available.

---

### Rule 5: iOS / WebKit Fallback

Some iOS WebKit environments may not reliably support the Background Sync API.

Therefore, the application must provide a fallback synchronization mechanism.

The `SyncManager` component should attempt synchronization when:

* The application is opened again
* The application returns to the foreground
* The browser reports an online connection
* The user manually triggers synchronization, if such functionality exists

Offline synchronization must not depend exclusively on the Background Sync API.

---

## B. Next.js 16 & Server Actions

All server-side data mutations must follow the project's server-side architecture.

### Server Actions

Server Actions must be located in:

```text
app/actions/
```

Each Server Action responsible for mutations must use:

```ts
'use server'
```

Server Actions may be used for:

* Creating registrations
* Updating registrations
* Deleting registrations
* Synchronizing offline records
* Updating administrative data

---

### Prisma Access Rules

Client Components must **never directly access Prisma**.

Do not perform Prisma queries inside:

```tsx
'use client'
```

components.

Instead, use:

* Server Actions
* Server Components
* API routes

For API-based operations, use:

```text
app/api/
```

Database access must remain on the server.

---

### Prisma Client

The Prisma client must be centralized in:

```text
lib/prisma.ts
```

Use a singleton Prisma Client instance to prevent unnecessary database connections during development and server reloads.

---

# 4. Recommended Directory Structure

The project should follow this general structure:

```text
├── app/
│   ├── actions/
│   │   └── # Next.js Server Actions
│   │
│   ├── admin/
│   │   └── # Admin Dashboard, analytics, filters, exports
│   │
│   ├── api/
│   │   └── # API endpoints, sync routes, cron handlers
│   │
│   ├── components/
│   │   └── # Shared Client and Server Components
│   │
│   ├── manifest.ts
│   │   └── # PWA Web App Manifest
│   │
│   └── layout.tsx
│       └── # Global application shell and PWA setup
│
├── lib/
│   ├── db.ts
│   │   └── # Dexie / IndexedDB configuration
│   │
│   └── prisma.ts
│       └── # Singleton Prisma Client
│
├── prisma/
│   └── schema.prisma
│       └── # Database schema and models
│
├── public/
│   ├── icons/
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   │
│   └── # Static assets
│
├── next.config.ts
│   └── # Next.js and PWA configuration
│
├── package.json
├── tsconfig.json
└── AGENTS.md
```

Agents may introduce additional files and directories when necessary, but new code should follow the architectural boundaries described in this document.

---

# 5. TypeScript & Code Quality Standards

## A. Strict TypeScript

The project uses TypeScript Strict Mode.

All generated or modified code must be strongly typed.

### Do Not Use `any`

Avoid:

```ts
const data: any = ...
```

Instead, define explicit types or interfaces.

Example:

```ts
interface RegistrationPayload {
  name: string
  email: string
  phone?: string
}
```

Types must be explicitly defined for:

* Form payloads
* Server Action inputs
* Server Action responses
* Prisma model responses
* IndexedDB / Dexie records
* API request and response objects
* Sync queue records
* Component props

---

## B. Build Health

The project may use Next.js configuration to bypass certain build-time checks during deployment, but this does **not** remove the responsibility to maintain a clean codebase.

Before committing changes:

* Resolve TypeScript errors
* Resolve ESLint errors where applicable
* Resolve Prisma type errors
* Resolve build errors
* Verify Server Action boundaries
* Verify Client / Server Component boundaries

The following command should succeed locally:

```bash
npm run build
```

---

## C. Avoid Deprecated Configuration

Do not introduce deprecated TypeScript compiler flags or configuration options.

For example, do not add:

```text
--ignoreDeprecations
```

to:

* `tsconfig.json`
* npm scripts
* build commands

Prefer updating the code or configuration to the current supported approach.

---

# 6. UI & UX Standards

The application is designed for fast, reliable data entry.

UI implementations should prioritize:

* Speed
* Clarity
* Accessibility
* Minimal friction
* Responsive layouts
* Keyboard-friendly workflows
* Clear network status
* Clear synchronization status

---

## A. Dark Mode

All UI components should support dark mode where applicable.

Use Tailwind dark-mode utilities consistently.

Examples:

```tsx
dark:bg-zinc-900
dark:border-zinc-800
dark:text-zinc-100
```

Avoid creating components that become unreadable or visually broken in dark mode.

---

## B. Notifications

Use **Sonner** for important user feedback.

Examples:

```ts
toast.success('Registration saved successfully')
```

```ts
toast.error('Failed to synchronize registration')
```

Provide clear feedback for:

* Successful submissions
* Failed submissions
* Online / offline state changes
* Synchronization started
* Synchronization completed
* Synchronization failures
* Retry states

Notifications should be concise and understandable.

---

## C. Network Status

The application should clearly communicate whether the user is:

* Online
* Offline
* Synchronizing
* Synchronized
* Waiting for synchronization
* Experiencing synchronization errors

Users must understand whether their data has been:

1. Saved locally
2. Successfully synchronized
3. Still waiting to synchronize

Never imply that offline data has been permanently saved to the server until synchronization succeeds.

---

## D. Rapid Data Entry

The registration workflow is optimized for event-gate and high-volume data entry.

After a successful local or server submission:

* Reset the form quickly
* Return focus to the primary input when appropriate
* Allow the user to immediately enter the next record
* Avoid unnecessary confirmation dialogs
* Avoid blocking the workflow with unnecessary animations

The interface should feel fast and efficient for repeated data entry.

---

# 7. Data Synchronization Requirements

Any offline synchronization implementation should consider the following:

### Idempotency

The server should prevent duplicate records when the same offline record is synchronized more than once.

Use a stable client-generated identifier where appropriate.

Example:

```ts
interface SyncRecord {
  localId: string
  synced: boolean
  createdAt: string
}
```

The synchronization process should be safe to retry.

---

### Retry Handling

Failed synchronization attempts should not automatically delete local records.

If synchronization fails:

1. Keep the record in IndexedDB.
2. Keep `synced: false`.
3. Record the failure if appropriate.
4. Retry when connectivity is restored.
5. Allow manual retry when appropriate.

---

### Successful Synchronization

After the server confirms successful persistence:

1. Mark the local record as synchronized.
2. Remove it from the pending queue when safe.
3. Update the UI.
4. Notify the user when appropriate.

---

# 8. Development Commands

Agents should validate commands and changes using PowerShell or Bash before committing.

## Install Dependencies

```bash
npm install
```

---

## Update Database Schema

```bash
npx prisma db push
```

---

## Generate Prisma Client

```bash
npx prisma generate
```

---

## Start Development Server

```bash
npm run dev
```

---

## Validate Production Build

```bash
npm run build
```

The production build should pass successfully before changes are pushed to the main branch.

---

# 9. Git & Commit Guidelines

Commits should be scoped, concise, and declarative.

Use conventional commit-style prefixes where appropriate.

Examples:

```text
feat: add Dexie IndexedDB sync manager component
```

```text
fix: adjust Next.js PWA service worker configuration
```

```text
perf: optimize Prisma query for event analytics
```

```text
refactor: simplify offline registration queue
```

```text
fix: prevent duplicate offline registration sync
```

Avoid vague commit messages such as:

```text
update code
```

```text
fix stuff
```

```text
changes
```

Each commit should describe the primary change introduced by that commit.

---

# 10. Agent Workflow

When modifying this repository, agents should follow this workflow:

### Step 1 — Understand the Architecture

Before changing code, identify whether the requested change affects:

* Client Components
* Server Components
* Server Actions
* API routes
* Prisma
* IndexedDB / Dexie
* Service Worker
* PWA configuration
* Admin dashboard
* Offline synchronization

---

### Step 2 — Preserve Existing Architecture

Do not introduce architectural shortcuts that violate the project's rules.

In particular:

* Do not access Prisma directly from Client Components.
* Do not bypass IndexedDB for offline data entry.
* Do not delete unsynchronized local records after a failed sync.
* Do not introduce `any` types.
* Do not remove offline functionality to simplify implementation.
* Do not introduce deprecated TypeScript configuration.
* Do not break dark mode support.

---

### Step 3 — Implement the Smallest Safe Change

Prefer focused changes that solve the requested problem without unnecessarily modifying unrelated parts of the application.

Avoid large refactors unless explicitly requested.

---

### Step 4 — Validate the Change

After implementation, verify:

```bash
npm run build
```

When database-related code changes, also verify:

```bash
npx prisma generate
```

If the schema changes, verify:

```bash
npx prisma db push
```

---

### Step 5 — Review Offline Behavior

For any feature involving registration or data entry, verify both scenarios:

#### Online

```text
User submits
    ↓
Server Action / API
    ↓
PostgreSQL
    ↓
Success feedback
    ↓
Form reset
```

#### Offline

```text
User submits
    ↓
IndexedDB / Dexie
    ↓
synced: false
    ↓
Form reset
    ↓
Connection restored
    ↓
Sync queue processed
    ↓
Server / PostgreSQL
    ↓
Record marked as synced
```

---

# 11. Non-Negotiable Principles

Agents working on this repository must always prioritize:

1. **Data safety over convenience**
2. **Offline-first reliability**
3. **Strong TypeScript typing**
4. **Clear Client / Server boundaries**
5. **Server-side Prisma access only**
6. **Idempotent synchronization**
7. **Fast data-entry workflows**
8. **Clear network and sync feedback**
9. **Clean production builds**
10. **Minimal and focused code changes**

The application must remain reliable under unstable network conditions and should never force users to stop data entry simply because the internet connection is temporarily unavailable.
