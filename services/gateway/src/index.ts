import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import swaggerUi from 'swagger-ui-express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { createRedisClient } from '@wallme/shared'
import streamRoutes from './routes/stream'
import { swaggerSpec } from './swagger'

const app = express()

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001'
const POST_SERVICE_URL = process.env.POST_SERVICE_URL || 'http://localhost:3002'

let redisClient: Awaited<ReturnType<typeof createRedisClient>>

async function initializeApp() {
  try {
    const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
    redisClient = await createRedisClient(REDIS_URL)

    app.locals.redisClient = redisClient

    // IMPORTANT: Security and CORS must be FIRST
    app.use(helmet({ contentSecurityPolicy: false }))
    app.use(
      cors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:4000',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      })
    )
    app.use(cookieParser())

    // Swagger UI - Must be before proxy routes
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

    // Proxy routes - NO body parsing before proxy!
    app.use(
      '/api/auth',
      createProxyMiddleware({
        target: AUTH_SERVICE_URL,
        changeOrigin: true,
        pathRewrite: {
          '^/api/auth': '/auth',
        },
        onProxyReq: (proxyReq, req) => {
          // Forward cookies
          if (req.headers.cookie) {
            proxyReq.setHeader('cookie', req.headers.cookie)
          }
        },
      })
    )

    app.use(
      '/api/posts',
      createProxyMiddleware({
        target: POST_SERVICE_URL,
        changeOrigin: true,
        pathRewrite: {
          '^/api/posts': '/posts',
        },
        onProxyReq: (proxyReq, req) => {
          // Forward cookies and auth header
          if (req.headers.cookie) {
            proxyReq.setHeader('cookie', req.headers.cookie)
          }
          if (req.headers.authorization) {
            proxyReq.setHeader('authorization', req.headers.authorization)
          }
        },
      })
    )

    // Body parsing for non-proxied routes only
    app.use(express.json())

    app.use('/api/stream', streamRoutes)

    app.get('/health', (req, res) => {
      res.json({ status: 'ok', service: 'gateway' })
    })

    const PORT = parseInt(process.env.PORT || '3000', 10)
    app.listen(PORT, () => {
      console.log(`Gateway listening on port ${PORT}`)
    })
  } catch (error) {
    console.error('Failed to initialize gateway:', error)
    process.exit(1)
  }
}

initializeApp()

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully')
  if (redisClient) {
    await redisClient.quit()
  }
  process.exit(0)
})