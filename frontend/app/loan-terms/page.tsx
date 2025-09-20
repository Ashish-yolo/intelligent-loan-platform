'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CurrencyRupeeIcon,
  CalendarIcon,
  CheckCircleIcon,
  BanknotesIcon,
  CalculatorIcon,
  ArrowRightIcon,
  StarIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface LoanOffer {
  id: string
  bankName: string
  interestRate: number
  processingFee: number
  emi: number
  totalAmount: number
  features: string[]
  recommended?: boolean
  fastApproval?: boolean
}

export default function LoanTermsPage() {
  const [selectedOffer, setSelectedOffer] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [loanData, setLoanData] = useState<any>(null)
  const [offers, setOffers] = useState<LoanOffer[]>([])
  const router = useRouter()

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/')
      return
    }

    // Load loan requirements
    const requirements = localStorage.getItem('loanRequirements')
    if (requirements) {
      const data = JSON.parse(requirements)
      setLoanData(data)
      generateOffers(data)
    } else {
      router.push('/loan-requirements')
    }
  }, [router])

  const generateOffers = (data: any) => {
    const baseAmount = data.amount
    const tenure = data.tenure
    
    const generatedOffers: LoanOffer[] = [
      {
        id: 'offer1',
        bankName: 'HDFC Bank',
        interestRate: 10.5,
        processingFee: Math.round(baseAmount * 0.015),
        emi: calculateEMI(baseAmount, 10.5, tenure),
        totalAmount: calculateEMI(baseAmount, 10.5, tenure) * tenure,
        features: ['Instant approval', 'No hidden charges', 'Flexible tenure'],
        recommended: true,
        fastApproval: true
      },
      {
        id: 'offer2',
        bankName: 'ICICI Bank',
        interestRate: 11.25,
        processingFee: Math.round(baseAmount * 0.02),
        emi: calculateEMI(baseAmount, 11.25, tenure),
        totalAmount: calculateEMI(baseAmount, 11.25, tenure) * tenure,
        features: ['Digital process', '24/7 support', 'Quick disbursal'],
        fastApproval: true
      },
      {
        id: 'offer3',
        bankName: 'Axis Bank',
        interestRate: 12.0,
        processingFee: Math.round(baseAmount * 0.01),
        emi: calculateEMI(baseAmount, 12.0, tenure),
        totalAmount: calculateEMI(baseAmount, 12.0, tenure) * tenure,
        features: ['Low processing fee', 'Easy documentation', 'Branch support']
      }
    ]

    setOffers(generatedOffers)
    setSelectedOffer(generatedOffers[0].id) // Auto-select recommended offer
  }

  const calculateEMI = (principal: number, rate: number, tenure: number) => {
    const monthlyRate = rate / 100 / 12
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / 
                (Math.pow(1 + monthlyRate, tenure) - 1)
    return Math.round(emi)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleAcceptOffer = () => {
    if (!selectedOffer) {
      toast.error('Please select an offer')
      return
    }

    setLoading(true)
    
    const selectedOfferData = offers.find(offer => offer.id === selectedOffer)
    
    // Store final loan terms
    localStorage.setItem('finalLoanTerms', JSON.stringify({
      ...loanData,
      selectedOffer: selectedOfferData
    }))

    toast.success('Offer accepted! Finalizing your loan...')
    
    setTimeout(() => {
      router.push('/approval')
    }, 2000)
  }

  if (!loanData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
            <span>Step 7 of 8</span>
            <span>Choose Your Loan Terms</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300" style={{ width: '87.5%' }}></div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">
            Great! You're Pre-Approved 🎉
          </h1>
          <p className="text-gray-300">
            Choose the best loan offer personalized for your profile
          </p>
        </div>

        {/* Loan Summary */}
        <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 border border-green-500/30 rounded-xl p-6 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircleIcon className="h-6 w-6 text-green-400" />
            <h2 className="text-lg font-semibold text-white">Your Loan Request</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-400">{formatCurrency(loanData.amount)}</div>
              <div className="text-gray-400 text-sm">Loan Amount</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">{loanData.tenure} months</div>
              <div className="text-gray-400 text-sm">Tenure</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400 capitalize">{loanData.purpose.replace('_', ' ')}</div>
              <div className="text-gray-400 text-sm">Purpose</div>
            </div>
          </div>
        </div>

        {/* Loan Offers */}
        <div className="space-y-4 mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">Available Offers</h3>
          
          {offers.map((offer) => (
            <div
              key={offer.id}
              className={`relative bg-gray-900/50 backdrop-blur-sm border rounded-xl p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                selectedOffer === offer.id
                  ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/25'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
              onClick={() => setSelectedOffer(offer.id)}
            >
              {/* Badges */}
              <div className="absolute top-4 right-4 flex space-x-2">
                {offer.recommended && (
                  <span className="bg-green-500 text-black text-xs px-2 py-1 rounded-full font-medium flex items-center space-x-1">
                    <StarIcon className="h-3 w-3" />
                    <span>Recommended</span>
                  </span>
                )}
                {offer.fastApproval && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium flex items-center space-x-1">
                    <ClockIcon className="h-3 w-3" />
                    <span>Fast Approval</span>
                  </span>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Bank Info */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">{offer.bankName}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Interest Rate:</span>
                      <span className="text-white font-medium">{offer.interestRate}% p.a.</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Processing Fee:</span>
                      <span className="text-white font-medium">{formatCurrency(offer.processingFee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Monthly EMI:</span>
                      <span className="text-green-400 font-bold text-lg">{formatCurrency(offer.emi)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Amount:</span>
                      <span className="text-white font-medium">{formatCurrency(offer.totalAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <h5 className="text-white font-medium mb-3">Key Features:</h5>
                  <ul className="space-y-2">
                    {offer.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2 text-sm text-gray-300">
                        <CheckCircleIcon className="h-4 w-4 text-green-400 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Selection Indicator */}
              <div className="absolute top-4 left-4">
                <div className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                  selectedOffer === offer.id
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-600'
                }`}>
                  {selectedOffer === offer.id && (
                    <CheckCircleIcon className="h-3 w-3 text-white m-0.5" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* EMI Calculator */}
        <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <CalculatorIcon className="h-6 w-6 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">EMI Breakdown</h3>
          </div>
          
          {selectedOffer && (
            <div className="space-y-4">
              {(() => {
                const offer = offers.find(o => o.id === selectedOffer)!
                const principal = loanData.amount / loanData.tenure
                const interest = offer.emi - principal
                
                return (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Principal per month:</span>
                        <span className="text-white">{formatCurrency(principal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Interest per month:</span>
                        <span className="text-white">{formatCurrency(interest)}</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-700 pt-2">
                        <span className="text-gray-300 font-medium">Total EMI:</span>
                        <span className="text-green-400 font-bold text-lg">{formatCurrency(offer.emi)}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Interest:</span>
                        <span className="text-white">{formatCurrency(offer.totalAmount - loanData.amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Processing Fee:</span>
                        <span className="text-white">{formatCurrency(offer.processingFee)}</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-700 pt-2">
                        <span className="text-gray-300 font-medium">Total Payable:</span>
                        <span className="text-blue-400 font-bold text-lg">{formatCurrency(offer.totalAmount + offer.processingFee)}</span>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </div>

        {/* Accept Button */}
        <button
          onClick={handleAcceptOffer}
          disabled={loading || !selectedOffer}
          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-700 disabled:to-gray-700 text-white font-medium py-4 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center space-x-2"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <span>Accept Offer & Proceed</span>
              <ArrowRightIcon className="h-5 w-5" />
            </>
          )}
        </button>

        {/* Terms & Conditions */}
        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm">
            By proceeding, you agree to our <span className="text-blue-400 underline cursor-pointer">Terms & Conditions</span> and <span className="text-blue-400 underline cursor-pointer">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  )
}