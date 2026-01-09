# How to Run

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file in the **root directory** with:

```env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/dbname
OPENAI_API_KEY=sk-proj-...
REDIS_URL=redis://default:password@host.upstash.io:6379
```

**Note**: Only these 3 variables are required. The app will use defaults for other settings.

## Running

### Development (All Services)

```bash
npm run dev
```

This starts:
- Frontend (Next.js) on `http://localhost:3000`
- API (Express) on `http://localhost:3001`
- Worker (Background service)

### Individual Services

```bash
# Frontend only
cd apps/web && npm run dev

# API only
cd apps/api && npm run dev

# Worker only
cd apps/worker && npm run dev
```

## Production Build

```bash
npm run build
```

Then start each service:
```bash
# Frontend
cd apps/web && npm start

# API
cd apps/api && npm start

# Worker
cd apps/worker && npm start
```
