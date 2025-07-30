'use client'

import React, { useState } from 'react'
import { Star, Users, ArrowRight } from 'lucide-react'
import { useStarsAndViews } from '@/lib/hooks/useStarsAndViews'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface StarAndViewIconsProps {
  problemId: string
  className?: string
  showLabels?: boolean
  size?: 'sm' | 'md' | 'lg'
  showViewButton?: boolean
}

export default function StarAndViewIcons({ 
  problemId, 
  className = '', 
  showLabels = false,
  size = 'md',
  showViewButton = false
}: StarAndViewIconsProps) {
  const { isStarred, viewCount, loading, toggleStar } = useStarsAndViews(problemId)
  const [viewingDetails, setViewingDetails] = useState(false)
  const router = useRouter()

  const iconSizes = {
    sm: 'w-3 h-3 md:w-4 md:h-4',
    md: 'w-4 h-4 md:w-5 md:h-5',
    lg: 'w-5 h-5 md:w-6 md:h-6'
  }

  const textSizes = {
    sm: 'text-xs',
    md: 'text-xs md:text-sm',
    lg: 'text-sm md:text-base'
  }

  const iconSize = iconSizes[size]
  const textSize = textSizes[size]

  // Handle view details button click
  const handleViewDetails = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (viewingDetails) return
    
    setViewingDetails(true)
    
    try {
      console.log('👁️ User clicked View Details for problem:', problemId)
      
      // Track the view by inserting a record (this will trigger the database to increment the count)
      const { error: insertError } = await supabase
        .from('problem_views')
        .insert([{
          problem_id: problemId,
          user_id: null, // Anonymous view for button clicks
          ip_address: null,
          user_agent: 'ViewDetails-Button-Click'
        }])

      if (insertError) {
        if (insertError.code === '23505') {
          console.log('👁️ View already counted for this user/problem combination')
        } else {
          console.warn('❌ Error tracking view details click:', insertError)
        }
      } else {
        console.log('✅ View Details click tracked successfully!')
      }

      // Navigate to the problem page
      router.push(`/problems/${problemId}`)
      
    } catch (error) {
      console.error('❌ Error handling view details:', error)
      // Still navigate even if view tracking fails
      router.push(`/problems/${problemId}`)
    } finally {
      setViewingDetails(false)
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <div className="flex items-center gap-1 text-gray-400">
          <Star className={`${iconSize} animate-pulse`} />
          {showLabels && <span className={`${textSize}`}>Loading...</span>}
        </div>
        <div className="flex items-center gap-1 text-gray-400">
          <Users className={`${iconSize} animate-pulse`} />
          {showLabels && <span className={`${textSize}`}>Loading...</span>}
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Star Button */}
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          toggleStar()
        }}
        className={`flex items-center gap-1 transition-all duration-200 hover:scale-110 ${
          isStarred 
            ? 'text-yellow-500 hover:text-yellow-600' 
            : 'text-gray-400 hover:text-yellow-500'
        }`}
        title={isStarred ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Star 
          className={`${iconSize} transition-all duration-200 ${
            isStarred ? 'fill-current' : ''
          }`}
        />
        {showLabels && (
          <span className={`${textSize} font-medium select-none`}>
            {isStarred ? 'Starred' : 'Star'}
          </span>
        )}
      </button>

      {/* View Count */}
      <div 
        className="flex items-center gap-1 text-gray-500"
        title={`${viewCount} unique views`}
      >
        <Users className={`${iconSize}`} />
        {showLabels && (
          <span className={`${textSize} select-none`}>
            {viewCount} {viewCount === 1 ? 'view' : 'views'}
          </span>
        )}
        {!showLabels && (
          <span className={`${textSize} select-none`}>
            {viewCount}
          </span>
        )}
      </div>

      {/* View Details Button - Show when requested */}
      {showViewButton && (
        <button
          onClick={handleViewDetails}
          disabled={viewingDetails}
          className={`flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${
            viewingDetails ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title="View problem details"
        >
          <ArrowRight className={`w-4 h-4 ${viewingDetails ? 'animate-pulse' : ''}`} />
          {viewingDetails ? 'Loading...' : 'View Details'}
        </button>
      )}
    </div>
  )
} 