import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken, JwtPayload, Env } from '@wallme/shared'

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const env: Env = req.app.locals.env
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }

  const token = authHeader.substring(7)

  try {
    const payload = verifyAccessToken(token, env.JWT_SECRET)
    req.user = payload
    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}