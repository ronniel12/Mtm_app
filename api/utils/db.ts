import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export default sql

// Helper function for database queries (for backward compatibility)
export const query = async (text: string, params?: any[]) => {
  try {
    const result = await sql(text, params)
    console.log('Executed query', { text, rowCount: result.length })
    return { rows: result }
  } catch (err) {
    console.error('Query error:', err)
    throw err
  }
}
