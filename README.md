# crm-ui

Minimal Angular 16 UI for SugamFlow CRM (Phase 2).

## Run

```bash
cd D:\sugamFlow\crm-ui
npm start
```

Opens on **http://localhost:4500** and proxies `/api` → `http://localhost:8095`.

## Features

- Set `X-Tenant-Id` (persisted in localStorage)
- Bootstrap workspace with industry template (GENERIC / EDUCATION / RETAIL / MEDICAL_DISTRIBUTOR)
- **Leads** — create, import CSV/XLSX, Kanban/list, assign, notes, convert to deal
- **Deals** — opportunities on the OPPORTUNITY pipeline with stage moves
- **Quotes** — GST quotation (CGST+SGST vs IGST), share text, mark sent / accept

Requires `crm-service` on port 8095 (profile `local`).
