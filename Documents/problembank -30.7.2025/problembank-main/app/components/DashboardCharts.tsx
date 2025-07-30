'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import charts to prevent SSR issues
const AreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false })
const Area = dynamic(() => import('recharts').then(mod => mod.Area), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false })
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false })

interface ActivityData {
  day: string
  problems: number
  solutions: number
  aiSuggestions: number
}

interface DashboardChartsProps {
  activityData: ActivityData[]
  loading: boolean
  isDarkMode: boolean
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({ activityData, loading, isDarkMode }) => {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-gray-500">Loading charts...</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-gray-500">Loading data...</div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={activityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorProblems" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorSolutions" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
        <XAxis 
          dataKey="day" 
          stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
          fontSize={12}
        />
        <YAxis 
          stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
          fontSize={12}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
            border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
            borderRadius: '8px',
            color: isDarkMode ? '#f3f4f6' : '#1f2937'
          }}
        />
        <Area 
          type="monotone" 
          dataKey="problems" 
          stroke="#8884d8" 
          fillOpacity={1} 
          fill="url(#colorProblems)" 
        />
        <Area 
          type="monotone" 
          dataKey="solutions" 
          stroke="#82ca9d" 
          fillOpacity={1} 
          fill="url(#colorSolutions)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default DashboardCharts 