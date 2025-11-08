export const config = {
  runtime: '@vercel/node@18',
};

import { VercelRequest, VercelResponse } from '@vercel/node'
import { query } from '../functions/utils/db'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, query: queryParams, body } = req

  try {
    switch (method) {
      case 'GET':
        if (queryParams.search) {
          // GET /api/rates/search
          return await searchRates(queryParams, res)
        } else {
          // GET /api/rates
          return await getRates(queryParams, res)
        }

      case 'POST':
        // POST /api/rates
        return await createRate(body, res)

      case 'PUT':
        // PUT /api/rates/:origin/:province/:town
        return await updateRate(queryParams, body, res)

      case 'DELETE':
        // DELETE /api/rates/:origin/:province/:town
        return await deleteRate(queryParams, res)

      default:
        res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Rates API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function getRates(queryParams: any, res: VercelResponse) {
  try {
    const { origin, province, destination, town } = queryParams
    const searchTerm = destination || town

    // Create cache key based on query parameters
    const cacheKey = `rates:${JSON.stringify({ origin, province, destination, town })}`

    // For serverless, we'll skip caching for now as it would require external cache
    // In production, you might use Redis or similar

    let queryStr = 'SELECT * FROM rates WHERE 1=1'
    const params: any[] = []
    let paramCount = 1

    if (origin) {
      queryStr += ` AND LOWER(origin) LIKE $${paramCount}`
      params.push(`%${origin.toLowerCase()}%`)
      paramCount++
    }

    if (province) {
      queryStr += ` AND LOWER(province) LIKE $${paramCount}`
      params.push(`%${province.toLowerCase()}%`)
      paramCount++
    }

    if (searchTerm) {
      queryStr += ` AND (LOWER(town) LIKE $${paramCount} OR LOWER(origin) LIKE $${paramCount} OR LOWER(province) LIKE $${paramCount})`
      params.push(`%${searchTerm.toLowerCase()}%`)
    }

    const result = await query(queryStr, params)
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching rates:', error)
    res.status(500).json({ error: 'Failed to fetch rates' })
  }
}

async function searchRates(queryParams: any, res: VercelResponse) {
  try {
    const { query: searchQuery } = queryParams

    if (!searchQuery) {
      const result = await query('SELECT * FROM rates LIMIT 10')
      return res.json(result.rows)
    }

    const searchTerm = `%${searchQuery.toLowerCase()}%`
    const result = await query(`
      SELECT * FROM rates
      WHERE LOWER(origin) LIKE $1
         OR LOWER(province) LIKE $1
         OR LOWER(town) LIKE $1
    `, [searchTerm])

    res.json(result.rows)
  } catch (error) {
    console.error('Error searching rates:', error)
    res.status(500).json({ error: 'Failed to search rates' })
  }
}

async function createRate(body: any, res: VercelResponse) {
  try {
    const result = await query(`
      INSERT INTO rates (origin, province, town, rate, new_rates)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      body.origin,
      body.province,
      body.town,
      parseFloat(body.newRates || body.rate)
    ])

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating rate:', error)
    res.status(500).json({ error: 'Failed to create rate' })
  }
}

async function updateRate(queryParams: any, body: any, res: VercelResponse) {
  try {
    const { origin, province, town } = queryParams
    const { originalOrigin, originalProvince, originalTown, ...updateData } = body

    // Find the rate to update
    const findResult = await query(`
      SELECT id FROM rates
      WHERE LOWER(origin) = LOWER($1)
        AND LOWER(province) = LOWER($2)
        AND LOWER(town) = LOWER($3)
    `, [originalOrigin, originalProvince, originalTown])

    if (findResult.rows.length === 0) {
      return res.status(404).json({ message: 'Rate not found' })
    }

    const rateId = findResult.rows[0].id

    // Update the rate
    const result = await query(`
      UPDATE rates
      SET origin = $1, province = $2, town = $3, rate = $4, new_rates = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `, [
      updateData.origin || originalOrigin,
      updateData.province || originalProvince,
      updateData.town || originalTown,
      parseFloat(updateData.rate) || parseFloat(updateData.newRates) || 0,
      parseFloat(updateData.newRates) || parseFloat(updateData.rate) || 0,
      rateId
    ])

    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating rate:', error)
    res.status(500).json({ error: 'Failed to update rate' })
  }
}

async function deleteRate(queryParams: any, res: VercelResponse) {
  try {
    const { origin, province, town } = queryParams

    const result = await query(`
      DELETE FROM rates
      WHERE LOWER(origin) = LOWER($1)
        AND LOWER(province) = LOWER($2)
        AND LOWER(town) = LOWER($3)
      RETURNING *
    `, [origin, province, town])

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Rate not found' })
    }

    res.json({ message: 'Rate deleted successfully' })
  } catch (error) {
    console.error('Error deleting rate:', error)
    res.status(500).json({ error: 'Failed to delete rate' })
  }
}
