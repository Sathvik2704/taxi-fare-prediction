"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { TaxiAnimation } from "@/components/taxi-animation"
import { TaxiNav } from "@/components/taxi-nav"
import { useAuth } from "@/lib/auth-context"
import { FaGoogle, FaFacebook } from "react-icons/fa"

export default function Register() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<string | null>(null)
  const [error, setError] = useState("")
  const router = useRouter()
  const { register, socialLogin, login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    
    setLoading(true)
    
    try {
      const result = await register(name, email, password)
      
      if (result.success) {
        // Try to log in the user automatically after successful registration
        const loginSuccess = await login(email, password)
        
        if (loginSuccess) {
          // Redirect to home page if auto-login was successful
          router.push("/")
        } else {
          // If auto-login fails but registration was successful
          setError(result.message || 'Registration successful! Please log in with your new credentials.')
          router.push("/login")
        }
      } else {
        // Show specific error message from registration
        setError(result.message || 'Registration failed. Please try again.')
      }
    } catch (err) {
      console.error(err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  const handleSocialLogin = async (provider: string) => {
    setSocialLoading(provider)
    
    try {
      // In a real implementation, this would use OAuth flow
      // For demo, we're simulating social login with mock data
      const mockUserData = {
        name: `${provider} User`,
        email: `${provider.toLowerCase()}user@example.com`,
      }
      
      const success = await socialLogin(provider, mockUserData)
      
      if (success) {
        router.push("/")
      } else {
        setError(`${provider} registration failed`)
      }
    } catch (err) {
      console.error(err)
      setError(`An error occurred during ${provider} registration`)
    } finally {
      setSocialLoading(null)
    }
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
              <span className="text-yellow-500">Taxi</span> Registration
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-600 md:text-xl">
              Create an account to start booking taxi rides and save your favorite destinations.
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
                <label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
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
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="terms" 
                  checked={agreed}
                  onCheckedChange={(checked) => setAgreed(checked as boolean)}
                  required
                />
                <label
                  htmlFor="terms"
                  className="text-sm text-gray-600"
                >
                  I agree to the{" "}
                  <Link href="/terms" className="text-yellow-600 hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-yellow-600 hover:underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-yellow-500 hover:bg-yellow-600"
                disabled={loading || !agreed}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or sign up with</span>
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
              
              <div className="text-center text-sm text-gray-500">
                Already have an account?{" "}
                <Link href="/login" className="text-yellow-600 hover:underline font-medium">
                  Sign In
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
} 