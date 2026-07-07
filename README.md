# PriorAuthAutomation-frontend

React + TypeScript + Vite SPA for the Prior Authorization Automation Platform. See [ARCHITECTURE.md](../PriorAuthAutomation-docs/ARCHITECTURE.md) in the docs repo for the full design.

Routing shell so far (`src/App.tsx`, `src/pages/`):
- `/` — login (Cognito integration is a TODO for the vertical slice)
- `/queue` — work queue
- `/requests/:requestId` — request detail / review screen

None of these call the API yet — that's wired up during the first vertical slice, alongside the API Gateway endpoint the backend will expose.

## Setup

```
npm install
npm run dev      # http://localhost:5173
npm run build    # production build
```
