// User types
export interface User {
  id: string
  phone: string
  name?: string
  email?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Application types
export interface LoanApplication {
  id: string
  user_id: string
  requested_amount: number
  purpose: string
  monthly_income: number
  employment_type: string
  employment_years: number
  age: number
  preferred_tenure: number
  income_sources?: IncomeSource[]
  additional_info?: Record<string, any>
  status: ApplicationStatus
  approved_amount?: number
  approved_interest_rate?: number
  approved_tenure?: number
  created_at: string
  updated_at: string
  submitted_at?: string
  underwriting_completed_at?: string
}

export interface IncomeSource {
  type: 'salary' | 'rental' | 'business' | 'pension' | 'other'
  amount: number
  description?: string
}

export type ApplicationStatus = 
  | 'draft' 
  | 'submitted' 
  | 'under_review' 
  | 'approved' 
  | 'rejected' 
  | 'disbursed'

export type EmploymentType = 
  | 'government' 
  | 'private_mnc' 
  | 'private_domestic' 
  | 'self_employed' 
  | 'business'

export type LoanPurpose = 
  | 'personal' 
  | 'medical' 
  | 'education' 
  | 'travel' 
  | 'wedding' 
  | 'home_improvement' 
  | 'debt_consolidation' 
  | 'business' 
  | 'other'

// Policy types
export interface PolicyResult {
  decision: 'APPROVED' | 'REJECTED' | 'MANUAL_REVIEW'
  approved_amount?: number
  interest_rate?: number
  tenure_months?: number
  conditions?: string[]
  reasons?: string[]
  foir?: number
  risk_scale_factor?: number
}

export interface AIAnalysis {
  risk_level: 'Low' | 'Medium' | 'High'
  confidence_score: number
  key_risk_factors: string[]
  recommendations: string[]
  suggested_adjustments?: {
    loan_amount?: number
    interest_rate?: number
    tenure?: number
  }
  analysis_summary: string
}

// Bureau data types
export interface BureauData {
  credit_score: number
  accounts: BureauAccount[]
  enquiries: BureauEnquiry[]
  platform_data: PlatformData
  employment_verification?: EmploymentVerification
}

export interface BureauAccount {
  account_id: string
  account_type: 'credit_card' | 'loan'
  bank: string
  status: 'active' | 'closed' | 'default' | 'write_off' | 'settled'
  credit_limit?: number
  sanctioned_amount?: number
  current_balance: number
  emi_amount?: number
  opening_date: string
  last_payment_date: string
  payment_history: string[]
}

export interface BureauEnquiry {
  date: string
  type: string
  bank: string
}

export interface PlatformData {
  debt_velocity_12m: number
  payment_regularity: number
  account_diversity: number
  credit_utilization_trend: string
}

export interface EmploymentVerification {
  verified: boolean
  employer?: string
  designation?: string
  monthly_salary?: number
  verification_date?: string
}

// Document types
export interface Document {
  id: string
  application_id: string
  user_id: string
  document_type: DocumentType
  file_name: string
  file_size: number
  content_type: string
  status: 'uploaded' | 'processing' | 'verified' | 'rejected'
  analysis_result?: any
  created_at: string
}

export type DocumentType = 
  | 'income_proof' 
  | 'identity_proof' 
  | 'address_proof' 
  | 'bank_statement' 
  | 'other'

// Underwriting types
export interface UnderwritingResult {
  application_id: string
  decision: string
  approved_amount?: number
  interest_rate?: number
  tenure_months?: number
  policy_result: PolicyResult
  ai_analysis?: AIAnalysis
  final_decision?: any
}

// Form types
export interface ApplicationFormData {
  requested_amount: number
  purpose: LoanPurpose
  monthly_income: number
  employment_type: EmploymentType
  employment_years: number
  age: number
  preferred_tenure: number
  income_sources: IncomeSource[]
  additional_info: Record<string, any>
}

// API Response types
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export interface OTPResponse {
  success: boolean
  message: string
  otp?: string // Only for demo/testing
}

// Template types
export interface BureauTemplate {
  name: string
  profile_type: string
  credit_score: number
  account_count: number
  enquiry_count: number
}

// Progress tracking
export interface ApplicationProgress {
  currentStep: number
  totalSteps: number
  completedSteps: string[]
  nextStep: string
}

// Constants
export const LOAN_PURPOSES: { value: LoanPurpose; label: string }[] = [
  { value: 'personal', label: 'Personal Use' },
  { value: 'medical', label: 'Medical Emergency' },
  { value: 'education', label: 'Education' },
  { value: 'travel', label: 'Travel' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'home_improvement', label: 'Home Improvement' },
  { value: 'debt_consolidation', label: 'Debt Consolidation' },
  { value: 'business', label: 'Business' },
  { value: 'other', label: 'Other' },
]

export const EMPLOYMENT_TYPES: { value: EmploymentType; label: string }[] = [
  { value: 'government', label: 'Government Employee' },
  { value: 'private_mnc', label: 'Private MNC' },
  { value: 'private_domestic', label: 'Private Domestic' },
  { value: 'self_employed', label: 'Self Employed' },
  { value: 'business', label: 'Business Owner' },
]

export const TENURE_OPTIONS = [
  { value: 12, label: '12 months' },
  { value: 24, label: '24 months' },
  { value: 36, label: '36 months' },
  { value: 48, label: '48 months' },
  { value: 60, label: '60 months' },
]