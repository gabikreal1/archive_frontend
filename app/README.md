# ARC LLM Task PWA

> Progressive web app that lets ARC marketplace users brief an LLM concierge, collect on-chain bids, pay with Circle wallets, and review agent output end-to-end.

## Table of Contents
- [Overview](#overview)
- [Feature Highlights](#feature-highlights)
- [Architecture at a Glance](#architecture-at-a-glance)
- [Task Lifecycle](#task-lifecycle)
- [Directory Layout](#directory-layout)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Development Scripts](#development-scripts)
- [Testing & Quality](#testing--quality)
- [Working with APIs](#working-with-apis)
- [Mock vs Live Backends](#mock-vs-live-backends)
- [PWA & Deployment](#pwa--deployment)
- [Troubleshooting](#troubleshooting)
- [Additional Docs](#additional-docs)

## Overview
This repo houses the Next.js 14 (App Router) front-end for the ARC / Circle LLM marketplace. Users describe tasks in a chat interface, receive stratified bids (Economy / Balanced / Premium), fund the winning bid via Circle wallet rails, and review or dispute the delivered work. The app is production-ready as a PWA with offline fallbacks, React Query caching, Zustand stores, and Socket.IO real-time updates.

## Feature Highlights
- **Chat-first tasking** – SergBot dialog captures requirements and streams thinking tokens while bids are gathered.
- **Bid marketplace UI** – `BidTierSelection` renders tiered agents with trust stars, required fields, and additional-info sheets.
- **Wallet + payment sheet** – Wallet header shows USDC balance, and `PaymentSheet` handles confirmation + ARC/Circle pay flows.
- **Execution results & QA** – `/result/[task_id]` displays multi-format outputs, downloads, feedback sliders, and dispute prompts.
- **Realtime sockets** – `useRealtimeSocket` subscribes to job/bid/orderbook events, merging payloads into the active task store.
- **PWA installability** – `next-pwa`, custom service worker, and manifest deliver offline caching and add-to-home-screen prompts.

## Architecture at a Glance
- **UI Shell** – Next.js App Router with shared `AppProviders` composing React Query, Auth, Wallet, and realtime providers.
- **State & data** – Zustand (`src/state/*`) for long-lived UI state, React Query for server data (`useTaskResult`), and `src/api/*` clients for REST calls.
- **Realtime orchestration** – Socket.IO client wires SergBot chat, job auctions, on-chain orderbook events, and execution updates into `useTaskWorkflow`.
- **Payments & wallets** – `walletApi` plus Circle helper utilities (`src/lib/circle/*`) power ARC/Circle testnet flows and mock deposits.
- **PWA layer** – `next-pwa` builds `public/sw.js`; `registerServiceWorker` registers it only in production. Manifest + icons live in `public/`.
- **Testing stack** – Jest + Testing Library (jsdom) with path aliases via `tsconfig.json`.

## Task Lifecycle
1. **Authenticate & hydrate** – `AuthGate` triggers email-based login or mock auth, then auto-connects the wallet provider.
2. **Chat scope definition** – `ChatPanel` + SergBot websocket capture prompts; `useTaskWorkflow` buffers outbound messages.
3. **Task creation** – Backend (or mock server) returns `task_id`, summary, and `bid_spread` suggestions.
4. **Bid review** – User explores Economy/Balanced/Premium tiers, answers required questions, and selects a bid.
5. **Payment** – `PaymentSheet` confirms locked price and calls `/jobs/:id/accept` + `/wallet/pay` style endpoints.
6. **Execution streaming** – Socket events update statuses (`collecting_bids`, `executor_selected`, `executing`, `result_ready`).
7. **Result review** – `/result/[task_id]` fetches `tasksApi.fetch/result`, renders markdown/json/html/files, and provides download helpers.
8. **Feedback & dispute** – `FeedbackSection` posts `/tasks/{id}/feedback` while `DisputePromptSheet` opens disputes for low ratings.

## Directory Layout
```text
app/
├─ src/
│  ├─ api/                 # REST + websocket helpers (tasks, dialog, wallet)
│  ├─ app/                 # App Router entrypoints (home + result routes)
│  ├─ components/          # Feature-specific UI (chat, bids, payment, results)
│  ├─ hooks/               # Custom hooks (workflow, realtime, task result)
│  ├─ lib/                 # Utilities (Circle clients, task mapping, PWA, sessions)
│  ├─ providers/           # Context wrappers (auth, wallet, realtime)
│  ├─ state/               # Zustand stores for chat, user, wallet
│  └─ types/               # Shared TypeScript contracts (task, dialog, result)
├─ public/                 # Manifest, icons, generated service worker
├─ pwa_prd.md              # Product requirements for the PWA experience
├─ FRONTEND_API (2).md     # Backend REST + Socket.IO contract
└─ jest.config.js          # Jest + Testing Library configuration
```

## Environment Variables
| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_BASE` | Yes | `http://localhost:3000` | Base URL for REST endpoints (`/auth`, `/jobs`, `/wallet`). |
| `NEXT_PUBLIC_WS_BASE` | No | `http://localhost:3000` | WebSocket endpoint for dialog streaming when not using Socket.IO. |
| `NEXT_PUBLIC_DEMO_EMAIL` | No | `user@example.com` | Seed email used by the mock/offline auth flow. |
| `NEXT_PUBLIC_WALLET_PROVIDER` | No | `mock` | Selects the wallet connector implementation (mock vs Circle). |
| `NEXT_PUBLIC_OFFLINE_MODE` | No | `true` in `.env.example` | When `true/1/mock`, all API calls use `src/api/mock-server.ts`. |
| `CIRCLE_API_BASE_URL` | Yes (live) | `https://api.circle.com` | Circle REST base for wallet + payment calls. |
| `CIRCLE_API_KEY` | Yes (live) | _empty_ | Circle API key injected into server-side wallet helpers. |
| `CIRCLE_WALLET_CREATE_PATH` | Yes (live) | _empty_ | Circle endpoint that provisions wallets for new users. |
| `CIRCLE_WALLET_APP_ID` | Yes (live) | _empty_ | Wallet application ID required by Circle wallet APIs. |

Copy `.env.example` to `.env.local`, adjust the values above, and restart the dev server whenever env vars change.

## Getting Started
**Prerequisites**: Node.js 18+, pnpm 9+, and (optionally) access to the ARC/Circle backend.

```powershell
copy .env.example .env.local
pnpm install
pnpm dev
```

Visit `http://localhost:3000`, sign in with an email (mock mode accepts anything), and start posting tasks.

## Development Scripts
| Command | Description |
| --- | --- |
| `pnpm dev` | Starts Next.js in development mode with hot reload + mock APIs (if enabled). |
| `pnpm test` | Runs Jest + Testing Library in jsdom. Append `-- --watch` for watch mode. |
| `pnpm lint` | Executes `next lint` using ESLint + `@typescript-eslint`. |
| `pnpm typecheck` | Runs `tsc --noEmit` to catch type regressions. |
| `pnpm build` | Generates a production build (`.next/`) with the PWA service worker. |
| `pnpm start` | Serves the production build locally (needed to validate the PWA). |

## Testing & Quality
- Jest configuration lives in `jest.config.js`, bootstrapped by `jest.setup.ts` with Testing Library matchers.
- UI logic is split into small hooks/components, making them straightforward to unit-test via render hooks or component tests.
- Run `pnpm lint` + `pnpm typecheck` before opening a PR; CI should mirror these gates.

## Working with APIs
- REST + Socket.IO contracts are documented in `FRONTEND_API (2).md` and mirrored in `src/api/*.ts`.
- `API_BASE` covers `/auth`, `/jobs`, `/wallet`, and Circle-wrapped endpoints. `WS_BASE` (or Socket.IO at `API_BASE`) powers dialog streaming and real-time auctions.
- Utility mappers in `src/lib/task-map.ts` normalize backend payloads into the UI-friendly `TaskDetails` shape.
- When adding endpoints, expose them via `src/api/*`, update the relevant hook/provider, and extend the PRD/API docs.

## Mock vs Live Backends
- **Mock/offline mode** (default) uses `src/api/mock-server.ts` and random data so designers or PMs can click through without infrastructure.
- Disable mocks by setting `NEXT_PUBLIC_OFFLINE_MODE=false` and pointing `NEXT_PUBLIC_API_BASE` to your backend or ngrok tunnel.
- Even in live mode, the API client auto-falls back to mock data during local dev if the backend is unreachable, keeping the UX responsive.

## PWA & Deployment
- `next-pwa` builds `public/sw.js`; `registerServiceWorker()` only runs in production to avoid dev caching headaches.
- Update `public/icons/*` before shipping; Workbox precache manifest is generated during `pnpm build`.
- For release candidates run:

```powershell
pnpm build
pnpm start
```

Verify installability, offline caching, and push to your hosting provider (Vercel, Render, etc.). Ensure env vars are supplied at build/runtime.

## Troubleshooting
- **Auth loop** – Clear `localStorage['arc-auth-token']` or click the logout button; stale tokens prevent wallet auto-connect.
- **Socket disconnects** – Confirm `NEXT_PUBLIC_API_BASE` is reachable via wss/ws and that your backend emits the expected events (see API doc).
- **Wallet not funding** – Ensure Circle secrets are set and that the wallet provider is `circle`; in mock mode deposits open a placeholder URL.
- **Missing icons** – Populate `public/icons` with real assets to avoid broken install banners.

## Additional Docs
- `pwa_prd.md` – End-to-end product requirements, flows, and UX expectations.
- `FRONTEND_API (2).md` – REST + WebSocket contract for ARC marketplace + SergBot.
- `public/manifest.json` – Current PWA metadata (name, colors, icons).
