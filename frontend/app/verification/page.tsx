'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  UserIcon, 
  CalendarIcon, 
  IdentificationIcon,
  MapPinIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface FormData {
  fullName: string
  dateOfBirth: string
  panNumber: string
  aadhaarNumber: string
  address: {
    line1: string
    line2: string
    city: string
    state: string
    pincode: string
  }
  gender: string
  consentGiven: boolean
}

export default function VerificationPage() {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    dateOfBirth: '',
    panNumber: '',
    aadhaarNumber: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      pincode: ''
    },
    gender: '',
    consentGiven: false
  })

  const [loading, setLoading] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/')
      return
    }

    // Load extracted data from previous step
    const extractedData = localStorage.getItem('extractedData')
    if (extractedData) {
      try {
        const data = JSON.parse(extractedData)
        setFormData(prev => ({
          ...prev,
          fullName: data.pan?.name || data.aadhaar?.name || '',
          dateOfBirth: data.pan?.dob || data.aadhaar?.dob || '',
          panNumber: data.pan?.pan || '',
          address: {
            ...prev.address,
            line1: data.aadhaar?.address?.split(',')[0] || '',
            line2: data.aadhaar?.address?.split(',')[1] || '',
            city: data.aadhaar?.address?.split(',')[2] || '',
            state: data.aadhaar?.address?.split(',')[3] || '',
            pincode: data.aadhaar?.address?.match(/\d{6}/)?.[0] || ''
          }
        }))
        setDataLoaded(true)
      } catch (error) {
        console.error('Error loading extracted data:', error)
      }
    }
  }, [router])

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1]
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const formatPAN = (pan: string) => {
    return pan.replace(/(\w{5})(\w{4})(\w)/, '$1****$3')
  }

  const formatAadhaar = (aadhaar: string) => {
    return aadhaar.replace(/(\d{4})\s?(\d{4})\s?(\d{4})/, 'XXXX XXXX $3')
  }

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      toast.error('Please enter your full name')
      return false
    }
    if (!formData.dateOfBirth) {
      toast.error('Please enter your date of birth')
      return false
    }
    if (!formData.address.line1.trim()) {
      toast.error('Please enter your address')
      return false
    }
    if (!formData.address.city.trim()) {
      toast.error('Please enter your city')
      return false
    }
    if (!formData.address.state.trim()) {
      toast.error('Please enter your state')
      return false
    }
    if (!formData.address.pincode.trim() || formData.address.pincode.length !== 6) {
      toast.error('Please enter a valid 6-digit pincode')
      return false
    }
    if (!formData.consentGiven) {
      toast.error('Please provide consent to fetch your credit report')
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    
    // Store verified data
    localStorage.setItem('verifiedData', JSON.stringify(formData))
    
    toast.success('Data verified successfully!')
    
    setTimeout(() => {
      router.push('/processing')
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-black py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
            <span>Step 5 of 8</span>
            <span>Data Verification</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300" style={{ width: '62.5%' }}></div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">
            Verify Your Information
          </h1>
          <p className="text-gray-300">
            Please review and confirm the extracted information from your documents
          </p>
        </div>

        {dataLoaded && (
          <div className="mb-6">
            <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-4 flex items-center space-x-3">
              <CheckCircleIcon className="h-6 w-6 text-green-400 flex-shrink-0" />
              <div>
                <p className="text-green-400 font-medium">Documents processed successfully!</p>
                <p className="text-green-300 text-sm">Information extracted and pre-filled below</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Personal Information */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <UserIcon className="h-6 w-6 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Personal Information</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth?.split('/').reverse().join('-')}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Document Numbers */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <IdentificationIcon className="h-6 w-6 text-green-400" />
              <h2 className="text-xl font-semibold text-white">Document Numbers</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  PAN Number
                </label>
                <div className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-gray-400 font-mono">
                  {formatPAN(formData.panNumber) || 'Not available'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Aadhaar Number
                </label>
                <div className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-gray-400 font-mono">
                  {formatAadhaar(formData.aadhaarNumber) || 'XXXX XXXX XXXX'}
                </div>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <MapPinIcon className="h-6 w-6 text-purple-400" />
              <h2 className="text-xl font-semibold text-white">Address Information</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  value={formData.address.line1}
                  onChange={(e) => handleInputChange('address.line1', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="House/Flat No., Building Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Address Line 2
                </label>
                <input
                  type="text"
                  value={formData.address.line2}
                  onChange={(e) => handleInputChange('address.line2', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Street, Locality, Area"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.address.city}
                    onChange={(e) => handleInputChange('address.city', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="City"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    value={formData.address.state}
                    onChange={(e) => handleInputChange('address.state', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="State"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    value={formData.address.pincode}
                    onChange={(e) => handleInputChange('address.pincode', e.target.value)}
                    maxLength={6}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="000000"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bureau Consent */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <ShieldCheckIcon className="h-6 w-6 text-yellow-400" />
              <h2 className="text-xl font-semibold text-white">Credit Bureau Authorization</h2>
            </div>

            <div className="bg-yellow-600/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
              <h3 className="text-yellow-400 font-medium mb-2">Why do we need this?</h3>
              <p className="text-yellow-300 text-sm">
                We need to fetch your credit report from authorized credit bureaus (CIBIL, Experian, Equifax) 
                to evaluate your loan application and provide you with the best possible terms.
              </p>
            </div>

            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.consentGiven}
                onChange={(e) => handleInputChange('consentGiven', e.target.checked.toString())}
                className="mt-1 w-5 h-5 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <div className="text-sm">
                <p className="text-white font-medium">
                  I authorize you to fetch my credit report *
                </p>
                <p className="text-gray-400 mt-1">
                  By checking this box, I consent to the retrieval of my credit information from credit bureaus 
                  for the purpose of loan evaluation. This will not impact my credit score.
                </p>
              </div>
            </label>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.consentGiven}
            className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 disabled:from-gray-700 disabled:to-gray-700 text-white font-medium py-4 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Verify & Continue</span>
                <ArrowRightIcon className="h-5 w-5" />
              </>
            )}
          </button>

          <div className="text-center">
            <p className="text-gray-400 text-sm">
              🔒 Your information is encrypted and stored securely
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}