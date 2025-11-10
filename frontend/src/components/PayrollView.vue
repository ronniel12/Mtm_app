<template>
  <div class="payroll-statement">
    <!-- Filters Section -->
    <div class="filters-section">
      <div class="date-filters">
        <div class="filter-group">
          <label for="start-date">Start Date:</label>
          <input type="date" id="start-date" v-model="startDate" class="date-input" @input="filterEmployeeTripData" />
        </div>
        <div class="filter-group">
          <label for="end-date">End Date:</label>
          <input type="date" id="end-date" v-model="endDate" class="date-input" @input="filterEmployeeTripData" />
        </div>
        <div class="filter-group">
          <label for="employee-name">Employee Name:</label>
            <select id="employee-name" v-model="selectedEmployeeUuid" @change="filterEmployeeTripData" class="employee-select">
            <option value="">Select Employee</option>
            <option v-for="employee in employees" :key="employee.uuid" :value="employee.uuid">
              {{ employee.name }}
            </option>
          </select>
        </div>

      </div>

      <!-- Signature Section -->
      <div class="signature-section">
        <div class="signature-group">
          <label for="prepared-by">Prepared by:</label>
          <input type="text" id="prepared-by" v-model="preparedBy" class="signature-input" placeholder="Enter name" />
        </div>
      </div>
    </div>

    <!-- Company Header - Centered -->
    <div class="company-header">
      <div class="company-info-centered">
        <div class="logo-container">
          <img src="/mtmlogo.jpeg" alt="MTM Enterprise Logo" class="company-logo-large" />
        </div>
        <h1 class="company-name-small">MTM ENTERPRISE</h1>
        <div class="company-details-small">
          <p>0324 P. Damaso St. Virgen Delas Flores Baliuag Bulacan</p>
          <p>TIN # 175-434-337-000</p>
          <p>Mobile No. 09605638462 / Telegram No. +358-044-978-8592</p>
        </div>
        <h2 class="payroll-statement-title">PAYSLIP</h2>
      </div>
    </div>

    <!-- Employee Information -->
    <div class="employee-info-section">
      <div class="employee-info-left">
        <div class="employee-name-info">
          <strong>Employee Name:</strong> {{ selectedEmployeeName }}
        </div>

      </div>
      <div class="employee-info-right">
        <div class="payslip-number-info">
          <strong>Payslip Number:</strong> {{ payslipNumber }}
        </div>
        <div class="period-info">
          <strong>Period Covered:</strong> {{ formatPeriod() }}
        </div>
        <div class="generated-info">
          <strong>Date Generated:</strong> {{ formatDate(new Date()) }}
        </div>
      </div>
    </div>

    <!-- Payroll Table -->
    <div class="payroll-table-container">
      <table class="payroll-table">
        <thead>
          <tr class="header-row">
            <th class="date-col">DATE</th>
            <th class="plate-col">PLATE NUMBER</th>
            <th class="invoice-col">INVOICE NUMBER</th>
            <th class="destination-col">DESTINATION</th>
            <th class="bags-col">BAGS</th>
            <th class="position-marker">POS</th>
            <th class="rate-col">RATE</th>
            <th class="total-col">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          <!-- Data rows -->
          <tr v-for="(trip, index) in filteredEmployeeTrips" :key="trip.id" class="data-row" :class="{ 'alt-row': index % 2 === 1 }">
            <td class="date-cell">{{ formatDateShort(trip.date) }}</td>
            <td class="plate-cell">{{ trip.truckPlate }}</td>
            <td class="invoice-cell">{{ trip.invoiceNumber }}</td>
            <td class="destination-cell">{{ trip.fullDestination }}</td>
            <td class="bags-cell text-center">{{ trip.numberOfBags }}</td>
            <td class="position-marker text-center">{{ trip._role }}</td>
            <td class="rate-cell text-right">{{ trip._rate ? formatCurrency(trip._rate - 4) : '0.00' }}</td>
            <td class="total-cell text-right">{{ trip._rate && trip.numberOfBags ? formatCurrency((trip._rate - 4) * trip.numberOfBags * trip._commission) : '0.00' }}</td>
          </tr>

          <!-- Spacer row -->
          <tr class="spacer-row">
            <td colspan="7"></td>
          </tr>

          <!-- Totals section -->
          <tr class="totals-row">
            <td class="text-left fw-bold totals-label">GROSS PAY:</td>
            <td></td>
            <td></td>
            <td></td>
            <td class="text-center fw-bold totals-bags">{{ totalBags }}</td>
            <td></td>
            <td></td>
            <td class="text-center fw-bold totals-amount">₱{{ formatCurrency(totalPay) }}</td>
          </tr>

          <!-- Individual Deductions rows - show each deduction itemized -->
          <tr v-for="(deduction, index) in deductions" :key="deduction.name + index" class="individual-deduction-row">
            <td class="text-left fw-bold individual-deduction-label">
              {{ deduction.name }}
              <span class="deduction-type-indicator">
                ({{ deduction.type === 'percentage' ? deduction.value + '%' : '₱' + formatCurrency(deduction.value) }})
              </span>
            </td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td class="text-center fw-bold individual-deduction-amount">
              -₱{{ formatCurrency(deduction.type === 'percentage' ? (totalPay * deduction.value / 100) : deduction.value) }}
            </td>
          </tr>

          <!-- Total Deductions summary row - only show if deductions exist -->
          <tr v-if="deductions.length > 0" class="total-deductions-row">
            <td class="text-left fw-bold total-deductions-label">TOTAL DEDUCTIONS:</td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td class="text-center fw-bold total-deductions-amount">-₱{{ formatCurrency(totalDeductions) }}</td>
          </tr>

          <!-- Net Pay row - only show if deductions exist -->
          <tr v-if="deductions.length > 0" class="net-pay-row">
            <td class="text-left fw-bold net-pay-label">NET PAY:</td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td class="text-center fw-bold net-pay-amount">₱{{ formatCurrency(netPay) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Prepared by Section -->
    <div class="prepared-by-section">
      <div class="prepared-by-info">
        <strong>Prepared by:</strong> {{ preparedBy || '_______________________________' }}
      </div>
    </div>

    <!-- Control Buttons -->
    <div class="payroll-controls">
      <button class="btn btn-deductions" @click="openDeductionsModal">Deductions</button>
      <button class="btn btn-save" @click="savePayslip">Save Payslip</button>
      <button class="btn btn-excel" @click="exportExcel">Export to Excel</button>
      <button class="btn btn-print" @click="printStatement">Print Statement</button>
    </div>

    <!-- Deductions Modal -->
    <div v-if="showDeductionsModal" class="modal-overlay" @click="closeDeductionsModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Add Deductions</h3>
          <button class="modal-close" @click="closeDeductionsModal">&times;</button>
        </div>

        <div class="modal-body">
          <!-- Auto-Applied Deductions Info -->
          <div class="auto-deductions-info" v-if="deductions.length > 0">
            <div class="info-box">
              <h4>✓ Auto-Applied Deductions:</h4>
              <p style="color: #28a745; margin: 0.5rem 0;">
                All saved deductions from your database have been automatically applied to this payslip.
              </p>
              <div class="auto-deductions-list">
                <div v-for="deduction in deductions" :key="deduction.name" class="auto-deduction-item">
                  <strong>{{ deduction.name }}</strong> - {{ deduction.type === 'percentage' ? deduction.value + '%' : '₱' + formatCurrency(deduction.value) }}
                </div>
              </div>
            </div>
            <hr style="margin: 1rem 0; border-color: #dee2e6;">
          </div>

          <!-- Saved Deductions Management -->
          <div class="saved-deductions-management">
            <h4>Manage Saved Deductions:</h4>
            <div class="management-controls">
              <button class="btn btn-manage" @click="showManagementView = !showManagementView">
                {{ showManagementView ? 'Hide' : 'Show' }} Management Tools
              </button>
            </div>

            <div v-if="showManagementView" class="management-view">
              <div class="saved-deductions-list">
                <h5>Current Saved Deductions:</h5>
                <div v-if="availableDeductions.length === 0" class="no-saved-deductions">
                  <p style="color: #6c757d; margin: 0;">No saved deductions available.</p>
                </div>
                <div v-else class="saved-deduction-item" v-for="deduction in availableDeductions" :key="deduction.id">
                  <div class="deduction-details">
                    <strong>{{ deduction.name }}</strong> -
                    <span :class="deduction.type === 'percentage' ? 'percentage-type' : 'amount-type'">
                      {{ deduction.type === 'percentage' ? `${deduction.value}%` : `₱${formatCurrency(deduction.value)}` }}
                    </span>
                  </div>
                  <div class="deduction-actions">
                    <button class="btn-edit" @click="startEditDeduction(deduction)" title="Edit deduction">
                      ✏️
                    </button>
                    <button class="btn-delete" @click="deleteDeduction(deduction)" title="Delete deduction">
                      🗑️
                    </button>
                  </div>
                </div>
              </div>

              <!-- Edit Deduction Form -->
              <div v-if="isEditing" class="edit-deduction-form" style="margin-top: 2rem; padding: 1rem; background: #fff3e0; border-radius: 8px; border: 1px solid #ffcc02;">
                <h5>Edit Deduction: {{ editDeductionForm.name }}</h5>
                <div class="form-group">
                  <label for="edit-deduction-name">Deduction Name:</label>
                  <input type="text" id="edit-deduction-name" v-model="editDeductionForm.name" placeholder="Enter deduction name" class="deduction-input" />
                </div>
                <div class="form-group">
                  <label for="edit-deduction-type">Deduction Type:</label>
                  <select id="edit-deduction-type" v-model="editDeductionForm.type" class="deduction-select">
                    <option value="percentage">Percentage (%)</option>
                    <option value="amount">Fixed Amount</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="edit-deduction-value">Value:</label>
                  <input type="number" id="edit-deduction-value" v-model="editDeductionForm.value" :placeholder="editDeductionForm.type === 'percentage' ? 'Enter percentage' : 'Enter amount'" class="deduction-input" :step="editDeductionForm.type === 'percentage' ? '0.01' : '0.01'" min="0" />
                </div>
                <div class="form-actions">
                  <button class="btn btn-add" @click="updateDeduction">Update Deduction</button>
                  <button class="btn btn-clear" @click="cancelEdit">Cancel</button>
                </div>
              </div>
            </div>
          </div>

          <hr style="margin: 1rem 0; border-color: #dee2e6;">

          <!-- Quick Add Section - Available Deductions (if any exist) -->
          <div class="deduction-quick-add" v-if="availableDeductions.length > 0">
            <h4>Additional Saved Deductions:</h4>
            <div class="deduction-templates">
              <div class="template-grid">
                <button
                  v-for="deduction in availableDeductions"
                  :key="deduction.id"
                  class="btn-template"
                  @click="quickAddDeduction(deduction)"
                >
                  {{ deduction.name }}<br>
                  <small>{{ deduction.type === 'percentage' ? deduction.value + '%' : '₱' + formatCurrency(deduction.value) }}</small>
                </button>
              </div>
            </div>
            <hr style="margin: 1rem 0; border-color: #dee2e6;">
          </div>

          <!-- Info message when no saved deductions -->
          <div class="deduction-info-message" v-if="availableDeductions.length === 0">
            <p style="color: #6c757d; font-size: 0.9rem; margin: 0;">
              <em>No saved deductions available. Add custom deductions below, or create favorites by saving commonly used ones.</em>
            </p>
          </div>

          <!-- Custom Add Section -->
          <div class="deduction-form">
            <h4>Add Custom Deduction:</h4>
            <div class="form-group">
              <label for="deduction-name">Deduction Name:</label>
              <input type="text" id="deduction-name" v-model="newDeduction.name" placeholder="Enter deduction name" class="deduction-input" />
            </div>

            <div class="form-group">
              <label for="deduction-type">Deduction Type:</label>
              <select id="deduction-type" v-model="newDeduction.type" class="deduction-select">
                <option value="percentage">Percentage (%)</option>
                <option value="amount">Fixed Amount</option>
              </select>
            </div>

            <div class="form-group">
              <label for="deduction-value">Value:</label>
              <input type="number" id="deduction-value" v-model="newDeduction.value" :placeholder="newDeduction.type === 'percentage' ? 'Enter percentage' : 'Enter amount'" class="deduction-input" :step="newDeduction.type === 'percentage' ? '0.01' : '0.01'" min="0" />
            </div>

            <div class="form-actions">
              <button class="btn btn-add" @click="addDeduction">Add Deduction</button>
              <button class="btn btn-clear" @click="clearForm">Clear</button>
            </div>
          </div>

          <div class="deductions-list" v-if="deductions.length > 0">
            <h4>Current Deductions:</h4>
            <div class="deduction-item" v-for="(deduction, index) in deductions" :key="index">
              <span class="deduction-name">{{ deduction.name }}</span>
              <span class="deduction-value">
                {{ deduction.type === 'percentage' ? `${deduction.value}%` : `₱${formatCurrency(deduction.value)}` }}
              </span>
              <button class="btn-remove" @click="removeDeduction(index)">Remove</button>
            </div>
          </div>

          <div class="deductions-summary" v-if="deductions.length > 0">
            <div class="summary-item">
              <strong>Gross Pay:</strong> ₱{{ formatCurrency(totalPay) }}
            </div>
            <div class="summary-item">
              <strong>Total Deductions:</strong> ₱{{ formatCurrency(totalDeductions) }}
            </div>
            <div class="summary-item total-net-pay">
              <strong>Net Pay:</strong> ₱{{ formatCurrency(netPay) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'

const trips = ref([])
const employees = ref([])
const startDate = ref('')
const endDate = ref('')
const selectedEmployeeUuid = ref('')
const preparedBy = ref('')
const payslipNumber = ref('')

// Available default deductions from server
const availableDeductions = ref([])

// Deductions data
const showDeductionsModal = ref(false)
const deductions = ref([])
const newDeduction = ref({
  name: '',
  type: 'percentage',
  value: 0
})

// Management view
const showManagementView = ref(false)

// Computed properties
const selectedEmployeeName = computed(() => {
  if (!selectedEmployeeUuid.value) return ''

  const employee = employees.value.find(emp => emp.uuid === selectedEmployeeUuid.value)
  return employee ? employee.name : ''

  // Legacy code - remove when verified working
  // if (!selectedEmployeeId.value) return ''
  // Parse position from the selectedEmployeeId (format: "driver-1" or "helper-1")
  // const [position, id] = selectedEmployeeId.value.split('-')
  // if (position === 'driver') {
  //   const driver = drivers.value.find(d => d.id == id)
  //   if (driver) return driver.name
  // } else if (position === 'helper') {
  //   const helper = helpers.value.find(h => h.id == id)
  //   if (helper) return helper.name
  // }
  // return ''
})

const expandEmployeeTrips = (trips) => {
  const expandedTrips = []

  trips.forEach(trip => {
    // If employee was driver, add a driver entry
    if (trip.driver === selectedEmployeeUuid.value) {
      expandedTrips.push({
        ...trip,
        // Map database snake_case fields to camelCase for component use
      truckPlate: trip.truckPlate,
        invoiceNumber: trip.invoiceNumber,
        fullDestination: trip.fullDestination || trip.destination,
        numberOfBags: trip.numberOfBags,
        _role: 'D', // Driver marker
        _commission: 0.11,
        _displayPosition: 'Driver'
      })
    }

    // If employee was helper (and different from driver), add a helper entry
    // Or if employee was both roles, add both entries
    if (trip.helper === selectedEmployeeUuid.value) {
      expandedTrips.push({
        ...trip,
        // Map database snake_case fields to camelCase for component use
        truckPlate: trip.truckPlate,
        invoiceNumber: trip.invoiceNumber,
        fullDestination: trip.fullDestination || trip.destination,
        numberOfBags: trip.numberOfBags,
        _role: 'H', // Helper marker
        _commission: 0.10,
        _displayPosition: 'Helper'
      })
    }
  })

  return expandedTrips
}

const filteredEmployeeTrips = computed(() => {
  if (!startDate.value || !endDate.value || !selectedEmployeeUuid.value) {
    return []
  }

  const start = new Date(startDate.value)
  const end = new Date(endDate.value)
  end.setHours(23, 59, 59, 999)

  // First, filter trips where employee participated
  const participatingTrips = trips.value.filter(trip => {
    const tripDate = new Date(trip.date)
    const isInDateRange = tripDate >= start && tripDate <= end
    const isCompleted = trip.status === 'Completed'

    // Check if the employee participated in this trip (either as driver or helper)
    const employeeParticipated = (trip.driver === selectedEmployeeUuid.value) ||
                                 (trip.helper === selectedEmployeeUuid.value)

    return isInDateRange && isCompleted && employeeParticipated
  })

  // Then expand to show separate entries for each role
  // If employee was both driver and helper on same trip, they get two entries
  return expandEmployeeTrips(participatingTrips).sort((a, b) => {
    // Sort by date, then by truck plate to group related trips together
    if (a.date !== b.date) return new Date(a.date) - new Date(b.date)
    return (a.truckPlate || '').localeCompare(b.truckPlate || '')
  })
})

const totalPay = computed(() => {
  return filteredEmployeeTrips.value.reduce((sum, trip) => {
    if (trip._rate && trip.numberOfBags) {
      // Use pre-calculated commission from the expanded trip data structure
      const adjustedRate = trip._rate - 4
      const pay = (adjustedRate * trip.numberOfBags) * trip._commission
      return sum + pay
    }
    return sum
  }, 0)
})

const totalBags = computed(() => {
  return filteredEmployeeTrips.value.reduce((sum, trip) => {
    return sum + (trip.numberOfBags || 0)
  }, 0)
})

const autoApplySavedDeductions = () => {
  if (selectedEmployeeUuid.value && startDate.value && endDate.value && availableDeductions.value.length > 0) {
    // Clear current deductions and auto-apply all saved deductions
    deductions.value = availableDeductions.value.map(deduction => ({
      name: deduction.name,
      type: deduction.type,
      value: deduction.value
    }))

    console.log('Auto-applied deductions:', deductions.value.length, 'items')
  } else {
    // Clear deductions if no filters selected
    deductions.value = []
  }
}

// Edit deduction functionality
const editDeductionForm = ref({
  id: '',
  name: '',
  type: 'percentage',
  value: 0
})

const isEditing = ref(false)

const startEditDeduction = (deduction) => {
  editDeductionForm.value = {
    id: deduction.id,
    name: deduction.name,
    type: deduction.type,
    value: deduction.value
  }
  isEditing.value = true
}

const updateDeduction = async () => {
  if (!editDeductionForm.value.id || !editDeductionForm.value.name || editDeductionForm.value.value <= 0) {
    alert('Please fill in all fields correctly.')
    return
  }

  try {
    const response = await axios.put(`${API_BASE_URL}/deductions/${editDeductionForm.value.id}`, {
      name: editDeductionForm.value.name,
      type: editDeductionForm.value.type,
      value: parseFloat(editDeductionForm.value.value),
      isDefault: false
    })

    if (response.status === 200) {
      // Update local availableDeductions
      const index = availableDeductions.value.findIndex(d => d.id === editDeductionForm.value.id)
      if (index !== -1) {
        availableDeductions.value[index] = {
          ...availableDeductions.value[index],
          name: editDeductionForm.value.name,
          type: editDeductionForm.value.type,
          value: parseFloat(editDeductionForm.value.value)
        }

        // Update current deductions if this deduction is applied
        const currentIndex = deductions.value.findIndex(d => d.name === editDeductionForm.value.name)
        if (currentIndex !== -1) {
          deductions.value[currentIndex] = {
            name: editDeductionForm.value.name,
            type: editDeductionForm.value.type,
            value: parseFloat(editDeductionForm.value.value)
          }
        }
      }

      alert(`Saved deduction "${editDeductionForm.value.name}" updated successfully!`)
      isEditing.value = false
      editDeductionForm.value = { id: '', name: '', type: 'percentage', value: 0 }
    }
  } catch (error) {
    console.error('Error updating deduction:', error)
    alert('Failed to update deduction. Please try again.')
  }
}

const deleteDeduction = async (deduction) => {
  if (confirm(`Are you sure you want to delete "${deduction.name}" from saved deductions? This cannot be undone.`)) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/deductions/${deduction.id}`)

      if (response.status === 200) {
        // Remove from availableDeductions
        availableDeductions.value = availableDeductions.value.filter(d => d.id !== deduction.id)

        // Remove from current deductions if applied
        deductions.value = deductions.value.filter(d => d.name !== deduction.name)

        alert(`Saved deduction "${deduction.name}" deleted successfully!`)
      }
    } catch (error) {
      console.error('Error deleting deduction:', error)
      alert('Failed to delete deduction. Please try again.')
    }
  }
}

const cancelEdit = () => {
  isEditing.value = false
  editDeductionForm.value = { id: '', name: '', type: 'percentage', value: 0 }
}

const totalDeductions = computed(() => {
  return deductions.value.reduce((sum, deduction) => {
    if (deduction.type === 'percentage') {
      return sum + (totalPay.value * (deduction.value / 100))
    } else {
      return sum + deduction.value
    }
  }, 0)
})

const netPay = computed(() => {
  return totalPay.value - totalDeductions.value
})

// Deduction methods
const openDeductionsModal = () => {
  showDeductionsModal.value = true
}

const closeDeductionsModal = () => {
  showDeductionsModal.value = false
}

const quickAddDeduction = (templateDeduction) => {
  // Check if deduction already exists
  const exists = deductions.value.find(d => d.name === templateDeduction.name)
  if (exists) {
    alert(`${templateDeduction.name} is already added.`)
    return
  }

  // Add the deduction with its predefined values
  deductions.value.push({
    name: templateDeduction.name,
    type: templateDeduction.type,
    value: templateDeduction.value
  })

  alert(`Added ${templateDeduction.name} (${templateDeduction.type === 'percentage' ? templateDeduction.value + '%' : '₱' + formatCurrency(templateDeduction.value)})`)
}

const addDeduction = async () => {
  if (!newDeduction.value.name || newDeduction.value.value <= 0) {
    alert('Please enter a valid deduction name and value.')
    return
  }

  // Check if deduction with same name already exists in available deductions
  const exists = availableDeductions.value.find(d => d.name.toLowerCase() === newDeduction.value.name.toLowerCase())
  if (exists) {
    alert(`A saved deduction with the name "${newDeduction.value.name}" already exists. Please use that instead or choose a different name.`)
    return
  }

  const deductionData = {
    id: newDeduction.value.id && newDeduction.value.id.includes('-') ? newDeduction.value.id : `custom-${Date.now()}`,
    name: newDeduction.value.name,
    type: newDeduction.value.type,
    value: parseFloat(newDeduction.value.value),
    isCustom: true
  }

  try {
    // Save to database first
    const response = await axios.post(`${API_BASE_URL}/deductions`, deductionData)

    if (response.status === 201) {
      // Add to local deductions for this session
      deductions.value.push({
        name: deductionData.name,
        type: deductionData.type,
        value: deductionData.value
      })

      // Add to available deductions for future quick-add
      availableDeductions.value.push(deductionData)

      alert(`Custom deduction "${deductionData.name}" saved and added! It will be available for quick-add in future sessions.`)

      clearForm()
    } else {
      throw new Error('Failed to save deduction')
    }
  } catch (error) {
    console.error('Error saving deduction:', error)
    alert('Failed to save deduction to database. Please try again.')
  }
}

const removeDeduction = (index) => {
  deductions.value.splice(index, 1)
}

const clearForm = () => {
  newDeduction.value = {
    name: '',
    type: 'percentage',
    value: 0
  }
}

// Methods
const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-PH')
}

const formatDateShort = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const formatPeriod = () => {
  if (!startDate.value || !endDate.value) return 'Please select date range'
  return `${formatDate(startDate.value)} to ${formatDate(endDate.value)}`
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

const filterEmployeeTripData = () => {
  // Generate new payslip number whenever filters change (especially dates)
  generatePayslipNumber()

  // Auto-apply saved deductions when filters are valid
  autoApplySavedDeductions()

  // This is called when filters change, computed property will automatically update
  console.log('Filtering with:', {
    selectedEmployeeUuid: selectedEmployeeUuid.value,
    selectedEmployeeName: selectedEmployeeName.value,
    autoDeductions: deductions.value.length,
    payslipNumber: payslipNumber.value
  })
}

const exportPDF = () => {
  // Create a new window for PDF export
  const pdfWindow = window.open('', '_blank')
  if (!pdfWindow) {
    alert('Please allow popups for PDF export to work.')
    return
  }

  const companyInfo = `MTM ENTERPRISE<br>
0324 P. Damaso St. Virgen Delas Flores Baliuag Bulacan<br>
TIN # 175-434-337-000<br>
Mobile No. 09605638462 / Telegram No. +358-044-978-8592`

  let tableHTML = `
<table style="width: 100%; border-collapse: collapse; font-size: 10px; font-family: 'Courier New', monospace; margin-top: 20px;">
<thead>
<tr style="background: #f0f0f0;">
<th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">DATE</th>
<th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">PLATE NUMBER</th>
<th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">INVOICE NUMBER</th>
<th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">DESTINATION</th>
<th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">BAGS</th>
<th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">POS</th>
<th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">RATE</th>
<th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">TOTAL</th>
</tr>
</thead>
<tbody>`

filteredEmployeeTrips.value.forEach((trip, index) => {
    const bgColor = index % 2 === 1 ? '#fafafa' : 'white'
    tableHTML += `
<tr style="background: ${bgColor}; page-break-inside: avoid;">
<td style="border: 1px solid #000; padding: 2px; text-align: center; font-size: 8px;">${formatDateShort(trip.date)}</td>
<td style="border: 1px solid #000; padding: 2px; text-align: center; font-size: 8px;">${trip.truckPlate}</td>
<td style="border: 1px solid #000; padding: 2px; text-align: center; font-size: 8px;">${trip.invoiceNumber}</td>
<td style="border: 1px solid #000; padding: 2px; text-align: center; font-size: 8px;">${trip.fullDestination}</td>
<td style="border: 1px solid #000; padding: 2px; text-align: center; font-size: 8px;">${trip.numberOfBags}</td>
<td style="border: 1px solid #000; padding: 2px; text-align: center; font-size: 8px;">${trip._role}</td>
<td style="border: 1px solid #000; padding: 2px; text-align: right; font-size: 8px;">₱${trip._rate ? formatCurrency(trip._rate - 4) : '0.00'}</td>
<td style="border: 1px solid #000; padding: 2px; text-align: right; font-size: 8px;">₱${trip._total ? formatCurrency((trip._rate - 4) * trip.numberOfBags * trip._commission) : '0.00'}</td>
</tr>`
  })

    tableHTML += `
<tr style="background: #e0e0e0; font-weight: bold;">
<td colspan="4" style="border: 2px solid #000; padding: 10px; text-align: left; font-size: 12px;">GROSS PAY:</td>
<td style="border: 2px solid #000; padding: 10px; text-align: center; font-size: 14px;">${totalBags.value}</td>
<td style="border: 2px solid #000; padding: 10px; text-align: center;"></td>
<td style="border: 2px solid #000; padding: 10px; text-align: right; font-size: 14px;">₱${formatCurrency(totalPay.value)}</td>
</tr>`

  // First show NET PAY above the table, then deductions below
  tableHTML += `
<tr style="background: #d1ecf1; font-weight: bold; border: 2px solid #28a745;">
<td colspan="4" style="border: 2px solid #28a745; padding: 10px; text-align: left; font-size: 12px; color: #0c5460;">NET PAY:</td>
<td style="border: 2px solid #28a745; padding: 10px; text-align: center;"></td>
<td style="border: 2px solid #28a745; padding: 10px; text-align: center;"></td>
<td style="border: 2px solid #28a745; padding: 10px; text-align: right; font-size: 16px; color: #28a745;">₱${formatCurrency(netPay.value)}</td>
</tr>`

  const employeeInfo = `<strong>Employee Name:</strong> ${selectedEmployeeName.value}<br>
<strong>Employee UUID:</strong> ${selectedEmployeeUuid.value}<br>
<strong>Payslip Number:</strong> ${payslipNumber.value}<br>
<strong>Period Covered:</strong> ${formatPeriod()}<br>
<strong>Date Generated:</strong> ${formatDate(new Date())}`

  const printContent = `
<!DOCTYPE html>
<html>
<head>
<title>Print Preview</title>
<style>
@media print {
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; font-size: 12px; color: #000; padding: 20mm; }
  .company-name-pdf { font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 2px; margin-bottom: 20px; }
  .company-details-pdf { font-size: 12px; text-align: center; line-height: 1.4; margin-bottom: 20px; }
  .employee-info-pdf { margin-bottom: 20px; font-size: 12px; }
  @page { size: A4; margin: 25mm; orientation: portrait; }
}
</style>
</head>
<body style="font-family: 'Courier New', monospace; font-size: 12px; color: #000; background: white; margin: 0; padding: 20px;">
<div style="border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; text-align: center;">
<h1 class="company-name-pdf">MTM ENTERPRISE</h1>
<div class="company-details-pdf">
${companyInfo}
</div>
<h2 style="font-size: 18px; font-weight: bold; margin: 15px 0;">PAYSLIP</h2>
</div>

<div class="employee-info-pdf" style="margin-top: 15px; line-height: 1.6;">
${employeeInfo}
</div>

${tableHTML}
</body>
</html>`

  pdfWindow.document.write(printContent)
  pdfWindow.document.close()

  // Automatically trigger print dialog when content loads
  pdfWindow.onload = () => {
    pdfWindow.print()
  }

  alert('PDF export started! A print dialog will open. Select "Save as PDF" in your browser\'s print dialog to create the PDF file.')
}

const exportExcel = () => {
  // Add deductions data to the export
  let deductionsData = []
  if (deductions.value && deductions.value.length > 0) {
    deductionsData = deductions.value.map(deduction => [
      deduction.name + ` (${deduction.type === 'percentage' ? deduction.value + '%' : '₱' + formatCurrency(deduction.value)})`,
      '',
      '',
      '',
      '',
      '',
      '',
      `₱${formatCurrency(deduction.type === 'percentage' ? (totalPay.value * deduction.value / 100) : deduction.value)}`
    ])
  }

  // Create Excel data
  const data = [
    ['DATE', 'PLATE NUMBER', 'INVOICE NUMBER', 'DESTINATION', 'BAGS', 'POS', 'RATE', 'TOTAL'],
    ...filteredEmployeeTrips.value.map(trip => [
      formatDateShort(trip.date),
      trip.truckPlate,
      trip.invoiceNumber,
      trip.fullDestination,
      trip.numberOfBags,
      trip._role,
      `₱${trip._rate ? formatCurrency(trip._rate - 4) : '0.00'}`,
      `₱${trip._rate && trip.numberOfBags ? formatCurrency((trip._rate - 4) * trip.numberOfBags * trip._commission) : '0.00'}`
    ]),
    ['GROSS PAY:', '', '', '', totalBags.value, '', '', `₱${formatCurrency(totalPay.value)}`],
    ...deductionsData,
    ...(deductions.value && deductions.value.length > 0 ? [
      ['TOTAL DEDUCTIONS:', '', '', '', '', '', '', `-₱${formatCurrency(totalDeductions.value)}`],
      ['NET PAY:', '', '', '', '', '', '', `₱${formatCurrency(netPay.value)}`]
    ] : [])
  ]

  // Add employee info to CSV data
  data.splice(0, 0, [`Employee: ${selectedEmployeeName.value}`, `Employee UUID: ${selectedEmployeeUuid.value}`, `Payslip: ${payslipNumber.value}`])
  data.splice(1, 0, ['Period:', `${formatPeriod()}`, 'Date Generated:', formatDate(new Date())])

  // Add prepared by information to CSV data
  data.push([])
  data.push(['Prepared by:', preparedBy.value || '_______________________________'])

  // Create CSV content
  const csvContent = data.map(row =>
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n')

  // Download as CSV (which can be opened in Excel)
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `payslip_${selectedEmployeeName.value}_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  alert('Excel export ready! CSV file has been downloaded and can be opened in Excel or similar spreadsheet applications.')
}

const printStatement = () => {
  // Create print-friendly version
  const companyInfo = `MTM ENTERPRISE
0324 P. Damaso St. Virgen Delas Flores Baliuag Bulacan
TIN # 175-434-337-000
Mobile No. 09605638462 / Telegram No. +358-044-978-8592`.replace(/\n/g, '<br>')

  const employeeInfo = `Employee Name: ${selectedEmployeeName.value}
Employee UUID: ${selectedEmployeeUuid.value}
Payslip Number: ${payslipNumber.value}
Period Covered: ${formatPeriod()}
Date Generated: ${formatDate(new Date())}`.replace(/\n/g, '<br>')

  let tableHTML = `
<table style="width: 100%; border-collapse: collapse; font-size: 8px; font-family: 'Courier New', monospace; margin-top: 5px;">
<tbody>
<tr style="background: #f0f0f0;" class="header-row">
<td style="border: 1px solid #000; padding: 3px; text-align: center; font-weight: bold;">DATE</td>
<td style="border: 1px solid #000; padding: 3px; text-align: center; font-weight: bold;">PLATE NUMBER</td>
<td style="border: 1px solid #000; padding: 3px; text-align: center; font-weight: bold;">INVOICE NUMBER</td>
<td style="border: 1px solid #000; padding: 3px; text-align: center; font-weight: bold;">DESTINATION</td>
<td style="border: 1px solid #000; padding: 3px; text-align: center; font-weight: bold;">BAGS</td>
<td style="border: 1px solid #000; padding: 3px; text-align: center; font-weight: bold;">POS</td>
<td style="border: 1px solid #000; padding: 3px; text-align: center; font-weight: bold;">RATE</td>
<td style="border: 1px solid #000; padding: 3px; text-align: center; font-weight: bold;">TOTAL</td>
</tr>`

filteredEmployeeTrips.value.forEach((trip, index) => {
    const bgColor = index % 2 === 1 ? '#fafafa' : 'white'
    tableHTML += `
<tr style="background: ${bgColor};">
<td style="border: 1px solid #000; padding: 6px; text-align: center;">${formatDateShort(trip.date)}</td>
<td style="border: 1px solid #000; padding: 6px; text-align: center;">${trip.truckPlate}</td>
<td style="border: 1px solid #000; padding: 6px; text-align: center;">${trip.invoiceNumber}</td>
<td style="border: 1px solid #000; padding: 6px; text-align: center;">${trip.fullDestination}</td>
<td style="border: 1px solid #000; padding: 6px; text-align: center;">${trip.numberOfBags}</td>
<td style="border: 1px solid #000; padding: 6px; text-align: center;">${trip._role}</td>
<td style="border: 1px solid #000; padding: 6px; text-align: right;">₱${trip._rate ? formatCurrency(trip._rate - 4) : '0.00'}</td>
<td style="border: 1px solid #000; padding: 6px; text-align: right;">₱${trip._rate && trip.numberOfBags ? formatCurrency((trip._rate - 4) * trip.numberOfBags * trip._commission) : '0.00'}</td>
</tr>`
  })

    // Add deductions to the table if they exist
  if (deductions.value && deductions.value.length > 0) {
    tableHTML += `
<tr style="background: #e0e0e0; font-weight: bold;">
<td style="border: 2px solid #000; padding: 10px; text-align: left; font-size: 10px;">GROSS PAY:</td>
<td></td>
<td></td>
<td></td>
<td style="border: 2px solid #000; padding: 10px; text-align: center; font-size: 10px;">${totalBags.value}</td>
<td></td>
<td></td>
<td style="border: 2px solid #000; padding: 10px; text-align: right; font-size: 10px;">₱${formatCurrency(totalPay.value)}</td>
</tr>`

    // Individual deductions breakdown
    deductions.value.forEach(deduction => {
      const deductionAmount = deduction.type === 'percentage'
        ? (totalPay.value * (deduction.value / 100))
        : deduction.value
      tableHTML += `
<tr style="background: #fefefa; font-size: 10px;">
<td colspan="7" style="border: 1px solid #000; padding: 4px 8px; text-align: left; color: #000;">${deduction.name} (${deduction.type === 'percentage' ? deduction.value + '%' : '₱' + formatCurrency(deduction.value)}):</td>
<td style="border: 1px solid #000; padding: 4px; text-align: right; color: #000;">-₱${formatCurrency(deductionAmount)}</td>
</tr>`
    })

    // Total deductions and net pay
    tableHTML += `
<tr style="background: #fff3cd; font-weight: bold;">
<td colspan="7" style="border: 1px solid #000; padding: 6px 8px; text-align: left; font-size: 11px; color: #000;">TOTAL DEDUCTIONS:</td>
<td style="border: 1px solid #000; padding: 6px; text-align: right; color: #000;">-₱${formatCurrency(totalDeductions.value)}</td>
</tr>
<tr style="background: #d1ecf1; font-weight: bold; border: 2px solid #28a745;">
<td colspan="7" style="border: 2px solid #28a745; padding: 8px; text-align: left; font-size: 12px; color: #000;">NET PAY:</td>
<td style="border: 2px solid #28a745; padding: 8px; text-align: right; font-size: 14px; color: #000;">₱${formatCurrency(netPay.value)}</td>
</tr>`
  } else {
    // Original table structure when no deductions
    tableHTML += `
<tr style="background: #e0e0e0; font-weight: bold;">
<td colspan="4" style="border: 2px solid #000; padding: 10px; text-align: left; font-size: 12px;">TOTAL PAY:</td>
<td style="border: 2px solid #000; padding: 10px; text-align: center; font-size: 14px;">${totalBags.value}</td>
<td style="border: 2px solid #000; padding: 10px; text-align: center;"></td>
<td style="border: 2px solid #000; padding: 10px; text-align: right; font-size: 14px;">₱${formatCurrency(totalPay.value)}</td>
</tr>`
  }

  tableHTML += `
</tbody>
</table>`

  const printContent = `
<!DOCTYPE html>
<html>
<head>
<title>Print Preview</title>
<style>
@media print {
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; color: #000; padding: 20mm 15mm; }
  .no-print { display: none; }
  .company-name-print { font-size: 20px; font-weight: bold; text-align: center; letter-spacing: 2px; margin-bottom: 10px; }
  .company-details-print { font-size: 10px; text-align: center; line-height: 1.2; margin-bottom: 15px; }
  .payroll-title-print { font-size: 16px; font-weight: bold; text-align: center; margin: 10px 0 15px 0; }
  .employee-info-print { font-size: 10px; margin-bottom: 10px; text-align: left; line-height: 1.3; }
  .header-row { background: #f0f0f0 !important; page-break-after: avoid; }
  @page { size: A4; margin: 15mm; }
}
</style>
</head>
<body>
<div style="border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; text-align: center;">
<h1 class="company-name-print">MTM ENTERPRISE</h1>
<div class="company-details-print">
${companyInfo}
</div>
<h2 class="payroll-title-print">PAYSLIP</h2>
</div>

<div class="employee-info-print">
${employeeInfo}
</div>

${tableHTML}

<div style="margin-top: 30px; padding: 15px 0; font-size: 14px; font-weight: bold;">
<strong>Prepared by:</strong> ${preparedBy.value || '_______________________________'}
</div>
</body>
</html>`

  // Create print window
  const printWindow = window.open('', '_blank')
  printWindow.document.write(printContent)
  printWindow.document.close()

  // Wait for content to load then print
  printWindow.onload = () => {
    printWindow.print()
  }
}

const calculateTripRates = (tripsArray, ratesData) => {
  tripsArray.forEach(trip => {
    const destination = trip.destination || ''
    let foundRate = null

    // Parse destination string in format "Aringay - La Union"
    const destinationParts = destination.split(' - ')
    if (destinationParts.length === 2) {
      const townName = destinationParts[0].trim()
      const provinceName = destinationParts[1].trim()

      // Find exact town + province combination
      const exactMatch = ratesData.find(rate =>
        (rate.town?.toLowerCase() === townName.toLowerCase()) &&
        (rate.province?.toLowerCase() === provinceName.toLowerCase())
      )

      if (exactMatch) {
        foundRate = exactMatch.newRates || exactMatch.rate
      }
    }

    // Store on trip object
    trip._rate = foundRate
    trip._total = foundRate ? foundRate * (trip.numberOfBags || 0) : 0
  })
}

const generatePayslipNumber = () => {
  console.log('generatePayslipNumber called - startDate:', startDate.value, 'endDate:', endDate.value)

  // Check if dates exist and are not empty strings
  if (!startDate.value || startDate.value === '' || !endDate.value || endDate.value === '') {
    console.log('Dates not available, setting P----')
    payslipNumber.value = 'P----'
    return
  }

  try {
    // Generate unique payslip number in format: P1015-25-1761234567890
    // Where:
    // P = Payslip
    // 10 = Start month (October)
    // 15 = End day (15th)
    // 25 = Year (2025)
    // 1761234567890 = Unix timestamp in milliseconds (for uniqueness)

    const startDateObj = new Date(startDate.value)
    const endDateObj = new Date(endDate.value)

    console.log('Date objects:', startDateObj, endDateObj)
    console.log('getTime values:', startDateObj.getTime(), endDateObj.getTime())

    // Validate dates
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      console.log('Invalid date objects, setting P----')
      payslipNumber.value = 'P----'
      return
    }

    const startMonth = String(startDateObj.getMonth() + 1).padStart(2, '0') // MM format (01-12)
    const endDay = String(endDateObj.getDate()).padStart(2, '0') // DD format (01-31)
    const year = String(startDateObj.getFullYear()).slice(-2) // YY format (25 for 2025)
    const timestamp = Date.now() // Unix timestamp in milliseconds

    payslipNumber.value = `P${startMonth}${endDay}-${year}-${timestamp}`

    console.log('Generated payslip number:', payslipNumber.value)
  } catch (error) {
    console.error('Error generating payslip number:', error)
    payslipNumber.value = 'P----'
  }
}

const savePayslip = async () => {
  if (!preparedBy.value) {
    alert('Please enter the prepared by name before saving.')
    return
  }

  if (!selectedEmployeeUuid.value || !selectedEmployeeName.value) {
    alert('Please select an employee before saving.')
    return
  }

  if (filteredEmployeeTrips.value.length === 0) {
    alert('No trips found for this employee in the selected date range.')
    return
  }

  // Find the employee from the employees array to get complete info
  const employeeInfo = employees.value.find(emp => emp.uuid === selectedEmployeeUuid.value)

  // Create a clean, serializable payslip data object
  const payslipData = {
    id: Date.now().toString(),
    payslipNumber: payslipNumber.value,
    period: {
      startDate: startDate.value,
      endDate: endDate.value,
      periodText: formatPeriod()
    },
    employee: {
      id: selectedEmployeeUuid.value,
      uuid: selectedEmployeeUuid.value,
      name: selectedEmployeeName.value,
      note: employeeInfo?.note || '' // Include employee note if available
    },
    trips: filteredEmployeeTrips.value.map(trip => ({
      id: trip.id,
      date: trip.date,
      truckPlate: trip.truckPlate,
      invoiceNumber: trip.invoiceNumber,
      destination: trip.fullDestination,
      numberOfBags: trip.numberOfBags,
      _role: trip._role, // Include role marker (D/H)
      _commission: trip._commission, // Include commission rate
      adjustedRate: trip._rate ? trip._rate - 4 : 0, // Show the adjusted rate
      rate: trip._rate,
      total: trip._rate && trip.numberOfBags ? (trip._rate - 4) * trip.numberOfBags * trip._commission : 0 // Use same calculation as display
    })),
    totals: {
      totalBags: totalBags.value,
      grossPay: totalPay.value,
      totalPay: totalPay.value,
      totalDeductions: totalDeductions.value,
      netPay: netPay.value
    },
    deductions: deductions.value.map(deduction => ({
      name: deduction.name,
      type: deduction.type,
      value: deduction.value,
      calculatedAmount: deduction.type === 'percentage'
        ? totalPay.value * (deduction.value / 100)
        : deduction.value
    })),
    preparedBy: preparedBy.value,
    createdDate: new Date().toISOString(),
    status: 'pending',
    systemVersion: '2.0' // Mark as new system version
  }

  // Ensure the data is serializable by creating a deep copy without Vue reactivity
  const serializableData = JSON.parse(JSON.stringify(payslipData))

  try {
    const response = await axios.post(`${API_BASE_URL}/payslips`, serializableData)

    if (response.status === 201) {
      console.log('Payslip saved successfully:', payslipData.payslipNumber)

      const deductionSummary = deductions.value.length > 0
        ? `\nTotal Deductions: ₱${formatCurrency(totalDeductions.value)}\nNet Pay: ₱${formatCurrency(netPay.value)}`
        : ''

      alert(`Payslip ${payslipNumber.value} saved successfully!\n\n📄 Saved to: backend/data/payslips.json\n\n👤 Employee: ${selectedEmployeeName.value}\n💰 Gross Pay: ₱${formatCurrency(totalPay.value)}${deductionSummary}\n📊 Status: Pending (with UUID system)`)

      // Generate new payslip number for next use
      generatePayslipNumber()
    } else {
      throw new Error('Server response error')
    }

  } catch (error) {
    console.error('Error saving payslip to server:', error)

    // Fallback: try to save to localStorage if server fails
    try {
      const localPayslips = JSON.parse(localStorage.getItem('payslipHistory') || '[]')
      localPayslips.push(payslipData)
      localStorage.setItem('payslipHistory', JSON.stringify(localPayslips))

      const deductionSummary = deductions.value.length > 0
        ? `\nTotal Deductions: ₱${formatCurrency(totalDeductions.value)}\nNet Pay: ₱${formatCurrency(netPay.value)}`
        : ''

      alert(`Payslip saved locally (server unavailable).\n\n💾 Saved to browser storage as fallback\n\nPayroll ${payslipNumber.value}\nEmployee: ${selectedEmployeeName.value}\nGross Pay: ₱${formatCurrency(totalPay.value)}${deductionSummary}\nStatus: Pending`)
      generatePayslipNumber()

    } catch (localError) {
      console.error('Local storage fallback failed:', localError)
      alert('❌ Error: All save methods failed. Please try again.')
    }
  }
}

const fetchPayrollData = async () => {
  try {
    const [tripsRes, employeesRes, ratesRes, deductionsRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/trips`),
      axios.get(`${API_BASE_URL}/employees`),
      axios.get(`${API_BASE_URL}/rates`),
      axios.get(`${API_BASE_URL}/deductions`)
    ])

    const rawTrips = tripsRes.data.trips || []
    const ratesData = ratesRes.data

    // Calculate rates and totals for trips
    calculateTripRates(rawTrips, ratesData)

    trips.value = rawTrips
    employees.value = employeesRes.data
    availableDeductions.value = deductionsRes.data

    // Generate payslip number
    await generatePayslipNumber()

  } catch (error) {
    console.error('Error fetching payroll data:', error)
  }
}

// Lifecycle
onMounted(() => {
  fetchPayrollData()
})
</script>

<style scoped>
/* Professional Payroll Statement Styles */
.payroll-statement {
  font-family: 'Courier New', monospace;
  font-size: 0.75rem; /* Matching table font size */
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background: white;
  color: #000;
}

/* Filters Section */
.filters-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.signature-section {
  display: flex;
  gap: 2rem;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 2px solid #dee2e6;
}

.signature-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.signature-input {
  padding: 0.5rem;
  border: 2px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
  background: white;
  width: 200px;
}

.date-filters {
  display: flex;
  gap: 2rem;
  align-items: center;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: bold;
  font-size: 0.9rem;
  color: #495057;
}

.date-input, .employee-select, .position-select {
  padding: 0.5rem;
  border: 2px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
  background: white;
  width: 180px;
}

.employee-select, .position-select {
  width: 200px;
}

.date-input:focus, .employee-select:focus, .position-select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

/* Centered Company Header */
.company-header {
  text-align: center;
  margin-bottom: 1rem;
  border-bottom: 2px solid #000;
  padding-bottom: 0.5rem;
}

.company-info-centered {
  justify-content: center;
  align-items: center;
  flex-direction: column;
  display: flex;
  gap: 0;
}

.company-logo-name {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 0.25rem;
}

.logo-container {
  text-align: center;
  margin-bottom: 0.25px;
}

.company-logo-large {
  width: 120px;
  height: 120px;
  object-fit: contain;
}

.company-name-small {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0;
  color: #000;
  letter-spacing: 1px;
}

.company-details-small {
  font-size: 0.8rem;
  line-height: 1.2;
  margin-bottom: 0.5rem;
}

.company-details-small p {
  margin: 0;
}

.payroll-statement-title {
  font-size: 1.2rem;
  font-weight: bold;
  color: #000;
  margin: 0;
  letter-spacing: 1px;
}

/* Employee Information Section */
.employee-info-section {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  font-size: 0.85rem;
  align-items: flex-start;
}

.employee-info-left {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: flex-start;
}

.employee-name-info,
.employee-position-info {
  font-weight: bold;
}

.employee-info-right {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: flex-end;
}

.payslip-number-info,
.period-info,
.generated-info {
  font-weight: bold;
  text-align: right;
}

/* Payroll Table */
.payroll-table-container {
  margin-bottom: 2rem;
}

.payroll-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;
  border: 1px solid #000;
}

.payroll-table .header-row th {
  background: #f0f0f0;
  border: 1px solid #000;
  padding: 0.5rem 0.25rem;
  text-align: center;
  font-weight: bold;
  font-size: 0.7rem;
  vertical-align: middle;
}

.payroll-table .data-row {
  border: 1px solid #000;
}

.payroll-table .data-row:hover {
  background: #f9f9f9;
}

.payroll-table .alt-row {
  background: #fafafa;
}

.payroll-table .data-row td {
  padding: 0.5rem 0.25rem;
  border: none;
  text-align: center;
  vertical-align: middle;
}

/* Table column widths */
.date-cell { min-width: 80px; }
.plate-cell { min-width: 70px; }
.invoice-cell { min-width: 90px; }
.destination-cell { min-width: 200px; }
.bags-cell { min-width: 60px; text-align: center; }
.rate-cell { min-width: 80px; text-align: right; }
.total-cell { min-width: 100px; text-align: right; }

.date-col { width: auto; }
.plate-col { width: auto; }
.invoice-col { width: auto; }
.destination-col { width: auto; }
.bags-col { width: 15%; }
.rate-col { width: 12%; }
.total-col { width: 15%; }

/* Totals Row */
.totals-row {
  background: #e0e0e0;
  font-size: 0.8rem;
  font-weight: bold;
  border: 2px solid #000;
}

.totals-row td {
  padding: 0.75rem 0.25rem;
  border: none;
}

.totals-label {
  font-size: 0.9rem;
}

.totals-bags {
  text-align: center;
}

.totals-amount {
  font-size: 1rem;
  color: #000;
}

/* Deductions Row */
.deductions-row {
  background: #fff3cd;
  font-size: 0.8rem;
  font-weight: bold;
  border: 1px solid #000;
}

.deductions-row td {
  padding: 0.5rem 0.25rem;
  border: none;
}

.deductions-label {
  font-size: 0.9rem;
  color: #000;
}

.deductions-amount {
  font-size: 1rem;
  color: #000;
}

/* Individual Deductions rows - show each deduction itemized */
.individual-deduction-row {
  background: #fefefa;
  font-size: 0.75rem; /* Same as table font size */
  font-weight: normal;
  border: 1px solid #000;
}

.individual-deduction-row td {
  padding: 0.4rem 0.25rem;
  border: none;
}

.individual-deduction-label {
  font-size: 0.75rem; /* Match table font size */
  color: #000;
}

.individual-deduction-amount {
  font-size: 0.75rem; /* Match table font size */
  color: #000;
}

.deduction-type-indicator {
  font-size: 0.7rem;
  color: #6c757d;
  font-weight: normal;
  margin-left: 0.5rem;
}

/* Total Deductions Row */
.total-deductions-row {
  background: #fff3cd;
  font-size: 0.8rem;
  font-weight: bold;
  border: 1px solid #000;
}

.total-deductions-row td {
  padding: 0.5rem 0.25rem;
  border: none;
}

.total-deductions-label {
  font-size: 0.9rem;
  color: #000;
}

.total-deductions-amount {
  font-size: 1rem;
  color: #000;
}

/* Net Pay Row */
.net-pay-row {
  background: #d1ecf1;
  font-size: 0.8rem;
  font-weight: bold;
  border: 2px solid #28a745;
}

.net-pay-row td {
  padding: 0.75rem 0.25rem;
  border: none;
}

.net-pay-label {
  font-size: 0.9rem;
  color: #000;
}

.net-pay-amount {
  font-size: 1.2rem;
  color: #000;
}

/* Prepared by Section */
.prepared-by-section {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.prepared-by-info {
  font-weight: bold;
}

.text-center {
  text-align: center;
}

.text-right {
  text-align: right;
}

.fw-bold {
  font-weight: bold;
}

/* Control Buttons */
.payroll-controls {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #ccc;
}

.btn {
  padding: 0.75rem 2rem;
  border: 2px solid #000;
  background: white;
  color: #000;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-family: 'Courier New', monospace;
}

.btn:hover {
  background: #f0f0f0;
}

.btn-pdf {
  border-color: #1565c0;
  color: #1565c0;
}

.btn-pdf:hover {
  background: #e3f2fd;
}

.btn-excel {
  border-color: #2e7d32;
  color: #2e7d32;
}

.btn-excel:hover {
  background: #e8f5e8;
}

.btn-print {
  border-color: #424242;
  color: #424242;
}

.btn-print:hover {
  background: #f5f5f5;
}

.btn-deductions {
  border-color: #ff9800;
  color: #ff9800;
}

.btn-deductions:hover {
  background: #fff3e0;
}

.btn-add {
  border-color: #4caf50;
  color: #4caf50;
  font-size: 0.9rem;
  padding: 0.5rem 1rem;
  margin-right: 0.5rem;
}

.btn-add:hover {
  background: #e8f5e9;
}

.btn-clear {
  border-color: #9e9e9e;
  color: #9e9e9e;
  font-size: 0.9rem;
  padding: 0.5rem 1rem;
}

.btn-clear:hover {
  background: #f5f5f5;
}

.btn-remove {
  background: #ff4444;
  color: white;
  border: 1px solid #ff4444;
  font-size: 0.8rem;
  padding: 0.25rem 0.5rem;
  margin-left: 0.5rem;
  cursor: pointer;
}

.btn-remove:hover {
  background: #cc0000;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 2px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  color: #000;
}

.modal-body {
  padding: 1.5rem;
}

.deduction-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: bold;
  font-size: 0.9rem;
  color: #495057;
}

.deduction-input {
  padding: 0.5rem;
  border: 2px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
  background: white;
}

.deduction-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.deduction-select {
  padding: 0.5rem;
  border: 2px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
  background: white;
  width: 100%;
}

.deduction-select:focus {
  outline: none;
  border-color: #007bff;
}

.form-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.deductions-list {
  margin-bottom: 1rem;
}

.deductions-list h4 {
  margin: 0 0 1rem 0;
  color: #333;
}

.deduction-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  background: #f8f9fa;
}

.deduction-name {
  font-weight: bold;
  flex: 1;
}

.deduction-value {
  color: #666;
  margin-left: 1rem;
}

.deductions-summary {
  margin-top: 1rem;
  padding: 1rem;
  background: #e3f2fd;
  border-radius: 4px;
  border: 1px solid #bbdefb;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.summary-item:last-child {
  margin-bottom: 0;
  color: #2e7d32;
  font-size: 1.1rem;
}

.total-net-pay {
  border-top: 2px solid #1976d2;
  padding-top: 0.5rem;
  margin-top: 0.5rem;
  color: #1976d2 !important;
}

/* Print Styles */
@media print {
  .payroll-sheet {
    max-width: none;
    margin: 0;
    padding: 1rem;
  }

  .payroll-controls {
    display: none;
  }

  .company-name {
    font-size: 2rem;
  }

  .ledger-table {
    font-size: 0.75rem;
  }

  .header-row th,
  .data-row td {
    padding: 0.5rem 0.25rem;
  }
}

@media (max-width: 768px) {
  .payroll-statement {
    padding: 1rem;
    font-size: 0.8rem;
  }

  .company-header {
    flex-direction: column;
    gap: 1rem;
  }

  .invoice-header {
    text-align: left;
  }

  .payroll-footer {
    flex-direction: column;
    gap: 1rem;
  }

  .payment-instructions {
    text-align: left;
  }

  .payroll-controls {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }

  .ledger-table {
    font-size: 0.75rem;
  }

  .header-row th,
  .data-row td {
    padding: 0.5rem 0.25rem;
  }

  .date-col { width: 15%; }
  .invoice-col { width: 18%; }
  .description-col { width: 25%; }
  .destination-col { width: auto; display: none; } /* Hide on very small screens */
  .qty-col { width: 10%; }
  .rate-col { width: 12%; }
  .amount-col { width: 15%; }
  .actions-col { width: 5%; }
}
</style>
