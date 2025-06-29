"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TaxiNav } from "@/components/taxi-nav"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { calculateFare, VehicleType, vehicleTypes } from "@/lib/utils"

// Mock data generator for visualization
const generateFareData = (baseFare: number, type: 'time' | 'day') => {
  if (type === 'time') {
    return [
      { time: '6AM', fare: Math.round(baseFare * 1.1) }, // Morning rush
      { time: '9AM', fare: Math.round(baseFare * 0.9) }, // Regular hours
      { time: '12PM', fare: Math.round(baseFare * 0.85) }, // Lunch time
      { time: '3PM', fare: Math.round(baseFare * 0.9) }, // Regular hours
      { time: '6PM', fare: Math.round(baseFare * 1.2) }, // Evening rush
      { time: '9PM', fare: Math.round(baseFare * 1.15) }, // Late evening
      { time: '12AM', fare: Math.round(baseFare * 1.25) }, // Night
      { time: '3AM', fare: Math.round(baseFare * 1.3) }, // Late night
    ]
  } else {
    return [
      { day: 'Monday', fare: Math.round(baseFare * 1.0) },
      { day: 'Tuesday', fare: Math.round(baseFare * 0.95) },
      { day: 'Wednesday', fare: Math.round(baseFare * 0.95) },
      { day: 'Thursday', fare: Math.round(baseFare * 0.95) },
      { day: 'Friday', fare: Math.round(baseFare * 1.1) },
      { day: 'Saturday', fare: Math.round(baseFare * 0.85) }, // Weekend discount
      { day: 'Sunday', fare: Math.round(baseFare * 0.8) }, // Weekend discount
    ]
  }
}

const VEHICLE_TYPES = [
  { name: "Auto Rickshaw", baseFare: 70 },
  { name: "Mini Cab", baseFare: 100 },
  { name: "Sedan", baseFare: 150 },
  { name: "SUV", baseFare: 180 },
  { name: "Prime Sedan", baseFare: 150 },
]

export default function VisualizationPage() {
  const searchParams = useSearchParams()
  const [baseFare, setBaseFare] = useState<number>(0)
  const [pickup, setPickup] = useState<string>("")
  const [dropoff, setDropoff] = useState<string>("")
  const [vehicleType, setVehicleType] = useState<string>("")
  const [chartType, setChartType] = useState<'time' | 'day'>('time')
  const [chartData, setChartData] = useState<any[]>([])
  const [showAllCharts, setShowAllCharts] = useState(false)
  const [allChartsTab, setAllChartsTab] = useState<'time' | 'day'>('time')

  useEffect(() => {
    // Get parameters from URL
    const fare = searchParams.get('fare')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const vehicle = searchParams.get('vehicle')

    if (fare && from && to && vehicle) {
      setBaseFare(parseInt(fare))
      setPickup(from)
      setDropoff(to)
      setVehicleType(vehicle)
      setChartData(generateFareData(parseInt(fare), 'time'))
    }
  }, [searchParams])

  const handleChartTypeChange = (type: 'time' | 'day') => {
    setChartType(type)
    setChartData(generateFareData(baseFare, type))
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-100 py-12">
      <TaxiNav />
      
      <div className="container px-4 md:px-6 mx-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Visualization Chart Icon Button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="lg"
              aria-label="Show all vehicle charts"
              onClick={() => setShowAllCharts(true)}
              className="font-bold shadow-lg border-2 border-yellow-400 bg-yellow-100 hover:bg-yellow-200 transition-all duration-200 w-16 h-16 flex items-center justify-center"
              title="Show all vehicle fare charts"
            >
              {/* Bigger and more visible chart SVG icon */}
              <svg width="36" height="36" fill="none" viewBox="0 0 36 36" stroke="currentColor">
                <rect x="5" y="20" width="6" height="12" rx="2" fill="#f59e0b"/>
                <rect x="15" y="12" width="6" height="20" rx="2" fill="#fbbf24"/>
                <rect x="25" y="4" width="6" height="28" rx="2" fill="#fde68a"/>
              </svg>
            </Button>
          </div>
          {/* All Vehicles Modal */}
          <Dialog open={showAllCharts} onOpenChange={setShowAllCharts}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>All Vehicle Types - Fare Charts</DialogTitle>
              </DialogHeader>
              <div className="flex justify-end mb-2">
                <Tabs defaultValue={allChartsTab} className="w-1/2" onValueChange={(v) => setAllChartsTab(v as 'time' | 'day')}>
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="time">Time of Day</TabsTrigger>
                    <TabsTrigger value="day">Days of Week</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(Object.keys(vehicleTypes) as VehicleType[]).map((type) => {
                  // Use the real fare calculation for each vehicle type
                  // Ensure vehicleType is valid for distance estimation
                  const validVehicleType = (vehicleType && vehicleTypes[vehicleType as VehicleType]) ? vehicleType as VehicleType : 'mini';
                  const referenceFare = calculateFare(validVehicleType, 10, 'day', 2);
                  const distance = baseFare > 0 && referenceFare > 0 ? (baseFare / referenceFare) * 10 : 10;
                  const fare = calculateFare(
                    type,
                    distance,
                    'day', // You can enhance this to use the actual time if available
                    2 // Default passengers, or use actual if available
                  );
                  return (
                    <Card key={type} className="p-4">
                      <h3 className="font-semibold mb-2 text-center">{vehicleTypes[type].name}</h3>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={generateFareData(fare, allChartsTab)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey={allChartsTab === 'time' ? 'time' : 'day'} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line 
                              type="monotone" 
                              dataKey="fare" 
                              stroke="#f59e0b" 
                              strokeWidth={2}
                              dot={{ fill: "#f59e0b", strokeWidth: 2 }}
                              activeDot={{ r: 8 }}
                              name="Fare (₹)"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </DialogContent>
          </Dialog>

          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Fare Analysis</h1>
            <p className="text-gray-600">
              {pickup} → {dropoff}
            </p>
            <p className="text-sm text-gray-500">
              Vehicle Type: {vehicleType}
            </p>
          </div>

          {/* Chart Type Selector */}
          <Card className="p-4">
            <Tabs defaultValue="time" className="w-full" onValueChange={(value) => handleChartTypeChange(value as 'time' | 'day')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="time">Time of Day</TabsTrigger>
                <TabsTrigger value="day">Days of Week</TabsTrigger>
              </TabsList>
              <TabsContent value="time" className="mt-4">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="fare" 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        dot={{ fill: "#f59e0b", strokeWidth: 2 }}
                        activeDot={{ r: 8 }}
                        name="Fare (₹)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-center text-sm text-gray-600">
                  <p>Morning (6AM-9AM) and Night (9PM-6AM) hours typically have higher fares due to rush hours and night charges.</p>
                </div>
              </TabsContent>
              <TabsContent value="day" className="mt-4">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="fare" 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        dot={{ fill: "#f59e0b", strokeWidth: 2 }}
                        activeDot={{ r: 8 }}
                        name="Fare (₹)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-center text-sm text-gray-600">
                  <p>Weekends (Saturday-Sunday) typically have lower fares due to reduced demand and special weekend offers.</p>
                </div>
              </TabsContent>
            </Tabs>
          </Card>

          {/* Insights Card */}
          <Card className="p-6 bg-white">
            <h2 className="text-xl font-semibold mb-4">Fare Insights</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-yellow-500"></div>
                <div>
                  <h3 className="font-medium">Best Time to Travel</h3>
                  <p className="text-sm text-gray-600">
                    {chartType === 'time' 
                      ? "Mid-day hours (12PM-3PM) typically offer the lowest fares"
                      : "Weekends (Saturday-Sunday) offer the best rates with special discounts"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-red-500"></div>
                <div>
                  <h3 className="font-medium">Peak Hours</h3>
                  <p className="text-sm text-gray-600">
                    {chartType === 'time'
                      ? "Morning (6AM-9AM) and Evening (6PM-9PM) rush hours have higher fares"
                      : "Weekdays, especially Friday, tend to have higher fares due to business travel"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-green-500"></div>
                <div>
                  <h3 className="font-medium">Savings Tips</h3>
                  <p className="text-sm text-gray-600">
                    {chartType === 'time'
                      ? "Consider traveling during off-peak hours (12PM-3PM) for better rates"
                      : "Plan weekend travel to take advantage of lower weekend fares"}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  )
} 