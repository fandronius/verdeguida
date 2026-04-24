import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { Plus, Calendar, Sprout, BookOpen, Bell, Trash2, X, Droplets, Scissors, Sun, Leaf, CheckCircle2, Circle, MapPin, Home, Flower2, Edit3, Trees, Lightbulb, ExternalLink, Search, Layers, Menu, AlertTriangle, Clock, Euro, Settings, Download, Upload, HelpCircle, MoreHorizontal, ChevronRight } from "lucide-react";

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
    resaKg: 2.5, prezzoKg: 2.5,
    giorniMaturazione: 80,
    concimi: [
      { nome: "Compost maturo", quando: "Al trapianto", come: "Una manciata nella buca di piantagione, mescolato alla terra" },
      { nome: "Macerato di consolida", quando: "Ogni 15 gg in fioritura", come: "Diluito 1:10 in acqua, alla base della pianta" },
      { nome: "Cenere di legna", quando: "In fioritura/allegagione", come: "Piccole dosi (1 cucchiaio/pianta) per apportare potassio" },
    ]
  },
  { id: "zucchina", nome: "Zucchina", categoria: "orto", emoji: "🥒",
    descrizione: "Pianta molto produttiva. Raccogli i frutti giovani per stimolare nuova produzione.",
    semina: [4,5], trapianto: [5,6], raccolta: [6,7,8,9],
    spazio: "1 m tra piante", acqua: "alta", sole: "pieno",
    difficolta: "facile", vasoOk: true,
    resaKg: 5, prezzoKg: 2.0,
    giorniMaturazione: 55,
    concimi: [
      { nome: "Letame maturo o compost", quando: "Prima del trapianto", come: "Incorporato nel terreno (2-3 kg/mq)" },
      { nome: "Macerato di ortica", quando: "Ogni 20 gg durante la crescita", come: "Diluito 1:10, distribuito alla base" },
    ]
  },
  { id: "insalata", nome: "Lattuga", categoria: "orto", emoji: "🥬",
    descrizione: "Cresce rapidamente. Semina scalare ogni 2-3 settimane per raccolto continuo.",
    semina: [2,3,4,5,8,9,10], trapianto: [3,4,5,9,10], raccolta: [4,5,6,7,10,11],
    spazio: "25 cm tra piante", acqua: "media", sole: "mezz'ombra",
    difficolta: "facile", vasoOk: true,
    resaKg: 0.3, prezzoKg: 3.0,
    giorniMaturazione: 55,
    concimi: [
      { nome: "Compost leggero", quando: "Prima del trapianto", come: "Una manciata per pianta, superficiale" },
      { nome: "Macerato di ortica", quando: "Ogni 10-15 gg", come: "Diluito 1:20, apporta azoto per le foglie" },
    ]
  },
  { id: "basilico", nome: "Basilico", categoria: "orto", emoji: "🌿",
    descrizione: "Aromatica essenziale. Cima regolarmente per favorire la ramificazione e ritardare la fioritura.",
    semina: [4,5], trapianto: [5,6], raccolta: [6,7,8,9],
    spazio: "30 cm tra piante", acqua: "media", sole: "pieno",
    difficolta: "facile", vasoOk: true,
    resaKg: 0.15, prezzoKg: 25.0,
    giorniMaturazione: 35,
    concimi: [
      { nome: "Compost maturo", quando: "In piantagione", come: "Poco, non ama substrati troppo ricchi" },
      { nome: "Macerato di ortica leggero", quando: "Ogni 20 gg", come: "Diluito 1:20, per foglie più profumate" },
    ]
  },
  { id: "peperone", nome: "Peperone", categoria: "orto", emoji: "🫑",
    descrizione: "Richiede calore e tempi lunghi. Sostieni i rami carichi di frutti con tutori.",
    semina: [2,3], trapianto: [5], raccolta: [7,8,9,10],
    spazio: "50 cm tra piante", acqua: "media", sole: "pieno",
    difficolta: "media", vasoOk: true,
    resaKg: 1.2, prezzoKg: 3.0,
    giorniMaturazione: 90,
    concimi: [
      { nome: "Compost maturo", quando: "Al trapianto", come: "Manciata nella buca" },
      { nome: "Macerato di consolida", quando: "In fioritura", come: "Diluito 1:10, ricco di potassio" },
      { nome: "Cenere di legna", quando: "In fruttificazione", come: "Piccola dose mensile (1 cucchiaio)" },
    ]
  },
  { id: "melanzana", nome: "Melanzana", categoria: "orto", emoji: "🍆",
    descrizione: "Ama il caldo. Cimare la pianta dopo 4-5 foglie stimola la produzione laterale.",
    semina: [2,3], trapianto: [5], raccolta: [7,8,9,10],
    spazio: "60 cm tra piante", acqua: "alta", sole: "pieno",
    difficolta: "media", vasoOk: true,
    resaKg: 2, prezzoKg: 2.0,
    giorniMaturazione: 85,
    concimi: [
      { nome: "Letame maturo", quando: "Prima del trapianto", come: "Incorporato abbondantemente (3 kg/mq)" },
      { nome: "Macerato di consolida", quando: "Ogni 15 gg in fioritura", come: "Diluito 1:10" },
    ]
  },
  { id: "carota", nome: "Carota", categoria: "orto", emoji: "🥕",
    descrizione: "Richiede terreno soffice e profondo, privo di sassi. Diradare le piantine è essenziale.",
    semina: [3,4,5,6,7], trapianto: [], raccolta: [6,7,8,9,10],
    spazio: "5 cm tra piante", acqua: "media", sole: "pieno",
    difficolta: "media", vasoOk: false,
    resaKg: 0.08, prezzoKg: 1.8,
    giorniMaturazione: 100,
    concimi: [
      { nome: "Compost stramaturo", quando: "2-3 mesi prima della semina", come: "Incorporato leggero; mai letame fresco (causa ramificazioni)" },
      { nome: "Cenere di legna", quando: "Durante la crescita", come: "Spolverata per apporto potassio" },
    ]
  },
  { id: "cipolla", nome: "Cipolla", categoria: "orto", emoji: "🧅",
    descrizione: "Si pianta in bulbilli. Riduci le irrigazioni prima della raccolta per migliorare la conservazione.",
    semina: [2,3,9,10], trapianto: [2,3,10], raccolta: [6,7],
    spazio: "15 cm tra piante", acqua: "bassa", sole: "pieno",
    difficolta: "facile", vasoOk: false,
    resaKg: 0.12, prezzoKg: 1.5,
    giorniMaturazione: 120,
    concimi: [
      { nome: "Compost molto maturo", quando: "In pre-impianto", come: "Leggero; mai letame fresco" },
      { nome: "Cenere di legna", quando: "A metà crescita", come: "Una spolverata per migliorare conservazione" },
    ]
  },
  { id: "fagiolino", nome: "Fagiolino", categoria: "orto", emoji: "🫘",
    descrizione: "Raccolta scalare. I fagiolini rampicanti richiedono tutori alti fino a 2 metri.",
    semina: [4,5,6,7], trapianto: [], raccolta: [6,7,8,9],
    spazio: "20 cm tra piante", acqua: "media", sole: "pieno",
    difficolta: "facile", vasoOk: true,
    resaKg: 0.3, prezzoKg: 4.5,
    giorniMaturazione: 60,
    concimi: [
      { nome: "Compost leggero", quando: "Pre-semina", come: "Poco: i legumi fissano azoto da soli" },
      { nome: "Cenere di legna", quando: "In fioritura", come: "Spolverata per potassio" },
    ]
  },
  { id: "rosmarino", nome: "Rosmarino", categoria: "orto", emoji: "🌱",
    descrizione: "Aromatica perenne resistente alla siccità. Una volta avviata richiede pochissime cure.",
    semina: [3,4], trapianto: [4,5,9,10], raccolta: [1,2,3,4,5,6,7,8,9,10,11,12],
    spazio: "80 cm tra piante", acqua: "bassa", sole: "pieno",
    difficolta: "facile", vasoOk: true,
    resaKg: 0.3, prezzoKg: 15.0,
    giorniMaturazione: 180,
    concimi: [
      { nome: "Compost maturo", quando: "In piantagione", come: "Poco: predilige terreni poveri e drenati" },
    ]
  },

  // FRUTTETO
  { id: "limone", nome: "Limone", categoria: "frutteto", emoji: "🍋",
    descrizione: "Agrume rifiorente tipico mediterraneo. Teme il gelo sotto i -3°C, ripararlo o coltivarlo in vaso.",
    semina: [], trapianto: [3,4,10], raccolta: [11,12,1,2,3,4,5],
    spazio: "4 m tra piante", acqua: "media", sole: "pieno",
    difficolta: "media", vasoOk: true,
    resaKg: 15, prezzoKg: 2.5,
    concimi: [
      { nome: "Letame maturo", quando: "Fine inverno", come: "2-3 kg alla base, interrato leggero" },
      { nome: "Concime per agrumi (naturale)", quando: "Primavera ed estate", come: "Seguendo dose prodotto; miscele con cornunghia" },
      { nome: "Ferro (in chelato o lupini macerati)", quando: "A primavera se foglie ingialliscono", come: "Per prevenire clorosi ferrica, tipica degli agrumi" },
    ]
  },
  { id: "fico", nome: "Fico", categoria: "frutteto", emoji: "🫒",
    descrizione: "Albero robusto e rustico. Alcune varietà producono due volte: fioroni a giugno e fichi a agosto-settembre.",
    semina: [], trapianto: [10,11,2,3], raccolta: [6,8,9],
    spazio: "5 m tra piante", acqua: "bassa", sole: "pieno",
    difficolta: "facile", vasoOk: false,
    resaKg: 20, prezzoKg: 4.0,
    concimi: [
      { nome: "Letame maturo", quando: "Fine autunno", come: "Una carriola distribuita sotto la chioma e interrata" },
    ]
  },
  { id: "olivo", nome: "Olivo", categoria: "frutteto", emoji: "🫒",
    descrizione: "Simbolo del Mediterraneo. Potatura a vaso ogni anno dopo la raccolta, molto longevo.",
    semina: [], trapianto: [3,4,10,11], raccolta: [10,11,12],
    spazio: "6 m tra piante", acqua: "bassa", sole: "pieno",
    difficolta: "media", vasoOk: false,
    resaKg: 15, prezzoKg: 3.0,
    concimi: [
      { nome: "Letame maturo", quando: "Fine inverno", come: "3-5 kg/pianta distribuiti sotto la chioma" },
      { nome: "Sansa/potature triturate (pacciamatura)", quando: "In autunno", come: "Al piede come apporto organico lento" },
    ]
  },
  { id: "pesco", nome: "Pesco", categoria: "frutteto", emoji: "🍑",
    descrizione: "Albero da frutto di vita breve (15-20 anni). Richiede potatura invernale accurata ogni anno.",
    semina: [], trapianto: [11,12,1,2], raccolta: [6,7,8],
    spazio: "5 m tra piante", acqua: "media", sole: "pieno",
    difficolta: "media", vasoOk: false,
    resaKg: 25, prezzoKg: 2.5,
    concimi: [
      { nome: "Letame maturo", quando: "Fine autunno", come: "2-3 kg/pianta, interrato leggero sotto chioma" },
      { nome: "Cenere di legna", quando: "Pre-fioritura", come: "1-2 kg distribuiti al piede, per potassio e pH" },
    ]
  },
  { id: "vite", nome: "Vite", categoria: "frutteto", emoji: "🍇",
    descrizione: "Richiede palo o pergolato. Potatura secca in inverno e potatura verde in estate per la qualità dei grappoli.",
    semina: [], trapianto: [11,12,1,2,3], raccolta: [8,9,10],
    spazio: "2 m tra piante", acqua: "bassa", sole: "pieno",
    difficolta: "difficile", vasoOk: false,
    resaKg: 4, prezzoKg: 3.5,
    concimi: [
      { nome: "Letame maturo o compost", quando: "Fine inverno", come: "1-2 kg/pianta interrati leggero" },
      { nome: "Sovescio di leguminose", quando: "Autunno-inverno", come: "Semina trifoglio/favino tra i filari, si interra in primavera" },
    ]
  },
  { id: "melo", nome: "Melo", categoria: "frutteto", emoji: "🍎",
    descrizione: "Preferisce climi freschi ma esistono varietà adatte al Sud. Diradare i frutti a giugno per pezzature migliori.",
    semina: [], trapianto: [11,12,1,2], raccolta: [8,9,10],
    spazio: "4 m tra piante", acqua: "media", sole: "pieno",
    difficolta: "media", vasoOk: false,
    resaKg: 30, prezzoKg: 2.0,
    concimi: [
      { nome: "Letame maturo", quando: "Autunno-inverno", come: "3-4 kg/pianta sotto la chioma" },
      { nome: "Compost", quando: "Primavera", come: "Manciata intorno al piede" },
    ]
  },
  { id: "ciliegio", nome: "Ciliegio", categoria: "frutteto", emoji: "🍒",
    descrizione: "Fioritura spettacolare a primavera. Proteggi i frutti con reti antiuccello prima della maturazione.",
    semina: [], trapianto: [11,12,1,2], raccolta: [5,6],
    spazio: "6 m tra piante", acqua: "media", sole: "pieno",
    difficolta: "media", vasoOk: false,
    resaKg: 15, prezzoKg: 6.0,
    concimi: [
      { nome: "Letame maturo", quando: "Fine autunno", come: "2-3 kg/pianta sotto la chioma" },
      { nome: "Cenere di legna", quando: "Dopo la raccolta", come: "Spolverata leggera per potassio" },
    ]
  },
  { id: "albicocco", nome: "Albicocco", categoria: "frutteto", emoji: "🍑",
    descrizione: "Fiorisce molto presto, attenzione alle gelate tardive. Produce abbondantemente in anni alterni.",
    semina: [], trapianto: [11,12,1,2], raccolta: [6,7],
    spazio: "5 m tra piante", acqua: "media", sole: "pieno",
    difficolta: "media", vasoOk: false,
    resaKg: 20, prezzoKg: 3.0,
    concimi: [
      { nome: "Letame maturo", quando: "Fine autunno", come: "2-3 kg/pianta distribuiti sotto la chioma" },
      { nome: "Compost maturo", quando: "Primavera", come: "Leggero rinforzo prima della ripresa vegetativa" },
    ]
  },
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

// ============================================================
// CONSIGLI TERRENO — in base a tipo, pH, durezza
// ============================================================
function getConsigliTerreno({ terrenoTipo, terrenoPH, terrenoDurezza }) {
  const consigli = [];

  // Per tipo di terreno
  if (terrenoTipo === "argilloso") {
    consigli.push({
      titolo: "Terreno argilloso",
      problema: "Trattiene molta acqua, si compatta e tende a impermeabilizzarsi.",
      rimedi: [
        "Incorpora sabbia silicea di fiume (20-30% del volume lavorato)",
        "Aggiungi compost maturo o letame (almeno 3-4 kg/mq ogni 2 anni)",
        "Pacciama sempre per evitare crepe da siccità",
        "Non lavorarlo mai quando bagnato: formi zolle durissime",
      ],
      prodotti: ["sabbia silicea di fiume", "compost maturo", "perlite agricola", "corteccia fine"],
    });
  }
  if (terrenoTipo === "sabbioso") {
    consigli.push({
      titolo: "Terreno sabbioso",
      problema: "Troppo drenante, non trattiene acqua né nutrienti.",
      rimedi: [
        "Incorpora compost in quantità (4-5 kg/mq) per dare struttura",
        "Aggiungi torba bionda per aumentare ritenzione idrica",
        "Usa argilla bentonitica (10-15%) per legare particelle",
        "Pacciama spesso per ridurre l'evaporazione",
      ],
      prodotti: ["compost maturo", "torba bionda", "argilla bentonitica", "humus di lombrico"],
    });
  }
  if (terrenoTipo === "limoso") {
    consigli.push({
      titolo: "Terreno limoso",
      problema: "Facile da lavorare ma può indurirsi in superficie (crosta) e drenare male.",
      rimedi: [
        "Incorpora sostanza organica abbondante (compost, letame)",
        "Lavora quando è leggermente umido, mai secco né fradicio",
        "Pacciama con paglia o sfalcio per mantenere struttura soffice",
      ],
      prodotti: ["compost maturo", "paglia", "corteccia tritata"],
    });
  }
  if (terrenoTipo === "calcareo") {
    consigli.push({
      titolo: "Terreno calcareo",
      problema: "pH alto, spesso causa clorosi (ingiallimento) soprattutto negli agrumi e piante acidofile.",
      rimedi: [
        "Evita piante acidofile (azalee, ortensie, mirtilli) o coltivale in vaso con terriccio acido",
        "Integra zolfo agricolo per abbassare lentamente il pH",
        "Aggiungi torba acida nelle buche di piantagione",
        "Per agrumi: concime chelato di ferro se ingialliscono",
      ],
      prodotti: ["zolfo agricolo", "torba acida (di sfagno)", "chelato di ferro", "solfato di ammonio"],
    });
  }
  if (terrenoTipo === "torboso") {
    consigli.push({
      titolo: "Terreno torboso",
      problema: "Molto acido e povero di nutrienti minerali, a volte troppo umido.",
      rimedi: [
        "Correggi con calce agricola per alzare pH",
        "Aggiungi cenere di legna (apporta potassio e alcalinizza)",
        "Se umido: crea drenaggio con ciottoli in fondo",
      ],
      prodotti: ["calce agricola", "cenere di legna", "ghiaia grossa per drenaggio"],
    });
  }
  if (terrenoTipo === "franco") {
    consigli.push({
      titolo: "Terreno franco (misto)",
      problema: "Sei fortunato: è il tipo ideale, equilibrato tra sabbia, limo e argilla.",
      rimedi: [
        "Mantieni la fertilità con apporti regolari di compost (2 kg/mq all'anno)",
        "Pacciama per conservare umidità e struttura",
        "Ruota le colture per evitare stanchezza del suolo",
      ],
      prodotti: ["compost maturo", "humus di lombrico", "pacciamatura di paglia"],
    });
  }

  // Per pH
  if (terrenoPH === "acido") {
    consigli.push({
      titolo: "pH acido (< 6.5)",
      problema: "Alcune piante (olivo, legumi, brassicacee) soffrono. Favorisce acidofile.",
      rimedi: [
        "Per correggere verso il neutro: calce agricola (200-300 g/mq in autunno)",
        "Cenere di legna come alternativa naturale (meno efficace, 500 g/mq)",
        "Ideale per: mirtilli, azalee, ortensie blu, rododendri, patate, fragole",
      ],
      prodotti: ["calce agricola", "dolomite", "cenere di legna"],
    });
  }
  if (terrenoPH === "basico") {
    consigli.push({
      titolo: "pH basico (> 7.5)",
      problema: "Gli agrumi ingialliscono (clorosi ferrica). Limita assorbimento ferro e manganese.",
      rimedi: [
        "Zolfo agricolo (30-50 g/mq) per abbassare lentamente",
        "Torba acida nelle buche di piantagione",
        "Concime chelato di ferro per piante clorotiche (es. agrumi, ortensie)",
      ],
      prodotti: ["zolfo agricolo", "torba acida di sfagno", "chelato di ferro EDDHA"],
    });
  }

  // Per durezza
  if (terrenoDurezza === "compatto") {
    consigli.push({
      titolo: "Terreno compatto / duro",
      problema: "Radici faticano a svilupparsi, acqua ristagna in superficie o scorre via.",
      rimedi: [
        "Lavorazione profonda in autunno con forcone o vanga (non motozappa)",
        "Sovescio con piante a radice profonda (rafano, senape, favino) che rompono il suolo",
        "Apporto massiccio di sostanza organica per arieggiare",
        "Valuta bancali rialzati: bypassi il problema del terreno esistente",
      ],
      prodotti: ["compost maturo", "paglia", "forcone da vanga", "semi da sovescio (favino, senape)"],
    });
  }
  if (terrenoDurezza === "medio") {
    consigli.push({
      titolo: "Drenaggio medio",
      problema: "Va bene così — manutenzione ordinaria.",
      rimedi: [
        "Apporto annuale di compost per mantenere struttura",
        "Pacciama per proteggere la superficie",
      ],
      prodotti: ["compost maturo"],
    });
  }
  if (terrenoDurezza === "sciolto") {
    consigli.push({
      titolo: "Terreno sciolto",
      problema: "Drena benissimo, ma può perdere rapidamente acqua e nutrienti.",
      rimedi: [
        "Irrigazioni più frequenti ma meno abbondanti",
        "Compost e humus per aumentare ritenzione",
        "Pacciamatura ridondante per ridurre evaporazione",
      ],
      prodotti: ["humus di lombrico", "compost maturo", "pacciamatura spessa"],
    });
  }

  return consigli;
}

// Agrumi — sensibili al gelo e alle forti escursioni termiche
const AGRUMI = new Set(["limone", "arancio", "mandarino", "pompelmo", "cedro", "lime", "bergamotto", "kumquat", "clementina"]);
const ALTITUDINE_MONTANA = 500; // m — soglia per considerare "montagna"

const APP_VERSION = "1.7.1";

// Endpoint API: in produzione chiama il proxy Netlify Function che nasconde la key.
// In dev locale funziona comunque se Netlify CLI gira (netlify dev).
// Fallback: chiamata diretta ad Anthropic (richiede CORS enabled, improbabile).
const CLAUDE_API_ENDPOINT = "/api/claude";

// Shift stagionale effettivo: microclima + bonus serra (anticipa ~3 settimane).
// La serra tipo appezzamento o il flag hasSerra contribuiscono entrambi.
// ============================================================
// NOTIFICHE LOCALI — reminder giornaliero
// ============================================================
const NotificationHelper = {
  // chiedi il permesso all'utente
  async requestPermission() {
    if (!("Notification" in window)) return "unsupported";
    if (Notification.permission === "granted") return "granted";
    if (Notification.permission === "denied") return "denied";
    const result = await Notification.requestPermission();
    return result;
  },
  // invia una notifica ora
  async notify(title, body, options = {}) {
    if (!("Notification" in window) || Notification.permission !== "granted") return false;
    try {
      // preferisco il service worker se disponibile (più affidabile su Android)
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(title, {
          body,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          tag: options.tag || "verdeguida-reminder",
          requireInteraction: false,
          ...options,
        });
        return true;
      }
      new Notification(title, { body, icon: "/icon-192.png", ...options });
      return true;
    } catch (e) {
      console.error("Errore notifica:", e);
      return false;
    }
  },
  // calcola i millisecondi fino alla prossima occorrenza di oraHHMM (es "08:00")
  msUntilNext(oraHHMM) {
    const [h, m] = oraHHMM.split(":").map(Number);
    const now = new Date();
    const next = new Date(now);
    next.setHours(h, m, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    return next - now;
  },
};


// chiave deterministica per identificare un task giornaliero.
// Data formato ISO "YYYY-MM-DD", tipo es. "irrigazione", plantId es. "pomodoro"
function dayTaskKey(date, tipo, plantId) {
  const iso = date instanceof Date ? date.toISOString().slice(0, 10) : date;
  return `${iso}__${tipo}__${plantId}`;
}

// Restituisce true se la pianta dell'utente ha raggiunto la maturazione
// per l'orto annuale (giorniMaturazione dalla data di piantagione).
// Per frutteti usa la logica età (resaPerEta > 0).
// Retrocompatibilità: se non ho dati, restituisco true (comportamento vecchio).
function isReadyForHarvest(plant, userPlant) {
  if (!plant) return false;
  if (plant.categoria === "ornamentale") return false; // non si "raccolgono"
  if (plant.categoria === "frutteto") {
    return resaPerEta(plant, userPlant) > 0;
  }
  // orto annuale
  if (!userPlant.dataPiantagione || !plant.giorniMaturazione) return true; // comportamento vecchio
  const piantato = new Date(userPlant.dataPiantagione);
  const oggi = new Date();
  const giorni = Math.floor((oggi - piantato) / (1000 * 60 * 60 * 24));
  return giorni >= plant.giorniMaturazione;
}

// Moltiplicatore di resa per frutteto in base all'età (anni dall'impianto).
// Restituisce un valore tra 0 e 1. Per le piante dell'orto annuale ritorna sempre 1.
function resaPerEta(plant, userPlant) {
  if (plant.categoria !== "frutteto") return 1;
  const annoImpianto = userPlant.annoImpianto;
  if (!annoImpianto) return 1; // se non specificato, assume piena produzione
  const eta = new Date().getFullYear() - annoImpianto;
  if (eta < 0) return 0;
  if (eta < 3) return 0;
  if (eta === 3) return 0.2;
  if (eta === 4) return 0.4;
  if (eta === 5) return 0.6;
  if (eta === 6) return 0.8;
  return 1;
}

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
// INNESTI — tecniche principali di innesto per frutteto
// ============================================================
const INNESTI = [
  {
    id: "scudetto",
    nome: "Innesto a gemma (scudetto)",
    difficolta: "media",
    icona: "🔬",
    periodo: "Luglio - Agosto",
    descrizione: "Il più diffuso per fruttiferi e agrumi. Si preleva una singola gemma con un piccolo 'scudetto' di corteccia dal portamarze e la si inserisce sotto la corteccia del portainnesto, incidendo una T.",
    comeFare: "1) Pratica un taglio a T sulla corteccia del portainnesto, in un punto liscio del tronco. 2) Preleva dal marza un occhio (gemma) con uno scudetto di corteccia lungo 2-3 cm. 3) Solleva i lembi del taglio a T con la lama e inserisci lo scudetto. 4) Lega stretto con rafia elastica, lasciando fuori la gemma. 5) Dopo 2-3 settimane verifica l'attecchimento.",
    piante: "Pesco, albicocco, ciliegio, melo, pero, agrumi, olivo (meno frequente)",
    claim: "Alta percentuale di riuscita, poco materiale vegetale richiesto",
  },
  {
    id: "spacco",
    nome: "Innesto a marza (spacco)",
    difficolta: "facile",
    icona: "✂️",
    periodo: "Fine inverno (Febbraio-Marzo), prima della ripresa",
    descrizione: "Il più intuitivo per principianti: si apre in due con un colpo d'ascia il portainnesto tagliato e si inseriscono una o due marze (rametti con 2-3 gemme) a cuneo.",
    comeFare: "1) Taglia netto il portainnesto a circa 50-80 cm da terra. 2) Con scalpello o roncola, apri il taglio a metà (spacco di 5-6 cm). 3) Prepara la marza: rametto di 15 cm con 2-3 gemme, tagliato a cuneo in basso. 4) Inserisci 1 o 2 marze nello spacco facendo combaciare il cambio (strato verde sotto la corteccia). 5) Sigilla con mastice per innesti e lega.",
    piante: "Melo, pero, pesco, albicocco, olivo, vite (rinnovo piante adulte)",
    claim: "Tecnica robusta per riprendere piante vecchie o cambiar varietà",
  },
  {
    id: "corona",
    nome: "Innesto a corona",
    difficolta: "media",
    icona: "👑",
    periodo: "Primavera (Marzo-Aprile), a fine ripresa",
    descrizione: "Variante dell'innesto a spacco, adatta a portainnesti di grande diametro (oltre 5 cm). Le marze si inseriscono tra corteccia e legno senza aprire il tronco, disposte a corona.",
    comeFare: "1) Taglia netto il portainnesto. 2) Incidi la corteccia verticalmente (non il legno) in 3-4 punti equidistanti. 3) Solleva delicatamente la corteccia con la lama. 4) Inserisci 3-4 marze (a cuneo, 2-3 gemme ciascuna) tra corteccia e legno. 5) Lega saldamente e sigilla con mastice.",
    piante: "Alberi adulti di melo, pero, noce, castagno, olivo",
    claim: "Ideale per reinnestare esemplari con tronco grosso",
  },
  {
    id: "triangolo",
    nome: "Innesto a triangolo",
    difficolta: "difficile",
    icona: "🔺",
    periodo: "Fine inverno (Febbraio-Marzo)",
    descrizione: "Tecnica di precisione: si ricava un incavo triangolare nel portainnesto e vi si inserisce una marza sagomata a triangolo corrispondente. Massima aderenza tra i tessuti.",
    comeFare: "1) Taglia il portainnesto netto. 2) Con attrezzo specifico (o coltello affilato), ricava un incavo triangolare profondo 3-4 cm sul lato. 3) Sagoma la marza a triangolo in modo complementare. 4) Inserisci facendo combaciare con precisione. 5) Lega saldamente e sigilla.",
    piante: "Soprattutto fruttiferi con tronco medio-grande",
    claim: "Alta percentuale di attecchimento, ma richiede precisione",
  },
  {
    id: "ponte",
    nome: "Innesto a ponte (salvataggio)",
    difficolta: "difficile",
    icona: "🌉",
    periodo: "Primavera (Marzo-Aprile)",
    descrizione: "Non per propagazione ma per salvare alberi con cortecce rovinate da roditori, gelo o tagli accidentali. Marze-ponte collegano la zona sana sopra e sotto la lesione, ripristinando la circolazione linfatica.",
    comeFare: "1) Pulisci i bordi della zona rovinata fino al legno sano. 2) Prepara marze diritte lunghe quanto la lesione + 5 cm, tagliate a cuneo entrambi i lati. 3) Incidi piccole T nella corteccia sana sopra e sotto. 4) Inserisci ogni marza con orientamento originale (gemme verso alto), a ponte sulla ferita. 5) Ne servono 3-6 distribuite. 6) Lega e sigilla.",
    piante: "Qualsiasi albero da frutto danneggiato",
    claim: "Ultima spiaggia per salvare piante compromesse",
  },
  {
    id: "gemma-dormiente",
    nome: "Innesto a gemma dormiente",
    difficolta: "media",
    icona: "😴",
    periodo: "Fine estate (Agosto-Settembre)",
    descrizione: "Simile allo scudetto ma la gemma resta 'addormentata' fino alla primavera successiva. Tecnica tradizionale per innestare giovani piante di 1-2 anni in vivaio, senza interrompere la stagione in corso.",
    comeFare: "1) Preleva una gemma con scudetto da rami dell'anno. 2) Inseriscila come per l'innesto a scudetto. 3) Lega stretto. 4) Non tagliare sopra la gemma: resterà dormiente fino a primavera. 5) A marzo, quando la gemma parte, taglia il portainnesto appena sopra l'innesto.",
    piante: "Fruttiferi in vivaio, rose, olivo",
    claim: "Permette di innestare in un anno e sfruttare la stagione successiva",
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
    // Per orto annuale: mostro il task solo dai mesi in cui la pianta sarà matura.
    // Se ho dataPiantagione + giorniMaturazione, calcolo il mese stimato di prima raccolta.
    if (plant.categoria === "orto" && userPlant.dataPiantagione && plant.giorniMaturazione) {
      const piantato = new Date(userPlant.dataPiantagione);
      const maturazione = new Date(piantato);
      maturazione.setDate(maturazione.getDate() + plant.giorniMaturazione);
      // se il mese della raccolta calendario è PRIMA del mese di maturazione stimato, skip
      const meseCorrente = new Date(year, m - 1, 1);
      const meseMaturazione = new Date(maturazione.getFullYear(), maturazione.getMonth(), 1);
      if (meseCorrente < meseMaturazione) return;
    }
    tasks.push({
      type: "raccolta", icon: "🧺", mese: m, year,
      titolo: `Raccolta ${plant.nome}`,
      descrizione: `Quantità stimata: ${userPlant.quantita} piante.`
    });
  });

  // irrigazione suggerita per tutti i mesi dell'anno, con intensità variabile
  // La funzione calcolaIrrigazione(plant, tipo, mese) regola già frequenza e volume
  // in base alla stagione, quindi basta iterare tutti i mesi rilevanti per la pianta.
  // Logica:
  // - acqua alta: aprile-ottobre (trapianti primaverili + estate lunga + residuo autunnale)
  // - acqua media: aprile-settembre
  // - acqua bassa: giugno-agosto (solo picco estivo)
  // Le ornamentali/frutteti stabili seguono la stessa logica.
  const mesiIrrigazione = plant.acqua === "alta"
    ? [4,5,6,7,8,9,10]
    : plant.acqua === "media"
    ? [4,5,6,7,8,9]
    : [6,7,8];
  mesiIrrigazione.forEach(m => {
    const ir = calcolaIrrigazione(plant, appezzamento?.tipo, m);
    // Calcolo le date precise nel mese (se ogni N giorni, genero le date)
    const anno = year;
    const meseIdx = m - 1;
    const giorniNelMese = new Date(anno, m, 0).getDate();
    const dateIrrigazione = [];
    // parto dal primo del mese, aggiungo ir.giorni ogni volta
    // seed sulla pianta per variare tra piante (evita clustering)
    const seed = plant.id.charCodeAt(0) % ir.giorni;
    for (let d = 1 + seed; d <= giorniNelMese; d += ir.giorni) {
      dateIrrigazione.push(d);
    }
    // formatto le date come "Lun 3, Gio 6, Dom 9, ..."
    const GG = ["Dom","Lun","Mar","Mer","Gio","Ven","Sab"];
    const dateLabel = dateIrrigazione.map(d => {
      const date = new Date(anno, meseIdx, d);
      return `${GG[date.getDay()]} ${d}`;
    }).join(", ");
    tasks.push({
      type: "irrigazione", icon: "💧", mese: m, year,
      titolo: `Irriga ${plant.nome}`,
      descrizione: `${ir.freqLabel}, ${ir.volLabel}. Giorni consigliati: ${dateLabel}.`,
      giorni: dateIrrigazione,
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
// Definizione unificata delle tab / view di navigazione
const VIEWS = [
  { id: "home", label: "Il mio orto", shortLabel: "Orto", icon: Sprout },
  { id: "agenda", label: "Questa settimana", shortLabel: "Oggi", icon: Clock },
  { id: "calendario", label: "Calendario", shortLabel: "Calendario", icon: Calendar },
  { id: "stagione", label: "Cosa piantare ora", shortLabel: "Stagione", icon: Leaf },
  { id: "catalogo", label: "Catalogo piante", shortLabel: "Catalogo", icon: BookOpen },
  { id: "tecniche", label: "Tecniche & hack", shortLabel: "Tecniche", icon: Lightbulb },
  { id: "innesti", label: "Innesti", shortLabel: "Innesti", icon: Scissors },
  { id: "pacciamatura", label: "Pacciamatura", shortLabel: "Pacciame", icon: Layers },
  { id: "appezzamenti", label: "Appezzamenti", shortLabel: "Aree", icon: MapPin },
];

// Hook swipe orizzontale: rileva gesti left/right con soglia e ignora scroll verticale
function useSwipeHorizontal(onSwipeLeft, onSwipeRight) {
  const touchStart = useRef(null);
  const touchCurrent = useRef(null);

  const onTouchStart = (e) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY, time: Date.now() };
    touchCurrent.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchMove = (e) => {
    if (!touchStart.current) return;
    const t = e.touches[0];
    touchCurrent.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = () => {
    if (!touchStart.current || !touchCurrent.current) return;
    const dx = touchCurrent.current.x - touchStart.current.x;
    const dy = touchCurrent.current.y - touchStart.current.y;
    const dt = Date.now() - touchStart.current.time;

    const MIN_DISTANCE = 75;     // distanza minima in pixel
    const MAX_TIME = 600;        // tempo massimo (ms) - swipe rapido
    const MAX_VERTICAL = 60;     // spostamento verticale max

    if (dt < MAX_TIME && Math.abs(dx) > MIN_DISTANCE && Math.abs(dy) < MAX_VERTICAL) {
      if (dx < 0 && onSwipeLeft) onSwipeLeft();
      else if (dx > 0 && onSwipeRight) onSwipeRight();
    }

    touchStart.current = null;
    touchCurrent.current = null;
  };

  return { onTouchStart, onTouchMove, onTouchEnd };
}

export default function VerdeGuida() {
  const [view, setView] = useState("home"); // home | calendario | stagione | catalogo | appezzamenti

  const [showTour, setShowTour] = useState(false);

  // Al primo accesso in assoluto, apri automaticamente il tour. Solo una volta.
  useEffect(() => {
    try {
      const seen = localStorage.getItem("tour_seen");
      if (!seen) {
        // piccolo delay per far apparire dopo il caricamento iniziale
        const t = setTimeout(() => setShowTour(true), 500);
        return () => clearTimeout(t);
      }
    } catch {}
  }, []);

  // Quando il tour viene chiuso, segna che l'utente l'ha visto
  const handleCloseTour = () => {
    setShowTour(false);
    try { localStorage.setItem("tour_seen", "1"); } catch {}
  };
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

  // ========== NOTIFICHE ==========
  const [notifPermission, setNotifPermission] = useState(typeof Notification !== "undefined" ? Notification.permission : "default");
  const [notifSettings, setNotifSettings] = useState({
    enabled: false,
    time: "08:00", // HH:MM
  });

  // ========== TASK GIORNALIERI COMPLETATI ==========
  // Struttura: { "YYYY-MM-DD__tipo__plantId": true }
  const [dayTasksDone, setDayTasksDone] = useState({});

  const saveDayTasksDone = async (next) => {
    setDayTasksDone(next);
    try { await window.storage.set("day_tasks_done", JSON.stringify(next)); } catch(e){}
  };

  // toggle di un task (solo se è oggi)
  const toggleDayTask = (taskKey) => {
    const next = { ...dayTasksDone };
    if (next[taskKey]) delete next[taskKey];
    else next[taskKey] = true;
    saveDayTasksDone(next);
  };

  // appezzamento attivo (per filtrare viste)
  const [activeAppezzamentoId, setActiveAppezzamentoId] = useState("all");

  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  // ========== LOAD ==========
  useEffect(() => {
    (async () => {
      try {
        const [aRes, pRes, tRes, cRes, nRes, dRes] = await Promise.all([
          window.storage.get("appezzamenti").catch(() => null),
          window.storage.get("user_plants").catch(() => null),
          window.storage.get("completed_tasks").catch(() => null),
          window.storage.get("custom_plants").catch(() => null),
          window.storage.get("notif_settings").catch(() => null),
          window.storage.get("day_tasks_done").catch(() => null),
        ]);
        if (aRes) setAppezzamenti(JSON.parse(aRes.value));
        if (pRes) setUserPlants(JSON.parse(pRes.value));
        if (tRes) setCompletedTasks(JSON.parse(tRes.value));
        if (cRes) setCustomPlants(JSON.parse(cRes.value));
        if (nRes) setNotifSettings(JSON.parse(nRes.value));
        if (dRes) {
          // carico e pulisco i task più vecchi di 30 giorni
          const done = JSON.parse(dRes.value);
          const trentaGgFa = new Date();
          trentaGgFa.setDate(trentaGgFa.getDate() - 30);
          const cutoff = trentaGgFa.toISOString().slice(0, 10); // "YYYY-MM-DD"
          const cleaned = {};
          Object.entries(done).forEach(([key, val]) => {
            const keyDate = key.slice(0, 10);
            if (keyDate >= cutoff) cleaned[key] = val;
          });
          setDayTasksDone(cleaned);
          // salvo la versione pulita se è cambiata
          if (Object.keys(cleaned).length !== Object.keys(done).length) {
            try { await window.storage.set("day_tasks_done", JSON.stringify(cleaned)); } catch(e){}
          }
        }
      } catch(e) {}
      setLoading(false);
    })();
  }, []);

  // salvataggio impostazioni notifiche
  const saveNotifSettings = async (next) => {
    setNotifSettings(next);
    try { await window.storage.set("notif_settings", JSON.stringify(next)); } catch(e){}
  };

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
  const addPlant = (catalogPlant, quantita, note, appezzamentoId, annoImpianto, dataPiantagione) => {
    const newPlant = {
      id: `plant_${Date.now()}`,
      plantId: catalogPlant.id,
      quantita: quantita || 1,
      note: note || "",
      appezzamentoId: appezzamentoId || activeAppezzamentoId,
      annoImpianto: annoImpianto || null,
      dataPiantagione: dataPiantagione || null,
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

  // ============================================================
  // TASK DI OGGI — replica la logica dell'agenda settimanale ma solo per oggi
  // Ritorna array di { tipo, piante: [{nome,emoji}], appezzamenti: [string] }
  // ============================================================
  const todayTasks = useMemo(() => {
    const oggi = new Date();
    const oggiIso = oggi.toISOString().slice(0, 10);
    const giornoSett = oggi.getDay();
    const giornoIdx = giornoSett === 0 ? 6 : giornoSett - 1; // lun=0, dom=6
    const mese = oggi.getMonth() + 1;

    const tasks = [];
    plantsVisible.forEach(up => {
      const plant = fullCatalog.find(p => p.id === up.plantId);
      if (!plant) return;
      const appezz = appezzamenti.find(a => a.id === up.appezzamentoId);
      const shift = effectiveShift(appezz);
      const semina = shiftMesi(plant.semina, shift);
      const trapianto = shiftMesi(plant.trapianto, shift);
      const raccolta = shiftMesi(plant.raccolta, shift);

      const addTask = (tipo, extra) => {
        // evita duplicati stessa pianta+tipo (se più userPlant della stessa specie)
        if (tasks.some(t => t.tipo === tipo && t.plant.id === plant.id)) return;
        tasks.push({
          id: dayTaskKey(oggiIso, tipo, plant.id),
          tipo, plant,
          appezzamenti: appezz ? [appezz.nome] : [],
          extra,
        });
      };

      if (giornoIdx === 2 && semina.includes(mese)) addTask("semina");
      if (giornoIdx === 2 && trapianto.includes(mese)) addTask("trapianto");
      if (giornoIdx === 5 && raccolta.includes(mese) && plant.categoria !== "ornamentale" && isReadyForHarvest(plant, up)) addTask("raccolta");

      const fabbisogno = plant.acqua;
      const mesiIrrigare = fabbisogno === "alta" ? [4,5,6,7,8,9,10]
        : fabbisogno === "media" ? [4,5,6,7,8,9]
        : [6,7,8];
      if (mesiIrrigare.includes(mese)) {
        const ir = calcolaIrrigazione(plant, appezz?.tipo, mese);
        const seed = plant.id.charCodeAt(0) % ir.giorni;
        const dayOfMonth = oggi.getDate();
        if (((dayOfMonth - 1 - seed) % ir.giorni) === 0 && (dayOfMonth - 1 - seed) >= 0) {
          addTask("irrigazione", ir.volLabel);
        }
      }
      if (giornoIdx === 5 && plant.categoria === "frutteto" && !plant.custom) {
        let meseTarget = 2;
        if (plant.id === "olivo") meseTarget = 3;
        if (plant.id === "vite" && mese === 1) meseTarget = 1;
        if (plant.id === "vite" && mese === 6) meseTarget = 6;
        if (mese === meseTarget) addTask("potatura");
      }
    });

    // Accorpo le appezzamenti per tipo+pianta (se stessa pianta in più appezzamenti)
    return tasks;
  }, [plantsVisible, fullCatalog, appezzamenti]);

  // ============================================================
  // SCHEDULE NOTIFICHE — setTimeout all'ora scelta, loop ogni 24h
  // ============================================================
  useEffect(() => {
    if (!notifSettings.enabled || notifPermission !== "granted") return;

    const tipoLabels = {
      semina: "semina", trapianto: "trapianta",
      raccolta: "raccogli", irrigazione: "irriga", potatura: "pota"
    };

    const scheduleNext = () => {
      const ms = NotificationHelper.msUntilNext(notifSettings.time);
      return setTimeout(() => {
        // calcolo al momento dello scatto (todayTasks potrebbe essere stale)
        const oggi = new Date();
        const giornoSett = oggi.getDay();
        const giornoIdx = giornoSett === 0 ? 6 : giornoSett - 1;
        const mese = oggi.getMonth() + 1;

        const tasksOggi = [];
        plantsVisible.forEach(up => {
          const plant = fullCatalog.find(p => p.id === up.plantId);
          if (!plant) return;
          const appezz = appezzamenti.find(a => a.id === up.appezzamentoId);
          const shift = effectiveShift(appezz);
          const semina = shiftMesi(plant.semina, shift);
          const trapianto = shiftMesi(plant.trapianto, shift);
          const raccolta = shiftMesi(plant.raccolta, shift);

          if (giornoIdx === 2 && semina.includes(mese)) tasksOggi.push(`semina ${plant.nome}`);
          if (giornoIdx === 2 && trapianto.includes(mese)) tasksOggi.push(`trapianta ${plant.nome}`);
          if (giornoIdx === 5 && raccolta.includes(mese) && plant.categoria !== "ornamentale" && isReadyForHarvest(plant, up)) tasksOggi.push(`raccogli ${plant.nome}`);
          const fab = plant.acqua;
          const mesiI = fab === "alta" ? [4,5,6,7,8,9,10] : fab === "media" ? [4,5,6,7,8,9] : [6,7,8];
          if (mesiI.includes(mese)) {
            const ir = calcolaIrrigazione(plant, appezz?.tipo, mese);
            const seed = plant.id.charCodeAt(0) % ir.giorni;
            const dom = oggi.getDate();
            if (((dom - 1 - seed) % ir.giorni) === 0 && (dom - 1 - seed) >= 0) tasksOggi.push(`irriga ${plant.nome}`);
          }
        });

        if (tasksOggi.length > 0) {
          const body = tasksOggi.slice(0, 6).join(", ") + (tasksOggi.length > 6 ? `, e altre ${tasksOggi.length - 6} cose` : "");
          NotificationHelper.notify("🌱 Buongiorno! Oggi nell'orto:", body, { tag: "daily-reminder" });
        } else {
          NotificationHelper.notify("🌱 Buongiorno!", "Oggi nessun intervento programmato. Goditi il tuo orto.", { tag: "daily-reminder" });
        }
        // schedula la prossima
        scheduleNext();
      }, ms);
    };

    const timer = scheduleNext();
    return () => clearTimeout(timer);
  }, [notifSettings, notifPermission, plantsVisible, fullCatalog, appezzamenti]);

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

  // ========== SWIPE tra tab ==========
  const SWIPE_ORDER = ["home", "agenda", "calendario", "catalogo"]; // quelle primary
  const swipeHandlers = useSwipe(
    () => {
      // swipe sinistra → tab successiva
      const idx = SWIPE_ORDER.indexOf(view);
      if (idx >= 0 && idx < SWIPE_ORDER.length - 1) setView(SWIPE_ORDER[idx + 1]);
    },
    () => {
      // swipe destra → tab precedente
      const idx = SWIPE_ORDER.indexOf(view);
      if (idx > 0) setView(SWIPE_ORDER[idx - 1]);
    }
  );

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
            <button onClick={() => setShowTour(true)}
              className="rounded-full flex items-center gap-1.5 transition tour-cta"
              style={{
                background: "var(--c-terra)",
                color: "var(--c-cream)",
                border: "none",
                cursor: "pointer",
                padding: "6px 14px",
                fontSize: "12px",
                fontWeight: 700,
                boxShadow: "0 2px 6px rgba(42,36,24,0.15)",
              }}
              title="Come funziona VerdeGuida">
              <HelpCircle size={14}/>
              <span>Guida</span>
            </button>
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

        {/* NAV (solo desktop, su mobile uso bottom nav) */}
        <nav className="mt-5 hidden md:flex gap-2 overflow-x-auto scroll-hide pb-1 md:flex-wrap">
          {VIEWS.map(n => (
            <button key={n.id} onClick={() => setView(n.id)} className={`btn-ghost flex-shrink-0 ${view === n.id ? "active" : ""}`}>
              <n.icon size={14}/> {n.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="hairline mx-6 md:mx-10 max-w-6xl" style={{ marginLeft: "auto", marginRight: "auto" }}></div>

      <main className="px-4 md:px-10 py-6 md:py-8 pb-24 md:pb-8 max-w-6xl mx-auto"
        {...swipeHandlers}>
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
          todayTasks={todayTasks}
          onOpenSettings={() => setShowSettings(true)}
          notifEnabled={notifSettings.enabled && notifPermission === "granted"}
          dayTasksDone={dayTasksDone}
          onToggleDayTask={toggleDayTask}
        />}

        {view === "agenda" && <AgendaView
          userPlants={plantsVisible}
          fullCatalog={fullCatalog}
          appezzamenti={appezzamenti}
          dayTasksDone={dayTasksDone}
          onToggleDayTask={toggleDayTask}
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

        {view === "innesti" && <InnestiView />}

        {view === "pacciamatura" && <PacciamaturaView activeApp={activeApp}/>}

        {view === "appezzamenti" && <AppezzamentiView
          appezzamenti={appezzamenti}
          onAdd={() => { setEditingAppezzamento(null); setShowAppezzamentoModal(true); }}
          onEdit={(a) => { setEditingAppezzamento(a); setShowAppezzamentoModal(true); }}
          onRemove={removeAppezzamento}
          userPlants={userPlants}
        />}
      </main>

      {/* FAB: pulsante Aggiungi galleggiante (solo mobile) */}
      {!loading && (
        <FAB
          onAddPlant={() => setView("catalogo")}
          onAddAppezzamento={() => { setEditingAppezzamento(null); setShowAppezzamentoModal(true); }}
          hasAppezzamenti={appezzamenti.length > 0}
        />
      )}

      {/* BOTTOM NAV (solo mobile, fissa in basso) */}
      <BottomNav view={view} setView={setView}/>

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

      {showTour && <TourModal onClose={handleCloseTour} />}

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
          notifSettings={notifSettings}
          notifPermission={notifPermission}
          onNotifChange={async (next) => {
            await saveNotifSettings(next);
            if (next.enabled && notifPermission !== "granted") {
              const result = await NotificationHelper.requestPermission();
              setNotifPermission(result);
              if (result === "granted") {
                // notifica di test/conferma
                NotificationHelper.notify("🌱 Promemoria attivati!", `Riceverai un riepilogo ogni giorno alle ${next.time}`, { tag: "welcome" });
              }
            }
          }}
        />
      )}

      <footer className="px-4 md:px-10 py-8 max-w-6xl mx-auto pb-24 md:pb-8">
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
function HomeView({ appezzamenti, activeApp, userPlants, allAppezzamenti, fullCatalog, removePlant, onEditPlant, upcomingTasks, toggleTaskDone, completedTasks, onAdd, onAddAppezzamento, plantsToSowNow, currentMonth, onQuickAddPlant, todayTasks, onOpenSettings, notifEnabled, dayTasksDone, onToggleDayTask }) {

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
      const prev = map.get(cat.id) || { plant: cat, quantita: 0, valore: 0 };
      prev.quantita += up.quantita;
      if (cat.resaKg && cat.prezzoKg && cat.categoria !== "ornamentale") {
        const mult = resaPerEta(cat, up);
        const kg = cat.resaKg * up.quantita * mult;
        const val = kg * cat.prezzoKg;
        prev.valore += val;
        kgTot += kg;
        valoreTot += val;
      }
      map.set(cat.id, prev);
    });
    return { items: Array.from(map.values()), valoreTot, kgTot };
  }, [userPlants, fullCatalog]);

  return (
    <div className="space-y-6">
      {/* ═════════════ OGGI — reminder del giorno ═════════════ */}
      {userPlants.length > 0 && (
        <section className="fade-up">
          <TodaySection
            todayTasks={todayTasks}
            onOpenSettings={onOpenSettings}
            notifEnabled={notifEnabled}
            dayTasksDone={dayTasksDone}
            onToggleDayTask={onToggleDayTask}
          />
        </section>
      )}

      {/* RENDITA DEL TUO ORTO — collassabile con info */}
      {userPlants.length > 0 && (
        <RenditaSection riepilogo={riepilogo} userPlantsCount={userPlants.length}/>
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

                  {/* Info maturazione per ortaggi annuali */}
                  {cat.categoria === "orto" && up.dataPiantagione && cat.giorniMaturazione && (() => {
                    const pDate = new Date(up.dataPiantagione);
                    const mDate = new Date(pDate);
                    mDate.setDate(mDate.getDate() + cat.giorniMaturazione);
                    const giorniMancanti = Math.ceil((mDate - new Date()) / (1000*60*60*24));
                    const matura = giorniMancanti <= 0;
                    return (
                      <div className="mt-2 text-[11px]" style={{ color: matura ? "var(--c-olive-dark)" : "var(--c-ink)" }}>
                        <p className="serif italic opacity-80">
                          🌱 Piantata il {pDate.toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
                        </p>
                        {matura ? (
                          <p className="font-semibold" style={{ color: "var(--c-olive-dark)" }}>✓ Pronta per il raccolto</p>
                        ) : (
                          <p className="opacity-70">Matura tra {giorniMancanti} giorni ({mDate.toLocaleDateString("it-IT", { day: "numeric", month: "short" })})</p>
                        )}
                      </div>
                    );
                  })()}

                  {/* Info età per frutteto */}
                  {cat.categoria === "frutteto" && up.annoImpianto && (() => {
                    const eta = new Date().getFullYear() - up.annoImpianto;
                    const mult = resaPerEta(cat, up);
                    return (
                      <p className="mt-2 text-[11px] serif italic opacity-70">
                        🌳 Impiantata nel {up.annoImpianto} · {eta} {eta === 1 ? "anno" : "anni"}
                        {mult < 1 && ` · resa ${(mult * 100).toFixed(0)}%`}
                      </p>
                    );
                  })()}

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
              {p.concimi && p.concimi.length > 0 && (
                <p className="text-[10px] italic opacity-60 mt-2 line-clamp-1">
                  🌿 Concimi: {p.concimi.slice(0, 3).map(c => c.nome.toLowerCase()).join(", ")}
                </p>
              )}
              {p.giorniMaturazione > 0 && p.categoria === "orto" && (
                <p className="text-[10px] italic opacity-60 mt-0.5">
                  ⏱️ Matura in ~{p.giorniMaturazione} giorni
                </p>
              )}
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
  // Caratteristiche terreno (tutte opzionali)
  const [terrenoTipo, setTerrenoTipo] = useState(appezzamento?.terrenoTipo || "");
  const [terrenoPH, setTerrenoPH] = useState(appezzamento?.terrenoPH || "");
  const [terrenoDurezza, setTerrenoDurezza] = useState(appezzamento?.terrenoDurezza || "");
  const [showGuidaTerreno, setShowGuidaTerreno] = useState(false);
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
      terrenoTipo: terrenoTipo || null,
      terrenoPH: terrenoPH || null,
      terrenoDurezza: terrenoDurezza || null,
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

        {/* ═══ TERRENO (tutti i campi opzionali) ═══ */}
        <div className="card p-3 mb-4" style={{ background: "var(--c-cream)" }}>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider opacity-70">Il tuo terreno</span>
              <p className="text-[11px] opacity-60 italic mt-0.5">Tutti i campi sono opzionali. Ti aiutiamo a capire come migliorarlo.</p>
            </div>
            <button type="button"
              onClick={() => setShowGuidaTerreno(true)}
              className="flex items-center gap-1 text-[11px] underline opacity-70 hover:opacity-100 flex-shrink-0"
              style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--c-olive-dark)" }}>
              <HelpCircle size={12}/> Come capire?
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
            <label className="block">
              <span className="text-[10px] uppercase tracking-wider opacity-60 font-bold">Tipo</span>
              <select value={terrenoTipo} onChange={(e) => setTerrenoTipo(e.target.value)}
                className="w-full mt-1 px-2 py-2 rounded-lg text-sm"
                style={{ border: "1.5px solid var(--c-border)", background: "white", fontSize: "14px" }}>
                <option value="">Non so</option>
                <option value="argilloso">Argilloso</option>
                <option value="sabbioso">Sabbioso</option>
                <option value="limoso">Limoso</option>
                <option value="calcareo">Calcareo</option>
                <option value="torboso">Torboso</option>
                <option value="franco">Franco (misto ideale)</option>
              </select>
            </label>

            <label className="block">
              <span className="text-[10px] uppercase tracking-wider opacity-60 font-bold">pH</span>
              <select value={terrenoPH} onChange={(e) => setTerrenoPH(e.target.value)}
                className="w-full mt-1 px-2 py-2 rounded-lg text-sm"
                style={{ border: "1.5px solid var(--c-border)", background: "white", fontSize: "14px" }}>
                <option value="">Non so</option>
                <option value="acido">Acido (&lt; 6.5)</option>
                <option value="neutro">Neutro (6.5-7.5)</option>
                <option value="basico">Basico (&gt; 7.5)</option>
              </select>
            </label>

            <label className="block">
              <span className="text-[10px] uppercase tracking-wider opacity-60 font-bold">Durezza</span>
              <select value={terrenoDurezza} onChange={(e) => setTerrenoDurezza(e.target.value)}
                className="w-full mt-1 px-2 py-2 rounded-lg text-sm"
                style={{ border: "1.5px solid var(--c-border)", background: "white", fontSize: "14px" }}>
                <option value="">Non so</option>
                <option value="sciolto">Sciolto / drenante</option>
                <option value="medio">Medio</option>
                <option value="compatto">Compatto / duro</option>
              </select>
            </label>
          </div>

          {/* Consigli live */}
          {(terrenoTipo || terrenoPH || terrenoDurezza) && (() => {
            const consigli = getConsigliTerreno({ terrenoTipo, terrenoPH, terrenoDurezza });
            if (consigli.length === 0) return null;
            return (
              <div className="mt-3 space-y-2">
                <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: "var(--c-olive-dark)" }}>💡 Consigli per il tuo terreno</p>
                {consigli.map((c, i) => (
                  <div key={i} className="p-2 rounded" style={{ background: "white", borderLeft: "3px solid var(--c-olive)" }}>
                    <p className="serif font-bold text-sm">{c.titolo}</p>
                    <p className="text-[11px] italic opacity-70 mt-0.5">{c.problema}</p>
                    <ul className="text-[11px] mt-1.5 space-y-0.5">
                      {c.rimedi.map((r, j) => <li key={j}>• {r}</li>)}
                    </ul>
                    <p className="text-[10px] mt-1.5 opacity-70">
                      <b>Cerca in giardineria:</b> {c.prodotti.join(", ")}
                    </p>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Guida terreno modal */}
        {showGuidaTerreno && (
          <ModalPortal>
            <div style={{ position: "fixed", inset: 0, background: "rgba(42,36,24,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "12px" }}
              onClick={() => setShowGuidaTerreno(false)}>
              <div className="card" style={{ maxWidth: "500px", width: "100%", background: "var(--c-bg)", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="serif italic text-[10px] uppercase tracking-wider opacity-60">— guida —</p>
                    <h3 className="serif font-bold text-2xl">Come capire che terreno ho?</h3>
                  </div>
                  <button onClick={() => setShowGuidaTerreno(false)} className="opacity-60 hover:opacity-100"><X size={18}/></button>
                </div>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="serif font-bold mb-1">🫴 Prova della palla</p>
                    <p className="text-xs opacity-80">Prendi una manciata di terra umida, stringila in pugno. Se forma <b>una palla compatta</b> che resta unita = argilloso. Se si <b>sbriciola subito</b> = sabbioso. Se forma palla ma si rompe al tocco = limoso/franco.</p>
                  </div>
                  <div>
                    <p className="serif font-bold mb-1">🫙 Prova della bottiglia</p>
                    <p className="text-xs opacity-80">Riempi una bottiglia trasparente per metà con terra, il resto acqua. Agita bene, lascia riposare 24 ore. Vedrai strati: sabbia (in basso), limo (in mezzo), argilla (sopra). Se prevale lo strato basso = sabbioso. Quello alto = argilloso.</p>
                  </div>
                  <div>
                    <p className="serif font-bold mb-1">🧪 Test pH con striscette</p>
                    <p className="text-xs opacity-80">Compra in giardineria delle strisce pH (costano 5-10€). Metti un po' di terra in un bicchiere con acqua distillata, mescola, immergi la striscia. Verde = neutro, rosso/arancio = acido, blu = basico.</p>
                  </div>
                  <div>
                    <p className="serif font-bold mb-1">💧 Come capire la durezza</p>
                    <p className="text-xs opacity-80">Prova a piantare una vanga: se entra facilmente e tira su zolla morbida = sciolto. Se serve forza ma va = medio. Se rimbalza o si pianta a fatica = compatto.</p>
                  </div>
                  <div>
                    <p className="serif font-bold mb-1">🌱 Indizi visivi</p>
                    <ul className="text-xs opacity-80 space-y-0.5 mt-1">
                      <li>• <b>Muschio abbondante</b> = terreno acido e/o umido</li>
                      <li>• <b>Crepe profonde</b> quando asciutto = argilloso</li>
                      <li>• <b>Scorre via l'acqua</b> subito = sabbioso</li>
                      <li>• <b>Foglie gialle su agrumi</b> = probabilmente basico</li>
                    </ul>
                  </div>
                  <div className="card p-2" style={{ background: "var(--c-cream)" }}>
                    <p className="text-[11px] italic opacity-80">
                      💡 <b>Nessuna pressione:</b> se non sei sicuro, lascia tutto vuoto. L'app funziona bene anche senza questi dettagli.
                    </p>
                  </div>
                </div>
                <button className="btn-primary w-full mt-4 justify-center" onClick={() => setShowGuidaTerreno(false)}>
                  Ho capito
                </button>
              </div>
            </div>
          </ModalPortal>
        )}

        <div className="mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider opacity-70">Località</span>
          <p className="text-[11px] opacity-60 italic mt-0.5 mb-1">Serve a calcolare il microclima (shift stagionale)</p>
          <div className="flex flex-col sm:flex-row gap-2 mt-1">
            <input type="text" value={localitaQuery}
              onChange={(e) => { setLocalitaQuery(e.target.value); setLocalitaSelected(null); }}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), cercaLocalita())}
              placeholder="Es: Piana degli Albanesi"
              className="flex-1 px-3 py-2 rounded-lg" style={{ border: "1.5px solid var(--c-border)", background: "var(--c-cream)" }}/>
            <button type="button" onClick={cercaLocalita} disabled={searching} className="btn-ghost justify-center">
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
  const [annoImpianto, setAnnoImpianto] = useState(""); // anno di impianto (solo per frutteto)
  const [dataPiantagione, setDataPiantagione] = useState(() => new Date().toISOString().slice(0, 10)); // YYYY-MM-DD, default oggi

  const selectedApp = appezzamenti.find(a => a.id === appezzamentoId);
  const irrigazione = selectedApp ? calcolaIrrigazione(plant, selectedApp.tipo, currentMonth + 1) : null;
  const shiftSett = effectiveShift(selectedApp);
  const seminaShifted = shiftMesi(plant.semina, shiftSett);
  const trapiantoShifted = shiftMesi(plant.trapianto, shiftSett);
  const raccoltaShifted = shiftMesi(plant.raccolta, shiftSett);
  const isVaso = selectedApp && IN_VASO.has(selectedApp.tipo);
  const notFit = isVaso && !plant.vasoOk;

  // ===== AGRUMI IN MONTAGNA =====
  const isAgrume = AGRUMI.has(plant.id);
  const altitudineApp = selectedApp?.altitudine || 0;
  const hasSerra = selectedApp && (selectedApp.hasSerra || selectedApp.tipo === "serra");
  const agrumiMontagnaProblema = isAgrume && altitudineApp >= ALTITUDINE_MONTANA && !hasSerra;
  const [confirmAgrumiMontagna, setConfirmAgrumiMontagna] = useState(false);

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
  // idroponica annulla il problema fuori stagione
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

        {/* ===== WARNING AGRUMI MONTAGNA ===== */}
        {agrumiMontagnaProblema && (
          <div className="card mb-4" style={{
            background: "#fff3cd",
            borderColor: "#d4a73b",
            borderWidth: "2px"
          }}>
            <div className="flex items-start gap-3">
              <AlertTriangle size={24} style={{ color: "#b45309", flexShrink: 0 }} className="mt-0.5"/>
              <div className="flex-1">
                <p className="serif font-bold text-base mb-1" style={{ color: "#b45309" }}>
                  🌡️ Agrumi in zona montana
                </p>
                <p className="text-xs leading-relaxed opacity-90 mb-2">
                  Il tuo appezzamento è a <b>{altitudineApp} m</b> di altitudine. Gli agrumi come <b>{plant.nome.toLowerCase()}</b> soffrono molto in montagna: temono il gelo sotto i -3°C e le grandi escursioni termiche giorno/notte rallentano la maturazione e provocano cadute dei frutti.
                </p>
                <p className="text-xs leading-relaxed mb-2" style={{ color: "#b45309" }}>
                  💡 <b>Ti consigliamo una serra</b> o la coltivazione in vaso da riparare in inverno. Valuta se hai modo di proteggere la pianta da ottobre ad aprile.
                </p>
                <label className="flex items-start gap-2 mt-3 p-2 rounded cursor-pointer" style={{ background: "rgba(180,83,9,0.1)" }}>
                  <input type="checkbox" checked={confirmAgrumiMontagna} onChange={(e) => setConfirmAgrumiMontagna(e.target.checked)}
                    className="mt-0.5 flex-shrink-0"/>
                  <span className="text-[11px] serif italic opacity-80">
                    Sono consapevole del rischio e ho modo di proteggere la pianta. Procedo comunque.
                  </span>
                </label>
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

        {/* Anno impianto - solo per frutteti */}
        {plant.categoria === "frutteto" && (
          <label className="block mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider opacity-70">Anno di impianto (opzionale)</span>
            <input type="number" min="1950" max={new Date().getFullYear()}
              value={annoImpianto} onChange={(e) => setAnnoImpianto(e.target.value)}
              placeholder={`Es: ${new Date().getFullYear() - 5}`}
              className="w-full mt-1 px-3 py-2 rounded-lg text-sm" style={{ border: "1.5px solid var(--c-border)", background: "var(--c-cream)" }}/>
            <p className="text-[11px] opacity-60 italic mt-1">
              Serve a calcolare una resa realistica. Gli alberi giovani producono meno: &lt; 3 anni non producono, poi ~20% al terzo anno fino a produzione piena dal settimo.
              {plant.id === "olivo" && <><br/>🫒 <b>Per l'olivo</b>: la resa stimata (~25 kg/pianta) si riferisce a olive da tavola. Per l'olio considera che ~5 kg di olive fanno 1 L.</>}
            </p>
          </label>
        )}

        {/* Data piantagione - solo per ortaggi annuali (no ornamentali, no frutteto) */}
        {plant.categoria === "orto" && (
          <label className="block mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider opacity-70">Data di semina/trapianto</span>
            <input type="date" value={dataPiantagione}
              onChange={(e) => setDataPiantagione(e.target.value)}
              max={new Date().toISOString().slice(0,10)}
              className="w-full mt-1 px-3 py-2 rounded-lg text-sm" style={{ border: "1.5px solid var(--c-border)", background: "var(--c-cream)", fontSize: "16px" }}/>
            {plant.giorniMaturazione && dataPiantagione && (() => {
              const pDate = new Date(dataPiantagione);
              const mDate = new Date(pDate);
              mDate.setDate(mDate.getDate() + plant.giorniMaturazione);
              const opts = { day: "numeric", month: "long", year: "numeric" };
              const giorniMancanti = Math.ceil((mDate - new Date()) / (1000*60*60*24));
              return (
                <p className="text-[11px] opacity-70 italic mt-1">
                  🌱 Matura in circa <b>{plant.giorniMaturazione} giorni</b> → raccolta prevista dal <b>{mDate.toLocaleDateString("it-IT", opts)}</b>
                  {giorniMancanti > 0 ? ` (tra ${giorniMancanti} giorni)` : ` (già matura!)`}
                </p>
              );
            })()}
          </label>
        )}

        <label className="block mb-5">
          <span className="text-xs font-semibold uppercase tracking-wider opacity-70">Note personali (opzionale)</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows="2"
            placeholder="Es: varietà cuore di bue…"
            className="w-full mt-1 px-3 py-2 rounded-lg text-sm" style={{ border: "1.5px solid var(--c-border)", background: "var(--c-cream)" }}/>
        </label>

        <div className="flex gap-2">
          <button className="btn-ghost flex-1" onClick={onClose}>Annulla</button>
          <button className="btn-primary flex-1 justify-center"
            onClick={() => onAdd(plant, quantita, note, appezzamentoId, annoImpianto ? parseInt(annoImpianto) : null, plant.categoria === "orto" ? dataPiantagione : null)}
            disabled={(fuoriStagioneEffettivo && !hasSerra && !confirmOutOfSeason) || (agrumiMontagnaProblema && !confirmAgrumiMontagna)}
            style={((fuoriStagioneEffettivo && !hasSerra && !confirmOutOfSeason) || (agrumiMontagnaProblema && !confirmAgrumiMontagna)) ? { opacity: 0.5, cursor: "not-allowed" } : {}}>
            <Plus size={14}/> {fuoriStagioneEffettivo && !hasSerra && !confirmOutOfSeason ? "Fuori stagione" : (agrumiMontagnaProblema && !confirmAgrumiMontagna) ? "Conferma il rischio" : "Aggiungi"}
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
  const [annoImpianto, setAnnoImpianto] = useState(userPlant.annoImpianto || "");
  const [dataPiantagione, setDataPiantagione] = useState(userPlant.dataPiantagione || "");
  const [problemi, setProblemi] = useState(userPlant.problemi || []);
  const [showProblemaForm, setShowProblemaForm] = useState(false);
  const [problemaRisoltoFlash, setProblemaRisoltoFlash] = useState(null);
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
    const current = problemi.find(p => p.id === id);
    const willResolve = current && !current.risolto;
    setProblemi(problemi.map(p => p.id === id ? { ...p, risolto: !p.risolto } : p));
    // flash celebrativo quando si risolve un problema
    if (willResolve) {
      setProblemaRisoltoFlash(id);
      setTimeout(() => setProblemaRisoltoFlash(null), 2800);
    }
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
            className="flex-1 py-2 px-2 rounded-full text-xs font-semibold transition"
            style={{ background: tab === "info" ? "var(--c-ink)" : "transparent", color: tab === "info" ? "var(--c-cream)" : "var(--c-ink)", cursor: "pointer" }}>
            Info & cure
          </button>
          <button onClick={() => setTab("concimi")}
            className="flex-1 py-2 px-2 rounded-full text-xs font-semibold transition"
            style={{ background: tab === "concimi" ? "var(--c-ink)" : "transparent", color: tab === "concimi" ? "var(--c-cream)" : "var(--c-ink)", cursor: "pointer" }}>
            Concimi
          </button>
          <button onClick={() => setTab("problemi")}
            className="flex-1 py-2 px-2 rounded-full text-xs font-semibold transition flex items-center justify-center gap-1"
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

            {/* Anno impianto - solo per frutteti */}
            {plant.categoria === "frutteto" && (
              <label className="block mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider opacity-70">Anno di impianto</span>
                <input type="number" min="1950" max={new Date().getFullYear()}
                  value={annoImpianto} onChange={(e) => setAnnoImpianto(e.target.value)}
                  placeholder="Es: 2020"
                  className="w-full mt-1 px-3 py-2 rounded-lg text-sm" style={{ border: "1.5px solid var(--c-border)", background: "var(--c-cream)" }}/>
                {annoImpianto && (() => {
                  const eta = new Date().getFullYear() - parseInt(annoImpianto);
                  const mult = resaPerEta(plant, { annoImpianto: parseInt(annoImpianto) });
                  return (
                    <p className="text-[11px] opacity-70 italic mt-1">
                      Età: <b>{eta} {eta === 1 ? "anno" : "anni"}</b>.
                      {mult === 0 && " Ancora in fase di attecchimento, resa zero."}
                      {mult > 0 && mult < 1 && ` Resa stimata al ${(mult * 100).toFixed(0)}% della produzione piena.`}
                      {mult === 1 && " Pianta in piena produzione."}
                    </p>
                  );
                })()}
              </label>
            )}

            {/* Data piantagione - solo per ortaggi annuali */}
            {plant.categoria === "orto" && (
              <label className="block mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider opacity-70">Data di semina/trapianto</span>
                <input type="date" value={dataPiantagione}
                  onChange={(e) => setDataPiantagione(e.target.value)}
                  max={new Date().toISOString().slice(0,10)}
                  className="w-full mt-1 px-3 py-2 rounded-lg text-sm" style={{ border: "1.5px solid var(--c-border)", background: "var(--c-cream)", fontSize: "16px" }}/>
                {plant.giorniMaturazione && dataPiantagione && (() => {
                  const pDate = new Date(dataPiantagione);
                  const mDate = new Date(pDate);
                  mDate.setDate(mDate.getDate() + plant.giorniMaturazione);
                  const opts = { day: "numeric", month: "long", year: "numeric" };
                  const giorniMancanti = Math.ceil((mDate - new Date()) / (1000*60*60*24));
                  return (
                    <p className="text-[11px] opacity-70 italic mt-1">
                      🌱 Piantata il <b>{pDate.toLocaleDateString("it-IT", opts)}</b>. Raccolta prevista dal <b>{mDate.toLocaleDateString("it-IT", opts)}</b>
                      {giorniMancanti > 0 ? ` (tra ${giorniMancanti} giorni)` : " ✓ già matura"}
                    </p>
                  );
                })()}
                {!dataPiantagione && (
                  <p className="text-[11px] opacity-60 italic mt-1">
                    Se vuota, la raccolta viene suggerita secondo il calendario generale (non per questa pianta specifica).
                  </p>
                )}
              </label>
            )}

            <label className="block mb-5">
              <span className="text-xs font-semibold uppercase tracking-wider opacity-70">Note personali</span>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows="2"
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm" style={{ border: "1.5px solid var(--c-border)", background: "var(--c-cream)" }}/>
            </label>
          </div>
        )}

        {tab === "concimi" && (
          <div className="space-y-3 mb-5">
            <div className="card p-3" style={{ background: "var(--c-cream)" }}>
              <p className="text-sm serif italic opacity-80">
                🌿 Consigli di concimazione biologica per {plant.nome.toLowerCase()}.
              </p>
            </div>

            {(!plant.concimi || plant.concimi.length === 0) && (
              <div className="card text-center py-8 opacity-60">
                <p className="text-4xl mb-2">🌿</p>
                <p className="serif italic text-sm">Nessun consiglio di concimazione specifico disponibile per questa pianta.</p>
                {plant.custom && (
                  <p className="text-xs mt-3 opacity-70">Per le piante custom puoi aggiungere i concimi modificandola dal Catalogo.</p>
                )}
              </div>
            )}

            {plant.concimi && plant.concimi.map((c, i) => (
              <div key={i} className="card" style={{ background: "var(--c-bg)", borderLeft: "4px solid var(--c-olive)" }}>
                <div className="flex items-start gap-3">
                  <div className="text-2xl flex-shrink-0">🌿</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="serif font-bold text-base">{c.nome}</h4>
                    <div className="mt-2 space-y-1.5 text-sm">
                      <p>
                        <span className="text-[10px] uppercase tracking-wider opacity-60 font-bold mr-1">Quando:</span>
                        {c.quando}
                      </p>
                      <p>
                        <span className="text-[10px] uppercase tracking-wider opacity-60 font-bold mr-1">Come:</span>
                        {c.come}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="card p-3 mt-4" style={{ background: "var(--c-olive)", color: "var(--c-cream)", borderColor: "var(--c-olive)" }}>
              <p className="text-xs serif italic">
                💡 <b>Regola d'oro:</b> meglio poco e spesso che tanto in una volta. I concimi naturali agiscono lentamente e sostengono la pianta senza stressarla.
              </p>
            </div>
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

                    {/* flash celebrativo */}
                    {problemaRisoltoFlash === p.id && (
                      <div className="mt-2 p-2 rounded text-center fade-up"
                        style={{ background: "var(--c-olive)", color: "var(--c-cream)" }}>
                        <p className="serif font-bold text-sm">🎉 Ben fatto!</p>
                        <p className="text-[11px] opacity-90">La tua pianta ringrazia.</p>
                      </div>
                    )}

                    {/* Bottone azione risoluzione */}
                    {!p.risolto ? (
                      <button onClick={() => toggleRisolto(p.id)}
                        className="mt-3 btn-primary w-full justify-center text-xs"
                        style={{ background: "var(--c-olive)", color: "var(--c-cream)" }}>
                        <CheckCircle2 size={13}/> Segna come risolto
                      </button>
                    ) : (
                      <button onClick={() => toggleRisolto(p.id)}
                        className="mt-3 btn-ghost w-full justify-center text-xs">
                        ↩️ Riapri problema
                      </button>
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
            onClick={() => onSave(userPlant.id, { quantita, note, appezzamentoId, problemi, annoImpianto: annoImpianto ? parseInt(annoImpianto) : null, dataPiantagione: dataPiantagione || null })}>>
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
        body: JSON.stringify({ prompt, maxTokens: 600 }),
      });

      if (!res.ok) {
        let dettaglio = `Server ha risposto ${res.status}`;
        try {
          const errBody = await res.json();
          if (errBody.error?.message) dettaglio += ` — ${errBody.error.message}`;
          else if (errBody.error?.type) dettaglio += ` — ${errBody.error.type}`;
        } catch (e) { /* ignora */ }
        throw new Error(dettaglio);
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
// ModalPortal — render di modali fuori dal tree via createPortal
// Così gli z-index non vengono schiacciati da contesti di stacking locali
// ============================================================
function ModalPortal({ children }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}

// ============================================================
// SVG ILLUSTRATIVI — diagrammi tecnici per ogni innesto
// ============================================================
// Palette condivisa:
//   bark (corteccia marrone), wood (legno chiaro), cambio (strato verde vitale),
//   leaf (fogliame), string (rafia), num (numeri rossi dei passaggi)
const INN_SVG_COL = {
  bark: "#6b4423",
  barkLight: "#8a6239",
  wood: "#d4ac5e",
  cambio: "#7a8c3c",
  leaf: "#5a7028",
  leafLight: "#7a8c3c",
  string: "#c9b88b",
  stringDark: "#a0845a",
  num: "#c83737",
  ink: "#2a2418",
  bg: "transparent",
};

const NumBadge = ({ x, y, n }) => (
  <g>
    <circle cx={x} cy={y} r="11" fill={INN_SVG_COL.num} stroke="#fff" strokeWidth="2"/>
    <text x={x} y={y + 4} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#fff">{n}</text>
  </g>
);

function InnestoSVG({ id }) {
  const C = INN_SVG_COL;
  const common = { width: "100%", height: "auto", style: { maxHeight: 260 } };

  // ─────────── SCUDETTO (gemma) ───────────
  if (id === "scudetto") {
    return (
      <svg viewBox="0 0 500 260" {...common} xmlns="http://www.w3.org/2000/svg">
        {/* Step 1: portainnesto con taglio a T */}
        <text x="70" y="18" textAnchor="middle" fontSize="10" fill={C.ink}>Portainnesto</text>
        <rect x="50" y="30" width="40" height="200" fill={C.bark} rx="3"/>
        <rect x="56" y="36" width="28" height="188" fill={C.wood}/>
        {/* taglio a T sollevato */}
        <path d="M70 80 L70 160 M55 80 L85 80" stroke={C.ink} strokeWidth="2" fill="none"/>
        <path d="M56 82 Q64 95 62 140 L58 140 L56 82 Z" fill={C.barkLight} stroke={C.ink} strokeWidth="0.5"/>
        <path d="M84 82 Q76 95 78 140 L82 140 L84 82 Z" fill={C.barkLight} stroke={C.ink} strokeWidth="0.5"/>
        <NumBadge x={70} y={55} n={1}/>

        {/* Step 2: scudetto con gemma */}
        <text x="200" y="18" textAnchor="middle" fontSize="10" fill={C.ink}>Scudetto (marza)</text>
        <path d="M185 60 Q200 55 215 60 L215 130 Q200 160 185 130 Z" fill={C.barkLight} stroke={C.ink} strokeWidth="1.2"/>
        {/* gemma */}
        <ellipse cx="200" cy="95" rx="5" ry="7" fill={C.leaf}/>
        <ellipse cx="200" cy="92" rx="3" ry="4" fill={C.leafLight}/>
        {/* strato cambio verde */}
        <path d="M189 62 Q200 57 211 62 L211 128 Q200 155 189 128 Z" fill="none" stroke={C.cambio} strokeWidth="1.5" strokeDasharray="2,2"/>
        <NumBadge x={200} y={55} n={2}/>

        {/* Step 3: inserito e legato */}
        <text x="350" y="18" textAnchor="middle" fontSize="10" fill={C.ink}>Inserito e legato</text>
        <rect x="330" y="30" width="40" height="200" fill={C.bark} rx="3"/>
        <rect x="336" y="36" width="28" height="188" fill={C.wood}/>
        {/* scudetto inserito */}
        <path d="M338 85 Q350 80 362 85 L362 145 Q350 165 338 145 Z" fill={C.barkLight} stroke={C.ink} strokeWidth="1"/>
        <ellipse cx="350" cy="115" rx="4" ry="6" fill={C.leaf}/>
        {/* rafia */}
        <path d="M322 95 Q350 93 378 95" stroke={C.string} strokeWidth="3" fill="none"/>
        <path d="M322 108 Q350 106 378 108" stroke={C.string} strokeWidth="3" fill="none"/>
        <path d="M322 135 Q350 133 378 135" stroke={C.string} strokeWidth="3" fill="none"/>
        <path d="M322 148 Q350 146 378 148" stroke={C.string} strokeWidth="3" fill="none"/>
        <text x="350" y="118" textAnchor="middle" fontSize="8" fill="#fff" fontWeight="bold">gemma</text>
        <NumBadge x={350} y={55} n={3}/>

        {/* freccia */}
        <path d="M100 130 L130 130 M125 125 L130 130 L125 135" stroke={C.ink} strokeWidth="1.5" fill="none"/>
        <path d="M240 130 L290 130 M285 125 L290 130 L285 135" stroke={C.ink} strokeWidth="1.5" fill="none"/>

        <text x="435" y="60" fontSize="9" fill={C.ink}>LEGENDA</text>
        <rect x="430" y="70" width="12" height="8" fill={C.bark}/><text x="448" y="77" fontSize="8" fill={C.ink}>corteccia</text>
        <rect x="430" y="85" width="12" height="8" fill={C.wood}/><text x="448" y="92" fontSize="8" fill={C.ink}>legno</text>
        <rect x="430" y="100" width="12" height="2" fill={C.cambio}/><text x="448" y="105" fontSize="8" fill={C.ink}>cambio</text>
        <rect x="430" y="115" width="12" height="3" fill={C.string}/><text x="448" y="121" fontSize="8" fill={C.ink}>rafia</text>
      </svg>
    );
  }

  // ─────────── SPACCO ───────────
  if (id === "spacco") {
    return (
      <svg viewBox="0 0 500 260" {...common} xmlns="http://www.w3.org/2000/svg">
        {/* Step 1: portainnesto tagliato netto */}
        <text x="80" y="18" textAnchor="middle" fontSize="10" fill={C.ink}>1. Taglio netto</text>
        <rect x="62" y="30" width="36" height="200" fill={C.bark} rx="3"/>
        <rect x="68" y="36" width="24" height="194" fill={C.wood}/>
        <line x1="54" y1="36" x2="106" y2="36" stroke={C.ink} strokeWidth="2"/>
        <NumBadge x={80} y={55} n={1}/>

        {/* Step 2: spacco verticale */}
        <text x="200" y="18" textAnchor="middle" fontSize="10" fill={C.ink}>2. Spacco</text>
        <rect x="182" y="30" width="36" height="200" fill={C.bark} rx="3"/>
        <rect x="188" y="36" width="24" height="194" fill={C.wood}/>
        <line x1="200" y1="36" x2="200" y2="90" stroke={C.ink} strokeWidth="2.5"/>
        <path d="M196 36 L200 40 L204 36" fill={C.ink}/>
        <NumBadge x={200} y={55} n={2}/>

        {/* Step 3: marze a cuneo inserite */}
        <text x="320" y="18" textAnchor="middle" fontSize="10" fill={C.ink}>3. Marze inserite</text>
        <rect x="302" y="45" width="36" height="185" fill={C.bark} rx="3"/>
        <rect x="308" y="51" width="24" height="179" fill={C.wood}/>
        {/* marza sinistra */}
        <path d="M300 10 L304 42 L302 42 Z" fill={C.wood} stroke={C.ink} strokeWidth="0.8"/>
        <path d="M295 10 L300 10 L304 42 L300 55 Z" fill={C.bark} stroke={C.ink} strokeWidth="0.8"/>
        <ellipse cx="298" cy="20" rx="2" ry="3" fill={C.leaf}/>
        <ellipse cx="298" cy="28" rx="2" ry="3" fill={C.leaf}/>
        {/* marza destra */}
        <path d="M340 10 L336 42 L338 42 Z" fill={C.wood} stroke={C.ink} strokeWidth="0.8"/>
        <path d="M345 10 L340 10 L336 42 L340 55 Z" fill={C.bark} stroke={C.ink} strokeWidth="0.8"/>
        <ellipse cx="342" cy="20" rx="2" ry="3" fill={C.leaf}/>
        <ellipse cx="342" cy="28" rx="2" ry="3" fill={C.leaf}/>
        <NumBadge x={320} y={65} n={3}/>

        {/* Step 4: legato e sigillato */}
        <text x="440" y="18" textAnchor="middle" fontSize="10" fill={C.ink}>4. Legato + mastice</text>
        <rect x="422" y="45" width="36" height="185" fill={C.bark} rx="3"/>
        <rect x="428" y="51" width="24" height="179" fill={C.wood}/>
        <path d="M420 10 L424 42 L422 42 Z" fill={C.wood}/>
        <path d="M415 10 L420 10 L424 42 L420 52 Z" fill={C.bark}/>
        <ellipse cx="418" cy="20" rx="2" ry="3" fill={C.leaf}/>
        <path d="M460 10 L456 42 L458 42 Z" fill={C.wood}/>
        <path d="M465 10 L460 10 L456 42 L460 52 Z" fill={C.bark}/>
        <ellipse cx="462" cy="20" rx="2" ry="3" fill={C.leaf}/>
        {/* mastice scuro in cima */}
        <ellipse cx="440" cy="48" rx="26" ry="5" fill={C.ink} opacity="0.7"/>
        {/* rafia */}
        <path d="M418 56 Q440 54 462 56" stroke={C.string} strokeWidth="3" fill="none"/>
        <path d="M418 70 Q440 68 462 70" stroke={C.string} strokeWidth="3" fill="none"/>
        <path d="M418 84 Q440 82 462 84" stroke={C.string} strokeWidth="3" fill="none"/>
        <NumBadge x={440} y={65} n={4}/>

        {/* frecce */}
        <path d="M110 130 L170 130 M165 125 L170 130 L165 135" stroke={C.ink} strokeWidth="1.2" fill="none"/>
        <path d="M230 130 L290 130 M285 125 L290 130 L285 135" stroke={C.ink} strokeWidth="1.2" fill="none"/>
        <path d="M350 130 L410 130 M405 125 L410 130 L405 135" stroke={C.ink} strokeWidth="1.2" fill="none"/>
      </svg>
    );
  }

  // ─────────── CORONA ───────────
  if (id === "corona") {
    return (
      <svg viewBox="0 0 500 260" {...common} xmlns="http://www.w3.org/2000/svg">
        {/* Vista dall'alto: tronco grosso con 4 marze inserite a corona */}
        <text x="120" y="18" textAnchor="middle" fontSize="10" fill={C.ink}>Vista dall'alto</text>
        <circle cx="120" cy="130" r="70" fill={C.bark} stroke={C.ink} strokeWidth="1.5"/>
        <circle cx="120" cy="130" r="55" fill={C.wood}/>
        <circle cx="120" cy="130" r="55" fill="none" stroke={C.cambio} strokeWidth="1.5"/>
        {/* 4 marze inserite tra corteccia e legno, disposte a croce */}
        {[
          [120, 60, 0],   // nord
          [190, 130, 90], // est
          [120, 200, 180],// sud
          [50, 130, 270], // ovest
        ].map(([mx, my, rot], i) => (
          <g key={i} transform={`rotate(${rot} ${mx} ${my})`}>
            <rect x={mx - 4} y={my - 8} width="8" height="16" fill={C.wood} stroke={C.ink} strokeWidth="0.8"/>
            <rect x={mx - 5} y={my - 10} width="10" height="4" fill={C.bark} stroke={C.ink} strokeWidth="0.8"/>
            <ellipse cx={mx - 2} cy={my - 13} rx="1.5" ry="2" fill={C.leaf}/>
            <ellipse cx={mx + 2} cy={my - 13} rx="1.5" ry="2" fill={C.leaf}/>
          </g>
        ))}
        <NumBadge x={120} y={80} n={1}/>

        {/* Laterale dettaglio inserzione */}
        <text x="360" y="18" textAnchor="middle" fontSize="10" fill={C.ink}>Dettaglio inserzione</text>
        {/* tronco laterale tagliato */}
        <rect x="300" y="100" width="120" height="130" fill={C.bark}/>
        <rect x="308" y="108" width="104" height="122" fill={C.wood}/>
        {/* taglio verticale sollevato */}
        <path d="M348 108 L348 160" stroke={C.ink} strokeWidth="2"/>
        {/* lembo corteccia sollevato */}
        <path d="M348 108 Q336 115 336 155 L348 160 Z" fill={C.barkLight} stroke={C.ink} strokeWidth="1"/>
        {/* marza inserita */}
        <rect x="340" y="75" width="10" height="35" fill={C.wood} stroke={C.ink} strokeWidth="0.8"/>
        <rect x="338" y="60" width="14" height="20" fill={C.bark} stroke={C.ink} strokeWidth="0.8"/>
        <ellipse cx="342" cy="68" rx="2" ry="3" fill={C.leaf}/>
        <ellipse cx="348" cy="68" rx="2" ry="3" fill={C.leaf}/>
        <NumBadge x={380} y={90} n={2}/>
        <text x="380" y="170" fontSize="9" fill={C.ink}>Marza inserita tra</text>
        <text x="380" y="182" fontSize="9" fill={C.ink}>corteccia e legno</text>

        {/* Nota */}
        <text x="250" y="252" textAnchor="middle" fontSize="9" fill={C.ink} fontStyle="italic">
          Tipicamente 3-4 marze disposte a corona sul portainnesto grande (&gt;5 cm di diametro)
        </text>
      </svg>
    );
  }

  // ─────────── TRIANGOLO ───────────
  if (id === "triangolo") {
    return (
      <svg viewBox="0 0 500 260" {...common} xmlns="http://www.w3.org/2000/svg">
        {/* Step 1: incavo triangolare nel portainnesto */}
        <text x="100" y="18" textAnchor="middle" fontSize="10" fill={C.ink}>1. Incavo triangolare</text>
        <rect x="80" y="30" width="40" height="200" fill={C.bark} rx="3"/>
        <rect x="86" y="36" width="28" height="194" fill={C.wood}/>
        {/* incavo a triangolo sul lato destro */}
        <path d="M120 90 L100 110 L120 130 Z" fill={C.bg} stroke={C.ink} strokeWidth="1.5"/>
        <path d="M120 90 L100 110 L120 130" stroke={C.ink} strokeWidth="0.5" strokeDasharray="1,1" fill="#fff"/>
        <NumBadge x={100} y={55} n={1}/>

        {/* Step 2: marza a triangolo complementare */}
        <text x="240" y="18" textAnchor="middle" fontSize="10" fill={C.ink}>2. Marza sagomata</text>
        <path d="M230 60 L230 95 L210 115 L230 135 L230 170 L245 170 L245 60 Z" fill={C.wood} stroke={C.ink} strokeWidth="1"/>
        <path d="M245 60 L230 60 L230 85 M245 170 L230 170 L230 140" fill="none" stroke={C.bark} strokeWidth="3"/>
        <ellipse cx="237" cy="72" rx="2" ry="3" fill={C.leaf}/>
        <ellipse cx="237" cy="82" rx="2" ry="3" fill={C.leaf}/>
        <NumBadge x={225} y={45} n={2}/>

        {/* Step 3: inserita */}
        <text x="380" y="18" textAnchor="middle" fontSize="10" fill={C.ink}>3. Inserita perfetta</text>
        <rect x="360" y="30" width="40" height="200" fill={C.bark} rx="3"/>
        <rect x="366" y="36" width="28" height="194" fill={C.wood}/>
        {/* triangolo inserito */}
        <path d="M400 90 L380 110 L400 130 Z" fill={C.wood} stroke={C.ink} strokeWidth="1"/>
        <path d="M400 90 L400 70 L420 70 L420 150 L400 150 L400 130" fill={C.bark} stroke={C.ink} strokeWidth="0.8"/>
        <rect x="403" y="73" width="14" height="74" fill={C.wood}/>
        <ellipse cx="410" cy="82" rx="2" ry="3" fill={C.leaf}/>
        <ellipse cx="410" cy="92" rx="2" ry="3" fill={C.leaf}/>
        {/* rafia */}
        <path d="M356 100 Q400 98 425 100" stroke={C.string} strokeWidth="3" fill="none"/>
        <path d="M356 120 Q400 118 425 120" stroke={C.string} strokeWidth="3" fill="none"/>
        <NumBadge x={380} y={55} n={3}/>

        <path d="M130 130 L200 130 M195 125 L200 130 L195 135" stroke={C.ink} strokeWidth="1.2" fill="none"/>
        <path d="M280 130 L340 130 M335 125 L340 130 L335 135" stroke={C.ink} strokeWidth="1.2" fill="none"/>
      </svg>
    );
  }

  // ─────────── PONTE ───────────
  if (id === "ponte") {
    return (
      <svg viewBox="0 0 500 260" {...common} xmlns="http://www.w3.org/2000/svg">
        <text x="250" y="18" textAnchor="middle" fontSize="11" fill={C.ink} fontWeight="bold">Ripara corteccia danneggiata</text>

        {/* Tronco con ferita */}
        <rect x="200" y="30" width="100" height="210" fill={C.bark} rx="3"/>
        <rect x="215" y="45" width="70" height="180" fill={C.wood}/>
        {/* zona danneggiata */}
        <path d="M200 105 Q220 100 300 105 L300 165 Q280 170 200 165 Z" fill={C.wood} stroke={C.ink} strokeWidth="1.2"/>
        <text x="250" y="138" textAnchor="middle" fontSize="9" fill={C.ink} fontStyle="italic">ferita / scortecciato</text>
        <NumBadge x={175} y={135} n={1}/>

        {/* marze a ponte — 3 bastoncini */}
        {[225, 250, 275].map((mx, i) => (
          <g key={i}>
            <rect x={mx - 3} y="95" width="6" height="80" fill={C.wood} stroke={C.ink} strokeWidth="0.8"/>
            {/* estremità inserite sopra e sotto la ferita */}
            <path d={`M${mx - 4} 95 L${mx + 4} 95 L${mx + 3} 100 L${mx - 3} 100 Z`} fill={C.bark}/>
            <path d={`M${mx - 4} 175 L${mx + 4} 175 L${mx + 3} 170 L${mx - 3} 170 Z`} fill={C.bark}/>
            <ellipse cx={mx} cy="125" rx="1.5" ry="2" fill={C.leaf}/>
            <ellipse cx={mx} cy="145" rx="1.5" ry="2" fill={C.leaf}/>
          </g>
        ))}
        <NumBadge x={325} y={135} n={2}/>

        {/* rafia in cima e sotto */}
        <path d="M195 93 Q250 91 305 93" stroke={C.string} strokeWidth="3" fill="none"/>
        <path d="M195 178 Q250 176 305 178" stroke={C.string} strokeWidth="3" fill="none"/>

        <text x="250" y="252" textAnchor="middle" fontSize="9" fill={C.ink} fontStyle="italic">
          Le marze "a ponte" ripristinano la circolazione della linfa
        </text>
      </svg>
    );
  }

  // ─────────── GEMMA DORMIENTE ───────────
  if (id === "gemma-dormiente") {
    return (
      <svg viewBox="0 0 500 260" {...common} xmlns="http://www.w3.org/2000/svg">
        {/* Step 1: agosto, gemma inserita */}
        <text x="100" y="18" textAnchor="middle" fontSize="10" fill={C.ink}>Agosto: gemma inserita</text>
        <rect x="82" y="30" width="36" height="200" fill={C.bark} rx="3"/>
        <rect x="88" y="36" width="24" height="194" fill={C.wood}/>
        {/* scudetto con gemma */}
        <path d="M90 90 Q100 85 110 90 L110 140 Q100 160 90 140 Z" fill={C.barkLight} stroke={C.ink} strokeWidth="1"/>
        <ellipse cx="100" cy="115" rx="4" ry="6" fill={C.leaf}/>
        {/* rafia */}
        <path d="M78 100 Q100 98 122 100" stroke={C.string} strokeWidth="3" fill="none"/>
        <path d="M78 130 Q100 128 122 130" stroke={C.string} strokeWidth="3" fill="none"/>
        <NumBadge x={100} y={55} n={1}/>

        {/* Step 2: inverno, dormiente */}
        <text x="250" y="18" textAnchor="middle" fontSize="10" fill={C.ink}>Inverno: dormiente</text>
        <rect x="232" y="30" width="36" height="200" fill={C.bark} rx="3"/>
        <rect x="238" y="36" width="24" height="194" fill={C.wood}/>
        <ellipse cx="250" cy="115" rx="4" ry="5" fill={C.ink} opacity="0.5"/>
        <text x="280" y="118" fontSize="9" fill={C.ink} fontStyle="italic">gemma non parte</text>
        <NumBadge x={250} y={55} n={2}/>

        {/* Step 3: primavera, taglio e nuovo germoglio */}
        <text x="400" y="18" textAnchor="middle" fontSize="10" fill={C.ink}>Marzo: taglio + germoglio</text>
        <rect x="382" y="80" width="36" height="150" fill={C.bark} rx="3"/>
        <rect x="388" y="86" width="24" height="144" fill={C.wood}/>
        {/* taglio appena sopra l'innesto */}
        <line x1="374" y1="80" x2="426" y2="80" stroke={C.ink} strokeWidth="2"/>
        {/* germoglio nuovo che parte */}
        <path d="M400 90 L400 55 Q402 40 395 30" stroke={C.leaf} strokeWidth="3" fill="none"/>
        <ellipse cx="395" cy="45" rx="4" ry="7" fill={C.leafLight}/>
        <ellipse cx="402" cy="32" rx="3" ry="5" fill={C.leafLight}/>
        <ellipse cx="390" cy="30" rx="3" ry="5" fill={C.leafLight}/>
        <NumBadge x={400} y={115} n={3}/>

        <path d="M130 130 L210 130 M205 125 L210 130 L205 135" stroke={C.ink} strokeWidth="1.2" fill="none"/>
        <path d="M280 130 L360 130 M355 125 L360 130 L355 135" stroke={C.ink} strokeWidth="1.2" fill="none"/>
      </svg>
    );
  }

  return null;
}

// ============================================================
// VIEW: INNESTI — tecniche di innesto per frutteto
// ============================================================
function InnestiView() {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="fade-up">
      <div className="flex items-center gap-3 mb-2">
        <Scissors size={32} style={{ color: "var(--c-terra)" }}/>
        <h2 className="display text-4xl">Innesti</h2>
      </div>
      <p className="serif italic opacity-70 mb-6 max-w-2xl">
        L'arte antica di unire due piante in una. Serve a propagare varietà pregiate, rigenerare alberi adulti o salvare piante danneggiate.
      </p>

      {/* SEZIONE NECESSARIO — sempre visibile prima delle tecniche */}
      <div className="card mb-6" style={{ background: "var(--c-cream)", borderLeft: "4px solid var(--c-ochre)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb size={20} style={{ color: "var(--c-ochre)" }}/>
          <h3 className="serif font-bold text-xl">Prima di iniziare: cosa ti serve</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-[10px] uppercase tracking-wider opacity-60 font-bold mb-1">Attrezzi</p>
            <ul className="space-y-1 text-xs">
              <li>🔪 Coltello da innesto (o lama molto affilata)</li>
              <li>✂️ Forbici da potatura</li>
              <li>🪓 Roncola o scalpello (per lo spacco)</li>
              <li>🎗️ Rafia elastica o nastro da innesti</li>
              <li>🍯 Mastice cicatrizzante</li>
              <li>🏷️ Etichette per identificare varietà</li>
            </ul>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider opacity-60 font-bold mb-1">Materiale vegetale</p>
            <ul className="space-y-1 text-xs">
              <li>🌳 <b>Portainnesto</b>: pianta ricevente sana, senza malattie</li>
              <li>🌿 <b>Marze</b>: rametti di 1 anno, raccolti in riposo vegetativo (Dicembre-Gennaio) e conservati al fresco e umido</li>
              <li>🌱 Compatibilità botanica: pero su pero/cotogno, melo su melo, drupacee tra loro...</li>
            </ul>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider opacity-60 font-bold mb-1">Condizioni ideali</p>
            <ul className="space-y-1 text-xs">
              <li>☁️ Giornata nuvolosa, non piovosa</li>
              <li>🌡️ Temperatura tra 10 e 25°C</li>
              <li>💧 Pianta ricevente ben irrigata nei giorni precedenti</li>
              <li>🧴 Lame sterilizzate con alcool tra un innesto e l'altro</li>
              <li>⚡ Velocità: meno il cambio è esposto all'aria, meglio attecchisce</li>
            </ul>
          </div>
        </div>
      </div>

      <p className="serif italic opacity-70 mb-4 text-sm">
        👇 Tocca una tecnica per vedere i passaggi in dettaglio con illustrazione tecnica.
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        {INNESTI.map((t, i) => {
          const isOpen = expanded === t.id;
          return (
            <div key={t.id} className="card fade-up cursor-pointer" style={{ animationDelay: `${i * 60}ms` }}
              onClick={() => setExpanded(isOpen ? null : t.id)}>
              <div className="flex items-start gap-3">
                <div className="text-4xl">{t.icona}</div>
                <div className="flex-1">
                  <h3 className="serif font-bold text-xl">{t.nome}</h3>
                  <p className="serif italic text-sm opacity-70 mt-0.5">{t.claim}</p>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    <span className="chip">{t.difficolta}</span>
                    <span className="chip" style={{ background: "var(--c-cream)" }}>📅 {t.periodo}</span>
                  </div>
                </div>
              </div>

              <p className="text-sm opacity-80 leading-relaxed mt-3">{t.descrizione}</p>

              {isOpen && (
                <div className="mt-4 pt-4 space-y-3" style={{ borderTop: "1px solid var(--c-border)" }}>
                  {/* ILLUSTRAZIONE */}
                  <div className="card p-2" style={{ background: "var(--c-bg)" }}>
                    <InnestoSVG id={t.id}/>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wider opacity-60 font-bold">Come fare</p>
                    <p className="text-xs mt-1 leading-relaxed" style={{ whiteSpace: "pre-line" }}>{t.comeFare}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider opacity-60 font-bold">Piante adatte</p>
                    <p className="text-xs mt-1">{t.piante}</p>
                  </div>
                </div>
              )}

              {!isOpen && (
                <p className="text-[10px] mt-3 opacity-40 serif italic">tocca per illustrazione e passi →</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="card mt-8" style={{ background: "var(--c-olive)", color: "var(--c-cream)", borderColor: "var(--c-olive)" }}>
        <div className="flex items-start gap-3">
          <Lightbulb size={22} className="flex-shrink-0 mt-0.5"/>
          <div>
            <p className="serif font-bold text-lg">Regole d'oro dell'innesto</p>
            <ul className="text-sm space-y-1.5 mt-2 opacity-90">
              <li>• Usa sempre <b>attrezzi affilati e puliti</b> (coltello da innesto dedicato o lame sterilizzate)</li>
              <li>• Il <b>cambio verde</b> (strato sotto la corteccia) del portainnesto e della marza devono combaciare</li>
              <li>• Proteggi gli innesti dal sole diretto con rafia o mastice per 2-3 settimane</li>
              <li>• Raccogli marze in riposo vegetativo (Dicembre-Gennaio) e conservale al fresco</li>
              <li>• Innesta solo su piante sane e ben irrigate</li>
            </ul>
          </div>
        </div>
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
  "vasoOk": true o false (se è adatta alla coltivazione in vaso),
  "resaKg": numero (kg prodotti per pianta in una stagione, STIMA CONSERVATIVA per un orto domestico amatoriale - non per azienda agricola professionale; es. pomodoro ~2.5kg, zucchina ~5kg, olivo adulto ~15kg, melo ~30kg; 0 per ornamentali o piante non edibili),
  "prezzoKg": numero (prezzo medio di mercato al dettaglio in Italia €/kg nel 2025; 0 per ornamentali),
  "giorniMaturazione": numero intero (giorni dalla semina/trapianto alla prima raccolta per orto annuale; 0 per ornamentali e frutteto pluriennale),
  "concimi": [array di 2-4 oggetti {"nome": "nome del concime naturale", "quando": "periodo es. 'al trapianto' o 'ogni 15 gg in fioritura'", "come": "istruzione pratica es. 'una manciata nella buca'"}]
}

Importante: i mesi devono essere numerati 1-12 (gennaio=1). Per le ornamentali resaKg/prezzoKg/giorniMaturazione devono essere 0. Per i concimi privilegia biologici/naturali: compost, letame maturo, macerati di ortica/consolida, cenere di legna, sovescio. Usa la tua conoscenza delle piante per il clima mediterraneo italiano.`;

    try {
      const res = await fetch(CLAUDE_API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, maxTokens: 1000 }),
      });

      if (!res.ok) {
        // leggo il messaggio vero di Anthropic
        let dettaglio = `Server ha risposto ${res.status}`;
        try {
          const errBody = await res.json();
          if (errBody.error?.message) dettaglio += ` — ${errBody.error.message}`;
          else if (errBody.error?.type) dettaglio += ` — ${errBody.error.type}`;
        } catch (e) { /* ignora */ }
        throw new Error(dettaglio);
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
        resaKg: typeof parsed.resaKg === "number" && parsed.resaKg > 0 ? parsed.resaKg : 0,
        prezzoKg: typeof parsed.prezzoKg === "number" && parsed.prezzoKg > 0 ? parsed.prezzoKg : 0,
        giorniMaturazione: typeof parsed.giorniMaturazione === "number" && parsed.giorniMaturazione > 0 ? Math.round(parsed.giorniMaturazione) : 0,
        concimi: Array.isArray(parsed.concimi)
          ? parsed.concimi.filter(c => c && typeof c === "object" && c.nome).map(c => ({
              nome: String(c.nome).slice(0, 80),
              quando: String(c.quando || "").slice(0, 120),
              come: String(c.come || "").slice(0, 200),
            })).slice(0, 6)
          : [],
      };

      setForm(safe);
    } catch (err) {
      console.error("Errore ricerca:", err);
      setSearchError(
        `Ricerca automatica non disponibile${err.message ? `: ${err.message}` : ""}. Controlla i campi qui sotto e modifica quello che serve.`
      );
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
        resaKg: 0,
        prezzoKg: 0,
        giorniMaturazione: 0,
        concimi: [],
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
            <div className="flex flex-col sm:flex-row gap-2 mt-1">
              <input type="text" value={nome}
                onChange={(e) => setNome(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !searching && (e.preventDefault(), cercaInfo())}
                placeholder="Es: Lavanda, Geranio, Pisello odoroso..."
                className="flex-1 px-3 py-2 rounded-lg" style={{ border: "1.5px solid var(--c-border)", background: "white" }}/>
              <button type="button" onClick={cercaInfo} disabled={!nome.trim() || searching} className="btn-primary justify-center">
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

            {/* Campi economici: solo se non ornamentale */}
            {form.categoria !== "ornamentale" && (
              <div className="card p-3" style={{ background: "var(--c-cream)" }}>
                <p className="text-[10px] uppercase tracking-wider opacity-60 font-bold mb-2">Resa e valore (facoltativo)</p>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-[11px] opacity-70">Resa kg/pianta</span>
                    <input type="number" step="0.1" min="0"
                      value={form.resaKg || ""}
                      onChange={(e) => set("resaKg", parseFloat(e.target.value) || 0)}
                      placeholder="Es: 4"
                      className="w-full mt-0.5 px-2 py-1.5 rounded text-sm"
                      style={{ border: "1.5px solid var(--c-border)", background: "white" }}/>
                  </label>
                  <label className="block">
                    <span className="text-[11px] opacity-70">Prezzo €/kg</span>
                    <input type="number" step="0.1" min="0"
                      value={form.prezzoKg || ""}
                      onChange={(e) => set("prezzoKg", parseFloat(e.target.value) || 0)}
                      placeholder="Es: 2.50"
                      className="w-full mt-0.5 px-2 py-1.5 rounded text-sm"
                      style={{ border: "1.5px solid var(--c-border)", background: "white" }}/>
                  </label>
                </div>
                <p className="text-[10px] italic opacity-60 mt-2">
                  Serve a calcolare il valore stimato del raccolto nella home. Lascia 0 se la pianta non è edibile.
                </p>
              </div>
            )}

            {/* Giorni di maturazione: solo per orto annuale */}
            {form.categoria === "orto" && (
              <div className="card p-3" style={{ background: "var(--c-cream)" }}>
                <p className="text-[10px] uppercase tracking-wider opacity-60 font-bold mb-2">Tempo alla raccolta</p>
                <label className="block">
                  <span className="text-[11px] opacity-70">Giorni dalla semina/trapianto alla prima raccolta</span>
                  <input type="number" step="1" min="0" max="365"
                    value={form.giorniMaturazione || ""}
                    onChange={(e) => set("giorniMaturazione", parseInt(e.target.value) || 0)}
                    placeholder="Es: 80"
                    className="w-full mt-0.5 px-2 py-1.5 rounded text-sm"
                    style={{ border: "1.5px solid var(--c-border)", background: "white" }}/>
                </label>
                <p className="text-[10px] italic opacity-60 mt-2">
                  L'app userà questo dato per segnalarti la raccolta solo dopo il tempo di maturazione dalla data di piantagione.
                </p>
              </div>
            )}

            {/* Editor concimi */}
            <div className="card p-3" style={{ background: "var(--c-cream)" }}>
              <p className="text-[10px] uppercase tracking-wider opacity-60 font-bold mb-2">Concimi naturali (facoltativo)</p>
              {(!form.concimi || form.concimi.length === 0) && (
                <p className="text-xs italic opacity-60 mb-2">Nessun concime. Aggiungine uno se vuoi suggerimenti specifici nella scheda pianta.</p>
              )}
              {form.concimi && form.concimi.map((c, i) => (
                <div key={i} className="card p-2 mb-2" style={{ background: "white" }}>
                  <div className="flex items-start gap-2 mb-1">
                    <input type="text" value={c.nome || ""}
                      onChange={(e) => {
                        const newConcimi = [...form.concimi];
                        newConcimi[i] = { ...c, nome: e.target.value };
                        set("concimi", newConcimi);
                      }}
                      placeholder="Nome concime"
                      className="flex-1 px-2 py-1 rounded text-xs font-semibold"
                      style={{ border: "1.5px solid var(--c-border)", background: "var(--c-bg)" }}/>
                    <button type="button" onClick={() => {
                      const newConcimi = form.concimi.filter((_, j) => j !== i);
                      set("concimi", newConcimi);
                    }}
                      className="opacity-50 hover:opacity-100" style={{ background: "transparent", border: "none", cursor: "pointer" }}>
                      <Trash2 size={14}/>
                    </button>
                  </div>
                  <input type="text" value={c.quando || ""}
                    onChange={(e) => {
                      const newConcimi = [...form.concimi];
                      newConcimi[i] = { ...c, quando: e.target.value };
                      set("concimi", newConcimi);
                    }}
                    placeholder="Quando (es. al trapianto)"
                    className="w-full px-2 py-1 mb-1 rounded text-xs"
                    style={{ border: "1.5px solid var(--c-border)", background: "var(--c-bg)" }}/>
                  <input type="text" value={c.come || ""}
                    onChange={(e) => {
                      const newConcimi = [...form.concimi];
                      newConcimi[i] = { ...c, come: e.target.value };
                      set("concimi", newConcimi);
                    }}
                    placeholder="Come (es. una manciata nella buca)"
                    className="w-full px-2 py-1 rounded text-xs"
                    style={{ border: "1.5px solid var(--c-border)", background: "var(--c-bg)" }}/>
                </div>
              ))}
              {(!form.concimi || form.concimi.length < 6) && (
                <button type="button"
                  onClick={() => set("concimi", [...(form.concimi || []), { nome: "", quando: "", come: "" }])}
                  className="btn-ghost text-xs w-full justify-center">
                  <Plus size={12}/> Aggiungi concime
                </button>
              )}
            </div>
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
function AgendaView({ userPlants, fullCatalog, appezzamenti, dayTasksDone, onToggleDayTask }) {
  const [weekOffset, setWeekOffset] = useState(0); // 0 = questa settimana
  const [showPast, setShowPast] = useState(false); // mostra giorni passati?

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
            id: dayTaskKey(d, "semina", plant.id),
            plantId: plant.id,
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
            id: dayTaskKey(d, "trapianto", plant.id),
            plantId: plant.id,
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

        // RACCOLTA: sabato mattina (idx 5) se il mese corrisponde e NON è ornamentale e se la pianta è matura
        if (giornoIdx === 5 && raccolta.includes(mese) && plant.categoria !== "ornamentale" && isReadyForHarvest(plant, up)) {
          tasks.push({
            id: dayTaskKey(d, "raccolta", plant.id),
            plantId: plant.id,
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

        // IRRIGAZIONE: ogni N giorni del mese, allineato al calendario
        const fabbisogno = plant.acqua;
        const mesiIrrigare = fabbisogno === "alta" ? [4,5,6,7,8,9,10]
          : fabbisogno === "media" ? [4,5,6,7,8,9]
          : [6,7,8];
        if (mesiIrrigare.includes(mese)) {
          const ir = calcolaIrrigazione(plant, appezz?.tipo, mese);
          // stessa logica del calendario: giorni del mese in cui irrigare
          const seed = plant.id.charCodeAt(0) % ir.giorni;
          const dayOfMonth = d.getDate();
          // vero solo se questo giorno del mese è un giorno di irrigazione
          if (((dayOfMonth - 1 - seed) % ir.giorni) === 0 && (dayOfMonth - 1 - seed) >= 0) {
            tasks.push({
              id: dayTaskKey(d, "irrigazione", plant.id),
              plantId: plant.id,
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
              id: dayTaskKey(d, "potatura", plant.id),
              plantId: plant.id,
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
      g.piante.push({
        id: t.id,
        plantId: t.plantId,
        nome: t.titolo.replace(/^(Irriga|Semina|Trapianto|Raccolta|Potatura) /, ""),
        emoji: t.plantEmoji,
      });
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
        {(() => {
          // conta giorni passati (escluso oggi) nella settimana
          const giorniPassati = giorniSett.filter(d => d < oggi).length;
          const giorniMostrati = showPast ? giorniSett : giorniSett.filter(d => d >= oggi);
          return (
            <>
              {/* Se ci sono giorni passati nascosti, mostra un link per rivelarli */}
              {!showPast && giorniPassati > 0 && weekOffset >= 0 && (
                <button onClick={() => setShowPast(true)}
                  className="w-full card text-center py-3 opacity-60 hover:opacity-100 transition"
                  style={{ cursor: "pointer", borderStyle: "dashed", background: "transparent" }}>
                  <p className="text-xs serif italic">
                    ↑ Mostra {giorniPassati} {giorniPassati === 1 ? "giorno passato" : "giorni passati"}
                  </p>
                </button>
              )}
              {showPast && weekOffset >= 0 && (
                <button onClick={() => setShowPast(false)}
                  className="w-full text-center py-1 text-xs opacity-50 hover:opacity-100 serif italic transition"
                  style={{ cursor: "pointer", background: "transparent", border: "none" }}>
                  ↓ Nascondi giorni passati
                </button>
              )}

              {giorniMostrati.map((d) => {
                const idx = giorniSett.findIndex(g => g.getTime() === d.getTime());
                const tasks = tasksPerGiorno[idx] || [];
                const isOggi = d.getTime() === oggi.getTime();
                const raggruppati = raggruppaPerOra(tasks);
                const isPast = d < oggi;

                return (
                  <div key={idx} className="card" style={{
                    opacity: isPast ? 0.55 : 1,
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
                  {raggruppati.map((g, i) => {
                    const labelAzione = g.type === "irrigazione" ? "Irriga" :
                      g.type === "semina" ? "Semina" :
                      g.type === "trapianto" ? "Trapianta" :
                      g.type === "raccolta" ? "Raccogli" :
                      g.type === "potatura" ? "Pota" : g.type;
                    return (
                      <div key={i} className="p-2 rounded-lg" style={{ background: "var(--c-bg)" }}>
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center flex-shrink-0" style={{ minWidth: "52px" }}>
                            <span className="font-mono font-bold text-sm" style={{ color: g.color }}>{g.ora}</span>
                            <span className="text-xl mt-0.5">{g.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: g.color }}>
                              {labelAzione}
                            </p>
                            <div className="space-y-1">
                              {g.piante.map((p) => {
                                const fatto = !!dayTasksDone[p.id];
                                return (
                                  <button key={p.id}
                                    onClick={() => isOggi && onToggleDayTask && onToggleDayTask(p.id)}
                                    disabled={!isOggi}
                                    className="w-full flex items-center gap-2 text-left transition"
                                    style={{
                                      background: "transparent",
                                      border: "none",
                                      padding: "4px 0",
                                      cursor: isOggi ? "pointer" : "default",
                                      opacity: fatto ? 0.55 : 1,
                                    }}>
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                                      style={{
                                        background: fatto ? "var(--c-olive)" : "transparent",
                                        border: `2px solid ${fatto ? "var(--c-olive)" : (isOggi ? "var(--c-olive-dark)" : "var(--c-border)")}`,
                                      }}>
                                      {fatto && <CheckCircle2 size={11} style={{ color: "var(--c-cream)" }}/>}
                                    </span>
                                    <span className="text-sm" style={{ textDecoration: fatto ? "line-through" : "none" }}>
                                      {p.emoji} {p.nome.toLowerCase()}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                            {g.appezzamenti.size > 0 && (
                              <p className="text-[10px] opacity-60 mt-1.5">📍 {Array.from(g.appezzamenti).join(", ")}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
            </>
          );
        })()}
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
function SettingsModal({ onClose, onExport, onImport, onReset, stats, notifSettings, notifPermission, onNotifChange }) {
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

        {/* PROMEMORIA / NOTIFICHE */}
        <div className="card mb-4 p-4" style={{ background: "var(--c-cream)" }}>
          <div className="flex items-start gap-3">
            <Bell size={20} style={{ color: "var(--c-olive-dark)" }} className="flex-shrink-0 mt-1"/>
            <div className="flex-1">
              <h4 className="serif font-bold text-base">Promemoria giornaliero</h4>
              <p className="text-xs opacity-70 mt-1 mb-3">
                Ricevi una notifica ogni mattina con tutto quello che c'è da fare nell'orto oggi: irrigazioni, raccolte, semine.
              </p>

              {notifPermission === "denied" && (
                <div className="p-2.5 rounded-lg mb-3" style={{ background: "#ffe0e0", border: "1.5px solid #c83737" }}>
                  <p className="text-[11px] leading-relaxed" style={{ color: "#c83737" }}>
                    <b>⚠️ Notifiche bloccate.</b> Le hai rifiutate in passato. Per attivarle vai nelle impostazioni del browser → Notifiche → consenti per questo sito, poi torna qui.
                  </p>
                </div>
              )}

              {notifPermission === "unsupported" && (
                <div className="p-2.5 rounded-lg mb-3" style={{ background: "#fff3cd", border: "1.5px solid #d4a73b" }}>
                  <p className="text-[11px] leading-relaxed">
                    <b>Il tuo browser non supporta le notifiche.</b> Prova con Chrome o installa l'app sulla Home.
                  </p>
                </div>
              )}

              <label className="flex items-center gap-3 cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={notifSettings.enabled}
                  onChange={(e) => onNotifChange({ ...notifSettings, enabled: e.target.checked })}
                  disabled={notifPermission === "denied" || notifPermission === "unsupported"}
                  className="w-5 h-5"
                />
                <span className="text-sm font-semibold">
                  {notifSettings.enabled ? "Promemoria attivi" : "Attiva promemoria"}
                </span>
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider opacity-70">A che ora?</span>
                <input
                  type="time"
                  value={notifSettings.time}
                  onChange={(e) => onNotifChange({ ...notifSettings, time: e.target.value })}
                  disabled={!notifSettings.enabled}
                  className="mt-1 px-3 py-2 rounded-lg"
                  style={{
                    border: "1.5px solid var(--c-border)",
                    background: notifSettings.enabled ? "white" : "transparent",
                    opacity: notifSettings.enabled ? 1 : 0.5,
                    fontSize: "16px",
                  }}
                />
              </label>

              {notifSettings.enabled && notifPermission === "granted" && (
                <p className="text-[11px] italic mt-2" style={{ color: "var(--c-olive-dark)" }}>
                  ✓ Ti arriverà una notifica ogni mattina alle {notifSettings.time}. Funziona quando il telefono è acceso e l'app è stata aperta almeno una volta nelle ultime ore.
                </p>
              )}

              <p className="text-[10px] opacity-60 mt-2 leading-relaxed">
                <b>Nota:</b> le notifiche sono locali. Funzionano bene su Android quando l'app è installata sulla home. Per garantire che arrivino, tieni l'app aperta occasionalmente.
              </p>
            </div>
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

// ============================================================
// COMPONENTE: OGGI — mostra i task del giorno in modo visibile
// ============================================================
function TodaySection({ todayTasks, onOpenSettings, notifEnabled, dayTasksDone, onToggleDayTask }) {
  const OGGI_COLORS = {
    semina: { label: "Semina", icon: "🌱", color: "var(--c-olive)" },
    trapianto: { label: "Trapianta", icon: "🪴", color: "var(--c-olive-dark)" },
    raccolta: { label: "Raccogli", icon: "🧺", color: "var(--c-ochre)" },
    irrigazione: { label: "Irriga", icon: "💧", color: "#4a6fa5" },
    potatura: { label: "Pota", icon: "✂️", color: "var(--c-terra)" },
  };

  const oggi = new Date();
  const opzioniData = { weekday: "long", day: "numeric", month: "long" };
  const dataFormat = oggi.toLocaleDateString("it-IT", opzioniData);

  const tasksFatti = todayTasks.filter(t => dayTasksDone[t.id]).length;
  const tasksTot = todayTasks.length;

  if (todayTasks.length === 0) {
    return (
      <div className="card" style={{ background: "var(--c-cream)" }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="serif italic text-xs opacity-70">— oggi, {dataFormat} —</p>
            <h3 className="serif font-bold text-xl mt-1">🌤️ Giornata tranquilla</h3>
            <p className="text-sm opacity-80 mt-1">Nessun intervento programmato. Approfittane per osservare le piante e pianificare.</p>
          </div>
          <button onClick={onOpenSettings} className="flex-shrink-0 opacity-60 hover:opacity-100" title="Promemoria">
            <Bell size={18} style={{ color: notifEnabled ? "var(--c-terra)" : "var(--c-ink)" }}/>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ background: "var(--c-terra)", color: "var(--c-cream)", borderColor: "var(--c-terra)" }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="serif italic text-xs opacity-80">— oggi, {dataFormat} —</p>
          <h3 className="serif font-bold text-2xl mt-1">Da fare nell'orto</h3>
          {tasksFatti > 0 && (
            <p className="text-xs opacity-80 mt-1">✓ {tasksFatti} di {tasksTot} completati</p>
          )}
        </div>
        <button onClick={onOpenSettings}
          className="flex-shrink-0 rounded-full px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold transition"
          style={{
            background: notifEnabled ? "var(--c-cream)" : "transparent",
            color: notifEnabled ? "var(--c-terra)" : "var(--c-cream)",
            border: `1.5px solid var(--c-cream)`,
            cursor: "pointer",
          }}
          title="Imposta promemoria">
          <Bell size={12}/>
          {notifEnabled ? "Attivi" : "Promemoria"}
        </button>
      </div>

      {/* Messaggio celebrativo: tutti i task completati */}
      {tasksTot > 0 && tasksFatti === tasksTot && (
        <div className="p-4 rounded-lg mb-3 fade-up text-center"
          style={{ background: "var(--c-cream)", color: "var(--c-ink)" }}>
          <div className="text-4xl mb-1">🎉</div>
          <p className="serif font-bold text-lg" style={{ color: "var(--c-olive-dark)" }}>Ben fatto! Hai finito tutto.</p>
          <p className="text-xs serif italic opacity-70 mt-1">
            Tutti i lavori di oggi sono completati. Il tuo orto ti ringrazia.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {todayTasks.map((t) => {
          const meta = OGGI_COLORS[t.tipo];
          if (!meta) return null;
          const fatto = !!dayTasksDone[t.id];
          return (
            <button key={t.id}
              onClick={() => onToggleDayTask(t.id)}
              className="w-full flex items-start gap-3 p-3 rounded-lg text-left transition"
              style={{
                background: fatto ? "rgba(255,255,255,0.5)" : "var(--c-cream)",
                color: "var(--c-ink)",
                border: "none",
                cursor: "pointer",
                opacity: fatto ? 0.7 : 1,
              }}>
              {/* checkbox/spunta */}
              <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
                style={{
                  background: fatto ? "var(--c-olive)" : "transparent",
                  border: `2px solid ${fatto ? "var(--c-olive)" : "var(--c-olive-dark)"}`,
                }}>
                {fatto && <CheckCircle2 size={14} style={{ color: "var(--c-cream)" }}/>}
              </span>

              <span className="text-2xl flex-shrink-0">{meta.icon}</span>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm" style={{ textDecoration: fatto ? "line-through" : "none" }}>
                  <span style={{ color: meta.color }}>{meta.label}</span>
                  {" "}
                  <span className="font-normal">{t.plant.emoji} {t.plant.nome.toLowerCase()}</span>
                </p>
                {t.extra && <p className="text-[11px] opacity-70 mt-0.5">{t.extra}</p>}
                {t.appezzamenti.length > 0 && (
                  <p className="text-[10px] opacity-60 mt-0.5">📍 {t.appezzamenti.join(", ")}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {!notifEnabled && (
        <p className="text-[11px] serif italic opacity-80 mt-3">
          💡 Attiva i promemoria per ricevere una notifica ogni mattina con quello che c'è da fare.
        </p>
      )}
    </div>
  );
}

// ============================================================
// HOOK SWIPE — rileva swipe orizzontale per cambiare tab
// ============================================================
function useSwipe(onSwipeLeft, onSwipeRight, minDistance = 60) {
  const touchStart = useRef(null);
  const touchEnd = useRef(null);

  const onTouchStart = (e) => {
    // se il target è dentro un elemento scrollabile orizzontalmente, ignora
    let el = e.target;
    while (el && el !== e.currentTarget) {
      const style = window.getComputedStyle(el);
      if (
        (style.overflowX === "auto" || style.overflowX === "scroll") &&
        el.scrollWidth > el.clientWidth
      ) return;
      el = el.parentElement;
    }
    touchEnd.current = null;
    touchStart.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };
  };

  const onTouchMove = (e) => {
    touchEnd.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };
  };

  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    const dx = touchStart.current.x - touchEnd.current.x;
    const dy = touchStart.current.y - touchEnd.current.y;
    // solo se il movimento è sostanzialmente orizzontale
    if (Math.abs(dx) > Math.abs(dy) * 1.5 && Math.abs(dx) > minDistance) {
      if (dx > 0) onSwipeLeft && onSwipeLeft();
      else onSwipeRight && onSwipeRight();
    }
    touchStart.current = null;
    touchEnd.current = null;
  };

  return { onTouchStart, onTouchMove, onTouchEnd };
}

// ============================================================
// COMPONENTE: BOTTOM NAV mobile — tab fisse in basso
// ============================================================
function BottomNav({ view, setView }) {
  // Mostro max 5 tab nella bottom nav, le altre in un menu "Altro"
  const primary = VIEWS.slice(0, 4);
  const secondary = VIEWS.slice(4);
  const [showMore, setShowMore] = useState(false);
  const secondaryActive = secondary.some(v => v.id === view);

  return (
    <>
      {/* Menu "Altro" che appare sopra la bottom nav */}
      {showMore && (
        <div style={{ position: "fixed", inset: 0, zIndex: 90 }}
          onClick={() => setShowMore(false)}
          className="md:hidden">
          <div className="absolute bottom-16 left-2 right-2 card p-2 shadow-lg"
            style={{ background: "var(--c-bg)", border: "1.5px solid var(--c-border)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="grid grid-cols-2 gap-1">
              {secondary.map(n => {
                const active = view === n.id;
                const Icon = n.icon;
                return (
                  <button key={n.id}
                    onClick={() => { setView(n.id); setShowMore(false); }}
                    className="flex items-center gap-2 p-3 rounded-lg text-left transition"
                    style={{
                      background: active ? "var(--c-terra)" : "var(--c-cream)",
                      color: active ? "var(--c-cream)" : "var(--c-ink)",
                      cursor: "pointer",
                      border: "none",
                    }}>
                    <Icon size={16}/>
                    <span className="text-sm font-semibold">{n.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: "var(--c-bg)",
          borderTop: "1.5px solid var(--c-border)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}>
        <div className="flex items-stretch justify-around">
          {primary.map(n => {
            const active = view === n.id;
            const Icon = n.icon;
            return (
              <button key={n.id} onClick={() => { setView(n.id); setShowMore(false); }}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: active ? "var(--c-terra)" : "var(--c-ink)",
                  opacity: active ? 1 : 0.6,
                }}>
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8}/>
                <span className="text-[10px] font-semibold tracking-tight">{n.shortLabel}</span>
                {active && <span className="absolute bottom-0 h-0.5 w-8 rounded-t-full" style={{ background: "var(--c-terra)" }}/>}
              </button>
            );
          })}
          {/* bottone "Altro" */}
          <button onClick={() => setShowMore(s => !s)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition relative"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: (showMore || secondaryActive) ? "var(--c-terra)" : "var(--c-ink)",
              opacity: (showMore || secondaryActive) ? 1 : 0.6,
            }}>
            <MoreHorizontal size={20} strokeWidth={(showMore || secondaryActive) ? 2.5 : 1.8}/>
            <span className="text-[10px] font-semibold tracking-tight">Altro</span>
            {secondaryActive && !showMore && <span className="absolute top-1 right-5 w-1.5 h-1.5 rounded-full" style={{ background: "var(--c-terra)" }}/>}
          </button>
        </div>
      </nav>
    </>
  );
}

// ============================================================
// COMPONENTE: FAB (Floating Action Button) — Aggiungi rapido
// ============================================================
function FAB({ onAddPlant, onAddAppezzamento, hasAppezzamenti }) {
  const [open, setOpen] = useState(false);

  const handleAddPlant = () => {
    setOpen(false);
    if (hasAppezzamenti) onAddPlant();
    else onAddAppezzamento(); // se non ha appezzamenti, forza prima quello
  };

  const handleAddApp = () => {
    setOpen(false);
    onAddAppezzamento();
  };

  return (
    <>
      {/* Backdrop quando aperto */}
      {open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(42,36,24,0.3)" }}
          onClick={() => setOpen(false)}
          className="md:hidden"/>
      )}

      {/* Menu azioni */}
      <div className="md:hidden fixed right-4 z-[85] flex flex-col items-end gap-2"
        style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))" }}>
        {open && (
          <div className="flex flex-col items-end gap-2 fade-up">
            <button onClick={handleAddApp}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg"
              style={{
                background: "var(--c-cream)",
                color: "var(--c-ink)",
                border: "1.5px solid var(--c-border)",
                cursor: "pointer",
              }}>
              <MapPin size={16}/>
              <span className="text-sm font-semibold">Nuovo appezzamento</span>
            </button>
            <button onClick={handleAddPlant}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg"
              style={{
                background: "var(--c-cream)",
                color: "var(--c-ink)",
                border: "1.5px solid var(--c-border)",
                cursor: "pointer",
              }}>
              <Sprout size={16}/>
              <span className="text-sm font-semibold">Aggiungi pianta</span>
            </button>
          </div>
        )}

        {/* Pulsante principale */}
        <button onClick={() => setOpen(s => !s)}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition"
          style={{
            background: "var(--c-terra)",
            color: "var(--c-cream)",
            border: "none",
            cursor: "pointer",
            transform: open ? "rotate(45deg)" : "rotate(0)",
          }}
          title="Aggiungi">
          <Plus size={26} strokeWidth={2.5}/>
        </button>
      </div>
    </>
  );
}

// ============================================================
// COMPONENTE: TOUR MODAL — "Come funziona" guida dell'app
// ============================================================
function TourModal({ onClose }) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      emoji: "🌱",
      title: "Benvenuto in VerdeGuida",
      body: "Il tuo quaderno di campagna digitale. Gestisci piante, tempi di semina, raccolte e irrigazioni in un unico posto, con consigli su misura per il clima della tua zona.",
    },
    {
      emoji: "🗺️",
      title: "Inizia dagli appezzamenti",
      body: "Un appezzamento è un luogo dove coltivi: il terreno, il giardino, un balcone, la serra. Creandolo ti viene chiesta la località: serve a calcolare il microclima (latitudine e altitudine) e adattare i consigli al tuo clima specifico.",
      tip: "Puoi segnalare se hai una serra, se fai idroponica o se hai bancali rialzati: i consigli si adatteranno.",
    },
    {
      emoji: "🍅",
      title: "Aggiungi le tue piante",
      body: "Dal Catalogo scegli le piante che hai o vuoi coltivare. 18 già pronte (pomodoro, olivo, ciliegio…) più la possibilità di aggiungerne di nuove: scrivi il nome e l'AI pre-compila tutto (descrizione, calendario, acqua, sole).",
      tip: "Per gli ortaggi ti chiediamo la data di semina/trapianto. Per frutteti (olivo, vite…) l'anno di impianto: un albero giovane produce meno.",
    },
    {
      emoji: "⏱️",
      title: "Tempi di maturazione",
      body: "Ogni pianta ha il suo ciclo. Un pomodoro impiega ~80 giorni, una zucchina ~55, una carota ~100. La raccolta ti viene suggerita solo quando la pianta è realmente matura — niente 'raccogli pomodoro' il giorno dopo averlo messo.",
      tip: "Nella scheda di ogni pianta vedi 'Piantata il X · Matura il Y'. Se hai messo 2 pomodori oggi e uno tra un mese, le date saranno diverse.",
    },
    {
      emoji: "🌿",
      title: "Concimi naturali",
      body: "Per ogni pianta puoi vedere i concimi biologici consigliati: quando darli e come dosarli. Compost, letame maturo, macerato di ortica, cenere — tutto quello che serve per un orto sano senza chimica.",
      tip: "Apri una pianta e clicca la tab 'Concimi'. Per le piante custom puoi aggiungere i tuoi consigli.",
    },
    {
      emoji: "📅",
      title: "Calendario e Agenda",
      body: "Il Calendario mostra tutti gli interventi del mese: semina, trapianto, raccolta, irrigazione, potatura. L'Agenda settimanale (Oggi) organizza tutto giorno per giorno, con orari consigliati (es. 18:00 d'estate per l'irrigazione).",
      tip: "Puoi spuntare i task completati: restano visibili con il segno ✓ verde. Solo i task di oggi sono cliccabili.",
    },
    {
      emoji: "✂️",
      title: "Tecniche e innesti",
      body: "Due sezioni dedicate: 'Tecniche & hack' raccoglie metodi alternativi (no-dig, orto sinergico, Hügelkultur...). La tab 'Innesti' descrive le 6 tecniche principali per i frutteti, con passaggi dettagliati e periodo giusto.",
    },
    {
      emoji: "🔔",
      title: "Promemoria giornaliero",
      body: "Dal menu Impostazioni ⚙ attivi una notifica giornaliera a un'ora a tua scelta, con il riepilogo di cosa c'è da fare oggi nell'orto.",
      tip: "Funziona su Android (se l'app è installata sulla home). Ogni tanto apri l'app per tenerla attiva.",
    },
    {
      emoji: "🔬",
      title: "Problemi e rimedi",
      body: "Se una pianta si ammala, aprila e vai nella scheda Problemi. Registra il sintomo, e con un tap chiedi rimedi biologici all'AI.",
      tip: "Le ricerche AI usano Groq, gratis fino a 14.400/giorno — più che sufficienti.",
    },
    {
      emoji: "💰",
      title: "La rendita del tuo orto",
      body: "In cima alla home, la sezione collassabile ti mostra una stima economica del tuo orto: quanto vale il raccolto potenziale, basato sulla resa media e sui prezzi di mercato italiani.",
      tip: "Puoi chiuderla col simbolo › quando non ti interessa, o aprirla per curiosare. Tocca il ? per capire come viene calcolata.",
    },
    {
      emoji: "💾",
      title: "Backup dei dati",
      body: "I dati sono salvati sul tuo dispositivo. Dalle Impostazioni ⚙ puoi esportare un backup JSON con tutto il tuo orto: appezzamenti, piante, interventi, problemi. Utile per trasferire su un altro telefono o per sicurezza.",
    },
    {
      emoji: "✨",
      title: "Tutto chiaro?",
      body: "Naviga con le tab in basso (o scorri orizzontalmente per passare da una all'altra). Il + rosso in basso a destra ti apre le scorciatoie rapide.",
      tip: "Buon orto!",
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const isFirst = step === 0;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(42,36,24,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "12px" }} className="modal-overlay" onClick={onClose}>
      <div className="card" style={{ maxWidth: "540px", width: "100%", background: "var(--c-bg)", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <p className="serif italic text-xs" style={{ color: "var(--c-olive-dark)" }}>— guida — passo {step + 1} di {steps.length}</p>
          <button onClick={onClose} className="opacity-60 hover:opacity-100"><X size={20}/></button>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1 mb-5">
          {steps.map((_, i) => (
            <div key={i} className="flex-1 rounded-full transition"
              style={{
                height: "3px",
                background: i <= step ? "var(--c-terra)" : "var(--c-border)",
              }}/>
          ))}
        </div>

        <div className="text-center py-4">
          <div className="text-6xl mb-4">{current.emoji}</div>
          <h3 className="display text-3xl mb-3">{current.title}</h3>
          <p className="text-sm leading-relaxed opacity-85 max-w-md mx-auto">{current.body}</p>
          {current.tip && (
            <div className="card p-3 mt-4 max-w-md mx-auto" style={{ background: "var(--c-cream)" }}>
              <p className="text-xs serif italic" style={{ color: "var(--c-olive-dark)" }}>
                💡 {current.tip}
              </p>
            </div>
          )}
        </div>

        <div className="hairline my-5"></div>

        <div className="flex items-center gap-2">
          <button className="btn-ghost"
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={isFirst}
            style={{ opacity: isFirst ? 0.3 : 1, cursor: isFirst ? "default" : "pointer" }}>
            ← Indietro
          </button>
          <div className="flex-1 text-center text-xs opacity-50 serif italic">
            {step + 1} / {steps.length}
          </div>
          {!isLast ? (
            <button className="btn-primary" onClick={() => setStep(s => s + 1)}>
              Avanti <ChevronRight size={14}/>
            </button>
          ) : (
            <button className="btn-primary" onClick={onClose}>
              Inizia! <Sprout size={14}/>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE: RENDITA DEL TUO ORTO — collassabile, con info popup
// ============================================================
function RenditaSection({ riepilogo, userPlantsCount }) {
  // Stato espanso salvato in localStorage per persistenza
  const [expanded, setExpanded] = useState(() => {
    try {
      const v = localStorage.getItem("rendita_expanded");
      return v === null ? true : v === "true"; // default aperto al primo giro
    } catch { return true; }
  });
  const [showInfo, setShowInfo] = useState(false);

  const toggleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    try { localStorage.setItem("rendita_expanded", next ? "true" : "false"); } catch {}
  };

  return (
    <section className="fade-up">
      <div className="card" style={{ background: "var(--c-ink)", color: "var(--c-cream)", borderColor: "var(--c-ink)" }}>
        {/* Header sempre visibile */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button onClick={toggleExpand}
            className="flex items-center gap-2 text-left"
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "inherit", flex: 1, minWidth: 0 }}>
            <ChevronRight size={18}
              style={{
                transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform 200ms",
                color: "var(--c-ochre)",
              }}/>
            <div>
              <p className="serif italic text-[10px] opacity-60 uppercase tracking-wider">La rendita del tuo orto</p>
              {!expanded ? (
                <p className="serif font-bold text-base mt-0.5">
                  🌱 {userPlantsCount} {userPlantsCount === 1 ? "pianta" : "piante"}
                  {riepilogo.valoreTot > 0 && <> · <span style={{ color: "var(--c-ochre)" }}>~€{riepilogo.valoreTot.toFixed(0)} stimati</span></>}
                </p>
              ) : (
                <h3 className="serif font-bold text-2xl mt-0.5">La rendita del tuo orto</h3>
              )}
            </div>
          </button>
          <div className="flex items-center gap-2">
            <button onClick={(e) => { e.stopPropagation(); setShowInfo(true); }}
              className="opacity-60 hover:opacity-100 transition"
              style={{ background: "transparent", border: "none", cursor: "pointer" }}
              title="Cos'è questo?">
              <HelpCircle size={18} style={{ color: "var(--c-cream)" }}/>
            </button>
          </div>
        </div>

        {/* Corpo espanso */}
        {expanded && (
          <>
            {riepilogo.valoreTot > 0 && (
              <div className="text-right mt-3 mb-3">
                <p className="text-xs opacity-70 serif italic">Valore stimato raccolto annuo</p>
                <p className="display text-3xl" style={{ color: "var(--c-ochre)" }}>€ {riepilogo.valoreTot.toFixed(0)}</p>
                <p className="text-[10px] opacity-50">~{riepilogo.kgTot.toFixed(1)} kg · prezzi mercato medi</p>
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              {riepilogo.items.map(({ plant, quantita, valore }) => (
                <div key={plant.id} className="px-3 py-2 rounded-full flex items-center gap-2" style={{ background: "var(--c-cream)", color: "var(--c-ink)" }}>
                  <span className="text-lg">{plant.emoji}</span>
                  <span className="font-bold text-sm">{plant.nome}</span>
                  <span className="text-xs opacity-70">× {quantita}</span>
                  {valore > 0 && <span className="text-[10px] italic" style={{ color: "var(--c-olive-dark)" }}>~€{valore.toFixed(0)}</span>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal info */}
      {showInfo && (
        <ModalPortal>
        <div style={{ position: "fixed", inset: 0, background: "rgba(42,36,24,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "12px" }}
          onClick={() => setShowInfo(false)}>
          <div className="card" style={{ maxWidth: "500px", width: "100%", background: "var(--c-bg)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="serif italic text-[10px] uppercase tracking-wider opacity-60">— spiegazione —</p>
                <h3 className="serif font-bold text-2xl">La rendita del tuo orto</h3>
              </div>
              <button onClick={() => setShowInfo(false)} className="opacity-60 hover:opacity-100"><X size={18}/></button>
            </div>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>
                Questa sezione ti dà un'idea del <b>valore economico</b> potenziale delle piante che stai coltivando. È calcolato in base a:
              </p>
              <ul className="space-y-1.5 pl-4 list-disc">
                <li><b>Resa conservativa</b> per pianta in orto domestico (es. un pomodoro ~2.5 kg/stagione, valori prudenti per tenere conto di varietà, cure non perfette, parassiti)</li>
                <li><b>Prezzi medi al dettaglio</b> in Italia (2024-2025)</li>
                <li><b>Età della pianta</b> per il frutteto: un olivo di 2 anni non produce, uno di 7+ è in piena produzione</li>
              </ul>
              <div className="card p-3" style={{ background: "var(--c-cream)" }}>
                <p className="text-xs serif italic opacity-80">
                  <b>⚠️ È solo una stima.</b> La resa reale dipende da clima, varietà, cure, suolo. Le piante ornamentali non contribuiscono al valore (non si "raccolgono").
                </p>
              </div>
              <p className="text-xs opacity-70">
                💡 <b>Suggerimento:</b> usa l'icona <ChevronRight size={12} className="inline"/> in alto a sinistra per chiudere o riaprire la sezione a piacere.
              </p>
            </div>
            <button className="btn-primary w-full mt-4 justify-center" onClick={() => setShowInfo(false)}>
              Ho capito
            </button>
          </div>
        </div>
        </ModalPortal>
      )}
    </section>
  );
}
