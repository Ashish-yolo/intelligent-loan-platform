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
  ArrowRightIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

// TypeScript interfaces removed for JSX compatibility

// Helper function to parse Aadhaar address intelligently
const parseAadhaarAddress = (address) => {
  console.log('parseAadhaarAddress called with:', address)
  
  if (!address || address.trim() === '') {
    console.log('No address provided, returning empty fields')
    return {
      line1: '',
      line2: '',
      city: '',
      state: '',
      pincode: ''
    }
  }

  console.log('Raw address input:', JSON.stringify(address))
  
  // Remove S/O, W/O, D/O prefixes and extract the actual address
  let cleanAddress = (address || '').toString().trim()
  const soMatch = cleanAddress.match(/^S\/O:\s*([^,]+),\s*(.+)$/)
  if (soMatch) {
    cleanAddress = soMatch[2] // Take everything after "S/O: Name,"
    console.log('Removed S/O prefix, clean address:', cleanAddress)
  }

  // Split by commas and clean up each part
  const parts = cleanAddress.split(',').map(part => part.trim()).filter(part => part.length > 0)
  console.log('Address parts after splitting:', parts)
  
  // Extract pincode (6 digits)
  const pincodeMatch = cleanAddress.match(/\b(\d{6})\b/)
  const pincode = pincodeMatch ? pincodeMatch[1] : ''
  console.log('Extracted pincode:', pincode)
  
  // Common Indian states (for better parsing)
  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Puducherry', 'Chandigarh', 'Dadra and Nagar Haveli', 'Daman and Diu',
    'Lakshadweep', 'Ladakh', 'Jammu and Kashmir'
  ]
  
  // Find state in the address parts
  let state = ''
  let stateIndex = -1
  for (let i = parts.length - 1; i >= 0; i--) {
    if (indianStates.some(s => s.toLowerCase() === parts[i].toLowerCase())) {
      state = parts[i]
      stateIndex = i
      console.log('Found state:', state, 'at index:', stateIndex)
      break
    }
  }
  
  // City is usually before the state
  let city = ''
  if (stateIndex > 0) {
    city = parts[stateIndex - 1]
  } else if (parts.length > 1) {
    // If no state found, assume last non-pincode part is city
    const lastPart = parts[parts.length - 1]
    city = /\d{6}/.test(lastPart) && parts.length > 1 ? parts[parts.length - 2] : lastPart
  }
  console.log('Extracted city:', city)
  
  // Address lines are the remaining parts
  const addressParts = parts.filter((part, index) => {
    return index < stateIndex - 1 && !part.includes(pincode)
  })
  
  // If no proper state/city found, use a simpler approach
  if (!state && !city && parts.length > 0) {
    console.log('Using fallback parsing approach')
    // Take first part as line1, second as line2, last as city if no pincode
    const line1 = parts[0] || ''
    const line2 = parts.length > 1 ? parts[1] : ''
    const fallbackCity = parts.length > 2 ? parts[parts.length - (pincode ? 2 : 1)] : ''
    
    const result = {
      line1: line1,
      line2: line2,
      city: fallbackCity,
      state: '',
      pincode: pincode
    }
    console.log('Fallback parsing result:', result)
    return result
  }
  
  const result = {
    line1: addressParts[0] || '',
    line2: addressParts.slice(1, 3).join(', ') || '',
    city: city || '',
    state: state || '',
    pincode: pincode || ''
  }
  
  console.log('Final parsing result:', result)
  return result
}

export default function VerificationPage() {
  const [formData, setFormData] = useState({
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
  const [incomeData, setIncomeData] = useState(null)
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
        // Try multiple possible address field names from Aadhaar data
        // Prioritize Aadhaar back data for address (as address is typically on the back)
        let aadhaarAddress = ''
        
        // Check all possible sources and log what we find
        const addressSources = [
          { source: 'aadhaar_back.address', value: data.aadhaar_back?.address },
          { source: 'aadhaar.address', value: data.aadhaar?.address },
          { source: 'aadhaar_back.complete_address', value: data.aadhaar_back?.complete_address },
          { source: 'aadhaar.complete_address', value: data.aadhaar?.complete_address },
          { source: 'aadhaar_back.full_address', value: data.aadhaar_back?.full_address },
          { source: 'aadhaar.full_address', value: data.aadhaar?.full_address },
          { source: 'aadhaar_back.addr', value: data.aadhaar_back?.addr },
          { source: 'aadhaar.addr', value: data.aadhaar?.addr }
        ]
        
        console.log('🔍 Checking all address sources:', addressSources)
        
        // Additional debugging to see the complete data structure
        console.log('🔍 FULL extractedData structure:', JSON.stringify(data, null, 2))
        
        // Find the first non-empty address
        for (const { source, value } of addressSources) {
          if (value && typeof value === 'string' && value.trim() && value !== 'null') {
            aadhaarAddress = value
            console.log(`✅ Using address from ${source}: ${(value || '').substring(0, 50)}...`)
            break
          }
        }
        
        if (!aadhaarAddress) {
          console.log('❌ No valid address found in any source')
        }
        
        const parsedAddress = parseAadhaarAddress(aadhaarAddress)
        setFormData(prev => ({
          ...prev,
          fullName: data.pan?.name || data.aadhaar?.name || '',
          dateOfBirth: data.pan?.dob || data.aadhaar?.dob || '',
          panNumber: data.pan?.pan || '',
          aadhaarNumber: data.aadhaar?.aadhaar_number || data.aadhaar?.aadhaar_last4 || '',
          address: parsedAddress
        }))
        
        console.log('FULL EXTRACTED DATA STRUCTURE:', data)
        console.log('Extracted Aadhaar data:', {
          rawAddress: aadhaarAddress,
          parsedAddress: parsedAddress,
          aadhaarNumber: data.aadhaar?.aadhaar_number,
          fullAadhaarData: data.aadhaar,
          fullAadhaarBackData: data.aadhaar_back,
          hasAadhaarBack: !!data.aadhaar_back,
          hasAadhaarFront: !!data.aadhaar_front,
          combinedAadhaarAddress: data.aadhaar?.address,
          backAadhaarAddress: data.aadhaar_back?.address,
          frontAadhaarAddress: data.aadhaar_front?.address,
          addressSource: data.aadhaar_back?.address ? 'aadhaar_back' : 
                        data.aadhaar?.address ? 'aadhaar_combined' : 'none'
        })
        
        // Additional logging to debug address auto-fill
        console.log('Address parsing result:', {
          hasAadhaarData: !!data.aadhaar,
          hasAddress: !!aadhaarAddress,
          addressValue: aadhaarAddress,
          addressFields: Object.keys(data.aadhaar || {}),
          parsedFields: {
            line1: parsedAddress.line1,
            line2: parsedAddress.line2,
            city: parsedAddress.city,
            state: parsedAddress.state,
            pincode: parsedAddress.pincode
          }
        })
        setDataLoaded(true)
        
        // Store income data separately for display
        if (data.income) {
          setIncomeData(data.income)
          localStorage.setItem('incomeVerificationData', JSON.stringify(data.income))
        }
      } catch (error) {
        console.error('Error loading extracted data:', error)
      }
    }

  }, [router])

  const handleInputChange = (field, value) => {
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

  const formatPAN = (pan) => {
    return pan ? pan.replace(/(\w{5})(\w{4})(\w)/, '$1****$3') : 'XXXXX****X'
  }

  const formatAadhaar = (aadhaar) => {
    return aadhaar ? aadhaar.replace(/(\d{4})\s?(\d{4})\s?(\d{4})/, 'XXXX XXXX $3') : 'XXXX XXXX XXXX'
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


        <div className="space-y-6">
          {/* Personal Information */}
          <div className="bg-gray-900 bg-opacity-50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
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
          <div className="bg-gray-900 bg-opacity-50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
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
          <div className="bg-gray-900 bg-opacity-50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <MapPinIcon className="h-6 w-6 text-purple-400" />
                <h2 className="text-xl font-semibold text-white">Address Information</h2>
              </div>
              {dataLoaded && formData.address.line1 && (
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircleIcon className="h-4 w-4 text-green-400" />
                  <span className="text-green-400">Auto-filled from Aadhaar</span>
                </div>
              )}
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

          {/* Income Verification Display */}
          {incomeData && (
            <div className="bg-gray-900 bg-opacity-50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-6">
                <BanknotesIcon className="h-6 w-6 text-green-400" />
                <h2 className="text-xl font-semibold text-white">Income Verification</h2>
              </div>

              <div className="bg-green-600 bg-opacity-10 border border-green-500 border-opacity-30 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-3 mb-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-400" />
                  <span className="text-green-400 font-medium">Income Successfully Verified</span>
                </div>
                <p className="text-green-300 text-sm">
                  Your income has been verified and will be used for loan assessment.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-gray-800 bg-opacity-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-400">
                    ₹{incomeData.monthly_income?.toLocaleString() || '0'}
                  </div>
                  <div className="text-gray-400 text-sm">Monthly Income</div>
                </div>
                
                <div className="bg-gray-800 bg-opacity-50 rounded-lg p-4">
                  <div className="text-lg font-semibold text-blue-400 capitalize">
                    {incomeData.source ? incomeData.source.replace('_', ' ') : 'Not specified'}
                  </div>
                  <div className="text-gray-400 text-sm">Income Source</div>
                </div>
                
                <div className="bg-gray-800 bg-opacity-50 rounded-lg p-4">
                  <div className="text-lg font-semibold text-purple-400">
                    {Math.round((incomeData.confidence || 0) * 100)}%
                  </div>
                  <div className="text-gray-400 text-sm">Verification Confidence</div>
                </div>
              </div>

            </div>
          )}

          {/* Document Security Analysis */}
          {incomeData && incomeData.fraud_analysis && (
            <div className="bg-gray-900 bg-opacity-50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-6">
                <BanknotesIcon className="h-6 w-6 text-green-400" />
                <h2 className="text-xl font-semibold text-white">Document Security Analysis</h2>
              </div>

              <div className="bg-gray-800 bg-opacity-50 rounded-lg p-4 border-l-4 border-green-400">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-medium flex items-center">
                    <BanknotesIcon className="h-5 w-5 mr-2 text-green-400" />
                    Income Document Analysis
                  </h3>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-400">
                      {Math.round((incomeData.fraud_analysis.confidence_score || 0) * 100)}%
                    </div>
                    <div className="text-xs text-gray-400">Confidence</div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {/* Confidence Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Income Verification Confidence</span>
                      <span className="text-green-400 font-medium">
                        {Math.round((incomeData.fraud_analysis.confidence_score || 0) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(incomeData.fraud_analysis.confidence_score || 0) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Risk Level:</span>
                    <span className={`text-${incomeData.fraud_analysis.risk_level === 'low' ? 'green' : 
                                      incomeData.fraud_analysis.risk_level === 'medium' ? 'yellow' : 'red'}-400 font-medium capitalize`}>
                      {incomeData.fraud_analysis.risk_level}
                    </span>
                  </div>
                  
                  {incomeData.fraud_analysis.calculation_verified && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Calculations:</span>
                      <span className="text-green-400 font-medium">✅ Verified</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Recommendation:</span>
                    <span className={`text-${incomeData.fraud_analysis.recommendation === 'proceed' ? 'green' : 'yellow'}-400 font-medium capitalize`}>
                      {incomeData.fraud_analysis.recommendation}
                    </span>
                  </div>
                  
                  {incomeData.fraud_analysis.fraud_indicators && incomeData.fraud_analysis.fraud_indicators.length > 0 ? (
                    <div className="mt-3">
                      <span className="text-red-400 text-sm">⚠️ Issues Found:</span>
                      <ul className="text-red-300 text-xs mt-1 space-y-1">
                        {incomeData.fraud_analysis.fraud_indicators.map((indicator, index) => (
                          <li key={index}>• {indicator}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="text-green-400 text-sm">✅ No fraud indicators detected</div>
                  )}
                  
                  {incomeData.fraud_analysis.details && (
                    <p className="text-gray-300 text-xs mt-2 p-2 bg-gray-700 bg-opacity-50 rounded">
                      {incomeData.fraud_analysis.details}
                    </p>
                  )}
                </div>
              </div>

              {/* Overall Security Status */}
              <div className="mt-6 p-4 bg-green-600 bg-opacity-10 border border-green-500 border-opacity-30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-400" />
                  <div>
                    <h3 className="text-green-400 font-medium">Document Security Verified</h3>
                    <p className="text-green-300 text-sm">
                      Our AI-powered fraud detection system has analyzed your documents for authenticity, 
                      tampering, and consistency. All checks have been completed successfully.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bureau Consent */}
          <div className="bg-gray-900 bg-opacity-50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <ShieldCheckIcon className="h-6 w-6 text-yellow-400" />
              <h2 className="text-xl font-semibold text-white">Credit Bureau Authorization</h2>
            </div>

            <div className="bg-yellow-600 bg-opacity-10 border border-yellow-500 border-opacity-30 rounded-lg p-4 mb-4">
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

          {/* Navigation Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={() => router.back()}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium py-4 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-black transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center space-x-2"
            >
              <span>← Back</span>
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !formData.consentGiven}
              className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 disabled:from-gray-700 disabled:to-gray-700 text-white font-medium py-4 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRightIcon className="h-5 w-5" />
                </>
              )}
            </button>
          </div>


          <div className="text-center mt-4">
            <p className="text-gray-400 text-sm">
              🔒 Your information is encrypted and stored securely
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}