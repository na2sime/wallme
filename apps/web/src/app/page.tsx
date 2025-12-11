'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { createPost, getPosts } from '@/lib/api'
import { usePostStream } from '@/hooks/usePostStream'

interface Post {
  id: string
  userId: string
  content: string
  createdAt: string
  userEmail?: string
}

export default function HomePage() {
  const { user, logout, accessToken } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    const fetchPosts = async () => {
      try {
        const data = await getPosts()
        setPosts(data.posts)
      } catch (err) {
        console.error('Failed to fetch posts:', err)
      }
    }

    fetchPosts()
  }, [user, router])

  usePostStream((newPost) => {
    setPosts((prev) => [
      {
        id: newPost.id,
        userId: newPost.userId,
        content: newPost.content,
        createdAt: newPost.createdAt,
      },
      ...prev,
    ])
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || !accessToken) return

    setLoading(true)
    setError('')

    try {
      await createPost(content, accessToken)
      setContent('')
    } catch (err) {
      setError('Failed to create post')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-indigo-600">WallMe</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
              >
                Logout
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              maxLength={500}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">{content.length}/500</span>
              <button
                type="submit"
                disabled={loading || !content.trim()}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Recent Posts</h2>
          {posts.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
              No posts yet. Be the first to post!
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-indigo-600">
                    {post.userEmail || 'Anonymous'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(post.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}