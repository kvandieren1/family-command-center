// Push Notifications Service
let registration = null

export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered')
      return registration
    } catch (error) {
      console.error('Service Worker registration failed:', error)
    }
  }
}

export async function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }
  return Notification.permission === 'granted'
}

export async function scheduleNotifications() {
  if (!registration || !('showNotification' in registration)) {
    return
  }

  // Schedule Sunday Sync notification
  scheduleSundaySyncNotification()
  
  // Schedule Daily Briefing notification
  scheduleDailyBriefing()
}

function scheduleSundaySyncNotification() {
  // Check if it's Sunday, if so schedule for next Sunday
  const now = new Date()
  const dayOfWeek = now.getDay()
  const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek
  
  const nextSunday = new Date(now)
  nextSunday.setDate(now.getDate() + daysUntilSunday)
  nextSunday.setHours(10, 0, 0, 0) // 10:00 AM

  const timeUntilNotification = nextSunday.getTime() - now.getTime()

  setTimeout(() => {
    if (registration) {
      registration.showNotification('Sunday Sync Time!', {
        body: 'Time for your weekly household sync',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: 'sunday-sync',
        requireInteraction: true
      })
    }
  }, timeUntilNotification)
}

function scheduleDailyBriefing() {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  tomorrow.setHours(10, 0, 0, 0) // 10:00 AM

  const timeUntilNotification = tomorrow.getTime() - now.getTime()

  setTimeout(() => {
    if (registration) {
      registration.showNotification('Daily Briefing', {
        body: 'Check your household command center',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: 'daily-briefing'
      })
      
      // Schedule for next day
      scheduleDailyBriefing()
    }
  }, timeUntilNotification)
}

export function showNotification(title, options = {}) {
  if (registration && 'showNotification' in registration) {
    registration.showNotification(title, {
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      ...options
    })
  } else if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/pwa-192x192.png',
      ...options
    })
  }
}
