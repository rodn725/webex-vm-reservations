# AGENTS.md — VM Webex Bot (GCP Functions + Firestore)

## Project goals (MVP)
- Webex bot that can **list** VMs and **claim/release** them
- Backend: **Cloud Functions (2nd gen, Node 20, ESM)** on GCP
- Store: **Firestore (Native mode)** single collection `vms`
- No reservations/waitlists/audits/reports in MVP

## Conventions
- Language: **Node 20**, **ESM** modules, **TypeScript NOT required** (JS ok)
- Style: **no semicolons**, Prettier + ESLint enforced
- Keep deps lean. Use `node-fetch` (or `undici`) for HTTP
- Files use LF, UTF-8

## Scripts to provide
- `npm run dev` — local Functions Framework (optional)
- `npm run lint` — ESLint
- `npm run format` — Prettier
- `npm run deploy:webex` — gcloud deploy for `webexHooks`
- `npm run deploy:cleanup` — gcloud deploy for `cleanup`
- `npm run seed` — seeds Firestore with 10 VMs from `scripts/seed-vms.json`

## Architecture (folders)
- apps/functions/ # Cloud Functions entrypoints and modules
  - index.js # exports: webexHooks, cleanup
  - webex.js # Webex API + signature verification
  - firestore.js # DB helpers + transactions
  - cards.js # Adaptive Card builder
  - vm-commands.js # command parser (/vm list|claim|release)
- scripts/
  - seed-vms.json # list of VMs
  - seed.js # node script to write seed to Firestore


## Behavior
- `/vm list` → post Adaptive Card roster of all VMs
- `/vm claim <vm> [--for 120m|2h]` → transactional claim; reject if in use
- `/vm release <vm>` → clear assignment
- `cleanup` function: every 5 min, auto-release expired (`endAt <= now`)
- Adaptive Cards: **post a fresh message** for the roster (editing cards is limited)
- Webhook security: verify **X-Spark-Signature** HMAC with shared secret

## Webex API constraints
- Use Webhooks for `messages/created` and `attachmentActions/created`
- On card submit: fetch inputs via Attachment Actions API
- Fetch `people/{id}` to display name/email

## Testing (light)
- Unit test command parser and Firestore claim/release logic (mock Firestore)
- Do not make live Webex/GCP calls in tests; mock HTTP

## Done criteria for PRs
- Scripts above work
- Commands work in a real Webex space:
  - `/vm list` posts card
  - “Claim 1h/2h” buttons work, and list refreshes
  - `/vm release vm-01` works
- README explains setup & deploy steps clearly
