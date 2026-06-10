import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ── Clean up old/stale service workers, then register fresh PWA SW ────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    // 1. Unregister any old SWs that aren't our current sw.js
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const reg of registrations) {
      const swUrl = reg.active?.scriptURL || reg.installing?.scriptURL || '';
      // Keep firebase-messaging-sw.js (FCM) and sw.js (PWA), remove everything else
      if (!swUrl.includes('sw.js') && !swUrl.includes('firebase-messaging-sw.js')) {
        await reg.unregister();
        console.log('🗑️ Unregistered old SW:', swUrl);
      }
    }

    // 2. Register clean PWA service worker
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      console.log('✅ PWA Service Worker registered:', reg.scope);

      // 3. Listen for PWA install prompt – store it so we can trigger it manually
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        window.__pwaInstallPrompt = e;
        console.log('📲 PWA install prompt ready');
        // Dispatch custom event so React can show an install button
        window.dispatchEvent(new CustomEvent('pwa-installable'));
      });

      window.addEventListener('appinstalled', () => {
        window.__pwaInstallPrompt = null;
        console.log('✅ PWA installed successfully!');
      });
    } catch (err) {
      console.error('❌ PWA Service Worker registration failed:', err);
    }
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
