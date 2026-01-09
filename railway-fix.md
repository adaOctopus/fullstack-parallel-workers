# Railway Deployment Fix Guide

## Common Issues & Fixes

### Issue 1: Monorepo Dependencies Not Found

**Problem**: Railway can't find `@emma/shared` or other workspace packages.

**Fix**: Install dependencies from root first, then build.

**For API Service:**
```
Root Directory: apps/api
Build Command: cd ../.. && npm install && cd apps/api && npm run build
Start Command: npm start
```

**For Worker Service:**
```
Root Directory: apps/worker
Build Command: cd ../.. && npm install && cd apps/worker && npm run build
Start Command: npm start
```

**For Web Service:**
```
Root Directory: apps/web
Build Command: cd ../.. && npm install && cd apps/web && npm run build
Start Command: npm start
```

### Issue 2: TypeScript Build Errors

**Problem**: TypeScript compilation fails.

**Fix**: Make sure all dependencies are installed before building.

**Better Build Command:**
```
Build Command: npm install && npm run build
```

But Railway might not install root dependencies. Try this instead:

**Alternative Build Command:**
```
Build Command: npm ci && npm run build
```

### Issue 3: Root Directory Not Set

**Problem**: Railway is trying to build from root instead of app directory.

**Fix**: 
1. Go to Service → Settings → Source
2. Set **Root Directory** to:
   - `apps/api` for API
   - `apps/worker` for Worker  
   - `apps/web` for Web

### Issue 4: Missing Environment Variables

**Problem**: Build fails because env vars are missing.

**Fix**: Add ALL required environment variables BEFORE deploying:
- MONGODB_URI
- OPENAI_API_KEY
- REDIS_URL
- API_PORT (for API service)
- WS_URL (for Worker service)
- NEXT_PUBLIC_API_URL (for Web service)
- NEXT_PUBLIC_WS_URL (for Web service)

### Issue 5: Port Configuration

**Problem**: Railway assigns random PORT, but code expects specific port.

**Fix**: Railway automatically sets `PORT` env var. Update your code to use it:

**In apps/api/src/index.ts**, change:
```typescript
const PORT = process.env.PORT || process.env.API_PORT || 3001;
```

**In apps/worker**, no port needed (it's a background worker).

### Issue 6: Build Command Fails

**Problem**: `npm run build` fails in monorepo.

**Fix**: Use Turborepo build from root:

**For each service, try:**
```
Root Directory: . (root of repo)
Build Command: npm install && npm run build --filter=@emma/api
Start Command: cd apps/api && npm start
```

But this is complex. Better approach:

**Simpler Fix - Install from root in each service:**

**API Service:**
```
Root Directory: apps/api
Build Command: npm install --prefix ../.. && npm run build
Start Command: node dist/index.js
```

**Worker Service:**
```
Root Directory: apps/worker
Build Command: npm install --prefix ../.. && npm run build
Start Command: node dist/index.js
```

**Web Service:**
```
Root Directory: apps/web
Build Command: npm install --prefix ../.. && npm run build
Start Command: npm start
```

## Recommended Railway Configuration

### API Service
```
Root Directory: apps/api
Build Command: npm install --prefix ../.. && npm run build
Start Command: node dist/index.js
Environment Variables:
  - MONGODB_URI
  - OPENAI_API_KEY
  - REDIS_URL
  - PORT (Railway auto-sets this)
```

### Worker Service
```
Root Directory: apps/worker
Build Command: npm install --prefix ../.. && npm run build
Start Command: node dist/index.js
Environment Variables:
  - MONGODB_URI
  - OPENAI_API_KEY
  - REDIS_URL
  - WS_URL=wss://your-api.up.railway.app
```

### Web Service
```
Root Directory: apps/web
Build Command: npm install --prefix ../.. && npm run build
Start Command: npm start
Environment Variables:
  - NEXT_PUBLIC_API_URL=https://your-api.up.railway.app
  - NEXT_PUBLIC_WS_URL=wss://your-api.up.railway.app
```

## Quick Debug Steps

1. **Check Railway Logs**:
   - Go to Service → Deployments → Click latest deployment → View logs
   - Look for error messages

2. **Common Error Messages**:
   - `Cannot find module '@emma/shared'` → Dependencies not installed
   - `Command failed` → Build command issue
   - `Port already in use` → Port configuration issue
   - `MONGODB_URI is not set` → Missing env var

3. **Test Locally First**:
   ```bash
   cd apps/api
   npm install --prefix ../..
   npm run build
   npm start
   ```
   If this works locally, Railway should work too.

4. **Check Build Output**:
   - Railway logs show exactly what's failing
   - Copy the error and check what it says

## Nuclear Option: Use Nixpacks (Railway's Auto-Detection)

1. Go to Service → Settings → Source
2. Change **Buildpack** to **Nixpacks** (if available)
3. Railway will auto-detect and configure

## Still Failing? Share the Error

If none of this works, share:
1. The exact error from Railway logs
2. Which service is failing (API/Worker/Web)
3. What the build command shows

Then I can give you a specific fix!
