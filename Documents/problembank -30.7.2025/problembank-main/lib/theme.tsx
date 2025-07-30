'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

interface ThemeContextType {
  isDarkMode: boolean
  setIsDarkMode: (darkMode: boolean) => void
  toggleDarkMode: () => void
}

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      const savedDarkMode = localStorage.getItem('darkMode')
      if (savedDarkMode) {
        setIsDarkMode(JSON.parse(savedDarkMode))
      }
      setIsInitialized(true)
    }
  }, [])

  useEffect(() => {
    // Only save to localStorage after initialization
    if (isInitialized && typeof window !== 'undefined') {
      localStorage.setItem('darkMode', JSON.stringify(isDarkMode))
    }
  }, [isDarkMode, isInitialized])

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  )
} 