'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  DocumentIcon, 
  CloudArrowUpIcon, 
  CheckCircleIcon,
  XMarkIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface ExtractedData {
  name?: string
  pan?: string
  dob?: string
  address?: string
  confidence?: number
}

interface DocumentState {
  file: File | null
  uploading: boolean
  processing: boolean
  processed: boolean
  extractedData: ExtractedData
  error?: string
}

export default function DocumentsPage() {
  const [panDoc, setPanDoc] = useState<DocumentState>({
    file: null,
    uploading: false,
    processing: false,
    processed: false,
    extractedData: {}
  })
  
  const [aadhaarDoc, setAadhaarDoc] = useState<DocumentState>({
    file: null,
    uploading: false,
    processing: false,
    processed: false,
    extractedData: {}
  })

  const [dragOver, setDragOver] = useState<'pan' | 'aadhaar' | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/')
      return
    }
  }, [router])

  // Simulate AI processing with Anthropic API
  const processDocument = async (file: File, type: 'pan' | 'aadhaar'): Promise<ExtractedData> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000))

    // Mock extracted data based on document type
    if (type === 'pan') {
      return {
        name: 'RAJESH KUMAR SHARMA',
        pan: 'ABCDE1234F',
        dob: '15/08/1985',
        confidence: 0.95
      }
    } else {
      return {
        name: 'Rajesh Kumar Sharma',
        address: 'House No. 123, Sector 45, Gurgaon, Haryana - 122001',
        dob: '15/08/1985',
        confidence: 0.92
      }
    }
  }

  const handleFileUpload = useCallback(async (file: File, type: 'pan' | 'aadhaar') => {
    const setState = type === 'pan' ? setPanDoc : setAadhaarDoc

    // Validate file
    if (!file.type.includes('image') && !file.type.includes('pdf')) {
      toast.error('Please upload an image or PDF file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    setState(prev => ({
      ...prev,
      file,
      uploading: true,
      error: undefined
    }))

    try {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      setState(prev => ({
        ...prev,
        uploading: false,
        processing: true
      }))

      toast.success(`${type.toUpperCase()} uploaded successfully! Processing with AI...`)

      // Process with AI
      const extractedData = await processDocument(file, type)

      setState(prev => ({
        ...prev,
        processing: false,
        processed: true,
        extractedData
      }))

      toast.success(`${type.toUpperCase()} verified ✓ Confidence: ${Math.round(extractedData.confidence! * 100)}%`)

    } catch (error) {
      setState(prev => ({
        ...prev,
        uploading: false,
        processing: false,
        error: 'Processing failed. Please try again.'
      }))
      toast.error('Document processing failed')
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, type: 'pan' | 'aadhaar') => {
    e.preventDefault()
    setDragOver(null)
    
    const files = Array.from(e.dataTransfer.files)
    if (files[0]) {
      handleFileUpload(files[0], type)
    }
  }, [handleFileUpload])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>, type: 'pan' | 'aadhaar') => {
    const files = Array.from(e.target.files || [])
    if (files[0]) {
      handleFileUpload(files[0], type)
    }
  }, [handleFileUpload])

  const canContinue = panDoc.processed && aadhaarDoc.processed

  const handleContinue = () => {
    if (!canContinue) return

    // Store extracted data
    localStorage.setItem('extractedData', JSON.stringify({
      pan: panDoc.extractedData,
      aadhaar: aadhaarDoc.extractedData
    }))

    toast.success('Documents verified! Moving to next step...')
    setTimeout(() => {
      router.push('/verification')
    }, 1000)
  }

  const DocumentUploadZone = ({ 
    type, 
    state, 
    title, 
    description 
  }: { 
    type: 'pan' | 'aadhaar'
    state: DocumentState
    title: string
    description: string
  }) => (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 transition-all duration-300 hover:border-gray-600">
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm mb-4">{description}</p>

      {/* Upload Zone */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
          dragOver === type
            ? 'border-blue-500 bg-blue-500/10 scale-105'
            : state.processed
            ? 'border-green-500 bg-green-500/10'
            : 'border-gray-600 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-800/70'
        }`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(type)
        }}
        onDragLeave={() => setDragOver(null)}
        onDrop={(e) => handleDrop(e, type)}
      >
        {/* File Input */}
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => handleFileSelect(e, type)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={state.uploading || state.processing}
        />

        {/* Upload States */}
        {state.uploading && (
          <div className="space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-blue-400">Uploading...</p>
          </div>
        )}

        {state.processing && (
          <div className="space-y-4">
            <div className="relative">
              <SparklesIcon className="w-12 h-12 text-purple-400 mx-auto animate-pulse" />
              <div className="absolute inset-0 w-12 h-12 mx-auto">
                <div className="w-12 h-12 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-purple-400 font-medium">Processing with AI...</p>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        )}

        {state.processed && (
          <div className="space-y-4">
            <CheckCircleIcon className="w-12 h-12 text-green-400 mx-auto animate-bounce" />
            <div className="space-y-2">
              <p className="text-green-400 font-medium">Document verified ✓</p>
              <p className="text-gray-300 text-sm">
                Confidence: {Math.round(state.extractedData.confidence! * 100)}%
              </p>
            </div>
          </div>
        )}

        {!state.file && !state.uploading && !state.processing && (
          <div className="space-y-4">
            <CloudArrowUpIcon className={`w-12 h-12 mx-auto transition-colors duration-300 ${
              dragOver === type ? 'text-blue-400' : 'text-gray-400'
            }`} />
            <div className="space-y-2">
              <p className="text-gray-300 font-medium">
                {dragOver === type ? 'Drop your file here' : 'Drag & drop or click to upload'}
              </p>
              <p className="text-gray-500 text-sm">PNG, JPG, PDF (max 10MB)</p>
            </div>
          </div>
        )}

        {state.error && (
          <div className="space-y-4">
            <XMarkIcon className="w-12 h-12 text-red-400 mx-auto" />
            <p className="text-red-400">{state.error}</p>
          </div>
        )}
      </div>

      {/* Extracted Data */}
      {state.processed && state.extractedData && (
        <div className="mt-6 bg-gray-800/50 rounded-lg p-4 space-y-3 animate-fade-in">
          <h4 className="text-white font-medium">Extracted Information:</h4>
          {Object.entries(state.extractedData).map(([key, value], index) => (
            key !== 'confidence' && value && (
              <div 
                key={key}
                className="flex justify-between items-center animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <span className="text-gray-400 capitalize">{key}:</span>
                <span className="text-white font-medium">{value}</span>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-black py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
            <span>Step 4 of 8</span>
            <span>Document Upload</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300" style={{ width: '50%' }}></div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">
            Upload Your Documents
          </h1>
          <p className="text-gray-300">
            We need to verify your identity with PAN Card and Aadhaar
          </p>
        </div>

        {/* Document Upload Areas */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <DocumentUploadZone
            type="pan"
            state={panDoc}
            title="PAN Card"
            description="Upload a clear photo of your PAN Card"
          />
          
          <DocumentUploadZone
            type="aadhaar"
            state={aadhaarDoc}
            title="Aadhaar Card"
            description="Upload a clear photo of your Aadhaar Card"
          />
        </div>

        {/* Instructions */}
        <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 mb-8">
          <h3 className="text-white font-semibold mb-4">📋 Upload Guidelines</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div className="space-y-2">
              <p>✅ Clear, well-lit photos</p>
              <p>✅ All four corners visible</p>
              <p>✅ No blur or shadows</p>
            </div>
            <div className="space-y-2">
              <p>✅ Text clearly readable</p>
              <p>✅ Original documents only</p>
              <p>✅ File size under 10MB</p>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className={`w-full py-4 px-6 rounded-xl font-medium transition-all duration-300 transform ${
            canContinue
              ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white hover:scale-[1.02] shadow-lg shadow-green-500/25'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          {canContinue ? 'Continue to Verification' : 'Upload both documents to continue'}
        </button>

        {/* Security Note */}
        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm">
            🔒 Your documents are processed securely with bank-grade encryption
          </p>
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
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  )
}