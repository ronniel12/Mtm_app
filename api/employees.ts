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
        if (queryParams.uuid) {
          // GET /api/employees/:uuid
          return await getEmployeeByUuid(queryParams.uuid as string, res)
        } else {
          // GET /api/employees
          return await getEmployees(res)
        }

      case 'POST':
        // POST /api/employees
        return await createEmployee(body, res)

      case 'PUT':
        // PUT /api/employees/:uuid
        return await updateEmployee(queryParams.uuid as string, body, res)

      case 'DELETE':
        // DELETE /api/employees/:uuid
        return await deleteEmployee(queryParams.uuid as string, res)

      default:
        res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Employees API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function getEmployees(res: VercelResponse) {
  try {
    const result = await query('SELECT * FROM employees ORDER BY created_at DESC')
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching employees:', error)
    res.status(500).json({ error: 'Failed to fetch employees' })
  }
}

async function getEmployeeByUuid(uuid: string, res: VercelResponse) {
  try {
    const result = await query('SELECT * FROM employees WHERE uuid = $1', [uuid])
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' })
    }
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching employee:', error)
    res.status(500).json({ error: 'Failed to fetch employee' })
  }
}

async function createEmployee(body: any, res: VercelResponse) {
  try {
    // Generate UUID if not provided
    const uuid = body.uuid || require('crypto').randomUUID()

    const result = await query(`
      INSERT INTO employees (uuid, name, phone, license_number, pagibig_number, sss_number, philhealth_number, address, cash_advance, loans, auto_deduct_cash_advance, auto_deduct_loans)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      uuid,
      body.name,
      body.phone || '',
      body.license_number || body.licenseNumber || '',
      body.pagibig_number || body.pagibigNumber || '',
      body.sss_number || body.sssNumber || '',
      body.philhealth_number || body.philhealthNumber || '',
      body.address || '',
      parseFloat(body.cash_advance || body.cashAdvance) || 0,
      parseFloat(body.loans) || 0,
      body.auto_deduct_cash_advance !== false && body.autoDeductCashAdvance !== false, // Default true
      body.auto_deduct_loans !== false && body.autoDeductLoans !== false // Default true
    ])

    console.log('Created new employee:', body.name)
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating employee:', error)
    res.status(500).json({ error: 'Failed to create employee' })
  }
}

async function updateEmployee(uuid: string, body: any, res: VercelResponse) {
  try {
    const result = await query(`
      UPDATE employees
      SET name = $1, phone = $2, license_number = $3, pagibig_number = $4, sss_number = $5,
          philhealth_number = $6, address = $7, cash_advance = $8, loans = $9,
          auto_deduct_cash_advance = $10, auto_deduct_loans = $11, updated_at = CURRENT_TIMESTAMP
      WHERE uuid = $12
      RETURNING *
    `, [
      body.name,
      body.phone || '',
      body.license_number || body.licenseNumber || '',
      body.pagibig_number || body.pagibigNumber || '',
      body.sss_number || body.sssNumber || '',
      body.philhealth_number || body.philhealthNumber || '',
      body.address || '',
      parseFloat(body.cash_advance || body.cashAdvance) || 0,
      parseFloat(body.loans) || 0,
      body.auto_deduct_cash_advance !== false && body.autoDeductCashAdvance !== false,
      body.auto_deduct_loans !== false && body.autoDeductLoans !== false,
      uuid
    ])

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' })
    }

    console.log('Updated employee:', body.name)
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating employee:', error)
    res.status(500).json({ error: 'Failed to update employee' })
  }
}

async function deleteEmployee(uuid: string, res: VercelResponse) {
  try {
    const result = await query('DELETE FROM employees WHERE uuid = $1 RETURNING *', [uuid])
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' })
    }
    console.log('Deleted employee:', result.rows[0].name)
    res.json({ message: 'Employee deleted successfully' })
  } catch (error) {
    console.error('Error deleting employee:', error)
    res.status(500).json({ error: 'Failed to delete employee' })
  }
}
