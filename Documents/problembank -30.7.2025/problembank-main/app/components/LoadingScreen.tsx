'use client'

import React from 'react'

interface LoadingScreenProps {
  title?: string
  message?: string
  spinnerColor?: string
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  title = "Problem Bank", 
  message = "Loading...",
  spinnerColor = "border-indigo-600"
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 relative mb-4 mx-auto">
          <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
          <div className={`absolute inset-0 border-4 ${spinnerColor} rounded-full border-t-transparent animate-spin`}></div>
        </div>
        <div className="space-y-2">
          <h2 className="text-heading-3 text-gray-800">{title}</h2>
          <p className="text-body text-gray-600">{message}</p>
        </div>
      </div>
    </div>
  )
}

export default LoadingScreen 