const fs = require('fs');
const path = require('path');
const { query } = require('./backend/db');

async function migrateData() {
  try {
    console.log('🚀 Starting data migration from JSON to PostgreSQL...\n');

    // Read JSON files
    const dataDir = path.join(__dirname, 'data');
    const tripsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'trips.json'), 'utf8'));
    const employeesData = JSON.parse(fs.readFileSync(path.join(dataDir, 'employees.json'), 'utf8'));
    const ratesData = JSON.parse(fs.readFileSync(path.join(dataDir, 'rates.json'), 'utf8'));
    const billingsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'billings.json'), 'utf8'));
    const payslipsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'payslips.json'), 'utf8'));
    const deductionsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'deductions.json'), 'utf8'));

    console.log(`📊 Found ${tripsData.length} trips`);
    console.log(`👥 Found ${employeesData.length} employees`);
    console.log(`💰 Found ${ratesData.length} rates`);
    console.log(`📄 Found ${billingsData.length} billings`);
    console.log(`💵 Found ${payslipsData.length} payslips`);
    console.log(`➖ Found ${deductionsData.length} deductions\n`);

    // Clear existing data (optional - for clean migration)
    console.log('🧹 Clearing existing data...');
    await query('DELETE FROM deductions');
    await query('DELETE FROM payslips');
    await query('DELETE FROM billings');
    await query('DELETE FROM trips');
    await query('DELETE FROM rates');
    await query('DELETE FROM employees');
    console.log('✅ Existing data cleared\n');

    // Insert employees first (referenced by other tables)
    console.log('👥 Migrating employees...');
    for (const employee of employeesData) {
      await query(`
        INSERT INTO employees (uuid, name, phone, license_number, address, cash_advance, loans)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (uuid) DO NOTHING
      `, [employee.uuid, employee.name, employee.phone, employee.licenseNumber || '', employee.address, employee.cashAdvance || 0, employee.loans || 0]);
    }
    console.log(`✅ Migrated ${employeesData.length} employees\n`);

    // Insert rates
    console.log('💰 Migrating rates...');
    let rateCounter = 1000; // Start from a high number to avoid conflicts
    for (const rate of ratesData) {
      const rateId = rate.id || rateCounter++;
      await query(`
        INSERT INTO rates (id, origin, province, town, rate, new_rates)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `, [rateId, rate.origin || '', rate.province || '', rate.town || '', rate.rate || 0, rate.newRates || rate.rate || 0]);
    }
    console.log(`✅ Migrated ${ratesData.length} rates\n`);

    // Insert trips
    console.log('🚛 Migrating trips...');
    for (const trip of tripsData) {
      await query(`
        INSERT INTO trips (
          id, tracking_number, date, truck_plate, invoice_number, origin, farm_name,
          destination, full_destination, number_of_bags, driver, helper,
          status, rate_lookup_key
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (id) DO NOTHING
      `, [
        trip.id, trip.trackingNumber, trip.date, trip.truckPlate, trip.invoiceNumber,
        trip.origin, trip.farmName, trip.destination, trip.fullDestination,
        trip.numberOfBags, trip.driver, trip.helper, trip.status,
        trip.rateLookupKey
      ]);
    }
    console.log(`✅ Migrated ${tripsData.length} trips\n`);

    // Insert billings
    console.log('📄 Migrating billings...');
    for (const billing of billingsData) {
      await query(`
        INSERT INTO billings (
          id, billing_number, client_name, amount, payment_status, due_date, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING
      `, [billing.id, billing.billingNumber || '', billing.clientName || '', billing.amount || 0, billing.status || 'pending', billing.dueDate, billing.notes || '']);
    }
    console.log(`✅ Migrated ${billingsData.length} billings\n`);

    // Insert payslips
    console.log('💵 Migrating payslips...');
    for (const payslip of payslipsData) {
      await query(`
        INSERT INTO payslips (
          id, payslip_number, employee_uuid, period_start, period_end,
          gross_pay, deductions, net_pay, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING
      `, [
        payslip.id, payslip.payslipNumber || '', payslip.employeeId,
        payslip.periodStart, payslip.periodEnd,
        payslip.grossPay || 0, payslip.deductions || 0, payslip.netPay || 0,
        payslip.status || 'pending'
      ]);
    }
    console.log(`✅ Migrated ${payslipsData.length} payslips\n`);

    // Insert deductions
    console.log('➖ Migrating deductions...');
    let deductionCounter = 1; // Start from 1 for deductions
    for (const deduction of deductionsData) {
      await query(`
        INSERT INTO deductions (id, name, type, value, is_default)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO NOTHING
      `, [deductionCounter++, deduction.name || deduction.description || '', deduction.type || '', deduction.amount || deduction.value || 0, deduction.isDefault || false]);
    }
    console.log(`✅ Migrated ${deductionsData.length} deductions\n`);

    // Verify migration
    console.log('🔍 Verifying migration...');
    const tripCount = await query('SELECT COUNT(*) as count FROM trips');
    const employeeCount = await query('SELECT COUNT(*) as count FROM employees');
    const rateCount = await query('SELECT COUNT(*) as count FROM rates');

    console.log(`📊 Verification Results:`);
    console.log(`   🚛 Trips: ${tripCount.rows[0].count}`);
    console.log(`   👥 Employees: ${employeeCount.rows[0].count}`);
    console.log(`   💰 Rates: ${rateCount.rows[0].count}`);

    console.log('\n🎉 Data migration completed successfully!');
    console.log('✅ All your JSON data has been imported to PostgreSQL');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
migrateData()
  .then(() => {
    console.log('\n🏁 Migration script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
