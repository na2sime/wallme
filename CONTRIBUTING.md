# Contributing to WallMe

Thank you for your interest in contributing to WallMe! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other contributors

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm >= 8
- Docker Desktop
- Git
- Your favorite code editor (VS Code recommended)

### Setup Development Environment

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/wallme.git
   cd wallme
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Run Setup Script**
   ```bash
   ./setup.sh
   ```

4. **Start Development**
   ```bash
   pnpm dev
   ```

## Project Structure

See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for detailed project architecture.

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Adding tests
- `chore/` - Maintenance tasks

### 2. Make Changes

#### Coding Standards

**TypeScript**
- Use TypeScript strict mode
- Define proper types (avoid `any`)
- Use interfaces for objects
- Export types from `@wallme/shared`

**Code Style**
- Follow ESLint rules
- Use Prettier for formatting
- Write clear, descriptive variable names
- Add comments for complex logic

**Git Commits**
- Write clear commit messages
- Use present tense ("Add feature" not "Added feature")
- Reference issues when applicable
- Keep commits focused and atomic

Example:
```bash
git commit -m "Add user profile endpoint to auth-service"
git commit -m "Fix real-time update bug in SSE stream"
git commit -m "Update README with new environment variables"
```

### 3. Test Your Changes

Before submitting:

```bash
# Lint your code
pnpm lint

# Format your code
pnpm format

# Build to check for TypeScript errors
pnpm build

# Manual testing
pnpm dev
# Test the feature in browser
```

### 4. Update Documentation

If you've added or changed:
- **API endpoints** → Update README.md
- **Environment variables** → Update .env.example files
- **Database schema** → Update scripts/init.sql
- **Types** → Document in PROJECT_STRUCTURE.md

### 5. Submit Pull Request

1. **Push your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request on GitHub**
   - Use a clear title
   - Describe what you changed and why
   - Reference related issues
   - Add screenshots if UI changes
   - List testing steps

3. **PR Template**
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Tested locally
   - [ ] Added/updated tests
   - [ ] Passed linting

   ## Screenshots (if applicable)

   ## Related Issues
   Closes #123
   ```

## Types of Contributions

### 🐛 Bug Fixes

1. Create an issue describing the bug
2. Fork and create a fix branch
3. Fix the bug with tests
4. Submit PR referencing the issue

### ✨ New Features

1. Create an issue to discuss the feature
2. Wait for approval from maintainers
3. Implement the feature
4. Add documentation
5. Submit PR

### 📝 Documentation

- Fix typos or unclear explanations
- Add examples
- Improve README
- Create tutorials

### 🧪 Testing

- Add unit tests
- Add integration tests
- Improve test coverage

### 🎨 UI/UX Improvements

- Improve design
- Add animations
- Enhance accessibility
- Mobile responsiveness

## Coding Guidelines

### Backend Services

**Express Routes**
```typescript
// ✅ Good
router.post('/posts', authMiddleware, createPost)

// ❌ Bad
router.post('/posts', (req, res) => { /* inline logic */ })
```

**Error Handling**
```typescript
// ✅ Good
try {
  const result = await dbPool.query(...)
  res.json(result)
} catch (error) {
  console.error('Detailed error:', error)
  res.status(500).json({ error: 'User-friendly message' })
}
```

**Environment Variables**
```typescript
// ✅ Good - Use env validation
const env = validateEnv(process.env)
const port = parseInt(env.PORT, 10)

// ❌ Bad - Direct access
const port = process.env.PORT || 3000
```

### Frontend (Next.js)

**Components**
```tsx
// ✅ Good - Functional components with hooks
export default function PostCard({ post }: { post: Post }) {
  return <div>{post.content}</div>
}

// ❌ Bad - Class components
class PostCard extends React.Component { ... }
```

**API Calls**
```typescript
// ✅ Good - Use centralized API client
import { createPost } from '@/lib/api'
await createPost(content, token)

// ❌ Bad - Direct fetch everywhere
fetch('/api/posts', { ... })
```

**State Management**
```typescript
// ✅ Good - Use Context for global state
const { user } = useAuth()

// ❌ Bad - Prop drilling
<Component user={user} setUser={setUser} ... />
```

### Database

**Queries**
```typescript
// ✅ Good - Parameterized
await pool.query('SELECT * FROM users WHERE id = $1', [userId])

// ❌ Bad - String concatenation
await pool.query(`SELECT * FROM users WHERE id = '${userId}'`)
```

**Indexes**
```sql
-- ✅ Add indexes for frequently queried columns
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
```

### Security

- ✅ Never commit `.env` files
- ✅ Use parameterized queries
- ✅ Validate all user input
- ✅ Hash passwords with bcrypt
- ✅ Use HTTPS in production
- ✅ Set secure cookie flags
- ❌ Never log sensitive data

## Adding New Features

### Example: Adding Post Likes

1. **Update Database**
   ```sql
   -- scripts/init.sql
   CREATE TABLE post_likes (
       id UUID PRIMARY KEY,
       post_id UUID REFERENCES posts(id),
       user_id UUID REFERENCES users(id),
       created_at TIMESTAMP DEFAULT NOW(),
       UNIQUE(post_id, user_id)
   );
   ```

2. **Update Types**
   ```typescript
   // services/shared/src/types/index.ts
   export interface PostLike {
       id: string
       post_id: string
       user_id: string
       created_at: Date
   }
   ```

3. **Add Endpoint**
   ```typescript
   // services/post-service/src/controllers/posts.ts
   export async function likePost(req: Request, res: Response) {
       // Implementation
   }

   // services/post-service/src/routes/posts.ts
   router.post('/:id/like', authMiddleware, likePost)
   ```

4. **Update Frontend**
   ```typescript
   // apps/web/src/lib/api.ts
   export async function likePost(postId: string, token: string) {
       // Implementation
   }
   ```

5. **Document**
   - Update README.md with new endpoint
   - Update PROJECT_STRUCTURE.md if needed

## Common Tasks

### Adding a New Environment Variable

1. Add to service's `.env.example`
2. Add to service's `.env`
3. Add to `docker-compose.yml`
4. Update validation in `shared/src/config/env.ts`
5. Document in README.md

### Changing Database Schema

1. Update `scripts/init.sql`
2. Update types in `services/shared/src/types/`
3. Rebuild Docker: `docker-compose down -v && docker-compose up --build`
4. Update documentation

### Adding a New Service

1. Create directory in `services/`
2. Copy structure from existing service
3. Add to `pnpm-workspace.yaml`
4. Add to `docker-compose.yml`
5. Update README.md

## Debugging Tips

### Backend Issues
```bash
# Check service health
curl http://localhost:3001/health

# View logs
docker-compose logs auth-service
docker-compose logs -f  # Follow mode

# Check database
docker exec -it wallme-postgres psql -U wallme -d wallme
SELECT * FROM users;
```

### Frontend Issues
```bash
# Check Next.js logs
cd apps/web && pnpm dev

# Clear cache
rm -rf .next
pnpm dev

# Check browser console
# Check Network tab in DevTools
```

### Database Issues
```bash
# Connect to PostgreSQL
docker exec -it wallme-postgres psql -U wallme -d wallme

# Check tables
\dt

# Check data
SELECT * FROM posts ORDER BY created_at DESC LIMIT 5;
```

### Redis Issues
```bash
# Connect to Redis
docker exec -it wallme-redis redis-cli

# Check keys
KEYS *

# Monitor Pub/Sub
SUBSCRIBE wallme.posts.new
```

## Questions?

- Create an issue for questions
- Check existing issues first
- Be clear and specific
- Provide code examples

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to WallMe! 🎉