import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import UpdateBanner from './components/common/UpdateBanner'
import './styles/globals.css'
import 'katex/dist/katex.min.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <UpdateBanner />
  </React.StrictMode>
)
