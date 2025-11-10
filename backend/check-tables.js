const { query } = require('./db');

async function checkTables() {
  try {
    console.log('🔍 Checking database tables...\n');

    // Check if payslips table exists
    const payslipsResult = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'payslips'
      ) as exists
    `);

    const payslipsExists = payslipsResult.rows[0].exists;
    console.log(`📄 Payslips table: ${payslipsExists ? '✅ EXISTS' : '❌ MISSING'}`);

    if (payslipsExists) {
      // Check payslips table structure
      const structureResult = await query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'payslips'
        ORDER BY ordinal_position
      `);

      console.log('📋 Payslips table structure:');
      structureResult.rows.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });

      // Check if there are any payslips
      const countResult = await query('SELECT COUNT(*) as count FROM payslips');
      console.log(`📊 Payslips count: ${countResult.rows[0].count}`);
    }

    console.log('\n🔍 Checking other important tables...\n');

    // Check other tables
    const tables = ['trips', 'employees', 'rates', 'deductions', 'billings'];
    for (const tableName of tables) {
      const result = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = $1
        ) as exists
      `, [tableName]);

      console.log(`${tableName}: ${result.rows[0].exists ? '✅ EXISTS' : '❌ MISSING'}`);
    }

  } catch (error) {
    console.error('❌ Error checking tables:', error);
  }
}

// Run the check if this file is executed directly
if (require.main === module) {
  checkTables()
    .then(() => {
      console.log('\n✅ Table check completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Table check failed:', error);
      process.exit(1);
    });
}

module.exports = { checkTables };
