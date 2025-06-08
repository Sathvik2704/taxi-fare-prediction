"use client"

import type React from "react"
import { useState } from "react"
import { MapPinIcon, TargetIcon, UsersIcon, ClockIcon, CalculatorIcon, CarFrontIcon } from "lucide-react"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { calculateDistance } from "@/lib/maps-service"
import { MapPreview } from "@/components/map-preview"
import { useAuth } from "@/lib/auth-context"

type VehicleType = "auto" | "mini" | "sedan" | "suv" | "prime"

interface VehicleInfo {
  name: string
  baseRate: number
  perKmRate: number
  capacity: number
  description: string
}

const vehicleTypes: Record<VehicleType, VehicleInfo> = {
  auto: {
    name: "Auto Rickshaw",
    baseRate: 35,
    perKmRate: 11,
    capacity: 3,
    description: "3-wheeler auto rickshaw, ideal for short trips"
  },
  mini: {
    name: "Mini Cab",
    baseRate: 50,
    perKmRate: 12,
    capacity: 4,
    description: "Compact car like Wagon R, Alto, etc."
  },
  sedan: {
    name: "Sedan",
    baseRate: 80,
    perKmRate: 14,
    capacity: 4,
    description: "Sedan like Swift Dzire, Honda Amaze, etc."
  },
  suv: {
    name: "SUV",
    baseRate: 120,
    perKmRate: 18,
    capacity: 6,
    description: "SUV like Ertiga, Innova, etc."
  },
  prime: {
    name: "Prime Sedan",
    baseRate: 150,
    perKmRate: 20,
    capacity: 4,
    description: "Premium sedans like Honda City, Hyundai Verna, etc."
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function TaxiFareForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [prediction, setPrediction] = useState<number | null>(null)
  const [mapVisible, setMapVisible] = useState(false)
  const [distance, setDistance] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    pickupLocation: "",
    dropoffLocation: "",
    passengers: "2",
    time: "day",
    vehicleType: "mini" as VehicleType
  })
  const { user } = useAuth()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (prediction !== null) setPrediction(null)
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (prediction !== null) setPrediction(null)
    
    // If passenger count changes, suggest an appropriate vehicle
    if (name === "passengers") {
      const passengerCount = parseInt(value)
      let suggestedVehicle: VehicleType = "mini"
      
      if (passengerCount > 4) {
        suggestedVehicle = "suv"
      } else if (passengerCount > 3) {
        suggestedVehicle = "sedan"
      } else if (passengerCount <= 3) {
        suggestedVehicle = "mini"
      }
      
      setFormData(prev => ({ ...prev, vehicleType: suggestedVehicle }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMapVisible(true)

    try {
      if (!formData.pickupLocation.trim() || !formData.dropoffLocation.trim()) {
        throw new Error("Please enter both pickup and dropoff locations")
      }

      const distanceResult = await calculateDistance(formData.pickupLocation, formData.dropoffLocation)
      setDistance(distanceResult)

      // --- Indian pricing algorithm ---
      const selectedVehicle = vehicleTypes[formData.vehicleType]
      const baseRate = selectedVehicle.baseRate
      const d = distanceResult

      // Tiered per km rate based on distance
      let perKmRate = selectedVehicle.perKmRate
      if (d > 30) perKmRate *= 0.8 // 20% discount for long distances
      else if (d > 15) perKmRate *= 0.9 // 10% discount for medium distances
      
      // Time of day factor
      const timeMultiplier = formData.time === "night" ? 1.5 : 1

      // GST and other taxes (5% for cab services in India)
      const taxRate = 0.05
      
      // Calculate subtotal
      const subtotal = baseRate + d * perKmRate
      
      // Apply time multiplier
      const withTimeMultiplier = subtotal * timeMultiplier
      
      // Add tax
      const withTax = withTimeMultiplier * (1 + taxRate)
      
      // Round to nearest 5 rupees (common practice in India)
      const fare = Math.ceil(withTax / 5) * 5
      
      // Add slight randomness to simulate real-world pricing variations
      const finalFare = Math.round(fare * (1 + (Math.random() * 0.05))) 

      await new Promise((resolve) => setTimeout(resolve, 1000))
      setPrediction(finalFare)

      // Store search history for user
      if (user && formData.pickupLocation && formData.dropoffLocation) {
        await fetch(`${API_URL}/search-history`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user: user.email,
            search: `pickup: ${formData.pickupLocation}, dropoff: ${formData.dropoffLocation}`
          })
        })
      }
    } catch (error) {
      console.error("Error predicting fare:", error)
      alert("Could not calculate fare. Please check the addresses and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="pickupLocation" className="flex items-center gap-2">
            <MapPinIcon className="h-4 w-4 text-yellow-500" />
            Pickup Location
          </Label>
          <Input
            id="pickupLocation"
            name="pickupLocation"
            placeholder="Enter area or landmark (e.g., Connaught Place, Delhi)"
            value={formData.pickupLocation}
            onChange={handleChange}
            className="transition-all duration-200 focus:ring-2 focus:ring-yellow-500"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="dropoffLocation" className="flex items-center gap-2">
            <TargetIcon className="h-4 w-4 text-yellow-500" />
            Dropoff Location
          </Label>
          <Input
            id="dropoffLocation"
            name="dropoffLocation"
            placeholder="Enter area or landmark (e.g., Cyber City, Gurgaon)"
            value={formData.dropoffLocation}
            onChange={handleChange}
            className="transition-all duration-200 focus:ring-2 focus:ring-yellow-500"
            required
          />
        </div>

        {/* Account Details Button Row (if present) */}
        <div className="flex items-center gap-2">
          {/* ...other buttons or content here, e.g. Account Details button... */}
        </div>
        {/* Fare Comparison Links - directly below the account details button */}
        {user && (
          <div className="mt-2 flex flex-col items-start gap-1">
            <span className="text-xs text-gray-600 font-semibold">Check fares on other platforms:</span>
            <div className="flex gap-3">
              <a href="https://www.rapido.bike/" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">Rapido</a>
              <a href="https://www.olacabs.com/" target="_blank" rel="noopener noreferrer" className="text-green-700 hover:underline">Ola</a>
              <a href="https://www.uber.com/" target="_blank" rel="noopener noreferrer" className="text-black hover:underline">Uber</a>
            </div>
            <span className="text-[10px] text-gray-400">Fares may vary based on demand, traffic, and time of day.</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="passengers" className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4 text-yellow-500" />
              Passengers
            </Label>
            <Select value={formData.passengers} onValueChange={(value) => handleSelectChange("passengers", value)}>
              <SelectTrigger id="passengers" className="transition-all duration-200 focus:ring-2 focus:ring-yellow-500">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6].map((val) => (
                  <SelectItem key={val} value={val.toString()}>
                    {val}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="time" className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-yellow-500" />
              Time of Day
            </Label>
            <Select value={formData.time} onValueChange={(value) => handleSelectChange("time", value)}>
              <SelectTrigger id="time" className="transition-all duration-200 focus:ring-2 focus:ring-yellow-500">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day (6AM - 10PM)</SelectItem>
                <SelectItem value="night">Night (10PM - 6AM)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="vehicleType" className="flex items-center gap-2">
            <CarFrontIcon className="h-4 w-4 text-yellow-500" />
            Vehicle Type
          </Label>
          <Select value={formData.vehicleType} onValueChange={(value) => handleSelectChange("vehicleType", value as VehicleType)}>
            <SelectTrigger id="vehicleType" className="transition-all duration-200 focus:ring-2 focus:ring-yellow-500">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(vehicleTypes) as VehicleType[]).map((type) => (
                <SelectItem key={type} value={type}>
                  {vehicleTypes[type].name} ({vehicleTypes[type].capacity} passengers)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-1">
            {vehicleTypes[formData.vehicleType].description}
          </p>
        </div>
      </div>

      {mapVisible && formData.pickupLocation && formData.dropoffLocation && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.5 }}
          className="overflow-hidden rounded-lg"
        >
          <MapPreview origin={formData.pickupLocation} destination={formData.dropoffLocation} />
        </motion.div>
      )}

      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          type="submit"
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 transition-all duration-300 shadow-md hover:shadow-lg"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Calculating...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <CalculatorIcon className="h-5 w-5" />
              Predict Fare
            </span>
          )}
        </Button>
      </motion.div>

      {prediction !== null && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="p-6 bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200 shadow-lg">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-800">Estimated Fare</h3>
              <div className="flex items-center justify-center gap-2 my-2">
                <span className="text-4xl font-bold text-yellow-600">₹{prediction}</span>
                {distance && (
                  <span className="text-sm bg-yellow-200 px-2 py-1 rounded-full text-yellow-800">
                    {distance.toFixed(1)} km
                  </span>
                )}
              </div>
              <div className="flex justify-center items-center mt-2">
                <span className="text-sm bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                  {vehicleTypes[formData.vehicleType].name}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-3">
                This is an estimate. Actual fare may vary based on traffic, route, and waiting time.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                All fares include 5% GST as per Indian regulations.
              </p>
            </div>
          </Card>
        </motion.div>
      )}
    </form>
  )
}
