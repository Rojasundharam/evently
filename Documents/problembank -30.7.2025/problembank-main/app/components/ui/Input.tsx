'use client'

import React, { useState, useRef } from 'react'

interface InputProps {
  label?: string
  type?: string
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  error?: string
  required?: boolean
  disabled?: boolean
  variant?: 'default' | 'floating' | 'glass' | 'premium'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function Input({
  label,
  type = 'text',
  placeholder,
  value = '',
  onChange,
  icon,
  iconPosition = 'left',
  error,
  required = false,
  disabled = false,
  variant = 'default',
  size = 'md',
  className = ''
}: InputProps) {
  const [focused, setFocused] = useState(false)
  const [hasValue, setHasValue] = useState(value.length > 0)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(e.target.value.length > 0)
    if (onChange) {
      onChange(e)
    }
  }

  const handleFocus = () => setFocused(true)
  const handleBlur = () => setFocused(false)

  const baseClasses = "w-full transition-all duration-300 focus:outline-none"
  
  const variants = {
    default: `
      border-2 bg-white
      ${error ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}
      ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-400'}
    `,
    floating: `
      border-0 border-b-2 bg-transparent
      ${error ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}
      ${disabled ? 'cursor-not-allowed' : ''}
    `,
    glass: `
      border bg-white/10 backdrop-blur-lg
      ${error ? 'border-red-400/50 focus:border-red-500/70' : 'border-white/20 focus:border-white/40'}
      ${disabled ? 'cursor-not-allowed opacity-70' : 'hover:border-white/30'}
    `,
    premium: `
      border-2 bg-gradient-to-r from-gray-50 to-white
      ${error ? 'border-red-400 focus:border-red-500' : 'border-gray-400 focus:border-blue-600'}
      ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-500'}
      shadow-lg focus:shadow-xl
    `
  }
  
  const sizes = {
    sm: "px-3 py-2 text-sm rounded-lg",
    md: "px-4 py-3 text-base rounded-xl",
    lg: "px-6 py-4 text-lg rounded-xl"
  }
  
  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  }

  const inputClasses = `
    ${baseClasses}
    ${variants[variant]}
    ${variant !== 'floating' ? sizes[size] : 'px-0 py-3 text-base'}
    ${icon ? (iconPosition === 'left' ? 'pl-10' : 'pr-10') : ''}
    ${className}
  `.trim()

  const containerClasses = `
    relative
    ${variant === 'floating' ? 'mt-6' : ''}
  `

  const labelClasses = `
    absolute transition-all duration-300 pointer-events-none
    ${variant === 'floating' 
      ? `left-0 ${focused || hasValue 
          ? '-top-6 text-sm text-blue-600' 
          : 'top-3 text-base text-gray-500'
        }`
      : 'block text-sm font-medium text-gray-700 mb-2'
    }
    ${error ? 'text-red-500' : ''}
  `

  return (
    <div className={containerClasses}>
      {label && variant !== 'floating' && (
        <label className={labelClasses}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {/* Left Icon */}
        {icon && iconPosition === 'left' && (
          <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${iconSizes[size]} text-gray-400`}>
            {icon}
          </div>
        )}
        
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={variant === 'floating' ? '' : placeholder}
          disabled={disabled}
          required={required}
          className={inputClasses}
        />
        
        {/* Floating Label */}
        {label && variant === 'floating' && (
          <label className={labelClasses} onClick={() => inputRef.current?.focus()}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        {/* Right Icon */}
        {icon && iconPosition === 'right' && (
          <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${iconSizes[size]} text-gray-400`}>
            {icon}
          </div>
        )}
        
        {/* Focus Border Effect */}
        {variant === 'premium' && (
          <div className={`absolute inset-0 rounded-xl border-2 border-blue-600 opacity-0 transition-opacity duration-300 ${focused ? 'opacity-100' : ''}`}></div>
        )}
        
        {/* Glass Effect Overlay */}
        {variant === 'glass' && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none"></div>
        )}
      </div>
      
      {/* Error Message */}
      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
} 