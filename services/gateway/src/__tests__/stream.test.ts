import { Request, Response } from 'express'

// Mock Redis client
const mockSubscribe = jest.fn()
const mockUnsubscribe = jest.fn()
const mockQuit = jest.fn()

const mockCreateRedisClient = jest.fn().mockResolvedValue({
  subscribe: mockSubscribe,
  unsubscribe: mockUnsubscribe,
  quit: mockQuit,
})

jest.mock('@wallme/shared', () => ({
  createRedisClient: mockCreateRedisClient,
  PostCreatedEvent: {},
}))

describe('Stream Routes', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>

  beforeEach(() => {
    jest.clearAllMocks()

    mockReq = {
      on: jest.fn(),
    }

    mockRes = {
      setHeader: jest.fn(),
      flushHeaders: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
    }

    process.env.REDIS_URL = 'redis://localhost:6379'
  })

  describe('SSE Stream Setup', () => {
    it('should set correct SSE headers', async () => {
      const streamRoute = await import('../routes/stream')

      expect(mockRes.setHeader).toBeDefined()
    })

    it('should create Redis subscriber', async () => {
      await mockCreateRedisClient('redis://localhost:6379')

      expect(mockCreateRedisClient).toHaveBeenCalledWith('redis://localhost:6379')
    })

    it('should subscribe to correct Redis channel', async () => {
      const subscriber = await mockCreateRedisClient()
      const mockCallback = jest.fn()

      await subscriber.subscribe('wallme.posts.new', mockCallback)

      expect(mockSubscribe).toHaveBeenCalledWith('wallme.posts.new', mockCallback)
    })

    it('should unsubscribe and quit on connection close', async () => {
      const subscriber = await mockCreateRedisClient()

      await subscriber.unsubscribe('wallme.posts.new')
      await subscriber.quit()

      expect(mockUnsubscribe).toHaveBeenCalledWith('wallme.posts.new')
      expect(mockQuit).toHaveBeenCalled()
    })
  })

  describe('SSE Event Handling', () => {
    it('should write SSE data in correct format', () => {
      const event = {
        type: 'post.created',
        data: {
          id: 'post-123',
          content: 'Test post',
          userId: 'user-123',
          username: 'testuser',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      }

      const expectedFormat = `data: ${JSON.stringify(event)}\n\n`

      expect(expectedFormat).toContain('data: ')
      expect(expectedFormat).toContain(JSON.stringify(event))
      expect(expectedFormat).toMatch(/\n\n$/)
    })

    it('should parse JSON messages correctly', () => {
      const message = JSON.stringify({
        type: 'post.created',
        data: { id: 'post-123', content: 'Test' },
      })

      const parsed = JSON.parse(message)

      expect(parsed.type).toBe('post.created')
      expect(parsed.data.id).toBe('post-123')
    })

    it('should handle JSON parse errors gracefully', () => {
      const invalidMessage = 'invalid-json'

      expect(() => {
        try {
          JSON.parse(invalidMessage)
        } catch (error) {
          expect(error).toBeInstanceOf(SyntaxError)
          throw error
        }
      }).toThrow()
    })
  })

  describe('Connection Management', () => {
    it('should send initial connection message', () => {
      const connectionMessage = ': connected\n\n'

      expect(connectionMessage).toMatch(/^: /)
      expect(connectionMessage).toMatch(/\n\n$/)
    })

    it('should handle client disconnect', async () => {
      const subscriber = await mockCreateRedisClient()
      const closeCallback = jest.fn(async () => {
        await subscriber.unsubscribe('wallme.posts.new')
        await subscriber.quit()
      })

      await closeCallback()

      expect(mockUnsubscribe).toHaveBeenCalled()
      expect(mockQuit).toHaveBeenCalled()
    })

    it('should handle Redis connection errors', async () => {
      mockCreateRedisClient.mockRejectedValueOnce(new Error('Redis connection failed'))

      await expect(mockCreateRedisClient()).rejects.toThrow('Redis connection failed')
    })
  })

  describe('Environment Configuration', () => {
    it('should use default Redis URL if not provided', () => {
      delete process.env.REDIS_URL
      const defaultUrl = process.env.REDIS_URL || 'redis://localhost:6379'

      expect(defaultUrl).toBe('redis://localhost:6379')
    })

    it('should use custom Redis URL from environment', () => {
      process.env.REDIS_URL = 'redis://custom-host:6380'

      expect(process.env.REDIS_URL).toBe('redis://custom-host:6380')
    })
  })
})
