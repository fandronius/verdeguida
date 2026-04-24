import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Registrazione PWA: il plugin vite-plugin-pwa fa già il register per noi con
// registerType: 'prompt'. Questo listener serve solo a riconoscere quando il
// nuovo service worker prende il controllo (evita loop di reload).
if ('serviceWorker' in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
