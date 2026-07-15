# PriorAuthAutomation-frontend

> Part of a 4-repo portfolio project: [infra](https://github.com/brijeshdankhara/PriorAuthAutomation-infra) · [backend](https://github.com/brijeshdankhara/PriorAuthAutomation-backend) · **frontend** (this repo) · [docs](https://github.com/brijeshdankhara/PriorAuthAutomation-docs)
>
> This is a portfolio/demo project (synthetic data only, no real patients or providers). Live demo: `autopa.brijeshdankhara.com` (`brijeshdankhara.com/auto-pa-test` redirects there).

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

Hosted on **Vercel**, at its own subdomain, `autopa.brijeshdankhara.com` — not a path under the main domain. Squarespace (which hosts `brijeshdankhara.com`) can only route by (sub)domain via DNS, not by path, so there's no way to have Squarespace serve the root site while transparently proxying just `/auto-pa-test` to Vercel. Instead, Squarespace has a plain URL redirect from `/auto-pa-test` to this subdomain — the address bar changes after landing, but everything downstream (SPA routing, deep links, the browser back button) works correctly because the app is genuinely being served from its own domain, not iframed or proxied.

- `vite.config.ts` uses the default `base: '/'` — the app is served from the subdomain's root.
- `.env.production` holds Prod's Cognito IDs and `VITE_API_BASE=/api` — none of these are secrets (a Cognito user-pool/client ID is meant to be visible in client-side JS; the actual security boundary is Cognito's own SRP auth and the API's own authorization checks).
- `vercel.json` rewrites `/api/*` to the backend's CloudFront domain (same-origin from the browser's point of view, so no CORS is needed) and falls back every other path to `index.html` for client-side routing. Vercel serves real static assets before applying rewrites, so this doesn't interfere with the built JS/CSS.

Deploying: connect this repo to a Vercel project (framework preset: Vite), then add `autopa.brijeshdankhara.com` as a custom domain in the project's settings — Vercel gives you a CNAME target to add in Squarespace's DNS settings. Vercel then builds and deploys on every push automatically.
