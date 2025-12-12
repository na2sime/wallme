import { Request, Response, NextFunction } from 'express'
import { authMiddleware } from '../middleware/auth'

// Mock dependencies
const mockVerifyAccessToken = jest.fn()
jest.mock('@wallme/shared', () => ({
  verifyAccessToken: (token: string, secret: string) => mockVerifyAccessToken(token, secret),
}))

describe('Auth Middleware', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    jest.clearAllMocks()

    mockReq = {
      headers: {},
      app: {
        locals: {
          env: {
            JWT_SECRET: 'test-secret',
          },
        },
      } as any,
    }

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }

    mockNext = jest.fn()
  })

  it('should call next() with valid token', () => {
    mockReq.headers = {
      authorization: 'Bearer valid-token',
    }

    const mockPayload = { userId: 'user-123', email: 'test@example.com' }
    mockVerifyAccessToken.mockReturnValue(mockPayload)

    authMiddleware(mockReq as Request, mockRes as Response, mockNext)

    expect(mockVerifyAccessToken).toHaveBeenCalledWith('valid-token', 'test-secret')
    expect(mockReq.user).toEqual(mockPayload)
    expect(mockNext).toHaveBeenCalled()
  })

  it('should return 401 if authorization header is missing', () => {
    mockReq.headers = {}

    authMiddleware(mockReq as Request, mockRes as Response, mockNext)

    expect(mockRes.status).toHaveBeenCalledWith(401)
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'No token provided' })
    expect(mockNext).not.toHaveBeenCalled()
  })

  it('should return 401 if authorization header does not start with Bearer', () => {
    mockReq.headers = {
      authorization: 'Token invalid-format',
    }

    authMiddleware(mockReq as Request, mockRes as Response, mockNext)

    expect(mockRes.status).toHaveBeenCalledWith(401)
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'No token provided' })
    expect(mockNext).not.toHaveBeenCalled()
  })

  it('should return 401 if token is invalid', () => {
    mockReq.headers = {
      authorization: 'Bearer invalid-token',
    }

    mockVerifyAccessToken.mockImplementation(() => {
      throw new Error('Invalid token')
    })

    authMiddleware(mockReq as Request, mockRes as Response, mockNext)

    expect(mockRes.status).toHaveBeenCalledWith(401)
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' })
    expect(mockNext).not.toHaveBeenCalled()
  })

  it('should return 401 if token is expired', () => {
    mockReq.headers = {
      authorization: 'Bearer expired-token',
    }

    mockVerifyAccessToken.mockImplementation(() => {
      throw new Error('Token expired')
    })

    authMiddleware(mockReq as Request, mockRes as Response, mockNext)

    expect(mockRes.status).toHaveBeenCalledWith(401)
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' })
    expect(mockNext).not.toHaveBeenCalled()
  })
})
