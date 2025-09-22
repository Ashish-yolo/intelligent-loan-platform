'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  DocumentCheckIcon,
  UserGroupIcon,
  CalculatorIcon,
  CheckCircleIcon,
  SparklesIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline'

const PROCESSING_STEPS = [
  {
    id: 1,
    title: 'Verifying documents',
    subtitle: 'Checking with government databases',
    icon: DocumentCheckIcon,
    duration: 3000,
    facts: [
      'We verify over 1 million documents daily',
      'Our AI can detect document authenticity in seconds',
      'Government database verification ensures 99.9% accuracy'
    ]
  },
  {
    id: 2,
    title: 'Verifying income',
    subtitle: 'Processing income documentation',
    icon: UserGroupIcon,
    duration: 3500,
    facts: [
      'Income verification ensures accurate loan assessment',
      'Our AI extracts income data with 95% accuracy',
      'Multiple verification methods for different credit profiles'
    ]
  },
  {
    id: 3,
    title: 'Fetching credit report',
    subtitle: 'Connecting to credit bureaus securely',
    icon: UserGroupIcon,
    duration: 4000,
    facts: [
      'Credit bureaus store data for over 600 million Indians',
      'Your credit score is calculated using 5 key factors',
      'We fetch data from all major bureaus for accuracy'
    ]
  },
  {
    id: 4,
    title: 'Analyzing credit profile',
    subtitle: 'AI-powered risk assessment in progress',
    icon: CalculatorIcon,
    duration: 5000,
    facts: [
      'Our AI analyzes 200+ data points in real-time',
      'Machine learning models trained on 50M+ loan applications',
      'Smart algorithms provide instant risk assessment'
    ]
  },
  {
    id: 5,
    title: 'Calculating best offer',
    subtitle: 'Optimizing terms for your profile',
    icon: SparklesIcon,
    duration: 4000,
    facts: [
      'We compare 1000+ loan products to find your best match',
      'Interest rates are personalized based on your credit profile',
      'Our optimization saves customers ₹50,000 on average'
    ]
  },
  {
    id: 6,
    title: 'Finalizing your loan',
    subtitle: 'Preparing your personalized offer',
    icon: CheckCircleIcon,
    duration: 2000,
    facts: [
      'Final approval takes less than 30 seconds',
      'All terms are locked in and guaranteed',
      'Ready for instant disbursal upon acceptance'
    ]
  }
]

const getSmartLoanFacts = (incomeData: any, bureauScore: number) => {
  const baseFacts = [
    '💡 Did you know? Personal loans don\'t require collateral',
    '⚡ Fact: Digital loans are 80% faster than traditional ones',
    '🎯 Smart tip: Lower EMIs mean you pay less total interest',
    '📊 India\'s digital lending market grows 40% annually',
    '🔐 All loan data is encrypted with bank-grade security',
    '💰 Pre-approved loans have 95% instant approval rates',
    '🌟 Credit scores above 750 get the best interest rates',
    '📱 Mobile-first lending is the future of finance'
  ]

  const smartFacts = []

  // Add income-specific facts
  if (incomeData) {
    if (incomeData.source === 'input') {
      smartFacts.push('🎉 High credit score = simplified income verification!')
    } else {
      smartFacts.push('📄 Document-based verification ensures accurate assessment')
    }
    
    if (incomeData.monthly_income > 100000) {
      smartFacts.push('💪 Higher income typically means better loan terms')
    }
  }

  // Add bureau score specific facts
  if (bureauScore >= 780) {
    smartFacts.push('⭐ Excellent credit score qualifies for premium rates')
  } else if (bureauScore >= 720) {
    smartFacts.push('✅ Good credit score opens up great loan options')
  }

  return [...smartFacts, ...baseFacts]
}

export default function ProcessingPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [currentFact, setCurrentFact] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(20)
  const [typewriterText, setTypewriterText] = useState('')
  const [showFinalAnimation, setShowFinalAnimation] = useState(false)
  const [incomeData, setIncomeData] = useState<any>(null)
  const [bureauScore, setBureauScore] = useState<number>(0)
  const router = useRouter()

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/')
      return
    }

    // Load income data and bureau score
    const income = localStorage.getItem('incomeVerificationData')
    if (income) {
      try {
        setIncomeData(JSON.parse(income))
      } catch (error) {
        console.error('Error loading income data:', error)
      }
    }

    const score = localStorage.getItem('bureauScore')
    if (score) {
      setBureauScore(parseInt(score))
    }
  }, [router])

  // Typewriter effect for current step
  useEffect(() => {
    if (currentStep < PROCESSING_STEPS.length) {
      const currentText = PROCESSING_STEPS[currentStep].subtitle
      let index = 0
      setTypewriterText('')
      
      const typeInterval = setInterval(() => {
        if (index <= currentText.length) {
          setTypewriterText(currentText.slice(0, index))
          index++
        } else {
          clearInterval(typeInterval)
        }
      }, 50)

      return () => clearInterval(typeInterval)
    }
  }, [currentStep])

  // Main processing logic
  useEffect(() => {
    if (!incomeData && !bureauScore) return // Wait for data to load
    
    let stepTimeout: NodeJS.Timeout
    let progressInterval: NodeJS.Timeout
    let factInterval: NodeJS.Timeout
    let countdownInterval: NodeJS.Timeout
    let isProcessing = true

    const processSteps = async () => {
      try {
        // Countdown timer
        countdownInterval = setInterval(() => {
          setTimeRemaining(prev => Math.max(0, prev - 1))
        }, 1000)

        // Fact rotation
        const smartFacts = getSmartLoanFacts(incomeData, bureauScore)
        factInterval = setInterval(() => {
          if (isProcessing) {
            setCurrentFact(prev => (prev + 1) % smartFacts.length)
          }
        }, 2500)

        // Process each step
        for (let i = 0; i < PROCESSING_STEPS.length && isProcessing; i++) {
          setCurrentStep(i)
          
          const step = PROCESSING_STEPS[i]
          const stepDuration = step.duration
          const progressIncrement = 100 / PROCESSING_STEPS.length
          
          // Animate progress for this step
          let currentProgress = i * progressIncrement
          const targetProgress = (i + 1) * progressIncrement
          
          const progressStep = 0.8
          const intervalTime = stepDuration / ((targetProgress - currentProgress) / progressStep)
          
          progressInterval = setInterval(() => {
            if (!isProcessing) {
              clearInterval(progressInterval)
              return
            }
            
            currentProgress += progressStep
            if (currentProgress >= targetProgress) {
              currentProgress = targetProgress
              clearInterval(progressInterval)
            }
            setProgress(Math.min(currentProgress, 100))
          }, intervalTime)

          await new Promise(resolve => {
            stepTimeout = setTimeout(() => {
              if (progressInterval) clearInterval(progressInterval)
              resolve(void 0)
            }, stepDuration)
          })
        }

        // Ensure we reach 100%
        if (isProcessing) {
          setProgress(100)
          
          // Final animation
          setTimeout(() => {
            if (isProcessing) {
              setShowFinalAnimation(true)
              setTimeout(() => {
                if (isProcessing) {
                  router.push('/loan-terms')
                }
              }, 2000)
            }
          }, 500)
        }
      } catch (error) {
        console.error('Processing error:', error)
        // Handle error gracefully
        setTimeout(() => {
          if (isProcessing) {
            router.push('/loan-terms')
          }
        }, 1000)
      }
    }

    processSteps()

    return () => {
      isProcessing = false
      if (stepTimeout) clearTimeout(stepTimeout)
      if (progressInterval) clearInterval(progressInterval)
      if (factInterval) clearInterval(factInterval)
      if (countdownInterval) clearInterval(countdownInterval)
    }
  }, [router, incomeData, bureauScore])

  if (showFinalAnimation) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-6 animate-pulse">
          <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
            <CheckCircleIcon className="h-12 w-12 text-white" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-white">Processing Complete! 🎉</h2>
            <p className="text-green-400">Redirecting to your loan terms...</p>
          </div>
        </div>
      </div>
    )
  }

  const currentStepData = PROCESSING_STEPS[currentStep]
  const StepIcon = currentStepData?.icon || SparklesIcon

  return (
    <div className="min-h-screen bg-black py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Animations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating particles */}
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue-400/60 rounded-full animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
        
        {/* Background glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
            <span>Step 6 of 8</span>
            <span>Processing Application</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300" style={{ width: '75%' }}></div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-4">
            Processing Your Application
          </h1>
          <p className="text-gray-300">
            Our AI is analyzing your profile to get you the best loan terms
          </p>
        </div>

        {/* Main Processing Card */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 mb-8 text-center relative">
          {/* Progress Ring */}
          <div className="relative w-32 h-32 mx-auto mb-8">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="#374151"
                strokeWidth="8"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - progress / 100)}`}
                className="transition-all duration-500 ease-out"
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="50%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Center Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                <StepIcon className="h-8 w-8 text-white animate-pulse" />
              </div>
            </div>
            
            {/* Progress percentage */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/80 backdrop-blur-sm rounded-lg px-2 py-1 mt-20">
                <span className="text-white font-bold text-sm">{Math.round(progress)}%</span>
              </div>
            </div>
          </div>

          {/* Current Step */}
          <div className="space-y-4 mb-8">
            <h2 className="text-2xl font-bold text-white">
              {currentStepData?.title}
            </h2>
            <p className="text-blue-400 text-lg min-h-[1.5rem]">
              {typewriterText}
              <span className="animate-pulse">|</span>
            </p>
            
            {/* Time remaining */}
            <div className="flex items-center justify-center space-x-2 text-gray-400">
              <span>⏱️</span>
              <span>Estimated time: {timeRemaining}s</span>
            </div>
          </div>

          {/* Step Indicators */}
          <div className="flex justify-center space-x-3 mb-6">
            {PROCESSING_STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index < currentStep
                    ? 'bg-green-500 scale-110'
                    : index === currentStep
                    ? 'bg-blue-500 animate-pulse scale-125'
                    : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Interesting Facts */}
        <div className="bg-gray-900/30 border border-gray-700/50 rounded-xl p-6 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <LightBulbIcon className="h-6 w-6 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">Did you know?</h3>
          </div>
          <p className="text-gray-300 text-lg animate-fade-in">
            {getSmartLoanFacts(incomeData, bureauScore)[currentFact]}
          </p>
        </div>

        {/* Security Indicators */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900/30 border border-gray-700/50 rounded-lg p-4 text-center">
            <div className="w-8 h-8 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
            </div>
            <p className="text-gray-300 text-sm">256-bit Encryption</p>
          </div>
          <div className="bg-gray-900/30 border border-gray-700/50 rounded-lg p-4 text-center">
            <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircleIcon className="h-5 w-5 text-blue-400" />
            </div>
            <p className="text-gray-300 text-sm">RBI Compliant</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
      `}</style>
    </div>
  )
}