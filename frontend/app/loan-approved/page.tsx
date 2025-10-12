'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircleIcon, ArrowRightIcon, CurrencyRupeeIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const TENURE_OPTIONS = [
  { value: 3, label: '3 months', popular: false },
  { value: 6, label: '6 months', popular: true },
  { value: 9, label: '9 months', popular: false },
  { value: 12, label: '12 months', popular: true },
  { value: 18, label: '18 months', popular: false },
  { value: 24, label: '24 months', popular: true },
]

export default function LoanApprovedPage() {
  const [approvedAmount, setApprovedAmount] = useState(500000) // Default approved amount
  const [selectedAmount, setSelectedAmount] = useState(300000) // Amount user selects
  const [tenure, setTenure] = useState(12)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated (relaxed for debugging)
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    const hasLoanData = localStorage.getItem('loanApprovalData')
    
    console.log('Loan approved page - Auth check:', {
      token: token ? 'Token found' : 'No token',
      user: user ? 'User found' : 'No user', 
      loanData: hasLoanData ? 'Loan data found' : 'No loan data'
    })
    
    // Only redirect if no authentication AND no loan approval data (more lenient)
    if (!token && !user && !hasLoanData) {
      console.log('No authentication data found, redirecting to home page')
      router.push('/')
      return
    }
    
    // Get approved loan amount from localStorage or API
    const storedApprovalData = localStorage.getItem('loanApprovalData')
    if (storedApprovalData) {
      const approvalData = JSON.parse(storedApprovalData)
      if (approvalData.approvedAmount) {
        setApprovedAmount(approvalData.approvedAmount)
        // Set selected amount to 60% of approved amount initially
        setSelectedAmount(Math.round(approvalData.approvedAmount * 0.6))
      }
    }
  }, [router])

  const calculateEMI = (amount: number, tenure: number) => {
    const annualRate = 12.5 // Fixed at 12.5%
    const monthlyRate = annualRate / 100 / 12
    const emi = (amount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1)
    return Math.round(emi)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleProceed = () => {
    setLoading(true)
    
    // Store the final loan terms for approval page
    localStorage.setItem('finalLoanTerms', JSON.stringify({
      amount: selectedAmount,
      tenure: tenure,
      selectedOffer: {
        bankName: 'UMoney Partner Bank',
        emi: calculateEMI(selectedAmount, tenure),
        interestRate: 12.5,
        processingFee: 0,
        totalAmount: calculateEMI(selectedAmount, tenure) * tenure
      },
      approvedAmount,
      timestamp: Date.now()
    }))

    toast.success('Loan details confirmed!')
    
    setTimeout(() => {
      router.push('/approval') // Go to congratulations page with social sharing
    }, 1500)
  }

  const emi = calculateEMI(selectedAmount, tenure)
  const totalAmount = emi * tenure
  const totalInterest = totalAmount - selectedAmount

  return (
    <div className="min-h-screen bg-black py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
            <span>Step 6 of 8</span>
            <span>Loan Approved</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300" style={{ width: '75%' }}></div>
          </div>
        </div>

        {/* Approval Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <CheckCircleIcon className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">
            Congratulations! Loan Approved
          </h1>
          <p className="text-gray-300">
            Based on your documents analysis, you're approved for up to{' '}
            <span className="text-green-400 font-semibold">{formatCurrency(approvedAmount)}</span>
          </p>
        </div>

        {/* Approved Amount Display */}
        <div className="bg-gradient-to-r from-green-900 to-green-800 border border-green-700 rounded-xl p-6 mb-6">
          <div className="text-center">
            <div className="text-sm text-green-300 mb-2">Maximum Approved Amount</div>
            <div className="text-4xl font-bold text-green-400 mb-2">
              {formatCurrency(approvedAmount)}
            </div>
            <div className="text-green-300 text-sm">Interest Rate: 12.5% per annum</div>
          </div>
        </div>

        {/* Loan Amount Selection */}
        <div className="bg-gray-900 bg-opacity-50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-6">
          <label className="block text-lg font-medium text-white mb-4">
            How much would you like to borrow?
          </label>
          
          <div className="mb-6">
            <input
              type="range"
              min="50000"
              max={approvedAmount}
              step="10000"
              value={selectedAmount}
              onChange={(e) => setSelectedAmount(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>₹50K</span>
              <span>{formatCurrency(approvedAmount)}</span>
            </div>
          </div>

          <div className="text-center">
            <div className="text-4xl font-bold text-blue-400 mb-2">
              {formatCurrency(selectedAmount)}
            </div>
            <div className="text-gray-400">Selected Loan Amount</div>
          </div>
        </div>

        {/* Tenure Selection */}
        <div className="bg-gray-900 bg-opacity-50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-6">
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
                    ? 'border-blue-500 bg-blue-500 bg-opacity-10 text-blue-400'
                    : 'border-gray-600 bg-gray-800 bg-opacity-50 text-gray-300 hover:border-gray-500'
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

        {/* Loan Summary */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Your Loan Summary</h3>
          
          <div className="grid grid-cols-2 gap-4 text-center mb-4">
            <div>
              <div className="text-2xl font-bold text-green-400">{formatCurrency(emi)}</div>
              <div className="text-gray-400 text-sm">Monthly EMI</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">{formatCurrency(totalInterest)}</div>
              <div className="text-gray-400 text-sm">Total Interest</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center mb-4">
            <div>
              <div className="text-lg font-bold text-yellow-400">12.5%</div>
              <div className="text-gray-400 text-sm">Interest Rate</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-400">{tenure} months</div>
              <div className="text-gray-400 text-sm">Tenure</div>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Total Amount to Pay:</span>
              <span className="text-xl font-bold text-white">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Proceed Button */}
        <button
          onClick={handleProceed}
          disabled={loading}
          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium py-4 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center space-x-2"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <span>Proceed with Loan</span>
              <ArrowRightIcon className="h-5 w-5" />
            </>
          )}
        </button>

        <div className="text-center mt-4">
          <p className="text-gray-400 text-sm">
            Final loan terms • Secure & encrypted • Fixed interest rate
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