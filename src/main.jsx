import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// PWA Service Worker Registration with immediate update
// With autoUpdate + skipWaiting + clientsClaim, service workers activate immediately
// No need for onNeedRefresh callback (dead code with autoUpdate)
if ('serviceWorker' in navigator) {
  registerSW({
    immediate: true, // Force immediate update check on page load
    
    onOfflineReady() {
      console.log('[PWA] App ready to work offline');
    },
    
    onRegistered(registration) {
      console.log('[PWA] Service Worker registered:', registration);
      
      // Listen for controller change (new service worker activated)
      // This fires when skipWaiting + clientsClaim activates a new service worker
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[PWA] Service worker controller changed, reloading page...');
        window.location.reload();
      });
      
      // Periodically check for updates every 60 seconds
      setInterval(() => {
        registration?.update();
      }, 60000);
    },
    
    onRegisterError(error) {
      console.error('[PWA] Service Worker registration error:', error);
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
