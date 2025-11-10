const { query } = require('./db');

async function migrateTimestamps() {
  try {
    console.log('Starting timestamp migration to TIMESTAMPTZ...');

    // Alter existing tables to use TIMESTAMPTZ instead of TIMESTAMP
    const tables = [
      { name: 'employees', columns: ['created_at', 'updated_at'] },
      { name: 'rates', columns: ['created_at'] },
      { name: 'billings', columns: ['created_date', 'updated_at'] },
      { name: 'payslips', columns: ['created_date'] },
      { name: 'deductions', columns: ['created_at'] },
      { name: 'vehicles', columns: ['created_at', 'updated_at'] },
      { name: 'expenses', columns: ['created_at', 'updated_at'] }
    ];

    for (const table of tables) {
      console.log(`Migrating table: ${table.name}`);

      for (const column of table.columns) {
        try {
          // First, check if column exists and what type it is
          const columnInfo = await query(`
            SELECT data_type
            FROM information_schema.columns
            WHERE table_name = $1 AND column_name = $2
          `, [table.name, column]);

          if (columnInfo.rows.length > 0) {
            const currentType = columnInfo.rows[0].data_type;
            console.log(`  Column ${column} is currently: ${currentType}`);

            if (currentType === 'timestamp without time zone') {
              // Alter column to TIMESTAMPTZ
              await query(`
                ALTER TABLE ${table.name}
                ALTER COLUMN ${column} TYPE TIMESTAMPTZ
              `);
              console.log(`  ✅ Altered ${table.name}.${column} to TIMESTAMPTZ`);
            } else if (currentType === 'timestamp with time zone') {
              console.log(`  ℹ️ ${table.name}.${column} is already TIMESTAMPTZ`);
            } else {
              console.log(`  ⚠️ ${table.name}.${column} has unexpected type: ${currentType}`);
            }
          } else {
            console.log(`  ⚠️ Column ${column} not found in ${table.name}`);
          }
        } catch (error) {
          console.error(`  ❌ Error migrating ${table.name}.${column}:`, error.message);
        }
      }
    }

    console.log('✅ Timestamp migration completed successfully!');
  } catch (error) {
    console.error('❌ Error during timestamp migration:', error);
    throw error;
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  migrateTimestamps()
    .then(() => {
      console.log('Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateTimestamps };
