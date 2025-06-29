"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { useToast } from "@/hooks/use-toast"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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
  socialLogin: (provider: string, profile: any) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>
  logout: () => void
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>
  handleTokenExpiration: () => void
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => false,
  socialLogin: async () => false,
  register: async () => ({ success: false, message: 'Auth context not initialized' }),
  logout: () => {},
  authenticatedFetch: async () => new Response(),
  handleTokenExpiration: () => {},
})

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  // Check for existing session on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      const storedUser = localStorage.getItem("taxi-user")
      const token = localStorage.getItem("auth-token")
      
      if (storedUser && token) {
        try {
          // Validate token with backend
          const response = await fetch(`${API_URL}/api/validate-token`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });

          if (response.ok) {
            const data = await response.json();
            const parsedUser = JSON.parse(storedUser)
            
            // Update user data with fresh data from backend
            const updatedUser = {
              ...parsedUser,
              name: data.user.displayName || parsedUser.name,
              email: data.user.email || parsedUser.email
            };
            
            setUser(updatedUser)
            localStorage.setItem("taxi-user", JSON.stringify(updatedUser))
            Cookies.set("auth-status", "authenticated", { expires: 7 })
          } else {
            // Token is invalid, clear storage
            console.log("Token validation failed, clearing auth data")
            localStorage.removeItem("taxi-user")
            localStorage.removeItem("auth-token")
            Cookies.remove("auth-status")
          }
        } catch (error) {
          console.error("Failed to validate token", error)
          // Network error or other issue, clear storage to be safe
          localStorage.removeItem("taxi-user")
          localStorage.removeItem("auth-token")
          Cookies.remove("auth-status")
        }
      }
      setLoading(false)
    }

    checkAuthStatus()
  }, [])

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/login`, {
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
      
      // Show success message
      toast({
        title: "Login Successful!",
        description: `Welcome back, ${data.user.name}!`,
        variant: "default",
      });
      
      return true;
    } catch (error) {
      console.error("Login failed", error);
      return false;
    }
  }

  // Social login function
  const socialLogin = async (provider: string, profile: any): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // Call the backend to handle social login and get a JWT
      const res = await fetch(`${API_URL}/api/social-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profile }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Social login failed');
      }

      const { token, user } = await res.json();

      // Store token and user data
      localStorage.setItem('auth-token', token);
      localStorage.setItem('taxi-user', JSON.stringify(user));
      setUser(user);
      Cookies.set('auth-status', 'authenticated', { expires: 7 });

      toast({
        title: `Logged in with ${provider}`,
        description: `Welcome, ${user.displayName}!`,
        variant: 'default',
      });
      
      router.push('/');
      return true;

    } catch (err: any) {
      setError(err.message || `Failed to log in with ${provider}`);
      toast({
        title: 'Login Failed',
        description: err.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (name: string, email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(`${API_URL}/api/register`, {
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
      const loginResponse = await fetch(`${API_URL}/api/login`, {
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
      
      // Show success message
      toast({
        title: "Registration Successful!",
        description: `Welcome, ${data.user.name}! Your account has been created and you're now logged in.`,
        variant: "default",
      });
      
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
    
    // Show logout message
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
      variant: "default",
    });
    
    router.push("/login")
  }

  // Function to handle token expiration
  const handleTokenExpiration = () => {
    console.log("Token expired, logging out user")
    setUser(null)
    localStorage.removeItem("taxi-user")
    localStorage.removeItem("auth-token")
    Cookies.remove("auth-status")
    
    toast({
      title: "Session Expired",
      description: "Your session has expired. Please log in again.",
      variant: "destructive",
    });
  }

  // Utility function for authenticated API calls
  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem("auth-token")
    
    if (!token) {
      // Don't throw error immediately, just return a failed response
      return new Response(JSON.stringify({ error: "No authentication token" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (response.status === 401) {
      handleTokenExpiration()
      throw new Error("Authentication failed")
    }

    return response
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, socialLogin, register, logout, authenticatedFetch, handleTokenExpiration }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook for using auth context
export const useAuth = () => useContext(AuthContext) 