'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CheckCircleIcon,
  SparklesIcon,
  BanknotesIcon,
  CalendarIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  HomeIcon
} from '@heroicons/react/24/outline'
import dynamic from 'next/dynamic'

const Confetti = dynamic(() => import('react-confetti'), { ssr: false })

export default function ApprovalPage() {
  const [showConfetti, setShowConfetti] = useState(true)
  const [loanData, setLoanData] = useState(null)
  const [animationStep, setAnimationStep] = useState(0)
  const router = useRouter()

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/')
      return
    }

    // Load final loan terms
    const finalTerms = localStorage.getItem('finalLoanTerms')
    if (finalTerms) {
      setLoanData(JSON.parse(finalTerms))
    } else {
      router.push('/loan-requirements')
      return
    }

    // Animation sequence
    const animationTimer = setTimeout(() => {
      setAnimationStep(1)
      setTimeout(() => setAnimationStep(2), 1000)
      setTimeout(() => setAnimationStep(3), 2000)
      setTimeout(() => setShowConfetti(false), 8000)
    }, 500)

    return () => clearTimeout(animationTimer)
  }, [router])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleDownloadLetter = async () => {
    try {
      console.log('🎯 Starting approval letter download...')
      
      // Collect all application data
      const applicationData = {
        extractedData: JSON.parse(localStorage.getItem('extractedData') || '{}'),
        verificationData: JSON.parse(localStorage.getItem('verificationData') || '{}'),
        loanRequirements: JSON.parse(localStorage.getItem('loanRequirements') || '{}'),
        finalLoanTerms: JSON.parse(localStorage.getItem('finalLoanTerms') || '{}'),
        salaryData: JSON.parse(localStorage.getItem('salaryData') || '{}'),
        bankStatementData: JSON.parse(localStorage.getItem('bankStatementData') || '{}')
      }
      
      console.log('📋 Application data collected:', {
        hasExtracted: !!applicationData.extractedData,
        hasVerification: !!applicationData.verificationData,
        hasLoanReq: !!applicationData.loanRequirements,
        hasFinalTerms: !!applicationData.finalLoanTerms
      })
      
      // Call backend API to generate approval letter
      const response = await fetch('/api/approval/download-approval-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData)
      })
      
      if (!response.ok) {
        throw new Error(`Failed to generate approval letter: ${response.statusText}`)
      }
      
      // Get filename from response headers
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = 'Loan_Approval_Letter.pdf'
      if (contentDisposition) {
        const filenamePart = contentDisposition.split('filename=')[1]
        if (filenamePart) {
          filename = filenamePart.replace(/"/g, '')
        }
      }
      
      // Download the PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      console.log('✅ Approval letter downloaded successfully')
      
    } catch (error) {
      console.error('❌ Error downloading approval letter:', error)
      alert(`Failed to download approval letter: ${error.message}`)
    }
  }

  const handleShareSuccess = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Loan Approved! 🎉',
        text: `Great news! My loan of ${formatCurrency(loanData?.amount || 0)} has been approved!`,
        url: window.location.href
      })
    } else {
      // Fallback for browsers without Web Share API
      navigator.clipboard.writeText(`Great news! My loan of ${formatCurrency(loanData?.amount || 0)} has been approved! Check out this smart loan platform.`)
      alert('Link copied to clipboard!')
    }
  }

  const goToDashboard = () => {
    // In a real app, this would go to a user dashboard
    router.push('/')
  }

  if (!loanData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Confetti */}
      {showConfetti && typeof window !== 'undefined' && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
          colors={['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444']}
        />
      )}

      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated background gradients */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500 bg-opacity-20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 bg-opacity-20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500 bg-opacity-10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

        {/* Floating sparkles */}
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Progress Bar - Complete */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
            <span>Step 8 of 8</span>
            <span>Loan Approved! 🎉</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all duration-1000" style={{ width: '100%' }}></div>
          </div>
        </div>

        {/* Main Success Section */}
        <div className="text-center mb-12">
          {/* Success Icon */}
          <div className={`flex justify-center mb-6 transform transition-all duration-1000 ${animationStep >= 1 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-2xl animate-bounce">
                <CheckCircleIcon className="h-16 w-16 text-white" />
              </div>
              {/* Glow effect */}
              <div className="absolute inset-0 w-32 h-32 bg-gradient-to-br from-green-500 to-green-600 rounded-full blur-2xl opacity-50 animate-pulse"></div>
              {/* Rotating ring */}
              <div className="absolute inset-0 w-32 h-32 border-4 border-transparent border-t-green-300 rounded-full animate-spin"></div>
            </div>
          </div>

          {/* Success Message */}
          <div className={`space-y-4 transform transition-all duration-1000 delay-500 ${animationStep >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              🎉 Congratulations! 🎉
            </h1>
            <h2 className="text-2xl md:text-3xl font-semibold text-green-400 mb-2">
              Your Loan is Approved!
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Your loan application has been successfully approved. The funds will be disbursed to your account within 24 hours.
            </p>
          </div>
        </div>

        {/* Loan Details Card */}
        <div className={`bg-gradient-to-r from-green-600 from-opacity-20 to-blue-600 to-opacity-20 border border-green-500 border-opacity-30 rounded-2xl p-8 mb-8 transform transition-all duration-1000 delay-1000 ${animationStep >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-white mb-2">Your Approved Loan Details</h3>
            <div className="flex items-center justify-center space-x-2 text-green-400">
              <SparklesIcon className="h-5 w-5" />
              <span className="font-medium">{loanData.selectedOffer?.bankName}</span>
              <SparklesIcon className="h-5 w-5" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div className="bg-black/30 rounded-xl p-4">
              <BanknotesIcon className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-400">{formatCurrency(loanData?.amount || 0)}</div>
              <div className="text-gray-400 text-sm">Loan Amount</div>
            </div>
            
            <div className="bg-black/30 rounded-xl p-4">
              <CalendarIcon className="h-8 w-8 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-400">{formatCurrency(loanData.selectedOffer?.emi)}</div>
              <div className="text-gray-400 text-sm">Monthly EMI</div>
            </div>
            
            <div className="bg-black/30 rounded-xl p-4">
              <div className="text-2xl font-bold text-purple-400">{loanData.selectedOffer?.interestRate}%</div>
              <div className="text-gray-400 text-sm">Interest Rate</div>
            </div>
            
            <div className="bg-black/30 rounded-xl p-4">
              <div className="text-2xl font-bold text-yellow-400">{loanData?.tenure || 0}</div>
              <div className="text-gray-400 text-sm">Months</div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="border-t border-gray-700 mt-6 pt-6">
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Processing Fee:</span>
                <span className="text-white">{formatCurrency(loanData.selectedOffer?.processingFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Interest:</span>
                <span className="text-white">{formatCurrency((loanData.selectedOffer?.totalAmount || 0) - (loanData?.amount || 0))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">First EMI Date:</span>
                <span className="text-white">{new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Loan Reference:</span>
                <span className="text-white font-mono">LN{Date.now().toString().slice(-6)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-gray-900 bg-opacity-50 border border-gray-700 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">What happens next?</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">1</span>
              </div>
              <div>
                <h4 className="text-white font-medium">Document Verification</h4>
                <p className="text-gray-400 text-sm">Our team will verify your documents (already completed)</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">2</span>
              </div>
              <div>
                <h4 className="text-white font-medium">Final Approval</h4>
                <p className="text-gray-400 text-sm">Loan approved and agreement generated</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                <span className="text-white font-bold text-sm">3</span>
              </div>
              <div>
                <h4 className="text-white font-medium">Fund Disbursal</h4>
                <p className="text-gray-400 text-sm">Money will be transferred to your account within 24 hours</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={handleDownloadLetter}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02]"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            <span>Download Approval Letter</span>
          </button>
          
          <button
            onClick={handleShareSuccess}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02]"
          >
            <ShareIcon className="h-5 w-5" />
            <span>Share Good News</span>
          </button>
          
          <button
            onClick={goToDashboard}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02]"
          >
            <HomeIcon className="h-5 w-5" />
            <span>Go to Dashboard</span>
          </button>
        </div>

        {/* Support Section */}
        <div className="text-center">
          <div className="bg-gray-900 bg-opacity-30 border border-gray-700 border-opacity-50 rounded-lg p-6">
            <h3 className="text-white font-medium mb-2">Need Help?</h3>
            <p className="text-gray-400 text-sm mb-4">
              Our customer support team is available 24/7 to assist you
            </p>
            <div className="flex items-center justify-center space-x-6 text-sm">
              <span className="text-blue-400">📞 1800-XXX-XXXX</span>
              <span className="text-blue-400">📧 support@loanplatform.com</span>
              <span className="text-blue-400">💬 Live Chat</span>
            </div>
          </div>
        </div>

        {/* Celebration Animation */}
        <div className="fixed bottom-8 right-8">
          <div className="animate-bounce">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <SparklesIcon className="h-8 w-8 text-white animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes celebration {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(5deg) scale(1.1); }
          75% { transform: rotate(-5deg) scale(1.1); }
        }
        
        .animate-celebration {
          animation: celebration 0.6s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}