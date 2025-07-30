// Force refresh and clear cache
if (typeof window !== 'undefined') {
  // Clear localStorage
  localStorage.clear();
  
  // Force hard refresh
  window.location.reload(true);
} 