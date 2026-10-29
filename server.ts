import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Initialisation du client Gemini API côté serveur avec le header obligatoire
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Dossier de données pour la persistance cloud
const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'financial_records.json');
const BACKUP_FILE = path.resolve(DATA_DIR, 'financial_records.backup.json');

// S'assurer que le dossier data existe
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Dossier public pour les assets PWA (manifest.json, sw.js, apple-touch-icon.png, icons)
const PUBLIC_DIR = path.resolve(__dirname, 'public');
if (fs.existsSync(PUBLIC_DIR)) {
  app.use(express.static(PUBLIC_DIR, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('sw.js')) {
        res.setHeader('Service-Worker-Allowed', '/');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      } else if (filePath.endsWith('manifest.json') || filePath.endsWith('manifest.webmanifest')) {
        res.setHeader('Content-Type', 'application/manifest+json');
      }
    }
  }));
}

// Fonction de lecture de la base JSON
function readRecords(): Record<string, any> {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('Erreur lecture records:', error);
  }
  return {};
}

// Fonction d'écriture de la base JSON avec double sauvegarde
function writeRecords(data: Record<string, any>) {
  try {
    const jsonStr = JSON.stringify(data, null, 2);
    fs.writeFileSync(DATA_FILE, jsonStr, 'utf-8');
    fs.writeFileSync(BACKUP_FILE, jsonStr, 'utf-8');
  } catch (error) {
    console.error('Erreur écriture records:', error);
  }
}

// Générateur d'une fiche vierge à zéro
function createZeroRecord(dateStr: string) {
  const defaultCompartmentDefs = [
    { id: 'ria', name: 'RIA', category: 'transfert_international' },
    { id: 'wu', name: 'Western Union', category: 'transfert_international' },
    { id: 'moneygram', name: 'MoneyGram', category: 'transfert_international' },
    { id: 'wave', name: 'Wave', category: 'mobile_money' },
    { id: 'orange_money', name: 'Orange Money', category: 'mobile_money' },
    { id: 'versement_bancaire', name: 'Versement Bancaire', category: 'banque' },
    { id: 'uv_master', name: 'UV Master', category: 'telecom_uv' },
    { id: 'seddo', name: 'Seddo', category: 'telecom_uv' },
    { id: 'liquidites', name: 'Liquidités (Caisse)', category: 'especes' },
  ];

  const now = new Date().toISOString();

  return {
    id: dateStr,
    date: dateStr,
    compartments: defaultCompartmentDefs.map(c => ({
      id: c.id,
      name: c.name,
      category: c.category,
      startOfDay: 0,
      endOfDay: 0,
      netDifference: 0,
    })),
    previousDayReliquatReported: 0,
    transfers: [],
    seddoPartners: [],
    cashBreakdown: {
      b10000: 0,
      b5000: 0,
      b2000: 0,
      b1000: 0,
      b500: 0,
      coins: 0,
    },
    operatorNotes: `Caisse réinitialisée à zéro. Nouveau départ le ${dateStr}.`,
    createdAt: now,
    updatedAt: now,
  };
}

// Initialisation et préservation des données historiques clés
function seedInitialDataIfEmpty() {
  let records = readRecords();

  if (fs.existsSync(BACKUP_FILE)) {
    try {
      const backup = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf-8'));
      records = { ...backup, ...records };
    } catch (e) {}
  }

  // S'assurer que le 27 Octobre et le 28 Octobre certifiés sont toujours préservés
  if (!records['2026-10-27'] && fs.existsSync(BACKUP_FILE)) {
    try {
      const backup = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf-8'));
      if (backup['2026-10-27']) records['2026-10-27'] = backup['2026-10-27'];
    } catch (e) {}
  }

  if (!records['2026-10-28'] && fs.existsSync(BACKUP_FILE)) {
    try {
      const backup = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf-8'));
      if (backup['2026-10-28']) records['2026-10-28'] = backup['2026-10-28'];
    } catch (e) {}
  }

  const todayStr = '2026-10-29';
  if (!records[todayStr]) {
    records[todayStr] = createZeroRecord(todayStr);
  }

  writeRecords(records);
  console.log(`[Server Storage] Données synchronisées avec succès (${Object.keys(records).length} journées disponibles).`);
}

seedInitialDataIfEmpty();

// --- ROUTES API FINANCES ---

// 1. Obtenir toutes les fiches (liste all)
app.get('/api/records', (req, res) => {
  const records = readRecords();
  const summaryList = Object.keys(records).map(dateKey => {
    const rec = records[dateKey];
    let totalStart = 0;
    let totalEnd = 0;
    rec.compartments?.forEach((c: any) => {
      totalStart += c.startOfDay || 0;
      totalEnd += c.endOfDay || 0;
    });
    return {
      date: rec.date,
      totalStart,
      totalEnd,
      netDifference: totalEnd - totalStart,
      transfersCount: rec.transfers?.length || 0,
      seddoPartnersCount: rec.seddoPartners?.length || 0,
      updatedAt: rec.updatedAt,
    };
  }).sort((a, b) => b.date.localeCompare(a.date));

  res.json({ success: true, count: summaryList.length, records: summaryList });
});

// 2. Obtenir une fiche par date YYYY-MM-DD
app.get('/api/records/:date', (req, res) => {
  const { date } = req.params;
  const records = readRecords();
  if (records[date]) {
    res.json({ success: true, record: records[date] });
  } else {
    // Si la date demandée n'existe pas, créer une fiche vierge à zéro
    const newRecord = createZeroRecord(date);
    res.json({ success: true, record: newRecord, isNew: true });
  }
});

// 3. Obtenir le solde de la veille (le jour enregistré précédant la date spécifiée)
app.get('/api/previous-record', (req, res) => {
  const targetDate = (req.query.date as string) || '';
  const records = readRecords();
  const sortedDates = Object.keys(records).sort().reverse();
  
  const priorDates = sortedDates.filter(d => d < targetDate);
  const prevDateWithBalances = priorDates.find(d => {
    const r = records[d];
    return r && r.compartments && r.compartments.some((c: any) => (c.endOfDay || 0) > 0 || (c.startOfDay || 0) > 0);
  });

  const prevDate = prevDateWithBalances || priorDates[0];

  if (prevDate && records[prevDate]) {
    res.json({ success: true, prevRecord: records[prevDate] });
  } else {
    res.json({ success: false, message: 'Aucun enregistrement antérieur' });
  }
});

// 4. Enregistrer ou mettre à jour une fiche journalière (Auto-save Cloud)
app.post('/api/records', (req, res) => {
  const record = req.body;
  if (!record || !record.date) {
    return res.status(400).json({ success: false, message: 'Date requise pour enregistrer' });
  }

  const records = readRecords();
  const now = new Date().toISOString();
  
  record.updatedAt = now;
  if (!record.createdAt) {
    record.createdAt = now;
  }

  records[record.date] = record;
  writeRecords(records);

  res.json({
    success: true,
    message: `Enregistré avec succès dans le Cloud pour le ${record.date}`,
    savedAt: now,
    record,
  });
});

// 5. Supprimer une date
app.delete('/api/records/:date', (req, res) => {
  const { date } = req.params;
  const records = readRecords();
  if (records[date]) {
    delete records[date];
    writeRecords(records);
    res.json({ success: true, message: `Date ${date} supprimée.` });
  } else {
    res.status(404).json({ success: false, message: 'Date introuvable' });
  }
});

// 6. Réinitialiser TOUTES les sommes à zéro (Repartir d'une caisse neuve)
app.post('/api/reset-all', (req, res) => {
  try {
    const todayStr = '2026-10-29';
    const cleanRecord = createZeroRecord(todayStr);
    const cleanRecords = {
      [todayStr]: cleanRecord,
    };
    writeRecords(cleanRecords);
    console.log('[Server Storage] Toutes les données ont été réinitialisées à zéro. Nouveau départ 2026-10-29.');
    res.json({ 
      success: true, 
      message: 'Toutes les sommes ont été remises à zéro avec succès.',
      record: cleanRecord 
    });
  } catch (err: any) {
    console.error('Erreur réinitialisation totale:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- ROUTES API GEMINI (ASSISTANT & RECHERCHE EN DIRECT) ---

// 7. Chatbot Assistant Financier & Contrôleur de Caisse (Gemini 3.8 Flash)
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { message, history = [], caisseContext } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message requis' });
    }

    // Construction du contexte de caisse si fourni
    let contextPrompt = '';
    if (caisseContext) {
      contextPrompt = `
=== CONTEXTE ACTUEL DE LA CAISSE (AUJOURD'HUI : ${caisseContext.date || '2026-10-29'}) ===
- Total début de journée : ${caisseContext.totalStart || 0} F CFA
- Total fin de journée : ${caisseContext.totalEnd || 0} F CFA
- Différence nette du jour : ${caisseContext.netDifference || 0} F CFA
- Report reliquat strict de la veille : ${caisseContext.previousDayReliquat || 0} F CFA
- Total général avec reliquat : ${(caisseContext.netDifference || 0) + (caisseContext.previousDayReliquat || 0)} F CFA
- Total espèces physiques comptées (billetterie) : ${caisseContext.physicalCash || 0} F CFA
- Écart d'espèces (billetterie vs compartiment liquide) : ${caisseContext.cashDiscrepancy || 0} F CFA
- Nombre de transactions de transfert international : ${caisseContext.transfersCount || 0}
- Nombre de règlements Partenaire Seddo : ${caisseContext.seddoCount || 0}
==============================================================
`;
    }

    const systemInstruction = `Tu es "FinanCaisse AI", l'assistant expert financier et contrôleur de caisse d'une agence multiservices et de transferts d'argent au Sénégal / zone UEMOA (Afrique de l'Ouest).
Tu es intégré directement dans l'application "Remix FinanCaisse Pro".
Tes compétences clés :
1. Calculs et audit de caisse en Francs CFA (XOF / F CFA) :
   - Règle stricte d'AnnoirFinance : "Dans le report automatique, c'est UNIQUEMENT et STRICTEMENT le reliquat net de la veille qui est reporté. Les soldes de fin de journée de chaque compartiment ne doivent JAMAIS être reportés directement."
   - Équilibre de caisse : Reliquat = Total Fin - Total Début.
   - Contrôle du compartiment Liquidités face au comptage physique de la billetterie (coupures 10 000, 5 000, 2 000, 1 000, 500 et pièces).
2. Opérateurs de transfert et de paiement :
   - Transferts internationaux : RIA, Western Union, MoneyGram. Distinguer le Retrait (Montant TTC M1, Montant HT M2, Taxe calculée = M1 - M2) et l'Envoi (Montant unique avec taxe).
   - Mobile Money : Wave (frais 1%), Orange Money, Free Money.
   - Télécom & UV : UV Master, Seddo (gestion des règlements partenaires libres).
   - Banque : Versements bancaires et rapprochement.
3. Rôle :
   - Ton style est professionnel, chaleureux, concis, rigoureux et encourageant.
   - Tu réponds en français clair.
   - Tu aides le caissier et le gérant à identifier les erreurs de saisie, les écarts de caisse, et à vérifier les calculs.
   - Si l'utilisateur demande comment démarrer après une remise à zéro, explique les étapes : 1) Saisir les soldes début de journée pour chaque compartiment, 2) Enregistrer les opérations de la journée, 3) Clôturer avec les soldes fin de journée et le comptage physique.`;

    // Formatage de l'historique conversationnel pour l'API Gemini
    const contents: any[] = [];
    
    // Ajouter l'historique si présent
    if (Array.isArray(history) && history.length > 0) {
      for (const item of history) {
        contents.push({
          role: item.role === 'assistant' || item.role === 'model' ? 'model' : 'user',
          parts: [{ text: item.text || item.content || '' }]
        });
      }
    }

    // Message utilisateur avec contexte de caisse
    const userPrompt = contextPrompt ? `${contextPrompt}\n\nQuestion de l'utilisateur : ${message}` : message;
    contents.push({
      role: 'user',
      parts: [{ text: userPrompt }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({
      success: true,
      text: response.text,
    });
  } catch (error: any) {
    console.error('Erreur endpoint /api/gemini/chat:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la génération de la réponse Gemini',
    });
  }
});

// 8. Recherche Google Grounding en direct pour cours des devises & tarifs opérateurs
app.post('/api/gemini/search-rates', async (req, res) => {
  try {
    const { query = "Quels sont les taux de change officiels BCEAO actuels (EUR/XOF, USD/XOF) et les frais de transfert Wave et Orange Money au Sénégal ?" } = req.body;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Tu es un analyste financier pour agences multiservices au Sénégal. Utilise les informations de recherche Google les plus récentes et fiables pour répondre à cette demande :\n${query}\n\nFournis les chiffres exacts (cours officiel fixe BCEAO 1 EUR = 655.957 XOF, cours bancaires récents pour USD et devises courantes, ainsi que les grilles tarifaires Wave 1% et Orange Money). Sois précis, synthétique et présente les résultats avec des puces claires.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const searchChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webQueries = response.candidates?.[0]?.groundingMetadata?.webSearchQueries || [];

    res.json({
      success: true,
      text: response.text,
      groundingChunks: searchChunks,
      webSearchQueries: webQueries,
    });
  } catch (error: any) {
    console.error('Erreur endpoint /api/gemini/search-rates:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la recherche grounded Gemini',
    });
  }
});

// Initialisation de Vite / Serveur Web
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Montage du middleware Vite en développement (HMR désactivé)
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false,
        ws: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Mode production
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur FinanCaisse démarré sur http://0.0.0.0:${PORT}`);
  });
}

startServer();
