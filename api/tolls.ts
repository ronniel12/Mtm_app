export const config = {
  runtime: '@vercel/node@18',
};

import { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'
import { calculateTollFromMatrix, createFallbackRoute } from '../utils/helpers'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, body } = req

  try {
    switch (method) {
      case 'POST':
        if (body.calculate) {
          return await calculateToll(body, res)
        }
        break
      default:
        res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Tolls API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function calculateToll(body: any, res: VercelResponse) {
  try {
    const { origin, destination, town, date, vehicleClass } = body

    console.log('🛣️ Toll calculation request (via RMap):', { origin, destination, town, vehicleClass })

    if (!origin || (!destination && !town)) {
      return res.status(400).json({ error: 'Origin and destination/town are required' })
    }

    // Use vehicle class to determine toll rates (default to Class 2)
    const vehicleClassKey = vehicleClass || '2'

    // Create addresses for RMap API (RMap adds ", Philippines" internally)
    const originAddress = origin
    const destinationAddress = town || destination

    console.log('📍 Routing addresses:', { originAddress, destinationAddress })

    try {
      // Call RMap API for routing and toll calculation
      const rmapResponse = await axios.post('http://localhost:8000/route', {
        origin: originAddress,
        destination: destinationAddress,
        vehicle: vehicleClassKey,
        profile: "car"
      })

      console.log('✅ RMap API response received with', rmapResponse.data.length, 'routes')
      console.log('📊 Full RMap response data:', JSON.stringify(rmapResponse.data, null, 2))

      // Transform RMap response to match our expected format
      const routes = rmapResponse.data.map((route: any) => ({
        toll: route.toll || 0,
        distance: route.distance || 0,
        duration: route.duration || 0,
        optimization: route.optimization || 'fastest',
        toll_details: route.toll_details || [],
        system: 'RMap',
        geometry: route.geometry // Keep the encoded polyline for potential client-side use
      }))

      console.log('🔄 Transformed routes:', JSON.stringify(routes, null, 2))

      // Find the route with tolls (prefer shortest distance among toll routes)
      let bestRoute = routes.find((route: any) => route.toll > 0) || routes[0]

      if (routes.length > 1) {
        const tollRoutes = routes.filter((route: any) => route.toll > 0)
        if (tollRoutes.length > 0) {
          // Among routes with tolls, select the shortest distance
          bestRoute = tollRoutes.reduce((best: any, route: any) =>
            route.distance < best.distance ? route : best
          )
        }
      }

      res.json({
        tollFee: bestRoute.toll || 0,
        details: bestRoute.toll_details || [],
        routes: routes,
        origin,
        destination,
        town,
        vehicleClass: vehicleClassKey,
        calculatedAt: new Date().toISOString()
      })

    } catch (rmapError: any) {
      console.error('❌ Error calling RMap API:', rmapError.response?.data || rmapError.message)

      // Fallback to basic toll calculation if RMap is unavailable
      console.log('🔄 Falling back to basic toll calculation...')

      try {
        // For serverless, we'll use a simplified fallback
        // In production, you'd load toll data from a database or external source
        const tollResult = createFallbackRoute(origin, destinationAddress)

        return res.json({
          ...tollResult,
          origin,
          destination,
          town,
          vehicleClass: vehicleClassKey,
          calculatedAt: new Date().toISOString(),
          fallbackMode: true
        })

      } catch (fallbackError) {
        console.error('❌ Fallback toll calculation also failed:', fallbackError)
        return res.status(500).json({
          error: 'RMap API unavailable and fallback calculation failed',
          tollFee: 0,
          routes: [],
          origin,
          destination,
          town,
          vehicleClass: vehicleClassKey,
          calculatedAt: new Date().toISOString()
        })
      }
    }

  } catch (error) {
    console.error('❌ Error in toll calculation:', error)
    res.status(500).json({
      error: 'Toll calculation failed',
      tollFee: 0,
      routes: [],
      origin: body.origin,
      destination: body.destination,
      town: body.town,
      vehicleClass: body.vehicleClass || '2',
      calculatedAt: new Date().toISOString()
    })
  }
}
