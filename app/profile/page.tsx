"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { TaxiNav } from "@/components/taxi-nav"
import { useAuth } from "@/lib/auth-context"
import { FaUser, FaEnvelope } from "react-icons/fa"

export default function Profile() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()

  // Protect this page
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [loading, user, router])

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-yellow-50 to-yellow-100 py-12 flex items-center justify-center">
        <div className="text-yellow-500">Loading...</div>
      </main>
    )
  }

  if (!user) {
    return null
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-yellow-50 to-yellow-100 py-12 overflow-hidden relative">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-20 bg-yellow-400 skew-y-3 transform -translate-y-10 z-0"></div>
      <div className="absolute bottom-0 right-0 w-full h-20 bg-yellow-400 skew-y-3 transform translate-y-10 z-0"></div>

      {/* Nav links */}
      <TaxiNav />

      <div className="container px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center space-y-8">
          <div className="w-full max-w-md rounded-lg border bg-white p-6 shadow-xl">
            <div className="flex flex-col items-center pb-6 mb-6 border-b border-gray-200">
              <div className="h-24 w-24 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-500 text-3xl mb-4">
                <FaUser />
              </div>
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <div className="flex items-center mt-2 text-gray-600">
                <FaEnvelope className="mr-2" />
                <span>{user.email}</span>
              </div>
              {user.provider && (
                <div className="mt-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {user.provider} Account
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-medium mb-2">Account Details</h2>
                <div className="bg-gray-50 p-4 rounded">
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <span className="text-sm text-gray-500">User ID:</span>
                      <p className="font-medium">{user.id}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Member Since:</span>
                      <p className="font-medium">May 2024</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-lg font-medium mb-2">Account Actions</h2>
                <div className="space-y-2">
                  <Button 
                    onClick={() => router.push("/")} 
                    className="w-full bg-yellow-500 hover:bg-yellow-600"
                  >
                    Book a Taxi
                  </Button>
                  <Button 
                    onClick={logout}
                    variant="outline" 
                    className="w-full text-red-600 hover:bg-red-50"
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
} 