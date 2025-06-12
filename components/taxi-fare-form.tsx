"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { MapPinIcon, TargetIcon, UsersIcon, ClockIcon, CalculatorIcon, CarFrontIcon, ExternalLinkIcon } from "lucide-react"
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
  const [pickupCoords, setPickupCoords] = useState<{lat: number, lng: number} | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<{lat: number, lng: number} | null>(null);
  const [showPlatformLinks, setShowPlatformLinks] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  
  const pickupInputRef = useRef<HTMLInputElement>(null);
  const dropoffInputRef = useRef<HTMLInputElement>(null);
  
  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (typeof window !== "undefined" && window.google && window.google.maps && pickupInputRef.current && dropoffInputRef.current) {
      // Pickup location autocomplete
      const pickupAutocomplete = new window.google.maps.places.Autocomplete(pickupInputRef.current, {
        componentRestrictions: { country: "in" },
        fields: ["geometry", "formatted_address", "name"]
      });
      
      pickupAutocomplete.addListener("place_changed", () => {
        const place = pickupAutocomplete.getPlace();
        if (place.geometry && place.geometry.location) {
          setPickupCoords({
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          });
          setFormData((prev) => ({ ...prev, pickupLocation: place.formatted_address || place.name || "" }));
        }
      });
      
      // Dropoff location autocomplete
      const dropoffAutocomplete = new window.google.maps.places.Autocomplete(dropoffInputRef.current, {
        componentRestrictions: { country: "in" },
        fields: ["geometry", "formatted_address", "name"]
      });
      
      dropoffAutocomplete.addListener("place_changed", () => {
        const place = dropoffAutocomplete.getPlace();
        if (place.geometry && place.geometry.location) {
          setDropoffCoords({
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          });
          setFormData((prev) => ({ ...prev, dropoffLocation: place.formatted_address || place.name || "" }));
        }
      });
    }
  }, []);
  
  // Fallback if Google Places API doesn't load
  useEffect(() => {
    const checkGoogleApiLoaded = setTimeout(() => {
      if (typeof window !== "undefined" && (!window.google || !window.google.maps)) {
        console.warn("Google Maps API not loaded. Using fallback location handling.");
      }
    }, 3000);
    
    return () => clearTimeout(checkGoogleApiLoaded);
  }, []);
  
  // Add CSS for the location dropdown styling
  useEffect(() => {
    // Add custom styling for the Google Places Autocomplete dropdown
    const style = document.createElement('style');
    style.innerHTML = `
      .pac-container {
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        border: 1px solid #e2e8f0;
        font-family: inherit;
        margin-top: 4px;
      }
      .pac-item {
        padding: 8px 12px;
        cursor: pointer;
      }
      .pac-item:hover {
        background-color: #f7fafc;
      }
      .pac-item-selected {
        background-color: #edf2f7;
      }
      .pac-icon {
        margin-right: 8px;
      }
      .pac-matched {
        font-weight: 600;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // Create deep links to ride-hailing services
  const generateDeepLinks = () => {
    if (!pickupCoords || !dropoffCoords) return null;
    
    // Format coordinates properly (platforms often require specific decimal precision)
    const formatCoord = (coord: number) => coord.toFixed(6);
    
    // Uber deep link - using their mobile web format
    const uberLink = `https://m.uber.com/ul/?action=setPickup&pickup=${formatCoord(pickupCoords.lat)},${formatCoord(pickupCoords.lng)}&pickupname=${encodeURIComponent(formData.pickupLocation)}&dropoff=${formatCoord(dropoffCoords.lat)},${formatCoord(dropoffCoords.lng)}&dropoffname=${encodeURIComponent(formData.dropoffLocation)}`;
    
    // Ola deep link - they use a different format
    const olaLink = `https://book.olacabs.com/?pickup_lat=${formatCoord(pickupCoords.lat)}&pickup_lng=${formatCoord(pickupCoords.lng)}&pickup_name=${encodeURIComponent(formData.pickupLocation)}&drop_lat=${formatCoord(dropoffCoords.lat)}&drop_lng=${formatCoord(dropoffCoords.lng)}&drop_name=${encodeURIComponent(formData.dropoffLocation)}`;
    
    // Rapido deep link - direct to the main site as their deep linking may not support parameters
    const rapidoLink = `https://www.rapido.bike/`;
    
    return { olaLink, uberLink, rapidoLink };
  };

  // Handle opening deep links in a more reliable way
  const handleDeepLinkClick = (platform: string, url: string | undefined) => {
    if (!url) return;
    
    // Track this click for analytics (optional)
    console.log(`Opening ${platform} deep link`);
    
    // For mobile devices, try to open the app first
    if (typeof window !== "undefined") {
      // Open in new tab - most reliable cross-platform way
      window.open(url, '_blank');
    }
  };

  const copyToClipboard = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      alert("Link copied to clipboard!");
    }
  };

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

      // More realistic tiered per km rate based on distance
      let perKmRate = selectedVehicle.perKmRate
      if (d > 50) {
        perKmRate *= 0.75 // 25% discount for very long distances (>50 km)
      } else if (d > 25) {
        perKmRate *= 0.85 // 15% discount for long distances (>25 km)
      } else if (d > 10) {
        perKmRate *= 0.95 // 5% discount for medium distances (>10 km)
      }
      
      // Time of day factor - more realistic surge pricing
      let timeMultiplier = 1.0
      if (formData.time === "night") {
        // Night time pricing (higher for safety & lower supply)
        timeMultiplier = 1.25
      }

      // Traffic congestion estimation based on time of day and passenger count
      const passengerCount = parseInt(formData.passengers)
      const passengerFactor = 1 + (passengerCount > 3 ? 0.05 : 0) // Slight increase for more passengers
      
      // Apply dynamic pricing based on vehicle type
      const vehicleDemandFactor = 
        formData.vehicleType === "auto" ? 0.95 :
        formData.vehicleType === "mini" ? 1.0 :
        formData.vehicleType === "sedan" ? 1.05 :
        formData.vehicleType === "suv" ? 1.10 :
        formData.vehicleType === "prime" ? 1.15 : 1.0
      
      // GST and other taxes (5% for cab services in India)
      const taxRate = 0.05
      
      // Base fare calculation
      const baseFare = baseRate + (d * perKmRate)
      
      // Apply time and surge factors
      const withSurge = baseFare * timeMultiplier * passengerFactor * vehicleDemandFactor
      
      // Add tax
      const withTax = withSurge * (1 + taxRate)
      
      // Round to nearest 5 rupees (common practice in India)
      const fare = Math.ceil(withTax / 5) * 5

      // No more randomness!
      const finalFare = fare

      await new Promise((resolve) => setTimeout(resolve, 1000))
      setPrediction(finalFare)
      setShowPlatformLinks(true) // Enable platform links after calculation

      // Store search history for user
      if (user && formData.pickupLocation && formData.dropoffLocation) {
        try {
          const response = await fetch(`${API_URL}/search-history`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user: user.email,
              pickup: formData.pickupLocation,
              dropoff: formData.dropoffLocation
            })
          });

          if (!response.ok) {
            throw new Error('Failed to save search history');
          }
        } catch (error) {
          console.error('Error saving search history:', error);
        }
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
            ref={pickupInputRef}
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
            ref={dropoffInputRef}
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

      {prediction !== null && showPlatformLinks && pickupCoords && dropoffCoords && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <Card className="p-6 mt-4 bg-white border-gray-200 shadow-md">
            <h3 className="text-lg font-medium text-center mb-4">Compare with other platforms</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-bold">U</div>
                  <div>
                    <span className="font-medium">Uber</span>
                    <div className="text-sm text-gray-600">
                      Estimated: ₹{Math.round(prediction * 0.85)}-{Math.round(prediction * 1.15)}
                    </div>
                  </div>
                </div>
                <a 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    const links = generateDeepLinks();
                    if (links) handleDeepLinkClick('uber', links.uberLink);
                  }}
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-1"
                >
                  Check <ExternalLinkIcon className="h-4 w-4" />
                </a>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">O</div>
                  <div>
                    <span className="font-medium">Ola</span>
                    <div className="text-sm text-gray-600">
                      Estimated: ₹{Math.round(prediction * 0.9)}-{Math.round(prediction * 1.2)}
                    </div>
                  </div>
                </div>
                <a 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    const links = generateDeepLinks();
                    if (links) handleDeepLinkClick('ola', links.olaLink);
                  }}
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                >
                  Check <ExternalLinkIcon className="h-4 w-4" />
                </a>
              </div>
              
              {/* Only show Rapido for auto, as it's mainly bike taxis */}
              {/* Show Rapido for all vehicle types */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold">R</div>
                  <div>
                    <span className="font-medium">Rapido</span>
                    <div className="text-sm text-gray-600">
                      Estimated: ₹{Math.round(prediction * 0.7)}-{Math.round(prediction * 0.9)}
                    </div>
                    {formData.vehicleType !== "auto" && (
                      <div className="text-xs text-orange-600 font-medium">
                        Note: Rapido mostly offers bike taxis
                      </div>
                    )}
                  </div>
                </div>
                <a 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    const links = generateDeepLinks();
                    if (links) handleDeepLinkClick('rapido', links.rapidoLink);
                  }}
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center gap-1"
                >
                  Check <ExternalLinkIcon className="h-4 w-4" />
                </a>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-center">
                These links take you directly to each platform with your trip details pre-filled
              </p>
              <p className="text-xs text-gray-500 mt-1 text-center">
                Actual fares may vary based on demand, traffic, and promotions
              </p>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Debug info section */}
      {process.env.NODE_ENV !== "production" && (
        <div className="mt-4 border-t border-dashed border-gray-200 pt-4">
          <button 
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            className="w-full text-xs text-gray-500 hover:text-gray-700"
          >
            {showDebugInfo ? "Hide Debug Info" : "Show Debug Info"}
          </button>
          
          {showDebugInfo && (
            <div className="mt-2 space-y-2 text-xs">
              <div>
                <div className="font-medium">Uber Link:</div>
                <div className="flex items-center gap-2">
                  <div className="bg-gray-100 p-1 rounded overflow-x-auto max-w-full">
                    {generateDeepLinks()?.uberLink || "No link generated"}
                  </div>
                  <button 
                    onClick={() => generateDeepLinks()?.uberLink && copyToClipboard(generateDeepLinks()?.uberLink || "")}
                    className="p-1 bg-gray-200 hover:bg-gray-300 rounded"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div>
                <div className="font-medium">Ola Link:</div>
                <div className="flex items-center gap-2">
                  <div className="bg-gray-100 p-1 rounded overflow-x-auto max-w-full">
                    {generateDeepLinks()?.olaLink || "No link generated"}
                  </div>
                  <button 
                    onClick={() => generateDeepLinks()?.olaLink && copyToClipboard(generateDeepLinks()?.olaLink || "")}
                    className="p-1 bg-gray-200 hover:bg-gray-300 rounded"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div>
                <div className="font-medium">Rapido Link:</div>
                <div className="flex items-center gap-2">
                  <div className="bg-gray-100 p-1 rounded overflow-x-auto max-w-full">
                    {generateDeepLinks()?.rapidoLink || "No link generated"}
                  </div>
                  <button 
                    onClick={() => generateDeepLinks()?.rapidoLink && copyToClipboard(generateDeepLinks()?.rapidoLink || "")}
                    className="p-1 bg-gray-200 hover:bg-gray-300 rounded"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <p className="italic text-xs text-gray-500 mt-2">If links don't work, please copy and paste them directly into your browser.</p>
            </div>
          )}
        </div>
      )}
    </form>
  )
}
