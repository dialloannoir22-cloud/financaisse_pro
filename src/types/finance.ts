/**
 * Types et interfaces pour la gestion financière de l'agence multi-services
 */

export type InternationalOperator = 'RIA' | 'Western Union' | 'MoneyGram' | 'Autre';

export type PaymentCategory = 
  | 'transfert_international'
  | 'mobile_money'
  | 'telecom_uv'
  | 'banque'
  | 'especes'
  | 'autre';

/**
 * Compartiment pour chaque type de paiement / service
 * Comprend le compartiment Début de journée et le compartiment Fin de journée
 */
export interface CompartmentEntry {
  id: string;
  name: string;
  category: PaymentCategory;
  startOfDay: number; // Compartiment début de journée (Solde d'ouverture)
  endOfDay: number;   // Compartiment fin de journée (Solde de clôture)
  netDifference: number; // Calcul automatique: endOfDay - startOfDay
  notes?: string;
  isCustom?: boolean;
}

/**
 * Transaction de transfert d'argent international (RIA, Western Union, MoneyGram)
 * - Pour le Retrait : Montant avec taxe (M1) et Montant hors taxe (M2) avec Taxe calculée
 * - Pour l'Envoi : Uniquement le Montant avec taxe (M1), colonne hors taxe supprimée
 */
export interface OperatorTransferTransaction {
  id: string;
  operator: InternationalOperator;
  type: 'retrait' | 'envoi';
  m1: number; // Montant avec taxe (TTC) - toujours présent
  m2?: number; // Montant hors taxe (HT) - uniquement pour les retraits
  tax?: number; // Calcul automatique: m1 - m2 (pour retraits)
  clientName: string; // Nom de l'expéditeur / bénéficiaire
  referenceNumber?: string; // N° de référence ou code de transfert
  time: string; // Heure de saisie (HH:mm)
  notes?: string;
}

/**
 * Entrée « Partenaire Libre » pour les règlements Seddo
 * Permet d'entrer les noms de ceux qui ont payé le Seddo avec la somme de chaque client
 */
export interface SeddoPartnerEntry {
  id: string;
  partnerName: string; // Nom de la personne / client / boutique
  amount: number;      // Somme payée (FCFA)
  paymentMode: 'Espèces' | 'Wave' | 'Orange Money' | 'Virement' | 'Autre';
  time: string;
  note?: string;
}

/**
 * Détail du comptage physique des espèces (billetterie rapide)
 */
export interface CashBreakdown {
  b10000: number; // coupures de 10 000 F
  b5000: number;  // coupures de 5 000 F
  b2000: number;  // coupures de 2 000 F
  b1000: number;  // coupures de 1 000 F
  b500: number;   // coupures de 500 F
  coins: number;  // pièces de monnaie totales
}

export interface AppUser {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'admin' | 'manager' | 'cashier';
  agencyName?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fiche journalière complète enregistrée sur le cloud (Firestore et local)
 */
export interface DailyRecord {
  id?: string; // Identifiant de fiche (e.g. YYYY-MM-DD)
  userId?: string; // UID du créateur / utilisateur courant
  date: string; // YYYY-MM-DD
  compartments: CompartmentEntry[];
  transfers: OperatorTransferTransaction[];
  seddoPartners: SeddoPartnerEntry[];
  cashBreakdown?: CashBreakdown;
  operatorNotes?: string;
  validatedAt?: string;
  previousDayReliquatReported?: number; // Report automatique strict de la veille (les soldes de fins ne sont jamais reportés)
  createdAt: string;
  updatedAt: string;
}

/**
 * Synthèse et calculs automatiques d'une journée
 * avec calcul séparé des Retraits et des Envois
 */
export interface DailySummaryMetrics {
  date: string;
  totalStart: number;
  totalEnd: number;
  totalNetDifference: number;
  
  // Totaux Transferts Internationaux globaux et séparés
  transfersCount: number;
  
  // RETRAITS (séparés)
  retraitsCount: number;
  totalRetraitsM1: number; // Montant avec taxe
  totalRetraitsM2: number; // Montant hors taxe
  totalRetraitsTax: number; // Taxe collectée sur retraits (M1 - M2)

  // ENVOIS (séparés - uniquement montant avec taxe)
  envoisCount: number;
  totalEnvoisM1: number; // Montant avec taxe uniquement

  // Flux net de caisse des transferts: Envois (entrées) - Retraits (sorties)
  transfersNetFlow: number;

  totalM1: number; // Somme M1 (Retraits M1 + Envois M1)
  totalM2: number; // Somme M2
  totalTax: number; // Somme Taxe

  transfersByOp: Record<InternationalOperator, {
    count: number;
    retraitsCount: number;
    envoisCount: number;
    retraitsM1: number;
    retraitsM2: number;
    retraitsTax: number;
    envoisM1: number;
    totalM1: number;
  }>;

  // Totaux Partenaires Libres Seddo
  seddoPartnersCount: number;
  totalSeddoPartnersAmount: number;
  
  // Compartiment spécifique Seddo
  seddoNetDifference: number;
  seddoGap: number; // Différence entre somme encaissée des partenaires et variation nette du stock Seddo

  // Compartiment spécifique Liquidités
  cashStart: number;
  cashEnd: number;
  cashNetDifference: number;
  physicalCashCount: number;
  cashGap: number; // Écart de caisse physique vs théorique

  // Le Reliquat : calcul de la différence entre les sommes des débuts de journées et de fins de journées
  reliquat: number; // totalEnd - totalStart (différence nette globale du jour en cours)

  // Report automatique de la journée précédente à 00h00
  // RÈGLE STRICTE : C'est seulement et uniquement le reliquat strict de la veille qui est reporté.
  // Les soldes de fin de journées ne sont JAMAIS reportés dans les compartiments.
  previousDayReliquat: number; // Le Reliquat strict de la veille reporté à 00h00
  previousDayTotalStart: number; // Somme des débuts de la veille
  previousDayTotalEnd: number; // Somme des fins de la veille
  previousDayDate?: string;
  cumulativeReliquat: number; // Reliquat total cumulé = previousDayReliquat + reliquat

  // Calculs liés en temps réel
  theoreticalCashDrawer: number; // Caisse théorique = cashStart + envois (espèces) + seddo espèces - retraits (espèces)
  cashDrawerDiscrepancy: number; // Écart réel de caisse = cashEnd - theoreticalCashDrawer
}

/**
 * Liste des compartiments par défaut demandés par l'utilisateur
 */
export const DEFAULT_COMPARTMENTS: Omit<CompartmentEntry, 'startOfDay' | 'endOfDay' | 'netDifference'>[] = [
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
