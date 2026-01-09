# Documentation Index

## Quick Links

- [Architecture](./architecture.md) - System architecture and design decisions
- [Setup Guide](./setup.md) - Local development setup instructions
- [TypeScript Features](./typescript-features.md) - Advanced TypeScript concepts explained
- [TypeScript Examples](./typescript-examples.md) - Code examples of advanced concepts
- [CI/CD Guide](./cicd.md) - GitHub Actions pipeline setup

## Project Overview

Emma is a modern fullstack worker queue application built with:

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Express.js + TypeScript + MongoDB + Redis
- **Worker**: Node.js + TypeScript + OpenAI LLM
- **Monorepo**: Turborepo for optimal development experience

## Key Features

✅ Real-time job processing with WebSocket updates  
✅ LLM-powered mathematical computations  
✅ Parallel job execution  
✅ Type-safe API boundaries  
✅ OAuth authentication ready (Microsoft Entra ID)  
✅ Comprehensive test coverage  
✅ CI/CD pipeline with GitHub Actions  

## Getting Started

1. Read [Setup Guide](./setup.md) for installation instructions
2. Review [Architecture](./architecture.md) to understand the system
3. Check [TypeScript Examples](./typescript-examples.md) for code patterns

## Running the Application

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Start all services
npm run dev
```

## Testing

```bash
# Run all tests
npm run test

# Run tests for specific app
cd apps/web && npm run test
cd apps/api && npm run test
```

## Building

```bash
# Build all apps
npm run build
```
