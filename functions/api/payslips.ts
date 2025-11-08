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
        if (queryParams.id) {
          return await getPayslipById(queryParams.id as string, res)
        } else {
          return await getPayslips(queryParams, res)
        }
      case 'POST':
        return await createPayslip(body, res)
      case 'PUT':
        return await updatePayslip(queryParams.id as string, body, res)
      case 'DELETE':
        return await deletePayslip(queryParams.id as string, res)
      default:
        res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Payslips API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function getPayslips(queryParams: any, res: VercelResponse) {
  try {
    const page = parseInt(queryParams.page as string) || 1
    const limit = parseInt(queryParams.limit as string) || 20
    const offset = (page - 1) * limit

    // Get total count for pagination metadata
    const countResult = await query('SELECT COUNT(*) as total FROM payslips')
    const total = parseInt(countResult.rows[0].total)

    // Get paginated results
    const result = await query(
      'SELECT * FROM payslips ORDER BY created_date DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    )

    res.json({
      payslips: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    })
  } catch (error) {
    console.error('Error fetching payslips:', error)
    res.status(500).json({ error: 'Failed to fetch payslips' })
  }
}

async function getPayslipById(id: string, res: VercelResponse) {
  try {
    const result = await query('SELECT * FROM payslips WHERE id = $1', [id])
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Payslip not found' })
    }
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching payslip:', error)
    res.status(500).json({ error: 'Failed to fetch payslip' })
  }
}

async function createPayslip(body: any, res: VercelResponse) {
  try {
    const result = await query(`
      INSERT INTO payslips (id, payslip_number, employee_uuid, period_start, period_end, gross_pay, deductions, net_pay, status, created_date, details)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      body.id || Date.now().toString(),
      body.payslipNumber,
      body.employee?.uuid || body.employee_uuid,
      body.period?.startDate || body.period_start,
      body.period?.endDate || body.period_end,
      parseFloat(body.totals?.grossPay || body.gross_pay || 0),
      parseFloat(body.totals?.totalDeductions || body.deductions || 0),
      parseFloat(body.totals?.netPay || body.net_pay || 0),
      body.status || 'pending',
      body.createdDate || new Date().toISOString(),
      JSON.stringify(body)
    ])

    console.log('Created new payslip:', body.payslipNumber)
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating payslip:', error)
    res.status(500).json({ error: 'Failed to create payslip' })
  }
}

async function updatePayslip(id: string, body: any, res: VercelResponse) {
  try {
    const result = await query(`
      UPDATE payslips
      SET payslip_number = $1, employee_uuid = $2, period_start = $3, period_end = $4,
          gross_pay = $5, deductions = $6, net_pay = $7, status = $8, details = $9
      WHERE id = $10
      RETURNING *
    `, [
      body.payslipNumber,
      body.employee?.uuid || body.employee_uuid,
      body.period?.startDate || body.period_start,
      body.period?.endDate || body.period_end,
      parseFloat(body.totals?.grossPay || body.gross_pay || 0),
      parseFloat(body.totals?.totalDeductions || body.deductions || 0),
      parseFloat(body.totals?.netPay || body.net_pay || 0),
      body.status || 'pending',
      JSON.stringify(body),
      id
    ])

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Payslip not found' })
    }

    console.log('Updated payslip:', body.payslipNumber)
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating payslip:', error)
    res.status(500).json({ error: 'Failed to update payslip' })
  }
}

async function deletePayslip(id: string, res: VercelResponse) {
  try {
    const result = await query('DELETE FROM payslips WHERE id = $1 RETURNING *', [id])
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Payslip not found' })
    }
    console.log('Deleted payslip:', result.rows[0].payslip_number)
    res.json({ message: 'Payslip deleted successfully' })
  } catch (error) {
    console.error('Error deleting payslip:', error)
    res.status(500).json({ error: 'Failed to delete payslip' })
  }
}
