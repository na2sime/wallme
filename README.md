# WallMe - Real-time Social Wall

A modern real-time social wall application built with microservices architecture, featuring instant updates via Redis Pub/Sub and Server-Sent Events (SSE).

## Architecture

WallMe is built as a **monorepo** with a **microservices architecture**:

```
wallme/
├── services/
│   ├── shared/          # Shared utilities, types, and clients
│   ├── auth-service/    # Authentication & JWT management
│   ├── post-service/    # Posts CRUD & Redis Pub/Sub
│   └── gateway/         # API Gateway & SSE streaming
└── apps/
    └── web/             # Next.js 15 frontend
```

### Tech Stack

#### Backend
- **Express 5** - Web framework
- **TypeScript** - Type safety
- **PostgreSQL** - Data persistence
- **Redis (Dragonfly)** - Pub/Sub & caching
- **JWT** - Authentication (HS256)
- **Docker** - Containerization

#### Frontend
- **Next.js 15** - React framework
- **React 19** - UI library
- **Tailwind CSS** - Styling
- **Server-Sent Events** - Real-time updates

## Features

- **User Authentication**
  - Registration with email/password
  - Login with JWT access tokens (15 min expiry)
  - Refresh tokens stored in HttpOnly cookies (7 days expiry)
  - Automatic token refresh

- **Real-time Posts**
  - Create posts (max 500 characters)
  - View latest 50 posts
  - Real-time updates via SSE
  - Redis Pub/Sub for event distribution

- **Security**
  - Password hashing with bcrypt
  - JWT-based authentication
  - HttpOnly, Secure, SameSite cookies
  - CORS protection
  - Helmet.js security headers

## Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** >= 8.0.0
- **Docker** & Docker Compose

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd wallme

# Install dependencies
pnpm install
```

### 2. Environment Setup

Copy the example environment files and adjust as needed:

```bash
# Auth Service
cp services/auth-service/.env.example services/auth-service/.env

# Post Service
cp services/post-service/.env.example services/post-service/.env

# Gateway
cp services/gateway/.env.example services/gateway/.env

# Web (Next.js)
cp apps/web/.env.local.example apps/web/.env.local
```

**Important:** Change the `JWT_SECRET` in all `.env` files for production!

### 3. Run with Docker Compose

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

This will start:
- **PostgreSQL** on port `5432`
- **Redis (Dragonfly)** on port `6379`
- **Auth Service** on port `3001`
- **Post Service** on port `3002`
- **Gateway** on port `3000`
- **Web App** on port `4000`
- **Adminer** (DB UI) on port `8080`

### 4. Access the Application

- **Web App:** http://localhost:4000
- **API Gateway:** http://localhost:3000
- **Database UI (Adminer):** http://localhost:8080
  - System: `PostgreSQL`
  - Server: `postgres`
  - Username: `wallme`
  - Password: `wallme`
  - Database: `wallme`

## Development Mode

To run services individually during development:

```bash
# Terminal 1 - Start databases
docker-compose up postgres redis

# Terminal 2 - Build shared package
cd services/shared
pnpm build

# Terminal 3 - Start auth-service
cd services/auth-service
pnpm dev

# Terminal 4 - Start post-service
cd services/post-service
pnpm dev

# Terminal 5 - Start gateway
cd services/gateway
pnpm dev

# Terminal 6 - Start web app
cd apps/web
pnpm dev
```

Or use the monorepo script (starts all services in parallel):

```bash
pnpm dev
```

## API Endpoints

### Authentication (via Gateway)

```bash
# Register
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

# Login
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

# Refresh Token
POST http://localhost:3000/api/auth/refresh
# (Uses refreshToken cookie automatically)
```

### Posts (via Gateway)

```bash
# Create Post (requires authentication)
POST http://localhost:3000/api/posts
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "content": "Hello, WallMe!"
}

# Get Posts
GET http://localhost:3000/api/posts
```

### Real-time Stream

```bash
# Subscribe to new posts (SSE)
GET http://localhost:3000/api/stream/posts
```

## Project Structure

### Services

#### `services/shared`
Common utilities used across all services:
- JWT signing/verification
- PostgreSQL pool creation
- Redis client creation
- TypeScript types
- Environment validation (Zod)

#### `services/auth-service`
Handles user authentication:
- User registration
- User login
- Token refresh
- Password hashing
- Refresh token storage in Redis

#### `services/post-service`
Manages posts:
- Create posts
- Retrieve posts
- Publish events to Redis Pub/Sub
- JWT authentication middleware

#### `services/gateway`
API Gateway:
- Proxies requests to microservices
- Provides SSE endpoint for real-time updates
- Subscribes to Redis Pub/Sub

### Frontend (`apps/web`)

#### Pages
- `/` - Home page with posts feed (protected)
- `/login` - Login page
- `/register` - Registration page

#### Key Components
- **AuthContext** - Authentication state management
- **usePostStream** - Custom hook for SSE connection
- **API Client** - Fetch wrapper for backend calls

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Posts Table
```sql
CREATE TABLE posts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (length(content) <= 500),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## Redis Channels

- **`wallme.posts.new`** - Published when a new post is created

Event format:
```json
{
  "id": "uuid",
  "userId": "uuid",
  "content": "post content",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

## Scripts

```bash
# Install dependencies
pnpm install

# Run all services in dev mode
pnpm dev

# Build all services
pnpm build

# Lint all code
pnpm lint

# Format code
pnpm format

# Docker commands
pnpm docker:up        # Start all containers
pnpm docker:down      # Stop all containers
pnpm docker:build     # Rebuild containers
pnpm docker:logs      # View logs
```

## Testing

### Manual Testing Flow

1. **Start the application:**
   ```bash
   docker-compose up --build
   ```

2. **Register a user:**
   - Go to http://localhost:4000/register
   - Enter email and password
   - You'll be redirected to the home page

3. **Create a post:**
   - Enter text in the post form
   - Click "Post"
   - The post appears instantly

4. **Test real-time updates:**
   - Open http://localhost:4000 in two browser windows
   - Login with different accounts in each
   - Create a post in one window
   - See it appear instantly in the other window

## Security Considerations

### Production Checklist

- [ ] Change `JWT_SECRET` to a strong, random secret
- [ ] Use strong passwords for PostgreSQL
- [ ] Enable HTTPS/TLS in production
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper CORS origins
- [ ] Set up rate limiting
- [ ] Enable database backups
- [ ] Use environment-specific secrets management
- [ ] Configure Redis persistence
- [ ] Set up monitoring and logging

### Current Security Features

- ✅ Password hashing with bcrypt (10 rounds)
- ✅ JWT tokens with expiration
- ✅ HttpOnly cookies for refresh tokens
- ✅ SameSite cookie attribute
- ✅ CORS protection
- ✅ Helmet.js security headers
- ✅ SQL injection prevention (parameterized queries)
- ✅ Input validation (length limits)

## Troubleshooting

### Port Already in Use

If you get "port already in use" errors:

```bash
# Check what's using the port
lsof -i :4000

# Kill the process
kill -9 <PID>
```

### Docker Build Issues

```bash
# Clean Docker cache
docker-compose down -v
docker system prune -a

# Rebuild
docker-compose up --build
```

### Database Connection Issues

```bash
# Check if PostgreSQL is healthy
docker-compose ps

# View logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Redis Connection Issues

```bash
# Check Redis status
docker-compose logs redis

# Test Redis connection
docker exec -it wallme-redis redis-cli ping
```

## Performance Considerations

- **Database Indexes:** Created on frequently queried columns
- **Connection Pooling:** PostgreSQL pool with max 20 connections
- **Redis Pipeline:** Efficient Pub/Sub implementation
- **Efficient Queries:** Limited to 50 posts per request
- **Proper Cleanup:** Graceful shutdown handling

## Future Enhancements

- [ ] User profiles with avatars
- [ ] Post reactions (likes, comments)
- [ ] WebSocket support (alternative to SSE)
- [ ] Post pagination
- [ ] User mentions and hashtags
- [ ] Image uploads
- [ ] Rate limiting per user
- [ ] Post editing and deletion
- [ ] Email verification
- [ ] Password reset flow
- [ ] OAuth integration (Google, GitHub)

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ using Next.js, Express, and Redis**