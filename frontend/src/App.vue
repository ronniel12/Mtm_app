<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

// Helper function to get current section for navigation highlighting
const getCurrentSection = () => {
  const path = route.path
  if (path === '/') return 'dashboard'
  if (path.startsWith('/trips')) return 'trips'
  if (path.startsWith('/billing')) return 'billing'
  if (path.startsWith('/payroll')) return 'payroll'
  if (path.startsWith('/tolls')) return 'tolls'
  if (path.startsWith('/fuel')) return 'fuel'
  if (path.startsWith('/expenses')) return 'expenses'
  if (path.startsWith('/maintenance')) return 'maintenance'
  if (path.startsWith('/settings')) return 'settings'
  return 'dashboard'
}
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
          <router-link
            to="/"
            :class="{ active: getCurrentSection() === 'dashboard' }"
            class="nav-btn"
          >
            📊 Dashboard
          </router-link>
          <router-link
            to="/payroll"
            :class="{ active: getCurrentSection() === 'payroll' }"
            class="nav-btn"
          >
            💰 Payroll
          </router-link>
          <router-link
            to="/trips"
            :class="{ active: getCurrentSection() === 'trips' }"
            class="nav-btn"
          >
            🚛 Trips
          </router-link>
          <router-link
            to="/billing"
            :class="{ active: getCurrentSection() === 'billing' }"
            class="nav-btn"
          >
            🧾 Billing
          </router-link>
          <router-link
            to="/tolls"
            :class="{ active: getCurrentSection() === 'tolls' }"
            class="nav-btn"
          >
            🛤️ Tolls
          </router-link>
          <router-link
            to="/fuel"
            :class="{ active: getCurrentSection() === 'fuel' }"
            class="nav-btn"
          >
            ⛽ Fuel
          </router-link>
          <router-link
            to="/expenses"
            :class="{ active: getCurrentSection() === 'expenses' }"
            class="nav-btn"
          >
            💸 Expenses
          </router-link>
          <router-link
            to="/maintenance"
            :class="{ active: getCurrentSection() === 'maintenance' }"
            class="nav-btn"
          >
            🔧 Maintenance
          </router-link>
          <router-link
            to="/settings"
            :class="{ active: getCurrentSection() === 'settings' }"
            class="nav-btn"
          >
            ⚙️ Settings
          </router-link>
        </nav>
      </div>
    </header>

    <main class="main-content">
      <router-view />
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
