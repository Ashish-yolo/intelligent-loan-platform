import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://intelligent-loan-platform.onrender.com'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

// Auth API calls
export const sendOTP = async (phone: string) => {
  const response = await api.post('/api/auth/send-otp', { phone })
  return response.data
}

export const verifyOTP = async (phone: string, otp: string, name?: string) => {
  const response = await api.post('/api/auth/verify-otp', { phone, otp, name })
  return response.data
}

export const getCurrentUser = async () => {
  const response = await api.get('/api/auth/me')
  return response.data
}

// Application API calls
export const createApplication = async (applicationData: any) => {
  const response = await api.post('/api/applications/create', applicationData)
  return response.data
}

export const updateApplication = async (applicationId: string, updateData: any) => {
  const response = await api.put(`/api/applications/${applicationId}`, updateData)
  return response.data
}

export const getApplication = async (applicationId: string) => {
  const response = await api.get(`/api/applications/${applicationId}`)
  return response.data
}

export const submitApplication = async (applicationId: string) => {
  const response = await api.post(`/api/applications/${applicationId}/submit`)
  return response.data
}

export const uploadDocument = async (applicationId: string, file: File, documentType: string) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('document_type', documentType)
  
  const response = await api.post(`/api/applications/${applicationId}/documents`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

// Underwriting API calls
export const processUnderwriting = async (applicationId: string, bureauDataOverride?: any) => {
  const response = await api.post(`/api/underwriting/process/${applicationId}`, {
    application_id: applicationId,
    bureau_data_override: bureauDataOverride,
  })
  return response.data
}

export const getUnderwritingStatus = async (applicationId: string) => {
  const response = await api.get(`/api/underwriting/status/${applicationId}`)
  return response.data
}

// Policy API calls
export const testPolicy = async (applicationData: any, bureauData?: any, templateName?: string) => {
  const response = await api.post('/api/policy/test', {
    application_data: applicationData,
    bureau_data: bureauData,
    template_name: templateName,
  })
  return response.data
}

export const getBureauTemplates = async () => {
  const response = await api.get('/api/policy/templates')
  return response.data
}

export const getTemplateData = async (templateName: string) => {
  const response = await api.get(`/api/policy/template/${templateName}`)
  return response.data
}

export const getPolicyRules = async () => {
  const response = await api.get('/api/policy/rules')
  return response.data
}

// Utility functions
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(2)}%`
}

export const getTokenFromStorage = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token')
  }
  return null
}

export const getUserFromStorage = (): any | null => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  }
  return null
}

export const clearAuthData = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
}

export default api