import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { Pool } from 'pg'
import { RedisClientType } from 'redis'
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  JwtPayload,
  User,
  Env,
} from '@wallme/shared'

const SALT_ROUNDS = 10
const REFRESH_TOKEN_PREFIX = 'refresh_token:'

export async function register(req: Request, res: Response) {
  const dbPool: Pool = req.app.locals.dbPool
  const env: Env = req.app.locals.env

  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  }

  try {
    const existingUser = await dbPool.query('SELECT id FROM users WHERE email = $1', [email])

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)
    const userId = uuidv4()

    await dbPool.query('INSERT INTO users (id, email, password, created_at) VALUES ($1, $2, $3, NOW())', [
      userId,
      email,
      hashedPassword,
    ])

    const payload: JwtPayload = { userId, email }
    const accessToken = signAccessToken(payload, env.JWT_SECRET, env.JWT_ACCESS_EXPIRY)
    const refreshToken = signRefreshToken(payload, env.JWT_SECRET, env.JWT_REFRESH_EXPIRY)

    const redisClient: RedisClientType = req.app.locals.redisClient
    await redisClient.setEx(`${REFRESH_TOKEN_PREFIX}${userId}`, 7 * 24 * 60 * 60, refreshToken)

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    res.status(201).json({ accessToken, user: { id: userId, email } })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function login(req: Request, res: Response) {
  const dbPool: Pool = req.app.locals.dbPool
  const env: Env = req.app.locals.env

  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  try {
    const result = await dbPool.query<User>('SELECT * FROM users WHERE email = $1', [email])

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const user = result.rows[0]
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const payload: JwtPayload = { userId: user.id, email: user.email }
    const accessToken = signAccessToken(payload, env.JWT_SECRET, env.JWT_ACCESS_EXPIRY)
    const refreshToken = signRefreshToken(payload, env.JWT_SECRET, env.JWT_REFRESH_EXPIRY)

    const redisClient: RedisClientType = req.app.locals.redisClient
    await redisClient.setEx(`${REFRESH_TOKEN_PREFIX}${user.id}`, 7 * 24 * 60 * 60, refreshToken)

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    res.json({ accessToken, user: { id: user.id, email: user.email } })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function refresh(req: Request, res: Response) {
  const env: Env = req.app.locals.env
  const redisClient: RedisClientType = req.app.locals.redisClient

  const refreshToken = req.cookies.refreshToken

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token not found' })
  }

  try {
    const payload = verifyRefreshToken(refreshToken, env.JWT_SECRET)

    const storedToken = await redisClient.get(`${REFRESH_TOKEN_PREFIX}${payload.userId}`)

    if (!storedToken || storedToken !== refreshToken) {
      return res.status(401).json({ error: 'Invalid refresh token' })
    }

    const newAccessToken = signAccessToken(
      { userId: payload.userId, email: payload.email },
      env.JWT_SECRET,
      env.JWT_ACCESS_EXPIRY
    )

    res.json({ accessToken: newAccessToken })
  } catch (error) {
    console.error('Refresh error:', error)
    res.status(401).json({ error: 'Invalid or expired refresh token' })
  }
}