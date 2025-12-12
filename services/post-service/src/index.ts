import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import swaggerUi from 'swagger-ui-express'
import { validateEnv, createPostgresPool, createRedisClient } from '@wallme/shared'
import postRoutes from './routes/posts'
import { swaggerSpec } from './swagger'

const env = validateEnv(process.env)

const app = express()

app.use(helmet())
app.use(
  cors({
    origin: [
      process.env.CORS_ORIGIN || 'http://localhost:4000',
      'http://localhost:3000',  // Allow gateway
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  })
)
app.use(express.json())
app.use(cookieParser())

const dbPool = createPostgresPool(env.DATABASE_URL)
let redisClient: Awaited<ReturnType<typeof createRedisClient>>

async function initializeApp() {
  try {
    redisClient = await createRedisClient(env.REDIS_URL)

    app.locals.dbPool = dbPool
    app.locals.redisClient = redisClient
    app.locals.env = env

    app.use('/posts', postRoutes)
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

    app.get('/health', (req, res) => {
      res.json({ status: 'ok', service: 'post-service' })
    })

    const PORT = parseInt(env.PORT, 10)
    app.listen(PORT, () => {
      console.log(`Post service listening on port ${PORT}`)
    })
  } catch (error) {
    console.error('Failed to initialize post service:', error)
    process.exit(1)
  }
}

initializeApp()

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully')
  await dbPool.end()
  await redisClient.quit()
  process.exit(0)
})