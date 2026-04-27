import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// ─── Offline-Safe Root ──────────────────────────────────────────────────────
// 1. Tries to dynamically load ClerkProvider + AppClerkHooks (needs internet)
// 2. If Clerk takes > 4 seconds or fails → renders plain App in offline mode
// 3. Plain App does NOT call Clerk hooks, so it works without ClerkProvider
function Root() {
  const [OnlineApp, setOnlineApp]     = useState(null)
  const [ClerkProvider, setClerk]     = useState(null)
  const [ready, setReady]             = useState(false)
  const [failed, setFailed]           = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!ready) {
        console.warn('⚠️ Clerk timeout — switching to offline mode.')
        setFailed(true)
      }
    }, 4000)

    Promise.all([
      import('@clerk/clerk-react'),
      import('./AppClerkHooks.jsx'),
    ])
      .then(([clerkModule, hooksModule]) => {
        clearTimeout(timer)
        setClerk(() => clerkModule.ClerkProvider)
        setOnlineApp(() => hooksModule.default)
        setReady(true)
      })
      .catch((err) => {
        clearTimeout(timer)
        console.error('❌ Clerk failed to load:', err)
        setFailed(true)
      })

    return () => clearTimeout(timer)
  }, [])

  // ── Loading spinner (max 4s) ────────────────────────────────────────────
  if (!ready && !failed) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#F1F6F9',
        flexDirection: 'column', gap: '16px'
      }}>
        <div style={{
          width: 48, height: 48, border: '4px solid #D0E9EF',
          borderTopColor: '#629FAD', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ color: '#629FAD', fontWeight: 600, fontSize: '0.9rem', fontFamily: 'sans-serif' }}>
          Loading Control…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ── Offline mode: render App WITHOUT Clerk hooks ────────────────────────
  if (failed || !ClerkProvider || !OnlineApp || !PUBLISHABLE_KEY) {
    if (!PUBLISHABLE_KEY) {
      console.error('❌ Clerk Error: VITE_CLERK_PUBLISHABLE_KEY is missing! Check your Vercel Environment Variables.');
    } else {
      console.log('🔌 Offline mode — Clerk failed to load or timed out.');
    }
    return <App offlineMode={true} clerkIsLoaded={true} clerkIsSignedIn={false} clerkUser={null} signOut={async () => {}} />
  }

  // ── Online mode: ClerkProvider wraps AppClerkHooks which calls Clerk hooks
  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      appearance={{
        variables: {
          colorPrimary: '#D35400',
          applicationName: 'Control',
        },
        layout: {
          logoImageUrl: '/logo.png',
          logoLinkUrl: '/',
          socialButtonsVariant: 'iconButton',
          showOptionalFields: false, // Ensure no extra fields
        },
        // Force the paths to stay inside the app
        path: '/',
        signInUrl: '/',
        signUpUrl: '/',
        afterSignInUrl: '/',
        afterSignUpUrl: '/',
        elements: {
          // Logo sizing at the top of the card
          logoImage: {
            width: '160px',
            height: 'auto',
            objectFit: 'contain',
            marginBottom: '4px',
          },
          // Show the footer again so new users can register
          footerAction: { display: 'flex' },
          footer: { display: 'flex' },
        },
      }}
    >
      <OnlineApp />
    </ClerkProvider>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>
)

