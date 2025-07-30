/**
 * Utility functions for cleaning and validating text content
 * Fixes issues with corrupted URLs, base64 strings, and encoded content
 */

/**
 * Cleans corrupted discussion titles by removing encoded URLs, tokens, and invalid characters
 */
export const cleanDiscussionTitle = (title: string, categoryName?: string): string => {
  if (!title || typeof title !== 'string') {
    return 'Untitled Discussion';
  }
  
  // Debug log to see what we're cleaning
  console.log('🧹 Cleaning title:', title)
  
  // Clean corrupted patterns from URLs, OAuth tokens, and base64 strings
  let cleanedTitle = title
    // Remove specific corrupted patterns we've seen
    .replace(/^ocLYGZMcc9bDx[a-zA-Z0-9+/=_-]*/, '')
    .replace(/ocLYGZMcc9bDx[a-zA-Z0-9+/=_-]*/g, '')
    .replace(/DefMtEgac6S9Zq7_gEDiXVbix=s96-/g, '')
    .replace(/6S9Zq7_gEDiXVbix=s96-/g, '')
    .replace(/[a-zA-Z0-9+/=_-]*s96-[a-zA-Z0-9+/=_-]*/g, '')
    // Remove Google Avatar/Image URL patterns
    .replace(/=s\d+[-\w]*/g, '')
    .replace(/\/a\/[a-zA-Z0-9+/=_-]*/g, '')
    // Remove JWT tokens and OAuth tokens
    .replace(/eyJ[a-zA-Z0-9+/=_-]*\.[a-zA-Z0-9+/=_-]*\.[a-zA-Z0-9+/=_-]*/g, '')
    .replace(/ya29\.[a-zA-Z0-9+/=_-]*/g, '')
    // Remove base64-like strings (longer than 15 chars)
    .replace(/[A-Za-z0-9+/=_-]{15,}/g, '')
    // Remove URL-encoded characters
    .replace(/%[0-9A-Fa-f]{2}/g, '')
    // Remove Supabase and other service URLs
    .replace(/^(https?:\/\/)?[a-zA-Z0-9.-]*\.supabase\.co.*$/g, '')
    .replace(/^(https?:\/\/)?[a-zA-Z0-9.-]*\/(auth|storage|api)\/.*$/g, '')
    .replace(/^(https?:\/\/)?[a-zA-Z0-9.-]*\.googleusercontent\.com.*$/g, '')
    // Remove hash-like strings
    .replace(/[a-f0-9]{32,}/g, '')
    .replace(/[A-F0-9]{32,}/g, '')
    // Remove special characters except basic punctuation
    .replace(/[^a-zA-Z0-9\s\-_.,:!?'"()]/g, ' ')
    // Clean up multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
  
  // Try to extract meaningful words if the result is empty
  if (!cleanedTitle || cleanedTitle.length < 2) {
    const words = title.match(/\b[a-zA-Z]{2,}\b/g);
    if (words && words.length > 0) {
      cleanedTitle = words.slice(0, 5).join(' ');
    }
  }
  
  // Final fallback with category-specific defaults
  if (!cleanedTitle || cleanedTitle.length < 2 || cleanedTitle.toLowerCase() === 'test') {
    return categoryName ? `${categoryName} Discussion` : 'Discussion Thread';
  }
  
  // Truncate if too long
  if (cleanedTitle.length > 80) {
    cleanedTitle = cleanedTitle.substring(0, 77) + '...';
  }
  
  // Capitalize first letter
  return cleanedTitle.charAt(0).toUpperCase() + cleanedTitle.slice(1);
};

/**
 * Cleans discussion content by removing corrupted data
 */
export const cleanDiscussionContent = (content: string): string => {
  if (!content || typeof content !== 'string') {
    return 'Join this discussion to learn more.';
  }
  
  // Apply similar cleaning to content
  let cleanedContent = content
    .replace(/ocLYGZMcc9bDx[a-zA-Z0-9+/=_-]*/g, '')
    .replace(/DefMtEgac6S9Zq7_gEDiXVbix=s96-/g, '')
    .replace(/[A-Za-z0-9+/=_-]{20,}/g, '')
    .replace(/%[0-9A-Fa-f]{2}/g, '')
    .replace(/^(https?:\/\/)?[a-zA-Z0-9.-]*\.supabase\.co.*$/g, '')
    .replace(/[a-f0-9]{32,}/g, '')
    .replace(/[^a-zA-Z0-9\s\-_.,:!?'"()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (!cleanedContent || cleanedContent.length < 3) {
    return 'Join this discussion to learn more.';
  }
  
  if (cleanedContent.length > 200) {
    cleanedContent = cleanedContent.substring(0, 197) + '...';
  }
  
  return cleanedContent;
};

/**
 * Validates and cleans user input to prevent corrupted data from being saved
 */
export const validateUserInput = (input: string, maxLength: number = 500): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Remove potentially harmful or corrupted patterns before saving
  let cleanInput = input
    // Remove any existing corrupted patterns
    .replace(/ocLYGZMcc9bDx[a-zA-Z0-9+/=_-]*/g, '')
    .replace(/[A-Za-z0-9+/=_-]{20,}/g, '')
    // Remove URLs that might cause issues
    .replace(/https?:\/\/[^\s]+\.supabase\.co[^\s]*/g, '')
    .replace(/https?:\/\/[^\s]+\.googleusercontent\.com[^\s]*/g, '')
    // Clean up
    .replace(/\s+/g, ' ')
    .trim();
  
  // Truncate if too long
  if (cleanInput.length > maxLength) {
    cleanInput = cleanInput.substring(0, maxLength - 3) + '...';
  }
  
  return cleanInput;
};

/**
 * Safely extracts and displays author name
 */
export const cleanAuthorName = (authorName: string): string => {
  if (!authorName || typeof authorName !== 'string') {
    return 'Anonymous';
  }
  
  // Clean any corrupted author names
  let cleanName = authorName
    .replace(/ocLYGZMcc9bDx[a-zA-Z0-9+/=_-]*/g, '')
    .replace(/[A-Za-z0-9+/=_-]{15,}/g, '')
    .replace(/[^a-zA-Z0-9\s\-_.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (!cleanName || cleanName.length < 1) {
    return 'Anonymous';
  }
  
  if (cleanName.length > 50) {
    cleanName = cleanName.substring(0, 47) + '...';
  }
  
  return cleanName;
}; 