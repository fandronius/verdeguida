# 🌱 VerdeGuida

**v1.5.1 · by Fandronius**

Il tuo quaderno di campagna digitale. PWA installabile su iPhone e Android.

## Funzionalità

- 🍅 **Dashboard a colpo d'occhio** con valore stimato del raccolto
- 🗺️ **Appezzamenti separati** con microclima + flag serra/idroponica/rialzato
- 📚 **Catalogo piante** + creazione di **nuove piante con ricerca AI**
- 🎨 **Emoji picker** con categorie (Fiori, Colori, Frutta, Verdure, Aromatiche, Altro)
- 📅 **Calendario interventi** con toggle per categoria
- 🕐 **Agenda settimanale** con orari consigliati
- 🔬 **Problemi per pianta** con rimedi AI
- ⚠️ **Warning fuori stagione** dissuasivo se piantando nel mese sbagliato
- 💧 Irrigazione suggerita per pianta + contenitore + stagione
- 💡 **Tecniche alternative**: No-Dig, Hügelkultur, Sinergico, ecc.
- 🌿 **Guida pacciamatura** con 10 materiali
- 🌸 Gestione piante ornamentali (solo fioritura, no raccolta)
- 💾 **Backup JSON**: export e import dei dati
- 📱 Installabile come app, funziona offline

## ⚠️ Importante: la ricerca AI richiede configurazione

Le funzioni **"cerca pianta"** e **"cerca rimedi"** usano l'API Claude via Netlify Function. Servono 2 minuti:

1. **API key Anthropic**: [console.anthropic.com](https://console.anthropic.com) → API Keys → Create Key
2. **Deploy via Git** su Netlify (il drag&drop non supporta le functions)
3. Nel dashboard Netlify: **Site configuration → Environment variables** → `ANTHROPIC_API_KEY`
4. Ri-deploy

## Come deployare su Netlify

### Git (consigliato, supporta l'AI)
1. Crea repo GitHub col progetto
2. Netlify: Add new site → Import from Git → seleziona il repo
3. Imposta `ANTHROPIC_API_KEY` nelle env vars
4. Deploy

### Netlify CLI
```bash
npm install -g netlify-cli
netlify login
cd orto-app
netlify init
netlify env:set ANTHROPIC_API_KEY sk-ant-xxxxxxxx
netlify deploy --prod
```

### Drag & drop (senza AI)
1. `npm run build`
2. [app.netlify.com/drop](https://app.netlify.com/drop) → trascina `dist/`
3. L'AI non funzionerà ma tutto il resto sì

## Come girare in locale

### Solo frontend
```bash
cd orto-app
npm install
npm run host
```

### Con AI (serve Netlify CLI)
```bash
npm install -g netlify-cli
cd orto-app
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env
netlify dev
```

## Installazione su telefono

- **iOS Safari**: Condividi → Aggiungi alla schermata Home
- **Android Chrome**: menu → Installa app

## Changelog

### v1.5.1
- 🍅 **Maturazione per singola pianta**: la raccolta non viene più suggerita solo perché siamo nel mese giusto. Adesso ogni pianta ha un campo `giorniMaturazione` (pomodoro 75, lattuga 45, basilico 40, ecc.) e l'app considera quando l'hai effettivamente piantata. Se pianti un pomodoro il 4 maggio, la raccolta apparirà solo da metà luglio in poi, anche se a giugno è già "stagione di pomodori".
- 📅 **Editor data di piantagione**: nel modal "Modifica pianta" puoi ora correggere la data se hai messo a dimora la pianta giorni o settimane prima di registrarla in app. L'app mostra anche la data prevista di prima raccolta.
- 🔍 **Fix bottone Cerca su mobile**: nel modal "Aggiungi pianta" il bottone verde "Cerca" non veniva tagliato su schermi stretti. Ora va a tutta larghezza sotto l'input su mobile, e resta accanto su tablet/desktop.
- ➕ **Prompt AI** per piante custom aggiornato: chiede anche `giorniMaturazione` per coerenza con le piante del catalogo.
- 🛡️ **Compatibilità con dati esistenti**: piante già presenti nel tuo orto senza data di piantagione mantengono il vecchio comportamento — nessuna migrazione, nessun dato perso.

### v1.4.0
- 🌱 Rebranding: nuovo nome **VerdeGuida**, nuova icona (pianta che nasce da un libro), colore primario verde oliva
- Selettore emoji a categorie
- Warning fuori stagione dissuasivo quando pianti nel mese sbagliato
- Flag appezzamenti: serra (anticipa 3 settimane), idroponica (niente stagionalità), rialzato

### v1.3.0
- Piante ornamentali senza raccolta (solo fioritura)
- Piante nuove con ricerca AI + modifica dopo creazione
- Netlify Function proxy per nascondere API key
- Messaggi errore chiari per ricerca AI

### v1.2.0
- Export/Import JSON completo
- Pannello Impostazioni

### v1.1.0
- Dashboard con riepilogo + valore raccolto
- Agenda settimanale
- Problemi per pianta
- Toggle calendario

### v1.0.0
- Prima release

## Struttura

```
orto-app/
├── src/
│   ├── App.jsx              # App completa
│   ├── main.jsx, index.css
├── public/
│   ├── icon.svg             # Icona: pianta da libro
│   └── icon-{size}.png
├── netlify/functions/
│   └── claude.mjs           # Proxy API
├── netlify.toml
├── package.json, vite.config.js, index.html
```

## Personalizzazioni

- **Prezzi**: `PLANT_CATALOG` in `src/App.jsx`
- **Colori**: cerca `:root {` in `src/App.jsx` (la var `--c-terra` è il colore primario verde oliva)
- **Tecniche**: `TECNICHE`
- **Pacciamature**: `PACCIAMATURE`

Buon orto! 🌱

— *Fandronius*
