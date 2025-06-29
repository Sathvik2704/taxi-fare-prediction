import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type VehicleType = "auto" | "mini" | "sedan" | "suv" | "prime"

export interface VehicleInfo {
  name: string
  baseRate: number
  perKmRate: number
  capacity: number
  description: string
}

export const vehicleTypes: Record<VehicleType, VehicleInfo> = {
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
    baseRate: 180,
    perKmRate: 22,
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

/**
 * Calculate fare for a given vehicle type, distance, time, and passengers.
 * @param vehicleType VehicleType
 * @param distance number (in km)
 * @param time 'day' | 'night'
 * @param passengers number
 * @returns number (fare in rupees)
 */
export function calculateFare(
  vehicleType: VehicleType,
  distance: number,
  time: 'day' | 'night',
  passengers: number
): number {
  const selectedVehicle = vehicleTypes[vehicleType]
  const baseRate = selectedVehicle.baseRate
  let perKmRate = selectedVehicle.perKmRate
  const d = distance

  // More realistic tiered per km rate based on distance
  if (d > 50) {
    perKmRate *= 0.75 // 25% discount for very long distances (>50 km)
  } else if (d > 25) {
    perKmRate *= 0.85 // 15% discount for long distances (>25 km)
  } else if (d > 10) {
    perKmRate *= 0.95 // 5% discount for medium distances (>10 km)
  }

  // Time of day factor - more realistic surge pricing
  let timeMultiplier = 1.0
  if (time === "night") {
    // Night time pricing (higher for safety & lower supply)
    timeMultiplier = 1.25
  }

  // Traffic congestion estimation based on time of day and passenger count
  const passengerFactor = 1 + (passengers > 3 ? 0.05 : 0) // Slight increase for more passengers

  // Apply dynamic pricing based on vehicle type
  const vehicleDemandFactor =
    vehicleType === "auto" ? 0.95 :
    vehicleType === "mini" ? 1.0 :
    vehicleType === "sedan" ? 1.05 :
    vehicleType === "suv" ? 1.20 :
    vehicleType === "prime" ? 1.15 : 1.0

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

  return fare
}
