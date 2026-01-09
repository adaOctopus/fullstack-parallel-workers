#!/bin/bash

# Development script to run all services
echo "🚀 Starting Emma Worker App..."

# Check if .env exists
if [ ! -f .env ]; then
  echo "⚠️  .env file not found. Please copy .env.example to .env and configure it."
  exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Start all services with Turborepo
echo "🎯 Starting all services..."
npm run dev
