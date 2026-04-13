import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.jsx'

// Import your publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// Provide a default or fallback if not set to prevent crashing during development
if (!PUBLISHABLE_KEY) {
  console.warn("Clerk Publishable Key is missing in .env file.")
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY || "pk_test_missing"} appearance={{
      variables: { colorPrimary: '#D35400' }
    }}>
      <App />
    </ClerkProvider>
  </StrictMode>,
)
