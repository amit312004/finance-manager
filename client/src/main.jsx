import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || ''
const apiBaseUrl = rawApiBaseUrl.replace(/\/+$/, '')

if (apiBaseUrl) {
  axios.defaults.baseURL = apiBaseUrl
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
