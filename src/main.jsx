import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Service Worker Update Handler
// Reloads the page immediately when a new service worker takes control
if ('serviceWorker' in navigator) {
  let refreshing = false;
  
  // Listen for controller change (new service worker activated)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      console.log('[Service Worker] New controller detected, reloading page...');
      window.location.reload();
    }
  });
  
  // Check for waiting service worker and prompt to update
  navigator.serviceWorker.ready.then((registration) => {
    if (registration.waiting) {
      // There's a waiting service worker, send SKIP_WAITING message
      console.log('[Service Worker] Waiting service worker found, sending SKIP_WAITING...');
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    
    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker is installed and waiting
            console.log('[Service Worker] New version available, activating...');
            newWorker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      }
    });
  });
  
  // Periodically check for updates
  setInterval(() => {
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration) {
        registration.update();
      }
    });
  }, 60000); // Check every minute
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
