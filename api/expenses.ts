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
        if (queryParams.id && queryParams.receipt) {
          // GET /api/expenses/:id/receipt
          return await getExpenseReceipt(queryParams.id as string, res)
        } else if (queryParams.id) {
          // GET /api/expenses/:id
          return await getExpenseById(queryParams.id as string, res)
        } else {
          // GET /api/expenses
          return await getExpenses(res)
        }
      case 'POST':
        // POST /api/expenses
        return await createExpense(body, req, res)
      case 'PUT':
        // PUT /api/expenses/:id
        return await updateExpense(queryParams.id as string, body, res)
      case 'DELETE':
        // DELETE /api/expenses/:id
        return await deleteExpense(queryParams.id as string, res)
      default:
        res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Expenses API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function getExpenses(res: VercelResponse) {
  try {
    const result = await query('SELECT * FROM expenses ORDER BY date DESC, created_at DESC')
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching expenses:', error)
    res.status(500).json({ error: 'Failed to fetch expenses' })
  }
}

async function getExpenseById(id: string, res: VercelResponse) {
  try {
    const result = await query('SELECT * FROM expenses WHERE id = $1', [parseInt(id)])
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Expense not found' })
    }
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching expense:', error)
    res.status(500).json({ error: 'Failed to fetch expense' })
  }
}

async function createExpense(body: any, req: VercelRequest, res: VercelResponse) {
  try {
    // For serverless, file handling would be different
    // In Vercel, files are typically handled via form data
    // This is a simplified version - in production you'd handle multipart/form-data

    let receiptData = {
      filename: null as string | null,
      originalName: null as string | null,
      mimetype: null as string | null,
      size: null as number | null,
      data: null as Buffer | null
    }

    // Note: File upload handling would need to be implemented based on your serverless platform
    // For now, we'll store without file data

    const result = await query(`
      INSERT INTO expenses (date, category, description, vehicle, amount, payment_method, notes, receipt_filename, receipt_original_name, receipt_mimetype, receipt_size, receipt_data)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      body.date,
      body.category,
      body.description,
      body.vehicle || null,
      parseFloat(body.amount),
      body.paymentMethod || 'cash',
      body.notes || null,
      receiptData.filename,
      receiptData.originalName,
      receiptData.mimetype,
      receiptData.size,
      receiptData.data
    ])

    console.log('Created new expense:', body.description)
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating expense:', error)
    res.status(500).json({ error: 'Failed to create expense' })
  }
}

async function updateExpense(id: string, body: any, res: VercelResponse) {
  try {
    const result = await query(`
      UPDATE expenses
      SET date = $1, category = $2, description = $3, vehicle = $4, amount = $5, payment_method = $6, notes = $7, updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `, [
      body.date,
      body.category,
      body.description,
      body.vehicle || null,
      parseFloat(body.amount),
      body.paymentMethod || 'cash',
      body.notes || null,
      parseInt(id)
    ])

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Expense not found' })
    }

    console.log('Updated expense:', body.description)
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating expense:', error)
    res.status(500).json({ error: 'Failed to update expense' })
  }
}

async function deleteExpense(id: string, res: VercelResponse) {
  try {
    const result = await query('DELETE FROM expenses WHERE id = $1 RETURNING *', [parseInt(id)])
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Expense not found' })
    }
    console.log('Deleted expense:', result.rows[0].description)
    res.json({ message: 'Expense deleted successfully' })
  } catch (error) {
    console.error('Error deleting expense:', error)
    res.status(500).json({ error: 'Failed to delete expense' })
  }
}

async function getExpenseReceipt(id: string, res: VercelResponse) {
  try {
    const result = await query('SELECT receipt_data, receipt_mimetype, receipt_original_name FROM expenses WHERE id = $1', [parseInt(id)])

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Expense not found' })
    }

    const expense = result.rows[0]

    if (!expense.receipt_data) {
      return res.status(404).json({ message: 'No receipt found for this expense' })
    }

    // Set appropriate headers
    const mimetype = expense.receipt_mimetype || 'application/octet-stream'
    const filename = expense.receipt_original_name || 'receipt'

    res.setHeader('Content-Type', mimetype)
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`)

    // Send the BLOB data
    res.send(expense.receipt_data)
  } catch (error) {
    console.error('Error serving receipt:', error)
    res.status(500).json({ error: 'Failed to serve receipt' })
  }
}
