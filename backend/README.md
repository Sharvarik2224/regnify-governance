# Backend (Express + MongoDB)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Fill `.env` values:

- `MONGODB_URI`: MongoDB connection string
- `MONGODB_DB_NAME`: Database name (default: `regnify_hr`)
- `MONGODB_EMPLOYEES_COLLECTION`: Collection name (default: `employees`)
- `MONGODB_SIGNATURES_COLLECTION`: Collection name (default: `signatures`)
- `MONGODB_DOCUMENT_AUDIT_COLLECTION`: Collection name (default: `document_audit`)
- `MONGODB_EMPLOYEE_PERFORMANCE_COLLECTION`: Collection name (default: `Employee_performance`)
- `PUBLIC_BASE_URL`: Public URL for signature file links (default: `http://localhost:5000`)
- `PORT`: Backend port (default: `5000`)

## Database setup (optional but recommended)

Create indexes by running:

```bash
npm run mongo:indexes
```

This script is in `mongodb/indexes.js`.

## Run

```bash
npm run dev
```

API endpoint for frontend:

- `POST /api/employees`
- `GET /api/employee-performance`
- `GET /api/employee-performance/:employeeEmail`
- `POST /api/employee-performance`
- `GET /api/signatures/:hrId`
- `POST /api/signatures/upload`
- `POST /api/signatures/revoke`
- `POST /api/document-audit`
- Health check: `GET /api/health`

## n8n integration guide

See `docs/n8n_signature_workflow.md` for signature fetch, PDF embedding, document hash, and audit persistence.
