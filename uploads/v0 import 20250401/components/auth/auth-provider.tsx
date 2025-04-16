"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface User {
  id: string
  name: string
  email: string
  preferences: {
    favoriteFrequencies: number[]
    preferredWaveType: string
    darkMode: boolean
    notificationsEnabled: boolean
  }
  sessions: {
    id: string
    date: string
    duration: number
    frequency: number
    notes: string
  }[]
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  updatePreferences: (preferences: Partial<User["preferences"]>) => void
  addSession: (session: Omit<User["sessions"][0], "id">) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // In a real app, this would be an API call to verify the session
        const storedUser = localStorage.getItem("astra_user")

        if (storedUser) {
          setUser(JSON.parse(storedUser))
        }
      } catch (error) {
        console.error("Authentication error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    // Only run on client
    if (typeof window !== "undefined") {
      checkAuth()
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)

    try {
      // In a real app, this would be an API call to authenticate
      // Simulating API call with timeout
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock user data
      const mockUser: User = {
        id: `user_${Date.now()}`,
        name: email.split("@")[0],
        email,
        preferences: {
          favoriteFrequencies: [432, 528, 639],
          preferredWaveType: "sine",
          darkMode: true,
          notificationsEnabled: true,
        },
        sessions: [
          {
            id: `session_${Date.now()}`,
            date: new Date().toISOString(),
            duration: 600, // 10 minutes
            frequency: 432,
            notes: "Initial session",
          },
        ],
      }

      setUser(mockUser)
      localStorage.setItem("astra_user", JSON.stringify(mockUser))
    } catch (error) {
      console.error("Login error:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true)

    try {
      // In a real app, this would be an API call to create an account
      // Simulating API call with timeout
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock user data
      const mockUser: User = {
        id: `user_${Date.now()}`,
        name,
        email,
        preferences: {
          favoriteFrequencies: [],
          preferredWaveType: "sine",
          darkMode: true,
          notificationsEnabled: true,
        },
        sessions: [],
      }

      setUser(mockUser)
      localStorage.setItem("astra_user", JSON.stringify(mockUser))
    } catch (error) {
      console.error("Signup error:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("astra_user")
  }

  const updatePreferences = (preferences: Partial<User["preferences"]>) => {
    if (!user) return

    const updatedUser = {
      ...user,
      preferences: {
        ...user.preferences,
        ...preferences,
      },
    }

    setUser(updatedUser)
    localStorage.setItem("astra_user", JSON.stringify(updatedUser))
  }

  const addSession = (session: Omit<User["sessions"][0], "id">) => {
    if (!user) return

    const newSession = {
      id: `session_${Date.now()}`,
      ...session,
    }

    const updatedUser = {
      ...user,
      sessions: [...user.sessions, newSession],
    }

    setUser(updatedUser)
    localStorage.setItem("astra_user", JSON.stringify(updatedUser))
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        updatePreferences,
        addSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

