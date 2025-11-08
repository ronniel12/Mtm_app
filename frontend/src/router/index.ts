import { createRouter, createWebHistory } from 'vue-router'
import DashboardCharts from '../components/DashboardCharts.vue'
import TripList from '../components/TripList.vue'
import TripForm from '../components/TripForm.vue'
import RatesLookup from '../components/RatesLookup.vue'
import Settings from '../components/Settings.vue'
import BillingView from '../components/BillingView.vue'
import BillingHistory from '../components/BillingHistory.vue'
import PayrollView from '../components/PayrollView.vue'
import PayslipHistory from '../components/PayslipHistory.vue'
import TollView from '../components/TollView.vue'
import ExpensesView from '../components/ExpensesView.vue'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: DashboardCharts
  },
  {
    path: '/trips',
    name: 'Trips',
    component: TripList
  },
  {
    path: '/trips/new',
    name: 'NewTrip',
    component: TripForm
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings
  },
  {
    path: '/billing',
    name: 'Billing',
    component: BillingView
  },
  {
    path: '/billing/history',
    name: 'BillingHistory',
    component: BillingHistory
  },
  {
    path: '/payroll',
    name: 'Payroll',
    component: PayrollView
  },
  {
    path: '/payroll/history',
    name: 'PayslipHistory',
    component: PayslipHistory
  },
  {
    path: '/tolls',
    name: 'Tolls',
    component: TollView
  },
  {
    path: '/expenses',
    name: 'Expenses',
    component: ExpensesView
  },
  {
    path: '/fuel',
    name: 'Fuel',
    component: {
      template: `
        <div class="coming-soon">
          <div class="coming-soon-icon">⛽</div>
          <h3>Fuel Tracker Coming Soon</h3>
          <p>This section will track fuel purchases, consumption, and efficiency metrics.</p>
        </div>
      `
    }
  },
  {
    path: '/maintenance',
    name: 'Maintenance',
    component: {
      template: `
        <div class="coming-soon">
          <div class="coming-soon-icon">🏗️</div>
          <h3>Maintenance Tracker Coming Soon</h3>
          <p>This section will track vehicle maintenance schedules and repair history.</p>
        </div>
      `
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
