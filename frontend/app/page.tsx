'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CheckCircleIcon, 
  ShieldCheckIcon, 
  BoltIcon, 
  CurrencyRupeeIcon,
  ChevronDownIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  UserGroupIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { sendOTP, verifyOTP } from './lib/api'

// Umoney Logo Component
const UmoneyLogo = ({ className = "h-8" }: { className?: string }) => (
  <div className="flex items-center space-x-2 group cursor-pointer transition-transform duration-200 hover:scale-105">
    <div className="relative">
      <svg 
        className={`${className} w-auto text-blue-500`} 
        viewBox="0 0 32 32" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* U Shape */}
        <path 
          d="M4 6v12a12 12 0 0024 0V6" 
          stroke="currentColor" 
          strokeWidth="3" 
          strokeLinecap="round" 
          fill="none"
        />
        {/* Growth Arrow */}
        <path 
          d="M18 14l6-6m0 0h-4m4 0v4" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
    </div>
    <span className="text-xl font-bold text-white tracking-tight">
      umoney
    </span>
  </div>
)

export default function LandingPage() {
  const [loanAmount, setLoanAmount] = useState(500000)
  const [monthlyIncome, setMonthlyIncome] = useState('25000-50000')
  const [employmentType, setEmploymentType] = useState('salaried')
  const [city, setCity] = useState('Delhi')
  const [showForm, setShowForm] = useState(false)
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

  const handleCheckOffers = () => {
    setShowForm(true)
  }

  const formatAmount = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
    return `₹${(amount / 1000).toFixed(0)}k`
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <UmoneyLogo />
            
            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-gray-300 hover:text-white transition-colors">Personal Loans</a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">Business Loans</a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">Credit Cards</a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">EMI Calculator</a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors flex items-center">
                More <ChevronDownIcon className="w-4 h-4 ml-1" />
              </a>
            </nav>
            
            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              <button className="text-gray-300 hover:text-white transition-colors">Login</button>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6">
            Compare & Apply for
            <span className="block text-blue-400">Personal Loans</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Get loan up to ₹50 lakhs at lowest interest rates
          </p>
          
          {/* Trust Badges */}
          <div className="flex items-center justify-center space-x-6 mb-12 text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <UserGroupIcon className="w-5 h-5 text-blue-400" />
              <span>50+ Partner Banks</span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-2">
              <StarIcon className="w-5 h-5 text-yellow-400" />
              <span>4.9★ Rating</span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="w-5 h-5 text-green-400" />
              <span>10L+ Customers</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Calculator Widget */}
      <section className="pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {!showForm ? (
            <div className="bg-gray-900 rounded-2xl p-8 lg:p-12 border border-gray-700">
              <div className="space-y-8">
                {/* Loan Amount Slider */}
                <div>
                  <label className="block text-lg font-semibold text-white mb-4">
                    Loan Amount: {formatAmount(loanAmount)}
                  </label>
                  <div className="relative">
                    <input
                      type="range"
                      min="25000"
                      max="5000000"
                      step="25000"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(Number(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-sm text-gray-400 mt-2">
                      <span>₹25k</span>
                      <span>₹50L</span>
                    </div>
                  </div>
                </div>

                {/* Form Grid */}
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Monthly Income */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Monthly Income
                    </label>
                    <select 
                      value={monthlyIncome}
                      onChange={(e) => setMonthlyIncome(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="15000-25000">₹15k - ₹25k</option>
                      <option value="25000-50000">₹25k - ₹50k</option>
                      <option value="50000-100000">₹50k - ₹1L</option>
                      <option value="100000-200000">₹1L - ₹2L</option>
                      <option value="200000+">₹2L+</option>
                    </select>
                  </div>

                  {/* Employment Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Employment Type
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="employment"
                          value="salaried"
                          checked={employmentType === 'salaried'}
                          onChange={(e) => setEmploymentType(e.target.value)}
                          className="mr-2 text-blue-600"
                        />
                        <span className="text-white">Salaried</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="employment"
                          value="self-employed"
                          checked={employmentType === 'self-employed'}
                          onChange={(e) => setEmploymentType(e.target.value)}
                          className="mr-2 text-blue-600"
                        />
                        <span className="text-white">Self-employed</span>
                      </label>
                    </div>
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      City
                    </label>
                    <select 
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Delhi">Delhi</option>
                      <option value="Mumbai">Mumbai</option>
                      <option value="Bangalore">Bangalore</option>
                      <option value="Chennai">Chennai</option>
                      <option value="Hyderabad">Hyderabad</option>
                      <option value="Pune">Pune</option>
                      <option value="Kolkata">Kolkata</option>
                    </select>
                  </div>
                </div>

                {/* Check Offers Button */}
                <div className="text-center">
                  <button 
                    onClick={handleCheckOffers}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-12 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/25"
                  >
                    Check Offers
                  </button>
                  <p className="text-sm text-gray-400 mt-3">
                    <ShieldCheckIcon className="w-4 h-4 inline mr-1" />
                    Won't affect credit score
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* OTP Form */
            <div className="bg-gray-900 rounded-2xl p-8 border border-gray-700 max-w-md mx-auto">
              {step === 'phone' && (
                <>
                  <h3 className="text-2xl font-bold text-white mb-6 text-center">
                    Get Your Loan Offers
                  </h3>
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
                    className="w-full mt-6 flex justify-center py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
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
                  <h3 className="text-2xl font-bold text-white mb-6 text-center">
                    Verify Your Number
                  </h3>
                  
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
                  
                  <div className="mb-4">
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
                  <div className="mb-6">
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
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Check Offers</h3>
              <p className="text-gray-400">Compare rates from 50+ banks and get personalized offers</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Apply Online</h3>
              <p className="text-gray-400">Complete your application with minimal documentation</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Get Money</h3>
              <p className="text-gray-400">Instant approval and quick disbursal to your account</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-700 text-center">
              <BoltIcon className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Instant Approval</h3>
              <p className="text-gray-400 text-sm">Get approved in under 2 minutes with AI-powered decisions</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-700 text-center">
              <ArrowTrendingUpIcon className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Lowest Rates</h3>
              <p className="text-gray-400 text-sm">Starting from 10.99% per annum with competitive EMIs</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-700 text-center">
              <ShieldCheckIcon className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Hidden Charges</h3>
              <p className="text-gray-400 text-sm">Transparent pricing with no processing fees</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-700 text-center">
              <ClockIcon className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">100% Digital</h3>
              <p className="text-gray-400 text-sm">Complete paperless process from application to disbursal</p>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Banks */}
      <section className="py-16 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-12">Our Partner Banks</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center">
            {['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Kotak', 'IndusInd', 'Yes Bank', 'BOB', 'Canara', 'PNB', 'Union Bank', 'IDFC First'].map((bank) => (
              <div key={bank} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="h-12 bg-gray-700 rounded flex items-center justify-center">
                  <span className="text-gray-400 text-xs font-medium">{bank}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
        }
      `}</style>
    </div>
  )
}