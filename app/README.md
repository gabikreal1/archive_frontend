# ARC LLM Task PWA

Front-end PWA for ARC/Circle marketplace workflows. Built with Next.js 14 (App Router), TypeScript, ShadCN-inspired UI primitives, Zustand, and React Query.

## Prerequisites
- Node.js 18+
- pnpm 9+

## Setup
```bash
pnpm install
pnpm dev
```

## Testing & Linting
```bash
pnpm lint
pnpm test
pnpm build
```

## Features
- Chat-first task creation with marketplace bids
- Wallet panel and payment sheet for ARC/Circle
- Result view with feedback + dispute flows
- Service worker, manifest, and PWA-ready config

## PWA Notes
- Update `public/icons` with actual assets
- Service worker auto-registers via `AppProviders`
- Manifest declares theme + standalone settings
