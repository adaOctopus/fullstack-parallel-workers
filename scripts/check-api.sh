#!/bin/bash

echo "🔍 Checking if API server is running..."
echo ""

# Check if port 3001 is in use
if lsof -i :3001 > /dev/null 2>&1; then
    echo "✅ Port 3001 is in use"
    echo "Processes using port 3001:"
    lsof -i :3001
else
    echo "❌ Port 3001 is NOT in use - API server is not running"
    echo ""
    echo "To start the API server:"
    echo "  cd apps/api && npm run dev"
    echo ""
    echo "Or start all services:"
    echo "  npm run dev (from root)"
fi

echo ""
echo "🔍 Checking environment variables..."
if [ -f .env ]; then
    echo "✅ .env file exists"
    if grep -q "MONGODB_URI" .env; then
        echo "✅ MONGODB_URI is set"
    else
        echo "❌ MONGODB_URI is NOT set in .env"
    fi
    if grep -q "OPENAI_API_KEY" .env; then
        echo "✅ OPENAI_API_KEY is set"
    else
        echo "⚠️  OPENAI_API_KEY is NOT set (required for worker)"
    fi
else
    echo "❌ .env file does NOT exist"
fi
