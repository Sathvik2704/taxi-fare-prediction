"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { TaxiNav } from "@/components/taxi-nav"
import { useAuth } from "@/lib/auth-context"
import { FaTaxi, FaLocationArrow, FaMapMarkerAlt } from "react-icons/fa"

// Mock bookings data
const mockBookings = [
  {
    id: "1",
    date: "May 15, 2024",
    time: "10:30 AM",
    pickup: "Mumbai Airport",
    dropoff: "Andheri West",
    distance: "12.5 km",
    fare: "₹350",
    status: "completed",
  },
  {
    id: "2",
    date: "May 10, 2024",
    time: "3:15 PM",
    pickup: "Bandra Station",
    dropoff: "BKC Complex",
    distance: "6.8 km",
    fare: "₹210",
    status: "completed",
  },
  {
    id: "3",
    date: "May 5, 2024",
    time: "9:00 PM",
    pickup: "Marine Drive",
    dropoff: "Worli Sea Face",
    distance: "8.2 km",
    fare: "₹245",
    status: "completed",
  },
]

const handleSocialLogin = (provider: string) => {
  window.location.href = `/api/auth/${provider.toLowerCase()}`;
};

export default function Bookings() {
  const { user, loading } = useAuth()
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
          <div className="w-full max-w-3xl">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
              <Button 
                onClick={() => router.push("/")}
                className="bg-yellow-500 hover:bg-yellow-600"
              >
                Book New Taxi
              </Button>
            </div>
            
            {mockBookings.length > 0 ? (
              <div className="space-y-4">
                {mockBookings.map((booking) => (
                  <div 
                    key={booking.id}
                    className="bg-white rounded-lg border shadow-sm p-4 transition-all hover:shadow-md"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="bg-yellow-100 p-2 rounded-full">
                          <FaTaxi className="text-yellow-500" />
                        </div>
                        <span className="font-medium">{booking.date} • {booking.time}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{booking.fare}</div>
                        <div className="text-sm text-gray-500">{booking.distance}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-start gap-3">
                        <FaLocationArrow className="mt-1 text-green-600 min-w-[16px]" />
                        <div>
                          <div className="text-sm text-gray-500">Pickup</div>
                          <div>{booking.pickup}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <FaMapMarkerAlt className="mt-1 text-red-600 min-w-[16px]" />
                        <div>
                          <div className="text-sm text-gray-500">Dropoff</div>
                          <div>{booking.dropoff}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex justify-end">
                      <Button 
                        variant="link" 
                        className="text-yellow-600"
                        onClick={() => alert(`Booking details for ride ${booking.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-white rounded-lg border">
                <div className="text-gray-500">No bookings found</div>
                <Button 
                  onClick={() => router.push("/")}
                  className="mt-4 bg-yellow-500 hover:bg-yellow-600"
                >
                  Book Your First Taxi
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
} 