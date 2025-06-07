"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"

// Define user type
interface User {
  id: string
  name: string
  email: string
  provider?: string
}

// Define auth context type
interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  socialLogin: (provider: string, userData: any) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => false,
  socialLogin: async () => false,
  register: async () => false,
  logout: () => {},
})

// Mock database for demo purposes (would use real DB in production)
let users: { id: string; name: string; email: string; password: string; provider?: string }[] = [
  {
    id: "1",
    name: "Test User",
    email: "test@example.com",
    password: "password123",
  },
]

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("taxi-user")
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        Cookies.set("auth-status", "authenticated", { expires: 7 })
      } catch (error) {
        console.error("Failed to parse stored user", error)
        localStorage.removeItem("taxi-user")
      }
    }
    setLoading(false)
  }, [])

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Find user with matching email
      const foundUser = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      )

      if (foundUser) {
        // Create user object without password
        const { password: _, ...userWithoutPassword } = foundUser
        
        // Set user in state and local storage
        setUser(userWithoutPassword)
        localStorage.setItem("taxi-user", JSON.stringify(userWithoutPassword))
        Cookies.set("auth-status", "authenticated", { expires: 7 })
        
        return true
      }
      
      return false
    } catch (error) {
      console.error("Login failed", error)
      return false
    }
  }

  // Social login function
  const socialLogin = async (provider: string, userData: any): Promise<boolean> => {
    try {
      // Check if user already exists with this email
      let existingUser = users.find(
        (u) => u.email.toLowerCase() === userData.email.toLowerCase()
      )

      if (!existingUser) {
        // Create new user if not exists
        const newUser = {
          id: `${users.length + 1}`,
          name: userData.name,
          email: userData.email,
          password: "", // No password for social logins
          provider,
        }
        users.push(newUser)
        existingUser = newUser
      }

      // Create user object without password
      const { password: _, ...userWithoutPassword } = existingUser
      
      // Set user in state and local storage
      setUser(userWithoutPassword)
      localStorage.setItem("taxi-user", JSON.stringify(userWithoutPassword))
      Cookies.set("auth-status", "authenticated", { expires: 7 })
      
      return true
    } catch (error) {
      console.error(`${provider} login failed`, error)
      return false
    }
  }

  // Register function
  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      // Check if email already exists
      const existingUser = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      )

      if (existingUser) {
        alert("Email already registered")
        return false
      }

      // Create new user
      const newUser = {
        id: `${users.length + 1}`,
        name,
        email,
        password,
      }

      // Add to users array (would be DB insert in real app)
      users.push(newUser)

      return true
    } catch (error) {
      console.error("Registration failed", error)
      return false
    }
  }

  // Logout function
  const logout = () => {
    setUser(null)
    localStorage.removeItem("taxi-user")
    Cookies.remove("auth-status")
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, socialLogin, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook for using auth context
export const useAuth = () => useContext(AuthContext) 