# Emma - Worker Queue Application

A modern fullstack application built with Next.js, Node.js, and TypeScript that processes computational jobs through a scheduler-worker system with real-time updates.

## Features

- 🚀 **Monorepo Architecture** - Built with Turborepo for optimal development experience
- ⚡ **Real-time Updates** - WebSocket-based progress tracking
- 🤖 **LLM-Powered Computations** - Uses OpenAI for mathematical operations
- 🔐 **OAuth Authentication** - Microsoft Entra ID integration via Better Auth
- 📊 **Queue Management** - Efficient job processing with parallel execution
- 🗄️ **MongoDB Atlas** - Cloud database for data persistence
- ⚡ **Redis Cache** - Fast caching layer
- 🧪 **Comprehensive Testing** - Unit tests for frontend and backend
- 🔄 **CI/CD Pipeline** - Automated deployment with GitHub Actions

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Shadcn/ui
- **Backend**: Node.js, Express, TypeScript
- **Worker**: Node.js, TypeScript
- **Database**: MongoDB Atlas
- **Cache**: Redis
- **Auth**: Better Auth (Microsoft Entra ID)
- **LLM**: OpenAI
- **Monorepo**: Turborepo

## Quick Start

See [docs/setup.md](./docs/setup.md) for detailed setup instructions.

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your credentials

# Run all services in development
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

## Project Structure

```
emma/
├── apps/
│   ├── web/          # Next.js frontend
│   ├── api/           # Express backend API
│   └── worker/        # Worker service
├── packages/
│   ├── shared/        # Shared types, schemas, utilities
│   └── config/        # Shared configurations
└── docs/              # Documentation
```

## Documentation

- [Architecture](./docs/architecture.md) - System architecture and design decisions
- [Setup Guide](./docs/setup.md) - Local development setup
- [TypeScript Features](./docs/typescript-features.md) - Advanced TypeScript usage
- [CI/CD Guide](./docs/cicd.md) - GitHub Actions pipeline
- [TypeScript Examples](./docs/typescript-examples.md) - Code examples of advanced concepts

## License

MIT
