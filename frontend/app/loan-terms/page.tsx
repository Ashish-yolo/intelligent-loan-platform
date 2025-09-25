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
  const [customInterestRate, setCustomInterestRate] = useState<number>(10.5)
  const [customTenure, setCustomTenure] = useState<number>(12)
  const [isCalculatorMode, setIsCalculatorMode] = useState(false)
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
      setCustomTenure(data.tenure || 12)
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
        <div className="bg-gradient-to-r from-green-600 from-opacity-20 to-blue-600 to-opacity-20 border border-green-500 border-opacity-30 rounded-xl p-6 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircleIcon className="h-6 w-6 text-green-400" />
            <h2 className="text-lg font-semibold text-white">Your Loan Request</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-400">{formatCurrency(loanData?.amount || 0)}</div>
              <div className="text-gray-400 text-sm">Loan Amount</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">{loanData?.tenure || 0} months</div>
              <div className="text-gray-400 text-sm">Tenure</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400 capitalize">{loanData?.purpose ? loanData.purpose.replace('_', ' ') : 'Personal Loan'}</div>
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
              className={`relative bg-gray-900 bg-opacity-50 backdrop-blur-sm border rounded-xl p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                selectedOffer === offer.id
                  ? 'border-blue-500 bg-blue-500 bg-opacity-10 shadow-lg shadow-blue-500 shadow-opacity-25'
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

        {/* Interactive EMI Calculator */}
        <div className="bg-gray-900 bg-opacity-50 border border-gray-700 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <CalculatorIcon className="h-6 w-6 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">EMI Calculator</h3>
            </div>
            <button
              onClick={() => setIsCalculatorMode(!isCalculatorMode)}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors duration-200"
            >
              {isCalculatorMode ? 'View Breakdown' : 'Customize EMI'}
            </button>
          </div>
          
          {isCalculatorMode ? (
            <div className="space-y-6">
              {/* Calculator Controls */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Interest Rate (% p.a.)
                  </label>
                  <div className="relative">
                    <input
                      type="range"
                      min="8"
                      max="18"
                      step="0.25"
                      value={customInterestRate}
                      onChange={(e) => setCustomInterestRate(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>8%</span>
                      <span className="text-white font-medium">{customInterestRate}%</span>
                      <span>18%</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tenure (months)
                  </label>
                  <div className="relative">
                    <input
                      type="range"
                      min="6"
                      max="84"
                      step="6"
                      value={customTenure}
                      onChange={(e) => setCustomTenure(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>6m</span>
                      <span className="text-white font-medium">{customTenure}m ({Math.round(customTenure/12*10)/10}y)</span>
                      <span>84m</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Custom EMI Calculation */}
              <div className="bg-gray-800 bg-opacity-50 rounded-lg p-4 emi-highlight">
                <div className="grid md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-400">
                      {formatCurrency(calculateEMI(loanData?.amount || 0, customInterestRate, customTenure))}
                    </div>
                    <div className="text-gray-400 text-sm">Monthly EMI</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-400">
                      {formatCurrency(calculateEMI(loanData?.amount || 0, customInterestRate, customTenure) * customTenure)}
                    </div>
                    <div className="text-gray-400 text-sm">Total Amount</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-400">
                      {formatCurrency((calculateEMI(loanData?.amount || 0, customInterestRate, customTenure) * customTenure) - (loanData?.amount || 0))}
                    </div>
                    <div className="text-gray-400 text-sm">Total Interest</div>
                  </div>
                </div>
                
                {/* Comparison with original terms */}
                {(customInterestRate !== 10.5 || customTenure !== (loanData?.tenure || 12)) && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="text-xs text-gray-400 mb-2">Comparison with original offer:</div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">EMI Change:</span>
                      <span className={`font-medium ${
                        calculateEMI(loanData?.amount || 0, customInterestRate, customTenure) < 
                        calculateEMI(loanData?.amount || 0, 10.5, loanData?.tenure || 12)
                          ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {calculateEMI(loanData?.amount || 0, customInterestRate, customTenure) < 
                         calculateEMI(loanData?.amount || 0, 10.5, loanData?.tenure || 12) ? '↓' : '↑'} 
                        {formatCurrency(Math.abs(
                          calculateEMI(loanData?.amount || 0, customInterestRate, customTenure) - 
                          calculateEMI(loanData?.amount || 0, 10.5, loanData?.tenure || 12)
                        ))}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Tenure Options */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Quick Tenure Selection:</label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {[12, 18, 24, 36, 48, 60].map((months) => (
                    <button
                      key={months}
                      onClick={() => setCustomTenure(months)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        customTenure === months
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {months}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Apply Custom Terms Button */}
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => {
                    // Create custom offer based on current calculations
                    const customEMI = calculateEMI(loanData?.amount || 0, customInterestRate, customTenure)
                    const customOffer: LoanOffer = {
                      id: 'custom',
                      bankName: 'Custom Terms',
                      interestRate: customInterestRate,
                      processingFee: Math.round((loanData?.amount || 0) * 0.015),
                      emi: customEMI,
                      totalAmount: customEMI * customTenure,
                      features: ['Custom interest rate', 'Flexible tenure', 'Personalized terms'],
                      recommended: false,
                      fastApproval: false
                    }
                    
                    // Update offers with custom terms
                    setOffers(prev => [customOffer, ...prev.filter(o => o.id !== 'custom')])
                    setSelectedOffer('custom')
                    setIsCalculatorMode(false)
                    toast.success('Custom terms applied! Review your personalized offer below.')
                  }}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  Apply Custom Terms
                </button>
              </div>
            </div>
          ) : (
            selectedOffer && (
              <div className="space-y-4">
                {(() => {
                  const offer = offers.find(o => o.id === selectedOffer)!
                  const principal = (loanData?.amount || 0) / (loanData?.tenure || 1)
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
                          <span className="text-white">{formatCurrency(offer.totalAmount - (loanData?.amount || 0))}</span>
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
            )
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