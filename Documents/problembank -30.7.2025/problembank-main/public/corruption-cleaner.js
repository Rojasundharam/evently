// Simplified corruption cleaner - runs on client side
(function() {
  'use strict';
  
  console.log('🧹 Simple corruption cleaner initialized');
  
  function cleanBasicCorruption() {
    let cleaned = 0;
    
    // Only remove elements with explicit corruption markers
    const corruptedElements = document.querySelectorAll(
      '[data-corrupted="true"], .hide-corrupted, *[class*="ocLYGZMcc9bDx"]'
    );
    
    corruptedElements.forEach(el => {
      console.log('🗑️ Removing corrupted element:', el);
      el.remove();
      cleaned++;
    });
    
    if (cleaned > 0) {
      console.log(`✅ Cleaned ${cleaned} corrupted elements`);
    }
    
    return cleaned;
  }
  
  // Initial cleanup
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cleanBasicCorruption);
  } else {
    cleanBasicCorruption();
  }
  
  // Single periodic cleanup after 2 seconds
  setTimeout(cleanBasicCorruption, 2000);
  
  console.log('🛡️ Simple corruption cleaner active');
})(); 