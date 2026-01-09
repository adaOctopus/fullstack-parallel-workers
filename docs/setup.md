# Setup Guide

## Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account (or local MongoDB)
- Redis instance (local or cloud)
- OpenAI API key
- Microsoft Entra ID app registration (for OAuth)

## Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/emma

# Redis
REDIS_URL=redis://localhost:6379

# OAuth
BETTER_AUTH_SECRET=your-secret-key-min-32-chars
BETTER_AUTH_URL=http://localhost:3000
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret
MICROSOFT_TENANT_ID=your-tenant-id

# LLM
OPENAI_API_KEY=your-openai-api-key

# API
API_PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### 3. Start Services

**Option A: Run all services together (recommended)**

```bash
npm run dev
```

This starts:
- Frontend (Next.js) on `http://localhost:3000`
- API server on `http://localhost:3001`
- Worker service (background)

**Option B: Run services individually**

```bash
# Terminal 1: Frontend
cd apps/web
npm run dev

# Terminal 2: API
cd apps/api
npm run dev

# Terminal 3: Worker
cd apps/worker
npm run dev
```

### 4. Verify Setup

1. Open `http://localhost:3000` in your browser
2. You should see the welcome modal
3. Enter two numbers and click "Compute"
4. Watch real-time progress updates

## Running Tests

```bash
# Run all tests
npm run test

# Run tests for specific app
cd apps/web && npm run test
cd apps/api && npm run test
```

## Building for Production

```bash
# Build all apps
npm run build

# Build specific app
cd apps/web && npm run build
```

## Troubleshooting

### MongoDB Connection Issues
- Verify your MongoDB Atlas connection string
- Check network access in MongoDB Atlas dashboard
- Ensure IP whitelist includes your IP

### Redis Connection Issues
- Start Redis locally: `redis-server`
- Or use a cloud Redis service (Redis Cloud, Upstash)

### WebSocket Connection Issues
- Ensure API server is running on port 3001
- Check firewall settings
- Verify `NEXT_PUBLIC_WS_URL` matches API port

### LLM API Issues
- Verify OpenAI API key is valid
- Check API quota/limits
- Ensure sufficient credits
