'use client'

import React, { useState } from 'react'

interface MagicStatsCardProps {
  children: React.ReactNode
  className?: string
  gradient?: string
  icon?: React.ReactNode
  hoverColor?: string
}

const MagicStatsCard: React.FC<MagicStatsCardProps> = ({
  children,
  className = '',
  gradient = 'from-indigo-50 to-purple-50',
  icon,
  hoverColor = 'rgba(129, 140, 248, 0.1)'
}) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl border border-gray-200/50 
        bg-gradient-to-br ${gradient} backdrop-blur-sm
        transition-all duration-300 ease-out cursor-pointer
        hover:border-gray-300/60 hover:shadow-lg hover:scale-[1.02]
        ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        boxShadow: isHovered 
          ? '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(129, 140, 248, 0.05)' 
          : '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
      }}
    >
      {/* Subtle Glow Effect */}
      {isHovered && (
        <div
          className="absolute inset-0 rounded-xl opacity-30 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at center, ${hoverColor}, transparent 70%)`
          }}
        />
      )}

      {/* Border Highlight */}
      {isHovered && (
        <div className="absolute inset-0 rounded-xl border border-indigo-200/50 transition-opacity duration-300" />
      )}

      {/* Content */}
      <div className="relative z-10 p-3 md:p-4">
        {children}
      </div>

      {/* Optional Icon Glow */}
      {icon && isHovered && (
        <div className="absolute top-2 right-2 text-indigo-400/20 transition-opacity duration-300">
          {icon}
        </div>
      )}
    </div>
  )
}

export default MagicStatsCard 