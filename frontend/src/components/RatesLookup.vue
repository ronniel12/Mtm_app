<template>
  <div class="rates-lookup">
    <h3>📋 MTM ENTERPRISE Rate Lookup</h3>

    <div class="search-section">
      <div class="search-controls">
        <div class="search-input-group">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by province, destination, or origin..."
            class="search-input"
            @input="debouncedSearch"
          />
          <button @click="clearSearch" v-if="searchQuery" class="clear-btn">×</button>
        </div>
      </div>

      <div class="filters">
        <select v-model="provinceFilter" @change="applyFilters" class="filter-select">
          <option value="">All Provinces</option>
          <option v-for="province in availableProvinces" :key="province" :value="province">
            {{ province }}
          </option>
        </select>
      </div>
    </div>

    <div class="results-section">
      <div v-if="loading" class="loading">Searching rates...</div>

      <div v-else-if="rates.length === 0 && (searchQuery || provinceFilter)" class="no-results">
        No rates found matching your search criteria.
      </div>

      <div v-else-if="rates.length > 0" class="results-header">
        <div class="results-count">
          Showing {{ rates.length }} {{ rates.length === 1 ? 'rate' : 'rates' }}
          <span v-if="provinceFilter">in {{ provinceFilter }}</span>
        </div>
        <div class="unit-info">Unit: 6-wheeler Forward - All rates in PHP</div>
      </div>

      <div v-if="rates.length > 0" class="rates-table">
        <div class="table-responsive">
          <table class="rate-table">
            <thead>
              <tr>
                <th>Origin</th>
                <th>Province</th>
                <th>Destination</th>
                <th class="rate-column">Rate (PHP)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(rate, index) in rates" :key="index" class="rate-row">
                <td class="origin-cell">{{ rate.origin }}</td>
                <td class="province-cell">{{ rate.province }}</td>
                <td class="destination-cell">{{ rate.destination }}</td>
                <td class="rate-cell">₱{{ rate.rate.toLocaleString() }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="!searchQuery && !provinceFilter" class="welcome-message">
        <div class="welcome-icon">💰</div>
        <h4>MTM ENTERPRISE Premium Rates</h4>
        <p>
          Use the search above to find transportation rates from Bulacan to destinations across the Philippines.
          All rates are for 6-wheeler forward trucks with premium service.
        </p>
        <div class="quick-search">
          <h5>Popular Routes:</h5>
          <div class="route-tags">
            <button @click="quickSearch('Pangasinan')" class="tag-btn">Pangasinan</button>
            <button @click="quickSearch('Nueva Ecija')" class="tag-btn">Nueva Ecija</button>
            <button @click="quickSearch('La Union')" class="tag-btn">La Union</button>
            <button @click="quickSearch('Zambales')" class="tag-btn">Zambales</button>
            <button @click="quickSearch('Batangas')" class="tag-btn">Batangas</button>
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

const searchQuery = ref('')
const provinceFilter = ref('')
const rates = ref([])
const loading = ref(false)
const availableProvinces = ref([
  'Pangasinan',
  'Nueva Ecija',
  'Zambales',
  'Tarlac',
  'La Union',
  'Abra',
  'Batangas',
  'Quezon'
])

let timeoutId

onMounted(() => {
  fetchAllRates()
})

const debouncedSearch = () => {
  clearTimeout(timeoutId)
  timeoutId = setTimeout(performSearch, 300)
}

const performSearch = async () => {
  if (!searchQuery.value.trim()) {
    if (provinceFilter.value) {
      await filterByProvince()
    } else {
      await fetchAllRates()
    }
    return
  }

  loading.value = true
  try {
    let searchTerm = searchQuery.value.trim()

    // If searching by province, filter client-side by province first
    if (provinceFilter.value) {
      const response = await axios.get(`${API_BASE_URL}/rates?province=${encodeURIComponent(provinceFilter.value)}`)
      rates.value = response.data.filter(rate =>
        rate.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rate.origin.toLowerCase().includes(searchTerm.toLowerCase())
      )
    } else {
      // Search across all
      const response = await axios.get(`${API_BASE_URL}/rates/search?query=${encodeURIComponent(searchTerm)}`)
      rates.value = response.data
    }
  } catch (error) {
    console.error('Error searching rates:', error)
    rates.value = []
  } finally {
    loading.value = false
  }
}

const fetchAllRates = async () => {
  loading.value = true
  try {
    const response = await axios.get(`${API_BASE_URL}/rates`)
    rates.value = response.data
  } catch (error) {
    console.error('Error fetching rates:', error)
    rates.value = []
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  if (provinceFilter.value) {
    filterByProvince()
  } else {
    if (searchQuery.value.trim()) {
      performSearch()
    } else {
      fetchAllRates()
    }
  }
}

const filterByProvince = async () => {
  loading.value = true
  try {
    const response = await axios.get(`${API_BASE_URL}/rates?province=${encodeURIComponent(provinceFilter.value)}`)
    rates.value = response.data
  } catch (error) {
    console.error('Error filtering by province:', error)
    rates.value = []
  } finally {
    loading.value = false
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  if (provinceFilter.value) {
    filterByProvince()
  } else {
    fetchAllRates()
  }
}

const quickSearch = (province) => {
  provinceFilter.value = province
  filterByProvince()
}
</script>

<style scoped>
.rates-lookup {
  width: 100%;
}

.rates-lookup h3 {
  margin: 0 0 1.5rem 0;
  color: #333;
  font-size: 1.5rem;
  text-align: center;
}

.search-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.search-controls {
  margin-bottom: 1rem;
}

.search-input-group {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
}

.clear-btn {
  position: absolute;
  right: 0.5rem;
  background: none;
  border: none;
  color: #666;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 50%;
  transition: background 0.2s;
}

.clear-btn:hover {
  background: rgba(0,0,0,0.1);
}

.filters {
  display: flex;
  justify-content: center;
}

.filter-select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  background: white;
  min-width: 200px;
}

.results-section {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.results-count {
  font-weight: 500;
  color: #333;
}

.unit-info {
  font-size: 0.9rem;
  color: #666;
  font-style: italic;
}

.rates-table {
  margin-top: 1rem;
}

.table-responsive {
  overflow-x: auto;
}

.rate-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.rate-table th {
  background: #f8f9fa;
  padding: 1rem 0.75rem;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #dee2e6;
}

.rate-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #dee2e6;
  vertical-align: middle;
}

.origin-cell, .province-cell, .destination-cell {
  font-weight: 500;
}

.rate-cell {
  font-weight: bold;
  color: #28a745;
  text-align: right;
}

.rate-row:hover {
  background: #f8f9fa;
}

.welcome-message {
  text-align: center;
  padding: 3rem 1rem;
  color: #666;
}

.welcome-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.welcome-message h4 {
  color: #333;
  margin: 1rem 0;
}

.welcome-message p {
  margin-bottom: 2rem;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
}

.quick-search {
  margin-top: 2rem;
}

.quick-search h5 {
  margin-bottom: 1rem;
  color: #333;
}

.route-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

.tag-btn {
  background: #e3f2fd;
  color: #1976d2;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.tag-btn:hover {
  background: #bbdefb;
  transform: translateY(-1px);
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #666;
  font-size: 1.1rem;
}

.no-results {
  text-align: center;
  padding: 3rem;
  color: #666;
  font-style: italic;
}

@media (max-width: 768px) {
  .results-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .rate-table td {
    padding: 0.5rem 0.25rem;
  }

  .rate-table th {
    padding: 0.5rem 0.25rem;
  }
}
</style>
