'use client'

import { useState, useEffect } from 'react'
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
  StarIcon,
  DocumentIcon,
  BanknotesIcon,
  MagnifyingGlassIcon,
  DevicePhoneMobileIcon,
  PercentBadgeIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { sendOTP, verifyOTP } from './lib/api'

// Umoney Logo Component
const UmoneyLogo = ({ className = "h-8", onClick }) => (
  <div 
    className="flex items-center space-x-2 group cursor-pointer transition-transform duration-200 hover:scale-105"
    onClick={onClick}
  >
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
  // Calculator state
  const [loanAmount, setLoanAmount] = useState(200000)
  const [emi, setEmi] = useState(0)
  const [interestRate, setInterestRate] = useState(12.99)
  const [tenure, setTenure] = useState(24)
  
  // Form state
  const [showForm, setShowForm] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('phone')
  const [loading, setLoading] = useState(false)
  const [fetchingOtp, setFetchingOtp] = useState(false)
  const [otpReceived, setOtpReceived] = useState('')
  
  // FAQ state
  const [openFaq, setOpenFaq] = useState(null)
  
  const router = useRouter()

  // Calculate EMI based on loan amount, interest rate, and tenure
  const calculateEMI = (principal, rate, tenure) => {
    const monthlyRate = rate / (12 * 100)
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / 
                (Math.pow(1 + monthlyRate, tenure) - 1)
    return Math.round(emi)
  }

  // Update EMI when inputs change
  useEffect(() => {
    const newEmi = calculateEMI(loanAmount, interestRate, tenure)
    setEmi(newEmi)
  }, [loanAmount, interestRate, tenure])

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
      const response = await verifyOTP(phone, otp, '')
      if (response.access_token) {
        localStorage.setItem('token', response.access_token)
        localStorage.setItem('user', JSON.stringify(response.user))
        // Store the selected loan amount from landing page
        localStorage.setItem('selectedLoanAmount', loanAmount.toString())
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

  const handleKeyPress = (e) => {
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
    // Auto-scroll to the form after a brief delay to allow state to update
    setTimeout(() => {
      const formElement = document.querySelector('#offer-form')
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
  }

  const handleLogin = () => {
    setShowLogin(true)
    setStep('phone')
    setPhone('')
    setOtp('')
  }

  const handleLogoClick = () => {
    // Reset all states to show the calculator view (home page)
    setShowForm(false)
    setShowLogin(false)
    setStep('phone')
    setPhone('')
    setOtp('')
    setFetchingOtp(false)
    setOtpReceived('')
  }

  const formatAmount = (amount) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
    return `₹${(amount / 1000).toFixed(0)}k`
  }

  const faqData = [
    {
      question: "What can I use personal loan for?",
      answer: "Personal loans can be used for various purposes like medical emergencies, wedding expenses, home renovation, travel, debt consolidation, or any other personal financial need."
    },
    {
      question: "What is the minimum loan amount?",
      answer: "The minimum personal loan amount is ₹25,000 with our partner banks and NBFCs."
    },
    {
      question: "How is maximum loan amount decided?",
      answer: "Maximum loan amount depends on your monthly income, credit score, existing EMIs, and repayment capacity. It can go up to ₹50 lakhs for eligible customers."
    },
    {
      question: "What documents are required?",
      answer: "Basic documents include Aadhaar Card, PAN Card, salary slips (last 3 months), bank statements, and income proof (Form 16/ITR for self-employed)."
    },
    {
      question: "How long does approval take?",
      answer: "With our AI-powered system, loan approval takes just 5 minutes. Disbursal happens within 24 hours after document verification."
    }
  ]

  return (
    <div className="min-h-screen bg-black font-inter">
      {/* Header */}
      <header className="bg-black border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <UmoneyLogo onClick={handleLogoClick} />
            
            {/* Navigation & Auth */}
            <div className="flex items-center space-x-6">
              <button 
                onClick={handleLogin}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Login
              </button>
              <button 
                onClick={handleLogin}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-12 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4">
            Get Personal Loan up to ₹50 Lakhs
          </h1>
          <p className="text-xl lg:text-2xl text-gray-300 mb-2">
            Interest rates starting @10.99% p.a | Zero Processing Fee
          </p>
          <p className="text-sm text-blue-400 mb-8">
            Your Money, Your Choice, Your Future
          </p>
          
          {/* Trust Badges */}
          <div className="flex items-center justify-center space-x-6 mb-12 text-sm text-gray-400 flex-wrap">
            <div className="flex items-center space-x-2">
              <UserGroupIcon className="w-5 h-5 text-blue-400" />
              <span>50+ Partner Banks</span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="w-5 h-5 text-green-400" />
              <span>5.3 Cr Indians Trust Us</span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-2">
              <StarIcon className="w-5 h-5 text-yellow-400" />
              <span>4.9★ Rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* Loan Calculator Widget */}
      <section id="calculator" className="pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {showLogin ? (
            /* Login Form */
            <div className="bg-gray-900 rounded-2xl p-8 border border-gray-700 max-w-md mx-auto">
              {step === 'phone' && (
                <>
                  <h3 className="text-2xl font-bold text-white mb-6 text-center">
                    Welcome Back
                  </h3>
                  <div>
                    <label htmlFor="loginPhone" className="block text-sm font-medium text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <input
                        id="loginPhone"
                        name="loginPhone"
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
                  <div className="mt-4 text-center">
                    <button 
                      onClick={() => setShowLogin(false)}
                      className="text-gray-400 hover:text-white text-sm"
                    >
                      Back to Calculator
                    </button>
                  </div>
                </>
              )}

              {step === 'otp' && (
                <>
                  <h3 className="text-2xl font-bold text-white mb-6 text-center">
                    Verify Your Number
                  </h3>
                  
                  {/* Fetching OTP Message */}
                  {fetchingOtp && (
                    <div className="bg-blue-600 bg-opacity-20 border border-blue-500 border-opacity-30 rounded-lg p-4 mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-blue-300 font-medium">Fetching OTP...</span>
                      </div>
                      <p className="text-blue-200 text-sm mt-1">Please wait while we retrieve your OTP</p>
                    </div>
                  )}
                  
                  {/* OTP Success Message */}
                  {otpReceived && !fetchingOtp && (
                    <div className="bg-green-600 bg-opacity-20 border border-green-500 border-opacity-30 rounded-lg p-4 mb-4">
                      <div className="flex items-center space-x-3">
                        <CheckCircleIcon className="w-5 h-5 text-green-400" />
                        <span className="text-green-300 font-medium">OTP Retrieved Successfully!</span>
                      </div>
                      <p className="text-green-200 text-sm mt-1">Your OTP has been auto-filled below</p>
                    </div>
                  )}
                  
                  <div className="mb-6">
                    <label htmlFor="loginOtp" className="block text-sm font-medium text-gray-300 mb-2">
                      Enter OTP
                    </label>
                    <input
                      id="loginOtp"
                      name="loginOtp"
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
                        'Login'
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : !showForm ? (
            <div className="bg-gray-900 rounded-2xl p-8 lg:p-12 border border-gray-700 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-8 text-center">Personal Loan Calculator</h2>
              
              <div className="space-y-8">
                {/* Loan Amount Slider */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-lg font-semibold text-white">
                      Loan Amount
                    </label>
                    <span className="text-2xl font-bold text-blue-400">{formatAmount(loanAmount)}</span>
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min="25000"
                      max="5000000"
                      step="25000"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(Number(e.target.value))}
                      className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-sm text-gray-400 mt-2">
                      <span>₹25k</span>
                      <span>₹50L</span>
                    </div>
                  </div>
                </div>

                {/* Interest Rate Slider */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-lg font-semibold text-white">
                      Interest Rate
                    </label>
                    <span className="text-2xl font-bold text-green-400">{interestRate}% p.a</span>
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min="10.99"
                      max="24"
                      step="0.25"
                      value={interestRate}
                      onChange={(e) => setInterestRate(Number(e.target.value))}
                      className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-sm text-gray-400 mt-2">
                      <span>10.99%</span>
                      <span>24%</span>
                    </div>
                  </div>
                </div>

                {/* Tenure Selection */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-lg font-semibold text-white">
                      Loan Tenure
                    </label>
                    <span className="text-2xl font-bold text-purple-400">{tenure} months</span>
                  </div>
                  
                  {/* Tenure Slider */}
                  <div className="relative mb-4">
                    <input
                      type="range"
                      min="6"
                      max="60"
                      step="6"
                      value={tenure}
                      onChange={(e) => setTenure(Number(e.target.value))}
                      className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-sm text-gray-400 mt-2">
                      <span>6m</span>
                      <span>60m</span>
                    </div>
                  </div>

                  {/* Quick Tenure Selection Buttons */}
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {[12, 18, 24, 36, 48, 60].map((months) => (
                      <button
                        key={months}
                        onClick={() => setTenure(months)}
                        className={`tenure-button py-2 px-3 rounded-lg text-sm font-medium ${
                          tenure === months
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500 shadow-opacity-25 active'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                        }`}
                      >
                        {months}m
                      </button>
                    ))}
                  </div>
                </div>


                {/* EMI Display - Enhanced */}
                <div className="bg-gradient-to-r from-gray-800 via-gray-800 to-gray-800 rounded-xl p-6 border-2 border-gray-600 shadow-2xl">
                  <h3 className="text-lg font-semibold text-white mb-4 text-center">Your EMI Breakdown</h3>
                  
                  {/* Main EMI Stats */}
                  <div className="grid md:grid-cols-3 gap-6 text-center mb-6">
                    <div className="emi-card bg-gradient-to-br from-green-600 via-green-600 to-green-700 rounded-lg p-4 transform hover:scale-105 transition-all duration-300">
                      <p className="text-green-100 text-sm mb-1">Monthly EMI</p>
                      <p key={`emi-${emi}`} className="emi-value text-3xl font-bold text-white">₹{emi.toLocaleString()}</p>
                    </div>
                    <div className="emi-card bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700 rounded-lg p-4 transform hover:scale-105 transition-all duration-300">
                      <p className="text-blue-100 text-sm mb-1">Total Amount</p>
                      <p key={`total-${emi * tenure}`} className="emi-value text-2xl font-bold text-white">₹{(emi * tenure).toLocaleString()}</p>
                    </div>
                    <div className="emi-card bg-gradient-to-br from-purple-600 via-purple-600 to-purple-700 rounded-lg p-4 transform hover:scale-105 transition-all duration-300">
                      <p className="text-purple-100 text-sm mb-1">Total Interest</p>
                      <p key={`interest-${((emi * tenure) - loanAmount)}`} className="emi-value text-2xl font-bold text-white">₹{((emi * tenure) - loanAmount).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between py-2 border-b border-gray-700">
                      <span className="text-gray-400">Principal Amount:</span>
                      <span className="text-white font-medium">₹{loanAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-700">
                      <span className="text-gray-400">Interest Rate:</span>
                      <span className="text-white font-medium">{interestRate}% p.a</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-700">
                      <span className="text-gray-400">Loan Tenure:</span>
                      <span className="text-white font-medium">{tenure} months ({(tenure/12).toFixed(1)} years)</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-700">
                      <span className="text-gray-400">Processing Fee:</span>
                      <span className="text-green-400 font-medium">₹0 (Waived)</span>
                    </div>
                  </div>

                  {/* Interest vs Principal Visualization */}
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-300 mb-3">Payment Breakdown</h4>
                    <div className="flex rounded-lg overflow-hidden h-3">
                      <div 
                        className="bg-blue-500 transition-all duration-500"
                        style={{ width: `${(loanAmount / (emi * tenure)) * 100}%` }}
                        title={`Principal: ₹${loanAmount.toLocaleString()}`}
                      ></div>
                      <div 
                        className="bg-orange-500 transition-all duration-500"
                        style={{ width: `${(((emi * tenure) - loanAmount) / (emi * tenure)) * 100}%` }}
                        title={`Interest: ₹${((emi * tenure) - loanAmount).toLocaleString()}`}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                      <span className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                        Principal (₹{loanAmount.toLocaleString()})
                      </span>
                      <span className="flex items-center">
                        <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                        Interest (₹{((emi * tenure) - loanAmount).toLocaleString()})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Check Offers Button */}
                <div className="text-center">
                  <button 
                    onClick={handleCheckOffers}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-12 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500 shadow-opacity-25"
                  >
                    Check Offers
                  </button>
                  <p className="text-sm text-gray-400 mt-3">
                    <ShieldCheckIcon className="w-4 h-4 inline mr-1" />
                    Checking offers will not impact your credit score
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* OTP Form */
            <div id="offer-form" className="bg-gray-900 rounded-2xl p-8 border border-gray-700 max-w-md mx-auto">
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
                    <div className="bg-blue-600 bg-opacity-20 border border-blue-500 border-opacity-30 rounded-lg p-4 mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-blue-300 font-medium">Fetching OTP...</span>
                      </div>
                      <p className="text-blue-200 text-sm mt-1">Please wait while we retrieve your OTP</p>
                    </div>
                  )}
                  
                  {/* OTP Success Message */}
                  {otpReceived && !fetchingOtp && (
                    <div className="bg-green-600 bg-opacity-20 border border-green-500 border-opacity-30 rounded-lg p-4 mb-4">
                      <div className="flex items-center space-x-3">
                        <CheckCircleIcon className="w-5 h-5 text-green-400" />
                        <span className="text-green-300 font-medium">OTP Retrieved Successfully!</span>
                      </div>
                      <p className="text-green-200 text-sm mt-1">Your OTP has been auto-filled below</p>
                    </div>
                  )}
                  
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
      <section className="py-16 bg-gray-900 bg-opacity-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <MagnifyingGlassIcon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Check Offers</h3>
              <p className="text-gray-400">Compare rates from 50+ banks and get personalized loan offers</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <DocumentIcon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Apply Online</h3>
              <p className="text-gray-400">Complete digital application in 5 minutes with minimal documentation</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <BanknotesIcon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Get Money</h3>
              <p className="text-gray-400">Instant approval and quick disbursal to your bank account</p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-700 text-center hover:border-blue-500 transition-colors">
              <ClockIcon className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Instant Approval</h3>
              <p className="text-gray-400 text-sm">Get approved in 5 minutes with our AI-powered system</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-700 text-center hover:border-green-500 transition-colors">
              <PercentBadgeIcon className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Lowest Rates</h3>
              <p className="text-gray-400 text-sm">Starting from 10.99% p.a with competitive interest rates</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-700 text-center hover:border-purple-500 transition-colors">
              <CurrencyRupeeIcon className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Zero Processing Fee</h3>
              <p className="text-gray-400 text-sm">No hidden charges or processing fees</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-700 text-center hover:border-yellow-500 transition-colors">
              <DevicePhoneMobileIcon className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">100% Digital</h3>
              <p className="text-gray-400 text-sm">Complete paperless process from application to disbursal</p>
            </div>
          </div>
        </div>
      </section>

      {/* Loan Benefits */}
      <section className="py-16 bg-gray-900 bg-opacity-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Why Choose Umoney Personal Loans?
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircleIcon className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" />
                <p className="text-gray-300">Collateral-free unsecured loans</p>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircleIcon className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" />
                <p className="text-gray-300">No end-use restriction</p>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircleIcon className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" />
                <p className="text-gray-300">Flexible repayment tenure up to 60 months</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircleIcon className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" />
                <p className="text-gray-300">Minimal paperwork and documentation</p>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircleIcon className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" />
                <p className="text-gray-300">Pre-approved offers for eligible customers</p>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircleIcon className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" />
                <p className="text-gray-300">Compare offers from 50+ lenders</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Banks */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-12">Our Partner Banks & NBFCs</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center mb-8">
            {/* HDFC Bank */}
            <div className="bg-white rounded-lg p-4 h-16 flex items-center justify-center transition-transform hover:scale-105">
              <svg viewBox="0 0 200 60" className="h-8">
                <rect width="200" height="60" fill="#004c8f"/>
                <text x="100" y="35" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">HDFC BANK</text>
              </svg>
            </div>
            
            {/* ICICI Bank */}
            <div className="bg-white rounded-lg p-4 h-16 flex items-center justify-center transition-transform hover:scale-105">
              <svg viewBox="0 0 200 60" className="h-8">
                <rect width="200" height="60" fill="#f57c00"/>
                <text x="100" y="35" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">ICICI BANK</text>
              </svg>
            </div>
            
            {/* State Bank of India */}
            <div className="bg-white rounded-lg p-4 h-16 flex items-center justify-center transition-transform hover:scale-105">
              <svg viewBox="0 0 200 60" className="h-8">
                <rect width="200" height="60" fill="#1e3a8a"/>
                <circle cx="40" cy="30" r="15" fill="#fbbf24"/>
                <text x="120" y="35" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">SBI</text>
              </svg>
            </div>
            
            {/* Axis Bank */}
            <div className="bg-white rounded-lg p-4 h-16 flex items-center justify-center transition-transform hover:scale-105">
              <svg viewBox="0 0 200 60" className="h-8">
                <rect width="200" height="60" fill="#8b1538"/>
                <text x="100" y="35" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">AXIS BANK</text>
              </svg>
            </div>
            
            {/* Kotak Mahindra Bank */}
            <div className="bg-white rounded-lg p-4 h-16 flex items-center justify-center transition-transform hover:scale-105">
              <svg viewBox="0 0 200 60" className="h-8">
                <rect width="200" height="60" fill="#e31837"/>
                <text x="100" y="35" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">KOTAK</text>
              </svg>
            </div>
            
            {/* IDFC First Bank */}
            <div className="bg-white rounded-lg p-4 h-16 flex items-center justify-center transition-transform hover:scale-105">
              <svg viewBox="0 0 200 60" className="h-8">
                <rect width="200" height="60" fill="#004c8f"/>
                <text x="100" y="35" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">IDFC FIRST</text>
              </svg>
            </div>
            
            {/* Add more banks... */}
            <div className="bg-white rounded-lg p-4 h-16 flex items-center justify-center transition-transform hover:scale-105">
              <svg viewBox="0 0 200 60" className="h-8">
                <rect width="200" height="60" fill="#00a651"/>
                <text x="100" y="35" textAnchor="middle" fill="white" fontSize="15" fontWeight="bold">IndusInd</text>
              </svg>
            </div>
            
            <div className="bg-white rounded-lg p-4 h-16 flex items-center justify-center transition-transform hover:scale-105">
              <svg viewBox="0 0 200 60" className="h-8">
                <rect width="200" height="60" fill="#1e3a8a"/>
                <text x="100" y="35" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">Federal Bank</text>
              </svg>
            </div>
            
            <div className="bg-white rounded-lg p-4 h-16 flex items-center justify-center transition-transform hover:scale-105">
              <svg viewBox="0 0 200 60" className="h-8">
                <rect width="200" height="60" fill="#8b1538"/>
                <text x="100" y="35" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">RBL BANK</text>
              </svg>
            </div>
            
            <div className="bg-white rounded-lg p-4 h-16 flex items-center justify-center transition-transform hover:scale-105">
              <svg viewBox="0 0 200 60" className="h-8">
                <rect width="200" height="60" fill="#f57c00"/>
                <text x="100" y="35" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">TATA CAPITAL</text>
              </svg>
            </div>
            
            <div className="bg-white rounded-lg p-4 h-16 flex items-center justify-center transition-transform hover:scale-105">
              <svg viewBox="0 0 200 60" className="h-8">
                <rect width="200" height="60" fill="#1e3a8a"/>
                <text x="100" y="35" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">ADITYA BIRLA</text>
              </svg>
            </div>
            
            {/* View All Button */}
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 h-16 flex items-center justify-center transition-all hover:bg-gray-700 cursor-pointer">
              <span className="text-blue-400 font-medium text-sm">View All 50+ Partners</span>
            </div>
          </div>
        </div>
      </section>

      {/* Eligibility Section */}
      <section className="py-16 bg-gray-900 bg-opacity-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Personal Loan Eligibility
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Age Requirement</h3>
              <p className="text-2xl font-bold text-blue-400 mb-2">18 to 60 years</p>
              <p className="text-gray-400 text-sm">For both salaried and self-employed applicants</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Monthly Income</h3>
              <p className="text-2xl font-bold text-green-400 mb-2">Minimum ₹15,000</p>
              <p className="text-gray-400 text-sm">Net take-home salary or business income</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Credit Score</h3>
              <p className="text-2xl font-bold text-purple-400 mb-2">650+ preferred</p>
              <p className="text-gray-400 text-sm">Higher scores get better interest rates</p>
            </div>
          </div>
          <div className="mt-8 text-center">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 inline-block">
              <h3 className="text-lg font-semibold text-white mb-4">Required Documents</h3>
              <div className="text-gray-300 space-y-2">
                <p>• Aadhaar Card & PAN Card</p>
                <p>• Salary slips (last 3 months) / ITR</p>
                <p>• Bank statements</p>
                <p>• Employment proof</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <div key={index} className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-800 transition-colors"
                >
                  <span className="text-white font-medium">{faq.question}</span>
                  <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-300">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 from-opacity-20 to-purple-600 to-opacity-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Your Personal Loan?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join millions of Indians who trust Umoney for their financial needs
          </p>
          <button 
            onClick={handleCheckOffers}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-8 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500 shadow-opacity-25"
          >
            Apply Now
          </button>
        </div>
      </section>

      <style jsx>{`
        .slider {
          background: linear-gradient(to right, #374151 0%, #4b5563 50%, #374151 100%);
          outline: none;
          border-radius: 8px;
          transition: all 0.3s ease;
        }
        
        .slider:hover {
          background: linear-gradient(to right, #4b5563 0%, #6b7280 50%, #4b5563 100%);
        }
        
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 28px;
          width: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4), 0 0 0 4px rgba(59, 130, 246, 0.2);
          border: 2px solid rgba(255, 255, 255, 0.3);
          transition: all 0.3s ease;
        }
        
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6), 0 0 0 6px rgba(59, 130, 246, 0.3);
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
        }
        
        .slider::-moz-range-thumb {
          height: 28px;
          width: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          cursor: pointer;
          border: 2px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4), 0 0 0 4px rgba(59, 130, 246, 0.2);
          transition: all 0.3s ease;
        }
        
        .slider::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6), 0 0 0 6px rgba(59, 130, 246, 0.3);
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
        }
        
        .slider::-moz-range-track {
          background: linear-gradient(to right, #374151 0%, #4b5563 50%, #374151 100%);
          height: 12px;
          border-radius: 8px;
          border: none;
        }

        .font-inter {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        /* Enhanced button animations */
        .tenure-button {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .tenure-button:hover {
          transform: translateY(-2px);
        }
        
        .tenure-button.active {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
          }
        }
        
        /* EMI card animations */
        .emi-card {
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .emi-value {
          animation: countUp 0.8s ease-out;
        }
        
        @keyframes countUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}