"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TaxiAnimation } from "@/components/taxi-animation"
import { TaxiNav } from "@/components/taxi-nav"
import { useAuth } from "@/lib/auth-context"
import { FaGoogle, FaFacebook } from "react-icons/fa"
import { jwtDecode } from "jwt-decode"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<string | null>(null)
  const router = useRouter()
  const { login, socialLogin } = useAuth()
  const searchParams = useSearchParams()

  useEffect(() => {
    const userParam = searchParams.get("user")
    if (userParam) {
      try {
        const userObj = JSON.parse(decodeURIComponent(userParam))
        // Save user info to your auth context/localStorage
        socialLogin(userObj.provider || "OAuth", {
          name: userObj.displayName || userObj.name,
          email: userObj.emails?.[0]?.value || userObj.email,
        }).then(() => {
          router.push("/")
        })
      } catch (e) {
        setError("OAuth login failed")
      }
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      // Check for admin credentials
      if (email === "sathwik272004@gmail.com" && password === "sathvik123") {
        // Try admin login via backend
        const res = await fetch(`${API_URL}/admin/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok && data.token) {
          localStorage.setItem("admin-token", data.token);
          // Optionally validate token
          try { jwtDecode(data.token); } catch {}
          router.push("/admin");
          return;
        } else {
          setError("Invalid admin credentials");
          setLoading(false);
          return;
        }
      }
      // Regular user login
      const success = await login(email, password)
      if (success) {
        router.push("/")
      } else {
        setError("Invalid email or password")
      }
    } catch (err) {
      console.error(err)
      setError("An error occurred during login")
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLogin = (provider: string) => {
    window.location.href = `http://localhost:4000/auth/${provider.toLowerCase()}`
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-yellow-50 to-yellow-100 py-12 overflow-hidden relative">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-20 bg-yellow-400 skew-y-3 transform -translate-y-10 z-0"></div>
      <div className="absolute bottom-0 right-0 w-full h-20 bg-yellow-400 skew-y-3 transform translate-y-10 z-0"></div>

      {/* Nav links */}
      <TaxiNav />

      <div className="container px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center space-y-8 text-center">
          <TaxiAnimation />
          <div className="space-y-2 animate-fade-in">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-gray-900">
              <span className="text-yellow-500">Taxi</span> Login
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-600 md:text-xl">
              Sign in to access your account and manage your taxi rides.
            </p>
          </div>

          <div className="w-full max-w-md rounded-lg border bg-white p-6 shadow-xl transition-all duration-300 hover:shadow-2xl animate-slide-up">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-yellow-500 hover:bg-yellow-600"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  onClick={() => handleSocialLogin("Google")}
                  disabled={socialLoading !== null}
                  className="flex items-center justify-center gap-2 bg-white text-gray-800 border border-gray-300 hover:bg-gray-50"
                >
                  <FaGoogle className="text-red-500" />
                  <span>{socialLoading === "Google" ? "Loading..." : "Google"}</span>
                </Button>
                <Button
                  type="button"
                  onClick={() => handleSocialLogin("Facebook")}
                  disabled={socialLoading !== null}
                  className="flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
                >
                  <FaFacebook />
                  <span>{socialLoading === "Facebook" ? "Loading..." : "Facebook"}</span>
                </Button>
              </div>
              
              <div className="text-center text-sm">
                <Link href="/forgot-password" className="text-yellow-600 hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <div className="text-center text-sm text-gray-500">
                Don't have an account?{" "}
                <Link href="/register" className="text-yellow-600 hover:underline font-medium">
                  Sign Up
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
} 