import { useState, useEffect } from 'react'

/**
 * A custom hook that returns whether a given media query matches the current viewport
 * @param query The media query to check, e.g. "(min-width: 768px)"
 * @returns A boolean indicating whether the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Default to false on the server
  const [matches, setMatches] = useState<boolean>(false)
  
  useEffect(() => {
    // Create a media query list
    const mediaQuery = window.matchMedia(query)
    
    // Set the initial value
    setMatches(mediaQuery.matches)
    
    // Create an event listener
    const handleResize = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }
    
    // Add the event listener
    mediaQuery.addEventListener('change', handleResize)
    
    // Clean up
    return () => {
      mediaQuery.removeEventListener('change', handleResize)
    }
  }, [query])
  
  return matches
} 