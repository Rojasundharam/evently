'use client'

import React from 'react'

interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'gradient' | 'glass' | 'premium' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  className?: string
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  onClick,
  type = 'button'
}: ButtonProps) {
  const baseClasses = "relative inline-flex items-center justify-center font-semibold transition-all duration-300 ease-out focus:outline-none focus:ring-4 focus:ring-opacity-50 overflow-hidden group"
  
  const variants = {
    primary: `
      bg-gradient-to-r from-blue-600 to-blue-700 text-white 
      hover:from-blue-700 hover:to-blue-800 
      focus:ring-blue-300 
      shadow-lg hover:shadow-xl 
      border border-blue-700 hover:border-blue-800
    `,
    secondary: `
      bg-gradient-to-r from-gray-600 to-gray-700 text-white 
      hover:from-gray-700 hover:to-gray-800 
      focus:ring-gray-300 
      shadow-lg hover:shadow-xl 
      border border-gray-700 hover:border-gray-800
    `,
    gradient: `
      bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white 
      hover:from-purple-700 hover:via-pink-700 hover:to-red-700 
      focus:ring-purple-300 
      shadow-xl hover:shadow-2xl 
      border border-purple-700 hover:border-purple-800
    `,
    glass: `
      bg-white/20 backdrop-blur-lg text-white border border-white/30 
      hover:bg-white/30 hover:border-white/40 
      focus:ring-white/50 
      shadow-xl hover:shadow-2xl
    `,
    premium: `
      bg-gradient-to-r from-slate-900 via-gray-900 to-slate-800 text-white 
      hover:from-slate-800 hover:via-gray-800 hover:to-slate-700 
      focus:ring-gray-500 
      shadow-2xl hover:shadow-3xl 
      border border-gray-700 hover:border-gray-600
    `,
    danger: `
      bg-gradient-to-r from-red-600 to-red-700 text-white 
      hover:from-red-700 hover:to-red-800 
      focus:ring-red-300 
      shadow-lg hover:shadow-xl 
      border border-red-700 hover:border-red-800
    `,
    success: `
      bg-gradient-to-r from-green-600 to-green-700 text-white 
      hover:from-green-700 hover:to-green-800 
      focus:ring-green-300 
      shadow-lg hover:shadow-xl 
      border border-green-700 hover:border-green-800
    `
  }
  
  const sizes = {
    sm: "px-4 py-2 text-sm rounded-lg",
    md: "px-6 py-3 text-base rounded-xl",
    lg: "px-8 py-4 text-lg rounded-xl",
    xl: "px-10 py-5 text-xl rounded-2xl"
  }
  
  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5", 
    lg: "w-6 h-6",
    xl: "w-7 h-7"
  }
  
  const disabledClasses = disabled || loading ? 
    "opacity-50 cursor-not-allowed transform-none hover:transform-none" : 
    "hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98]"
  
  const widthClasses = fullWidth ? "w-full" : ""
  
  const buttonClasses = `
    ${baseClasses}
    ${variants[variant]}
    ${sizes[size]}
    ${disabledClasses}
    ${widthClasses}
    ${className}
  `.trim()

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
      
      {/* Ripple effect background */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-active:opacity-100 transition-opacity duration-150"></div>
      
      <div className="relative flex items-center gap-2">
        {/* Loading spinner */}
        {loading && (
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
        )}
        
        {/* Left icon */}
        {icon && iconPosition === 'left' && !loading && (
          <span className={`${iconSizes[size]} flex-shrink-0`}>
            {icon}
          </span>
        )}
        
        {/* Button text */}
        <span className={loading ? 'opacity-70' : ''}>
          {children}
        </span>
        
        {/* Right icon */}
        {icon && iconPosition === 'right' && !loading && (
          <span className={`${iconSizes[size]} flex-shrink-0`}>
            {icon}
          </span>
        )}
      </div>
      
      {/* Glow effect for gradient variant */}
      {variant === 'gradient' && (
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300 -z-10"></div>
      )}
    </button>
  )
} 