export interface User {
  id: string
  email: string
  password: string
  created_at: Date
}

export interface Post {
  id: string
  user_id: string
  content: string
  created_at: Date
}

export interface JwtPayload {
  userId: string
  email: string
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

export interface PostCreatedEvent {
  id: string
  userId: string
  content: string
  createdAt: string
}