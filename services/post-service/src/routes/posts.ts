import { Router } from 'express'
import { createPost, getPosts } from '../controllers/posts'
import { authMiddleware } from '../middleware/auth'

const router = Router()

router.post('/', authMiddleware, createPost)
router.get('/', getPosts)

export default router