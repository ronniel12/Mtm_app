export const config = {
  runtime: '@vercel/node@18',
};

import { VercelRequest, VercelResponse } from '@vercel/node'
import { query } from '../utils/db'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, query: queryParams, body } = req

  try {
    switch (method) {
      case 'GET':
        // GET /api/drivers
        return await getDrivers(res)

      case 'POST':
        // POST /api/drivers
        return await createDriver(body, res)

      case 'PUT':
        // PUT /api/drivers/:id
        return await updateDriver(queryParams.id as string, body, res)

      case 'DELETE':
        // DELETE /api/drivers/:id
        return await deleteDriver(queryParams.id as string, res)

      default:
        res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Drivers API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function getDrivers(res: VercelResponse) {
  try {
    const result = await query('SELECT * FROM drivers ORDER BY created_at DESC')
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching drivers:', error)
    res.status(500).json({ error: 'Failed to fetch drivers' })
  }
}

async function createDriver(body: any, res: VercelResponse) {
  try {
    const result = await query(`
      INSERT INTO drivers (name, phone, license_number)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [body.name, body.phone, body.licenseNumber])

    console.log('Created new driver:', body.name)
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating driver:', error)
    res.status(500).json({ error: 'Failed to create driver' })
  }
}

async function updateDriver(id: string, body: any, res: VercelResponse) {
  try {
    const result = await query(`
      UPDATE drivers
      SET name = $1, phone = $2, license_number = $3
      WHERE id = $4
      RETURNING *
    `, [body.name, body.phone, body.licenseNumber, parseInt(id)])

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Driver not found' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating driver:', error)
    res.status(500).json({ error: 'Failed to update driver' })
  }
}

async function deleteDriver(id: string, res: VercelResponse) {
  try {
    const result = await query('DELETE FROM drivers WHERE id = $1 RETURNING *', [parseInt(id)])
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Driver not found' })
    }
    res.json({ message: 'Driver deleted successfully' })
  } catch (error) {
    console.error('Error deleting driver:', error)
    res.status(500).json({ error: 'Failed to delete driver' })
  }
}
