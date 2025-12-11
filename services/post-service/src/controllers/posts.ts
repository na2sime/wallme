import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { Pool } from 'pg'
import { RedisClientType } from 'redis'
import { Post, PostCreatedEvent } from '@wallme/shared'

const REDIS_CHANNEL = 'wallme.posts.new'

export async function createPost(req: Request, res: Response) {
  const dbPool: Pool = req.app.locals.dbPool
  const redisClient: RedisClientType = req.app.locals.redisClient

  const { content } = req.body

  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Content is required' })
  }

  if (content.trim().length === 0) {
    return res.status(400).json({ error: 'Content cannot be empty' })
  }

  if (content.length > 500) {
    return res.status(400).json({ error: 'Content must be 500 characters or less' })
  }

  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const postId = uuidv4()
  const userId = req.user.userId

  try {
    const result = await dbPool.query<Post>(
      'INSERT INTO posts (id, user_id, content, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
      [postId, userId, content.trim()]
    )

    const post = result.rows[0]

    const event: PostCreatedEvent = {
      id: post.id,
      userId: post.user_id,
      content: post.content,
      createdAt: post.created_at.toISOString(),
    }

    await redisClient.publish(REDIS_CHANNEL, JSON.stringify(event))

    res.status(201).json({
      id: post.id,
      userId: post.user_id,
      content: post.content,
      createdAt: post.created_at,
    })
  } catch (error) {
    console.error('Create post error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export async function getPosts(req: Request, res: Response) {
  const dbPool: Pool = req.app.locals.dbPool

  try {
    const result = await dbPool.query<Post>(
      'SELECT p.id, p.user_id, p.content, p.created_at, u.email FROM posts p JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC LIMIT 50'
    )

    const posts = result.rows.map((post) => ({
      id: post.id,
      userId: post.user_id,
      content: post.content,
      createdAt: post.created_at,
      userEmail: (post as unknown as { email: string }).email,
    }))

    res.json({ posts })
  } catch (error) {
    console.error('Get posts error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}