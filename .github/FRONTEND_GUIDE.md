# Frontend Guide

**Location:** `content-catalyst/`
**Dev server:** `npm run dev` → `http://localhost:8080`
**Framework:** React 18 + TypeScript + Vite

---

## Pages

| Page | Route | File | Status |
|------|-------|------|--------|
| Login | `/login` | `src/pages/LoginPage.tsx` | Live — connects to `/api/auth` |
| Dashboard | `/` | `src/pages/Dashboard.tsx` | Mockup — no live data |
| Trends | `/trends` | `src/pages/TrendsPage.tsx` | **Live** — full API integration |
| Content Queue | `/content` | `src/pages/ContentQueuePage.tsx` | Mockup — local state only |
| Publishing | `/publishing` | `src/pages/PublishingPage.tsx` | Mockup — calendar UI only |
| Article Editor | `/article` | `src/pages/ArticlePage.tsx` | Mockup — no backend save |
| Analytics | `/analytics` | `src/pages/AnalyticsPage.tsx` | Placeholder — no real data |
| Integrations | `/integrations` | `src/pages/IntegrationsPage.tsx` | Mockup — no actual sync |
| Settings | `/settings` | `src/pages/SettingsPage.tsx` | Mockup — no persistence |
| 404 | `*` | `src/pages/NotFound.tsx` | Done |

---

## TrendsPage — Core Live Page

`src/pages/TrendsPage.tsx` is the only page fully connected to the backend.

**What it does:**
- Calls `GET /api/trends/combined?geo=US&category=all`
- Shows cache status (fromCache, fetchedAt, expiresAt)
- Displays topPicks and googleTrends
- Has a Resync button → `POST /api/trends/resync`
- Supports geo and category dropdowns for filtering

---

## Authentication

**Context:** `src/contexts/AuthContext.tsx`

```typescript
interface AuthContextType {
  isAuthenticated: boolean
  user: { id: string; name: string; email: string } | null
  login(user: User): void
  logout(): void
}
```

- User is persisted in `localStorage` — survives page refresh
- `ProtectedRoute` component wraps all app routes
- Unauthenticated users are redirected to `/login`
- **No JWT stored** — user object stored directly; backend does not validate JWT on most endpoints

---

## Layout

**AppLayout** (`src/components/AppLayout.tsx`):
- Outer shell wrapping all protected pages
- Contains `AppSidebar` (left nav) + `TopBar` (header) + `<main>` content area

**AppSidebar** (`src/components/AppSidebar.tsx`):
- Navigation links using `NavLink` component
- Logout button calls `AuthContext.logout()` and redirects to `/login`

**TopBar** (`src/components/TopBar.tsx`):
- Search bar, notification bell, user avatar/profile

---

## UI Components

All UI components are in `src/components/ui/` — 60+ Shadcn UI components built on Radix UI primitives.

Key components used across the app:

| Component | Usage |
|-----------|-------|
| `Button` | All clickable actions |
| `Card / CardContent / CardHeader` | Data display panels |
| `Badge` | Status labels, classifications |
| `Tabs / TabsList / TabsTrigger / TabsContent` | Multi-view layouts |
| `Select` | Geo and category dropdowns (TrendsPage) |
| `Dialog / AlertDialog` | Confirmation modals |
| `Skeleton` | Loading placeholders |
| `Sonner` (toast) | Notifications via `toast()` from `sonner` |
| `Input` | Form inputs |
| `Table` | Data tables |

---

## State Management

- **Global auth state:** React Context (`AuthContext`)
- **Server state:** TanStack React Query (`useQuery`, `useMutation`) — used in TrendsPage
- **Local UI state:** `useState` in individual components
- **No Redux / Zustand** — not needed at current scale

---

## Styling

- **Tailwind CSS** with custom theme extensions:
  - Custom colors: `success`, `warning`, `info` variants
  - Custom animation: `pulse-dot`
  - Sidebar-specific color variants
- **Dark mode:** next-themes — toggled via ThemeProvider in `App.tsx`
- **CSS variables** for Shadcn color tokens in `src/index.css`

---

## Path Aliases

`@/` maps to `src/` (configured in `tsconfig.json` and `vite.config.ts`).

```ts
import { Button } from "@/components/ui/button"
import { AuthContext } from "@/contexts/AuthContext"
```

---

## Testing

**Runner:** Vitest 3.2.4
**Config:** `vitest.config.ts`
**Test files:** `src/test/`

```bash
npm run test        # run once
npm run test:watch  # watch mode
```
