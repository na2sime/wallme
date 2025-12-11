'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { loginUser, registerUser, refreshAccessToken } from '@/lib/api'

interface User {
  id: string
  email: string
}

interface AuthContextType {
  user: User | null
  accessToken: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const storedToken = localStorage.getItem('accessToken')

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser))
      setAccessToken(storedToken)
    }
  }, [])

  useEffect(() => {
    if (!accessToken) return

    const interval = setInterval(
      async () => {
        try {
          await refreshToken()
        } catch (error) {
          console.error('Token refresh failed:', error)
          logout()
        }
      },
      14 * 60 * 1000
    )

    return () => clearInterval(interval)
  }, [accessToken])

  const login = async (email: string, password: string) => {
    const data = await loginUser(email, password)
    setUser(data.user)
    setAccessToken(data.accessToken)
    localStorage.setItem('user', JSON.stringify(data.user))
    localStorage.setItem('accessToken', data.accessToken)
  }

  const register = async (email: string, password: string) => {
    const data = await registerUser(email, password)
    setUser(data.user)
    setAccessToken(data.accessToken)
    localStorage.setItem('user', JSON.stringify(data.user))
    localStorage.setItem('accessToken', data.accessToken)
  }

  const logout = () => {
    setUser(null)
    setAccessToken(null)
    localStorage.removeItem('user')
    localStorage.removeItem('accessToken')
  }

  const refreshToken = async () => {
    const data = await refreshAccessToken()
    setAccessToken(data.accessToken)
    localStorage.setItem('accessToken', data.accessToken)
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, login, register, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}