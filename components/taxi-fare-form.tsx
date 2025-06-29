"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { MapPinIcon, TargetIcon, UsersIcon, ClockIcon, CalculatorIcon, CarFrontIcon, ExternalLinkIcon, BarChart3Icon } from "lucide-react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { FaLocationArrow, FaMapMarkerAlt } from "react-icons/fa"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { calculateDistance } from "@/lib/maps-service"
import { MapPreview } from "@/components/map-preview"
import { useAuth } from "@/lib/auth-context"
import { calculateFare, VehicleType, vehicleTypes } from "@/lib/utils"

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Add type for fare app data
type FareAppData = {
  min: number;
  max: number;
  name: string;
  link: string | undefined;
  key: string;
}

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
  
  const router = useRouter()
  const { toast } = useToast();
  const { authenticatedFetch } = useAuth();
  const [vehicleRec, setVehicleRec] = useState<{ type: VehicleType; reason: string } | null>(null);
  const [platformRec, setPlatformRec] = useState<{ platform: keyof typeof platformInfos; reason: string } | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropoffSuggestions, setShowDropoffSuggestions] = useState(false);
  const [savedAddressesLoading, setSavedAddressesLoading] = useState(false);
  
  // Platform info for recommendation (must be inside component for generateDeepLinks)
  const platformInfos = {
    uber: {
      name: "Uber",
      features: ["UberGo", "Premier", "UberXL", "Uber Black"],
      link: () => generateDeepLinks()?.uberLink,
      description: "Best for reliability, global coverage, business travel",
    },
    ola: {
      name: "Ola",
      features: ["Mini", "Prime", "Auto", "Bike"],
      link: () => generateDeepLinks()?.olaLink,
      description: "Best for local coverage, competitive pricing, auto rickshaws",
    },
    rapido: {
      name: "Rapido",
      features: ["Bike", "Auto", "Car"],
      link: () => generateDeepLinks()?.rapidoLink,
      description: "Best for budget travel, quick rides, bike taxis",
    },
  };

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
  
  // Fetch saved addresses when user is logged in
  useEffect(() => {
    const fetchSavedAddresses = async () => {
      if (!user?.email) {
        setSavedAddresses([]);
        setSavedAddressesLoading(false);
        return;
      }
      
      setSavedAddressesLoading(true);
      
      try {
        const token = localStorage.getItem("auth-token");
        if (!token) {
          console.log("No auth token available, skipping saved addresses fetch");
          setSavedAddresses([]);
          setSavedAddressesLoading(false);
          return;
        }

        const response = await authenticatedFetch(`${API_URL}/user/saved-addresses`);
        if (response.ok) {
          const data = await response.json();
          setSavedAddresses(data.savedAddresses || []);
        } else {
          setSavedAddresses([]);
        }
      } catch (error) {
        console.error('Error fetching saved addresses:', error);
        setSavedAddresses([]);
      } finally {
        setSavedAddressesLoading(false);
      }
    };

    fetchSavedAddresses();
  }, [user, authenticatedFetch]);

  // Function to get saved addresses by type
  const getSavedAddressesByType = (type: 'pickup' | 'dropoff') => {
    return savedAddresses.filter(addr => addr.type === type);
  };

  // Function to select a saved address
  const selectSavedAddress = (address: any, field: 'pickupLocation' | 'dropoffLocation') => {
    setFormData(prev => ({ ...prev, [field]: address.name }));
    setShowPickupSuggestions(false);
    setShowDropoffSuggestions(false);
  };

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

  // Add function to determine lowest fare app
  const getLowestFareApp = (prediction: number): FareAppData => {
    const fares: Record<string, Omit<FareAppData, 'key'>> = {
      rapido: {
        min: Math.round(prediction * 0.7),
        max: Math.round(prediction * 0.9),
        name: "Rapido",
        link: generateDeepLinks()?.rapidoLink
      },
      uber: {
        min: Math.round(prediction * 0.85),
        max: Math.round(prediction * 1.15),
        name: "Uber",
        link: generateDeepLinks()?.uberLink
      },
      ola: {
        min: Math.round(prediction * 0.9),
        max: Math.round(prediction * 1.2),
        name: "Ola",
        link: generateDeepLinks()?.olaLink
      }
    };

    // Find the app with the lowest minimum fare
    const lowestFareApp = Object.entries(fares).reduce<FareAppData>((lowest, [key, app]) => {
      const currentApp: FareAppData = { ...app, key };
      return app.min < lowest.min ? currentApp : lowest;
    }, { min: Infinity, max: Infinity, name: "", link: "", key: "" });

    return lowestFareApp;
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
      // Use distance if available for more accurate suggestion
      if (distance !== null) {
        if (passengerCount > 4) {
          suggestedVehicle = "suv"
        } else if (distance < 15 && (passengerCount === 2 || passengerCount === 3)) {
          suggestedVehicle = "auto"
        } else if (passengerCount > 3) {
          suggestedVehicle = "sedan"
        } else {
          suggestedVehicle = "mini"
        }
      } else {
        if (passengerCount > 4) {
          suggestedVehicle = "suv"
        } else if (passengerCount > 3) {
          suggestedVehicle = "sedan"
        } else {
          suggestedVehicle = "mini"
        }
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

      // Use shared fare calculation
      const passengerCount = parseInt(formData.passengers)
      const finalFare = calculateFare(
        formData.vehicleType as VehicleType,
        distanceResult,
        formData.time as 'day' | 'night',
        passengerCount
      )

      await new Promise((resolve) => setTimeout(resolve, 1000))
      setPrediction(finalFare)
      setShowPlatformLinks(true) // Enable platform links after calculation

      // Store search history for user
      if (user && formData.pickupLocation && formData.dropoffLocation) {
        try {
          const response = await authenticatedFetch(`${API_URL}/search-history`, {
            method: "POST",
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

      // Use the freshly calculated distanceResult for recommendations
      if (distanceResult !== null && !isNaN(distanceResult)) {
        const v = getRecommendedVehicle(distanceResult, parseInt(formData.passengers));
        setVehicleRec(v);
        const p = getRecommendedPlatform(distanceResult, v.type);
        setPlatformRec(p);
      } else {
        setVehicleRec(null);
        setPlatformRec(null);
      }
    } catch (error) {
      console.error("Error predicting fare:", error)
      alert("Could not calculate fare. Please check the addresses and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVisualizationClick = () => {
    if (prediction && formData.pickupLocation && formData.dropoffLocation) {
      const params = new URLSearchParams({
        fare: prediction.toString(),
        from: formData.pickupLocation,
        to: formData.dropoffLocation,
        vehicle: vehicleTypes[formData.vehicleType].name
      })
      router.push(`/visualization?${params.toString()}`)
    }
  }

  useEffect(() => {
    if (prediction !== null && distance !== null) {
      const v = getRecommendedVehicle(distance, parseInt(formData.passengers));
      setVehicleRec(v);
      const p = getRecommendedPlatform(distance, v.type);
      setPlatformRec(p);
    } else {
      setVehicleRec(null);
      setPlatformRec(null);
    }
  }, [prediction, distance, formData.passengers]);

  // Show map as soon as both locations are filled
  useEffect(() => {
    if (formData.pickupLocation.trim() && formData.dropoffLocation.trim()) {
      setMapVisible(true);
    } else {
      setMapVisible(false);
    }
  }, [formData.pickupLocation, formData.dropoffLocation]);

  // --- Recommendation Cards ---
  const renderVehicleRecommendation = () => {
    if (!vehicleRec) return null;
    const info = vehicleTypes[vehicleRec.type];
    return (
      <Card className="p-4 mt-4 bg-green-50 border-green-200">
        <div className="flex items-center gap-2">
          <CarFrontIcon className="h-5 w-5 text-green-600" />
          <h3 className="font-semibold text-green-800">Recommended Vehicle</h3>
        </div>
        <p className="mt-2 text-sm text-green-700">
          We recommend a <span className="font-semibold">{info.name}</span> for your journey.
        </p>
        <p className="text-sm text-green-600 mt-1">{vehicleRec.reason}</p>
      </Card>
    );
  };

  const renderPlatformRecommendation = () => {
    if (!platformRec) return null;
    const info = platformInfos[platformRec.platform];
    const link = info.link();
    return (
      <Card className="p-4 mt-4 bg-blue-50 border-blue-200">
        <div className="flex items-center gap-2">
          <ExternalLinkIcon className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-blue-800">Recommended Platform</h3>
        </div>
        <p className="mt-2 text-sm text-blue-700">
          We recommend booking through <span className="font-semibold">{info.name}</span> for your journey.
        </p>
        <p className="text-sm text-blue-600 mt-1">{platformRec.reason}</p>
        <div className="mt-3">
          <p className="text-xs text-blue-500 font-medium">Available Features:</p>
          <div className="flex flex-wrap gap-2 mt-1">
            {info.features.map((feature, i) => (
              <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{feature}</span>
            ))}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            Book Now <ExternalLinkIcon className="h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={() => {
              if (link) {
                navigator.clipboard.writeText(link);
                toast({ title: "Link copied!", description: `Booking link for ${info.name} copied to clipboard.` });
              }
            }}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 border border-blue-200 rounded px-2 py-1 bg-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            Copy Link
          </button>
        </div>
      </Card>
    );
  };

  // Vehicle recommendation logic
  function getRecommendedVehicle(distance: number | null, passengers: number): { type: VehicleType; reason: string } {
    if (!distance) return { type: "mini", reason: "Default recommendation" };
    if (passengers > 4) return { type: "suv", reason: "Recommended for more than 4 passengers (large group or family)" };
    if (distance < 15 && (passengers === 2 || passengers === 3)) {
      return { type: "auto", reason: "Recommended for 2 or 3 passengers and short trips (< 15km)" };
    }
    if (distance > 15) return { type: "sedan", reason: "Best for long trips, business travel, comfort" };
    if (distance > 5) return { type: "mini", reason: "Best for medium trips, small groups, city travel" };
    return { type: "auto", reason: "Best for short trips, budget travel, quick rides" };
  }

  // Platform recommendation logic
  function getRecommendedPlatform(distance: number | null, vehicleType: VehicleType): { platform: keyof typeof platformInfos; reason: string } {
    if (!distance) return { platform: "uber", reason: "Default recommendation" };
    if (vehicleType === "auto") return { platform: "ola", reason: "Best for auto rickshaws, local coverage" };
    if (distance > 15) return { platform: "uber", reason: "Best for reliability, global coverage, business travel" };
    if (distance <= 5) return { platform: "rapido", reason: "Best for budget travel, quick rides, bike taxis" };
    return { platform: "ola", reason: "Best for competitive pricing, local coverage" };
  }

  // Function to check if an address is already saved
  const isAddressSaved = (address: string, type: 'pickup' | 'dropoff') => {
    if (!savedAddresses || savedAddresses.length === 0) return false;
    
    return savedAddresses.some(
      saved => saved.address.toLowerCase() === address.toLowerCase() && saved.type === type
    );
  };

  // Function to save address manually
  const saveAddress = async (address: string, type: 'pickup' | 'dropoff') => {
    if (!user?.email || !address.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid address to save.",
        variant: "destructive",
      });
      return;
    }

    // Check if we have a valid token
    const token = localStorage.getItem("auth-token");
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save addresses.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await authenticatedFetch(`${API_URL}/saved-address`, {
        method: "POST",
        body: JSON.stringify({
          user: user.email,
          name: address,
          address: address,
          type: type
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `${type === 'pickup' ? 'Pickup' : 'Dropoff'} location saved successfully!`,
          variant: "default",
        });
        
        // Refresh saved addresses
        try {
          const addressesResponse = await authenticatedFetch(`${API_URL}/user/saved-addresses`);
          if (addressesResponse.ok) {
            const data = await addressesResponse.json();
            setSavedAddresses(data.savedAddresses || []);
          }
        } catch (refreshError) {
          console.error('Error refreshing saved addresses:', refreshError);
        }
      } else {
        const errorData = await response.json();
        if (errorData.error === 'Address already saved') {
          toast({
            title: "Already Saved",
            description: "This address is already in your saved addresses.",
            variant: "default",
          });
        } else {
          throw new Error(errorData.error || 'Failed to save address');
        }
      }
    } catch (error) {
      console.error('Error saving address:', error);
      toast({
        title: "Error",
        description: "Failed to save address. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="pickupLocation" className="flex items-center gap-2">
            <MapPinIcon className="h-4 w-4 text-yellow-500" />
            Pickup Location
          </Label>
          <div className="relative flex gap-2">
            <div className="flex-1 relative">
              <Input
                id="pickupLocation"
                name="pickupLocation"
                placeholder="Enter area or landmark (e.g., Connaught Place, Delhi)"
                value={formData.pickupLocation}
                onChange={handleChange}
                onFocus={() => setShowPickupSuggestions(true)}
                onBlur={() => setTimeout(() => setShowPickupSuggestions(false), 200)}
                ref={pickupInputRef}
                className="transition-all duration-200 focus:ring-2 focus:ring-yellow-500"
                required
              />
              {showPickupSuggestions && !savedAddressesLoading && getSavedAddressesByType('pickup').length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {getSavedAddressesByType('pickup').map((address) => (
                    <button
                      key={address._id}
                      type="button"
                      onClick={() => selectSavedAddress(address, 'pickupLocation')}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <FaLocationArrow className="text-green-600" />
                      <span>{address.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button
              type="button"
              onClick={() => saveAddress(formData.pickupLocation, 'pickup')}
              disabled={!formData.pickupLocation.trim() || isAddressSaved(formData.pickupLocation, 'pickup') || savedAddressesLoading}
              className={`px-3 ${
                isAddressSaved(formData.pickupLocation, 'pickup')
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600'
              } text-white`}
              title={isAddressSaved(formData.pickupLocation, 'pickup') ? 'Already saved' : 'Save pickup location'}
            >
              {savedAddressesLoading ? '...' : (isAddressSaved(formData.pickupLocation, 'pickup') ? 'Saved' : 'Save')}
            </Button>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="dropoffLocation" className="flex items-center gap-2">
            <TargetIcon className="h-4 w-4 text-yellow-500" />
            Dropoff Location
          </Label>
          <div className="relative flex gap-2">
            <div className="flex-1 relative">
              <Input
                id="dropoffLocation"
                name="dropoffLocation"
                placeholder="Enter area or landmark (e.g., Cyber City, Gurgaon)"
                value={formData.dropoffLocation}
                onChange={handleChange}
                onFocus={() => setShowDropoffSuggestions(true)}
                onBlur={() => setTimeout(() => setShowDropoffSuggestions(false), 200)}
                ref={dropoffInputRef}
                className="transition-all duration-200 focus:ring-2 focus:ring-yellow-500"
                required
              />
              {showDropoffSuggestions && !savedAddressesLoading && getSavedAddressesByType('dropoff').length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {getSavedAddressesByType('dropoff').map((address) => (
                    <button
                      key={address._id}
                      type="button"
                      onClick={() => selectSavedAddress(address, 'dropoffLocation')}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <FaMapMarkerAlt className="text-red-600" />
                      <span>{address.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button
              type="button"
              onClick={() => saveAddress(formData.dropoffLocation, 'dropoff')}
              disabled={!formData.dropoffLocation.trim() || isAddressSaved(formData.dropoffLocation, 'dropoff') || savedAddressesLoading}
              className={`px-3 ${
                isAddressSaved(formData.dropoffLocation, 'dropoff')
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-500 hover:bg-red-600'
              } text-white`}
              title={isAddressSaved(formData.dropoffLocation, 'dropoff') ? 'Already saved' : 'Save dropoff location'}
            >
              {savedAddressesLoading ? '...' : (isAddressSaved(formData.dropoffLocation, 'dropoff') ? 'Saved' : 'Save')}
            </Button>
          </div>
        </div>

        {/* Info about saved addresses */}
        {user && (
          <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-md">
            <p className="font-medium mb-1">💡 Tip:</p>
            <p>• <strong>Search History:</strong> Automatically saved when you search for fares</p>
            <p>• <strong>Saved Addresses:</strong> Click "Save" buttons to manually save frequently used locations</p>
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
          <p className="text-xs text-gray-500 mt-1 font-bold">
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
          {renderVehicleRecommendation()}
          {renderPlatformRecommendation()}
          <Card className="p-6 bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200 shadow-lg">
            <div className="text-center">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-800">Estimated Fare</h3>
                <button
                  onClick={handleVisualizationClick}
                  className="p-2 text-gray-600 hover:text-yellow-600 transition-colors rounded-full hover:bg-yellow-100"
                  title="View Fare Analysis"
                >
                  <BarChart3Icon className="h-5 w-5" />
                </button>
              </div>
              <div className="flex items-center justify-center gap-2 my-2">
                <span className="text-4xl font-bold text-yellow-600">₹{prediction}</span>
                {distance !== null && (
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
              <p className="text-xs text-gray-500 mt-1 font-bold">
                All fares include 5% GST as per Indian regulations.
              </p>
            </div>
          </Card>

          {/* Deep Links Section */}
          {showPlatformLinks && (
            <div className="mt-6">
              <h4 className="text-center text-base font-semibold text-gray-700 mb-2">Book Instantly with Your Favorite App</h4>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                {/* Uber */}
                <div className="flex-1 flex flex-col items-center">
                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white shadow hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed w-full"
                    onClick={() => handleDeepLinkClick('Uber', generateDeepLinks()?.uberLink)}
                    disabled={!generateDeepLinks()?.uberLink}
                    title={generateDeepLinks()?.uberLink ? 'Open Uber' : 'Link unavailable for entered locations'}
                  >
                    <img src="/uber-icon.png" alt="Uber" className="w-6 h-6" />
                    <span className="font-medium">Uber</span>
                  </button>
                  {prediction !== null && (
                    <span className="text-xs text-gray-500 mt-1 font-bold">₹{Math.round(prediction! * 0.85)} - ₹{Math.round(prediction! * 1.15)}</span>
                  )}
                </div>
                {/* Ola */}
                <div className="flex-1 flex flex-col items-center">
                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white shadow hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed w-full"
                    onClick={() => handleDeepLinkClick('Ola', generateDeepLinks()?.olaLink)}
                    disabled={!generateDeepLinks()?.olaLink}
                    title={generateDeepLinks()?.olaLink ? 'Open Ola' : 'Link unavailable for entered locations'}
                  >
                    <img src="/ola-icon.png" alt="Ola" className="w-6 h-6" />
                    <span className="font-medium">Ola</span>
                  </button>
                  {prediction !== null && (
                    <span className="text-xs text-gray-500 mt-1 font-bold">₹{Math.round(prediction! * 0.9)} - ₹{Math.round(prediction! * 1.2)}</span>
                  )}
                </div>
                {/* Rapido */}
                <div className="flex-1 flex flex-col items-center">
                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white shadow hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed w-full"
                    onClick={() => handleDeepLinkClick('Rapido', generateDeepLinks()?.rapidoLink)}
                    disabled={!generateDeepLinks()?.rapidoLink}
                    title={generateDeepLinks()?.rapidoLink ? 'Open Rapido' : 'Link unavailable for entered locations'}
                  >
                    <img src="/rapido-icon.png" alt="Rapido" className="w-6 h-6" />
                    <span className="font-medium">Rapido</span>
                  </button>
                  {prediction !== null && (
                    <span className="text-xs text-gray-500 mt-1 font-bold">₹{Math.round(prediction! * 0.7)} - ₹{Math.round(prediction! * 0.9)}</span>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">Links open in a new tab. If you have the app installed, it may open directly.</p>
            </div>
          )}
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
