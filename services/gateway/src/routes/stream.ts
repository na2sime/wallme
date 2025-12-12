import { Router, type IRouter, Request, Response } from 'express'
import { createRedisClient, PostCreatedEvent } from '@wallme/shared'

const router: IRouter = Router()

const REDIS_CHANNEL = 'wallme.posts.new'

/**
 * @swagger
 * /api/stream/posts:
 *   get:
 *     summary: Subscribe to real-time post updates via Server-Sent Events (SSE)
 *     tags: [Streaming]
 *     description: |
 *       Opens a persistent connection that streams new posts in real-time.
 *       Uses Server-Sent Events (SSE) protocol with Redis Pub/Sub backend.
 *       The connection stays open and sends events as they occur.
 *     responses:
 *       200:
 *         description: SSE stream established
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *               example: |
 *                 : connected
 *
 *                 data: {"type":"post.created","data":{"id":1,"content":"Hello!","user_id":1,"username":"john","created_at":"2024-01-01T00:00:00.000Z"}}
 *
 *       500:
 *         description: Server error establishing SSE connection
 */
router.get('/posts', async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
  let subscriber: Awaited<ReturnType<typeof createRedisClient>> | null = null

  try {
    subscriber = await createRedisClient(REDIS_URL)

    await subscriber.subscribe(REDIS_CHANNEL, (message) => {
      try {
        const event: PostCreatedEvent = JSON.parse(message)
        res.write(`data: ${JSON.stringify(event)}\n\n`)
      } catch (error) {
        console.error('Error parsing Redis message:', error)
      }
    })

    console.log(`Client connected to SSE stream`)

    res.write(`: connected\n\n`)

    req.on('close', async () => {
      console.log('Client disconnected from SSE stream')
      if (subscriber) {
        await subscriber.unsubscribe(REDIS_CHANNEL)
        await subscriber.quit()
      }
    })
  } catch (error) {
    console.error('SSE stream error:', error)
    if (subscriber) {
      await subscriber.quit()
    }
    res.end()
  }
})

export default router