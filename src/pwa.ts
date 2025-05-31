import { registerSW } from 'virtual:pwa-register'

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    const updateSW = registerSW({
      onNeedRefresh() {
        if (confirm('Eine neue Version ist verfügbar. Jetzt aktualisieren?')) {
          updateSW()
        }
      },
      onOfflineReady() {
        console.log('App ist bereit für den Offline-Modus')
      },
    })
  }
} 