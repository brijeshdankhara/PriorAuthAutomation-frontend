# PriorAuthAutomation-frontend

> Part of a 4-repo portfolio project: [infra](https://github.com/brijeshdankhara/PriorAuthAutomation-infra) · [backend](https://github.com/brijeshdankhara/PriorAuthAutomation-backend) · **frontend** (this repo) · [docs](https://github.com/brijeshdankhara/PriorAuthAutomation-docs)
>
> This is a portfolio/demo project (synthetic data only, no real patients or providers). Live demo: `www.brijeshdankhara.com/auto-pa-test`.

React + TypeScript + Vite SPA for the Prior Authorization Automation Platform. See [docs/ARCHITECTURE.md](https://github.com/brijeshdankhara/PriorAuthAutomation-docs/blob/main/ARCHITECTURE.md) for the full design.

## Pages (`src/pages/`)

- `LoginPage` (`/`) — real Cognito SRP login (via `amazon-cognito-identity-js`, so the password itself never transits to the server), plus a "Continue as guest" option that mints a read-only token and skips straight to the dashboard
- `DashboardPage` (`/dashboard`) — cross-request metrics; shows a dismissible "About this demo" explainer to guest visitors
- `WorkQueuePage` (`/queue`) — list of PA requests
- `NewRequestPage` (`/new`) — intake form (unreachable in guest mode — redirects to the dashboard)
- `RequestDetailPage` (`/requests/:requestId`) — full request detail with AI citations, evaluation trigger, and the human review actions (guest mode shows everything except the mutating actions themselves)

## Two access modes

Every page is reachable read-only by a guest visitor; only real login unlocks anything that mutates data or costs real AI/OCR money (creating a request, running an evaluation, approving/editing/overriding). This is enforced on the backend (`pa-api`'s `get_current_user` vs. `get_read_only_user`), not just hidden in the UI — the frontend hiding these controls in guest mode is a UX nicety, not the actual security boundary.

## Setup

```
npm install
npm run dev      # http://localhost:5173
```

Local dev needs `.env.local` (gitignored) with `VITE_COGNITO_USER_POOL_ID` / `VITE_COGNITO_CLIENT_ID` pointed at a deployed Beta Cognito pool (see `PriorAuthAutomation-infra`'s `IdentityStack` outputs), and a running `pa-api` (see the backend repo) at the URL the app calls.

## Production build & hosting

```
npm run build    # tsc -b && vite build
```

Hosted on **Vercel**, at `www.brijeshdankhara.com/auto-pa-test`:

- `vite.config.ts` sets `base: '/auto-pa-test/'` only for the production build (`command === 'build'`) — local dev still serves from `/`. `BrowserRouter`'s `basename` follows Vite's `base` automatically via `import.meta.env.BASE_URL`.
- `.env.production` holds Prod's Cognito IDs and `VITE_API_BASE=/auto-pa-test/api` — none of these are secrets (a Cognito user-pool/client ID is meant to be visible in client-side JS; the actual security boundary is Cognito's own SRP auth and the API's own authorization checks).
- `vercel.json` rewrites `/auto-pa-test/api/*` to the backend's CloudFront domain (same-origin from the browser's point of view, so no CORS is needed) and falls back every other `/auto-pa-test/*` path to `index.html` for client-side routing. Vercel serves real static assets before applying rewrites, so this doesn't interfere with the built JS/CSS.

Deploying: connect this repo to a Vercel project (framework preset: Vite) — Vercel builds and deploys on every push automatically from there.
