import React, { useState, useEffect, useMemo } from "react";
import { Plus, Calendar, Sprout, BookOpen, Bell, Trash2, X, Droplets, Scissors, Sun, Leaf, CheckCircle2, Circle, MapPin, Home, Flower2, Edit3, Trees, Lightbulb, ExternalLink, Search, Layers, Menu, AlertTriangle, Clock, Euro, Settings, Download, Upload } from "lucide-react";

// ============================================================
// STORAGE SHIM — localStorage con interfaccia async simile a window.storage
// ============================================================
if (typeof window !== "undefined" && !window.storage) {
  window.storage = {
    async get(key) {
      const v = localStorage.getItem(key);
      return v ? { key, value: v } : null;
    },
    async set(key, value) {
      localStorage.setItem(key, value);
      return { key, value };
    },
    async delete(key) {
      localStorage.removeItem(key);
      return { key, deleted: true };
    }
  };
}

// ============================================================
// DATABASE PIANTE — orto + frutteto, clima mediterraneo italiano
// I mesi sono riferiti al Centro Italia (riferimento). Ogni appezzamento
// può avere uno shift che sposta le date in base al microclima.
// ============================================================
const PLANT_CATALOG = [
  { id: "pomodoro", nome: "Pomodoro", categoria: "orto", emoji: "🍅",
    descrizione: "Ortaggio solanaceo che ama il sole pieno. Necessita tutoraggio e annaffiature regolari senza bagnare le foglie.",
    semina: [3,4], trapianto: [4,5], raccolta: [7,8,9],
    spazio: "60 cm tra piante", acqua: "alta", sole: "pieno",
    difficolta: "media", vasoOk: true,
    resaKg: 4, prezzoKg: 2.5  },
  { id: "zucchina", nome: "Zucchina", categoria: "orto", emoji: "🥒",
    descrizione: "Pianta molto produttiva. Raccogli i frutti giovani per stimolare nuova produzione.",
    semina: [4,5], trapianto: [5,6], raccolta: [6,7,8,9],
    spazio: "1 m tra piante", acqua: "alta", sole: "pieno",
    difficolta: "facile", vasoOk: true,
    resaKg: 8, prezzoKg: 2.0  },
  { id: "insalata", nome: "Lattuga", categoria: "orto", emoji: "🥬",
    descrizione: "Cresce rapidamente. Semina scalare ogni 2-3 settimane per raccolto continuo.",
    semina: [2,3,4,5,8,9,10], trapianto: [3,4,5,9,10], raccolta: [4,5,6,7,10,11],
    spazio: "25 cm tra piante", acqua: "media", sole: "mezz'ombra",
    difficolta: "facile", vasoOk: true,
    resaKg: 0.4, prezzoKg: 3.0  },
  { id: "basilico", nome: "Basilico", categoria: "orto", emoji: "🌿",
    descrizione: "Aromatica essenziale. Cima regolarmente per favorire la ramificazione e ritardare la fioritura.",
    semina: [4,5], trapianto: [5,6], raccolta: [6,7,8,9],
    spazio: "30 cm tra piante", acqua: "media", sole: "pieno",
    difficolta: "facile", vasoOk: true,
    resaKg: 0.3, prezzoKg: 25.0  },
  { id: "peperone", nome: "Peperone", categoria: "orto", emoji: "🫑",
    descrizione: "Richiede calore e tempi lunghi. Sostieni i rami carichi di frutti con tutori.",
    semina: [2,3], trapianto: [5], raccolta: [7,8,9,10],
    spazio: "50 cm tra piante", acqua: "media", sole: "pieno",
    difficolta: "media", vasoOk: true,
    resaKg: 2, prezzoKg: 3.0  },
  { id: "melanzana", nome: "Melanzana", categoria: "orto", emoji: "🍆",
    descrizione: "Ama il caldo. Cimare la pianta dopo 4-5 foglie stimola la produzione laterale.",
    semina: [2,3], trapianto: [5], raccolta: [7,8,9,10],
    spazio: "60 cm tra piante", acqua: "alta", sole: "pieno",
    difficolta: "media", vasoOk: true,
    resaKg: 3, prezzoKg: 2.0  },
  { id: "carota", nome: "Carota", categoria: "orto", emoji: "🥕",
    descrizione: "Richiede terreno soffice e profondo, privo di sassi. Diradare le piantine è essenziale.",
    semina: [3,4,5,6,7], trapianto: [], raccolta: [6,7,8,9,10],
    spazio: "5 cm tra piante", acqua: "media", sole: "pieno",
    difficolta: "media", vasoOk: false,
    resaKg: 0.12, prezzoKg: 1.8  },
  { id: "cipolla", nome: "Cipolla", categoria: "orto", emoji: "🧅",
    descrizione: "Si pianta in bulbilli. Riduci le irrigazioni prima della raccolta per migliorare la conservazione.",
    semina: [2,3,9,10], trapianto: [2,3,10], raccolta: [6,7],
    spazio: "15 cm tra piante", acqua: "bassa", sole: "pieno",
    difficolta: "facile", vasoOk: false,
    resaKg: 0.15, prezzoKg: 1.5  },
  { id: "fagiolino", nome: "Fagiolino", categoria: "orto", emoji: "🫘",
    descrizione: "Raccolta scalare. I fagiolini rampicanti richiedono tutori alti fino a 2 metri.",
    semina: [4,5,6,7], trapianto: [], raccolta: [6,7,8,9],
    spazio: "20 cm tra piante", acqua: "media", sole: "pieno",
    difficolta: "facile", vasoOk: true,
    resaKg: 0.5, prezzoKg: 4.5  },
  { id: "rosmarino", nome: "Rosmarino", categoria: "orto", emoji: "🌱",
    descrizione: "Aromatica perenne resistente alla siccità. Una volta avviata richiede pochissime cure.",
    semina: [3,4], trapianto: [4,5,9,10], raccolta: [1,2,3,4,5,6,7,8,9,10,11,12],
    spazio: "80 cm tra piante", acqua: "bassa", sole: "pieno",
    difficolta: "facile", vasoOk: true,
    resaKg: 1, prezzoKg: 15.0  },

  // FRUTTETO
  { id: "limone", nome: "Limone", categoria: "frutteto", emoji: "🍋",
    descrizione: "Agrume rifiorente tipico mediterraneo. Teme il gelo sotto i -3°C, ripararlo o coltivarlo in vaso.",
    semina: [], trapianto: [3,4,10], raccolta: [11,12,1,2,3,4,5],
    spazio: "4 m tra piante", acqua: "media", sole: "pieno",
    difficolta: "media", vasoOk: true,
    resaKg: 30, prezzoKg: 2.5  },
  { id: "fico", nome: "Fico", categoria: "frutteto", emoji: "🫒",
    descrizione: "Albero robusto e rustico. Alcune varietà producono due volte: fioroni a giugno e fichi a agosto-settembre.",
    semina: [], trapianto: [10,11,2,3], raccolta: [6,8,9],
    spazio: "5 m tra piante", acqua: "bassa", sole: "pieno",
    difficolta: "facile", vasoOk: false,
    resaKg: 40, prezzoKg: 4.0  },
  { id: "olivo", nome: "Olivo", categoria: "frutteto", emoji: "🫒",
    descrizione: "Simbolo del Mediterraneo. Potatura a vaso ogni anno dopo la raccolta, molto longevo.",
    semina: [], trapianto: [3,4,10,11], raccolta: [10,11,12],
    spazio: "6 m tra piante", acqua: "bassa", sole: "pieno",
    difficolta: "media", vasoOk: false,
    resaKg: 25, prezzoKg: 3.0  },
  { id: "pesco", nome: "Pesco", categoria: "frutteto", emoji: "🍑",
    descrizione: "Albero da frutto di vita breve (15-20 anni). Richiede potatura invernale accurata ogni anno.",
    semina: [], trapianto: [11,12,1,2], raccolta: [6,7,8],
    spazio: "5 m tra piante", acqua: "media", sole: "pieno",
    difficolta: "media", vasoOk: false,
    resaKg: 50, prezzoKg: 2.5  },
  { id: "vite", nome: "Vite", categoria: "frutteto", emoji: "🍇",
    descrizione: "Richiede palo o pergolato. Potatura secca in inverno e potatura verde in estate per la qualità dei grappoli.",
    semina: [], trapianto: [11,12,1,2,3], raccolta: [8,9,10],
    spazio: "2 m tra piante", acqua: "bassa", sole: "pieno",
    difficolta: "difficile", vasoOk: false,
    resaKg: 8, prezzoKg: 3.5  },
  { id: "melo", nome: "Melo", categoria: "frutteto", emoji: "🍎",
    descrizione: "Preferisce climi freschi ma esistono varietà adatte al Sud. Diradare i frutti a giugno per pezzature migliori.",
    semina: [], trapianto: [11,12,1,2], raccolta: [8,9,10],
    spazio: "4 m tra piante", acqua: "media", sole: "pieno",
    difficolta: "media", vasoOk: false,
    resaKg: 60, prezzoKg: 2.0  },
  { id: "ciliegio", nome: "Ciliegio", categoria: "frutteto", emoji: "🍒",
    descrizione: "Fioritura spettacolare a primavera. Proteggi i frutti con reti antiuccello prima della maturazione.",
    semina: [], trapianto: [11,12,1,2], raccolta: [5,6],
    spazio: "6 m tra piante", acqua: "media", sole: "pieno",
    difficolta: "media", vasoOk: false,
    resaKg: 30, prezzoKg: 6.0  },
  { id: "albicocco", nome: "Albicocco", categoria: "frutteto", emoji: "🍑",
    descrizione: "Fiorisce molto presto, attenzione alle gelate tardive. Produce abbondantemente in anni alterni.",
    semina: [], trapianto: [11,12,1,2], raccolta: [6,7],
    spazio: "5 m tra piante", acqua: "media", sole: "pieno",
    difficolta: "media", vasoOk: false,
    resaKg: 40, prezzoKg: 3.0  },
];

const MESI = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];

// Tipi di appezzamento disponibili
const TIPI_APPEZZAMENTO = [
  { id: "terreno", label: "Terreno", icon: "🌾", desc: "Pieno campo, grandi superfici" },
  { id: "giardino", label: "Giardino", icon: "🌳", desc: "Giardino domestico con aiuole" },
  { id: "orto-rialzato", label: "Orto rialzato", icon: "🪴", desc: "Cassoni o aiuole rialzate" },
  { id: "balcone", label: "Balcone", icon: "🏡", desc: "Vasi su balcone" },
  { id: "terrazzo", label: "Terrazzo", icon: "🌇", desc: "Vasi e fioriere su terrazzo" },
  { id: "serra", label: "Serra", icon: "🏕️", desc: "Coltivazione protetta" },
];

// Un appezzamento "in vaso" cambia la logica di irrigazione
const IN_VASO = new Set(["balcone", "terrazzo"]);

const APP_VERSION = "1.4.0";

// Endpoint API: in produzione chiama il proxy Netlify Function che nasconde la key.
// In dev locale funziona comunque se Netlify CLI gira (netlify dev).
// Fallback: chiamata diretta ad Anthropic (richiede CORS enabled, improbabile).
const CLAUDE_API_ENDPOINT = "/api/claude";

// Shift stagionale effettivo: microclima + bonus serra (anticipa ~3 settimane).
// La serra tipo appezzamento o il flag hasSerra contribuiscono entrambi.
function effectiveShift(appezzamento) {
  if (!appezzamento) return 0;
  let shift = appezzamento.microclima?.shiftSett || 0;
  if (appezzamento.hasSerra || appezzamento.tipo === "serra") shift += 3;
  return shift;
}

// ============================================================
// PACCIAMATURA — guida ai materiali e tecniche
// ============================================================
const PACCIAMATURE = [
  {
    id: "paglia", nome: "Paglia", categoria: "organica", icona: "🌾",
    adatto: ["terreno", "giardino", "orto-rialzato", "serra"],
    pro: "Lascia passare acqua, naturale, economica, arricchisce il suolo decomponendosi",
    contro: "Può contenere semi di infestanti se di scarsa qualità",
    stagione: "Primavera e autunno",
    spessore: "5-10 cm",
    nota: "Il materiale più diffuso e bilanciato per l'orto. Va integrata ogni anno man mano che si decompone."
  },
  {
    id: "sfalcio", nome: "Sfalcio d'erba", categoria: "organica", icona: "🌱",
    adatto: ["terreno", "giardino", "orto-rialzato"],
    pro: "Disponibile a costo zero se hai un giardino, ricco di azoto",
    contro: "Se usato fresco può fermentare e creare muffe. Vanno essiccato prima",
    stagione: "Tutto l'anno (essiccato)",
    spessore: "3-5 cm (strati sottili)",
    nota: "Stendi in strati sottili per evitare la marcescenza. Mai fresco, sempre appassito."
  },
  {
    id: "foglie", nome: "Foglie secche", categoria: "organica", icona: "🍂",
    adatto: ["terreno", "giardino", "orto-rialzato", "balcone", "terrazzo"],
    pro: "Ottimo rapporto carbonio/azoto, gratuito in autunno, isolante termico",
    contro: "Possono volare via se non fissate, alcune specie (noce, eucalipto) rallentano la crescita",
    stagione: "Autunno-inverno",
    spessore: "5-8 cm",
    nota: "Perfette sotto frutti piccoli come fragole, more, mirtilli. Evita foglie di noce."
  },
  {
    id: "compost", nome: "Compost maturo", categoria: "organica", icona: "🪱",
    adatto: ["terreno", "giardino", "orto-rialzato", "balcone", "terrazzo"],
    pro: "Nutre il terreno mentre lo protegge, stimola la vita microbica",
    contro: "Richiede tempo per produrlo, va steso già maturo",
    stagione: "Primavera e autunno",
    spessore: "3-5 cm",
    nota: "Base ideale dell'approccio no-dig: un solo strato di compost sopra la terra."
  },
  {
    id: "cippato", nome: "Cippato di legna", categoria: "organica", icona: "🪵",
    adatto: ["frutteto", "giardino", "terreno"],
    pro: "Dura molti mesi, aspetto ordinato, ideale per arbusti e frutteto",
    contro: "Consuma azoto decomponendosi (aggiungi concime ricco di azoto)",
    stagione: "Autunno-inverno",
    spessore: "7-10 cm",
    nota: "Non usarlo vicino ad ortaggi giovani. Perfetto nei sentieri dell'orto."
  },
  {
    id: "corteccia", nome: "Corteccia di pino", categoria: "organica", icona: "🌰",
    adatto: ["giardino", "balcone", "terrazzo"],
    pro: "Estetica, leggera, dura a lungo, efficace contro infestanti",
    contro: "Acidifica leggermente il suolo. Non adatta a tutte le colture",
    stagione: "Tutto l'anno",
    spessore: "5 cm",
    nota: "Per vasi scegli pezzatura fine, in giardino pezzatura grossa. 10 L per m² per cm di spessore."
  },
  {
    id: "lapillo", nome: "Lapillo vulcanico", categoria: "minerale", icona: "🪨",
    adatto: ["giardino", "balcone", "terrazzo"],
    pro: "Lunghissima durata, leggero, drena bene, decorativo",
    contro: "Non nutre il terreno, costo iniziale più alto",
    stagione: "Tutto l'anno",
    spessore: "3-5 cm",
    nota: "Ideale per piante grasse, succulente e aromatiche mediterranee come lavanda, rosmarino, timo."
  },
  {
    id: "ghiaia", nome: "Ghiaia / sassolini", categoria: "minerale", icona: "🧱",
    adatto: ["giardino", "balcone", "terrazzo"],
    pro: "Praticamente eterna, decorativa, ottima per zone aride",
    contro: "Non arricchisce il suolo, difficile da rimuovere",
    stagione: "Tutto l'anno",
    spessore: "5 cm",
    nota: "Stendi un telo geotessile sotto per evitare che affondi nel terreno."
  },
  {
    id: "telo-nero", nome: "Telo pacciamante nero", categoria: "sintetica", icona: "⬛",
    adatto: ["terreno", "orto-rialzato"],
    pro: "Blocca totalmente le infestanti, scalda il terreno, riutilizzabile",
    contro: "Plastica non biodegradabile, impedisce al terreno di respirare del tutto",
    stagione: "Primavera (prima del trapianto)",
    spessore: "n/a (telo)",
    nota: "Buca i punti dove metti le piante. Ottimo per zucche, zucchine, angurie, fragole."
  },
  {
    id: "telo-bio", nome: "Telo biodegradabile", categoria: "sintetica", icona: "🟫",
    adatto: ["terreno", "orto-rialzato"],
    pro: "Si degrada nel suolo, praticità del telo senza residui plastici",
    contro: "Costo maggiore, dura solo una stagione",
    stagione: "Primavera",
    spessore: "n/a (telo)",
    nota: "Realizzati in amido di mais o juta. Soluzione ecologica ai teli in polietilene."
  },
];

// ============================================================
// TECNICHE & HACK — metodi di coltivazione alternativi/sperimentali
// ============================================================
const TECNICHE = [
  {
    id: "no-dig", nome: "No-Dig (Senza scavare)", difficolta: "facile", icona: "🌿",
    claim: "Meno lavoro, più produzione",
    descrizione: "Metodo di Charles Dowding: non si lavora mai la terra, ci si limita a stendere ogni anno uno strato di compost maturo sopra il suolo. I microrganismi fanno tutto il lavoro di sotto.",
    comeFare: "Stendi 5-15 cm di compost maturo direttamente sulla terra (anche sull'erba, con cartone sotto la prima volta). Semina o trapianta direttamente nel compost. Ogni anno aggiungi un nuovo strato di 3-5 cm.",
    perChi: "Chi vuole ridurre il lavoro fisico e rigenerare un terreno povero",
    tempo: "Risultati visibili già dal primo anno",
    link: "https://www.charlesdowding.co.uk"
  },
  {
    id: "sinergico", nome: "Orto Sinergico", difficolta: "media", icona: "🤝",
    claim: "Le piante si aiutano tra loro",
    descrizione: "Metodo di Emilia Hazelip (dagli studi di Fukuoka): bancali rialzati permanenti con pacciamatura continua, niente lavorazione del suolo, consociazioni di 3+ specie che si aiutano: una leguminosa (azoto), una liliacea (antiparassita), un ortaggio da frutto o foglia.",
    comeFare: "Costruisci bancali rialzati larghi 120 cm, alti 40 cm, con sentieri tra loro. Coprili con paglia. Pianta sempre almeno una leguminosa (fagioli, piselli) + una liliacea (aglio, cipolla, porro) + l'ortaggio principale.",
    perChi: "Chi ama la biodiversità e un orto che assomiglia a un ecosistema naturale",
    tempo: "I bancali durano molti anni, si migliorano nel tempo",
    link: "https://www.ortodacoltivare.it/consigli/metodi/orto-sinergico.html"
  },
  {
    id: "hugelkultur", nome: "Hügelkultur (cumuli)", difficolta: "media", icona: "⛰️",
    claim: "Fertilità concentrata per decenni",
    descrizione: "Antica tecnica dell'Europa centrale riportata in auge da Sepp Holzer: cumuli di tronchi e rami ricoperti di terra che, decomponendosi lentamente, rilasciano nutrienti e trattengono umidità per 15-20 anni.",
    comeFare: "Scava una buca di 40 cm, riempila con tronchi grossi (non conifere, non noce), poi rami più piccoli, foglie, sfalcio, compost e infine terra di scavo. Il cumulo sarà alto 70-100 cm. Pacciama sopra.",
    perChi: "Chi ha terreno povero, poca acqua, o legna di risulta da potature",
    tempo: "Un pomeriggio di lavoro, produce per 15+ anni",
    link: "https://www.boscodiogigia.it/orto/hugelkultur"
  },
  {
    id: "lasagna", nome: "Lasagna Gardening", difficolta: "facile", icona: "🥬",
    claim: "Coltiva ovunque, anche sul cemento",
    descrizione: "Tecnica di Esther Deans: strati alternati di materiale bruno (cartone, paglia, foglie secche) e verde (sfalcio, cucina, compost) che creano terreno fertile direttamente sopra superfici impossibili.",
    comeFare: "Stendi cartone bagnato come base. Alterna strati di 5-10 cm bruno/verde fino a 40-50 cm totali. Chiudi con paglia o foglie. Dopo 2-3 mesi è pronto, oppure pianta subito in tasche di terriccio.",
    perChi: "Chi coltiva su superfici dure, terrazzi, piazzali",
    tempo: "Utilizzabile da subito, perfetto dopo 2-3 mesi",
    link: "https://www.ortodacoltivare.it/consigli/metodi/"
  },
  {
    id: "biointensivo", nome: "Orto Bio-intensivo", difficolta: "media", icona: "📏",
    claim: "Massima resa in poco spazio",
    descrizione: "Metodo sviluppato da John Jeavons: lavorazione profonda iniziale (doppio scavo), piante a distanza ravvicinata in esagono, consociazioni studiate, compost abbondante. 4x la resa tradizionale.",
    comeFare: "Prepara bancali stretti (120 cm) con doppio scavo profondo 60 cm. Semina in esagono con distanze del 30% inferiori al classico. Usa compost ricco e rotazioni strette. Ottimo per piccoli spazi urbani.",
    perChi: "Chi ha poco spazio ma vuole autoprodursi gran parte del cibo",
    tempo: "Lavoro iniziale impegnativo, poi routine stabile",
    link: "https://www.ortodacoltivare.it/coltivare/tecniche-di-coltivazione/orto-biointensivo.html"
  },
  {
    id: "keyhole", nome: "Keyhole Garden", difficolta: "facile", icona: "🔑",
    claim: "Un orto circolare con compost al centro",
    descrizione: "Orto circolare di 2 metri di diametro con un cesto di compost al centro accessibile da uno spicchio a 'buco della serratura'. L'acqua e i nutrienti del compost alimentano le piante circostanti.",
    comeFare: "Costruisci un cerchio rialzato di pietre o mattoni (2 m diam, 1 m alt). Lascia uno spicchio per entrare fino al centro. Al centro, un cilindro di rete con compost/scarti di cucina. Riempi il resto con strati à la hugelkultur.",
    perChi: "Piccoli spazi, bambini, chi cerca un orto bello e funzionale",
    tempo: "Un fine settimana di lavoro",
    link: "https://www.ortodacoltivare.it/consigli/metodi/keyhole-garden.html"
  },
  {
    id: "consociazioni", nome: "Consociazioni classiche", difficolta: "facile", icona: "💑",
    claim: "Abbinamenti che si proteggono a vicenda",
    descrizione: "Coltivare piante vicine che si aiutano: pomodoro-basilico (il basilico allontana afidi e migliora il sapore), carota-cipolla (confondono i rispettivi parassiti), fagioli-mais-zucca (le 'tre sorelle' native).",
    comeFare: "Alcuni abbinamenti vincenti: pomodoro + basilico + prezzemolo; carota + cipolla/porro; cavolo + aneto + camomilla; fragola + aglio; insalata + ravanelli. Evita invece pomodoro + patata e cipolla + legumi.",
    perChi: "Tutti, è la base di qualsiasi orto sano",
    tempo: "Da applicare subito a ogni semina",
    link: "https://www.greenme.it/vivere/orto-e-giardino/consociazioni-piante/"
  },
  {
    id: "macerati", nome: "Macerati vegetali", difficolta: "media", icona: "🧪",
    claim: "Antiparassitari naturali fatti in casa",
    descrizione: "Infusi fermentati di piante (ortica, equiseto, aglio) che proteggono dalle malattie fungine e dai parassiti senza chimica. L'ortica nutre, l'equiseto rinforza contro funghi, l'aglio allontana afidi.",
    comeFare: "Ortica: 1 kg di pianta fresca in 10 L d'acqua piovana, lasciata macerare 10-15 giorni. Diluisci 1:10 per irrigare (fertilizzante) o 1:20 per nebulizzare (antiparassitario). Stesso procedimento per equiseto e aglio.",
    perChi: "Chi vuole un orto 100% biologico e ha accesso alle piante",
    tempo: "2 settimane di macerazione, poi pronto all'uso",
    link: "https://www.ortodacoltivare.it/difesa/macerato-ortica.html"
  },
];


// ============================================================
// MICROCLIMA — calcolo shift stagionale basato su latitudine e altitudine
// Riferimento: Centro Italia (lat ~42°, altitudine 100 m)
// Ogni grado di latitudine verso sud anticipa di ~3 giorni
// Ogni 100 m di altitudine ritarda di ~3 giorni
// Lo shift è espresso in settimane arrotondate
// ============================================================
function calcoloMicroclima(lat, altitudine) {
  if (lat == null) return { shiftSett: 0, zona: "riferimento", descrizione: "Dati climatici non disponibili" };
  // Riferimento: Centro Italia costiero (lat 42°, altitudine 50m)
  // Latitudine: ogni grado a sud anticipa di ~4 giorni (pianura)
  // Altitudine: ogni 100m ritarda di ~5 giorni (gradiente termico reale ~0.6°C/100m)
  const giorniDaLat = (42 - lat) * 4;
  const giorniDaAlt = -((altitudine - 50) / 100) * 5;
  const giorniTot = giorniDaLat + giorniDaAlt;
  const shiftSett = Math.round(giorniTot / 7);

  let zona = "temperato";
  if (lat < 38) zona = "caldo mediterraneo";
  else if (lat < 41) zona = "mediterraneo";
  else if (lat < 44) zona = "temperato";
  else if (lat < 46) zona = "subcontinentale";
  else zona = "alpino";

  if (altitudine > 800) zona += " (montano)";
  else if (altitudine > 400) zona += " (collinare)";

  let descrizione = "";
  if (shiftSett >= 2) descrizione = `Stagione anticipata di ~${shiftSett} settimane rispetto alla costa tirrenica centrale. Temperature più miti, puoi seminare e trapiantare prima.`;
  else if (shiftSett <= -2) descrizione = `Stagione ritardata di ~${Math.abs(shiftSett)} settimane. L'altitudine mantiene il clima più fresco: aspetta qualche settimana in più per semine e trapianti di primavera.`;
  else if (shiftSett === 1) descrizione = `Stagione leggermente anticipata (+1 sett.) rispetto al Centro Italia`;
  else if (shiftSett === -1) descrizione = `Stagione leggermente ritardata (-1 sett.). L'altitudine si fa sentire.`;
  else descrizione = "Stagione in linea con il Centro Italia";

  return { shiftSett, zona, descrizione, lat, altitudine };
}

// Applica lo shift (in settimane) ai mesi consigliati. shift positivo = anticipa.
function shiftMesi(mesi, shiftSett) {
  if (!shiftSett || !mesi.length) return mesi;
  const out = new Set();
  mesi.forEach(m => {
    // Approssimazione: 1 settimana = ~0.25 mese
    const deltaMesi = Math.round(shiftSett / 4.3);
    let nuovo = m - deltaMesi;
    while (nuovo < 1) nuovo += 12;
    while (nuovo > 12) nuovo -= 12;
    out.add(nuovo);
  });
  return Array.from(out).sort((a,b) => a-b);
}

// ============================================================
// IRRIGAZIONE SUGGERITA — calcola frequenza e volume
// basandosi su: fabbisogno pianta, tipo appezzamento, mese corrente
// ============================================================
function calcolaIrrigazione(plant, tipoAppezzamento, mese) {
  const inVaso = IN_VASO.has(tipoAppezzamento);
  const estate = [6,7,8].includes(mese);
  const mezzaStagione = [5,9].includes(mese);
  const inverno = [11,12,1,2].includes(mese);

  // base: volume ml per pianta per irrigazione
  let volume = { bassa: 500, media: 1500, alta: 3000 }[plant.acqua] || 1500;
  // base: intervallo giorni
  let giorni = { bassa: 7, media: 4, alta: 2 }[plant.acqua] || 4;

  // in vaso si asciuga prima, volume minore ma frequenza maggiore
  if (inVaso) {
    volume = Math.round(volume * 0.4);
    giorni = Math.max(1, Math.round(giorni * 0.5));
  }

  // estate = più frequente
  if (estate) giorni = Math.max(1, giorni - 1);
  // inverno = molto meno
  if (inverno) {
    giorni = giorni * 3;
    volume = Math.round(volume * 0.3);
  }
  if (mezzaStagione) giorni = giorni + 1;

  let freqLabel;
  if (giorni === 1) freqLabel = "ogni giorno";
  else if (giorni === 2) freqLabel = "a giorni alterni";
  else if (giorni <= 7) freqLabel = `ogni ${giorni} giorni`;
  else freqLabel = `ogni ${Math.round(giorni/7)} settimane`;

  let volLabel;
  if (volume < 1000) volLabel = `${volume} ml per pianta`;
  else volLabel = `${(volume/1000).toFixed(1)} L per pianta`;

  return { freqLabel, volLabel, giorni, volume };
}

// ============================================================
// GENERATORE INTERVENTI — ora tiene conto dell'appezzamento
// ============================================================
function generateTasksForPlant(userPlant, appezzamento, catalog = PLANT_CATALOG) {
  const plant = catalog.find(p => p.id === userPlant.plantId);
  if (!plant) return [];
  const shift = effectiveShift(appezzamento);
  const tasks = [];
  const year = new Date().getFullYear();

  const semina = shiftMesi(plant.semina, shift);
  const trapianto = shiftMesi(plant.trapianto, shift);
  const raccolta = shiftMesi(plant.raccolta, shift);

  semina.forEach(m => tasks.push({
    type: "semina", icon: "🌱", mese: m, year,
    titolo: `Semina ${plant.nome}`,
    descrizione: `Periodo ideale. Spazio: ${plant.spazio}.`
  }));
  trapianto.forEach(m => tasks.push({
    type: "trapianto", icon: "🪴", mese: m, year,
    titolo: `Trapianto ${plant.nome}`,
    descrizione: `Trapianta in piena terra. Esposizione: ${plant.sole}.`
  }));
  raccolta.forEach(m => {
    // per le ornamentali non ha senso un "task di raccolta"
    if (plant.categoria === "ornamentale") return;
    tasks.push({
      type: "raccolta", icon: "🧺", mese: m, year,
      titolo: `Raccolta ${plant.nome}`,
      descrizione: `Quantità stimata: ${userPlant.quantita} piante.`
    });
  });

  // irrigazione suggerita per mesi chiave
  const mesiIrrigazione = plant.acqua === "alta" ? [5,6,7,8,9] : plant.acqua === "media" ? [6,7,8] : [7,8];
  mesiIrrigazione.forEach(m => {
    const ir = calcolaIrrigazione(plant, appezzamento?.tipo, m);
    tasks.push({
      type: "irrigazione", icon: "💧", mese: m, year,
      titolo: `Irrigazione ${plant.nome}`,
      descrizione: `${ir.freqLabel}, ${ir.volLabel}. Annaffia al mattino presto o alla sera.`
    });
  });

  // potature (solo per frutteto non custom)
  if (plant.categoria === "frutteto" && !plant.custom) {
    if (plant.id === "olivo") {
      tasks.push({ type: "potatura", icon: "✂️", mese: 3, year, titolo: `Potatura ${plant.nome}`, descrizione: `Potatura a vaso policonico. Elimina succhioni e rami interni.` });
    } else if (plant.id === "vite") {
      tasks.push({ type: "potatura", icon: "✂️", mese: 1, year, titolo: `Potatura secca ${plant.nome}`, descrizione: `Lascia 2 gemme sui tralci produttivi.` });
      tasks.push({ type: "potatura", icon: "✂️", mese: 6, year, titolo: `Potatura verde ${plant.nome}`, descrizione: `Cimatura e sfogliatura per migliorare l'insolazione.` });
    } else {
      tasks.push({ type: "potatura", icon: "✂️", mese: 2, year, titolo: `Potatura ${plant.nome}`, descrizione: `Potatura invernale durante il riposo vegetativo.` });
    }
  }

  return tasks.map((t, i) => ({
    ...t,
    id: `${userPlant.id}-${i}`,
    plantName: plant.nome,
    plantEmoji: plant.emoji,
    userPlantId: userPlant.id,
    appezzamentoId: userPlant.appezzamentoId,
  }));
}

// ============================================================
// GEOCODING via Open-Meteo (gratuito, senza API key)
// ============================================================
async function geocodificaLocalita(nome) {
  try {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(nome)}&count=5&language=it&country=IT`);
    const data = await res.json();
    return data.results || [];
  } catch(e) {
    return [];
  }
}

// ============================================================
// APP ROOT
// ============================================================
export default function VerdeGuida() {
  const [view, setView] = useState("home"); // home | calendario | stagione | catalogo | appezzamenti
  const [appezzamenti, setAppezzamenti] = useState([]);
  const [userPlants, setUserPlants] = useState([]);
  const [completedTasks, setCompletedTasks] = useState({});

  const [showAddPlantModal, setShowAddPlantModal] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [editingPlant, setEditingPlant] = useState(null);

  const [showAppezzamentoModal, setShowAppezzamentoModal] = useState(false);
  const [editingAppezzamento, setEditingAppezzamento] = useState(null);
  const [showCustomPlantModal, setShowCustomPlantModal] = useState(false);
  const [editingCustomPlant, setEditingCustomPlant] = useState(null);
  const [customPlants, setCustomPlants] = useState([]);
  const [showSettings, setShowSettings] = useState(false);

  // appezzamento attivo (per filtrare viste)
  const [activeAppezzamentoId, setActiveAppezzamentoId] = useState("all");

  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  // ========== LOAD ==========
  useEffect(() => {
    (async () => {
      try {
        const [aRes, pRes, tRes, cRes] = await Promise.all([
          window.storage.get("appezzamenti").catch(() => null),
          window.storage.get("user_plants").catch(() => null),
          window.storage.get("completed_tasks").catch(() => null),
          window.storage.get("custom_plants").catch(() => null),
        ]);
        if (aRes) setAppezzamenti(JSON.parse(aRes.value));
        if (pRes) setUserPlants(JSON.parse(pRes.value));
        if (tRes) setCompletedTasks(JSON.parse(tRes.value));
        if (cRes) setCustomPlants(JSON.parse(cRes.value));
      } catch(e) {}
      setLoading(false);
    })();
  }, []);

  // ========== SAVE ==========
  const saveCustomPlants = async (next) => {
    setCustomPlants(next);
    try { await window.storage.set("custom_plants", JSON.stringify(next)); } catch(e){}
  };

  // ========== SAVE ==========
  const saveAppezzamenti = async (next) => {
    setAppezzamenti(next);
    try { await window.storage.set("appezzamenti", JSON.stringify(next)); } catch(e){}
  };
  const savePlants = async (next) => {
    setUserPlants(next);
    try { await window.storage.set("user_plants", JSON.stringify(next)); } catch(e){}
  };
  const saveCompleted = async (next) => {
    setCompletedTasks(next);
    try { await window.storage.set("completed_tasks", JSON.stringify(next)); } catch(e){}
  };

  // ========== APPEZZAMENTI ==========
  const addAppezzamento = (a) => {
    const next = [...appezzamenti, a];
    saveAppezzamenti(next);
    if (activeAppezzamentoId === "all" && appezzamenti.length === 0) {
      setActiveAppezzamentoId(a.id);
    }
    setShowAppezzamentoModal(false);
    setEditingAppezzamento(null);
  };
  const updateAppezzamento = (id, patch) => {
    const next = appezzamenti.map(a => a.id === id ? { ...a, ...patch } : a);
    saveAppezzamenti(next);
    setEditingAppezzamento(null);
  };
  const removeAppezzamento = (id) => {
    saveAppezzamenti(appezzamenti.filter(a => a.id !== id));
    // rimuovo anche le piante associate
    savePlants(userPlants.filter(p => p.appezzamentoId !== id));
    if (activeAppezzamentoId === id) setActiveAppezzamentoId("all");
  };

  // ========== PIANTE ==========
  const addPlant = (catalogPlant, quantita, note, appezzamentoId) => {
    const newPlant = {
      id: `plant_${Date.now()}`,
      plantId: catalogPlant.id,
      quantita: quantita || 1,
      note: note || "",
      appezzamentoId: appezzamentoId || activeAppezzamentoId,
      addedAt: new Date().toISOString(),
    };
    savePlants([...userPlants, newPlant]);
    setShowAddPlantModal(false);
    setSelectedPlant(null);
  };
  const removePlant = (id) => {
    savePlants(userPlants.filter(p => p.id !== id));
  };
  const updatePlant = (id, patch) => {
    savePlants(userPlants.map(p => p.id === id ? { ...p, ...patch } : p));
    setEditingPlant(null);
  };
  const toggleTaskDone = (taskId) => {
    saveCompleted({ ...completedTasks, [taskId]: !completedTasks[taskId] });
  };

  // ========== PIANTE CUSTOM / NUOVE ==========
  const addCustomPlant = (customPlant) => {
    const newPlant = { ...customPlant, id: `custom_${Date.now()}`, custom: true };
    saveCustomPlants([...customPlants, newPlant]);
    setShowCustomPlantModal(false);
    setEditingCustomPlant(null);
  };
  const updateCustomPlant = (id, patch) => {
    saveCustomPlants(customPlants.map(p => p.id === id ? { ...p, ...patch } : p));
    setShowCustomPlantModal(false);
    setEditingCustomPlant(null);
  };
  const removeCustomPlant = (id) => {
    saveCustomPlants(customPlants.filter(p => p.id !== id));
    savePlants(userPlants.filter(p => p.plantId !== id));
  };

  // ========== EXPORT / IMPORT ==========
  const exportData = () => {
    const payload = {
      app: "VerdeGuida",
      version: APP_VERSION,
      exportedAt: new Date().toISOString(),
      data: {
        appezzamenti,
        userPlants,
        customPlants,
        completedTasks,
      }
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const today = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `verdeguida-backup-${today}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = async (file, mode = "replace") => {
    // mode: "replace" sostituisce tutto, "merge" aggiunge mantenendo l'esistente
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      if (!payload.data) throw new Error("File non valido: manca 'data'");

      const d = payload.data;
      if (mode === "replace") {
        if (Array.isArray(d.appezzamenti)) await saveAppezzamenti(d.appezzamenti);
        if (Array.isArray(d.userPlants)) await savePlants(d.userPlants);
        if (Array.isArray(d.customPlants)) await saveCustomPlants(d.customPlants);
        if (d.completedTasks && typeof d.completedTasks === "object") await saveCompleted(d.completedTasks);
      } else {
        // merge: aggiungo evitando duplicati per id
        if (Array.isArray(d.appezzamenti)) {
          const existingIds = new Set(appezzamenti.map(a => a.id));
          const toAdd = d.appezzamenti.filter(a => !existingIds.has(a.id));
          await saveAppezzamenti([...appezzamenti, ...toAdd]);
        }
        if (Array.isArray(d.customPlants)) {
          const existingIds = new Set(customPlants.map(p => p.id));
          const toAdd = d.customPlants.filter(p => !existingIds.has(p.id));
          await saveCustomPlants([...customPlants, ...toAdd]);
        }
        if (Array.isArray(d.userPlants)) {
          const existingIds = new Set(userPlants.map(p => p.id));
          const toAdd = d.userPlants.filter(p => !existingIds.has(p.id));
          await savePlants([...userPlants, ...toAdd]);
        }
        if (d.completedTasks) {
          await saveCompleted({ ...completedTasks, ...d.completedTasks });
        }
      }
      return { ok: true, stats: {
        appezzamenti: d.appezzamenti?.length || 0,
        userPlants: d.userPlants?.length || 0,
        customPlants: d.customPlants?.length || 0,
      }};
    } catch (e) {
      return { ok: false, error: e.message };
    }
  };

  const resetAll = () => {
    if (!confirm("Sei sicuro? Verranno eliminati TUTTI i dati: appezzamenti, piante, interventi, piante nuove. Questa operazione è irreversibile.")) return;
    saveAppezzamenti([]);
    savePlants([]);
    saveCustomPlants([]);
    saveCompleted({});
    setActiveAppezzamentoId("all");
    setShowSettings(false);
  };

  // catalogo completo = catalogo base + custom dell'utente
  const fullCatalog = useMemo(() => [...PLANT_CATALOG, ...customPlants], [customPlants]);

  // ========== DERIVATI ==========
  const plantsVisible = useMemo(() => {
    if (activeAppezzamentoId === "all") return userPlants;
    return userPlants.filter(p => p.appezzamentoId === activeAppezzamentoId);
  }, [userPlants, activeAppezzamentoId]);

  const allTasks = useMemo(() => {
    return plantsVisible.flatMap(up => {
      const app = appezzamenti.find(a => a.id === up.appezzamentoId);
      return generateTasksForPlant(up, app, fullCatalog);
    });
  }, [plantsVisible, appezzamenti, fullCatalog]);

  const currentMonth = new Date().getMonth();

  // piante da seminare ora (considera il microclima dell'appezzamento attivo)
  const plantsToSowNow = useMemo(() => {
    const activeApp = activeAppezzamentoId !== "all" ? appezzamenti.find(a => a.id === activeAppezzamentoId) : null;
    const shift = effectiveShift(activeApp);
    const tipoApp = activeApp?.tipo;

    return fullCatalog.filter(p => {
      // se l'appezzamento è in vaso, filtra solo piante vasoOk
      if (tipoApp && IN_VASO.has(tipoApp) && !p.vasoOk) return false;
      const semina = shiftMesi(p.semina, shift);
      const trapianto = shiftMesi(p.trapianto, shift);
      return semina.includes(currentMonth + 1) || trapianto.includes(currentMonth + 1);
    });
  }, [currentMonth, appezzamenti, activeAppezzamentoId, fullCatalog]);

  const upcomingTasks = useMemo(() => {
    const now = currentMonth + 1;
    const next = now === 12 ? 1 : now + 1;
    return allTasks.filter(t => (t.mese === now || t.mese === next) && !completedTasks[t.id]).slice(0, 5);
  }, [allTasks, completedTasks, currentMonth]);

  const activeApp = activeAppezzamentoId === "all" ? null : appezzamenti.find(a => a.id === activeAppezzamentoId);

  // ========== HANDLERS PER MODAL AGGIUNGI ==========
  const openAddFromCatalog = (plant) => {
    if (appezzamenti.length === 0) {
      // forza la creazione di un appezzamento prima
      setShowAppezzamentoModal(true);
      return;
    }
    setSelectedPlant(plant);
    setShowAddPlantModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--c-bg)" }}>
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">🌱</div>
          <p style={{ color: "var(--c-ink)", fontFamily: "var(--f-serif)" }}>Caricamento…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--c-bg)", color: "var(--c-ink)", fontFamily: "var(--f-sans)" }}>
      <style>{`
        :root {
          --c-bg: #f5ede0;
          --c-cream: #efe4d1;
          --c-ink: #2a2418;
          /* --c-terra è il colore "primario" dell'app (storicamente terracotta, ora verde oliva) */
          --c-terra: #7a8c3c;
          --c-terra-dark: #556126;
          --c-olive: #6b7a3a;
          --c-olive-dark: #4a5528;
          --c-ochre: #c8953a;
          --c-border: #d9c8a8;
          --f-serif: 'Fraunces', 'Playfair Display', Georgia, serif;
          --f-sans: 'Inter', 'Helvetica Neue', sans-serif;
        }
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700;9..144,900&family=Inter:wght@400;500;600&display=swap');
        .serif { font-family: var(--f-serif); }
        .display { font-family: var(--f-serif); font-weight: 900; letter-spacing: -0.03em; line-height: 0.95; }
        .grain::before {
          content: ""; position: fixed; inset: 0; pointer-events: none; z-index: 100;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E");
          mix-blend-mode: multiply; opacity: 0.5;
        }
        .btn-primary { background: var(--c-terra); color: var(--c-cream); border: 2px solid var(--c-terra-dark); padding: 10px 18px; border-radius: 100px; font-weight: 600; font-size: 14px; transition: all .2s; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }
        .btn-primary:hover { background: var(--c-terra-dark); transform: translateY(-1px); }
        .btn-primary:disabled { opacity: .5; cursor: not-allowed; transform: none; }
        .btn-ghost { background: transparent; color: var(--c-ink); border: 1.5px solid var(--c-border); padding: 8px 14px; border-radius: 100px; font-weight: 500; font-size: 13px; transition: all .2s; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
        .btn-ghost:hover { background: var(--c-cream); border-color: var(--c-ink); }
        .btn-ghost.active { background: var(--c-ink); color: var(--c-cream); border-color: var(--c-ink); }
        .card { background: var(--c-cream); border: 1.5px solid var(--c-border); border-radius: 14px; padding: 20px; transition: all .2s; }
        .chip { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; background: var(--c-bg); border: 1px solid var(--c-border); border-radius: 100px; font-size: 11px; font-weight: 500; letter-spacing: .02em; }
        .chip.terra { background: var(--c-terra); color: var(--c-cream); border-color: var(--c-terra); }
        .chip.olive { background: var(--c-olive); color: var(--c-cream); border-color: var(--c-olive); }
        .chip.ochre { background: var(--c-ochre); color: var(--c-ink); border-color: var(--c-ochre); }
        .chip.clickable { cursor: pointer; transition: all .15s; }
        .chip.clickable:hover { background: var(--c-ink); color: var(--c-cream); border-color: var(--c-ink); transform: translateY(-1px); }
        .hairline { height: 1px; background: var(--c-border); }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp .4s ease-out both; }
        .scroll-hide::-webkit-scrollbar { display: none; }
        .scroll-hide { scrollbar-width: none; }

        /* MOBILE TWEAKS */
        @media (max-width: 640px) {
          .display { font-size: 2.25rem !important; }
          .card { padding: 14px !important; border-radius: 12px !important; }
          .btn-primary, .btn-ghost { font-size: 13px; }
        }
        .modal-overlay > div {
          max-height: calc(100vh - 24px);
          max-height: calc(100dvh - 24px);
        }
        @supports (padding: env(safe-area-inset-bottom)) {
          .modal-overlay { padding-bottom: max(12px, env(safe-area-inset-bottom)) !important; }
        }
        input, select, textarea { font-family: var(--f-sans); outline: none; }
        input:focus, select:focus, textarea:focus { border-color: var(--c-ink) !important; }
      `}</style>

      <div className="grain"></div>

      {/* HEADER */}
      <header className="px-4 md:px-10 pt-5 md:pt-8 pb-4 max-w-6xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="serif italic text-xs md:text-sm" style={{ color: "var(--c-olive-dark)" }}>— quaderno di campagna —</p>
            <h1 className="display text-4xl md:text-6xl mt-1">Verde<span style={{ color: "var(--c-terra)" }}>Guida</span></h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--c-olive-dark)" }}>
              <Sun size={14}/> <span className="serif italic">{MESI[currentMonth]} · {new Date().getFullYear()}</span>
            </div>
            <button onClick={() => setShowSettings(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center transition"
              style={{ background: "var(--c-cream)", border: "1.5px solid var(--c-border)", cursor: "pointer" }}
              title="Impostazioni / Backup">
              <Settings size={16} style={{ color: "var(--c-ink)" }}/>
            </button>
          </div>
        </div>

        {/* SELETTORE APPEZZAMENTO ATTIVO */}
        {appezzamenti.length > 0 && (
          <div className="mt-5 flex items-center gap-2 overflow-x-auto scroll-hide pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
            <MapPin size={14} className="flex-shrink-0" style={{ color: "var(--c-olive-dark)" }}/>
            <span className="serif italic text-xs opacity-70 mr-1 flex-shrink-0">Appezzamento:</span>
            <button onClick={() => setActiveAppezzamentoId("all")}
              className={`chip clickable flex-shrink-0 ${activeAppezzamentoId === "all" ? "terra" : ""}`}>Tutti</button>
            {appezzamenti.map(a => (
              <button key={a.id} onClick={() => setActiveAppezzamentoId(a.id)}
                className={`chip clickable flex-shrink-0 ${activeAppezzamentoId === a.id ? "terra" : ""}`}>
                {TIPI_APPEZZAMENTO.find(t=>t.id===a.tipo)?.icon} {a.nome}
              </button>
            ))}
            <button onClick={() => { setEditingAppezzamento(null); setShowAppezzamentoModal(true); }}
              className="chip clickable flex-shrink-0" style={{ borderStyle: "dashed" }}>
              <Plus size={10}/> Aggiungi
            </button>
          </div>
        )}

        {/* NAV */}
        <nav className="mt-5 flex gap-2 overflow-x-auto scroll-hide pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
          {[
            { id: "home", label: "Il mio orto", icon: Sprout },
            { id: "agenda", label: "Questa settimana", icon: Clock },
            { id: "calendario", label: "Calendario", icon: Calendar },
            { id: "stagione", label: "Cosa piantare ora", icon: Leaf },
            { id: "catalogo", label: "Catalogo piante", icon: BookOpen },
            { id: "tecniche", label: "Tecniche & hack", icon: Lightbulb },
            { id: "pacciamatura", label: "Pacciamatura", icon: Layers },
            { id: "appezzamenti", label: "Appezzamenti", icon: MapPin },
          ].map(n => (
            <button key={n.id} onClick={() => setView(n.id)} className={`btn-ghost flex-shrink-0 ${view === n.id ? "active" : ""}`}>
              <n.icon size={14}/> {n.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="hairline mx-6 md:mx-10 max-w-6xl" style={{ marginLeft: "auto", marginRight: "auto" }}></div>

      <main className="px-4 md:px-10 py-6 md:py-8 max-w-6xl mx-auto">
        {view === "home" && <HomeView
          appezzamenti={appezzamenti}
          activeApp={activeApp}
          userPlants={plantsVisible}
          allAppezzamenti={appezzamenti}
          fullCatalog={fullCatalog}
          removePlant={removePlant}
          onEditPlant={(up) => setEditingPlant(up)}
          upcomingTasks={upcomingTasks}
          toggleTaskDone={toggleTaskDone}
          completedTasks={completedTasks}
          onAdd={() => setView("catalogo")}
          onAddAppezzamento={() => { setEditingAppezzamento(null); setShowAppezzamentoModal(true); }}
          plantsToSowNow={plantsToSowNow}
          currentMonth={currentMonth}
          onQuickAddPlant={openAddFromCatalog}
        />}

        {view === "agenda" && <AgendaView
          userPlants={plantsVisible}
          fullCatalog={fullCatalog}
          appezzamenti={appezzamenti}
        />}

        {view === "calendario" && <CalendarView
          tasks={allTasks}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          toggleTaskDone={toggleTaskDone}
          completedTasks={completedTasks}
          currentMonth={currentMonth}
          appezzamenti={appezzamenti}
        />}

        {view === "stagione" && <SeasonView
          plants={plantsToSowNow}
          currentMonth={currentMonth}
          onSelect={openAddFromCatalog}
          userPlants={plantsVisible}
          activeApp={activeApp}
        />}

        {view === "catalogo" && <CatalogView
          fullCatalog={fullCatalog}
          customPlants={customPlants}
          onSelect={openAddFromCatalog}
          userPlants={userPlants}
          activeApp={activeApp}
          onAddCustom={() => { setEditingCustomPlant(null); setShowCustomPlantModal(true); }}
          onEditCustom={(p) => { setEditingCustomPlant(p); setShowCustomPlantModal(true); }}
          onRemoveCustom={removeCustomPlant}
        />}

        {view === "tecniche" && <TecnicheView />}

        {view === "pacciamatura" && <PacciamaturaView activeApp={activeApp}/>}

        {view === "appezzamenti" && <AppezzamentiView
          appezzamenti={appezzamenti}
          onAdd={() => { setEditingAppezzamento(null); setShowAppezzamentoModal(true); }}
          onEdit={(a) => { setEditingAppezzamento(a); setShowAppezzamentoModal(true); }}
          onRemove={removeAppezzamento}
          userPlants={userPlants}
        />}
      </main>

      {showAddPlantModal && selectedPlant && (
        <AddPlantModal
          plant={selectedPlant}
          appezzamenti={appezzamenti}
          defaultAppezzamentoId={activeAppezzamentoId !== "all" ? activeAppezzamentoId : appezzamenti[0]?.id}
          onAdd={addPlant}
          onClose={() => { setShowAddPlantModal(false); setSelectedPlant(null); }}
          currentMonth={currentMonth}
        />
      )}

      {editingPlant && (
        <EditPlantModal
          userPlant={editingPlant}
          plant={fullCatalog.find(p => p.id === editingPlant.plantId)}
          appezzamenti={appezzamenti}
          onSave={updatePlant}
          onRemove={removePlant}
          onClose={() => setEditingPlant(null)}
          currentMonth={currentMonth}
        />
      )}

      {showAppezzamentoModal && (
        <AppezzamentoModal
          appezzamento={editingAppezzamento}
          onSave={editingAppezzamento ? (patch) => updateAppezzamento(editingAppezzamento.id, patch) : addAppezzamento}
          onClose={() => { setShowAppezzamentoModal(false); setEditingAppezzamento(null); }}
        />
      )}

      {showCustomPlantModal && (
        <CustomPlantModal
          editing={editingCustomPlant}
          onAdd={addCustomPlant}
          onUpdate={updateCustomPlant}
          onClose={() => { setShowCustomPlantModal(false); setEditingCustomPlant(null); }}
        />
      )}

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onExport={exportData}
          onImport={importData}
          onReset={resetAll}
          stats={{
            appezzamenti: appezzamenti.length,
            userPlants: userPlants.length,
            customPlants: customPlants.length,
          }}
        />
      )}

      <footer className="px-4 md:px-10 py-8 max-w-6xl mx-auto">
        <div className="hairline mb-4"></div>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="serif italic text-xs" style={{ color: "var(--c-olive-dark)" }}>
            «Chi pianta un albero pianta una speranza» — Lucy Larcom
          </p>
          <div className="text-[10px] opacity-50 font-mono">
            <span className="serif italic" style={{ fontStyle: "italic" }}>VerdeGuida</span> · v{APP_VERSION} · by Fandronius
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============================================================
// VIEW: HOME
// ============================================================
function HomeView({ appezzamenti, activeApp, userPlants, allAppezzamenti, fullCatalog, removePlant, onEditPlant, upcomingTasks, toggleTaskDone, completedTasks, onAdd, onAddAppezzamento, plantsToSowNow, currentMonth, onQuickAddPlant }) {

  // onboarding se nessun appezzamento
  if (appezzamenti.length === 0) {
    return (
      <div className="card text-center py-16 fade-up" style={{ maxWidth: "600px", margin: "0 auto" }}>
        <div className="text-6xl mb-4">🌍</div>
        <h2 className="display text-3xl mb-2">Benvenuto nell'orto.</h2>
        <p className="serif italic opacity-70 mb-6 max-w-md mx-auto">
          Per iniziare, crea il tuo primo appezzamento: può essere un terreno, un giardino, un balcone o una serra. Ti serve per ricevere consigli basati sul tuo microclima.
        </p>
        <button className="btn-primary" onClick={onAddAppezzamento}>
          <Plus size={16}/> Crea il primo appezzamento
        </button>
      </div>
    );
  }

  // riepilogo a colpo d'occhio: conteggio per nome + valore stimato raccolto
  const riepilogo = useMemo(() => {
    const map = new Map();
    let valoreTot = 0;
    let kgTot = 0;
    userPlants.forEach(up => {
      const cat = fullCatalog.find(p => p.id === up.plantId);
      if (!cat) return;
      const prev = map.get(cat.id) || { plant: cat, quantita: 0 };
      prev.quantita += up.quantita;
      map.set(cat.id, prev);
      if (cat.resaKg && cat.prezzoKg) {
        const kg = cat.resaKg * up.quantita;
        kgTot += kg;
        valoreTot += kg * cat.prezzoKg;
      }
    });
    return { items: Array.from(map.values()), valoreTot, kgTot };
  }, [userPlants, fullCatalog]);

  return (
    <div className="space-y-6">
      {/* RIEPILOGO A COLPO D'OCCHIO */}
      {userPlants.length > 0 && (
        <section className="fade-up">
          <div className="card" style={{ background: "var(--c-ink)", color: "var(--c-cream)", borderColor: "var(--c-ink)" }}>
            <div className="flex items-baseline justify-between flex-wrap gap-3 mb-4">
              <div>
                <p className="serif italic text-xs opacity-70">— il tuo orto in sintesi —</p>
                <h3 className="serif font-bold text-2xl">Cosa hai piantato</h3>
              </div>
              {riepilogo.valoreTot > 0 && (
                <div className="text-right">
                  <p className="text-xs opacity-70 serif italic">Valore stimato raccolto</p>
                  <p className="display text-3xl" style={{ color: "var(--c-ochre)" }}>€ {riepilogo.valoreTot.toFixed(0)}</p>
                  <p className="text-[10px] opacity-50">~{riepilogo.kgTot.toFixed(1)} kg · prezzi mercato medi</p>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {riepilogo.items.map(({ plant, quantita }) => {
                const val = plant.resaKg && plant.prezzoKg ? (plant.resaKg * quantita * plant.prezzoKg) : 0;
                return (
                  <div key={plant.id} className="px-3 py-2 rounded-full flex items-center gap-2" style={{ background: "var(--c-cream)", color: "var(--c-ink)" }}>
                    <span className="text-lg">{plant.emoji}</span>
                    <span className="font-bold text-sm">{plant.nome}</span>
                    <span className="text-xs opacity-70">× {quantita}</span>
                    {val > 0 && <span className="text-[10px] italic" style={{ color: "var(--c-olive-dark)" }}>~€{val.toFixed(0)}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <div className="grid md:grid-cols-3 gap-6">
      <section className="md:col-span-2 fade-up">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="display text-3xl">Le mie piante</h2>
          <span className="chip">{userPlants.length} {userPlants.length === 1 ? "pianta" : "piante"}</span>
        </div>

        {userPlants.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-5xl mb-3">🌾</div>
            <p className="serif text-xl mb-2">{activeApp ? `${activeApp.nome} è vuoto` : "Nessuna pianta ancora"}</p>
            <p className="text-sm mb-5 opacity-70">Inizia aggiungendo la prima pianta dal catalogo o dai consigli del mese.</p>
            <button className="btn-primary" onClick={onAdd}><Plus size={16}/> Aggiungi una pianta</button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {userPlants.map((up, i) => {
              const cat = fullCatalog.find(p => p.id === up.plantId);
              if (!cat) return null;
              const app = allAppezzamenti.find(a => a.id === up.appezzamentoId);
              return (
                <div key={up.id} className="card fade-up cursor-pointer hover:border-ink transition"
                  style={{ animationDelay: `${i * 50}ms` }} onClick={() => onEditPlant(up)}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-3xl">{cat.emoji}</div>
                    <button onClick={(e) => { e.stopPropagation(); removePlant(up.id); }} className="opacity-40 hover:opacity-100 transition">
                      <Trash2 size={14}/>
                    </button>
                  </div>
                  <h3 className="serif font-bold text-lg">{cat.nome}</h3>
                  <p className="text-xs opacity-70 leading-relaxed mt-1 line-clamp-2">{cat.descrizione}</p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    <span className="chip">Qtà: {up.quantita}</span>
                    <span className="chip olive">{cat.categoria}</span>
                    {app && <span className="chip">{TIPI_APPEZZAMENTO.find(t=>t.id===app.tipo)?.icon} {app.nome}</span>}
                  </div>
                  <div className="hairline my-3"></div>
                  <div className="text-xs opacity-70">
                    <span className="serif italic">{cat.categoria === "ornamentale" ? "Fioritura" : "Raccolta"}:</span> {cat.raccolta.map(m => MESI[m-1].slice(0,3)).join(", ") || "—"}
                  </div>
                  {up.note && <p className="text-xs mt-2 italic opacity-60">"{up.note}"</p>}
                  <p className="text-[10px] mt-2 opacity-40 serif italic">tocca per modificare →</p>
                </div>
              );
            })}
            <button onClick={onAdd} className="card flex flex-col items-center justify-center text-center transition" style={{ borderStyle: "dashed", minHeight: "200px", cursor: "pointer" }}>
              <Plus size={32} style={{ color: "var(--c-terra)" }}/>
              <span className="serif italic mt-2 text-sm">Aggiungi pianta</span>
            </button>
          </div>
        )}
      </section>

      {/* SIDEBAR */}
      <aside className="space-y-6 fade-up" style={{ animationDelay: "150ms" }}>
        {activeApp && (
          <div className="card-ornate p-4 card" style={{ background: "var(--c-cream)" }}>
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={14} style={{ color: "var(--c-olive-dark)" }}/>
              <p className="serif italic text-xs opacity-70">Stai lavorando su</p>
            </div>
            <h3 className="serif font-bold text-lg">{activeApp.nome}</h3>
            <p className="text-xs opacity-70 mt-1">{TIPI_APPEZZAMENTO.find(t=>t.id===activeApp.tipo)?.label}{activeApp.superficie ? ` · ${activeApp.superficie} m²` : ""}</p>
            {activeApp.localita && <p className="text-xs mt-1">📍 {activeApp.localita}</p>}
            {activeApp.microclima?.descrizione && (
              <p className="text-[11px] mt-2 pt-2 border-t italic" style={{ borderColor: "var(--c-border)", color: "var(--c-olive-dark)" }}>
                {activeApp.microclima.descrizione}
              </p>
            )}
          </div>
        )}

        <div className="card" style={{ background: "var(--c-ink)", color: "var(--c-cream)", borderColor: "var(--c-ink)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Bell size={16}/>
            <h3 className="serif font-bold text-lg">Prossimi interventi</h3>
          </div>
          {upcomingTasks.length === 0 ? (
            <p className="text-xs opacity-70 serif italic">Nessun intervento programmato.</p>
          ) : (
            <ul className="space-y-2">
              {upcomingTasks.map(t => (
                <li key={t.id} className="flex items-start gap-2 text-xs">
                  <button onClick={() => toggleTaskDone(t.id)} className="mt-0.5">
                    {completedTasks[t.id] ? <CheckCircle2 size={14}/> : <Circle size={14} className="opacity-50"/>}
                  </button>
                  <div className="flex-1">
                    <p className={`font-medium ${completedTasks[t.id] ? "line-through opacity-50" : ""}`}>
                      {t.icon} {t.titolo}
                    </p>
                    <p className="opacity-60 text-[10px]">{MESI[t.mese-1]}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* COSA PIANTARE ORA — ora cliccabile */}
        <div className="card-ornate p-5 card">
          <div className="flex items-center gap-2 mb-2">
            <Leaf size={16} style={{ color: "var(--c-olive-dark)" }}/>
            <h3 className="serif font-bold text-base">Nel mese di {MESI[currentMonth]}</h3>
          </div>
          <p className="text-xs opacity-70 mb-3">Tocca una pianta per aggiungerla:</p>
          <div className="flex flex-wrap gap-1.5">
            {plantsToSowNow.slice(0, 12).map(p => (
              <button key={p.id} className="chip clickable" title={`Aggiungi ${p.nome}`} onClick={() => onQuickAddPlant(p)}>
                {p.emoji} {p.nome}
              </button>
            ))}
            {plantsToSowNow.length === 0 && <p className="text-xs italic opacity-60">Periodo di riposo per semine.</p>}
          </div>
        </div>

        <div className="card-ornate p-5 card" style={{ background: `linear-gradient(135deg, var(--c-ochre) 0%, var(--c-terra) 100%)`, color: "var(--c-cream)", borderColor: "transparent" }}>
          <p className="serif italic text-xs opacity-90">Consiglio del mese</p>
          <p className="serif font-bold text-lg leading-tight mt-1">{getTipOfMonth(currentMonth)}</p>
        </div>
      </aside>
      </div>
    </div>
  );
}

function getTipOfMonth(m) {
  const tips = [
    "Potatura invernale e pianificazione dell'orto",
    "Preparazione delle semenzaie al riparo",
    "Prime semine all'aperto: piselli, fave, insalate",
    "Trapianti in piena terra, attenzione alle ultime gelate",
    "Mese d'oro per l'orto: semina tutto ciò che ami",
    "Inizia la raccolta estiva, pacciama per risparmiare acqua",
    "Irrigazione al mattino presto e raccolta quotidiana",
    "Raccolta abbondante, prepara le conserve",
    "Semina autunnale di insalate, rape, spinaci",
    "Raccolta di olive, castagne e frutti tardivi",
    "Prepara il terreno per l'inverno, pianta alberi",
    "Riposo dell'orto, cura gli attrezzi e progetta"
  ];
  return tips[m];
}

// ============================================================
// VIEW: CALENDARIO
// ============================================================
function CalendarView({ tasks, selectedMonth, setSelectedMonth, toggleTaskDone, completedTasks, currentMonth, appezzamenti }) {
  const [hiddenTypes, setHiddenTypes] = useState(new Set());
  const toggleType = (t) => {
    setHiddenTypes(prev => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t); else next.add(t);
      return next;
    });
  };

  const monthTasks = tasks.filter(t => t.mese === selectedMonth + 1 && !hiddenTypes.has(t.type));
  const grouped = monthTasks.reduce((acc, t) => {
    acc[t.type] = acc[t.type] || [];
    acc[t.type].push(t);
    return acc;
  }, {});

  const typeLabels = {
    semina: { label: "Semina", icon: Sprout, color: "var(--c-olive)" },
    trapianto: { label: "Trapianto", icon: Leaf, color: "var(--c-olive-dark)" },
    raccolta: { label: "Raccolta", icon: Sun, color: "var(--c-ochre)" },
    irrigazione: { label: "Irrigazione", icon: Droplets, color: "#4a6fa5" },
    potatura: { label: "Potatura", icon: Scissors, color: "var(--c-terra)" },
  };

  // count per tipo nel mese (totale, anche se nascosti)
  const allMonthTasks = tasks.filter(t => t.mese === selectedMonth + 1);
  const countsByType = allMonthTasks.reduce((acc, t) => {
    acc[t.type] = (acc[t.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="fade-up">
      <h2 className="display text-4xl mb-2">Calendario <span style={{ color: "var(--c-olive-dark)" }}>agricolo</span></h2>
      <p className="serif italic opacity-70 mb-6">Gli interventi programmati, adattati al microclima dei tuoi appezzamenti.</p>

      <div className="flex gap-2 overflow-x-auto scroll-hide mb-4 pb-2">
        {MESI.map((m, i) => {
          const count = tasks.filter(t => t.mese === i + 1).length;
          const isActive = i === selectedMonth;
          const isCurrent = i === currentMonth;
          return (
            <button key={m} onClick={() => setSelectedMonth(i)}
              className="flex-shrink-0 px-4 py-3 rounded-xl transition relative min-w-[90px]"
              style={{
                background: isActive ? "var(--c-ink)" : "var(--c-cream)",
                color: isActive ? "var(--c-cream)" : "var(--c-ink)",
                border: `1.5px solid ${isActive ? "var(--c-ink)" : "var(--c-border)"}`,
                cursor: "pointer",
              }}>
              {isCurrent && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ background: "var(--c-terra)" }}></span>}
              <div className="serif text-xs opacity-70 uppercase tracking-wider">{m.slice(0,3)}</div>
              <div className="text-lg font-bold mt-0.5">{count}</div>
              <div className="text-[9px] opacity-60">interventi</div>
            </button>
          );
        })}
      </div>

      {/* TOGGLE FILTRI TIPO */}
      {Object.keys(countsByType).length > 0 && (
        <div className="mb-6">
          <p className="text-[10px] uppercase tracking-wider opacity-60 font-bold mb-2">Mostra / nascondi</p>
          <div className="flex gap-2 overflow-x-auto scroll-hide pb-1">
            {Object.entries(typeLabels).map(([t, meta]) => {
              const count = countsByType[t] || 0;
              if (count === 0) return null;
              const hidden = hiddenTypes.has(t);
              const Icon = meta.icon;
              return (
                <button key={t} onClick={() => toggleType(t)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition"
                  style={{
                    background: hidden ? "transparent" : meta.color,
                    color: hidden ? "var(--c-ink)" : "var(--c-cream)",
                    border: `1.5px solid ${meta.color}`,
                    opacity: hidden ? 0.5 : 1,
                    cursor: "pointer",
                    textDecoration: hidden ? "line-through" : "none",
                  }}>
                  <Icon size={12}/>
                  {meta.label} · {count}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {monthTasks.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">🪴</p>
          <p className="serif text-lg">Nessun intervento in {MESI[selectedMonth]}.</p>
          <p className="text-xs opacity-70 mt-2">Aggiungi piante al tuo orto per vederli qui.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([type, list]) => {
            const meta = typeLabels[type];
            const Icon = meta.icon;
            return (
              <section key={type}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: meta.color, color: "var(--c-cream)" }}>
                    <Icon size={16}/>
                  </div>
                  <h3 className="serif text-xl font-bold">{meta.label}</h3>
                  <span className="chip">{list.length}</span>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {list.map(t => {
                    const app = appezzamenti.find(a => a.id === t.appezzamentoId);
                    return (
                      <div key={t.id} className="card" style={{ opacity: completedTasks[t.id] ? 0.5 : 1 }}>
                        <div className="flex items-start gap-3">
                          <button onClick={() => toggleTaskDone(t.id)} className="mt-0.5">
                            {completedTasks[t.id] ? <CheckCircle2 size={20} style={{ color: "var(--c-olive)" }}/> : <Circle size={20} className="opacity-40"/>}
                          </button>
                          <div className="flex-1">
                            <p className={`serif font-bold ${completedTasks[t.id] ? "line-through" : ""}`}>
                              {t.plantEmoji} {t.titolo}
                            </p>
                            <p className="text-xs opacity-70 mt-1">{t.descrizione}</p>
                            {app && <p className="text-[10px] opacity-50 mt-1">📍 {app.nome}</p>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// VIEW: STAGIONE
// ============================================================
function SeasonView({ plants, currentMonth, onSelect, userPlants, activeApp }) {
  const orti = plants.filter(p => p.categoria === "orto");
  const frutteto = plants.filter(p => p.categoria === "frutteto");
  const owned = new Set(userPlants.map(up => up.plantId));

  return (
    <div className="fade-up">
      <div className="flex items-baseline gap-3 mb-2 flex-wrap">
        <h2 className="display text-4xl">Cosa piantare</h2>
        <span className="serif italic text-xl" style={{ color: "var(--c-olive-dark)" }}>in {MESI[currentMonth].toLowerCase()}</span>
      </div>
      <p className="serif italic opacity-70 mb-2">Consigli per il clima mediterraneo italiano.</p>
      {activeApp?.microclima?.descrizione && (
        <p className="text-xs mb-6 opacity-60">🌐 {activeApp.localita} — {activeApp.microclima.descrizione}</p>
      )}

      {plants.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">❄️</p>
          <p className="serif text-lg">Periodo di riposo vegetativo.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {orti.length > 0 && (
            <section>
              <h3 className="serif font-bold text-2xl mb-4 flex items-center gap-2">
                <span style={{ color: "var(--c-olive)" }}>◆</span> Orto
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {orti.map(p => <SeasonPlantCard key={p.id} plant={p} onSelect={onSelect} owned={owned.has(p.id)} currentMonth={currentMonth}/>)}
              </div>
            </section>
          )}
          {frutteto.length > 0 && (
            <section>
              <h3 className="serif font-bold text-2xl mb-4 flex items-center gap-2">
                <span style={{ color: "var(--c-terra)" }}>◆</span> Frutteto
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {frutteto.map(p => <SeasonPlantCard key={p.id} plant={p} onSelect={onSelect} owned={owned.has(p.id)} currentMonth={currentMonth}/>)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function SeasonPlantCard({ plant, onSelect, owned, currentMonth }) {
  const action = plant.semina.includes(currentMonth + 1) ? "Semina" : "Trapianto";
  return (
    <div className="card hover:border-ink transition cursor-pointer" onClick={() => !owned && onSelect(plant)}>
      <div className="flex items-start justify-between">
        <div className="text-3xl">{plant.emoji}</div>
        <span className="chip terra">{action}</span>
      </div>
      <h4 className="serif font-bold text-lg mt-2">{plant.nome}</h4>
      <p className="text-xs opacity-70 mt-1 line-clamp-2">{plant.descrizione}</p>
      <div className="hairline my-3"></div>
      {owned ? (
        <span className="text-xs italic opacity-60 flex items-center gap-1"><CheckCircle2 size={12}/> già nel tuo orto</span>
      ) : (
        <button onClick={(e) => { e.stopPropagation(); onSelect(plant); }}
          className="text-xs font-bold flex items-center gap-1" style={{ color: "var(--c-terra)" }}>
          <Plus size={12}/> Aggiungi
        </button>
      )}
    </div>
  );
}

// ============================================================
// VIEW: CATALOGO
// ============================================================
function CatalogView({ fullCatalog, customPlants, onSelect, userPlants, activeApp, onAddCustom, onEditCustom, onRemoveCustom }) {
  const [filter, setFilter] = useState("tutti");
  const list = filter === "tutti" ? fullCatalog
    : filter === "custom" ? customPlants
    : fullCatalog.filter(p => p.categoria === filter);
  const isVaso = activeApp && IN_VASO.has(activeApp.tipo);

  return (
    <div className="fade-up">
      <div className="flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <h2 className="display text-4xl">Catalogo <span style={{ color: "var(--c-terra)" }}>piante</span></h2>
          <p className="serif italic opacity-70 mt-1">Seleziona una pianta per aggiungerla, oppure crea la tua nuova pianta.</p>
        </div>
        <button className="btn-primary" onClick={onAddCustom}><Plus size={14}/> Nuova pianta</button>
      </div>

      <div className="flex gap-2 my-6 flex-wrap">
        {[
          { id: "tutti", label: "Tutti" },
          { id: "orto", label: "Orto" },
          { id: "frutteto", label: "Frutteto" },
          { id: "ornamentale", label: "Ornamentali" },
          { id: "custom", label: `Nuove (${customPlants.length})` },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={`btn-ghost ${filter === f.id ? "active" : ""}`}>
            {f.label}
          </button>
        ))}
      </div>

      {filter === "custom" && customPlants.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-5xl mb-3">🌸</div>
          <p className="serif text-lg mb-2">Nessuna nuova pianta ancora.</p>
          <p className="text-xs opacity-70 mb-5">Crea nuove piante: fiori ornamentali, varietà locali, piante esotiche non già nel catalogo base.</p>
          <button className="btn-primary" onClick={onAddCustom}><Plus size={14}/> Crea nuova pianta</button>
        </div>
      ) : (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {list.map(p => {
          const ownedCount = userPlants.filter(up => up.plantId === p.id).length;
          const notFitVaso = isVaso && !p.vasoOk;
          return (
            <div key={p.id} className="card" style={{ opacity: notFitVaso ? 0.5 : 1, position: "relative", cursor: p.custom ? "pointer" : "default" }}
              onClick={p.custom ? () => onEditCustom(p) : undefined}>
              {p.custom && (
                <button onClick={(e) => { e.stopPropagation(); if (confirm(`Eliminare "${p.nome}" dal catalogo? Verranno rimosse anche le istanze piantate.`)) onRemoveCustom(p.id); }}
                  className="absolute top-3 right-3 opacity-40 hover:opacity-100" title="Elimina nuova pianta">
                  <Trash2 size={14}/>
                </button>
              )}
              <div className="flex items-start justify-between">
                <div className="text-4xl">{p.emoji}</div>
                <span className={`chip ${p.categoria === "frutteto" ? "terra" : p.categoria === "ornamentale" ? "ochre" : "olive"}`}>
                  {p.custom && "✎ "}{p.categoria}
                </span>
              </div>
              <h4 className="serif font-bold text-lg mt-2">{p.nome}</h4>
              {p.nomeScientifico && <p className="text-[10px] italic opacity-50">{p.nomeScientifico}</p>}
              <p className="text-xs opacity-70 mt-1 leading-relaxed">{p.descrizione}</p>
              <div className="flex flex-wrap gap-1 mt-3">
                <span className="chip">💧 {p.acqua}</span>
                <span className="chip">☀ {p.sole}</span>
                <span className="chip">{p.difficolta}</span>
              </div>
              <div className="hairline my-3"></div>
              {notFitVaso ? (
                <p className="text-xs italic opacity-60">Non adatta a coltivazione in vaso</p>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  {ownedCount > 0 && <span className="text-xs italic opacity-60">hai già {ownedCount}</span>}
                  <button onClick={(e) => { e.stopPropagation(); onSelect(p); }} className="btn-primary text-xs ml-auto" style={{ padding: "6px 14px" }}>
                    <Plus size={12}/> Aggiungi
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}

// ============================================================
// VIEW: APPEZZAMENTI
// ============================================================
function AppezzamentiView({ appezzamenti, onAdd, onEdit, onRemove, userPlants }) {
  return (
    <div className="fade-up">
      <div className="flex items-baseline justify-between mb-2 flex-wrap gap-4">
        <div>
          <h2 className="display text-4xl">I miei <span style={{ color: "var(--c-olive-dark)" }}>appezzamenti</span></h2>
          <p className="serif italic opacity-70 mt-1">Ogni spazio ha il suo microclima e le sue piante.</p>
        </div>
        <button className="btn-primary" onClick={onAdd}><Plus size={14}/> Nuovo appezzamento</button>
      </div>

      {appezzamenti.length === 0 ? (
        <div className="card text-center py-12 mt-6">
          <div className="text-5xl mb-3">🌍</div>
          <p className="serif text-lg">Nessun appezzamento ancora.</p>
          <p className="text-xs opacity-70 mt-2">Crea il primo per iniziare.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {appezzamenti.map(a => {
            const tipo = TIPI_APPEZZAMENTO.find(t => t.id === a.tipo);
            const plantCount = userPlants.filter(p => p.appezzamentoId === a.id).length;
            return (
              <div key={a.id} className="card cursor-pointer hover:border-ink transition" onClick={() => onEdit(a)}>
                <div className="flex items-start justify-between mb-2">
                  <div className="text-4xl">{tipo?.icon}</div>
                  <button onClick={(e) => { e.stopPropagation(); if (confirm(`Eliminare "${a.nome}"? Verranno rimosse anche le ${plantCount} piante associate.`)) onRemove(a.id); }}
                    className="opacity-40 hover:opacity-100"><Trash2 size={14}/></button>
                </div>
                <h3 className="serif font-bold text-xl">{a.nome}</h3>
                <p className="text-xs opacity-70 mt-1">{tipo?.label}{a.superficie ? ` · ${a.superficie} m²` : ""}</p>
                {a.localita && <p className="text-xs mt-2 flex items-center gap-1"><MapPin size={10}/> {a.localita}</p>}
                <div className="hairline my-3"></div>
                <div className="flex items-center justify-between">
                  <span className="chip">{plantCount} {plantCount === 1 ? "pianta" : "piante"}</span>
                  <span className="text-[10px] opacity-50 italic flex items-center gap-1"><Edit3 size={10}/> modifica</span>
                </div>
                {a.microclima?.descrizione && (
                  <p className="text-[11px] mt-3 pt-3 border-t italic" style={{ borderColor: "var(--c-border)", color: "var(--c-olive-dark)" }}>
                    🌐 {a.microclima.zona} · {a.microclima.descrizione}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// MODAL: APPEZZAMENTO (create / edit)
// ============================================================
function AppezzamentoModal({ appezzamento, onSave, onClose }) {
  const isEdit = !!appezzamento;
  const [nome, setNome] = useState(appezzamento?.nome || "");
  const [tipo, setTipo] = useState(appezzamento?.tipo || "terreno");
  const [superficie, setSuperficie] = useState(appezzamento?.superficie || "");
  const [hasSerra, setHasSerra] = useState(appezzamento?.hasSerra || false);
  const [hasIdroponica, setHasIdroponica] = useState(appezzamento?.hasIdroponica || false);
  const [hasRialzato, setHasRialzato] = useState(appezzamento?.hasRialzato || false);
  const [localitaQuery, setLocalitaQuery] = useState(appezzamento?.localita || "");
  const [localitaResults, setLocalitaResults] = useState([]);
  const [localitaSelected, setLocalitaSelected] = useState(appezzamento ? {
    nome: appezzamento.localita,
    lat: appezzamento.lat,
    lon: appezzamento.lon,
    altitudine: appezzamento.altitudine,
  } : null);
  const [searching, setSearching] = useState(false);

  const cercaLocalita = async () => {
    if (!localitaQuery.trim()) return;
    setSearching(true);
    const results = await geocodificaLocalita(localitaQuery);
    setLocalitaResults(results);
    setSearching(false);
  };

  const selectLocalita = (r) => {
    setLocalitaSelected({
      nome: `${r.name}${r.admin2 ? ", " + r.admin2 : ""}`,
      lat: r.latitude,
      lon: r.longitude,
      altitudine: r.elevation || 100,
    });
    setLocalitaQuery(`${r.name}${r.admin2 ? ", " + r.admin2 : ""}`);
    setLocalitaResults([]);
  };

  const microclimaPreview = localitaSelected ? calcoloMicroclima(localitaSelected.lat, localitaSelected.altitudine) : null;

  const handleSave = () => {
    if (!nome.trim()) return;
    const payload = {
      ...(isEdit ? appezzamento : { id: `app_${Date.now()}` }),
      nome: nome.trim(),
      tipo,
      superficie: superficie ? parseFloat(superficie) : null,
      hasSerra,
      hasIdroponica,
      hasRialzato,
      localita: localitaSelected?.nome || "",
      lat: localitaSelected?.lat || null,
      lon: localitaSelected?.lon || null,
      altitudine: localitaSelected?.altitudine || null,
      microclima: microclimaPreview,
    };
    onSave(isEdit ? payload : payload);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(42,36,24,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "12px" }} className="modal-overlay" onClick={onClose}>
      <div className="card" style={{ maxWidth: "550px", width: "100%", background: "var(--c-bg)", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="serif italic text-xs" style={{ color: "var(--c-olive-dark)" }}>— {isEdit ? "modifica" : "nuovo"} appezzamento —</p>
            <h3 className="display text-3xl mt-1">{isEdit ? appezzamento.nome : "Crea appezzamento"}</h3>
          </div>
          <button onClick={onClose} className="opacity-60 hover:opacity-100"><X size={20}/></button>
        </div>

        <label className="block mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider opacity-70">Nome</span>
          <input type="text" value={nome} onChange={(e) => setNome(e.target.value)}
            placeholder="Es: Orto grande, Terrazza, Oliveto..."
            className="w-full mt-1 px-3 py-2 rounded-lg" style={{ border: "1.5px solid var(--c-border)", background: "var(--c-cream)" }}/>
        </label>

        <div className="mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider opacity-70">Tipo</span>
          <div className="grid grid-cols-3 gap-2 mt-1">
            {TIPI_APPEZZAMENTO.map(t => (
              <button key={t.id} type="button" onClick={() => setTipo(t.id)}
                className="card p-3 text-center transition"
                style={{
                  background: tipo === t.id ? "var(--c-ink)" : "var(--c-cream)",
                  color: tipo === t.id ? "var(--c-cream)" : "var(--c-ink)",
                  borderColor: tipo === t.id ? "var(--c-ink)" : "var(--c-border)",
                  cursor: "pointer",
                }}>
                <div className="text-2xl">{t.icon}</div>
                <div className="text-xs font-bold mt-1">{t.label}</div>
              </button>
            ))}
          </div>
          <p className="text-[11px] mt-2 opacity-60 italic">{TIPI_APPEZZAMENTO.find(t => t.id === tipo)?.desc}</p>
        </div>

        <label className="block mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider opacity-70">Superficie (m², opzionale)</span>
          <input type="number" value={superficie} onChange={(e) => setSuperficie(e.target.value)}
            placeholder="Es: 50"
            className="w-full mt-1 px-3 py-2 rounded-lg" style={{ border: "1.5px solid var(--c-border)", background: "var(--c-cream)" }}/>
        </label>

        {/* CARATTERISTICHE AGGIUNTIVE */}
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">Caratteristiche</p>
          <p className="text-[11px] opacity-60 italic mb-2">Seleziona quello che hai a disposizione (migliora i consigli stagionali)</p>
          <div className="space-y-2">
            <label className="card p-3 flex items-start gap-3 cursor-pointer" style={{
              background: hasSerra ? "var(--c-olive)" : "var(--c-cream)",
              borderColor: hasSerra ? "var(--c-olive)" : "var(--c-border)",
              color: hasSerra ? "var(--c-cream)" : "var(--c-ink)",
            }}>
              <input type="checkbox" checked={hasSerra} onChange={(e) => setHasSerra(e.target.checked)}
                className="mt-1 flex-shrink-0"/>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏕️</span>
                  <span className="serif font-bold text-sm">Ho una serra / tunnel</span>
                </div>
                <p className="text-[11px] opacity-80 mt-1">Permette di anticipare semine e trapianti di ~3-4 settimane e proteggere le colture dal freddo.</p>
              </div>
            </label>

            <label className="card p-3 flex items-start gap-3 cursor-pointer" style={{
              background: hasIdroponica ? "var(--c-olive)" : "var(--c-cream)",
              borderColor: hasIdroponica ? "var(--c-olive)" : "var(--c-border)",
              color: hasIdroponica ? "var(--c-cream)" : "var(--c-ink)",
            }}>
              <input type="checkbox" checked={hasIdroponica} onChange={(e) => setHasIdroponica(e.target.checked)}
                className="mt-1 flex-shrink-0"/>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💧</span>
                  <span className="serif font-bold text-sm">Coltivazione idroponica</span>
                </div>
                <p className="text-[11px] opacity-80 mt-1">Coltivi piante in acqua con nutrienti, senza terra. Niente problemi di stagionalità all'interno.</p>
              </div>
            </label>

            <label className="card p-3 flex items-start gap-3 cursor-pointer" style={{
              background: hasRialzato ? "var(--c-olive)" : "var(--c-cream)",
              borderColor: hasRialzato ? "var(--c-olive)" : "var(--c-border)",
              color: hasRialzato ? "var(--c-cream)" : "var(--c-ink)",
            }}>
              <input type="checkbox" checked={hasRialzato} onChange={(e) => setHasRialzato(e.target.checked)}
                className="mt-1 flex-shrink-0"/>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🟫</span>
                  <span className="serif font-bold text-sm">Bancali / aiuole rialzate</span>
                </div>
                <p className="text-[11px] opacity-80 mt-1">Il terreno si riscalda prima in primavera e drena meglio. Ottimo per zone umide.</p>
              </div>
            </label>
          </div>
        </div>

        <div className="mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider opacity-70">Località</span>
          <p className="text-[11px] opacity-60 italic mt-0.5 mb-1">Serve a calcolare il microclima (shift stagionale)</p>
          <div className="flex gap-2 mt-1">
            <input type="text" value={localitaQuery}
              onChange={(e) => { setLocalitaQuery(e.target.value); setLocalitaSelected(null); }}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), cercaLocalita())}
              placeholder="Es: Piana degli Albanesi"
              className="flex-1 px-3 py-2 rounded-lg" style={{ border: "1.5px solid var(--c-border)", background: "var(--c-cream)" }}/>
            <button type="button" onClick={cercaLocalita} disabled={searching} className="btn-ghost">
              {searching ? "..." : "Cerca"}
            </button>
          </div>

          {localitaResults.length > 0 && (
            <div className="mt-2 card p-2" style={{ background: "var(--c-cream)" }}>
              {localitaResults.map((r, i) => (
                <button key={i} type="button" onClick={() => selectLocalita(r)}
                  className="w-full text-left p-2 rounded text-xs hover:bg-white transition" style={{ cursor: "pointer" }}>
                  <div className="font-bold">{r.name}</div>
                  <div className="opacity-60">{[r.admin2, r.admin1, r.country].filter(Boolean).join(" · ")} · {r.elevation}m slm</div>
                </button>
              ))}
            </div>
          )}

          {localitaSelected && microclimaPreview && (
            <div className="mt-3 p-3 rounded-lg" style={{ background: "var(--c-olive)", color: "var(--c-cream)" }}>
              <p className="text-xs serif italic">Microclima calcolato</p>
              <p className="font-bold text-sm mt-0.5">{microclimaPreview.zona}</p>
              <p className="text-xs opacity-80 mt-1">{microclimaPreview.descrizione}</p>
              <p className="text-[10px] opacity-60 mt-2">Lat: {localitaSelected.lat.toFixed(3)} · Alt: {localitaSelected.altitudine}m</p>
            </div>
          )}
        </div>

        <div className="hairline mb-4"></div>

        <div className="flex gap-2">
          <button className="btn-ghost flex-1" onClick={onClose}>Annulla</button>
          <button className="btn-primary flex-1 justify-center" onClick={handleSave} disabled={!nome.trim()}>
            {isEdit ? "Salva" : "Crea appezzamento"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MODAL: AGGIUNGI PIANTA
// ============================================================
function AddPlantModal({ plant, appezzamenti, defaultAppezzamentoId, onAdd, onClose, currentMonth }) {
  const [quantita, setQuantita] = useState(1);
  const [note, setNote] = useState("");
  const [appezzamentoId, setAppezzamentoId] = useState(defaultAppezzamentoId || appezzamenti[0]?.id);
  const [confirmOutOfSeason, setConfirmOutOfSeason] = useState(false);

  const selectedApp = appezzamenti.find(a => a.id === appezzamentoId);
  const irrigazione = selectedApp ? calcolaIrrigazione(plant, selectedApp.tipo, currentMonth + 1) : null;
  const shiftSett = effectiveShift(selectedApp);
  const seminaShifted = shiftMesi(plant.semina, shiftSett);
  const trapiantoShifted = shiftMesi(plant.trapianto, shiftSett);
  const raccoltaShifted = shiftMesi(plant.raccolta, shiftSett);
  const isVaso = selectedApp && IN_VASO.has(selectedApp.tipo);
  const notFit = isVaso && !plant.vasoOk;

  // ===== FUORI STAGIONE =====
  const mese = currentMonth + 1;
  const mesiValidi = new Set([...seminaShifted, ...trapiantoShifted]);
  // se la pianta non ha mesi di semina/trapianto (es. pianta perenne che non si semina), non mostro warning
  const haPeriodi = mesiValidi.size > 0;
  const isInSeason = mesiValidi.has(mese);
  // calcolo distanza dal mese valido più vicino per dare un suggerimento
  const distanzaDaValido = haPeriodi && !isInSeason
    ? Math.min(...Array.from(mesiValidi).map(m => {
        const diff = Math.abs(m - mese);
        return Math.min(diff, 12 - diff);
      }))
    : 0;
  const fuoriStagione = haPeriodi && !isInSeason;
  // appezzamento con serra ammorbidisce un po' il warning, idroponica lo annulla
  const hasSerra = selectedApp?.hasSerra || selectedApp?.tipo === "serra";
  const hasIdroponica = selectedApp?.hasIdroponica;
  const fuoriStagioneEffettivo = fuoriStagione && !hasIdroponica;

  const mesiValidiList = Array.from(mesiValidi).sort((a,b) => a-b).map(m => MESI[m-1]);
  const prossimoMeseValido = Array.from(mesiValidi).sort((a,b) => {
    const da = a >= mese ? a - mese : 12 + a - mese;
    const db = b >= mese ? b - mese : 12 + b - mese;
    return da - db;
  })[0];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(42,36,24,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "12px" }} className="modal-overlay" onClick={onClose}>
      <div className="card" style={{ maxWidth: "550px", width: "100%", background: "var(--c-bg)", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-5xl">{plant.emoji}</div>
            <h3 className="display text-3xl mt-2">{plant.nome}</h3>
            <p className="chip mt-1" style={{ background: plant.categoria === "frutteto" ? "var(--c-terra)" : "var(--c-olive)", color: "var(--c-cream)", borderColor: "transparent" }}>{plant.categoria}</p>
          </div>
          <button onClick={onClose} className="opacity-60 hover:opacity-100"><X size={20}/></button>
        </div>

        <p className="text-sm leading-relaxed opacity-80 mb-4">{plant.descrizione}</p>

        <label className="block mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider opacity-70">Appezzamento</span>
          <select value={appezzamentoId} onChange={(e) => setAppezzamentoId(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-lg" style={{ border: "1.5px solid var(--c-border)", background: "var(--c-cream)" }}>
            {appezzamenti.map(a => (
              <option key={a.id} value={a.id}>{TIPI_APPEZZAMENTO.find(t=>t.id===a.tipo)?.icon} {a.nome}</option>
            ))}
          </select>
        </label>

        {notFit && (
          <div className="card p-3 mb-4" style={{ background: "#fff3cd", borderColor: "#d4a73b" }}>
            <p className="text-xs serif"><b>⚠️ Attenzione:</b> {plant.nome} non è adatta alla coltivazione in vaso. Considera un altro appezzamento o una varietà nana.</p>
          </div>
        )}

        {fuoriStagioneEffettivo && (
          <div className="card p-4 mb-4" style={{
            background: hasSerra ? "#fff3cd" : "#ffe0e0",
            borderColor: hasSerra ? "#d4a73b" : "#c83737",
            borderWidth: "2px"
          }}>
            <div className="flex items-start gap-3">
              <AlertTriangle size={24} style={{ color: hasSerra ? "#b45309" : "#c83737", flexShrink: 0 }} className="mt-0.5"/>
              <div className="flex-1">
                <p className="serif font-bold text-base mb-1" style={{ color: hasSerra ? "#b45309" : "#c83737" }}>
                  {hasSerra ? "Fuori stagione (ma hai una serra)" : "Sei FUORI STAGIONE"}
                </p>
                <p className="text-xs leading-relaxed opacity-90 mb-2">
                  {hasSerra
                    ? <>Siamo a <b>{MESI[currentMonth]}</b>, ma {plant.nome} va seminata/trapiantata normalmente in <b>{mesiValidiList.join(", ")}</b>. Con la serra puoi comunque provarci, anticipando leggermente la stagione. Fai attenzione alle temperature notturne.</>
                    : <>Siamo a <b>{MESI[currentMonth]}</b>, ma {plant.nome} si semina/trapianta in <b>{mesiValidiList.join(", ")}</b>. Piantarla adesso significa quasi certamente <b>vederla morire</b> o comunque non produrre.</>
                  }
                </p>
                {!hasSerra && prossimoMeseValido && (
                  <p className="text-xs serif italic" style={{ color: "#c83737" }}>
                    💡 Il prossimo periodo buono inizia a <b>{MESI[prossimoMeseValido - 1]}</b>
                    {distanzaDaValido === 1 ? " (il mese prossimo!)" : distanzaDaValido <= 3 ? ` (tra ${distanzaDaValido} mesi)` : ""}.
                    Aspetta, il tuo orto ti ringrazierà.
                  </p>
                )}
                {!hasSerra && (
                  <label className="flex items-start gap-2 mt-3 p-2 rounded cursor-pointer" style={{ background: "rgba(200,55,55,0.1)" }}>
                    <input type="checkbox" checked={confirmOutOfSeason} onChange={(e) => setConfirmOutOfSeason(e.target.checked)}
                      className="mt-0.5 flex-shrink-0"/>
                    <span className="text-[11px] serif italic opacity-80">
                      Capisco che sto piantando fuori stagione e che il raccolto potrebbe fallire. Voglio procedere comunque.
                    </span>
                  </label>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="card p-3">
            <p className="text-[10px] uppercase tracking-wider opacity-60">Acqua</p>
            <p className="serif font-bold capitalize">💧 {plant.acqua}</p>
          </div>
          <div className="card p-3">
            <p className="text-[10px] uppercase tracking-wider opacity-60">Sole</p>
            <p className="serif font-bold capitalize">☀ {plant.sole}</p>
          </div>
          <div className="card p-3">
            <p className="text-[10px] uppercase tracking-wider opacity-60">Difficoltà</p>
            <p className="serif font-bold capitalize">{plant.difficolta}</p>
          </div>
          <div className="card p-3">
            <p className="text-[10px] uppercase tracking-wider opacity-60">Spazio</p>
            <p className="serif font-bold text-sm">{plant.spazio}</p>
          </div>
        </div>

        {irrigazione && (
          <div className="card p-3 mb-4" style={{ background: "#e8f0f5", borderColor: "#4a6fa5" }}>
            <div className="flex items-center gap-2 mb-1">
              <Droplets size={14} style={{ color: "#4a6fa5" }}/>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#4a6fa5" }}>Irrigazione suggerita (in {MESI[currentMonth]})</p>
            </div>
            <p className="text-sm"><b>{irrigazione.freqLabel}</b>, {irrigazione.volLabel}</p>
            {isVaso && <p className="text-[11px] opacity-70 mt-1 italic">Frequenza aumentata per coltivazione in vaso</p>}
          </div>
        )}

        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-wider opacity-60 mb-1">Calendario {shiftSett !== 0 ? "(adattato al microclima)" : ""}</p>
          <div className="space-y-1 text-xs">
            {seminaShifted.length > 0 && <p><b className="serif">Semina:</b> {seminaShifted.map(m => MESI[m-1]).join(", ")}</p>}
            {trapiantoShifted.length > 0 && <p><b className="serif">Trapianto:</b> {trapiantoShifted.map(m => MESI[m-1]).join(", ")}</p>}
            <p><b className="serif">{plant.categoria === "ornamentale" ? "Fioritura" : "Raccolta"}:</b> {raccoltaShifted.map(m => MESI[m-1]).join(", ")}</p>
          </div>
        </div>

        <div className="hairline mb-4"></div>

        <label className="block mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider opacity-70">Quantità (n° piante)</span>
          <div className="flex items-center gap-2 mt-1">
            <button type="button" onClick={() => setQuantita(Math.max(1, quantita - 1))}
              className="w-10 h-10 rounded-lg font-bold text-lg" style={{ background: "var(--c-cream)", border: "1.5px solid var(--c-border)", cursor: "pointer" }}>−</button>
            <input type="number" min="1" value={quantita} onChange={(e) => setQuantita(Math.max(1, parseInt(e.target.value) || 1))}
              className="flex-1 px-3 py-2 rounded-lg text-center font-bold text-lg" style={{ border: "1.5px solid var(--c-border)", background: "var(--c-cream)" }}/>
            <button type="button" onClick={() => setQuantita(quantita + 1)}
              className="w-10 h-10 rounded-lg font-bold text-lg" style={{ background: "var(--c-cream)", border: "1.5px solid var(--c-border)", cursor: "pointer" }}>+</button>
          </div>
        </label>

        <label className="block mb-5">
          <span className="text-xs font-semibold uppercase tracking-wider opacity-70">Note personali (opzionale)</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows="2"
            placeholder="Es: varietà cuore di bue…"
            className="w-full mt-1 px-3 py-2 rounded-lg text-sm" style={{ border: "1.5px solid var(--c-border)", background: "var(--c-cream)" }}/>
        </label>

        <div className="flex gap-2">
          <button className="btn-ghost flex-1" onClick={onClose}>Annulla</button>
          <button className="btn-primary flex-1 justify-center"
            onClick={() => onAdd(plant, quantita, note, appezzamentoId)}
            disabled={fuoriStagioneEffettivo && !hasSerra && !confirmOutOfSeason}
            style={fuoriStagioneEffettivo && !hasSerra && !confirmOutOfSeason ? { opacity: 0.5, cursor: "not-allowed" } : {}}>
            <Plus size={14}/> {fuoriStagioneEffettivo && !hasSerra && !confirmOutOfSeason ? "Fuori stagione" : "Aggiungi"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MODAL: MODIFICA PIANTA
// ============================================================
function EditPlantModal({ userPlant, plant, appezzamenti, onSave, onRemove, onClose, currentMonth }) {
  const [tab, setTab] = useState("info"); // info | problemi
  const [quantita, setQuantita] = useState(userPlant.quantita);
  const [note, setNote] = useState(userPlant.note || "");
  const [appezzamentoId, setAppezzamentoId] = useState(userPlant.appezzamentoId);
  const [problemi, setProblemi] = useState(userPlant.problemi || []);
  const [showProblemaForm, setShowProblemaForm] = useState(false);
  if (!plant) return null;

  const selectedApp = appezzamenti.find(a => a.id === appezzamentoId);
  const irrigazione = selectedApp ? calcolaIrrigazione(plant, selectedApp.tipo, currentMonth + 1) : null;

  const handleRemove = () => {
    if (confirm(`Rimuovere ${plant.nome} dal tuo orto?`)) {
      onRemove(userPlant.id);
      onClose();
    }
  };

  const addProblema = (p) => {
    const next = [...problemi, { ...p, id: `prob_${Date.now()}`, data: new Date().toISOString(), risolto: false }];
    setProblemi(next);
    setShowProblemaForm(false);
  };
  const toggleRisolto = (id) => {
    setProblemi(problemi.map(p => p.id === id ? { ...p, risolto: !p.risolto } : p));
  };
  const removeProblema = (id) => {
    setProblemi(problemi.filter(p => p.id !== id));
  };

  const problemiAttivi = problemi.filter(p => !p.risolto).length;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(42,36,24,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "12px" }} className="modal-overlay" onClick={onClose}>
      <div className="card" style={{ maxWidth: "540px", width: "100%", background: "var(--c-bg)", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="serif italic text-xs" style={{ color: "var(--c-olive-dark)" }}>— modifica pianta —</p>
            <div className="text-5xl mt-1">{plant.emoji}</div>
            <h3 className="display text-3xl mt-2">{plant.nome}</h3>
          </div>
          <button onClick={onClose} className="opacity-60 hover:opacity-100"><X size={20}/></button>
        </div>

        {/* TABS */}
        <div className="flex gap-1 mb-4 p-1 rounded-full" style={{ background: "var(--c-cream)", border: "1.5px solid var(--c-border)" }}>
          <button onClick={() => setTab("info")}
            className="flex-1 py-2 px-3 rounded-full text-sm font-semibold transition"
            style={{ background: tab === "info" ? "var(--c-ink)" : "transparent", color: tab === "info" ? "var(--c-cream)" : "var(--c-ink)", cursor: "pointer" }}>
            Info & cure
          </button>
          <button onClick={() => setTab("problemi")}
            className="flex-1 py-2 px-3 rounded-full text-sm font-semibold transition flex items-center justify-center gap-1"
            style={{ background: tab === "problemi" ? "var(--c-ink)" : "transparent", color: tab === "problemi" ? "var(--c-cream)" : "var(--c-ink)", cursor: "pointer" }}>
            Problemi {problemiAttivi > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--c-terra)", color: "var(--c-cream)" }}>{problemiAttivi}</span>}
          </button>
        </div>

        {tab === "info" && (
          <div>
            <label className="block mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider opacity-70">Appezzamento</span>
              <select value={appezzamentoId} onChange={(e) => setAppezzamentoId(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg" style={{ border: "1.5px solid var(--c-border)", background: "var(--c-cream)" }}>
                {appezzamenti.map(a => (
                  <option key={a.id} value={a.id}>{TIPI_APPEZZAMENTO.find(t=>t.id===a.tipo)?.icon} {a.nome}</option>
                ))}
              </select>
            </label>

            {irrigazione && (
              <div className="card p-3 mb-4" style={{ background: "#e8f0f5", borderColor: "#4a6fa5" }}>
                <div className="flex items-center gap-2 mb-1">
                  <Droplets size={14} style={{ color: "#4a6fa5" }}/>
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#4a6fa5" }}>Irrigazione in {MESI[currentMonth]}</p>
                </div>
                <p className="text-sm"><b>{irrigazione.freqLabel}</b>, {irrigazione.volLabel}</p>
              </div>
            )}

            <label className="block mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider opacity-70">Quantità</span>
              <div className="flex items-center gap-2 mt-1">
                <button type="button" onClick={() => setQuantita(Math.max(1, quantita - 1))}
                  className="w-10 h-10 rounded-lg font-bold text-lg" style={{ background: "var(--c-cream)", border: "1.5px solid var(--c-border)", cursor: "pointer" }}>−</button>
                <input type="number" min="1" value={quantita} onChange={(e) => setQuantita(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 px-3 py-2 rounded-lg text-center font-bold text-lg" style={{ border: "1.5px solid var(--c-border)", background: "var(--c-cream)" }}/>
                <button type="button" onClick={() => setQuantita(quantita + 1)}
                  className="w-10 h-10 rounded-lg font-bold text-lg" style={{ background: "var(--c-cream)", border: "1.5px solid var(--c-border)", cursor: "pointer" }}>+</button>
              </div>
            </label>

            <label className="block mb-5">
              <span className="text-xs font-semibold uppercase tracking-wider opacity-70">Note personali</span>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows="2"
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm" style={{ border: "1.5px solid var(--c-border)", background: "var(--c-cream)" }}/>
            </label>
          </div>
        )}

        {tab === "problemi" && (
          <div className="space-y-3 mb-5">
            {problemi.length === 0 && !showProblemaForm && (
              <div className="text-center py-6 opacity-70">
                <div className="text-4xl mb-2">🌱</div>
                <p className="serif italic text-sm">Nessun problema registrato.</p>
                <p className="text-xs mt-1">Se noti malattie, parassiti o anomalie, registrale qui per ricevere consigli.</p>
              </div>
            )}

            {problemi.map(p => (
              <div key={p.id} className="card p-3" style={{ opacity: p.risolto ? 0.5 : 1, borderColor: p.risolto ? "var(--c-border)" : "var(--c-terra)", borderWidth: "1.5px" }}>
                <div className="flex items-start gap-2">
                  <button onClick={() => toggleRisolto(p.id)} className="mt-0.5">
                    {p.risolto ? <CheckCircle2 size={18} style={{ color: "var(--c-olive)" }}/> : <AlertTriangle size={18} style={{ color: "var(--c-terra)" }}/>}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <h5 className={`serif font-bold text-sm ${p.risolto ? "line-through" : ""}`}>{p.titolo}</h5>
                      <button onClick={() => removeProblema(p.id)} className="opacity-40 hover:opacity-100">
                        <Trash2 size={12}/>
                      </button>
                    </div>
                    <p className="text-[10px] opacity-60 mb-1">{new Date(p.data).toLocaleDateString("it-IT")}</p>
                    {p.descrizione && <p className="text-xs opacity-80 mb-2">{p.descrizione}</p>}
                    {p.rimedi && (
                      <div className="mt-2 p-2 rounded" style={{ background: "var(--c-cream)" }}>
                        <p className="text-[10px] uppercase tracking-wider font-bold opacity-60 mb-1">💡 Rimedi consigliati</p>
                        <div className="text-xs whitespace-pre-line">{p.rimedi}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {showProblemaForm ? (
              <ProblemaForm plant={plant} onAdd={addProblema} onCancel={() => setShowProblemaForm(false)}/>
            ) : (
              <button onClick={() => setShowProblemaForm(true)} className="btn-primary w-full justify-center">
                <Plus size={14}/> Registra nuovo problema
              </button>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <button className="btn-ghost" onClick={handleRemove} style={{ color: "var(--c-terra)", borderColor: "var(--c-terra)" }}>
            <Trash2 size={14}/>
          </button>
          <button className="btn-ghost flex-1" onClick={onClose}>Annulla</button>
          <button className="btn-primary flex-1 justify-center"
            onClick={() => onSave(userPlant.id, { quantita, note, appezzamentoId, problemi })}>
            Salva
          </button>
        </div>
      </div>
    </div>
  );
}

// Form per registrare un problema/imprevisto con ricerca AI rimedi
function ProblemaForm({ plant, onAdd, onCancel }) {
  const [titolo, setTitolo] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [rimedi, setRimedi] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // problemi comuni suggeriti per categoria
  const suggerimenti = {
    orto: ["Foglie gialle", "Afidi", "Peronospora", "Oidio (mal bianco)", "Marciume apicale", "Cimice asiatica"],
    frutteto: ["Bolla del pesco", "Mosca della frutta", "Cocciniglia", "Gommosi", "Colpo di fuoco batterico"],
    ornamentale: ["Ragnetto rosso", "Cocciniglia", "Fiori che non sbocciano", "Foglie ingiallite", "Afidi"],
  };
  const categoriaSuggerimenti = suggerimenti[plant.categoria] || suggerimenti.orto;

  const cercaRimedi = async () => {
    if (!titolo.trim()) return;
    setSearching(true);
    setSearchError(null);

    const prompt = `Sei un agronomo esperto italiano. La mia pianta di ${plant.nome}${plant.nomeScientifico ? ` (${plant.nomeScientifico})` : ""} ha questo problema: "${titolo}"${descrizione ? `. Dettagli: ${descrizione}` : ""}.

Fornisci una risposta breve in italiano con:
1. CAUSA probabile (1 frase)
2. RIMEDI pratici biologici (3-4 punti concreti, massimo 1 riga ciascuno)
3. PREVENZIONE per il futuro (2 punti brevi)

Formato: testo semplice, con intestazioni "Causa:", "Rimedi:", "Prevenzione:" seguite dal contenuto. NO markdown, NO backtick. Massimo 10 righe totali.`;

    try {
      const res = await fetch(CLAUDE_API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 600,
          messages: [{ role: "user", content: prompt }],
          tools: [{ type: "web_search_20250305", name: "web_search" }],
        }),
      });

      if (!res.ok) {
        throw new Error(`Server ha risposto ${res.status}`);
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error.message || data.error);
      }

      const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n").trim();
      if (!text) throw new Error("Risposta vuota");
      setRimedi(text);
    } catch (err) {
      console.error(err);
      setSearchError(`Ricerca non disponibile${err.message ? `: ${err.message}` : ""}. Scrivi i rimedi manualmente qui sotto.`);
    }
    setSearching(false);
  };

  return (
    <div className="card p-4" style={{ background: "var(--c-cream)" }}>
      <p className="serif font-bold text-sm mb-3">Nuovo problema</p>

      <label className="block mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider opacity-70">Titolo del problema</span>
        <input type="text" value={titolo} onChange={(e) => setTitolo(e.target.value)}
          placeholder="Es: foglie gialle, afidi sui germogli..."
          className="w-full mt-1 px-3 py-2 rounded-lg text-sm" style={{ border: "1.5px solid var(--c-border)", background: "white" }}/>
      </label>

      {/* SUGGERIMENTI */}
      <div className="mb-3">
        <p className="text-[10px] uppercase tracking-wider opacity-60 mb-1">Problemi comuni:</p>
        <div className="flex gap-1 flex-wrap">
          {categoriaSuggerimenti.map(s => (
            <button key={s} type="button" onClick={() => setTitolo(s)}
              className="chip clickable text-[10px]" style={{ cursor: "pointer" }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <label className="block mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider opacity-70">Descrizione (opzionale)</span>
        <textarea value={descrizione} onChange={(e) => setDescrizione(e.target.value)} rows="2"
          placeholder="Es: macchie scure sotto le foglie, piccoli insetti verdi..."
          className="w-full mt-1 px-3 py-2 rounded-lg text-xs" style={{ border: "1.5px solid var(--c-border)", background: "white" }}/>
      </label>

      <button type="button" onClick={cercaRimedi} disabled={!titolo.trim() || searching}
        className="btn-primary w-full justify-center mb-3">
        {searching ? <><span className="animate-spin">⌛</span> Cerco rimedi online...</> : <><Search size={14}/> Cerca rimedi con AI</>}
      </button>

      {searchError && <p className="text-xs mb-3" style={{ color: "var(--c-terra-dark)" }}>⚠️ {searchError}</p>}

      <label className="block mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider opacity-70">Rimedi e note</span>
        <textarea value={rimedi} onChange={(e) => setRimedi(e.target.value)} rows="6"
          placeholder="I rimedi appariranno qui dopo la ricerca. Puoi anche scriverli manualmente."
          className="w-full mt-1 px-3 py-2 rounded-lg text-xs font-mono" style={{ border: "1.5px solid var(--c-border)", background: "white", lineHeight: "1.5" }}/>
      </label>

      <div className="flex gap-2">
        <button className="btn-ghost flex-1" onClick={onCancel}>Annulla</button>
        <button className="btn-primary flex-1 justify-center"
          onClick={() => onAdd({ titolo, descrizione, rimedi })}
          disabled={!titolo.trim()}>
          <CheckCircle2 size={14}/> Registra
        </button>
      </div>
    </div>
  );
}

// ============================================================
// VIEW: TECNICHE & HACK
// ============================================================
function TecnicheView() {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="fade-up">
      <div className="flex items-center gap-3 mb-2">
        <Lightbulb size={32} style={{ color: "var(--c-ochre)" }}/>
        <h2 className="display text-4xl">Tecniche & <span style={{ color: "var(--c-ochre)" }}>hack</span></h2>
      </div>
      <p className="serif italic opacity-70 mb-8 max-w-2xl">
        Metodi di coltivazione alternativi, sperimentali o poco noti, raccolti da contadini e permacultori di tutto il mondo. Da provare con curiosità.
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        {TECNICHE.map((t, i) => {
          const isOpen = expanded === t.id;
          return (
            <div key={t.id} className="card fade-up cursor-pointer" style={{ animationDelay: `${i * 60}ms` }}
              onClick={() => setExpanded(isOpen ? null : t.id)}>
              <div className="flex items-start gap-3">
                <div className="text-4xl">{t.icona}</div>
                <div className="flex-1">
                  <h3 className="serif font-bold text-xl">{t.nome}</h3>
                  <p className="serif italic text-sm opacity-70 mt-0.5">{t.claim}</p>
                  <div className="flex gap-1 mt-2">
                    <span className="chip">{t.difficolta}</span>
                  </div>
                </div>
              </div>

              <p className="text-sm opacity-80 leading-relaxed mt-3">{t.descrizione}</p>

              {isOpen && (
                <div className="mt-4 pt-4 space-y-3" style={{ borderTop: "1px solid var(--c-border)" }}>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider opacity-60 font-bold">Come fare</p>
                    <p className="text-xs mt-1 leading-relaxed">{t.comeFare}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider opacity-60 font-bold">Per chi</p>
                      <p className="text-xs mt-1">{t.perChi}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider opacity-60 font-bold">Tempo</p>
                      <p className="text-xs mt-1">{t.tempo}</p>
                    </div>
                  </div>
                  <a href={t.link} target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs" style={{ textDecoration: "none" }} onClick={(e) => e.stopPropagation()}>
                    <ExternalLink size={12}/> Approfondisci online
                  </a>
                </div>
              )}

              {!isOpen && (
                <p className="text-[10px] mt-3 opacity-40 serif italic">tocca per leggere come farlo →</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="card mt-8" style={{ background: "var(--c-ink)", color: "var(--c-cream)", borderColor: "var(--c-ink)" }}>
        <p className="serif italic text-sm">
          «La coltivazione elementare è figlia dei tentativi di trovare un'alternativa all'agricoltura industriale.»
        </p>
        <p className="text-xs opacity-70 mt-2">— Gian Carlo Cappello</p>
      </div>
    </div>
  );
}

// ============================================================
// VIEW: PACCIAMATURA
// ============================================================
function PacciamaturaView({ activeApp }) {
  const [filter, setFilter] = useState("tutti");
  const list = filter === "tutti" ? PACCIAMATURE : PACCIAMATURE.filter(p => p.categoria === filter);
  const tipoApp = activeApp?.tipo;

  return (
    <div className="fade-up">
      <div className="flex items-center gap-3 mb-2">
        <Layers size={32} style={{ color: "var(--c-olive-dark)" }}/>
        <h2 className="display text-4xl">Pacciamatura</h2>
      </div>
      <p className="serif italic opacity-70 mb-2 max-w-2xl">
        Coprire il suolo è una delle pratiche più potenti dell'orto biologico.
      </p>

      {/* BENEFICI */}
      <div className="card my-6" style={{ background: `linear-gradient(135deg, var(--c-olive) 0%, var(--c-olive-dark) 100%)`, color: "var(--c-cream)", borderColor: "transparent" }}>
        <h3 className="serif font-bold text-xl mb-3">Perché pacciamare</h3>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <p>💧 <b>Risparmi acqua</b>: riduce l'evaporazione del 50-70%</p>
          <p>🌿 <b>Meno infestanti</b>: blocca la luce e ferma la loro crescita</p>
          <p>🌡️ <b>Temperatura stabile</b>: protegge dal gelo e dal caldo estremo</p>
          <p>🪱 <b>Vita nel suolo</b>: favorisce lombrichi e microrganismi</p>
          <p>🍂 <b>Nutre il terreno</b>: se organica, si decompone in humus</p>
          <p>☔ <b>No erosione</b>: evita che la pioggia dilavi il suolo</p>
        </div>
      </div>

      {tipoApp && (
        <div className="card mb-6 p-4" style={{ background: "var(--c-cream)" }}>
          <p className="text-xs serif italic opacity-70">Stai lavorando su un {TIPI_APPEZZAMENTO.find(t=>t.id===tipoApp)?.label?.toLowerCase()}. Qui sotto vedi evidenziate le pacciamature più adatte.</p>
        </div>
      )}

      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { id: "tutti", label: "Tutte" },
          { id: "organica", label: "Organiche" },
          { id: "minerale", label: "Minerali" },
          { id: "sintetica", label: "Teli" },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={`btn-ghost ${filter === f.id ? "active" : ""}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {list.map((p, i) => {
          const adattaAttivo = tipoApp && p.adatto.includes(tipoApp);
          return (
            <div key={p.id} className="card fade-up" style={{
              animationDelay: `${i * 50}ms`,
              borderColor: adattaAttivo ? "var(--c-olive)" : "var(--c-border)",
              borderWidth: adattaAttivo ? "2px" : "1.5px"
            }}>
              <div className="flex items-start gap-3">
                <div className="text-4xl">{p.icona}</div>
                <div className="flex-1">
                  <h3 className="serif font-bold text-xl">{p.nome}</h3>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    <span className={`chip ${p.categoria === "organica" ? "olive" : p.categoria === "sintetica" ? "" : "ochre"}`}>{p.categoria}</span>
                    {adattaAttivo && <span className="chip olive">✓ adatta al tuo appezzamento</span>}
                  </div>
                </div>
              </div>

              <div className="mt-3 space-y-2 text-xs">
                <p><b className="serif">✅ Pro:</b> {p.pro}</p>
                <p><b className="serif">⚠️ Contro:</b> {p.contro}</p>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider opacity-60">Quando</p>
                    <p>{p.stagione}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider opacity-60">Spessore</p>
                    <p>{p.spessore}</p>
                  </div>
                </div>
                <p className="pt-2 italic serif" style={{ color: "var(--c-olive-dark)" }}>💡 {p.nota}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card mt-8">
        <h3 className="serif font-bold text-lg mb-3">Come fare, in 4 passi</h3>
        <ol className="space-y-3 text-sm">
          <li><b className="serif">1. Prepara il terreno.</b> Elimina le erbe infestanti esistenti e smuovi leggermente la superficie. Innaffia bene prima di pacciamare.</li>
          <li><b className="serif">2. Stendi il materiale.</b> Distribuisci uno strato uniforme attorno alle piante, lasciando 3-5 cm di spazio attorno al fusto per evitare marciumi.</li>
          <li><b className="serif">3. Bagna la pacciamatura.</b> Se usi paglia o foglie, bagnale subito per evitare che volino via.</li>
          <li><b className="serif">4. Integra nel tempo.</b> I materiali organici si decompongono: aggiungi nuovo strato ogni 6-12 mesi.</li>
        </ol>
      </div>
    </div>
  );
}

// ============================================================
// MODAL: PIANTA CUSTOM — con ricerca AI automatica
// ============================================================
function CustomPlantModal({ editing, onAdd, onUpdate, onClose }) {
  const isEdit = !!editing;
  const [nome, setNome] = useState(editing?.nome || "");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [form, setForm] = useState(editing || null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleMese = (campo, m) => {
    setForm(f => ({
      ...f,
      [campo]: f[campo].includes(m) ? f[campo].filter(x => x !== m) : [...f[campo], m].sort((a,b)=>a-b)
    }));
  };

  // cerca online tramite Claude API (con web search)
  const cercaInfo = async () => {
    if (!nome.trim()) return;
    setSearching(true);
    setSearchError(null);

    const prompt = `Sei un esperto di botanica e agricoltura italiana. Cerca informazioni affidabili sulla pianta "${nome.trim()}" per il clima mediterraneo italiano.

Restituisci SOLO un oggetto JSON valido (no testo prima o dopo, no markdown, no backtick) con questa struttura esatta:
{
  "nome": "nome comune italiano",
  "nomeScientifico": "nome scientifico in latino",
  "emoji": "una sola emoji rappresentativa (scegli tra fiori/frutti/foglie)",
  "categoria": "orto" | "frutteto" | "ornamentale",
  "descrizione": "2-3 frasi utili in italiano: come si comporta, ambiente ideale, curiosità pratiche",
  "semina": [array di numeri 1-12 con i mesi di semina, vuoto se non si semina da seme],
  "trapianto": [array di numeri 1-12 con i mesi di trapianto/messa a dimora],
  "raccolta": [array di numeri 1-12 con i mesi di raccolta o fioritura],
  "acqua": "bassa" | "media" | "alta",
  "sole": "pieno" | "mezz'ombra" | "ombra",
  "difficolta": "facile" | "media" | "difficile",
  "spazio": "stringa tipo '30 cm tra piante' o '1 m tra piante'",
  "vasoOk": true o false (se è adatta alla coltivazione in vaso)
}

Importante: i mesi devono essere numerati 1-12 (gennaio=1). Basati su fonti italiane affidabili.`;

    try {
      const res = await fetch(CLAUDE_API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
          tools: [{ type: "web_search_20250305", name: "web_search" }],
        }),
      });

      if (!res.ok) {
        throw new Error(`Server ha risposto ${res.status}. Su Netlify verifica che la variabile ANTHROPIC_API_KEY sia impostata.`);
      }

      const data = await res.json();

      // se il server ha risposto con un errore
      if (data.error) {
        throw new Error(data.error.message || data.error);
      }

      // estrai tutti i blocchi di testo
      const fullText = (data.content || [])
        .filter(b => b.type === "text")
        .map(b => b.text)
        .join("\n");

      // estrai il JSON (potrebbe essere dentro backtick o testo)
      let jsonStr = fullText.trim();
      const match = jsonStr.match(/\{[\s\S]*\}/);
      if (match) jsonStr = match[0];

      if (!jsonStr) throw new Error("Risposta vuota dall'AI");

      const parsed = JSON.parse(jsonStr);

      // sanitizza
      const safe = {
        nome: parsed.nome || nome,
        nomeScientifico: parsed.nomeScientifico || "",
        emoji: parsed.emoji || "🌸",
        categoria: ["orto","frutteto","ornamentale"].includes(parsed.categoria) ? parsed.categoria : "ornamentale",
        descrizione: parsed.descrizione || "",
        semina: Array.isArray(parsed.semina) ? parsed.semina.filter(n => n >= 1 && n <= 12) : [],
        trapianto: Array.isArray(parsed.trapianto) ? parsed.trapianto.filter(n => n >= 1 && n <= 12) : [],
        raccolta: Array.isArray(parsed.raccolta) ? parsed.raccolta.filter(n => n >= 1 && n <= 12) : [],
        acqua: ["bassa","media","alta"].includes(parsed.acqua) ? parsed.acqua : "media",
        sole: ["pieno","mezz'ombra","ombra"].includes(parsed.sole) ? parsed.sole : "pieno",
        difficolta: ["facile","media","difficile"].includes(parsed.difficolta) ? parsed.difficolta : "facile",
        spazio: parsed.spazio || "30 cm tra piante",
        vasoOk: typeof parsed.vasoOk === "boolean" ? parsed.vasoOk : true,
      };

      setForm(safe);
    } catch (err) {
      console.error("Errore ricerca:", err);
      setSearchError(
        `Ricerca automatica non disponibile${err.message ? `: ${err.message}` : ""}. Controlla i campi qui sotto e modifica quello che serve.`
      );
      // precompila con valori default così l'utente può editare manualmente
      setForm({
        nome: nome,
        nomeScientifico: "",
        emoji: "🌸",
        categoria: "ornamentale",
        descrizione: "",
        semina: [],
        trapianto: [],
        raccolta: [],
        acqua: "media",
        sole: "pieno",
        difficolta: "facile",
        spazio: "30 cm tra piante",
        vasoOk: true,
      });
    }
    setSearching(false);
  };

  const canSave = form && form.nome.trim().length > 0;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(42,36,24,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "12px" }} className="modal-overlay" onClick={onClose}>
      <div className="card" style={{ maxWidth: "600px", width: "100%", background: "var(--c-bg)", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="serif italic text-xs" style={{ color: "var(--c-olive-dark)" }}>— {isEdit ? "modifica" : "nuova"} pianta —</p>
            <h3 className="display text-3xl mt-1">{isEdit ? form?.nome : "Aggiungi pianta"}</h3>
            {!isEdit && <p className="text-xs opacity-70 mt-1">Scrivi il nome, cerco io le informazioni per te.</p>}
          </div>
          <button onClick={onClose} className="opacity-60 hover:opacity-100"><X size={20}/></button>
        </div>

        {!isEdit && (
        <div className="card p-4 mb-4" style={{ background: "var(--c-cream)" }}>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider opacity-70">Nome della pianta</span>
            <div className="flex gap-2 mt-1">
              <input type="text" value={nome}
                onChange={(e) => setNome(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !searching && (e.preventDefault(), cercaInfo())}
                placeholder="Es: Lavanda, Geranio, Pisello odoroso..."
                className="flex-1 px-3 py-2 rounded-lg" style={{ border: "1.5px solid var(--c-border)", background: "white" }}/>
              <button type="button" onClick={cercaInfo} disabled={!nome.trim() || searching} className="btn-primary">
                {searching ? (
                  <>
                    <span className="animate-spin">⌛</span> Cerco...
                  </>
                ) : (
                  <>
                    <Search size={14}/> Cerca
                  </>
                )}
              </button>
            </div>
          </label>
          {searching && (
            <div className="mt-3 flex items-center gap-2 text-xs italic" style={{ color: "var(--c-olive-dark)" }}>
              <span>🌐</span>
              <span className="serif">Sto consultando fonti botaniche online...</span>
            </div>
          )}
          {searchError && (
            <div className="mt-3 text-xs" style={{ color: "var(--c-terra-dark)" }}>
              <b>⚠️ {searchError}</b>
            </div>
          )}
        </div>
        )}

        {/* FORM (visibile dopo la ricerca, editabile) */}
        {form && (
          <div className="space-y-4 fade-up">
            {!isEdit && (
            <div className="card p-3" style={{ background: "var(--c-olive)", color: "var(--c-cream)", borderColor: "var(--c-olive)" }}>
              <p className="text-xs serif italic opacity-90">✓ Informazioni trovate. Controlla e modifica se necessario, poi conferma.</p>
            </div>
            )}

            {/* ANTEPRIMA */}
            <div className="card p-4">
              <div className="flex items-start gap-3">
                <span className="text-5xl">{form.emoji}</span>
                <div className="flex-1">
                  <input type="text" value={form.nome} onChange={(e) => set("nome", e.target.value)}
                    className="w-full px-2 py-1 rounded font-bold text-lg serif" style={{ border: "1.5px solid transparent", background: "transparent" }}
                    onFocus={(e) => e.target.style.border = "1.5px solid var(--c-border)"}
                    onBlur={(e) => e.target.style.border = "1.5px solid transparent"}/>
                  {form.nomeScientifico && (
                    <input type="text" value={form.nomeScientifico} onChange={(e) => set("nomeScientifico", e.target.value)}
                      className="w-full px-2 py-1 rounded text-xs italic opacity-70" style={{ border: "1.5px solid transparent", background: "transparent" }}
                      onFocus={(e) => e.target.style.border = "1.5px solid var(--c-border)"}
                      onBlur={(e) => e.target.style.border = "1.5px solid transparent"}/>
                  )}
                  <div className="flex gap-1 mt-2">
                    {["orto","frutteto","ornamentale"].map(c => (
                      <button key={c} type="button" onClick={() => set("categoria", c)}
                        className={`chip ${form.categoria === c ? (c === "frutteto" ? "terra" : c === "ornamentale" ? "ochre" : "olive") : "clickable"}`}
                        style={{ cursor: "pointer" }}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <textarea value={form.descrizione} onChange={(e) => set("descrizione", e.target.value)} rows="3"
                className="w-full mt-3 px-3 py-2 rounded-lg text-sm" style={{ border: "1.5px solid var(--c-border)", background: "var(--c-cream)" }}/>
            </div>

            {/* EMOJI SELECTOR */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">Icona</p>
              <EmojiPicker value={form.emoji} onChange={(e) => set("emoji", e)}/>
            </div>

            {/* CALENDARIO */}
            <div className="space-y-3">
              {[
                { campo: "semina", label: "Semina", color: "var(--c-olive)" },
                { campo: "trapianto", label: "Trapianto", color: "var(--c-olive-dark)" },
                { campo: "raccolta", label: "Raccolta / fioritura", color: "var(--c-ochre)" },
              ].map(({ campo, label, color }) => (
                <div key={campo}>
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">{label}</p>
                  <div className="grid grid-cols-6 gap-1">
                    {MESI.map((m, i) => {
                      const active = form[campo].includes(i + 1);
                      return (
                        <button key={i} type="button" onClick={() => toggleMese(campo, i + 1)}
                          className="p-2 rounded text-xs font-bold"
                          style={{
                            background: active ? color : "var(--c-cream)",
                            color: active ? "var(--c-cream)" : "var(--c-ink)",
                            border: `1.5px solid ${active ? color : "var(--c-border)"}`,
                            cursor: "pointer",
                          }}>
                          {m.slice(0,3)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* CURE */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70 mb-1">Acqua</p>
                <select value={form.acqua} onChange={(e) => set("acqua", e.target.value)}
                  className="w-full px-2 py-2 rounded-lg text-sm" style={{ border: "1.5px solid var(--c-border)", background: "var(--c-cream)" }}>
                  <option value="bassa">💧 bassa</option>
                  <option value="media">💧 media</option>
                  <option value="alta">💧 alta</option>
                </select>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70 mb-1">Sole</p>
                <select value={form.sole} onChange={(e) => set("sole", e.target.value)}
                  className="w-full px-2 py-2 rounded-lg text-sm" style={{ border: "1.5px solid var(--c-border)", background: "var(--c-cream)" }}>
                  <option value="pieno">☀ pieno</option>
                  <option value="mezz'ombra">⛅ mezz'ombra</option>
                  <option value="ombra">🌑 ombra</option>
                </select>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70 mb-1">Difficoltà</p>
                <select value={form.difficolta} onChange={(e) => set("difficolta", e.target.value)}
                  className="w-full px-2 py-2 rounded-lg text-sm" style={{ border: "1.5px solid var(--c-border)", background: "var(--c-cream)" }}>
                  <option value="facile">facile</option>
                  <option value="media">media</option>
                  <option value="difficile">difficile</option>
                </select>
              </div>
            </div>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider opacity-70">Spazio</span>
              <input type="text" value={form.spazio} onChange={(e) => set("spazio", e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm" style={{ border: "1.5px solid var(--c-border)", background: "var(--c-cream)" }}/>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.vasoOk} onChange={(e) => set("vasoOk", e.target.checked)}/>
              <span className="text-sm">Coltivabile in vaso (balcone/terrazzo)</span>
            </label>
          </div>
        )}

        {/* EMPTY STATE prima della ricerca */}
        {!form && !searching && (
          <div className="text-center py-8 opacity-60">
            <div className="text-5xl mb-3">🔍</div>
            <p className="serif italic text-sm">Scrivi il nome di una pianta qui sopra<br/>e premi <b>Cerca</b> per iniziare.</p>
          </div>
        )}

        <div className="hairline my-5"></div>

        <div className="flex gap-2">
          <button className="btn-ghost flex-1" onClick={onClose}>Annulla</button>
          <button className="btn-primary flex-1 justify-center"
            onClick={() => isEdit ? onUpdate(editing.id, form) : onAdd(form)}
            disabled={!canSave}>
            <Plus size={14}/> {isEdit ? "Salva modifiche" : "Aggiungi al catalogo"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// VIEW: AGENDA SETTIMANALE — giorni × orari con task suggeriti
// ============================================================
function AgendaView({ userPlants, fullCatalog, appezzamenti }) {
  const [weekOffset, setWeekOffset] = useState(0); // 0 = questa settimana

  // calcola il lunedì della settimana corrente (+ offset)
  const lunediBase = useMemo(() => {
    const d = new Date();
    d.setHours(0,0,0,0);
    const giornoSett = d.getDay(); // 0=dom, 1=lun...
    const daLun = giornoSett === 0 ? 6 : giornoSett - 1;
    d.setDate(d.getDate() - daLun + (weekOffset * 7));
    return d;
  }, [weekOffset]);

  const giorniSett = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(lunediBase);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [lunediBase]);

  const oggi = new Date();
  oggi.setHours(0,0,0,0);

  // regole: orario suggerito per tipo di intervento + mese (estate/inverno)
  // restituisce "HH:MM"
  const orarioSuggerito = (tipo, mese) => {
    const estate = [6,7,8].includes(mese);
    const invernoSpeciale = [12,1,2].includes(mese);
    switch (tipo) {
      case "irrigazione":
        return estate ? "18:00" : invernoSpeciale ? "10:00" : "08:00";
      case "raccolta":
        return "07:30";
      case "semina":
      case "trapianto":
        return estate ? "17:00" : "10:00";
      case "potatura":
        return "11:00";
      default:
        return "09:00";
    }
  };

  // genera i task della settimana basati sulle piante dell'utente
  // logica:
  // - irrigazione: solo se la pianta ha fabbisogno medio/alto nel mese corrente,
  //   con frequenza calcolata (es. ogni 2 giorni → 3-4 volte/settimana)
  // - semina/trapianto/raccolta: una volta nel mese giusto, suggeriti il mercoledì
  // - potatura: per frutteto, una volta nel mese giusto, il sabato
  const weekTasks = useMemo(() => {
    const tasks = [];
    giorniSett.forEach((d, giornoIdx) => {
      const mese = d.getMonth() + 1;
      const app = (up) => appezzamenti.find(a => a.id === up.appezzamentoId);

      userPlants.forEach(up => {
        const plant = fullCatalog.find(p => p.id === up.plantId);
        if (!plant) return;
        const appezz = app(up);
        const shift = effectiveShift(appezz);

        const semina = shiftMesi(plant.semina, shift);
        const trapianto = shiftMesi(plant.trapianto, shift);
        const raccolta = shiftMesi(plant.raccolta, shift);

        // SEMINA: mercoledì (idx 2) se il mese corrisponde
        if (giornoIdx === 2 && semina.includes(mese)) {
          tasks.push({
            day: giornoIdx, data: d,
            ora: orarioSuggerito("semina", mese),
            type: "semina", icon: "🌱",
            titolo: `Semina ${plant.nome}`,
            desc: `${up.quantita} piante · ${plant.spazio}`,
            plantEmoji: plant.emoji,
            appNome: appezz?.nome,
            color: "var(--c-olive)"
          });
        }

        // TRAPIANTO: mercoledì anche questo
        if (giornoIdx === 2 && trapianto.includes(mese)) {
          tasks.push({
            day: giornoIdx, data: d,
            ora: orarioSuggerito("trapianto", mese),
            type: "trapianto", icon: "🪴",
            titolo: `Trapianto ${plant.nome}`,
            desc: `${up.quantita} piante a dimora`,
            plantEmoji: plant.emoji,
            appNome: appezz?.nome,
            color: "var(--c-olive-dark)"
          });
        }

        // RACCOLTA: sabato mattina (idx 5) se il mese corrisponde e NON è ornamentale
        if (giornoIdx === 5 && raccolta.includes(mese) && plant.categoria !== "ornamentale") {
          tasks.push({
            day: giornoIdx, data: d,
            ora: orarioSuggerito("raccolta", mese),
            type: "raccolta", icon: "🧺",
            titolo: `Raccolta ${plant.nome}`,
            desc: `Controlla cosa è pronto`,
            plantEmoji: plant.emoji,
            appNome: appezz?.nome,
            color: "var(--c-ochre)"
          });
        }

        // IRRIGAZIONE: ogni N giorni in base a calcolaIrrigazione
        const fabbisogno = plant.acqua;
        const mesiIrrigare = fabbisogno === "alta" ? [5,6,7,8,9]
          : fabbisogno === "media" ? [6,7,8]
          : [7,8];
        if (mesiIrrigare.includes(mese)) {
          const ir = calcolaIrrigazione(plant, appezz?.tipo, mese);
          // giorni target: 1 ogni ir.giorni. Includo se (giornoIdx + offsetStable) % giorni === 0
          // Uso plant.id come seed stabile
          const seed = plant.id.charCodeAt(0) % ir.giorni;
          if ((giornoIdx + seed) % ir.giorni === 0) {
            tasks.push({
              day: giornoIdx, data: d,
              ora: orarioSuggerito("irrigazione", mese),
              type: "irrigazione", icon: "💧",
              titolo: `Irriga ${plant.nome}`,
              desc: `${ir.volLabel} · ${ir.freqLabel}`,
              plantEmoji: plant.emoji,
              appNome: appezz?.nome,
              color: "#4a6fa5"
            });
          }
        }

        // POTATURA: sabato (idx 5) per frutteto base (non custom) in mesi tipici
        if (giornoIdx === 5 && plant.categoria === "frutteto" && !plant.custom) {
          let meseTarget = 2;
          if (plant.id === "olivo") meseTarget = 3;
          if (plant.id === "vite" && mese === 1) meseTarget = 1;
          if (plant.id === "vite" && mese === 6) meseTarget = 6;
          if (mese === meseTarget) {
            tasks.push({
              day: giornoIdx, data: d,
              ora: orarioSuggerito("potatura", mese),
              type: "potatura", icon: "✂️",
              titolo: `Potatura ${plant.nome}`,
              desc: plant.id === "vite" ? "Potatura della vite" : "Potatura invernale",
              plantEmoji: plant.emoji,
              appNome: appezz?.nome,
              color: "var(--c-terra)"
            });
          }
        }
      });
    });
    // ordina per giorno poi ora
    return tasks.sort((a, b) => a.day - b.day || a.ora.localeCompare(b.ora));
  }, [giorniSett, userPlants, fullCatalog, appezzamenti]);

  // raggruppa i task per giorno → per ora
  const tasksPerGiorno = useMemo(() => {
    const map = {};
    for (let i = 0; i < 7; i++) map[i] = [];
    weekTasks.forEach(t => map[t.day].push(t));
    return map;
  }, [weekTasks]);

  // raggruppa per combinazione ora+tipo+azione per mostrare "18:00 Irriga pomodoro, lattuga"
  const raggruppaPerOra = (tasks) => {
    const map = new Map();
    tasks.forEach(t => {
      const key = `${t.ora}__${t.type}`;
      if (!map.has(key)) {
        map.set(key, { ora: t.ora, type: t.type, icon: t.icon, color: t.color, piante: [], desc: t.desc, appezzamenti: new Set() });
      }
      const g = map.get(key);
      g.piante.push({ nome: t.titolo.replace(/^(Irriga|Semina|Trapianto|Raccolta|Potatura) /, ""), emoji: t.plantEmoji });
      if (t.appNome) g.appezzamenti.add(t.appNome);
    });
    return Array.from(map.values()).sort((a,b) => a.ora.localeCompare(b.ora));
  };

  const GIORNI_NOMI = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
  const GIORNI_LUNGHI = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];
  const labelSettimana = weekOffset === 0 ? "Questa settimana" : weekOffset === 1 ? "Settimana prossima" : weekOffset === -1 ? "Settimana scorsa" : `${weekOffset > 0 ? "+" : ""}${weekOffset} settimane`;

  const primoDay = giorniSett[0];
  const ultimoDay = giorniSett[6];
  const rangeLabel = `${primoDay.getDate()}/${primoDay.getMonth()+1} – ${ultimoDay.getDate()}/${ultimoDay.getMonth()+1}`;

  if (userPlants.length === 0) {
    return (
      <div className="fade-up text-center py-16">
        <div className="text-5xl mb-3">📅</div>
        <h2 className="display text-3xl mb-2">Agenda vuota</h2>
        <p className="serif italic opacity-70">Aggiungi piante al tuo orto per vedere l'agenda settimanale.</p>
      </div>
    );
  }

  const totalTasks = weekTasks.length;

  return (
    <div className="fade-up">
      <div className="flex items-center gap-3 mb-2">
        <Clock size={32} style={{ color: "var(--c-terra)" }}/>
        <div>
          <h2 className="display text-4xl">{labelSettimana}</h2>
          <p className="serif italic opacity-70 text-sm">{rangeLabel} · {totalTasks} {totalTasks === 1 ? "intervento" : "interventi"} programmati</p>
        </div>
      </div>

      {/* NAVIGAZIONE SETTIMANE */}
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => setWeekOffset(w => w - 1)} className="btn-ghost">← precedente</button>
        <button onClick={() => setWeekOffset(0)} className={`btn-ghost ${weekOffset === 0 ? "active" : ""}`}>Oggi</button>
        <button onClick={() => setWeekOffset(w => w + 1)} className="btn-ghost">successiva →</button>
      </div>

      {totalTasks === 0 && (
        <div className="card text-center py-10">
          <p className="text-4xl mb-3">🌤️</p>
          <p className="serif text-lg">Settimana tranquilla.</p>
          <p className="text-xs opacity-70 mt-2">Nessun intervento programmato per {labelSettimana.toLowerCase()}.</p>
        </div>
      )}

      {/* GIORNI */}
      <div className="space-y-3">
        {giorniSett.map((d, idx) => {
          const tasks = tasksPerGiorno[idx] || [];
          const isOggi = d.getTime() === oggi.getTime();
          const raggruppati = raggruppaPerOra(tasks);

          return (
            <div key={idx} className="card" style={{
              opacity: d < oggi ? 0.55 : 1,
              borderColor: isOggi ? "var(--c-terra)" : "var(--c-border)",
              borderWidth: isOggi ? "2px" : "1.5px",
            }}>
              <div className="flex items-baseline justify-between mb-3">
                <div>
                  <p className="serif italic text-xs opacity-70">{GIORNI_LUNGHI[idx]}</p>
                  <h3 className="display text-2xl">
                    {d.getDate()} <span className="text-base font-normal" style={{ color: "var(--c-olive-dark)" }}>{MESI[d.getMonth()].slice(0,3).toLowerCase()}</span>
                    {isOggi && <span className="chip terra ml-2" style={{ fontSize: "9px", verticalAlign: "middle" }}>oggi</span>}
                  </h3>
                </div>
                <span className="chip">{tasks.length}</span>
              </div>

              {tasks.length === 0 ? (
                <p className="text-xs opacity-50 italic serif">Riposo — niente da fare oggi.</p>
              ) : (
                <div className="space-y-2">
                  {raggruppati.map((g, i) => (
                    <div key={i} className="flex items-start gap-3 p-2 rounded-lg" style={{ background: "var(--c-bg)" }}>
                      <div className="flex flex-col items-center flex-shrink-0" style={{ minWidth: "52px" }}>
                        <span className="font-mono font-bold text-sm" style={{ color: g.color }}>{g.ora}</span>
                        <span className="text-xl mt-0.5">{g.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm capitalize">
                          {g.type === "irrigazione" ? "Irriga" :
                           g.type === "semina" ? "Semina" :
                           g.type === "trapianto" ? "Trapianta" :
                           g.type === "raccolta" ? "Raccolta" :
                           g.type === "potatura" ? "Potatura" : g.type}
                          {" "}
                          <span className="font-normal opacity-80">
                            {g.piante.map((p, j) => (
                              <span key={j}>{j > 0 && ", "}{p.emoji} {p.nome.toLowerCase()}</span>
                            ))}
                          </span>
                        </p>
                        {g.appezzamenti.size > 0 && (
                          <p className="text-[10px] opacity-60 mt-0.5">📍 {Array.from(g.appezzamenti).join(", ")}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="card mt-6 p-4" style={{ background: "var(--c-cream)" }}>
        <p className="text-xs font-bold serif mb-2">💡 Come funzionano gli orari</p>
        <div className="text-xs opacity-80 space-y-1 leading-relaxed">
          <p><b>Irrigazione:</b> al mattino presto d'inverno (8:00), alla sera d'estate (18:00) per evitare l'evaporazione.</p>
          <p><b>Raccolta:</b> di prima mattina (7:30), quando il frutto è più turgido e fresco.</p>
          <p><b>Semina e trapianto:</b> nelle ore meno calde, pomeriggio tardi d'estate.</p>
          <p><b>Potatura:</b> metà mattinata, con rugiada asciutta ma senza sole forte.</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MODAL: IMPOSTAZIONI / BACKUP
// ============================================================
function SettingsModal({ onClose, onExport, onImport, onReset, stats }) {
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);

  const handleFile = async (e, mode) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    const res = await onImport(file, mode);
    setImporting(false);
    setImportResult(res);
    e.target.value = ""; // reset per permettere reimport dello stesso file
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(42,36,24,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "12px" }} className="modal-overlay" onClick={onClose}>
      <div className="card" style={{ maxWidth: "540px", width: "100%", background: "var(--c-bg)", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="serif italic text-xs" style={{ color: "var(--c-olive-dark)" }}>— impostazioni —</p>
            <h3 className="display text-3xl mt-1">Backup & dati</h3>
          </div>
          <button onClick={onClose} className="opacity-60 hover:opacity-100"><X size={20}/></button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="card p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider opacity-60">Appezzamenti</p>
            <p className="display text-2xl" style={{ color: "var(--c-olive-dark)" }}>{stats.appezzamenti}</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider opacity-60">Piante</p>
            <p className="display text-2xl" style={{ color: "var(--c-terra)" }}>{stats.userPlants}</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider opacity-60">Piante nuove</p>
            <p className="display text-2xl" style={{ color: "var(--c-ochre)" }}>{stats.customPlants}</p>
          </div>
        </div>

        {/* EXPORT */}
        <div className="card mb-4 p-4" style={{ background: "var(--c-cream)" }}>
          <div className="flex items-start gap-3">
            <Download size={20} style={{ color: "var(--c-olive-dark)" }} className="flex-shrink-0 mt-1"/>
            <div className="flex-1">
              <h4 className="serif font-bold text-base">Esporta backup</h4>
              <p className="text-xs opacity-70 mt-1 mb-3">
                Scarica un file JSON con tutti i tuoi dati: appezzamenti, piante, interventi fatti, piante nuove, problemi registrati. Puoi salvarlo come backup o trasferirlo su un altro dispositivo.
              </p>
              <button onClick={onExport} className="btn-primary text-sm">
                <Download size={14}/> Scarica file .json
              </button>
            </div>
          </div>
        </div>

        {/* IMPORT */}
        <div className="card mb-4 p-4" style={{ background: "var(--c-cream)" }}>
          <div className="flex items-start gap-3">
            <Upload size={20} style={{ color: "var(--c-olive-dark)" }} className="flex-shrink-0 mt-1"/>
            <div className="flex-1">
              <h4 className="serif font-bold text-base">Importa backup</h4>
              <p className="text-xs opacity-70 mt-1 mb-3">
                Carica un file JSON esportato in precedenza. Scegli se <b>sostituire</b> tutto quello che hai ora, oppure <b>unire</b> i dati mantenendo quelli esistenti.
              </p>

              <div className="flex gap-2 flex-wrap">
                <label className="btn-ghost text-xs" style={{ cursor: "pointer" }}>
                  <Upload size={12}/> Unisci
                  <input type="file" accept=".json,application/json" className="hidden"
                    onChange={(e) => handleFile(e, "merge")} disabled={importing}
                    style={{ display: "none" }}/>
                </label>
                <label className="btn-ghost text-xs" style={{ cursor: "pointer", borderColor: "var(--c-terra)", color: "var(--c-terra)" }}>
                  <Upload size={12}/> Sostituisci tutto
                  <input type="file" accept=".json,application/json" className="hidden"
                    onChange={(e) => {
                      if (confirm("Sostituire TUTTI i dati attuali con quelli del file? Questa operazione è irreversibile.")) {
                        handleFile(e, "replace");
                      } else {
                        e.target.value = "";
                      }
                    }}
                    disabled={importing}
                    style={{ display: "none" }}/>
                </label>
              </div>

              {importing && (
                <p className="text-xs mt-3 italic" style={{ color: "var(--c-olive-dark)" }}>
                  <span className="animate-spin inline-block">⌛</span> Caricamento in corso...
                </p>
              )}

              {importResult && importResult.ok && (
                <div className="mt-3 p-3 rounded-lg" style={{ background: "var(--c-olive)", color: "var(--c-cream)" }}>
                  <p className="text-xs serif font-bold">✓ Importazione riuscita</p>
                  <p className="text-[11px] opacity-90 mt-1">
                    {importResult.stats.appezzamenti} appezzamenti · {importResult.stats.userPlants} piante · {importResult.stats.customPlants} piante nuove
                  </p>
                </div>
              )}

              {importResult && !importResult.ok && (
                <div className="mt-3 p-3 rounded-lg" style={{ background: "#fff3cd", borderColor: "#d4a73b", border: "1.5px solid" }}>
                  <p className="text-xs serif font-bold" style={{ color: "var(--c-terra-dark)" }}>⚠️ Errore nell'import</p>
                  <p className="text-[11px] opacity-80 mt-1">{importResult.error}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RESET */}
        <div className="card p-4" style={{ background: "#fff3cd", borderColor: "#d4a73b" }}>
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} style={{ color: "var(--c-terra-dark)" }} className="flex-shrink-0 mt-1"/>
            <div className="flex-1">
              <h4 className="serif font-bold text-base" style={{ color: "var(--c-terra-dark)" }}>Zona pericolo</h4>
              <p className="text-xs opacity-70 mt-1 mb-3">
                Cancella tutti i dati locali per ricominciare da capo. Prima fai un export se vuoi conservarli.
              </p>
              <button onClick={onReset} className="btn-ghost text-xs" style={{ borderColor: "var(--c-terra)", color: "var(--c-terra)" }}>
                <Trash2 size={12}/> Cancella tutto
              </button>
            </div>
          </div>
        </div>

        <p className="text-[10px] opacity-50 text-center mt-6 font-mono">
          VerdeGuida · v{APP_VERSION} · by Fandronius
        </p>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE: EMOJI PICKER con categorie scorrevoli
// ============================================================
const EMOJI_GROUPS = [
  {
    id: "fiori", label: "Fiori", icon: "🌸",
    items: [
      "🌸","🌺","🌻","🌷","🌹","🪷","💐","🌼","🏵️","🪻",
      "💮","🪴","🌾","🌿","☘️","🍀","🌱","🌲","🌳","🌴",
      "🌵","🎋","🎍",
    ],
  },
  {
    id: "fiori-colori", label: "Colori", icon: "🎨",
    items: [
      "🔴","🟠","🟡","🟢","🔵","🟣","⚪","⚫","🟤",
      "❤️","🧡","💛","💚","💙","💜","🤍","🖤","🤎","💖","💗",
    ],
  },
  {
    id: "frutta", label: "Frutta", icon: "🍎",
    items: [
      "🍎","🍏","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐",
      "🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🫒","🌰",
    ],
  },
  {
    id: "verdure", label: "Verdure", icon: "🥬",
    items: [
      "🥕","🌽","🌶️","🫑","🥒","🥬","🥦","🧄","🧅","🥔",
      "🍠","🍆","🥑","🫘","🫛","🫚","🫓",
    ],
  },
  {
    id: "aromatiche", label: "Aromatiche", icon: "🌿",
    items: [
      "🌿","🍀","☘️","🌱","🌾","🪴","🍃","🌼",
    ],
  },
  {
    id: "altro", label: "Altro", icon: "✨",
    items: [
      "🐝","🦋","🐞","🕷️","🐛","🐌","🦗","🐜",
      "☀️","🌤️","🌧️","❄️","💧","🔥",
      "✨","⭐","🏡","🏕️","🧺","🪣","💧","🌍",
    ],
  },
];

function EmojiPicker({ value, onChange }) {
  const [group, setGroup] = useState(EMOJI_GROUPS[0].id);
  const current = EMOJI_GROUPS.find(g => g.id === group);

  return (
    <div className="card p-3" style={{ background: "var(--c-cream)" }}>
      {/* PREVIEW grande dell'emoji selezionata */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
          style={{ background: "var(--c-bg)", border: "2px solid var(--c-ink)" }}>
          {value}
        </div>
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-wider opacity-60">Icona selezionata</p>
          <p className="serif italic text-xs opacity-70 mt-0.5">Scorri le categorie sotto per cambiare</p>
        </div>
      </div>

      {/* TAB categorie */}
      <div className="flex gap-1 overflow-x-auto scroll-hide pb-2 mb-2 -mx-1 px-1">
        {EMOJI_GROUPS.map(g => (
          <button key={g.id} type="button" onClick={() => setGroup(g.id)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1"
            style={{
              background: group === g.id ? "var(--c-ink)" : "transparent",
              color: group === g.id ? "var(--c-cream)" : "var(--c-ink)",
              border: `1.5px solid ${group === g.id ? "var(--c-ink)" : "var(--c-border)"}`,
              cursor: "pointer",
            }}>
            <span>{g.icon}</span>
            <span>{g.label}</span>
          </button>
        ))}
      </div>

      {/* GRIGLIA emoji */}
      <div className="grid grid-cols-8 gap-1">
        {current.items.map((e, i) => (
          <button key={`${e}-${i}`} type="button" onClick={() => onChange(e)}
            className="aspect-square rounded-lg text-xl flex items-center justify-center transition"
            style={{
              background: value === e ? "var(--c-ink)" : "var(--c-bg)",
              border: `1.5px solid ${value === e ? "var(--c-ink)" : "transparent"}`,
              cursor: "pointer",
              filter: value === e ? "none" : "grayscale(0)",
            }}>
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
