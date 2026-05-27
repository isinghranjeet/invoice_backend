# Backend Upgrade TODO (Advanced)

## Step 1 — Repo analysis + baseline
- [x] Read existing backend (`server/index.js`) and dependencies
- [x] Align expected invoice payload with frontend types

## Step 2 — Dependency & scripts update
- [x] Update `server/package.json` with: zod, jsonwebtoken, bcryptjs, helmet, express-rate-limit, pino, swagger, swagger-ui-express, supertest, jest
- [x] Add npm scripts: dev/start/test


## Step 3 — Project refactor (structure)
- [ ] Create `server/src/` folders: app, routes, controllers, services, models, middleware, schemas, utils
- [ ] Replace monolithic `server/index.js` with thin entrypoint

## Step 4 — Validation + error handling
- [ ] Add zod schemas for invoice create/update + query params
- [ ] Add centralized error handler + consistent API error format

## Step 5 — Auth (user-scoped invoices)
- [ ] Add User model (register/login/me)
- [ ] Add JWT auth middleware
- [ ] Add invoice ownership (`ownerId`) and scope all invoice queries to user

## Step 6 — Invoice API improvements
- [ ] Add pagination/search/sort to `GET /api/invoices`
- [ ] Implement create/update endpoints (and keep upsert behavior if desired)
- [ ] Ensure unique index on `{ ownerId, 'details.invoiceNo' }`

## Step 7 — Security & observability
- [ ] Add helmet + rate limiting + request id
- [ ] Upgrade `/api/health` to include DB status
- [ ] Add structured logging

## Step 8 — Swagger docs
- [ ] Add OpenAPI/Swagger UI route (`/api/docs`)
- [ ] Document auth + invoice endpoints

## Step 9 — Tests
- [ ] Add integration tests for auth and invoice routes

## Step 10 — Final checks
- [ ] Run backend locally, run tests
- [ ] Verify frontend can still call invoice endpoints (or update frontend if needed)

