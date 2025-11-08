console.log('🚀 Starting API Server');
const express = require('express');
const { neon } = require('@neondatabase/serverless');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();
const app = express();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only specific file types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, and PDF files are allowed.'), false);
    }
  }
});

// Enable CORS for all routes (allow all localhost ports for development)
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow localhost on any port
    if (origin.match(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/)) {
      return callback(null, true);
    }

    // For production, you might want to restrict this
    return callback(null, true);
  },
  credentials: true
}));

// Database connection using Neon
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  console.log('💡 Make sure .env file exists with DATABASE_URL');
  process.exit(1);
}
const sql = neon(DATABASE_URL);

// Helper function for database queries (compatible with current Neon API)
const query = async (text, params = []) => {
  try {
    const result = await sql.query(text, params);
    return { rows: result };
  } catch (err) {
    console.error('Query error:', err);
    throw err;
  }
};

// Test database connection
(async () => {
  try {
    await query('SELECT 1');
    console.log('✅ Connected to Neon database');
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.log('💡 Make sure DATABASE_URL environment variable is set');
  }
})();

// API Routes


app.get('/api/employees', async (req, res) => {
  try {
    const result = await query('SELECT * FROM employees ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Transform database format to frontend expected format (snake_case to camelCase)
function transformTripFromDB(trip) {
  return {
    id: trip.id,
    trackingNumber: trip.tracking_number,
    date: trip.date,
    truckPlate: trip.truck_plate,
    invoiceNumber: trip.invoice_number,
    origin: trip.origin,
    farmName: trip.farm_name,
    destination: trip.destination,
    fullDestination: trip.full_destination,
    rateLookupKey: trip.rate_lookup_key,
    status: trip.status,
    estimatedDelivery: trip.estimated_delivery,
    driver: trip.driver,
    helper: trip.helper,
    numberOfBags: trip.number_of_bags,
    createdAt: trip.created_at,
    updatedAt: trip.updated_at,
    // Toll-related fields (convert snake_case to camelCase)
    computedToll: trip.computed_toll,
    roundtripToll: trip.roundtrip_toll,
    actualTollExpense: trip.actual_toll_expense
  };
}

app.get('/api/trips', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await query('SELECT COUNT(*) FROM trips');
    const total = parseInt(countResult.rows[0].count);

    // Get trips with pagination
    const result = await query(
      'SELECT * FROM trips ORDER BY date DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    // Transform database format to frontend expected format (snake_case to camelCase)
    const transformedTrips = result.rows.map(transformTripFromDB);

    res.json({
      trips: transformedTrips,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/rates', async (req, res) => {
  try {
    const result = await query('SELECT * FROM rates ORDER BY origin, town');
    res.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/drivers', (req, res) => {
  res.json([]);
});

app.get('/api/helpers', (req, res) => {
  res.json([]);
});

app.get('/api/vehicles', async (req, res) => {
  try {
    const result = await query('SELECT * FROM vehicles ORDER BY created_at DESC');

    // Transform database format to frontend expected format (snake_case to camelCase)
    const transformedVehicles = result.rows.map(vehicle => ({
      id: vehicle.id,
      plateNumber: vehicle.plate_number,
      vehicleClass: vehicle.vehicle_class,
      name: vehicle.name,
      createdAt: vehicle.created_at,
      updatedAt: vehicle.updated_at
    }));

    res.json(transformedVehicles);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/billings', (req, res) => {
  res.json({
    billings: [],
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false
    }
  });
});

app.get('/api/payslips', (req, res) => {
  res.json({
    payslips: [],
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false
    }
  });
});

app.get('/api/deductions', (req, res) => {
  res.json([]);
});

app.get('/api/expenses', async (req, res) => {
  try {
    const result = await query('SELECT * FROM expenses ORDER BY date DESC, created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Use multer middleware for file upload
app.post('/api/expenses', upload.single('receipt'), async (req, res) => {
  try {
    console.log('POST /api/expenses - req.body:', req.body);
    console.log('POST /api/expenses - req.file:', req.file ? 'present' : 'null');

    const { date, category, description, vehicle, amount, paymentMethod, notes } = req.body;

    // Handle file upload
    let receiptData = {
      filename: null,
      originalName: null,
      mimetype: null,
      size: null,
      data: null
    };

    if (req.file) {
      receiptData = {
        filename: `${Date.now()}-${req.file.originalname}`,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        data: req.file.buffer
      };
    }

    const result = await query(`
      INSERT INTO expenses (date, category, description, vehicle, amount, payment_method, notes, receipt_filename, receipt_original_name, receipt_mimetype, receipt_size, receipt_data)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      date,
      category,
      description,
      vehicle || null,
      parseFloat(amount),
      paymentMethod || 'cash',
      notes || null,
      receiptData.filename,
      receiptData.originalName,
      receiptData.mimetype,
      receiptData.size,
      receiptData.data
    ]);

    console.log('Created new expense:', description);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    if (error.message.includes('Invalid file type')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Database error' });
    }
  }
});

// Use multer middleware for file upload on PUT as well
app.put('/api/expenses/:id', upload.single('receipt'), async (req, res) => {
  try {
    const { id } = req.params;
    const { date, category, description, vehicle, amount, paymentMethod, notes } = req.body;

    // Handle file upload (optional for updates)
    let updateFields = 'date = $1, category = $2, description = $3, vehicle = $4, amount = $5, payment_method = $6, notes = $7, updated_at = CURRENT_TIMESTAMP';
    let params = [
      date,
      category,
      description,
      vehicle || null,
      parseFloat(amount),
      paymentMethod || 'cash',
      notes || null,
      parseInt(id)
    ];

    if (req.file) {
      updateFields += ', receipt_filename = $9, receipt_original_name = $10, receipt_mimetype = $11, receipt_size = $12, receipt_data = $13';
      params = params.concat([
        `${Date.now()}-${req.file.originalname}`,
        req.file.originalname,
        req.file.mimetype,
        req.file.size,
        req.file.buffer
      ]);
    }

    const result = await query(`
      UPDATE expenses
      SET ${updateFields}
      WHERE id = $8
      RETURNING *
    `, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    console.log('Updated expense:', description);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    if (error.message.includes('Invalid file type')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Database error' });
    }
  }
});

// Note: express.json() removed to avoid conflicts with multer
// JSON parsing will be handled by individual routes as needed

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM expenses WHERE id = $1 RETURNING *', [parseInt(id)]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    console.log('Deleted expense:', result.rows[0].description);
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Endpoint to serve receipt attachments
app.get('/api/expenses/:id/receipt', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT receipt_data, receipt_mimetype, receipt_original_name FROM expenses WHERE id = $1', [parseInt(id)]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const expense = result.rows[0];

    if (!expense.receipt_data) {
      return res.status(404).json({ message: 'No receipt found for this expense' });
    }

    // Set appropriate headers
    const mimetype = expense.receipt_mimetype || 'application/octet-stream';
    const filename = expense.receipt_original_name || 'receipt';

    res.setHeader('Content-Type', mimetype);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    // Send the BLOB data
    res.send(expense.receipt_data);
  } catch (error) {
    console.error('Error serving receipt:', error);
    res.status(500).json({ error: 'Failed to serve receipt' });
  }
});

// Catch-all for other API routes removed - specific routes handle all API calls

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log('📡 Available endpoints:');
  console.log('   GET /api/employees');
  console.log('   GET /api/trips');
  console.log('   GET /api/rates');
  console.log('   And more...');
  console.log('\n💡 For full functionality, run: npx vercel dev --listen 5001');
});
