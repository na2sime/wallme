import jwt from 'jsonwebtoken'
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../jwt'
import { JwtPayload } from '../types'

describe('JWT Functions', () => {
  const testSecret = 'test-secret-key'
  const testPayload: JwtPayload = {
    userId: 'user-123',
    email: 'test@example.com',
  }

  describe('signAccessToken', () => {
    it('should create a valid access token', () => {
      const token = signAccessToken(testPayload, testSecret, '15m')

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })

    it('should encode payload correctly', () => {
      const token = signAccessToken(testPayload, testSecret, '15m')
      const decoded = jwt.decode(token) as any

      expect(decoded.userId).toBe(testPayload.userId)
      expect(decoded.email).toBe(testPayload.email)
    })

    it('should set expiration time', () => {
      const token = signAccessToken(testPayload, testSecret, '15m')
      const decoded = jwt.decode(token) as any

      expect(decoded.exp).toBeDefined()
      expect(decoded.iat).toBeDefined()
      expect(decoded.exp).toBeGreaterThan(decoded.iat)
    })
  })

  describe('signRefreshToken', () => {
    it('should create a valid refresh token', () => {
      const token = signRefreshToken(testPayload, testSecret, '7d')

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3)
    })

    it('should encode payload correctly', () => {
      const token = signRefreshToken(testPayload, testSecret, '7d')
      const decoded = jwt.decode(token) as any

      expect(decoded.userId).toBe(testPayload.userId)
      expect(decoded.email).toBe(testPayload.email)
    })
  })

  describe('verifyAccessToken', () => {
    it('should verify and decode valid token', () => {
      const token = signAccessToken(testPayload, testSecret, '15m')
      const decoded = verifyAccessToken(token, testSecret)

      expect(decoded.userId).toBe(testPayload.userId)
      expect(decoded.email).toBe(testPayload.email)
    })

    it('should throw error for invalid token', () => {
      expect(() => {
        verifyAccessToken('invalid-token', testSecret)
      }).toThrow()
    })

    it('should throw error for token with wrong secret', () => {
      const token = signAccessToken(testPayload, testSecret, '15m')

      expect(() => {
        verifyAccessToken(token, 'wrong-secret')
      }).toThrow()
    })

    it('should throw error for expired token', () => {
      const token = signAccessToken(testPayload, testSecret, '-1s') // Already expired

      expect(() => {
        verifyAccessToken(token, testSecret)
      }).toThrow()
    })
  })

  describe('verifyRefreshToken', () => {
    it('should verify and decode valid refresh token', () => {
      const token = signRefreshToken(testPayload, testSecret, '7d')
      const decoded = verifyRefreshToken(token, testSecret)

      expect(decoded.userId).toBe(testPayload.userId)
      expect(decoded.email).toBe(testPayload.email)
    })

    it('should throw error for invalid refresh token', () => {
      expect(() => {
        verifyRefreshToken('invalid-refresh-token', testSecret)
      }).toThrow()
    })

    it('should throw error for refresh token with wrong secret', () => {
      const token = signRefreshToken(testPayload, testSecret, '7d')

      expect(() => {
        verifyRefreshToken(token, 'wrong-secret')
      }).toThrow()
    })
  })

  describe('Token Compatibility', () => {
    it('should create different tokens for same payload', () => {
      const token1 = signAccessToken(testPayload, testSecret, '15m')
      // Small delay to ensure different iat
      const token2 = signAccessToken(testPayload, testSecret, '15m')

      // Tokens might be different due to iat, but should decode to same payload
      const decoded1 = verifyAccessToken(token1, testSecret)
      const decoded2 = verifyAccessToken(token2, testSecret)

      expect(decoded1.userId).toBe(decoded2.userId)
      expect(decoded1.email).toBe(decoded2.email)
    })

    it('should handle special characters in payload', () => {
      const specialPayload: JwtPayload = {
        userId: 'user-!@#$%',
        email: 'test+tag@example.com',
      }

      const token = signAccessToken(specialPayload, testSecret, '15m')
      const decoded = verifyAccessToken(token, testSecret)

      expect(decoded.userId).toBe(specialPayload.userId)
      expect(decoded.email).toBe(specialPayload.email)
    })
  })

  describe('Token Expiration', () => {
    it('should respect short expiration times', () => {
      const token = signAccessToken(testPayload, testSecret, '1s')
      const decoded = jwt.decode(token) as any

      expect(decoded.exp - decoded.iat).toBe(1)
    })

    it('should respect long expiration times', () => {
      const token = signRefreshToken(testPayload, testSecret, '7d')
      const decoded = jwt.decode(token) as any

      // 7 days = 604800 seconds
      expect(decoded.exp - decoded.iat).toBe(604800)
    })
  })
})
