// Helper functions extracted from the Express server

// Helper function to parse CSV line (handle quoted values)
export function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

// Toll calculation helper functions
export function calculateTollFromMatrix(
  origin: string,
  destination: string,
  tollData: any
): any {
  // Extract location names from origin (remove ", Bulacan" suffix if present)
  const cleanOrigin = origin.replace(/,\s*Bulacan\s*$/i, '').trim()
  // For destination, use the passed town/destination directly (no parsing needed)
  const cleanDestination = destination.trim()

  console.log('🔍 Processing locations:', { cleanOrigin, cleanDestination })

  // Find matching toll systems and calculate tolls
  const routes: any[] = []
  let bestRoute = null
  let cheapestRoute = null

  // Check each toll system
  for (const [systemName, systemData] of Object.entries(tollData) as [string, any][]) {
    const plazas = (systemData as any).plazas
    const matrix = (systemData as any).matrix

    // Find entry and exit plazas that match our locations
    const entryPlaza = findMatchingPlaza(cleanOrigin, plazas)
    const exitPlaza = findMatchingPlaza(cleanDestination, plazas)

    if (entryPlaza && exitPlaza && matrix[entryPlaza] && matrix[entryPlaza][exitPlaza] !== undefined) {
      const tollAmount = matrix[entryPlaza][exitPlaza]

      if (tollAmount > 0) { // Only include routes with tolls
        const route = {
          toll: tollAmount,
          distance: estimateDistance(entryPlaza, exitPlaza, plazas), // Estimate distance
          duration: estimateDuration(entryPlaza, exitPlaza, plazas), // Estimate duration
          optimization: 'direct',
          toll_details: [
            { plaza: entryPlaza, amount: 0 }, // Entry plaza (no toll)
            { plaza: exitPlaza, amount: tollAmount } // Exit plaza (toll collected)
          ],
          system: systemName
        }

        routes.push(route)

        // Track best/cheapest routes
        if (!bestRoute || route.toll > bestRoute.toll) {
          bestRoute = route
        }
        if (!cheapestRoute || route.toll < cheapestRoute.toll) {
          cheapestRoute = route
        }
      }
    }
  }

  // If no direct routes found, try to find alternative routes or use fallback
  if (routes.length === 0) {
    console.log('⚠️ No direct toll routes found, using fallback calculation')
    return createFallbackRoute(cleanOrigin, cleanDestination)
  }

  // Sort routes by toll amount (highest first for "best" route)
  routes.sort((a, b) => b.toll - a.toll)

  // Ensure we have at least one route marked as "fastest" and one as "cheapest"
  if (routes.length >= 2) {
    routes[0].optimization = 'fastest' // Highest toll (usually longer/more direct)
    routes[routes.length - 1].optimization = 'cheapest' // Lowest toll
  } else if (routes.length === 1) {
    routes[0].optimization = 'direct'
  }

  return {
    tollFee: routes[0].toll,
    details: routes[0].toll_details,
    routes: routes
  }
}

// Helper function to find matching plaza for a location
function findMatchingPlaza(location: string, plazas: any): string | null {
  if (!location) return null

  const locationLower = location.toLowerCase().trim()

  // Direct matches first (exact plaza name matches)
  for (const [plazaName, plazaData] of Object.entries(plazas)) {
    if (plazaName.toLowerCase().includes(locationLower) ||
        locationLower.includes(plazaName.toLowerCase())) {
      return plazaName
    }
  }

  // Specific town to plaza mappings based on toll data
  const specificMappings: Record<string, string[]> = {
    // La Union towns - TPLEX plazas (since TPLEX goes to La Union area)
    'luna': ['Victoria', 'Gerona', 'Moncada'], // Closest TPLEX plazas
    'bauang': ['Victoria', 'Gerona', 'Moncada'],
    'arlingay': ['Victoria', 'La Paz', 'Gerona'],
    'caba': ['Victoria', 'La Paz', 'Gerona'],
    'naguilian': ['Paniqui', 'Moncada'],
    'aringay': ['Victoria', 'La Paz', 'Gerona'], // Fixed typo

    // Pangasinan towns - TPLEX plazas
    'umingan': ['Paniqui', 'Moncada', 'Gerona'],
    'sison': ['Paniqui', 'Moncada', 'Pozorrubbio'],
    'bugallon': ['Urdaneta', 'Binalonan', 'Pozorrubbio'],
    'dagupan': ['Urdaneta', 'Binalonan', 'Pozorrubbio'],
    'alaminos': ['Urdaneta', 'Binalonan'],
    'alingayen': ['Urdaneta', 'Binalonan'],
    'mangaldan': ['Urdaneta', 'Binalonan'],
    'san carlos': ['Urdaneta', 'Binalonan'],
    'binalonan': ['Binalonan'],
    'urdaneta': ['Urdaneta'],

    // Nueva Ecija towns - NLEX plazas
    'cabanatuan': ['Balagtas', 'Bocaue', 'Marilao'],
    'guimba': ['Balagtas', 'Bocaue'],
    'munoz': ['Balagtas', 'Bocaue', 'Marilao'],
    'san jose': ['Balagtas', 'Bocaue', 'Marilao'],
    'talavera': ['Balagtas', 'Bocaue'],

    // Tarlac towns - SCTEX/TPLEX plazas
    'tarlac': ['Paniqui', 'Moncada'],
    'paniqui': ['Paniqui'],

    // Zambales towns - SCTEX plazas
    'iba': ['Dinalupihan', 'Floridablanca'],
    'olongapo': ['Dinalupihan', 'Floridablanca'],
    'subic': ['Dinalupihan', 'Floridablanca'],

    // Bulacan towns - NLEX entry plazas
    'pulilan': ['Balagtas', 'Bocaue'],

    // Quezon towns - STAR plazas
    'lucban': ['Sta. Toribio', 'Malvar'],
    'sariaya': ['Sta. Toribio', 'Malvar'],

    // Batangas towns - STAR plazas
    'batangas': ['Malvar', 'Sto. Tomas'],
    'lipa': ['Malvar', 'Sto. Tomas']
  }

  // Check specific mappings first
  if (specificMappings[locationLower]) {
    for (const plaza of specificMappings[locationLower]) {
      if (plazas[plaza]) {
        console.log(`🏛️ Matched "${location}" to plaza "${plaza}"`)
        return plaza
      }
    }
  }

  // Fallback to general province-based matching
  const provinceMappings: Record<string, string[]> = {
    'la union': ['Victoria', 'Gerona', 'Moncada'],
    'pangasinan': ['Paniqui', 'Moncada', 'Urdaneta'],
    'nueva ecija': ['Balagtas', 'Bocaue', 'Marilao'],
    'zambales': ['Dinalupihan', 'Floridablanca'],
    'tarlac': ['Paniqui', 'Moncada'],
    'batangas': ['Malvar', 'Sto. Tomas', 'Tanauan'],
    'quezon': ['Sta. Toribio', 'Malvar', 'Sariaya'],
    'bataan': ['Dinalupihan', 'Floridablanca'],
    'laguna': ['Calamba', 'Sta. Rosa/Tagaytay'],
    'cavite': ['Bacoor', 'Kawit'],
    'bulacan': ['Balagtas', 'Bocaue', 'Marilao']
  }

  for (const [province, possiblePlazas] of Object.entries(provinceMappings)) {
    if (locationLower.includes(province)) {
      for (const plaza of possiblePlazas) {
        if (plazas[plaza]) {
          console.log(`📍 Matched "${location}" (${province}) to plaza "${plaza}"`)
          return plaza
        }
      }
    }
  }

  return null
}

// Helper function to estimate distance between plazas
function estimateDistance(entryPlaza: string, exitPlaza: string, plazas: any): number {
  if (!plazas[entryPlaza] || !plazas[exitPlaza]) return 50000 // 50km default

  const entry = plazas[entryPlaza]
  const exit = plazas[exitPlaza]

  // Calculate rough distance using Haversine formula
  const R = 6371 // Earth's radius in km
  const dLat = (exit.lat - entry.lat) * Math.PI / 180
  const dLon = (exit.lng - entry.lng) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(entry.lat * Math.PI / 180) * Math.cos(exit.lat * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  const distance = R * c * 1000 // Convert to meters

  return Math.round(distance)
}

// Helper function to estimate duration between plazas
function estimateDuration(entryPlaza: string, exitPlaza: string, plazas: any): number {
  const distance = estimateDistance(entryPlaza, exitPlaza, plazas)
  // Assume average speed of 60 km/h (16.67 m/s)
  const speed = 16.67
  return Math.round(distance / speed)
}

// Fallback route when no direct toll routes are found
export function createFallbackRoute(origin: string, destination: string): any {
  return {
    tollFee: 0,
    details: [],
    routes: [{
      toll: 0,
      distance: 50000, // 50km default
      duration: 3000, // 50 minutes default
      optimization: 'no-toll',
      toll_details: [],
      system: 'No toll roads found'
    }]
  }
}

// Transform database format to frontend expected format (maintain snake_case)
export function transformTripFromDB(trip: any): any {
  // Return data as-is from database (already in snake_case)
  return {
    id: trip.id,
    tracking_number: trip.tracking_number,
    date: trip.date,
    truck_plate: trip.truck_plate,
    invoice_number: trip.invoice_number,
    origin: trip.origin,
    farm_name: trip.farm_name,
    destination: trip.destination,
    full_destination: trip.full_destination,
    rate_lookup_key: trip.rate_lookup_key,
    status: trip.status,
    estimated_delivery: trip.estimated_delivery,
    driver: trip.driver,
    helper: trip.helper,
    number_of_bags: trip.number_of_bags,
    created_at: trip.created_at,
    updated_at: trip.updated_at,
    // Toll-related fields (maintain snake_case)
    computed_toll: trip.computed_toll,
    roundtrip_toll: trip.roundtrip_toll,
    actual_toll_expense: trip.actual_toll_expense
  }
}

// Transform frontend format to database format (ensure snake_case)
export function transformTripToDB(trip: any): any {
  const result: any = {}
  Object.keys(trip).forEach(key => {
    if (trip[key] !== undefined) {
      // Convert camelCase to snake_case for database columns (if not already snake_case)
      let dbKey = key
      if (key.includes('_')) {
        // Already snake_case, keep as-is
        dbKey = key
      } else {
        // Convert camelCase to snake_case
        dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
      }
      result[dbKey] = trip[key]
    }
  })
  return result
}
