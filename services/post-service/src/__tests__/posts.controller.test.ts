import { Request, Response } from 'express'
import { createPost, getPosts } from '../controllers/posts'

// Mock dependencies
jest.mock('uuid', () => ({ v4: () => 'test-post-uuid' }))

describe('Posts Controller', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockDbPool: any
  let mockRedisClient: any

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock database pool
    mockDbPool = {
      query: jest.fn(),
    }

    // Mock Redis client
    mockRedisClient = {
      publish: jest.fn(),
    }

    // Mock request
    mockReq = {
      body: {},
      user: undefined,
      app: {
        locals: {
          dbPool: mockDbPool,
          redisClient: mockRedisClient,
        },
      } as any,
    }

    // Mock response
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
  })

  describe('createPost', () => {
    it('should create a post successfully', async () => {
      mockReq.body = { content: 'This is a test post' }
      mockReq.user = { userId: 'user-123', email: 'test@example.com' }

      const mockPost = {
        id: 'test-post-uuid',
        user_id: 'user-123',
        content: 'This is a test post',
        created_at: new Date('2024-01-01T00:00:00.000Z'),
      }

      mockDbPool.query.mockResolvedValueOnce({ rows: [mockPost] })

      await createPost(mockReq as Request, mockRes as Response)

      expect(mockDbPool.query).toHaveBeenCalledWith(
        'INSERT INTO posts (id, user_id, content, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
        ['test-post-uuid', 'user-123', 'This is a test post']
      )
      expect(mockRedisClient.publish).toHaveBeenCalledWith(
        'wallme.posts.new',
        JSON.stringify({
          id: 'test-post-uuid',
          userId: 'user-123',
          content: 'This is a test post',
          createdAt: '2024-01-01T00:00:00.000Z',
        })
      )
      expect(mockRes.status).toHaveBeenCalledWith(201)
      expect(mockRes.json).toHaveBeenCalledWith({
        id: 'test-post-uuid',
        userId: 'user-123',
        content: 'This is a test post',
        createdAt: mockPost.created_at,
      })
    })

    it('should return 400 if content is missing', async () => {
      mockReq.body = {}
      mockReq.user = { userId: 'user-123', email: 'test@example.com' }

      await createPost(mockReq as Request, mockRes as Response)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Content is required' })
    })

    it('should return 400 if content is not a string', async () => {
      mockReq.body = { content: 12345 }
      mockReq.user = { userId: 'user-123', email: 'test@example.com' }

      await createPost(mockReq as Request, mockRes as Response)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Content is required' })
    })

    it('should return 400 if content is empty', async () => {
      mockReq.body = { content: '   ' }
      mockReq.user = { userId: 'user-123', email: 'test@example.com' }

      await createPost(mockReq as Request, mockRes as Response)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Content cannot be empty' })
    })

    it('should return 400 if content is too long', async () => {
      mockReq.body = { content: 'a'.repeat(501) }
      mockReq.user = { userId: 'user-123', email: 'test@example.com' }

      await createPost(mockReq as Request, mockRes as Response)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Content must be 500 characters or less' })
    })

    it('should return 401 if user is not authenticated', async () => {
      mockReq.body = { content: 'Test post' }
      mockReq.user = undefined

      await createPost(mockReq as Request, mockRes as Response)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' })
    })

    it('should trim whitespace from content', async () => {
      mockReq.body = { content: '  Test post with spaces  ' }
      mockReq.user = { userId: 'user-123', email: 'test@example.com' }

      const mockPost = {
        id: 'test-post-uuid',
        user_id: 'user-123',
        content: 'Test post with spaces',
        created_at: new Date(),
      }

      mockDbPool.query.mockResolvedValueOnce({ rows: [mockPost] })

      await createPost(mockReq as Request, mockRes as Response)

      expect(mockDbPool.query).toHaveBeenCalledWith(
        expect.any(String),
        ['test-post-uuid', 'user-123', 'Test post with spaces']
      )
    })

    it('should handle database errors', async () => {
      mockReq.body = { content: 'Test post' }
      mockReq.user = { userId: 'user-123', email: 'test@example.com' }

      mockDbPool.query.mockRejectedValueOnce(new Error('Database error'))

      await createPost(mockReq as Request, mockRes as Response)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Internal server error' })
    })
  })

  describe('getPosts', () => {
    it('should return all posts successfully', async () => {
      const mockPosts = [
        {
          id: 'post-1',
          user_id: 'user-1',
          content: 'First post',
          created_at: new Date('2024-01-01'),
          email: 'user1@example.com',
        },
        {
          id: 'post-2',
          user_id: 'user-2',
          content: 'Second post',
          created_at: new Date('2024-01-02'),
          email: 'user2@example.com',
        },
      ]

      mockDbPool.query.mockResolvedValueOnce({ rows: mockPosts })

      await getPosts(mockReq as Request, mockRes as Response)

      expect(mockDbPool.query).toHaveBeenCalledWith(
        'SELECT p.id, p.user_id, p.content, p.created_at, u.email FROM posts p JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC LIMIT 50'
      )
      expect(mockRes.json).toHaveBeenCalledWith({
        posts: [
          {
            id: 'post-1',
            userId: 'user-1',
            content: 'First post',
            createdAt: mockPosts[0].created_at,
            userEmail: 'user1@example.com',
          },
          {
            id: 'post-2',
            userId: 'user-2',
            content: 'Second post',
            createdAt: mockPosts[1].created_at,
            userEmail: 'user2@example.com',
          },
        ],
      })
    })

    it('should return empty array if no posts exist', async () => {
      mockDbPool.query.mockResolvedValueOnce({ rows: [] })

      await getPosts(mockReq as Request, mockRes as Response)

      expect(mockRes.json).toHaveBeenCalledWith({ posts: [] })
    })

    it('should handle database errors', async () => {
      mockDbPool.query.mockRejectedValueOnce(new Error('Database error'))

      await getPosts(mockReq as Request, mockRes as Response)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Internal server error' })
    })
  })
})
