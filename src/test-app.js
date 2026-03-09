// Simple App Test - Run this in browser console to test the app

console.log('=== APP TEST ===');
console.log('Testing basic app functionality...');

// Test 1: Check if React is loading
if (typeof window !== 'undefined') {
  console.log('✅ Window object available');
  
  // Test 2: Check if app elements are rendering
  setTimeout(() => {
    const mainElement = document.querySelector('main');
    const headerElement = document.querySelector('header');
    const routerElement = document.querySelector('[data-router]');
    
    console.log('📱 DOM Elements:');
    console.log('- Main element:', mainElement);
    console.log('- Header element:', headerElement);
    console.log('- Router element:', routerElement);
    
    if (mainElement) {
      console.log('✅ Main element found, innerHTML length:', mainElement.innerHTML.length);
    } else {
      console.log('❌ No main element found');
    }
    
    if (headerElement) {
      console.log('✅ Header element found');
    } else {
      console.log('❌ No header element found');
    }
    
    // Test 3: Check for React errors
    const errorBoundary = document.querySelector('[data-react-error]');
    if (errorBoundary) {
      console.log('❌ React error boundary found:', errorBoundary.textContent);
    } else {
      console.log('✅ No React error boundary');
    }
    
    // Test 4: Check for loading states
    const loadingElements = document.querySelectorAll('[data-loading]');
    console.log('📊 Loading elements found:', loadingElements.length);
    
    // Test 5: Check if any console errors
    const consoleErrors = document.querySelectorAll('.error, .error-message');
    console.log('🚨 Error elements found:', consoleErrors.length);
    
  }, 2000);
  
} else {
  console.log('❌ Window object not available');
}

console.log('=== APP TEST ENDED ===');
console.log('📋 If you see no elements or errors, the issue is in:');
console.log('- React not mounting');
console.log('- Component imports missing');
console.log('- Routing not working');
console.log('- JavaScript errors preventing render');
