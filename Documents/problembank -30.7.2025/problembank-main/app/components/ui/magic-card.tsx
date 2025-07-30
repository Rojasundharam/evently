'use client'

import React, { useEffect, useRef, useState } from 'react'

interface MagicCardProps {
  children: React.ReactNode
  className?: string
  gradientColor?: string
  gradientOpacity?: number
  spotlightColor?: string
}

const MagicCard: React.FC<MagicCardProps> = ({
  children,
  className = '',
  gradientColor = '#818cf8',
  gradientOpacity = 0.1,
  spotlightColor = 'rgba(129, 140, 248, 0.3)'
}) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return

      const rect = cardRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      setMousePosition({ x, y })
    }

    const cardElement = cardRef.current
    if (cardElement) {
      cardElement.addEventListener('mousemove', handleMouseMove)
      return () => cardElement.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <div
      ref={cardRef}
      className={`relative overflow-hidden rounded-2xl border border-gray-200/50 bg-white backdrop-blur-sm transition-all duration-300 hover:border-gray-300/80 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, ${spotlightColor}, transparent 50%)`,
        boxShadow: isHovered 
          ? `0 20px 40px -12px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(129, 140, 248, 0.1)` 
          : '0 10px 25px -5px rgba(0, 0, 0, 0.05)'
      }}
    >
      {/* Spotlight Effect */}
      {isHovered && (
        <div
          className="pointer-events-none absolute inset-0 opacity-20 transition-opacity duration-300"
          style={{
            background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, ${gradientColor}, transparent 40%)`
          }}
        />
      )}

      {/* Border Glow Effect */}
      {isHovered && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-60 transition-opacity duration-300"
          style={{
            background: `linear-gradient(90deg, transparent, ${spotlightColor}, transparent)`,
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'xor',
            padding: '1px'
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

export default MagicCard 