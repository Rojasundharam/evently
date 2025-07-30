'use client'

import React, { useEffect } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  variant?: 'default' | 'glass' | 'premium'
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  className?: string
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  variant = 'default',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = ''
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  }

  const variants = {
    default: 'bg-white border border-gray-200 shadow-2xl',
    glass: 'bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl',
    premium: 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700 shadow-2xl text-white'
  }

  const overlayClasses = `
    fixed inset-0 z-50 flex items-center justify-center p-4
    bg-black/50 backdrop-blur-sm
    animate-in fade-in duration-300
  `

  const modalClasses = `
    relative w-full ${sizes[size]} rounded-2xl overflow-hidden
    ${variants[variant]}
    animate-in zoom-in-95 duration-300
    ${className}
  `

  return (
    <div 
      className={overlayClasses}
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <div 
        className={modalClasses}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className={`
            flex items-center justify-between p-6 border-b
            ${variant === 'premium' ? 'border-gray-700' : 'border-gray-200'}
          `}>
            {title && (
              <h2 className={`
                text-xl font-bold
                ${variant === 'premium' ? 'text-white' : 'text-gray-900'}
              `}>
                {title}
              </h2>
            )}
            
            {showCloseButton && (
              <button
                onClick={onClose}
                className={`
                  p-2 rounded-xl transition-all duration-200
                  ${variant === 'premium' 
                    ? 'hover:bg-white/10 text-gray-300 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {children}
        </div>

        {/* Decorative elements for premium variant */}
        {variant === 'premium' && (
          <>
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
          </>
        )}

        {/* Glass effect overlay */}
        {variant === 'glass' && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none"></div>
        )}
      </div>
    </div>
  )
} 