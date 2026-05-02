import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// ============================================================
// Service Worker + API globale per "Cerca aggiornamenti"
// ============================================================
// vite-plugin-pwa con registerType:'autoUpdate' aggiorna in background:
// scarica i nuovi asset, ma l'utente li vede solo al prossimo boot dell'app.
// Su iOS PWA questo può richiedere giorni. Il pulsante manuale in
// Impostazioni copre questo caso forzando il check + attivazione + reload.
//
// Usiamo workbox-window per gestirlo senza toccare App.jsx pesantemente.

if ('serviceWorker' in navigator) {
  // Import dinamico: in dev (senza build PWA) il SW non viene registrato
  // e workbox-window non viene scaricato.
  import('workbox-window').then(({ Workbox }) => {
    const wb = new Workbox('/sw.js', { scope: '/' });

    let waitingWorker = null;

    // Una nuova versione è installata ed è in attesa di attivarsi
    wb.addEventListener('waiting', (event) => {
      waitingWorker = event.sw || wb;
    });

    // Il nuovo SW ha preso il controllo: ricarico per usare gli asset nuovi
    wb.addEventListener('controlling', () => {
      window.location.reload();
    });

    wb.register().catch((err) => {
      // Es. dev locale senza build PWA — non è un errore reale
      console.info('[PWA] Service worker non disponibile:', err?.message || err);
    });

    // ----------------------------------------------------------
    // API esposta a App.jsx (chiamata dal bottone in Impostazioni)
    // Ritorna: "updated" | "current" | "unsupported" | "error"
    // ----------------------------------------------------------
    window.__verdeguidaCheckUpdate = async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) return 'unsupported';

        // C'è già un worker in attesa da un check precedente: attivalo
        if (reg.waiting || waitingWorker) {
          (waitingWorker || reg.waiting).postMessage({ type: 'SKIP_WAITING' });
          return 'updated';
        }

        // Forza il check al server (scarica /sw.js e confronta)
        await reg.update();

        // Diamo un attimo all'evento 'waiting' di scattare se c'è davvero
        // una nuova versione
        await new Promise((resolve) => setTimeout(resolve, 800));

        if (reg.waiting || waitingWorker) {
          (waitingWorker || reg.waiting).postMessage({ type: 'SKIP_WAITING' });
          return 'updated';
        }

        return 'current';
      } catch (err) {
        console.error('[PWA] check update error:', err);
        return 'error';
      }
    };
  }).catch((err) => {
    console.info('[PWA] workbox-window non caricato:', err?.message || err);
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
