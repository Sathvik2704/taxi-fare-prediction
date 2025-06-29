"use client"

import { useEffect, useState } from "react"
import { TaxiFareForm } from "@/components/taxi-fare-form"
import { TaxiAnimation } from "@/components/taxi-animation"
import { TaxiNav } from "@/components/taxi-nav"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { jwtDecode } from "jwt-decode"

const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

export default function Home() {
  const { user, loading, authenticatedFetch } = useAuth()
  const router = useRouter()
  const [responsesOpen, setResponsesOpen] = useState(false);
  const [adminResponses, setAdminResponses] = useState<any[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Check for admin JWT only on client
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem("admin-token");
    if (!token) {
      setIsAdmin(false);
      return;
    }
    try {
      const decoded: any = jwtDecode(token);
      if (decoded.role === "admin" && (!decoded.exp || Date.now() < decoded.exp * 1000)) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch {
      setIsAdmin(false);
    }
  }, []);
  
  // Extra verification that this page is protected
  useEffect(() => {
    if (mounted && !loading && !user && !isAdmin) {
      router.push("/login")
    }
  }, [mounted, loading, user, isAdmin, router])
  
  // While loading, show minimal content
  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-yellow-50 to-yellow-100 py-12 flex items-center justify-center">
        <div className="text-yellow-500">Loading...</div>
      </main>
    )
  }
  
  // If no user and not loading, don't render content (will redirect via effect)
  if (!user) {
    return null
  }

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-100 py-12 overflow-hidden relative">
      {/* Indian-themed decorative elements */}
      <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-r from-orange-400 via-yellow-500 to-orange-400 skew-y-3 transform -translate-y-10 z-0"></div>
      <div className="absolute bottom-0 right-0 w-full h-20 bg-gradient-to-r from-orange-400 via-yellow-500 to-orange-400 skew-y-3 transform translate-y-10 z-0"></div>

      {/* Nav links */}
      <TaxiNav />
      
      <div className="container px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center space-y-8 text-center">
          {/* IndiaTaxiFare logo and subtitle */}
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center border-4 border-yellow-400 mb-2">
              <TaxiAnimation />
            </div>
            <div className="text-xl font-bold text-gray-900">India <span className="text-orange-600">Taxi</span><span className="text-yellow-500">Fare</span></div>
            <div className="text-xs font-bold text-gray-500 mt-1 tracking-wide">THE BETTER WAY TO TRAVEL</div>
          </div>
          <div className="text-lg font-extrabold text-yellow-700 tracking-wide mb-2" style={{ letterSpacing: '0.05em' }}>KNOW YOUR FARE BEFORE YOU GO</div>

          <div className="w-full max-w-md rounded-lg border bg-white p-6 shadow-xl transition-all duration-300 hover:shadow-2xl animate-slide-up">
            <TaxiFareForm />
          </div>

          {/* View Admin Responses Button */}
          {user && (
            <Dialog open={responsesOpen} onOpenChange={setResponsesOpen}>
              <DialogTrigger asChild>
                <Button
                  className="mt-4 bg-blue-500 hover:bg-blue-600 text-white"
                  onClick={async () => {
                    setLoadingResponses(true);
                    setResponsesOpen(true);
                    try {
                      const res = await authenticatedFetch(`${API_URL}/user/admin-responses`);
                      if (res.ok) {
                        const data = await res.json();
                        setAdminResponses(data);
                      } else {
                        console.error('Failed to fetch admin responses:', res.status);
                        setAdminResponses([]);
                      }
                    } catch (error) {
                      console.error('Error fetching admin responses:', error);
                      setAdminResponses([]);
                    } finally {
                      setLoadingResponses(false);
                    }
                  }}
                >
                  View Admin Responses
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Admin Responses to Your Feedback</DialogTitle>
                </DialogHeader>
                {loadingResponses ? (
                  <div className="text-gray-500">Loading...</div>
                ) : adminResponses.length === 0 ? (
                  <div className="text-gray-500">No responses from admin yet.</div>
                ) : (
                  <ul className="space-y-3 max-h-64 overflow-y-auto">
                    {adminResponses.map((msg, i) => (
                      <li key={i} className="border-b pb-2">
                        <div className="text-gray-800">{msg.message}</div>
                        <div className="text-xs text-gray-400">{new Date(msg.date).toLocaleString()}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </DialogContent>
            </Dialog>
          )}

          {/* Cities Section */}
          <div className="text-sm text-gray-500 max-w-xl mt-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Famous Cities to Travel</h2>
            <p>Our service covers all major Indian cities and popular tourist destinations. Here are some of the most famous cities you can explore with us:</p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center mt-2">
            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">Delhi NCR</span>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Mumbai</span>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Bangalore</span>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Chennai</span>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">Hyderabad</span>
            <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-medium">Kolkata</span>
            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Pune</span>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">Ahmedabad</span>
            <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">Jaipur</span>
            <span className="px-3 py-1 bg-lime-100 text-lime-700 rounded-full text-xs font-medium">Goa</span>
            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">Varanasi</span>
            <span className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-xs font-medium">Agra</span>
            <span className="px-3 py-1 bg-fuchsia-100 text-fuchsia-700 rounded-full text-xs font-medium">Udaipur</span>
            <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-medium">Mysore</span>
            <span className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-xs font-medium">Amritsar</span>
          </div>

          {/* About Section */}
          <div className="space-y-2 animate-fade-in mt-10">
  <h2 className="text-2xl font-bold text-gray-900">About This Website</h2>
  <p className="mx-auto max-w-[700px] text-gray-600 md:text-lg">
    India Taxi Fare is your one-stop solution for estimating taxi fares across major Indian cities. Whether you're planning a trip, comparing prices, or just curious, our platform provides quick and accurate fare predictions based on real-world data. Enjoy a seamless experience, easy booking, and discover the best way to travel in India!
  </p>
</div>
        </div>
      </div>
    </main>
  )
}