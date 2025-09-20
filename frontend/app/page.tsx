'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PhoneIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { sendOTP, verifyOTP } from './lib/api'

export default function LandingPage() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [step, setStep] = useState<'phone' | 'otp' | 'name'>('phone')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      toast.error('Please enter a valid phone number')
      return
    }

    setLoading(true)
    try {
      const response = await sendOTP(phone)
      if (response.success) {
        toast.success('OTP sent successfully!')
        setStep('otp')
        // For demo purposes, show the OTP
        if (response.otp) {
          toast.success(`Demo OTP: ${response.otp}`, { duration: 8000 })
        }
      } else {
        toast.error('Failed to send OTP')
      }
    } catch (error) {
      toast.error('Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP')
      return
    }

    setLoading(true)
    try {
      const response = await verifyOTP(phone, otp, name)
      if (response.access_token) {
        localStorage.setItem('token', response.access_token)
        localStorage.setItem('user', JSON.stringify(response.user))
        toast.success('Welcome! Redirecting to your application...')
        setTimeout(() => {
          router.push('/application')
        }, 1500)
      } else {
        toast.error('Invalid OTP. Please try again.')
      }
    } catch (error) {
      toast.error('Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (step === 'phone') {
        handleSendOTP()
      } else if (step === 'otp') {
        handleVerifyOTP()
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary-600 rounded-full flex items-center justify-center">
            <PhoneIcon className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Get Your Loan in Minutes
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            AI-powered instant loan approval with competitive rates
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs text-gray-600 mt-1">Instant Decision</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <CheckCircleIcon className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs text-gray-600 mt-1">No Hidden Fees</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <CheckCircleIcon className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xs text-gray-600 mt-1">Digital Process</span>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          {step === 'phone' && (
            <>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <div className="mt-1 relative">
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="input-field pl-12"
                    placeholder="Enter your phone number"
                    maxLength={10}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">+91</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="spinner"></div>
                ) : (
                  'Send OTP'
                )}
              </button>
            </>
          )}

          {step === 'otp' && (
            <>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Your Name (Optional)
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 input-field"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                  Enter OTP
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="mt-1 input-field text-center text-lg tracking-wider"
                  placeholder="000000"
                  maxLength={6}
                />
                <p className="mt-1 text-xs text-gray-500">
                  OTP sent to +91 {phone}
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('phone')}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Back
                </button>
                <button
                  onClick={handleVerifyOTP}
                  disabled={loading}
                  className="flex-1 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="spinner mx-auto"></div>
                  ) : (
                    'Verify & Continue'
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Trust indicators */}
        <div className="text-center text-xs text-gray-500 space-y-2">
          <p>🔒 Your data is secure and encrypted</p>
          <p>⚡ Get approved in under 2 minutes</p>
          <p>💳 Loans from ₹50,000 to ₹20,00,000</p>
        </div>
      </div>
    </div>
  )
}