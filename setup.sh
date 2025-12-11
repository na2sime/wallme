#!/bin/bash

# WallMe Setup Script
# This script helps you set up the WallMe project quickly

set -e

echo "🚀 WallMe Setup Script"
echo "====================="
echo ""

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install it first:"
    echo "   npm install -g pnpm"
    exit 1
fi

echo "✅ pnpm is installed"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

echo ""
echo "✅ Dependencies installed"
echo ""

# Build shared package
echo "🔨 Building shared package..."
cd services/shared
pnpm build
cd ../..

echo ""
echo "✅ Shared package built"
echo ""

# Start Docker services
echo "🐳 Starting Docker services (PostgreSQL + Redis)..."
docker-compose up -d postgres redis

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker exec wallme-postgres pg_isready -U wallme > /dev/null 2>&1; do
    sleep 1
done

echo "✅ PostgreSQL is ready"
echo ""

# Wait for Redis to be ready
echo "⏳ Waiting for Redis to be ready..."
until docker exec wallme-redis redis-cli ping > /dev/null 2>&1; do
    sleep 1
done

echo "✅ Redis is ready"
echo ""

echo "🎉 Setup complete!"
echo ""
echo "You can now start the services:"
echo ""
echo "  Option 1 - Development mode (recommended):"
echo "    pnpm dev"
echo ""
echo "  Option 2 - Full Docker deployment:"
echo "    docker-compose down"
echo "    docker-compose up --build"
echo ""
echo "Once started, access the app at:"
echo "  • Web App:      http://localhost:4000"
echo "  • API Gateway:  http://localhost:3000"
echo "  • Adminer:      http://localhost:8080"
echo ""