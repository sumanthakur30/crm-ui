# crm-ui

Minimal Angular 16 UI for SugamFlow CRM Phase 1.

## Run

```bash
cd D:\sugamFlow\crm-ui
npm start
```

Opens on **http://localhost:4500** and proxies `/api` → `http://localhost:8095`.

## Features

- Set `X-Tenant-Id` (persisted in localStorage)
- Bootstrap / load CRM workspace
- List and create leads
- CSV/XLSX upload to `POST /api/v1/crm/leads/import`

Requires `crm-service` on port 8095.
