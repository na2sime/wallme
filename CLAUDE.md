# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**WallMe** is a real-time social wall application built with microservices architecture. Users can post messages that appear instantly across all connected clients via Server-Sent Events (SSE) and Redis Pub/Sub.

## Architecture

### Monorepo Structure

- **pnpm workspaces** for dependency management
- **TypeScript** throughout the entire stack
- **Microservices** architecture with clear separation of concerns

### Services (`services/`)

1. **shared** - Common utilities, types, JWT helpers, DB clients
2. **auth-service** (port 3001) - User authentication with JWT
3. **post-service** (port 3002) - Posts CRUD + Redis Pub/Sub publishing
4. **gateway** (port 3000) - API Gateway + SSE streaming

### Frontend (`apps/`)

- **web** - Next.js 15 app (port 4000) with real-time updates

### Infrastructure

- **PostgreSQL** - User and post storage
- **Redis (Dragonfly)** - Pub/Sub for real-time events
- **Docker Compose** - Complete containerized setup

## Key Technologies

- Express 5, Next.js 15, React 19
- JWT authentication (access + refresh tokens)
- Redis Pub/Sub for event distribution
- SSE for real-time client updates
- bcrypt for password hashing
- Tailwind CSS for styling

## Development Guidelines

### Making Changes

1. **Shared code** - Always build `@wallme/shared` after changes
2. **Environment variables** - Use `.env.example` files as templates
3. **Database changes** - Update `scripts/init.sql`
4. **API changes** - Maintain backwards compatibility

### Testing

Run services locally:
```bash
docker-compose up postgres redis  # Start databases
pnpm dev                          # Start all services
```

Or use Docker Compose for full stack:
```bash
docker-compose up --build
```

### Security

- Never commit `.env` files
- Always use parameterized queries
- Validate user input
- JWT_SECRET must be changed in production

## Common Tasks

### Adding a new endpoint

1. Add route in appropriate service
2. Add controller logic
3. Update types in `shared/` if needed
4. Test with curl or Postman

### Modifying authentication

Changes go in `services/auth-service/`
- Token generation: `src/controllers/auth.ts`
- JWT utilities: `services/shared/src/jwt/`

### Changing database schema

1. Update `scripts/init.sql`
2. Update types in `services/shared/src/types/`
3. Rebuild containers: `docker-compose down -v && docker-compose up --build`

## Project State

The project is **fully implemented** and ready to run. All core features are complete:
- User registration and login
- JWT authentication with refresh tokens
- Real-time post creation and display
- SSE streaming for instant updates
- Complete Docker setup
