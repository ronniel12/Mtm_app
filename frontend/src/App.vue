<script setup>
import { ref, computed } from 'vue'
import TripList from './components/TripList.vue'
import TripForm from './components/TripForm.vue'
import RatesLookup from './components/RatesLookup.vue'
import Settings from './components/Settings.vue'
import DashboardCharts from './components/DashboardCharts.vue'
import BillingView from './components/BillingView.vue'
import BillingHistory from './components/BillingHistory.vue'
import PayrollView from './components/PayrollView.vue'
import PayslipHistory from './components/PayslipHistory.vue'
import TollView from './components/TollView.vue'
import ExpensesView from './components/ExpensesView.vue'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL_FALLBACK

const showForm = ref(false)
const activeSection = ref('dashboard')
const refreshKey = ref(0)
const editTrip = ref(null)
const showHistory = ref(false)

const trips = ref([])
const employees = ref([])
const isLoading = ref(true)
const error = ref(null)

const totalRates = computed(() => {
  if (trips.value.length === 0) return 0
  const sum = trips.value.reduce((acc, trip) => acc + (trip.rate || 0), 0)
  return Math.round(sum / trips.value.length)
})

const setActiveSection = (section) => {
  activeSection.value = section
  showForm.value = false
  editTrip.value = null
  showHistory.value = false // Reset history view when switching sections
}

const toggleForm = () => {
  showForm.value = !showForm.value
  if (!showForm.value) {
    editTrip.value = null
  }
}

const onTripAdded = () => {
  showForm.value = false
  editTrip.value = null
  refreshKey.value++
  fetchDashboardData()
}

const onTripEdit = (trip) => {
  editTrip.value = trip
  showForm.value = true
}

const fetchDashboardData = async () => {
  try {
    isLoading.value = true
    error.value = null

    // Use optimized endpoint that includes pre-calculated rates
    const [tripsRes, employeesRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/trips/calculated?limit=all`),
      axios.get(`${API_BASE_URL}/employees`)
    ])

    // Data is already processed by the API with pre-calculated rates
    trips.value = tripsRes.data.trips || []
    employees.value = employeesRes.data
  } catch (err) {
    console.error('Error fetching dashboard data:', err)
    error.value = 'Failed to load dashboard data. Please check if the backend server is running.'
  } finally {
    isLoading.value = false
  }
}



const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString()
}

fetchDashboardData()
</script>

<template>
  <div class="app">
    <header class="top-header">
      <div class="header-content">
        <div class="logo">
          <img src="/mtmlogo.jpeg" alt="MTM Enterprise Logo" class="logo-image" />
          <h1>MTM Enterprise</h1>
        </div>
        <nav class="top-nav">
          <button
            :class="{ active: activeSection === 'dashboard' }"
            @click="setActiveSection('dashboard')"
            class="nav-btn"
          >
            📊 Dashboard
          </button>
          <button
            :class="{ active: activeSection === 'payroll' }"
            @click="setActiveSection('payroll')"
            class="nav-btn"
          >
            💰 Payroll
          </button>
          <button
            :class="{ active: activeSection === 'trips' }"
            @click="setActiveSection('trips')"
            class="nav-btn"
          >
            🚛 Trips
          </button>
          <button
            :class="{ active: activeSection === 'billing' }"
            @click="setActiveSection('billing')"
            class="nav-btn"
          >
            🧾 Billing
          </button>
          <button
            :class="{ active: activeSection === 'tolls' }"
            @click="setActiveSection('tolls')"
            class="nav-btn"
          >
            🛤️ Tolls
          </button>
          <button
            :class="{ active: activeSection === 'fuel' }"
            @click="setActiveSection('fuel')"
            class="nav-btn"
          >
            ⛽ Fuel
          </button>
          <button
            :class="{ active: activeSection === 'expenses' }"
            @click="setActiveSection('expenses')"
            class="nav-btn"
          >
            💸 Expenses
          </button>
          <button
            :class="{ active: activeSection === 'maintenance' }"
            @click="setActiveSection('maintenance')"
            class="nav-btn"
          >
            🔧 Maintenance
          </button>
          <button
            :class="{ active: activeSection === 'settings' }"
            @click="setActiveSection('settings')"
            class="nav-btn"
          >
            ⚙️ Settings
          </button>
        </nav>
      </div>
    </header>

    <main class="main-content">
      <!-- Dashboard Section -->
      <div v-if="activeSection === 'dashboard'" class="section dashboard">
        <div class="section-header">
          <h2>📊 Dashboard</h2>
          <p>Overview of your logistics operations</p>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>Loading dashboard data...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="error-container">
          <div class="error-icon">⚠️</div>
          <h3>Failed to Load Data</h3>
          <p>{{ error }}</p>
          <button @click="fetchDashboardData" class="btn-primary">Retry</button>
        </div>

        <!-- Dashboard Content -->
        <div v-else>
          <DashboardCharts :trips="trips" :employees="employees" />
        </div>
      </div>

      <!-- Trips Section -->
      <div v-if="activeSection === 'trips'" class="section trips">
        <div class="section-header">
          <h2>🚛 Trip Management</h2>
          <div v-if="!showForm && !editTrip">
            <button @click="toggleForm" class="btn-primary">
              + New Trip
            </button>
          </div>
        </div>
        <div v-if="showForm && !editTrip" class="form-container">
          <TripForm :editTrip="editTrip" @tripAdded="onTripAdded" @cancel="toggleForm" />
        </div>
        <div class="trips-content">
          <TripList :key="refreshKey" @tripEdit="onTripEdit" />
        </div>
      </div>

      <!-- Trip Edit Modal -->
      <div v-if="editTrip" class="modal-overlay">
        <div class="modal-content">
          <TripForm :editTrip="editTrip" @tripAdded="onTripAdded" @cancel="toggleForm" />
        </div>
      </div>

      <!-- Settings Section -->
      <div v-if="activeSection === 'settings'" class="section settings">
        <div class="section-header">
          <h2>⚙️ Settings</h2>
          <p>Manage drivers, helpers, and rates</p>
        </div>
        <Settings />
      </div>

      <!-- Billing Section -->
      <div v-if="activeSection === 'billing'" class="section billing">
        <div class="billing-nav">
          <button
            :class="{ active: !showHistory }"
            @click="showHistory = false"
            class="billing-nav-btn"
          >
            📝 Create Billing
          </button>
          <button
            :class="{ active: showHistory }"
            @click="showHistory = true"
            class="billing-nav-btn"
          >
            📋 Billing History
          </button>
        </div>

        <div v-if="!showHistory">
          <BillingView />
        </div>

        <div v-if="showHistory">
          <BillingHistory @switch-to-create="showHistory = false" />
        </div>
      </div>

      <!-- Tolls Section -->
      <div v-if="activeSection === 'tolls'" class="section tolls">
        <TollView />
      </div>

      <!-- Fuel Section -->
      <div v-if="activeSection === 'fuel'" class="section fuel">
        <div class="section-header">
          <h2>⛽ Fuel Management</h2>
          <p>Track fuel consumption and costs</p>
        </div>
        <div class="coming-soon">
          <div class="coming-soon-icon">⛽</div>
          <h3>Fuel Tracker Coming Soon</h3>
          <p>This section will track fuel purchases, consumption, and efficiency metrics.</p>
        </div>
      </div>

      <!-- Expenses Section -->
      <div v-if="activeSection === 'expenses'" class="section expenses">
        <ExpensesView />
      </div>

      <!-- Maintenance Section -->
      <div v-if="activeSection === 'maintenance'" class="section maintenance">
        <div class="section-header">
          <h2>🔧 Maintenance</h2>
          <p>Vehicle maintenance tracking</p>
        </div>
        <div class="coming-soon">
          <div class="coming-soon-icon">🏗️</div>
          <h3>Maintenance Tracker Coming Soon</h3>
          <p>This section will track vehicle maintenance schedules and repair history.</p>
        </div>
      </div>

      <!-- Payroll Section -->
      <div v-if="activeSection === 'payroll'" class="section payroll">
        <div class="billing-nav">
          <button
            :class="{ active: !showHistory }"
            @click="showHistory = false"
            class="billing-nav-btn"
          >
            📝 Create Payslip
          </button>
          <button
            :class="{ active: showHistory }"
            @click="showHistory = true"
            class="billing-nav-btn"
          >
            📑 Payslip History
          </button>
        </div>

        <div v-if="!showHistory">
          <PayrollView />
        </div>

        <div v-if="showHistory">
          <PayslipHistory @switch-to-create="showHistory = false" />
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.top-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  height: 45px;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-image {
  height: 20px;
  width: auto;
  object-fit: contain;
}

.logo h1 {
  margin: 0;
  color: #1f2937;
  font-size: 1.2rem;
  font-weight: 300;
}

.top-nav {
  display: flex;
  justify-content: space-between;
  flex: 1;
  margin-left: 2rem;
}

.nav-btn {
  background: #1e40af;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  flex: 1;
  text-align: center;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2), 0 1px 3px rgba(0, 0, 0, 0.1);
}

.nav-btn:hover {
  background: #1e3a8a;
}

.nav-btn.active {
  background: #1e293b;
  border-bottom: 2px solid #0f172a;
}

.btn-primary {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s ease;
}

.btn-primary:hover {
  background: #45a049;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 65px 2rem 2rem 2rem;
  min-height: calc(100vh - 45px);
  display: flex;
  flex-direction: column;
}

.section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 70vh;
  width: 100%;
}

.form-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  padding: 2rem;
  margin-bottom: 2rem;
}

.dashboard {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  padding: 2rem;
}

.btn-secondary {
  background: #17a2b8;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s ease;
}

.btn-secondary:hover {
  background: #138496;
}

.btn-settings {
  background: #6c757d;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s ease;
}

.btn-settings:hover {
  background: #5a6268;
}

.nav-buttons {
  display: flex;
  gap: 1rem;
}

.rates-container, .settings-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  padding: 2rem;
  margin-bottom: 2rem;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  padding: 2rem;
  max-width: 90%;
  max-height: 90%;
  overflow-y: auto;
  position: relative;
  width: 600px;
}

/* Billing Navigation */
.billing-nav {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.billing-nav-btn {
  background: #f8fafc;
  color: #374151;
  border: 2px solid #e5e7eb;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
  font-weight: 500;
}

.billing-nav-btn:hover {
  background: #e5e7eb;
  border-color: #d1d5db;
}

.billing-nav-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
}

/* Coming Soon Sections */
.coming-soon {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  padding: 3rem 2rem;
  text-align: center;
  margin-top: 2rem;
  width: 100%;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.coming-soon-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.coming-soon h3 {
  color: #333;
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
}

.coming-soon p {
  color: #666;
  margin: 0;
  font-size: 1.1rem;
  line-height: 1.6;
}

/* Loading and Error States */
.loading-container {
  text-align: center;
  padding: 3rem 2rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-container p {
  color: #666;
  margin: 0;
  font-size: 1.1rem;
}

.error-container {
  text-align: center;
  padding: 3rem 2rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  margin-top: 2rem;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-container h3 {
  color: #dc2626;
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
}

.error-container p {
  color: #991b1b;
  margin: 0 0 1.5rem 0;
  font-size: 1.1rem;
  line-height: 1.6;
}
</style>
