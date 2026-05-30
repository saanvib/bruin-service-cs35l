import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from '@descope/react-sdk'
import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider projectId={import.meta.env.VITE_DESCOPE_PROJECT_ID}>
      <App />
    </AuthProvider>
  </StrictMode>
)
