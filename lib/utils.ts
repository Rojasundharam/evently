import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined || isNaN(price)) {
    return '₹0'
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(price)
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return 'N/A'
  
  try {
    const dateObj = new Date(date)
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn(`Invalid date value: ${date}`)
      return 'Invalid Date'
    }
    return format(dateObj, 'dd MMM yyyy')
  } catch (error) {
    console.error(`Error formatting date: ${date}`, error)
    return 'Invalid Date'
  }
}

export function formatTime(time: string | null | undefined): string {
  if (!time) return 'N/A'
  
  try {
    const [hours, minutes] = time.split(':')
    if (!hours || !minutes) return 'Invalid Time'
    
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  } catch (error) {
    console.error(`Error formatting time: ${time}`, error)
    return 'Invalid Time'
  }
}

export function formatDateTime(date: string | null | undefined, time: string | null | undefined): string {
  if (!date && !time) return 'N/A'
  if (!date) return formatTime(time)
  if (!time) return formatDate(date)
  return `${formatDate(date)} at ${formatTime(time)}`
}
