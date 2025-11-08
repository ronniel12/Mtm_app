export const config = {
  runtime: 'nodejs18.x',
};

import { VercelRequest, VercelResponse } from '@vercel/node'
import { query } from '../utils/db'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, query: queryParams, body } = req

  try {
    switch (method) {
      case 'GET':
        return await getHelpers(res)
      case 'POST':
        return await createHelper(body, res)
      case 'PUT':
        return await updateHelper(queryParams.id as string, body, res)
      case 'DELETE':
        return await deleteHelper(queryParams.id as string, res)
      default:
        res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Helpers API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function getHelpers(res: VercelResponse) {
  try {
    const result = await query('SELECT * FROM helpers ORDER BY created_at DESC')
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching helpers:', error)
    res.status(500).json({ error: 'Failed to fetch helpers' })
  }
}

async function createHelper(body: any, res: VercelResponse) {
  try {
    const result = await query(`
      INSERT INTO helpers (name, phone, address)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [body.name, body.phone, body.address])

    console.log('Created new helper:', body.name)
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating helper:', error)
    res.status(500).json({ error: 'Failed to create helper' })
  }
}

async function updateHelper(id: string, body: any, res: VercelResponse) {
  try {
    const result = await query(`
      UPDATE helpers
      SET name = $1, phone = $2, address = $3
      WHERE id = $4
      RETURNING *
    `, [body.name, body.phone, body.address, parseInt(id)])

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Helper not found' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating helper:', error)
    res.status(500).json({ error: 'Failed to update helper' })
  }
}

async function deleteHelper(id: string, res: VercelResponse) {
  try {
    const result = await query('DELETE FROM helpers WHERE id = $1 RETURNING *', [parseInt(id)])
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Helper not found' })
    }
    res.json({ message: 'Helper deleted successfully' })
  } catch (error) {
    console.error('Error deleting helper:', error)
    res.status(500).json({ error: 'Failed to delete helper' })
  }
}
