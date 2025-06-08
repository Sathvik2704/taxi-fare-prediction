"use client"

import { useEffect, useRef, useState } from "react"
import { Loader } from "@googlemaps/js-api-loader"

declare global {
  interface Window {
    google: any
  }
}

interface MapPreviewProps {
  origin: string
  destination: string
}

export function MapPreview({ origin, destination }: MapPreviewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)

  useEffect(() => {
    if (!origin || !destination) return

    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
      version: "weekly",
      libraries: ["places"],
    })

    loader
      .load()
      .then(() => {
        setIsLoaded(true)

        if (!mapRef.current) return

        // Create map instance with default center in India
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: 20.5937, lng: 78.9629 }, // Center of India
          zoom: 5,
          disableDefaultUI: true,
          zoomControl: true,
        })

        setMapInstance(map)

        // Default locations for major Indian cities to use as fallbacks
        const defaultLocations = {
          mumbai: { lat: 19.076, lng: 72.8777 },
          delhi: { lat: 28.6139, lng: 77.209 },
          bangalore: { lat: 12.9716, lng: 77.5946 },
          hyderabad: { lat: 17.385, lng: 78.4867 },
          chennai: { lat: 13.0827, lng: 80.2707 },
          kolkata: { lat: 22.5726, lng: 88.3639 },
          pune: { lat: 18.5204, lng: 73.8567 },
          ahmedabad: { lat: 23.0225, lng: 72.5714 },
          jaipur: { lat: 26.9124, lng: 75.7873 },
          lucknow: { lat: 26.8467, lng: 80.9462 },
          secunderabad: { lat: 17.4399, lng: 78.4983 }, // Added Secunderabad
        }

        // Helper function to find a fallback location based on partial matches
        const findFallbackLocation = (address: string) => {
          address = address.toLowerCase().replace(/\s+/g, "")

          for (const [city, coords] of Object.entries(defaultLocations)) {
            if (address.includes(city)) {
              return coords
            }
          }

          // Default to Hyderabad if no match
          return defaultLocations.hyderabad
        }

        // Function to geocode an address with fallback
        const geocodeWithFallback = async (address: string) => {
          const geocoder = new window.google.maps.Geocoder()

          try {
            // Try to improve address by adding "India" if not present
            const enhancedAddress = address.toLowerCase().includes("india") ? address : `${address}, India`

            return new Promise((resolve, reject) => {
              geocoder.geocode({ address: enhancedAddress }, (results: any, status: any) => {
                if (status === window.google.maps.GeocoderStatus.OK && results && results[0]) {
                  resolve(results[0].geometry.location)
                } else {
                  // If geocoding fails, use fallback
                  console.warn(`Geocoding failed for "${address}", using fallback location`)
                  resolve(findFallbackLocation(address))
                }
              })
            })
          } catch (error) {
            console.error(`Error geocoding "${address}":`, error)
            return findFallbackLocation(address)
          }
        }

        // Geocode both addresses with fallback
        Promise.all([geocodeWithFallback(origin), geocodeWithFallback(destination)])
          .then(([originLocation, destLocation]) => {
            // Create markers for origin and destination
            new window.google.maps.Marker({
              position: originLocation,
              map,
              title: "Pickup",
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 7,
                fillColor: "#4CAF50",
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: "#FFFFFF",
              },
            })

            new window.google.maps.Marker({
              position: destLocation,
              map,
              title: "Dropoff",
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 7,
                fillColor: "#F44336",
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: "#FFFFFF",
              },
            })

            // Fit map to show both markers
            const bounds = new window.google.maps.LatLngBounds()
            bounds.extend(originLocation)
            bounds.extend(destLocation)
            map.fitBounds(bounds)

            // Try to get directions
            try {
              const directionsService = new window.google.maps.DirectionsService()
              const directionsRenderer = new window.google.maps.DirectionsRenderer({
                map,
                suppressMarkers: true, // We'll use our custom markers
                polylineOptions: {
                  strokeColor: "#F59E0B",
                  strokeWeight: 5,
                },
              })

              directionsService.route(
                {
                  origin: originLocation,
                  destination: destLocation,
                  travelMode: window.google.maps.TravelMode.DRIVING,
                },
                (result: any, status: any) => {
                  if (status === window.google.maps.DirectionsStatus.OK && result) {
                    directionsRenderer.setDirections(result)
                  } else {
                    console.warn("Could not display directions, using straight line fallback")

                    // Draw a simple line between points as fallback
                    new window.google.maps.Polyline({
                      path: [originLocation, destLocation],
                      geodesic: true,
                      strokeColor: "#F59E0B",
                      strokeOpacity: 0.8,
                      strokeWeight: 3,
                      map: map,
                    })
                  }
                },
              )
            } catch (error) {
              console.error("Error getting directions:", error)

              // Draw a simple line between points as fallback
              new window.google.maps.Polyline({
                path: [originLocation, destLocation],
                geodesic: true,
                strokeColor: "#F59E0B",
                strokeOpacity: 0.8,
                strokeWeight: 3,
                map: map,
              })
            }
          })
          .catch((err) => {
            console.error("Error in map processing:", err)
            setError("Could not process locations. Using estimated distance.")
          })
      })
      .catch((err) => {
        console.error("Error loading Google Maps:", err)
        setError("Failed to load map. Using estimated distance.")
      })

    return () => {
      // Clean up if needed
    }
  }, [origin, destination])

  return (
    <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden relative">
      {error ? (
        <div className="flex items-center justify-center h-full text-amber-600 bg-amber-50 p-2 text-sm">
          <p>{error}</p>
        </div>
      ) : !isLoaded ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
        </div>
      ) : (
        <div ref={mapRef} className="w-full h-full"></div>
      )}
    </div>
  )
}
