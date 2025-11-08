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
          return await getDeductionById(parseInt(queryParams.id as string), res)
        } else {
          return await getDeductions(res)
        }
      case 'POST':
        return await createDeduction(body, res)
      case 'PUT':
        return await updateDeduction(parseInt(queryParams.id as string), body, res)
      case 'DELETE':
        return await deleteDeduction(parseInt(queryParams.id as string), res)
      default:
        res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Deductions API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function getDeductions(res: VercelResponse) {
  try {
    const result = await query('SELECT * FROM deductions ORDER BY created_at DESC')
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching deductions:', error)
    res.status(500).json({ error: 'Failed to fetch deductions' })
  }
}

async function getDeductionById(id: number, res: VercelResponse) {
  try {
    const result = await query('SELECT * FROM deductions WHERE id = $1', [id])
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Deduction not found' })
    }
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching deduction:', error)
    res.status(500).json({ error: 'Failed to fetch deduction' })
  }
}

async function createDeduction(body: any, res: VercelResponse) {
  try {
    const result = await query(`
      INSERT INTO deductions (name, type, value, is_default)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [
      body.name,
      body.type,
      parseFloat(body.value),
      body.isDefault || false
    ])

    console.log('Created new deduction:', body.name)
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating deduction:', error)
    res.status(500).json({ error: 'Failed to create deduction' })
  }
}

async function updateDeduction(id: number, body: any, res: VercelResponse) {
  try {
    const result = await query(`
      UPDATE deductions
      SET name = $1, type = $2, value = $3, is_default = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `, [
      body.name,
      body.type,
      parseFloat(body.value),
      body.isDefault || false,
      id
    ])

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Deduction not found' })
    }

    console.log('Updated deduction:', body.name)
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating deduction:', error)
    res.status(500).json({ error: 'Failed to update deduction' })
  }
}

async function deleteDeduction(id: number, res: VercelResponse) {
  try {
    const result = await query('DELETE FROM deductions WHERE id = $1 RETURNING *', [id])
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Deduction not found' })
    }
    console.log('Deleted deduction:', result.rows[0].name)
    res.json({ message: 'Deduction deleted successfully' })
  } catch (error) {
    console.error('Error deleting deduction:', error)
    res.status(500).json({ error: 'Failed to delete deduction' })
  }
}
