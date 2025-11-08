export const config = {
  runtime: '@vercel/node@18',
};

import { VercelRequest, VercelResponse } from '@vercel/node'
import { query } from './utils/db'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, query: queryParams, body } = req

  try {
    switch (method) {
      case 'GET':
        if (queryParams.id) {
          return await getVehicleById(queryParams.id as string, res)
        } else {
          return await getVehicles(res)
        }
      case 'POST':
        return await createVehicle(body, res)
      case 'PUT':
        return await updateVehicle(queryParams.id as string, body, res)
      case 'DELETE':
        return await deleteVehicle(queryParams.id as string, res)
      default:
        res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Vehicles API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function getVehicles(res: VercelResponse) {
  try {
    const result = await query('SELECT * FROM vehicles ORDER BY created_at DESC')

    // Transform database format to frontend expected format (snake_case to camelCase)
    const transformedVehicles = result.rows.map((vehicle: any) => ({
      id: vehicle.id,
      plateNumber: vehicle.plate_number,
      vehicleClass: vehicle.vehicle_class,
      name: vehicle.name,
      createdAt: vehicle.created_at,
      updatedAt: vehicle.updated_at
    }))

    res.json(transformedVehicles)
  } catch (error) {
    console.error('Error fetching vehicles:', error)
    res.status(500).json({ error: 'Failed to fetch vehicles' })
  }
}

async function getVehicleById(id: string, res: VercelResponse) {
  try {
    const result = await query('SELECT * FROM vehicles WHERE id = $1', [parseInt(id)])
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found' })
    }
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching vehicle:', error)
    res.status(500).json({ error: 'Failed to fetch vehicle' })
  }
}

async function createVehicle(body: any, res: VercelResponse) {
  try {
    const result = await query(`
      INSERT INTO vehicles (plate_number, vehicle_class, name)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [
      body.plateNumber,
      body.vehicleClass,
      body.name || null
    ])

    console.log('Created new vehicle:', body.plateNumber)
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating vehicle:', error)
    if ((error as any).code === '23505') { // Unique constraint violation
      res.status(400).json({ error: 'Plate number already exists' })
    } else {
      res.status(500).json({ error: 'Failed to create vehicle' })
    }
  }
}

async function updateVehicle(id: string, body: any, res: VercelResponse) {
  try {
    const result = await query(`
      UPDATE vehicles
      SET plate_number = $1, vehicle_class = $2, name = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `, [
      body.plateNumber,
      body.vehicleClass,
      body.name || null,
      parseInt(id)
    ])

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found' })
    }

    console.log('Updated vehicle:', body.plateNumber)
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating vehicle:', error)
    if ((error as any).code === '23505') { // Unique constraint violation
      res.status(400).json({ error: 'Plate number already exists' })
    } else {
      res.status(500).json({ error: 'Failed to update vehicle' })
    }
  }
}

async function deleteVehicle(id: string, res: VercelResponse) {
  try {
    const result = await query('DELETE FROM vehicles WHERE id = $1 RETURNING *', [parseInt(id)])
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found' })
    }
    console.log('Deleted vehicle:', result.rows[0].plate_number)
    res.json({ message: 'Vehicle deleted successfully' })
  } catch (error) {
    console.error('Error deleting vehicle:', error)
    res.status(500).json({ error: 'Failed to delete vehicle' })
  }
}
