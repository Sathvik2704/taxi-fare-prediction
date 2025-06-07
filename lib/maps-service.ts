"use server"

const GOOGLE_API_KEY = "AIzaSyApGbX_si9AcZoEj3SllfX1B1ubYpZP0fc"

export async function calculateDistance(origin: string, destination: string): Promise<number> {
  try {
    const encodedOrigin = encodeURIComponent(origin)
    const encodedDestination = encodeURIComponent(destination)

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${encodedOrigin}&destinations=${encodedDestination}&key=${GOOGLE_API_KEY}`
    )

    const data = await response.json()
    const element = data?.rows?.[0]?.elements?.[0]

    if (element?.status === "OK") {
      const distanceInKm = element.distance.value / 1000
      return Math.round(distanceInKm * 10) / 10
    }

    console.warn("Google API fallback triggered. Status:", element?.status)
  } catch (error) {
    console.error("Google API error:", error)
  }

  // --- India-specific fallback logic ---

  const indianCities: Record<string, { lat: number; lng: number; state?: string }> = {
    // Major Metros
    mumbai: { lat: 19.076, lng: 72.8777, state: "Maharashtra" },
    delhi: { lat: 28.6139, lng: 77.209, state: "Delhi" },
    bangalore: { lat: 12.9716, lng: 77.5946, state: "Karnataka" },
    hyderabad: { lat: 17.385, lng: 78.4867, state: "Telangana" },
    secunderabad: { lat: 17.4399, lng: 78.4983, state: "Telangana" },
    chennai: { lat: 13.0827, lng: 80.2707, state: "Tamil Nadu" },
    kolkata: { lat: 22.5726, lng: 88.3639, state: "West Bengal" },
    pune: { lat: 18.5204, lng: 73.8567, state: "Maharashtra" },
    ahmedabad: { lat: 23.0225, lng: 72.5714, state: "Gujarat" },
    
    // Tier 2 Cities
    jaipur: { lat: 26.9124, lng: 75.7873, state: "Rajasthan" },
    lucknow: { lat: 26.8467, lng: 80.9462, state: "Uttar Pradesh" },
    surat: { lat: 21.1702, lng: 72.8311, state: "Gujarat" },
    kanpur: { lat: 26.4499, lng: 80.3319, state: "Uttar Pradesh" },
    nagpur: { lat: 21.1458, lng: 79.0882, state: "Maharashtra" },
    indore: { lat: 22.7196, lng: 75.8577, state: "Madhya Pradesh" },
    bhopal: { lat: 23.2599, lng: 77.4126, state: "Madhya Pradesh" },
    patna: { lat: 25.5941, lng: 85.1376, state: "Bihar" },
    ludhiana: { lat: 30.9000, lng: 75.8573, state: "Punjab" },
    agra: { lat: 27.1767, lng: 78.0081, state: "Uttar Pradesh" },
    nashik: { lat: 19.9975, lng: 73.7898, state: "Maharashtra" },
    varanasi: { lat: 25.3176, lng: 82.9739, state: "Uttar Pradesh" },
    amritsar: { lat: 31.6340, lng: 74.8723, state: "Punjab" },
    ranchi: { lat: 23.3441, lng: 85.3096, state: "Jharkhand" },
    coimbatore: { lat: 11.0168, lng: 76.9558, state: "Tamil Nadu" },
    vijayawada: { lat: 16.5062, lng: 80.6480, state: "Andhra Pradesh" },
    visakhapatnam: { lat: 17.6868, lng: 83.2185, state: "Andhra Pradesh" },
    madurai: { lat: 9.9252, lng: 78.1198, state: "Tamil Nadu" },
    
    // Additional Important Cities
    guwahati: { lat: 26.1445, lng: 91.7362, state: "Assam" },
    jodhpur: { lat: 26.2389, lng: 73.0243, state: "Rajasthan" },
    dehradun: { lat: 30.3165, lng: 78.0322, state: "Uttarakhand" },
    thiruvananthapuram: { lat: 8.5241, lng: 76.9366, state: "Kerala" },
    kochi: { lat: 9.9312, lng: 76.2673, state: "Kerala" },
    mangalore: { lat: 12.9141, lng: 74.8560, state: "Karnataka" },
    mysore: { lat: 12.2958, lng: 76.6394, state: "Karnataka" },
    chandigarh: { lat: 30.7333, lng: 76.7794, state: "Punjab/Haryana" },
    jamshedpur: { lat: 22.8046, lng: 86.2029, state: "Jharkhand" },
    rajkot: { lat: 22.3039, lng: 70.8022, state: "Gujarat" },
    vadodara: { lat: 22.3072, lng: 73.1812, state: "Gujarat" },
    noida: { lat: 28.5355, lng: 77.3910, state: "Uttar Pradesh" },
    gurgaon: { lat: 28.4595, lng: 77.0266, state: "Haryana" },
    faridabad: { lat: 28.4089, lng: 77.3178, state: "Haryana" },
    ghaziabad: { lat: 28.6692, lng: 77.4538, state: "Uttar Pradesh" },
    aurangabad: { lat: 19.8762, lng: 75.3433, state: "Maharashtra" },
    navi_mumbai: { lat: 19.0330, lng: 73.0297, state: "Maharashtra" },
    thane: { lat: 19.2183, lng: 72.9781, state: "Maharashtra" },
    bhubaneswar: { lat: 20.2961, lng: 85.8245, state: "Odisha" },
    raipur: { lat: 21.2514, lng: 81.6296, state: "Chhattisgarh" },
    allahabad: { lat: 25.4358, lng: 81.8463, state: "Uttar Pradesh" },
    goa: { lat: 15.2993, lng: 74.1240, state: "Goa" },
    pondicherry: { lat: 11.9416, lng: 79.8083, state: "Puducherry" },
    shimla: { lat: 31.1048, lng: 77.1734, state: "Himachal Pradesh" },
    srinagar: { lat: 34.0837, lng: 74.7973, state: "Jammu & Kashmir" }
  }

  // Special areas/landmarks in major cities
  const landmarks: Record<string, { lat: number; lng: number; city: string }> = {
    // Delhi NCR
    connaught_place: { lat: 28.6315, lng: 77.2167, city: "delhi" },
    india_gate: { lat: 28.6129, lng: 77.2295, city: "delhi" },
    airport_delhi: { lat: 28.5562, lng: 77.1000, city: "delhi" },
    
    // Mumbai
    bandra: { lat: 19.0596, lng: 72.8295, city: "mumbai" },
    andheri: { lat: 19.1136, lng: 72.8697, city: "mumbai" },
    cst_station: { lat: 18.9398, lng: 72.8354, city: "mumbai" },
    airport_mumbai: { lat: 19.0896, lng: 72.8656, city: "mumbai" },
    
    // Bangalore
    mg_road: { lat: 12.9758, lng: 77.6065, city: "bangalore" },
    koramangala: { lat: 12.9352, lng: 77.6245, city: "bangalore" },
    indiranagar: { lat: 12.9784, lng: 77.6408, city: "bangalore" },
    airport_bangalore: { lat: 13.1989, lng: 77.7068, city: "bangalore" },
    
    // Hyderabad
    banjara_hills: { lat: 17.4156, lng: 78.4347, city: "hyderabad" },
    hitec_city: { lat: 17.4435, lng: 78.3772, city: "hyderabad" },
    charminar: { lat: 17.3616, lng: 78.4747, city: "hyderabad" },
    airport_hyderabad: { lat: 17.2403, lng: 78.4294, city: "hyderabad" },
    
    // Chennai
    t_nagar: { lat: 13.0418, lng: 80.2341, city: "chennai" },
    adyar: { lat: 13.0012, lng: 80.2565, city: "chennai" },
    anna_nagar: { lat: 13.0891, lng: 80.2096, city: "chennai" },
    airport_chennai: { lat: 12.9941, lng: 80.1709, city: "chennai" }
  }

  const normalize = (str: string) =>
    str.toLowerCase()
      .replace(/[^a-z0-9]/g, " ")
      .replace(/\s+/g, " ")
      .trim()

  const matchLocation = (input: string) => {
    const cleaned = normalize(input)
    
    // First check for landmark matches
    for (const [landmarkName, landmarkData] of Object.entries(landmarks)) {
      if (cleaned.includes(normalize(landmarkName.replace(/_/g, " ")))) {
        return { 
          type: "landmark", 
          name: landmarkName, 
          city: landmarkData.city,
          lat: landmarkData.lat, 
          lng: landmarkData.lng 
        }
      }
    }
    
    // Then check for city matches
    for (const [cityName, cityData] of Object.entries(indianCities)) {
      if (cleaned.includes(normalize(cityName.replace(/_/g, " ")))) {
        return { 
          type: "city", 
          name: cityName, 
          state: cityData.state,
          lat: cityData.lat, 
          lng: cityData.lng 
        }
      }
    }
    
    return null
  }

  const location1 = matchLocation(origin)
  const location2 = matchLocation(destination)

  if (!location1 || !location2) {
    console.warn("Could not match locations in India. Returning fallback of ~10 km.")
    return 10 + Math.round(Math.random() * 5)
  }

  // If same city but different landmarks
  if (location1.type === "landmark" && 
      location2.type === "landmark" && 
      location1.city === location2.city) {
    // Within city distance (1-15 km)
    return 1 + Math.round(Math.random() * 14) 
  }

  // If same exact location
  if (location1.name === location2.name && location1.type === location2.type) {
    return 1 + Math.round(Math.random() * 4) // 1-5 km for minimum fare
  }

  const toRad = (val: number) => (val * Math.PI) / 180

  const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371 // Earth radius in kilometers
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Apply a road factor multiplier to account for non-direct routes
  const roadFactor = 1.3 // Roads are typically 1.3 times longer than direct distances

  const dist = haversineDistance(location1.lat, location1.lng, location2.lat, location2.lng) * roadFactor
  return Math.round(dist * 10) / 10
}

