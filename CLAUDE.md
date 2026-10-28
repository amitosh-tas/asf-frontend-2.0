# Attribution System — Frontend

React 19 + TypeScript + Vite + Redux Toolkit + Tailwind 4 + Recharts, talking to the Attribution System backend over cookie-authenticated REST (`withCredentials`). Base URL: `VITE_API_BASE_URL`.

## Commands
```
npm run dev      # dev server
npm run build    # tsc -b && vite build
npx tsc -b       # type-check
npx oxlint       # lint (12 pre-existing warnings; new code should add none)
```
There is no test runner in the project.

## Roles and routes (`src/app/App.tsx`)
* `company_admin`, `company_viewer` — company dashboard (Overview, Channels, Campaigns, Journeys, Customers, Orders, Bookings, Locations, Ad spend, Analytics, Integrations; admin-only Team and Settings). Viewers can be limited to some locations.
* `platform_admin` — `/super/*`: Dashboard, Platform health, Workspaces (approvals, stats), workspace detail (support tools), Members, Audit log, FX rates, Settings. "View as" renders the company pages at `/super/workspaces/:id/view/*` using the `/api/view/*` endpoints. Platform admins must use two-factor login: until they do, `ProtectedRoute` sends them to `/setup-2fa`.
* Public: `/signin` (with the 2FA code step), `/signup`, `/forgot-password`, `/reset-password`, `/verify-user`, `/accept-invite`, and `/docs` (in-app integration docs).
* Product-scope mapping: `ALIGNMENT.md`.

## Layout
* `src/services/` — axios client (`api.ts`) and one service file per backend area. `api.ts` has two interceptors: it attaches `X-Support-Session` to `/api/view/*` calls and remembers the company timezone from `period.tz` on report responses.
* `src/features/<area>/` — feature code (components, hooks, utils, types): `connectors`, `customers`, `reports`, `revenue`, `api-keys`, `support`, `insights` (report hooks/components shared by all report pages), `settings`, `team`, `auth`.
* `src/services/insights.ts` — report and list URLs (company vs view-as), types, CSV download. Report pages use `useReport` / `useList` / `useReportFilters` from `features/insights/hooks/useReport.ts`.
* `src/components/ui/` — design-system primitives (Button, Modal, Input, Select, FormField, Badge, DataTable, Alert…). Reuse these.
* `src/docs/` — the in-app integration docs page.

## Connectors (`features/connectors`)
Integrations (`/integrations`) drives the backend's gateway API (`/api/workspace/connectors/*`):
* The supported gateways and their form fields come from `GET …/connectors/gateways` — the form is rendered from that catalog, so adding a gateway on the backend needs no form code here.
* **Stripe / PayPal:** one-click connect (the backend creates the webhook). **Razorpay:** the backend returns a webhook URL + signing secret **once**; `ManualSetupModal` shows it and cannot be closed until the user confirms they saved it.
* Credentials are held only in component state while the dialog is open and cleared on success/close. Never log, persist or put them in Redux.
* `ConnectorDetailModal` = overview + health check (`verify`) + event log with replay (`ConnectorEventsPanel`). `DisconnectModal` disables a connector (history is kept); delete only works for connectors that never received data (otherwise the API answers 409 `connector_has_data` and we route to Disconnect).
* Connectors created the old manual way (Shopify, Zenoti, generic, older Stripe/Razorpay) have `connection: null` and keep the legacy `ConnectorSetupModal`.

## Support sessions (`features/support`, `services/supportSession*.ts`)
Platform admins can only open a company's data inside a **support session** (written reason, expiry, PII masking). `SupportViewGate` wraps `/super/workspaces/:id/view`: with no live session it asks for a reason and renders nothing else (so no request is made that the backend would refuse); with one it shows `SupportSessionBanner` (countdown, End session). The session id lives in `sessionStorage` per workspace. Companies see every session under Settings → Support access.

## Reports and dates
Money in other currencies is converted with the company's FX mode (Settings → Company profile → Exchange rates: own-date rate or today's rate; rates sync hourly). Reports return an `fx` block, shown under the filters by `FxNote` (`ReportToolbar`'s `fx` prop).

"A day" is the **company's** local day. The date presets use the company timezone once a report response has revealed it (`features/reports/utils/timezone.ts`); `YYYY-MM-DD` values are sent as-is and the backend treats them as whole local days. Money values from the API are strings in minor units.

## Conventions
* Data loading: fetch inside `useEffect` keyed by a counter / params (see `pages/company/Customers.tsx`); do not call a state-setting loader function directly from an effect (lint rule `set-state-in-effect`).
* Errors: use `getRequestErrorMessage` / `getRequestErrorData` from `features/reports/utils/requestError.ts`.
* Customer emails can be absent (masked in a support session) — render a fallback, never assume `email` exists.
