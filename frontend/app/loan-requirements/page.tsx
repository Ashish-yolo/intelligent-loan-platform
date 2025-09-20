'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CurrencyRupeeIcon, CalendarIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const TENURE_OPTIONS = [
  { value: 3, label: '3 months', popular: false },
  { value: 6, label: '6 months', popular: true },
  { value: 9, label: '9 months', popular: false },
  { value: 12, label: '12 months', popular: true },
  { value: 18, label: '18 months', popular: false },
  { value: 24, label: '24 months', popular: true },
]

const LOAN_PURPOSES = [
  { value: 'personal', label: 'Personal Use', emoji: '👤' },
  { value: 'medical', label: 'Medical Emergency', emoji: '🏥' },
  { value: 'education', label: 'Education', emoji: '📚' },
  { value: 'travel', label: 'Travel', emoji: '✈️' },
  { value: 'wedding', label: 'Wedding', emoji: '💒' },
  { value: 'home_improvement', label: 'Home Improvement', emoji: '🏠' },
  { value: 'debt_consolidation', label: 'Debt Consolidation', emoji: '💳' },
  { value: 'business', label: 'Business', emoji: '💼' },
]

export default function LoanRequirementsPage() {
  const [amount, setAmount] = useState(100000)
  const [tenure, setTenure] = useState(12)
  const [purpose, setPurpose] = useState('personal')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/')
      return
    }
  }, [router])

  const calculateEMI = (amount: number, tenure: number) => {
    const rate = 12 / 100 / 12 // Assuming 12% annual rate
    const emi = (amount * rate * Math.pow(1 + rate, tenure)) / (Math.pow(1 + rate, tenure) - 1)
    return Math.round(emi)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleContinue = () => {
    setLoading(true)
    
    // Store the selections
    localStorage.setItem('loanRequirements', JSON.stringify({
      amount,
      tenure,
      purpose,
      estimatedEMI: calculateEMI(amount, tenure)
    }))

    toast.success('Requirements saved!')
    
    setTimeout(() => {
      router.push('/motivation')
    }, 1000)
  }

  const emi = calculateEMI(amount, tenure)
  const totalAmount = emi * tenure
  const totalInterest = totalAmount - amount

  return (
    <div className="min-h-screen bg-black py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
            <span>Step 2 of 8</span>
            <span>Loan Requirements</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: '25%' }}></div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">
            Let's find your perfect loan
          </h1>
          <p className="text-gray-300">
            Tell us what you need and we'll calculate the best terms for you
          </p>
        </div>

        {/* Loan Amount */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-6">
          <label className="block text-lg font-medium text-white mb-4">
            How much do you need?
          </label>
          
          <div className="mb-6">
            <input
              type="range"
              min="50000"
              max="2000000"
              step="10000"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>₹50K</span>
              <span>₹20L</span>
            </div>
          </div>

          <div className="text-center">
            <div className="text-4xl font-bold text-blue-400 mb-2">
              {formatCurrency(amount)}
            </div>
            <div className="text-gray-400">Loan Amount</div>
          </div>
        </div>

        {/* Tenure Selection */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-6">
          <label className="block text-lg font-medium text-white mb-4">
            Choose your repayment period
          </label>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {TENURE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setTenure(option.value)}
                className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
                  tenure === option.value
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500'
                }`}
              >
                <div className="text-center">
                  <div className="font-semibold">{option.label}</div>
                  {option.popular && (
                    <div className="absolute -top-2 -right-2 bg-green-500 text-black text-xs px-2 py-1 rounded-full font-medium">
                      Popular
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Purpose Selection */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-6">
          <label className="block text-lg font-medium text-white mb-4">
            What's this loan for?
          </label>
          
          <div className="grid grid-cols-2 gap-3">
            {LOAN_PURPOSES.map((purposeOption) => (
              <button
                key={purposeOption.value}
                onClick={() => setPurpose(purposeOption.value)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                  purpose === purposeOption.value
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{purposeOption.emoji}</span>
                  <span className="font-medium">{purposeOption.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* EMI Calculation */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Your Loan Summary</h3>
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-400">{formatCurrency(emi)}</div>
              <div className="text-gray-400 text-sm">Monthly EMI</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">{formatCurrency(totalInterest)}</div>
              <div className="text-gray-400 text-sm">Total Interest</div>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-4 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Total Amount to Pay:</span>
              <span className="text-xl font-bold text-white">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-4 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center space-x-2"
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

        <div className="text-center mt-4">
          <p className="text-gray-400 text-sm">
            No impact on your credit score • Secure & encrypted
          </p>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #1e40af;
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.4);
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #1e40af;
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.4);
        }
      `}</style>
    </div>
  )
}