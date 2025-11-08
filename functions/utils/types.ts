// Database Model Types
export interface Trip {
  id: number
  tracking_number: string
  date: string
  truck_plate: string
  invoice_number: string
  origin: string
  farm_name: string
  destination: string
  full_destination: string
  rate_lookup_key: string
  status: string
  estimated_delivery: string
  driver: string
  helper: string
  number_of_bags: number
  computed_toll: number
  roundtrip_toll: number
  actual_toll_expense: number
  created_at: string
  updated_at: string
}

export interface Employee {
  uuid: string
  name: string
  phone: string
  license_number: string
  pagibig_number: string
  sss_number: string
  philhealth_number: string
  address: string
  cash_advance: number
  loans: number
  auto_deduct_cash_advance: boolean
  auto_deduct_loans: boolean
  created_at: string
  updated_at: string
}

export interface Rate {
  id: number
  origin: string
  province: string
  town: string
  rate: number
  new_rates: number
  created_at: string
}

export interface Driver {
  id: number
  name: string
  phone: string
  license_number: string
  created_at: string
  updated_at: string
}

export interface Helper {
  id: number
  name: string
  phone: string
  address: string
  created_at: string
  updated_at: string
}

export interface Vehicle {
  id: number
  plate_number: string
  vehicle_class: string
  name: string
  created_at: string
  updated_at: string
}

export interface Billing {
  id: string
  billing_number: string
  period_start: string
  period_end: string
  client_name: string
  client_address: string
  client_tin: string
  trips: any[]
  totals: any
  prepared_by: string
  payment_status: string
  created_date: string
  updated_at: string
}

export interface Payslip {
  id: string
  payslip_number: string
  employee_uuid: string
  period_start: string
  period_end: string
  gross_pay: number
  deductions: number
  net_pay: number
  status: string
  created_date: string
  details: any
}

export interface Deduction {
  id: number
  name: string
  type: string
  value: number
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface Expense {
  id: number
  date: string
  category: string
  description: string
  vehicle: string
  amount: number
  payment_method: string
  notes: string
  receipt_filename: string
  receipt_original_name: string
  receipt_mimetype: string
  receipt_size: number
  receipt_data: Buffer
  created_at: string
  updated_at: string
}

// API Request/Response Types
export interface ApiResponse<T = any> {
  success?: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface TripSuggestion {
  farms: Array<{
    name: string
    town: string
    province: string
    fullAddress: string
  }>
  destinations: string[]
}

export interface TollCalculationRequest {
  origin: string
  destination: string
  town?: string
  date?: string
  vehicleClass?: string
}

export interface TollCalculationResponse {
  tollFee: number
  details: any[]
  routes: any[]
  origin: string
  destination: string
  town?: string
  vehicleClass: string
  calculatedAt: string
  fallbackMode?: boolean
}

// Vercel/Generic Serverless Function Types
export interface ServerlessRequest {
  method: string
  query: Record<string, string | string[]>
  body: any
  headers: Record<string, string>
}

export interface ServerlessResponse {
  status: (code: number) => ServerlessResponse
  json: (data: any) => void
  send: (data: any) => void
  setHeader: (name: string, value: string) => ServerlessResponse
}
