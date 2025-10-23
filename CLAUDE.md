# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PurityPath is an addiction recovery web application focused on mental wellness, inspired by Headspace and Calm apps. The app helps users track sobriety streaks, maintain private encrypted journals, achieve milestones, and access panic support features.

## Development Commands

### Running the Application
```bash
npm run dev              # Start development server (port 5050, both client and server)
npm run build            # Build client (Vite) and server (esbuild)
npm start                # Start production server
```

### Database Management
```bash
npm run db:push          # Push schema changes to database using Drizzle Kit
```

### Type Checking
```bash
npm run check            # Run TypeScript compiler type checking
```

## Architecture Overview

### Stack
- **Frontend**: React + TypeScript + Vite + TailwindCSS + shadcn/ui components
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM (supports in-memory fallback via `STORAGE_PROVIDER=memory`)
- **Routing**: Wouter (client-side)
- **State Management**: TanStack Query (React Query)
- **Authentication**: Session-based auth (local dev mode)

### Project Structure

```
├── client/
│   ├── src/
│   │   ├── pages/          # Route pages (Landing, Dashboard, Home)
│   │   ├── components/     # React components (UI and feature components)
│   │   ├── lib/            # Utilities and helpers
│   │   └── hooks/          # Custom React hooks
├── server/
│   ├── index.ts            # Express server entry point
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Database/memory storage abstraction (IStorage interface)
│   ├── localAuth.ts        # Session-based auth for local development
│   ├── crypto.ts           # AES-256-GCM encryption for journal entries
│   ├── csrf.ts             # CSRF protection middleware
│   └── vite.ts             # Vite dev server integration
├── shared/
│   └── schema.ts           # Drizzle schema and Zod validation schemas
└── migrations/             # Database migration files (auto-generated)
```

### Key Architecture Patterns

#### Storage Layer Abstraction
The app uses an `IStorage` interface (`server/storage.ts:19-37`) that abstracts database operations. Two implementations exist:
- `DatabaseStorage`: PostgreSQL via Drizzle ORM
- `MemoryStorage`: In-memory storage for local development without database

Switch between them using `STORAGE_PROVIDER` environment variable (`db` or `memory`).

#### Authentication Flow
- Development uses session-based auth (`server/localAuth.ts`)
- Dev login endpoint: `GET /api/login` creates a default user and sets session
- All protected routes use `isAuthenticated` middleware (`server/localAuth.ts:67`)
- User session structure matches `req.user.claims.sub` pattern for consistency

#### Security Features
1. **Journal Encryption**: AES-256-GCM encryption for all journal content (`server/crypto.ts`)
   - Requires `JOURNAL_ENCRYPTION_KEY` environment variable
   - Encryption/decryption happens transparently in storage layer

2. **CSRF Protection**: Token-based CSRF protection (`server/csrf.ts`)
   - Cookie-based token storage
   - All mutating endpoints protected

#### Database Schema
All tables defined in `shared/schema.ts`:
- `users`: User profiles (required for auth)
- `sessions`: Session storage (required for auth)
- `streaks`: Recovery streak tracking (currentStreak, longestStreak)
- `journalEntries`: Private encrypted journal entries (encrypted content, mood, date)
- `milestones`: Achievement milestones (8 default milestones from 1 day to 365 days)

#### API Routes
All routes require authentication (except auth routes):
- `GET /api/auth/user` - Get current user
- `GET /api/auth/csrf` - Ensure CSRF token is set
- `GET /api/login` - Dev login (creates session)
- `GET /api/logout` - Clear session
- `GET /api/streak` - Get user's streak data
- `PUT /api/streak` - Update streak
- `POST /api/streak/reset` - Reset streak to 0
- `GET /api/journal` - Get all journal entries (decrypted)
- `POST /api/journal` - Create journal entry (auto-encrypted)
- `GET /api/milestones` - Get user milestones

#### Frontend Patterns
- Path aliases: `@/` → `client/src/`, `@shared/` → `shared/`, `@assets/` → `attached_assets/`
- TanStack Query for all API calls (see `client/src/hooks/`)
- shadcn/ui components in `client/src/components/ui/`
- Feature components: `StreakCounter`, `JournalEntry`, `PanicButton`, `ProgressChart`

## Design System

The app follows design guidelines in `design_guidelines.md`:
- **Color Palette**: Calming purple primary (#6B73FF), soft grey-blue secondary, with dark mode support
- **Typography**: Inter (primary), Nunito Sans (secondary)
- **Component Style**: 12px border radius, soft shadows, generous padding (p-6 to p-8)
- **Design Principles**: Encouraging, private, calming, progressive, accessible

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string (required unless using `STORAGE_PROVIDER=memory`)
- `JOURNAL_ENCRYPTION_KEY` - Secret key for journal encryption
- `SESSION_SECRET` - Secret for session signing (defaults to "dev-secret-change-me" in dev)

Optional:
- `NODE_ENV` - `development` or `production` (affects Vite setup and cookie security)
- `PORT` - Server port (defaults to 5050)
- `STORAGE_PROVIDER` - `db` (default) or `memory` (in-memory storage for dev)

## Common Development Patterns

### Adding a New API Endpoint
1. Define the route in `server/routes.ts`
2. Add `isAuthenticated` middleware for protected routes
3. Extract `userId` from `req.user.claims.sub`
4. Use `storage.*` methods to interact with data
5. Add CSRF protection middleware if needed (already global)

### Adding a New Database Table
1. Define table schema in `shared/schema.ts` using Drizzle pg-core
2. Create Zod validation schema with `createInsertSchema`
3. Export TypeScript types
4. Add corresponding methods to `IStorage` interface in `server/storage.ts`
5. Implement in both `DatabaseStorage` and `MemoryStorage` classes
6. Run `npm run db:push` to update database

### Working with Encrypted Data
- Journal entries are automatically encrypted/decrypted by storage layer
- Encryption key must be set in `JOURNAL_ENCRYPTION_KEY` env var
- Failed decryption returns `[ENCRYPTED DATA - DECRYPTION FAILED]` instead of throwing
