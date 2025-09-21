'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PhoneIcon, CheckCircleIcon, ShieldCheckIcon, BoltIcon, CurrencyRupeeIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { sendOTP, verifyOTP } from './lib/api'

export default function LandingPage() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [step, setStep] = useState<'phone' | 'otp' | 'name'>('phone')
  const [loading, setLoading] = useState(false)
  const [fetchingOtp, setFetchingOtp] = useState(false)
  const [otpReceived, setOtpReceived] = useState('')
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
        
        // Show fetching OTP message and auto-fill
        if (response.otp) {
          setFetchingOtp(true)
          setOtpReceived('')
          
          // Simulate fetching OTP with progressive loading
          setTimeout(() => {
            setOtpReceived(response.otp)
            setOtp(response.otp)
            setFetchingOtp(false)
            toast.success('OTP auto-filled successfully!', { duration: 3000 })
          }, 2500) // 2.5 second delay to show fetching
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
          router.push('/loan-requirements')
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
    <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-2xl font-bold text-white">U</span>
          </div>
          <div className="mt-4">
            <h1 className="text-2xl font-bold text-white">Umoney</h1>
            <p className="text-sm text-blue-400 mt-1">Your Money, Your Choice, Your Future</p>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-white">
            Get Personal Loan up to ₹50 Lakhs with Umoney
          </h2>
          <p className="mt-2 text-sm text-gray-300">
            ✓ Instant AI Approval ✓ Rates from 16% ✓ No Hidden Charges ✓ 100% Digital
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-10 h-10 bg-green-600/20 border border-green-500/30 rounded-full flex items-center justify-center">
              <BoltIcon className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-xs text-gray-300">Instant AI Approval</span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <div className="w-10 h-10 bg-blue-600/20 border border-blue-500/30 rounded-full flex items-center justify-center">
              <ShieldCheckIcon className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-xs text-gray-300">Rates from 16%</span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <div className="w-10 h-10 bg-purple-600/20 border border-purple-500/30 rounded-full flex items-center justify-center">
              <CheckCircleIcon className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-xs text-gray-300">100% Digital</span>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 space-y-6 shadow-2xl">
          {step === 'phone' && (
            <>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your phone number"
                    maxLength={10}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400 text-sm">+91</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Send OTP'
                )}
              </button>
            </>
          )}

          {step === 'otp' && (
            <>
              {/* Fetching OTP Message */}
              {fetchingOtp && (
                <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-blue-300 font-medium">Fetching OTP...</span>
                  </div>
                  <p className="text-blue-200 text-sm mt-1">Please wait while we retrieve your OTP</p>
                </div>
              )}
              
              {/* OTP Success Message */}
              {otpReceived && !fetchingOtp && (
                <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircleIcon className="w-5 h-5 text-green-400" />
                    <span className="text-green-300 font-medium">OTP Retrieved Successfully!</span>
                  </div>
                  <p className="text-green-200 text-sm mt-1">Your OTP has been auto-filled below</p>
                </div>
              )}
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Your Name (Optional)
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-300 mb-2">
                  Enter OTP
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className={`w-full px-4 py-3 bg-gray-800 border ${
                    otpReceived && otp === otpReceived 
                      ? 'border-green-500 ring-1 ring-green-500' 
                      : 'border-gray-600'
                  } rounded-lg text-white placeholder-gray-400 text-center text-lg tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                  placeholder="000000"
                  maxLength={6}
                  disabled={fetchingOtp}
                />
                <p className="mt-2 text-xs text-gray-400 text-center">
                  OTP sent to +91 {phone}
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('phone')}
                  className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200"
                >
                  Back
                </button>
                <button
                  onClick={handleVerifyOTP}
                  disabled={loading}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                  ) : (
                    'Verify & Continue'
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Trust indicators */}
        <div className="grid grid-cols-1 gap-3 text-center">
          <div className="flex items-center justify-center space-x-2 text-gray-300">
            <span className="text-sm font-medium text-blue-400">10L+ Happy Customers</span>
            <span className="text-gray-500">•</span>
            <span className="text-sm font-medium text-green-400">RBI Approved</span>
            <span className="text-gray-500">•</span>
            <span className="text-sm font-medium text-yellow-400">4.9★ Rating</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-gray-300">
            <ShieldCheckIcon className="h-4 w-4 text-green-400" />
            <span className="text-sm">Your data is secure and encrypted</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-gray-300">
            <BoltIcon className="h-4 w-4 text-blue-400" />
            <span className="text-sm">Get approved in under 2 minutes</span>
          </div>
        </div>
      </div>
    </div>
  )
}