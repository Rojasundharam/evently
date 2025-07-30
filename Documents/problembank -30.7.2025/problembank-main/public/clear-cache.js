// Force clear browser cache and reload
(function() {
  console.log('Forcing cache clear and refresh...');
  
  // Clear localStorage
  if (typeof Storage !== 'undefined') {
    localStorage.clear();
    sessionStorage.clear();
    console.log('Local storage cleared');
  }
  
  // Clear any cached data
  if ('caches' in window) {
    caches.keys().then(function(names) {
      names.forEach(function(name) {
        caches.delete(name);
      });
      console.log('Cache storage cleared');
    });
  }
  
  // Force reload with cache bypass
  setTimeout(function() {
    console.log('Reloading page with cache bypass...');
    window.location.reload(true);
  }, 100);
})(); 