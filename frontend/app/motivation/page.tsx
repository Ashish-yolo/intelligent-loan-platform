'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircleIcon, SparklesIcon } from '@heroicons/react/24/outline'

const MOTIVATION_MESSAGES = [
  {
    title: "Great choice! 🎉",
    subtitle: "You're taking control of your finances",
    duration: 1500
  },
  {
    title: "Smart financial decisions start here 💡",
    subtitle: "We're analyzing the best options for you",
    duration: 1500
  },
  {
    title: "Almost ready! ⚡",
    subtitle: "Preparing your personalized loan journey",
    duration: 1000
  }
]

export default function MotivationPage() {
  const [currentMessage, setCurrentMessage] = useState(0)
  const [progress, setProgress] = useState(0)
  const [dots, setDots] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/')
      return
    }

    // Animated dots effect
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)

    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + 2
      })
    }, 60)

    // Message cycling
    let messageTimeout: NodeJS.Timeout

    const cycleMessages = (index: number) => {
      if (index < MOTIVATION_MESSAGES.length) {
        setCurrentMessage(index)
        messageTimeout = setTimeout(() => {
          cycleMessages(index + 1)
        }, MOTIVATION_MESSAGES[index].duration)
      } else {
        // All messages shown, redirect to documents
        setTimeout(() => {
          router.push('/documents')
        }, 500)
      }
    }

    cycleMessages(0)

    return () => {
      clearInterval(dotsInterval)
      clearInterval(progressInterval)
      clearTimeout(messageTimeout)
    }
  }, [router])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-purple-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative max-w-md w-full space-y-8 text-center">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
            <span>Step 3 of 8</span>
            <span>Getting Ready</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${37.5}%` }}
            ></div>
          </div>
        </div>

        {/* Main Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center shadow-2xl">
              <SparklesIcon className="h-12 w-12 text-white animate-pulse" />
            </div>
            {/* Rotating ring */}
            <div className="absolute inset-0 w-24 h-24 border-4 border-transparent border-t-blue-400 rounded-full animate-spin"></div>
            {/* Outer glow */}
            <div className="absolute inset-0 w-24 h-24 bg-gradient-to-br from-blue-500 to-green-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-4 min-h-[120px] flex flex-col justify-center">
          <div className="transform transition-all duration-500 ease-in-out">
            <h2 className="text-2xl font-bold text-white mb-2 animate-fade-in">
              {MOTIVATION_MESSAGES[currentMessage]?.title}
            </h2>
            <p className="text-gray-300 animate-fade-in">
              {MOTIVATION_MESSAGES[currentMessage]?.subtitle}
            </p>
          </div>
        </div>

        {/* Loading Animation */}
        <div className="space-y-6">
          {/* Progress Ring */}
          <div className="flex justify-center">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="#374151"
                  strokeWidth="12"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 54}`}
                  strokeDashoffset={`${2 * Math.PI * 54 * (1 - progress / 100)}`}
                  className="transition-all duration-300 ease-out"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{Math.round(progress)}%</span>
              </div>
            </div>
          </div>

          {/* Loading Text */}
          <div className="text-gray-400">
            <p className="text-lg">
              Loading your experience{dots}
            </p>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="grid grid-cols-2 gap-4 mt-8">
          <div className="bg-gray-900 bg-opacity-50 border border-gray-700 rounded-lg p-4">
            <CheckCircleIcon className="h-6 w-6 text-green-400 mx-auto mb-2" />
            <p className="text-xs text-gray-300">Secure Process</p>
          </div>
          <div className="bg-gray-900 bg-opacity-50 border border-gray-700 rounded-lg p-4">
            <CheckCircleIcon className="h-6 w-6 text-blue-400 mx-auto mb-2" />
            <p className="text-xs text-gray-300">Quick Approval</p>
          </div>
        </div>

        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-60 animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            ></div>
          ))}
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
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}