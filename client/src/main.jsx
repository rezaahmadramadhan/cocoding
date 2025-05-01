import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.jsx'
import store from './store'

// Get Google Client ID from environment variable
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Validate the client ID is available
if (!googleClientId) {
  console.error('VITE_GOOGLE_CLIENT_ID environment variable is not set properly');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <GoogleOAuthProvider clientId={googleClientId}>
        <App />
      </GoogleOAuthProvider>
    </Provider>
  </StrictMode>,
)
