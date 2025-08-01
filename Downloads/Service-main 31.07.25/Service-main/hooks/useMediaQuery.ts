import { useState, useEffect } from 'react'

type MediaQueryBreakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

const breakpoints = {
  xs: '(max-width: 480px)',
  sm: '(max-width: 640px)',
  md: '(max-width: 768px)',
  lg: '(max-width: 1024px)',
  xl: '(max-width: 1280px)',
  xxl: '(max-width: 1536px)',
};

/**
 * A custom hook that returns whether a given media query matches the current viewport
 * 
 * @param query The media query string or predefined breakpoint
 * @returns A boolean indicating whether the media query matches
 * 
 * @example
 * // Using a predefined breakpoint
 * const isMobile = useMediaQuery('md')
 * 
 * // Using a custom query
 * const isWide = useMediaQuery('(min-width: 1400px)')
 */
export function useMediaQuery(query: MediaQueryBreakpoint | string): boolean {
  // Default to false on the server
  const [matches, setMatches] = useState<boolean>(false)
  
  useEffect(() => {
    // Handle both predefined breakpoints and custom queries
    const mediaQuery = window.matchMedia(
      breakpoints[query as MediaQueryBreakpoint] || query
    )
    
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

export default useMediaQuery 