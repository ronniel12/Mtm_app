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
        if (queryParams.id) {
          return await getBillingById(queryParams.id as string, res)
        } else {
          return await getBillings(queryParams, res)
        }
      case 'POST':
        return await createBilling(body, res)
      case 'PUT':
        return await updateBilling(queryParams.id as string, body, res)
      case 'DELETE':
        return await deleteBilling(queryParams.id as string, res)
      default:
        res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Billings API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function getBillings(queryParams: any, res: VercelResponse) {
  try {
    const page = parseInt(queryParams.page as string) || 1
    const limit = parseInt(queryParams.limit as string) || 20
    const offset = (page - 1) * limit

    // Get total count for pagination metadata
    const countResult = await query('SELECT COUNT(*) as total FROM billings')
    const total = parseInt(countResult.rows[0].total)

    // Get paginated results
    const result = await query(
      'SELECT * FROM billings ORDER BY created_date DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    )

    // Transform database format to frontend expected format
    const transformedBillings = result.rows.map((billing: any) => ({
      ...billing,
      // Transform period fields
      period: {
        startDate: billing.period_start,
        endDate: billing.period_end,
        periodText: billing.period_start && billing.period_end ?
          `${new Date(billing.period_start).toLocaleDateString('en-PH')} to ${new Date(billing.period_end).toLocaleDateString('en-PH')}` :
          'Period not set'
      },
      // Transform client fields
      client: {
        name: billing.client_name,
        address: billing.client_address,
        city: billing.client_address ? billing.client_address.split(',')[0] : '',
        zipCode: billing.client_address ? billing.client_address.split(',').pop()?.trim() : '',
        tin: billing.client_tin
      },
      // Transform payment status
      paymentStatus: billing.payment_status,
      // Transform totals and trips (already JSONB)
      totals: billing.totals,
      trips: billing.trips,
      // Transform billing number
      billingNumber: billing.billing_number,
      // Keep other fields
      preparedBy: billing.prepared_by,
      createdDate: billing.created_date
    }))

    res.json({
      billings: transformedBillings,
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
    console.error('Error fetching billings:', error)
    res.status(500).json({ error: 'Failed to fetch billings' })
  }
}

async function getBillingById(id: string, res: VercelResponse) {
  try {
    const result = await query('SELECT * FROM billings WHERE id = $1', [id])
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Billing not found' })
    }
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching billing:', error)
    res.status(500).json({ error: 'Failed to fetch billing' })
  }
}

async function createBilling(body: any, res: VercelResponse) {
  try {
    const result = await query(`
      INSERT INTO billings (id, billing_number, period_start, period_end, client_name, client_address, client_tin, trips, totals, prepared_by, payment_status, created_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      body.id || Date.now().toString(),
      body.billingNumber,
      body.period?.startDate,
      body.period?.endDate,
      body.client?.name,
      body.client?.address,
      body.client?.tin,
      JSON.stringify(body.trips || []),
      JSON.stringify(body.totals || {}),
      body.preparedBy,
      body.paymentStatus || 'pending',
      body.createdDate || new Date().toISOString()
    ])

    console.log('Created new billing:', body.billingNumber)
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating billing:', error)
    res.status(500).json({ error: 'Failed to create billing' })
  }
}

async function updateBilling(id: string, body: any, res: VercelResponse) {
  try {
    // Transform frontend format to database format
    const billingData = {
      billing_number: body.billingNumber,
      period_start: body.period?.startDate,
      period_end: body.period?.endDate,
      client_name: body.client?.name,
      client_address: body.client?.address,
      client_tin: body.client?.tin,
      trips: body.trips || [],
      totals: body.totals || {},
      prepared_by: body.preparedBy,
      payment_status: body.paymentStatus || 'pending'
    }

    const result = await query(`
      UPDATE billings
      SET billing_number = $1, period_start = $2, period_end = $3, client_name = $4,
          client_address = $5, client_tin = $6, trips = $7, totals = $8,
          prepared_by = $9, payment_status = $10, updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *
    `, [
      billingData.billing_number,
      billingData.period_start,
      billingData.period_end,
      billingData.client_name,
      billingData.client_address,
      billingData.client_tin,
      JSON.stringify(billingData.trips),
      JSON.stringify(billingData.totals),
      billingData.prepared_by,
      billingData.payment_status,
      id
    ])

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Billing not found' })
    }

    console.log('Updated billing:', billingData.billing_number)
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating billing:', error)
    res.status(500).json({ error: 'Failed to update billing' })
  }
}

async function deleteBilling(id: string, res: VercelResponse) {
  try {
    const result = await query('DELETE FROM billings WHERE id = $1 RETURNING *', [id])
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Billing not found' })
    }
    console.log('Deleted billing:', result.rows[0].billing_number)
    res.json({ message: 'Billing deleted successfully' })
  } catch (error) {
    console.error('Error deleting billing:', error)
    res.status(500).json({ error: 'Failed to delete billing' })
  }
}
