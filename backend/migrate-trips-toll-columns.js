const { query } = require('./db');
const fs = require('fs');
const path = require('path');

async function migrateTripsTollColumns() {
  try {
    console.log('Starting trips toll columns migration...');

    // Add the missing toll columns to trips table
    console.log('Adding toll columns to trips table...');
    await query(`
      ALTER TABLE trips
      ADD COLUMN IF NOT EXISTS computed_toll DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS roundtrip_toll DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS actual_toll_expense DECIMAL(10,2) DEFAULT 0
    `);

    console.log('Toll columns added successfully!');

    // Load trip data from JSON file
    const tripsDataPath = path.join(__dirname, '..', 'data', 'trips.json');
    const tripsData = JSON.parse(fs.readFileSync(tripsDataPath, 'utf8'));

    console.log(`Found ${tripsData.length} trips in JSON file`);

    // Update existing trips with toll data
    let updatedCount = 0;
    for (const trip of tripsData) {
      if (trip.id && (trip.computedToll || trip.roundtripToll || trip.actualTollExpense)) {
        await query(`
          UPDATE trips
          SET
            computed_toll = $1,
            roundtrip_toll = $2,
            actual_toll_expense = $3,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $4
        `, [
          trip.computedToll || 0,
          trip.roundtripToll || 0,
          trip.actualTollExpense || 0,
          trip.id
        ]);
        updatedCount++;
      }
    }

    console.log(`Updated ${updatedCount} trips with toll data`);

    console.log('Trips toll columns migration completed successfully!');
  } catch (error) {
    console.error('Error during trips toll columns migration:', error);
    throw error;
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  migrateTripsTollColumns()
    .then(() => {
      console.log('Trips toll columns migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Trips toll columns migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateTripsTollColumns };
