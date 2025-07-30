'use client'

import React from 'react'

interface CardProps {
  children: React.ReactNode
  variant?: 'default' | 'elevated' | 'glass' | 'gradient' | 'premium'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  hover?: boolean
  className?: string
  onClick?: () => void
}

export default function Card({ 
  children, 
  variant = 'default', 
  size = 'md', 
  hover = true,
  className = '',
  onClick 
}: CardProps) {
  const baseClasses = "relative overflow-hidden transition-all duration-500 ease-out"
  
  const variants = {
    default: "bg-white border border-gray-200 shadow-md",
    elevated: "bg-gradient-to-br from-white via-blue-50 to-white shadow-xl border border-blue-100",
    glass: "bg-white/70 backdrop-blur-xl border border-white/20 shadow-2xl",
    gradient: "bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white shadow-2xl",
    premium: "bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white shadow-2xl border border-gray-700"
  }
  
  const sizes = {
    sm: "p-4 rounded-lg",
    md: "p-6 rounded-xl", 
    lg: "p-8 rounded-2xl",
    xl: "p-10 rounded-3xl"
  }
  
  const hoverEffects = hover ? {
    default: "hover:shadow-lg hover:-translate-y-1 hover:border-blue-200",
    elevated: "hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02]",
    glass: "hover:bg-white/80 hover:-translate-y-1 hover:shadow-3xl",
    gradient: "hover:shadow-3xl hover:-translate-y-2 hover:scale-[1.02]",
    premium: "hover:shadow-3xl hover:-translate-y-2 hover:scale-[1.02] hover:border-gray-600"
  } : {}
  
  const cardClasses = `
    ${baseClasses}
    ${variants[variant]}
    ${sizes[size]}
    ${hover ? hoverEffects[variant] : ''}
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `.trim()

  return (
    <div className={cardClasses} onClick={onClick}>
      {/* Decorative elements for premium variants */}
      {(variant === 'gradient' || variant === 'premium') && (
        <>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
        </>
      )}
      
      {/* Shine effect for elevated cards */}
      {variant === 'elevated' && hover && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
      )}
      
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
} 