import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { PersonaProvider } from './hooks/usePersona.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <PersonaProvider>
        <App />
      </PersonaProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
