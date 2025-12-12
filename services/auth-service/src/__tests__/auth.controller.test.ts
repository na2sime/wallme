import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { register, login, refresh } from '../controllers/auth'

// Mock dependencies
jest.mock('bcryptjs')
jest.mock('uuid', () => ({ v4: () => 'test-uuid-1234' }))
jest.mock('@wallme/shared', () => ({
  signAccessToken: jest.fn(() => 'mock-access-token'),
  signRefreshToken: jest.fn(() => 'mock-refresh-token'),
  verifyRefreshToken: jest.fn(() => ({ userId: 'test-uuid-1234', email: 'test@example.com' })),
}))

describe('Auth Controller', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockDbPool: any
  let mockRedisClient: any
  let mockEnv: any

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()

    // Mock database pool
    mockDbPool = {
      query: jest.fn(),
    }

    // Mock Redis client
    mockRedisClient = {
      setEx: jest.fn(),
      get: jest.fn(),
    }

    // Mock environment
    mockEnv = {
      JWT_SECRET: 'test-secret',
      JWT_ACCESS_EXPIRY: '15m',
      JWT_REFRESH_EXPIRY: '7d',
      NODE_ENV: 'test',
    }

    // Mock request
    mockReq = {
      body: {},
      cookies: {},
      app: {
        locals: {
          dbPool: mockDbPool,
          redisClient: mockRedisClient,
          env: mockEnv,
        },
      } as any,
    }

    // Mock response
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
    }
  })

  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockReq.body = {
        email: 'newuser@example.com',
        password: 'password123',
      }

      mockDbPool.query
        .mockResolvedValueOnce({ rows: [] }) // No existing user
        .mockResolvedValueOnce({ rows: [] }) // Insert user

      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password')

      await register(mockReq as Request, mockRes as Response)

      expect(mockDbPool.query).toHaveBeenCalledWith('SELECT id FROM users WHERE email = $1', [
        'newuser@example.com',
      ])
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10)
      expect(mockRedisClient.setEx).toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(201)
      expect(mockRes.json).toHaveBeenCalledWith({
        accessToken: 'mock-access-token',
        user: { id: 'test-uuid-1234', email: 'newuser@example.com' },
      })
    })

    it('should return 400 if email is missing', async () => {
      mockReq.body = { password: 'password123' }

      await register(mockReq as Request, mockRes as Response)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Email and password are required' })
    })

    it('should return 400 if password is too short', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: '123',
      }

      await register(mockReq as Request, mockRes as Response)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Password must be at least 6 characters' })
    })

    it('should return 409 if email already exists', async () => {
      mockReq.body = {
        email: 'existing@example.com',
        password: 'password123',
      }

      mockDbPool.query.mockResolvedValueOnce({ rows: [{ id: 'existing-user-id' }] })

      await register(mockReq as Request, mockRes as Response)

      expect(mockRes.status).toHaveBeenCalledWith(409)
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Email already exists' })
    })
  })

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      mockReq.body = {
        email: 'user@example.com',
        password: 'password123',
      }

      const mockUser = {
        id: 'user-id-123',
        email: 'user@example.com',
        password: 'hashed-password',
      }

      mockDbPool.query.mockResolvedValueOnce({ rows: [mockUser] })
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      await login(mockReq as Request, mockRes as Response)

      expect(mockDbPool.query).toHaveBeenCalledWith('SELECT * FROM users WHERE email = $1', [
        'user@example.com',
      ])
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password')
      expect(mockRedisClient.setEx).toHaveBeenCalled()
      expect(mockRes.json).toHaveBeenCalledWith({
        accessToken: 'mock-access-token',
        user: { id: 'user-id-123', email: 'user@example.com' },
      })
    })

    it('should return 400 if credentials are missing', async () => {
      mockReq.body = { email: 'test@example.com' }

      await login(mockReq as Request, mockRes as Response)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Email and password are required' })
    })

    it('should return 401 if user does not exist', async () => {
      mockReq.body = {
        email: 'nonexistent@example.com',
        password: 'password123',
      }

      mockDbPool.query.mockResolvedValueOnce({ rows: [] })

      await login(mockReq as Request, mockRes as Response)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid credentials' })
    })

    it('should return 401 if password is invalid', async () => {
      mockReq.body = {
        email: 'user@example.com',
        password: 'wrongpassword',
      }

      const mockUser = {
        id: 'user-id-123',
        email: 'user@example.com',
        password: 'hashed-password',
      }

      mockDbPool.query.mockResolvedValueOnce({ rows: [mockUser] })
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      await login(mockReq as Request, mockRes as Response)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid credentials' })
    })
  })

  describe('refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      mockReq.cookies = { refreshToken: 'valid-refresh-token' }

      mockRedisClient.get.mockResolvedValue('valid-refresh-token')

      await refresh(mockReq as Request, mockRes as Response)

      expect(mockRedisClient.get).toHaveBeenCalledWith('refresh_token:test-uuid-1234')
      expect(mockRes.json).toHaveBeenCalledWith({ accessToken: 'mock-access-token' })
    })

    it('should return 401 if refresh token is missing', async () => {
      mockReq.cookies = {}

      await refresh(mockReq as Request, mockRes as Response)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Refresh token not found' })
    })

    it('should return 401 if refresh token is invalid', async () => {
      mockReq.cookies = { refreshToken: 'invalid-token' }

      mockRedisClient.get.mockResolvedValue('different-token')

      await refresh(mockReq as Request, mockRes as Response)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid refresh token' })
    })

    it('should return 401 if refresh token is not in Redis', async () => {
      mockReq.cookies = { refreshToken: 'token' }

      mockRedisClient.get.mockResolvedValue(null)

      await refresh(mockReq as Request, mockRes as Response)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid refresh token' })
    })
  })
})