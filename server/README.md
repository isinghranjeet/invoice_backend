# Happy Invoice Creator - Backend

## Setup
1) Create `.env` from `.env.example`:
- `MONGODB_URI`
- `PORT`
- `CORS_ORIGIN`

2) Install dependencies:
```bash
npm install
```

3) Run:
```bash
npm run dev
```

## Endpoints
- `GET  /api/health`
- `POST /api/invoices` (upsert by `details.invoiceNo`)
- `GET  /api/invoices/:invoiceNo`
- `GET  /api/invoices?q=...` (search)
- `DELETE /api/invoices/:invoiceNo`

