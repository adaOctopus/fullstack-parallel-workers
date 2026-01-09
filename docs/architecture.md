# Architecture Documentation

## System Architecture

### Monorepo Structure

The application is built as a **Turborepo monorepo** for optimal code sharing, build performance, and developer experience.

```
emma/
├── apps/
│   ├── web/          # Next.js 15 frontend (App Router)
│   ├── api/           # Express backend API
│   └── worker/         # Worker service for job processing
├── packages/
│   ├── shared/         # Shared types, schemas, utilities
│   └── config/         # Shared configurations (TS, ESLint)
```

### Why Monorepo?

1. **Code Sharing**: Shared types and utilities prevent duplication
2. **Type Safety**: End-to-end type safety across frontend and backend
3. **Build Performance**: Turborepo's caching speeds up builds
4. **Developer Experience**: Single repository, unified tooling

### Application Architecture

#### Frontend (Next.js 15)
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS + Shadcn/ui components
- **Real-time**: WebSocket connection for live updates
- **State Management**: React hooks with local state

#### Backend (Express API)
- **Framework**: Express.js with TypeScript
- **Database**: MongoDB Atlas (cloud MongoDB)
- **Cache**: Redis for job caching
- **WebSocket**: Real-time job progress updates
- **Auth**: Better Auth with Microsoft Entra ID (OAuth)

#### Worker Service
- **Purpose**: Asynchronous job processing
- **Queue**: Polls MongoDB for pending jobs
- **LLM**: OpenAI GPT-3.5-turbo for computations
- **Parallel Processing**: Supports multiple jobs simultaneously

### Data Flow

1. **User submits job** → Frontend sends POST to `/api/jobs`
2. **API creates job** → Saves to MongoDB, caches in Redis
3. **Worker polls** → Finds pending jobs every 2 seconds
4. **Worker processes** → Uses LLM for each operation (3s delay)
5. **WebSocket broadcasts** → Real-time updates to frontend
6. **Job completes** → Results saved to MongoDB

### Security Considerations

1. **Type-Safe Boundaries**: All API inputs validated with Zod schemas
2. **Environment Variables**: Sensitive data in `.env` files
3. **OAuth Integration**: Microsoft Entra ID for authentication
4. **Input Validation**: Runtime validation at API boundaries
5. **Error Handling**: Graceful error handling with type-safe responses

### Scalability

1. **Horizontal Scaling**: Worker can be scaled independently
2. **Parallel Processing**: Multiple jobs processed simultaneously
3. **Caching**: Redis reduces database load
4. **Monorepo**: Easy to add new services/apps
5. **Type Safety**: Prevents runtime errors at scale

### Technology Choices

- **Turborepo**: Best-in-class monorepo tooling
- **MongoDB Atlas**: Managed database, easy scaling
- **Redis**: Fast caching layer
- **OpenAI**: Reliable LLM API for computations
- **Better Auth**: Modern auth library with OAuth support
- **WebSocket**: Real-time bidirectional communication
