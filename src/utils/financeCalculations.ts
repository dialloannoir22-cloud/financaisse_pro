import {
  DailyRecord,
  DailySummaryMetrics,
  DEFAULT_COMPARTMENTS,
  InternationalOperator,
  CompartmentEntry
} from '../types/finance';

/**
 * Formate un montant en Francs CFA / devises avec séparateurs d'espaces
 * Exemple: 1500000 -> "1 500 000 F CFA"
 */
export function formatCurrency(amount: number | undefined | null, includeSymbol = true): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return includeSymbol ? '0 F CFA' : '0';
  }
  const rounded = Math.round(amount);
  const formatted = new Intl.NumberFormat('fr-FR').format(rounded);
  return includeSymbol ? `${formatted} F CFA` : formatted;
}

/**
 * Convertit une chaîne saisie par l'utilisateur en nombre fiable
 */
export function parseNumber(value: string | number | undefined | null): number {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  // Nettoyer les espaces, espaces insécables et remplacer la virgule par un point
  const clean = String(value)
    .replace(/\s+/g, '')
    .replace(/\u00A0/g, '')
    .replace(',', '.');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formate une date YYYY-MM-DD en français convivial
 * Ex: "2026-10-25" -> "Dimanche 25 Octobre 2026"
 */
export function formatDateFr(dateStr: string, format: 'full' | 'short' | 'day-month' = 'full'): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  
  const dateObj = new Date(year, month - 1, day);
  if (isNaN(dateObj.getTime())) return dateStr;

  if (format === 'short') {
    return dateObj.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  if (format === 'day-month') {
    return dateObj.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  }

  return dateObj.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Retourne la date d'aujourd'hui au format YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Crée une fiche journalière vide initialisée avec les compartiments par défaut
 */
export function createEmptyDailyRecord(dateStr: string = getTodayDateString()): DailyRecord {
  const compartments: CompartmentEntry[] = DEFAULT_COMPARTMENTS.map(c => ({
    id: c.id,
    name: c.name,
    category: c.category,
    startOfDay: 0,
    endOfDay: 0,
    netDifference: 0,
  }));

  const nowIso = new Date().toISOString();

  return {
    date: dateStr,
    compartments,
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
    operatorNotes: '',
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

/**
 * Calcule tous les totaux et métriques financières d'une fiche journalière
 */
export function calculateDailyMetrics(record: DailyRecord, previousRecord?: DailyRecord | null): DailySummaryMetrics {
  // Compartiments
  let totalStart = 0;
  let totalEnd = 0;
  let seddoNetDifference = 0;
  let cashStart = 0;
  let cashEnd = 0;
  let cashNetDifference = 0;

  record.compartments.forEach(comp => {
    totalStart += comp.startOfDay || 0;
    totalEnd += comp.endOfDay || 0;

    if (comp.id === 'seddo') {
      seddoNetDifference = (comp.endOfDay || 0) - (comp.startOfDay || 0);
    }
    if (comp.id === 'liquidites') {
      cashStart = comp.startOfDay || 0;
      cashEnd = comp.endOfDay || 0;
      cashNetDifference = cashEnd - cashStart;
    }
  });

  const totalNetDifference = totalEnd - totalStart;
  const reliquat = totalNetDifference; // Le reliquat : calcul de la différence entre les sommes des débuts et fins de journées du jour en cours

  // Report automatique du Reliquat STRICT de la veille (à 00h00)
  // RÈGLE STRICTE ANNOIRFINANCE : C'est seulement et uniquement le reliquat strict de la veille qui doit être reporté.
  // Les soldes de fin de journées de chaque compartiment ne doivent JAMAIS être reportés.
  let previousDayTotalStart = 0;
  let previousDayTotalEnd = 0;
  let previousDayReliquat = 0;
  let previousDayDate: string | undefined = undefined;

  if (previousRecord) {
    previousDayDate = previousRecord.date;
    previousDayTotalStart = previousRecord.compartments.reduce((acc, c) => acc + (c.startOfDay || 0), 0);
    previousDayTotalEnd = previousRecord.compartments.reduce((acc, c) => acc + (c.endOfDay || 0), 0);
    previousDayReliquat = previousDayTotalEnd - previousDayTotalStart;
  } else if (record.previousDayReliquatReported !== undefined) {
    previousDayReliquat = record.previousDayReliquatReported;
  }

  const cumulativeReliquat = previousDayReliquat + reliquat;

  // Transferts internationaux (RIA, Western Union, MoneyGram)
  const defaultOpStats = () => ({
    count: 0,
    retraitsCount: 0,
    envoisCount: 0,
    retraitsM1: 0,
    retraitsM2: 0,
    retraitsTax: 0,
    envoisM1: 0,
    totalM1: 0,
  });

  const transfersByOp: Record<InternationalOperator, {
    count: number;
    retraitsCount: number;
    envoisCount: number;
    retraitsM1: number;
    retraitsM2: number;
    retraitsTax: number;
    envoisM1: number;
    totalM1: number;
  }> = {
    'RIA': defaultOpStats(),
    'Western Union': defaultOpStats(),
    'MoneyGram': defaultOpStats(),
    'Autre': defaultOpStats(),
  };

  let totalRetraitsM1 = 0;
  let totalRetraitsM2 = 0;
  let totalRetraitsTax = 0;
  let retraitsCount = 0;

  let totalEnvoisM1 = 0;
  let envoisCount = 0;

  record.transfers.forEach(tx => {
    const m1 = tx.m1 || 0;
    const isRetrait = tx.type === 'retrait';
    const isEnvoi = tx.type === 'envoi';
    const op = tx.operator || 'Autre';

    if (!transfersByOp[op]) {
      transfersByOp[op] = defaultOpStats();
    }
    transfersByOp[op].count += 1;
    transfersByOp[op].totalM1 += m1;

    if (isRetrait) {
      const m2 = tx.m2 || 0;
      const tax = tx.tax !== undefined ? tx.tax : Math.max(0, m1 - m2);

      retraitsCount += 1;
      totalRetraitsM1 += m1;
      totalRetraitsM2 += m2;
      totalRetraitsTax += tax;

      transfersByOp[op].retraitsCount += 1;
      transfersByOp[op].retraitsM1 += m1;
      transfersByOp[op].retraitsM2 += m2;
      transfersByOp[op].retraitsTax += tax;
    } else {
      // Pour l'envoi : uniquement montant avec taxe (M1)
      envoisCount += 1;
      totalEnvoisM1 += m1;

      transfersByOp[op].envoisCount += 1;
      transfersByOp[op].envoisM1 += m1;
    }
  });

  const totalM1 = totalRetraitsM1 + totalEnvoisM1;
  const totalM2 = totalRetraitsM2;
  const totalTax = totalRetraitsTax;
  // Flux net de caisse: Envois reçus (entrées en caisse) - Retraits payés (sorties de caisse)
  const transfersNetFlow = totalEnvoisM1 - totalRetraitsM1;

  // Partenaires Libres Seddo
  let totalSeddoPartnersAmount = 0;
  let seddoCashPaid = 0;
  record.seddoPartners.forEach(p => {
    const amt = p.amount || 0;
    totalSeddoPartnersAmount += amt;
    if (!p.paymentMode || p.paymentMode === 'Espèces') {
      seddoCashPaid += amt;
    }
  });

  // Différence Seddo: Ventes encaissées chez les partenaires vs Consommation stock Seddo (valeur absolue de la sortie)
  const seddoConsumed = (record.compartments.find(c => c.id === 'seddo')?.startOfDay || 0) - 
                        (record.compartments.find(c => c.id === 'seddo')?.endOfDay || 0);
  const seddoGap = totalSeddoPartnersAmount - seddoConsumed;

  // Calculs liés en temps réel pour le tiroir-caisse physique
  // Caisse théorique = Caisse Début + Envois reçus + Ventes Seddo espèces - Retraits payés
  const theoreticalCashDrawer = (cashStart || 0) + totalEnvoisM1 + seddoCashPaid - totalRetraitsM1;
  const cashDrawerDiscrepancy = cashEnd > 0 ? (cashEnd - theoreticalCashDrawer) : 0;

  // Calcul du comptage physique des espèces
  const cb = record.cashBreakdown || { b10000: 0, b5000: 0, b2000: 0, b1000: 0, b500: 0, coins: 0 };
  const physicalCashCount = 
    (cb.b10000 || 0) * 10000 +
    (cb.b5000 || 0) * 5000 +
    (cb.b2000 || 0) * 2000 +
    (cb.b1000 || 0) * 1000 +
    (cb.b500 || 0) * 500 +
    (cb.coins || 0);

  const cashGap = physicalCashCount > 0 ? (physicalCashCount - cashEnd) : 0;

  return {
    date: record.date,
    totalStart,
    totalEnd,
    totalNetDifference,
    reliquat,
    transfersCount: record.transfers.length,
    retraitsCount,
    totalRetraitsM1,
    totalRetraitsM2,
    totalRetraitsTax,
    envoisCount,
    totalEnvoisM1,
    transfersNetFlow,
    totalM1,
    totalM2,
    totalTax,
    transfersByOp,
    seddoPartnersCount: record.seddoPartners.length,
    totalSeddoPartnersAmount,
    seddoNetDifference,
    seddoGap,
    cashStart,
    cashEnd,
    cashNetDifference,
    physicalCashCount,
    cashGap,
    previousDayReliquat,
    previousDayTotalStart,
    previousDayTotalEnd,
    previousDayDate,
    cumulativeReliquat,
    theoreticalCashDrawer,
    cashDrawerDiscrepancy,
  };
}

/**
 * Génère le fichier CSV pour export de la journée avec séparation des Retraits et Envois
 */
export function exportRecordToCSV(record: DailyRecord, previousRecord?: DailyRecord | null): string {
  const metrics = calculateDailyMetrics(record, previousRecord);
  const rows: string[] = [];

  rows.push(`ANNOIRFINANCEPRO - BORDEREAU JOURNALIER DE CAISSE - ${record.date}`);
  rows.push(`Généré le;${new Date().toLocaleString('fr-FR')}`);
  rows.push(`Reliquat Journalier (Fins - Débuts);${metrics.reliquat};FCFA`);
  if (previousRecord) {
    rows.push(`Report Reliquat Veille à 00h00;${metrics.previousDayReliquat};FCFA`);
  }
  rows.push('');
  rows.push('--- COMPARTIMENTS DE PAIEMENT (DEBUT & FIN DE JOURNEE) ---');
  rows.push('Paiement / Service;Compartiment Début (FCFA);Compartiment Fin (FCFA);Différence Nette (FCFA);Statut');
  
  record.compartments.forEach(c => {
    const diff = c.endOfDay - c.startOfDay;
    const statut = diff > 0 ? 'Entrée / Hausse' : diff < 0 ? 'Sortie / Baisse' : 'Stable';
    rows.push(`"${c.name}";${c.startOfDay};${c.endOfDay};${diff};"${statut}"`);
  });
  
  rows.push(`"TOTAL GENERAL";${metrics.totalStart};${metrics.totalEnd};${metrics.totalNetDifference};""`);
  rows.push('');
  rows.push('--- RETRAITS OPERATEURS (PAIEMENTS AUX CLIENTS) ---');
  rows.push('Opérateur;Client;Référence;Heure;Montant Avec Taxe (M1);Montant Hors Taxe (M2);Taxe (M1-M2)');

  const retraits = record.transfers.filter(t => t.type === 'retrait');
  retraits.forEach(tx => {
    rows.push(`"${tx.operator}";"${tx.clientName || ''}";"${tx.referenceNumber || ''}";"${tx.time || ''}";${tx.m1};${tx.m2 || 0};${tx.tax || 0}`);
  });
  rows.push(`"TOTAL RETRAITS (${retraits.length})";"";"";"";${metrics.totalRetraitsM1};${metrics.totalRetraitsM2};${metrics.totalRetraitsTax}`);

  rows.push('');
  rows.push('--- ENVOIS OPERATEURS (TRANSFERTS ENCAISSES DES CLIENTS) ---');
  rows.push('Opérateur;Client;Référence;Heure;Montant Avec Taxe (M1)');

  const envois = record.transfers.filter(t => t.type === 'envoi');
  envois.forEach(tx => {
    rows.push(`"${tx.operator}";"${tx.clientName || ''}";"${tx.referenceNumber || ''}";"${tx.time || ''}";${tx.m1}`);
  });
  rows.push(`"TOTAL ENVOIS (${envois.length})";"";"";"";${metrics.totalEnvoisM1}`);

  rows.push('');
  rows.push('--- PARTENAIRES LIBRES (SEDDO) ---');
  rows.push('Nom du Partenaire / Client;Somme Payée (FCFA);Mode de Règlement;Heure;Notes');

  record.seddoPartners.forEach(p => {
    rows.push(`"${p.partnerName}";${p.amount};"${p.paymentMode}";"${p.time}";"${p.note || ''}"`);
  });

  rows.push(`"TOTAL PARTENAIRES LIBRES (${record.seddoPartners.length})";${metrics.totalSeddoPartnersAmount};"";"";""`);

  return rows.join('\n');
}

