"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>
  logout: () => void
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => false,
  socialLogin: async () => false,
  register: async () => ({ success: false, message: 'Auth context not initialized' }),
  logout: () => {},
})

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("taxi-user")
    const token = localStorage.getItem("auth-token")
    
    if (storedUser && token) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        Cookies.set("auth-status", "authenticated", { expires: 7 })
      } catch (error) {
        console.error("Failed to parse stored user", error)
        localStorage.removeItem("taxi-user")
        localStorage.removeItem("auth-token")
      }
    }
    setLoading(false)
  }, [])

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Important for cookies and sessions
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();
      
      if (!data.token) {
        throw new Error('No token received from server');
      }
      
      // Store token and user data
      localStorage.setItem("auth-token", data.token);
      localStorage.setItem("taxi-user", JSON.stringify(data.user));
      Cookies.set("auth-status", "authenticated", { expires: 7 });
      
      setUser(data.user);
      return true;
    } catch (error) {
      console.error("Login failed", error);
      return false;
    }
  }

  // Social login function
  const socialLogin = async (provider: string, userData: any): Promise<boolean> => {
    try {
      console.log(`Social login attempt with ${provider}:`, userData);
      
      if (!userData || !userData.email) {
        console.error("Invalid user data for social login:", userData);
        return false;
      }

      // Store user data from social login
      const user = {
        id: userData.id || `social_${Date.now()}`,
        name: userData.name || userData.displayName || "Social User",
        email: userData.email,
        provider,
      };
      
      // Set user in state and local storage
      setUser(user);
      localStorage.setItem("taxi-user", JSON.stringify(user));
      Cookies.set("auth-status", "authenticated", { expires: 7 });
      
      console.log("Social login successful:", user);
      return true;
    } catch (error) {
      console.error(`${provider} login failed:`, error);
      return false;
    }
  };

  // Register function
  const register = async (name: string, email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, displayName: name }),
        credentials: 'include' // Important for cookies
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Return specific error message from server
        return { 
          success: false, 
          message: errorData.error || 'Registration failed. Please try again.' 
        };
      }

      // After successful registration, immediately log the user in
      const loginResponse = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include' // Important for cookies
      });

      if (!loginResponse.ok) {
        // Registration succeeded but auto-login failed
        return { 
          success: true, 
          message: 'Registration successful! Please log in with your new credentials.'
        };
      }

      const data = await loginResponse.json();
      
      // Store token and user data
      localStorage.setItem("auth-token", data.token);
      localStorage.setItem("taxi-user", JSON.stringify(data.user));
      Cookies.set("auth-status", "authenticated", { expires: 7 });
      
      setUser(data.user);
      return { success: true };
    } catch (error) {
      console.error("Registration failed:", error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'An unexpected error occurred during registration.'
      };
    }
  }

  // Logout function
  const logout = () => {
    setUser(null)
    localStorage.removeItem("taxi-user")
    localStorage.removeItem("auth-token")
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