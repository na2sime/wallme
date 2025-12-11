import { useEffect } from 'react'

interface PostEvent {
  id: string
  userId: string
  content: string
  createdAt: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

export function usePostStream(onNewPost: (post: PostEvent) => void) {
  useEffect(() => {
    const eventSource = new EventSource(`${API_URL}/stream/posts`)

    eventSource.onmessage = (event) => {
      try {
        const post: PostEvent = JSON.parse(event.data)
        onNewPost(post)
      } catch (error) {
        console.error('Error parsing SSE message:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE error:', error)
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [onNewPost])
}