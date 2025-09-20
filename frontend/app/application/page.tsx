'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { 
  CurrencyRupeeIcon, 
  BriefcaseIcon, 
  CalendarIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'

import { createApplication, updateApplication } from '../lib/api'
import { getUserFromStorage, getTokenFromStorage } from '../lib/api'
import { 
  ApplicationFormData, 
  LOAN_PURPOSES, 
  EMPLOYMENT_TYPES, 
  TENURE_OPTIONS,
  LoanPurpose,
  EmploymentType
} from '../lib/types'

const STEPS = [
  { id: 1, name: 'Loan Details', icon: CurrencyRupeeIcon },
  { id: 2, name: 'Personal Info', icon: BriefcaseIcon },
  { id: 3, name: 'Employment', icon: CalendarIcon },
  { id: 4, name: 'Review', icon: DocumentTextIcon },
]

export default function ApplicationPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [applicationId, setApplicationId] = useState<string>('')
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    getValues
  } = useForm<ApplicationFormData>({
    defaultValues: {
      requested_amount: 100000,
      purpose: 'personal',
      monthly_income: 50000,
      employment_type: 'private_domestic',
      employment_years: 2,
      age: 30,
      preferred_tenure: 24,
      income_sources: [],
      additional_info: {}
    }
  })

  // Check authentication
  useEffect(() => {
    const token = getTokenFromStorage()
    if (!token) {
      router.push('/')
      return
    }
  }, [router])

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const onSubmit = async (data: ApplicationFormData) => {
    setLoading(true)
    try {
      let response
      if (applicationId) {
        response = await updateApplication(applicationId, data)
      } else {
        response = await createApplication(data)
        setApplicationId(response.application.id)
      }

      if (response.success) {
        toast.success('Application saved successfully!')
        if (currentStep === 4) {
          // Navigate to document upload
          router.push(`/application/${response.application.id}/documents`)
        } else {
          nextStep()
        }
      } else {
        toast.error('Failed to save application')
      }
    } catch (error) {
      toast.error('Failed to save application')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const watchedAmount = watch('requested_amount')
  const watchedTenure = watch('preferred_tenure')
  const watchedIncome = watch('monthly_income')

  // Calculate estimated EMI
  const calculateEMI = (amount: number, tenure: number) => {
    const rate = 12 / 100 / 12 // Assuming 12% annual rate
    const emi = (amount * rate * Math.pow(1 + rate, tenure)) / (Math.pow(1 + rate, tenure) - 1)
    return emi
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Loan Application</h1>
          <p className="mt-2 text-gray-600">Complete your loan application in a few simple steps</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, stepIdx) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.id
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'border-gray-300 text-gray-500'
                }`}>
                  <step.icon className="w-5 h-5" />
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  currentStep >= step.id ? 'text-primary-600' : 'text-gray-500'
                }`}>
                  {step.name}
                </span>
                {stepIdx < STEPS.length - 1 && (
                  <div className={`w-16 h-0.5 ml-4 ${
                    currentStep > step.id ? 'bg-primary-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Loan Details */}
            {currentStep === 1 && (
              <div className="space-y-6 fade-in">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Loan Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Loan Amount *
                    </label>
                    <div className="relative">
                      <input
                        type="range"
                        min="50000"
                        max="2000000"
                        step="10000"
                        {...register('requested_amount', { required: 'Loan amount is required' })}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>₹50K</span>
                        <span>₹20L</span>
                      </div>
                    </div>
                    <div className="mt-2 text-center">
                      <span className="text-2xl font-bold text-primary-600">
                        {formatCurrency(watchedAmount)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Loan Purpose *
                    </label>
                    <select
                      {...register('purpose', { required: 'Purpose is required' })}
                      className="input-field"
                    >
                      {LOAN_PURPOSES.map((purpose) => (
                        <option key={purpose.value} value={purpose.value}>
                          {purpose.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Loan Tenure *
                    </label>
                    <select
                      {...register('preferred_tenure', { required: 'Tenure is required' })}
                      className="input-field"
                    >
                      {TENURE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estimated EMI
                    </label>
                    <div className="bg-gray-50 border border-gray-300 rounded-md px-3 py-2">
                      <span className="text-lg font-semibold text-gray-900">
                        {formatCurrency(calculateEMI(watchedAmount, watchedTenure))}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">/month</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Personal Information */}
            {currentStep === 2 && (
              <div className="space-y-6 fade-in">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age *
                    </label>
                    <input
                      type="number"
                      min="18"
                      max="80"
                      {...register('age', { 
                        required: 'Age is required',
                        min: { value: 18, message: 'Minimum age is 18' },
                        max: { value: 80, message: 'Maximum age is 80' }
                      })}
                      className="input-field"
                      placeholder="Enter your age"
                    />
                    {errors.age && (
                      <p className="mt-1 text-sm text-red-600">{errors.age.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Income *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="10000"
                        {...register('monthly_income', { 
                          required: 'Monthly income is required',
                          min: { value: 10000, message: 'Minimum income is ₹10,000' }
                        })}
                        className="input-field pl-8"
                        placeholder="50000"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CurrencyRupeeIcon className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                    {errors.monthly_income && (
                      <p className="mt-1 text-sm text-red-600">{errors.monthly_income.message}</p>
                    )}
                  </div>
                </div>

                {/* Income vs Expense visualization */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">Affordability Check</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Monthly Income:</span>
                      <span className="text-sm font-medium">{formatCurrency(watchedIncome)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Proposed EMI:</span>
                      <span className="text-sm font-medium">{formatCurrency(calculateEMI(watchedAmount, watchedTenure))}</span>
                    </div>
                    <div className="flex justify-between border-t border-blue-200 pt-2">
                      <span className="text-sm font-medium text-blue-900">EMI to Income Ratio:</span>
                      <span className="text-sm font-bold text-blue-900">
                        {((calculateEMI(watchedAmount, watchedTenure) / watchedIncome) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Employment Details */}
            {currentStep === 3 && (
              <div className="space-y-6 fade-in">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Employment Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employment Type *
                    </label>
                    <select
                      {...register('employment_type', { required: 'Employment type is required' })}
                      className="input-field"
                    >
                      {EMPLOYMENT_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Years of Employment *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="50"
                      {...register('employment_years', { 
                        required: 'Employment years is required',
                        min: { value: 0, message: 'Cannot be negative' }
                      })}
                      className="input-field"
                      placeholder="2.5"
                    />
                    {errors.employment_years && (
                      <p className="mt-1 text-sm text-red-600">{errors.employment_years.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <div className="space-y-6 fade-in">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Review Your Application</h2>
                
                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Loan Amount:</span>
                      <p className="font-semibold">{formatCurrency(getValues('requested_amount'))}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Purpose:</span>
                      <p className="font-semibold">{LOAN_PURPOSES.find(p => p.value === getValues('purpose'))?.label}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Tenure:</span>
                      <p className="font-semibold">{getValues('preferred_tenure')} months</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Monthly Income:</span>
                      <p className="font-semibold">{formatCurrency(getValues('monthly_income'))}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Employment:</span>
                      <p className="font-semibold">{EMPLOYMENT_TYPES.find(t => t.value === getValues('employment_type'))?.label}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Experience:</span>
                      <p className="font-semibold">{getValues('employment_years')} years</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-green-900 mb-2">Next Steps</h3>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Upload required documents</li>
                    <li>• Wait for instant AI-powered decision</li>
                    <li>• Get loan approved in minutes</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Previous
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="spinner mr-2"></div>
                ) : currentStep === 4 ? (
                  'Continue to Documents'
                ) : (
                  <>
                    Next
                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}