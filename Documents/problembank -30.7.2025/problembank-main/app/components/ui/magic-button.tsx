'use client'

import React, { useState } from 'react'

interface MagicButtonProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

const MagicButton: React.FC<MagicButtonProps> = ({
  children,
  onClick,
  disabled = false,
  className = '',
  variant = 'outline',
  size = 'md'
}) => {
  const [isHovered, setIsHovered] = useState(false)

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-transparent hover:from-indigo-600 hover:to-purple-700'
      case 'secondary':
        return 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 hover:border-gray-300'
      case 'outline':
      default:
        return 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md'
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'py-2 px-4 text-sm'
      case 'lg':
        return 'py-4 px-8 text-lg'
      case 'md':
      default:
        return 'py-3 px-6 text-base'
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative overflow-hidden rounded-xl border-2 font-semibold
        transition-all duration-300 ease-out
        focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        transform hover:scale-[1.02] active:scale-[0.98]
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        boxShadow: isHovered && !disabled
          ? '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(129, 140, 248, 0.1)'
          : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* Shimmer Effect */}
      {isHovered && !disabled && (
        <div className="absolute inset-0 -top-2 -bottom-2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-pulse" />
      )}
      
      {/* Content */}
      <div className="relative z-10 flex items-center justify-center gap-3">
        {children}
      </div>
    </button>
  )
}

export default MagicButton 