const fs = require('fs');
const path = require('path');

// File paths
const TRIPS_FILE = path.join(__dirname, 'data', 'trips.json');
const EMPLOYEES_FILE = path.join(__dirname, 'data', 'employees.json');

console.log('🚀 Starting trip data migration to UUID references...\n');

// Read data files
const trips = JSON.parse(fs.readFileSync(TRIPS_FILE, 'utf8'));
const employees = JSON.parse(fs.readFileSync(EMPLOYEES_FILE, 'utf8'));

// Create name-to-UUID mapping
const nameToUuid = {};
employees.forEach(employee => {
  nameToUuid[employee.name.toLowerCase().trim()] = employee.uuid;
});

console.log('📋 Name to UUID Mapping:');
Object.entries(nameToUuid).forEach(([name, uuid]) => {
  console.log(`  "${name}" → ${uuid}`);
});
console.log('');

let migrated = 0;
let errors = 0;

// Migrate each trip
trips.forEach((trip, index) => {
  const originalDriver = trip.driver;
  const originalHelper = trip.helper;

  let updatedDriver = originalDriver;
  let updatedHelper = originalHelper;

  // Convert driver name to UUID if found
  if (originalDriver && nameToUuid[originalDriver.toLowerCase().trim()]) {
    updatedDriver = nameToUuid[originalDriver.toLowerCase().trim()];
  }

  // Convert helper name to UUID if found
  if (originalHelper && nameToUuid[originalHelper.toLowerCase().trim()]) {
    updatedHelper = nameToUuid[originalHelper.toLowerCase().trim()];
  }

  // Track changes
  if (originalDriver !== updatedDriver || originalHelper !== updatedHelper) {
    console.log(`📝 Trip ${trip.id} (${trip.trackingNumber}):`);
    if (originalDriver !== updatedDriver) {
      console.log(`   Driver: "${originalDriver}" → ${updatedDriver}`);
    }
    if (originalHelper !== updatedHelper) {
      console.log(`   Helper: "${originalHelper}" → ${updatedHelper}`);
    }
    console.log('');

    trip.driver = updatedDriver;
    trip.helper = updatedHelper;
    migrated++;
  } else if ((!originalDriver && updatedDriver === originalDriver) || (!originalHelper && updatedHelper === originalHelper)) {
    // This is fine - empty fields stay empty
  } else {
    console.log(`⚠️  Trip ${trip.id}: Could not find employee "${originalDriver}"`);
    errors++;
  }
});

// Save updated trips
fs.writeFileSync(TRIPS_FILE, JSON.stringify(trips, null, 2));

console.log('✅ Migration Summary:');
console.log(`   ✅ Successfully migrated: ${migrated} trips`);
console.log(`   ⚠️  Errors/not found: ${errors} cases`);
console.log(`   📊 Total trips processed: ${trips.length}`);
console.log('');
console.log('🎉 Trip data migration completed!');
console.log('💡 Next: Frontend components will need updates to resolve UUIDs back to names for display.');
