<template>
  <div class="edit-payslip-form">
    <div class="form-section">
      <h3>Payslip Information</h3>
      <div class="info-grid">
        <div class="info-field">
          <label class="info-label">Payslip Number:</label>
          <span class="info-value">{{ payslip.payslip_number || payslip.payslipNumber }}</span>
        </div>
        <div class="info-field">
          <label class="info-label">Employee:</label>
          <span class="info-value">{{ payslip.employee.name }}</span>
        </div>
        <div class="info-field">
          <label class="info-label">Period:</label>
          <span class="info-value">{{ payslip.period.periodText }}</span>
        </div>
        <div class="info-field">
          <label class="info-label">Status:</label>
          <select v-model="payslip.status" class="status-select" @change="updateStatus">
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Edit Prepared By -->
    <div class="form-section">
      <h3>Prepared By</h3>
      <div class="form-group">
        <label for="prepared-by">Name:</label>
        <input
          type="text"
          id="prepared-by"
          v-model="preparedBy"
          placeholder="Enter prepared by name"
          class="form-input"
        />
      </div>
    </div>

    <!-- Edit Deductions -->
    <div class="form-section">
      <h3>Deductions Applied</h3>
      <div class="deductions-editor">
        <div v-if="getDeductions().length === 0" class="no-deductions">
          <p>No deductions applied to this payslip.</p>
        </div>
        <div v-else class="deductions-list">
          <div v-for="(deduction, index) in getDeductions()" :key="index" class="deduction-item">
            <div class="deduction-info">
              <strong>{{ deduction.name }}</strong> -
              <span :class="deduction.type === 'percentage' ? 'percentage-type' : 'amount-type'">
                {{ deduction.type === 'percentage' ? `${deduction.value}%` : `₱${formatCurrency(deduction.value)}` }}
              </span>
            </div>
            <div class="deduction-amount">
              -₱{{ formatCurrency(deduction.type === 'percentage' ? (payslip.totals.totalPay * deduction.value / 100) : deduction.value) }}
            </div>
          </div>
        </div>
        <div class="deductions-summary">
          <div class="summary-item">
            <strong>Gross Pay:</strong> ₱{{ formatCurrency(payslip.totals.totalPay) }}
          </div>
          <div class="summary-item">
            <strong>Total Deductions:</strong> ₱{{ formatCurrency(payslip.totals.totalDeductions) }}
          </div>
          <div class="summary-item total-net-pay">
            <strong>Net Pay:</strong> ₱{{ formatCurrency(payslip.totals.netPay) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="form-actions">
      <button @click="saveChanges" :disabled="saving" class="btn-save">
        {{ saving ? 'Saving...' : 'Save Changes' }}
      </button>
      <button @click="cancel" :disabled="saving" class="btn-cancel">
        Cancel
      </button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, computed, watch } from 'vue'

const props = defineProps({
  payslip: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['payslipSaved', 'cancel'])

const saving = ref(false)

// Computed property for preparedBy to handle both snake_case and camelCase
const preparedBy = computed({
  get: () => props.payslip.prepared_by || props.payslip.preparedBy || '',
  set: (value) => {
    props.payslip.prepared_by = value
    props.payslip.preparedBy = value
  }
})

// Helper function to get deductions from payslip data
const getDeductions = () => {
  return (props.payslip.details ? (typeof props.payslip.details === 'string' ? JSON.parse(props.payslip.details) : props.payslip.details).deductions : null) || props.payslip.deductions || []
}

// Watch for changes and recalculate totals when deductions change
const recalculateTotals = () => {
  const grossPay = props.payslip.totals.totalPay
  const deductions = getDeductions()

  const totalDeductions = deductions.reduce((sum, deduction) => {
    if (deduction.type === 'percentage') {
      return sum + (grossPay * (deduction.value / 100))
    } else {
      return sum + deduction.value
    }
  }, 0)

  const netPay = grossPay - totalDeductions

  props.payslip.totals.totalDeductions = totalDeductions
  props.payslip.totals.netPay = netPay
}

watch(() => props.payslip, recalculateTotals, { deep: true })

const updateStatus = () => {
  // Status change handled automatically
}

const saveChanges = async () => {
  saving.value = true
  try {
    // Recalculate totals before saving
    recalculateTotals()

    // Here you would typically call an API to update the payslip
    // For now, we'll emit the updated payslip
    emit('payslipSaved', props.payslip)
  } catch (error) {
    console.error('Error saving payslip changes:', error)
    alert('Failed to save changes. Please try again.')
  } finally {
    saving.value = false
  }
}

const cancel = () => {
  emit('cancel')
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}
</script>

<style scoped>
.edit-payslip-form {
  max-width: 800px;
  margin: 0 auto;
}

.form-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-section h3 {
  margin: 0 0 1.5rem 0;
  color: #2c3e50;
  font-size: 1.2rem;
  border-bottom: 2px solid #f8f9fa;
  padding-bottom: 0.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.info-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-label {
  font-weight: bold;
  color: #495057;
  font-size: 0.9rem;
}

.info-value {
  padding: 0.5rem;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  font-size: 1rem;
}

.status-select {
  padding: 0.5rem;
  border: 2px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
  background: white;
  width: 100%;
}

.status-select:focus {
  outline: none;
  border-color: #007bff;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: bold;
  color: #495057;
  font-size: 0.9rem;
}

.form-input {
  padding: 0.5rem;
  border: 2px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
  background: white;
}

.form-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.deductions-editor {
  margin-top: 1rem;
}

.no-deductions {
  text-align: center;
  color: #6c757d;
  font-style: italic;
}

.deductions-list {
  display: grid;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.deduction-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  background: #f8f9fa;
}

.deduction-info {
  flex: 1;
}

.deduction-info strong {
  font-size: 1.1rem;
  color: #2c3e50;
}

.percentage-type {
  color: #17a2b8;
  font-weight: bold;
}

.amount-type {
  color: #dc3545;
  font-weight: bold;
}

.deduction-amount {
  font-weight: bold;
  font-size: 1.1rem;
  color: #dc3545;
}

.deductions-summary {
  background: #e3f2fd;
  padding: 1.5rem;
  border-radius: 6px;
  border: 1px solid #bbdefb;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.summary-item:last-child {
  margin-bottom: 0;
  font-size: 1.2rem;
  font-weight: bold;
  color: #2e7d32;
}

.total-net-pay {
  border-top: 2px solid #1976d2;
  padding-top: 0.5rem;
  margin-top: 0.5rem;
  color: #1976d2 !important;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid #eee;
}

.btn-save,
.btn-cancel {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-save {
  background: #28a745;
  color: white;
}

.btn-save:hover:not(:disabled) {
  background: #218838;
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-cancel {
  background: #6c757d;
  color: white;
}

.btn-cancel:hover:not(:disabled) {
  background: #5a6268;
}

.btn-cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .form-section {
    padding: 1rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-save,
  .btn-cancel {
    width: 100%;
  }
}
</style>
