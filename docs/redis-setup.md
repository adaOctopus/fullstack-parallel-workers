# Redis Setup Guide

## Production Setup (Vercel/Serverless)

For production environments like Vercel, use **Upstash Redis** (serverless-friendly):

### 1. Create Upstash Redis Database

1. Go to [https://upstash.com](https://upstash.com)
2. Sign up/login
3. Create a new Redis database
4. Copy the **REST URL** (not the Redis URL)

### 2. Add to Environment Variables

```env
REDIS_URL=your-upstash-rest-url-here
```

**Note**: Upstash provides both REST API and Redis protocol URLs. The code will work with either.

### 3. That's it!

The app will automatically:
- Connect to Redis if `REDIS_URL` is set
- Gracefully fallback if Redis is unavailable
- Continue working without Redis (just without caching)

## Local Development

For local development, Redis is **optional**:

- **Without Redis**: App works fine, just no caching
- **With Redis**: Install locally or use Upstash free tier

### Local Redis Installation

```bash
# macOS
brew install redis
brew services start redis

# Linux
sudo apt-get install redis-server
redis-server

# Windows
# Use WSL or Docker
```

Default connection: `redis://localhost:6379` (auto-detected)

## Features

- ✅ **Optional**: App works without Redis
- ✅ **Graceful Fallback**: No crashes if Redis unavailable
- ✅ **Production Ready**: Works with Upstash, Redis Cloud, etc.
- ✅ **Auto-reconnect**: Handles connection failures

## What Redis Does

1. **Caching**: Speeds up job lookups
2. **Pub/Sub**: Real-time updates between worker and API

If Redis is unavailable, the app still works but:
- Job lookups go directly to MongoDB (slightly slower)
- Real-time updates may be delayed (depends on worker fallback)
