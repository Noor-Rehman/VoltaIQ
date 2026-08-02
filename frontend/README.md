# VoltaIQ Frontend

A polished Next.js frontend for the VoltaIQ load-shedding predictor.

## Run locally

```bash
cd frontend
npm install
npm run dev
```

## Environment

If your backend is not on `http://localhost:8000`, set:

```bash
BACKEND_URL=http://your-backend-host:8000
```

The frontend uses local `/api/*` routes that proxy requests to the FastAPI backend.
