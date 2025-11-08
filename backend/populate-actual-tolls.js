const fs = require('fs');
const path = require('path');

/**
 * Script to populate actual toll expense with computed toll values
 * for trips that have computed toll data but no actual toll expense
 */

const TRIPS_FILE = path.join(__dirname, 'data', 'trips.json');

function populateActualTolls() {
  try {
    // Read the trips data
    const tripsData = JSON.parse(fs.readFileSync(TRIPS_FILE, 'utf8'));

    let updatedCount = 0;
    let skippedCount = 0;

    // Process each trip
    tripsData.forEach(trip => {
      // Check if trip has roundtrip toll
      if (trip.roundtripToll && trip.roundtripToll > 0) {
        const oldValue = trip.actualTollExpense || 'none';
        trip.actualTollExpense = trip.roundtripToll;
        updatedCount++;
        console.log(`✅ Updated Trip ${trip.id} (${trip.invoiceNumber}): actualTollExpense ${oldValue} → ${trip.actualTollExpense} (from roundtripToll)`);
      } else if (!trip.roundtripToll || trip.roundtripToll === 0) {
        // Skip trips with no roundtrip toll
        skippedCount++;
        console.log(`⏭️  Skipped Trip ${trip.id} (${trip.invoiceNumber}): no roundtripToll value`);
      }
    });

    // Write back to file
    fs.writeFileSync(TRIPS_FILE, JSON.stringify(tripsData, null, 2));

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Updated: ${updatedCount} trips`);
    console.log(`   ⏭️  Skipped: ${skippedCount} trips (already have actual toll data)`);
    console.log(`   📁 Total trips processed: ${tripsData.length}`);
    console.log(`\n💾 Data saved to ${TRIPS_FILE}`);

  } catch (error) {
    console.error('❌ Error processing trips data:', error.message);
    process.exit(1);
  }
}

// Run the script
console.log('🚀 Starting actual toll expense population script...');
console.log(`📂 Reading from: ${TRIPS_FILE}\n`);

populateActualTolls();

console.log('\n✨ Script completed successfully!');
