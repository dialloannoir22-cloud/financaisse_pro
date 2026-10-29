export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  country: string;
  category?: 'popular' | 'africa' | 'europe' | 'americas' | 'asia' | 'middle_east' | 'other';
}

export interface LiveRatesResponse {
  result: string;
  provider?: string;
  base_code: string;
  time_last_update_utc: string;
  time_next_update_utc?: string;
  rates: Record<string, number>;
}

export interface CurrencyRatesState {
  base: string;
  rates: Record<string, number>;
  lastUpdated: string;
  source: 'live' | 'cache' | 'fallback';
  isLoading: boolean;
  error: string | null;
}

// Liste complète et structurée des devises mondiales avec noms en français et métadonnées
export const WORLD_CURRENCIES: CurrencyInfo[] = [
  // Devises phares & Afrique de l'Ouest
  { code: 'XOF', name: 'Franc CFA (UEMOA)', symbol: 'FCFA', flag: '🇸🇳', country: 'Sénégal / UEMOA', category: 'popular' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', country: 'Zone Euro', category: 'popular' },
  { code: 'USD', name: 'Dollar américain', symbol: '$', flag: '🇺🇸', country: 'États-Unis', category: 'popular' },
  { code: 'CAD', name: 'Dollar canadien', symbol: 'CA$', flag: '🇨🇦', country: 'Canada', category: 'popular' },
  { code: 'GBP', name: 'Livre sterling', symbol: '£', flag: '🇬🇧', country: 'Royaume-Uni', category: 'popular' },
  { code: 'CHF', name: 'Franc suisse', symbol: 'CHF', flag: '🇨🇭', country: 'Suisse', category: 'popular' },
  { code: 'AED', name: 'Dirham des Émirats', symbol: 'AED', flag: '🇦🇪', country: 'Émirats Arabes Unis', category: 'popular' },
  { code: 'SAR', name: 'Riyal saoudien (Hajj)', symbol: 'SAR', flag: '🇸🇦', country: 'Arabie Saoudite', category: 'popular' },
  { code: 'CNY', name: 'Yuan renminbi', symbol: '¥', flag: '🇨🇳', country: 'Chine', category: 'popular' },

  // Afrique (Régionale & Continentale)
  { code: 'XAF', name: 'Franc CFA (CEMAC)', symbol: 'FCFA', flag: '🇨🇲', country: 'Cameroun / CEMAC', category: 'africa' },
  { code: 'GNF', name: 'Franc guinéen', symbol: 'GNF', flag: '🇬🇳', country: 'Guinée Conakry', category: 'africa' },
  { code: 'NGN', name: 'Naira nigérian', symbol: '₦', flag: '🇳🇬', country: 'Nigeria', category: 'africa' },
  { code: 'GHS', name: 'Cedi ghanéen', symbol: 'GH₵', flag: '🇬🇭', country: 'Ghana', category: 'africa' },
  { code: 'GMD', name: 'Dalasi gambien', symbol: 'D', flag: '🇬🇲', country: 'Gambie', category: 'africa' },
  { code: 'MAD', name: 'Dirham marocain', symbol: 'MAD', flag: '🇲🇦', country: 'Maroc', category: 'africa' },
  { code: 'DZD', name: 'Dinar algérien', symbol: 'DA', flag: '🇩🇿', country: 'Algérie', category: 'africa' },
  { code: 'TND', name: 'Dinar tunisien', symbol: 'DT', flag: '🇹🇳', country: 'Tunisie', category: 'africa' },
  { code: 'EGP', name: 'Livre égyptienne', symbol: 'E£', flag: '🇪🇬', country: 'Égypte', category: 'africa' },
  { code: 'ZAR', name: 'Rand sud-africain', symbol: 'R', flag: '🇿🇦', country: 'Afrique du Sud', category: 'africa' },
  { code: 'KES', name: 'Shilling kényan', symbol: 'KSh', flag: '🇰🇪', country: 'Kenya', category: 'africa' },
  { code: 'RWF', name: 'Franc rwandais', symbol: 'FRw', flag: '🇷🇼', country: 'Rwanda', category: 'africa' },
  { code: 'CDF', name: 'Franc congolais', symbol: 'FC', flag: '🇨🇩', country: 'RD Congo', category: 'africa' },
  { code: 'CVE', name: 'Escudo cap-verdien', symbol: 'CVE', flag: '🇨🇻', country: 'Cap-Vert', category: 'africa' },
  { code: 'MRU', name: 'Ouguiya mauritanien', symbol: 'MRU', flag: '🇲🇷', country: 'Mauritanie', category: 'africa' },
  { code: 'SLL', name: 'Leone sierra-léonais', symbol: 'Le', flag: '🇸🇱', country: 'Sierra Leone', category: 'africa' },
  { code: 'LRD', name: 'Dollar libérien', symbol: 'L$', flag: '🇱🇷', country: 'Libéria', category: 'africa' },
  { code: 'UGX', name: 'Shilling ougandais', symbol: 'USh', flag: '🇺🇬', country: 'Ouganda', category: 'africa' },
  { code: 'TZS', name: 'Shilling tanzanien', symbol: 'TSh', flag: '🇹🇿', country: 'Tanzanie', category: 'africa' },
  { code: 'MZN', name: 'Metical mozambicain', symbol: 'MT', flag: '🇲🇿', country: 'Mozambique', category: 'africa' },
  { code: 'AOA', name: 'Kwanza angolais', symbol: 'Kz', flag: '🇦🇴', country: 'Angola', category: 'africa' },
  { code: 'ETB', name: 'Birr éthiopien', symbol: 'Br', flag: '🇪🇹', country: 'Éthiopie', category: 'africa' },
  { code: 'MUR', name: 'Roupie mauricienne', symbol: '₨', flag: '🇲🇺', country: 'Maurice', category: 'africa' },

  // Moyen-Orient & Pays du Golfe
  { code: 'QAR', name: 'Riyal qatari', symbol: 'QR', flag: '🇶🇦', country: 'Qatar', category: 'middle_east' },
  { code: 'KWD', name: 'Dinar koweïtien', symbol: 'KD', flag: '🇰🇼', country: 'Koweït', category: 'middle_east' },
  { code: 'BHD', name: 'Dinar bahreïni', symbol: 'BD', flag: '🇧🇭', country: 'Bahreïn', category: 'middle_east' },
  { code: 'OMR', name: 'Rial omanais', symbol: 'OMR', flag: '🇴🇲', country: 'Oman', category: 'middle_east' },
  { code: 'JOD', name: 'Dinar jordanien', symbol: 'JD', flag: '🇯🇴', country: 'Jordanie', category: 'middle_east' },
  { code: 'LBP', name: 'Livre libanaise', symbol: 'L£', flag: '🇱🇧', country: 'Liban', category: 'middle_east' },
  { code: 'TRY', name: 'Livre turque', symbol: '₺', flag: '🇹🇷', country: 'Turquie', category: 'middle_east' },
  { code: 'ILS', name: 'Shekel israélien', symbol: '₪', flag: '🇮🇱', country: 'Israël', category: 'middle_east' },

  // Asie & Océanie
  { code: 'JPY', name: 'Yen japonais', symbol: '¥', flag: '🇯🇵', country: 'Japon', category: 'asia' },
  { code: 'INR', name: 'Roupie indienne', symbol: '₹', flag: '🇮🇳', country: 'Inde', category: 'asia' },
  { code: 'SGD', name: 'Dollar de Singapour', symbol: 'S$', flag: '🇸🇬', country: 'Singapour', category: 'asia' },
  { code: 'HKD', name: 'Dollar de Hong Kong', symbol: 'HK$', flag: '🇭🇰', country: 'Hong Kong', category: 'asia' },
  { code: 'AUD', name: 'Dollar australien', symbol: 'A$', flag: '🇦🇺', country: 'Australie', category: 'asia' },
  { code: 'NZD', name: 'Dollar néo-zélandais', symbol: 'NZ$', flag: '🇳🇿', country: 'Nouvelle-Zélande', category: 'asia' },
  { code: 'KRW', name: 'Won sud-coréen', symbol: '₩', flag: '🇰🇷', country: 'Corée du Sud', category: 'asia' },
  { code: 'MYR', name: 'Ringgit malaisien', symbol: 'RM', flag: '🇲🇾', country: 'Malaisie', category: 'asia' },
  { code: 'THB', name: 'Baht thaïlandais', symbol: '฿', flag: '🇹🇭', country: 'Thaïlande', category: 'asia' },
  { code: 'IDR', name: 'Roupie indonésienne', symbol: 'Rp', flag: '🇮🇩', country: 'Indonésie', category: 'asia' },
  { code: 'PHP', name: 'Peso philippin', symbol: '₱', flag: '🇵🇭', country: 'Philippines', category: 'asia' },
  { code: 'VND', name: 'Dong vietnamien', symbol: '₫', flag: '🇻🇳', country: 'Vietnam', category: 'asia' },
  { code: 'PKR', name: 'Roupie pakistanaise', symbol: '₨', flag: '🇵🇰', country: 'Pakistan', category: 'asia' },
  { code: 'BDT', name: 'Taka bangladais', symbol: '৳', flag: '🇧🇩', country: 'Bangladesh', category: 'asia' },

  // Amériques (Nord, Sud & Caraïbes)
  { code: 'BRL', name: 'Real brésilien', symbol: 'R$', flag: '🇧🇷', country: 'Brésil', category: 'americas' },
  { code: 'MXN', name: 'Peso mexicain', symbol: 'Mex$', flag: '🇲🇽', country: 'Mexique', category: 'americas' },
  { code: 'ARS', name: 'Peso argentin', symbol: '$', flag: '🇦🇷', country: 'Argentine', category: 'americas' },
  { code: 'COP', name: 'Peso colombien', symbol: '$', flag: '🇨🇴', country: 'Colombie', category: 'americas' },
  { code: 'CLP', name: 'Peso chilien', symbol: '$', flag: '🇨🇱', country: 'Chili', category: 'americas' },
  { code: 'PEN', name: 'Sol péruvien', symbol: 'S/', flag: '🇵🇪', country: 'Pérou', category: 'americas' },

  // Europe (hors zone Euro)
  { code: 'SEK', name: 'Couronne suédoise', symbol: 'kr', flag: '🇸🇪', country: 'Suède', category: 'europe' },
  { code: 'NOK', name: 'Couronne norvégienne', symbol: 'kr', flag: '🇳🇴', country: 'Norvège', category: 'europe' },
  { code: 'DKK', name: 'Couronne danoise', symbol: 'kr', flag: '🇩🇰', country: 'Danemark', category: 'europe' },
  { code: 'PLN', name: 'Zloty polonais', symbol: 'zł', flag: '🇵🇱', country: 'Pologne', category: 'europe' },
  { code: 'CZK', name: 'Couronne tchèque', symbol: 'Kč', flag: '🇨🇿', country: 'République Tchèque', category: 'europe' },
  { code: 'HUF', name: 'Forint hongrois', symbol: 'Ft', flag: '🇭🇺', country: 'Hongrie', category: 'europe' },
  { code: 'RON', name: 'Leu roumain', symbol: 'lei', flag: '🇷🇴', country: 'Roumanie', category: 'europe' },
  { code: 'BGN', name: 'Lev bulgare', symbol: 'лв', flag: '🇧🇬', country: 'Bulgarie', category: 'europe' },
  { code: 'RUB', name: 'Rouble russe', symbol: '₽', flag: '🇷🇺', country: 'Russie', category: 'europe' },
  { code: 'UAH', name: 'Hryvnia ukrainienne', symbol: '₴', flag: '🇺🇦', country: 'Ukraine', category: 'europe' },
  { code: 'ISK', name: 'Couronne islandaise', symbol: 'kr', flag: '🇮🇸', country: 'Islande', category: 'europe' },
];

// Dictionnaire de repli hors-ligne basé sur 1 XOF (1 Franc CFA)
// Taux officiel fixe EUR : 1 EUR = 655.957 XOF => 1 XOF = 0.00152449 EUR
export const FALLBACK_RATES_FROM_XOF: Record<string, number> = {
  XOF: 1,
  EUR: 1 / 655.957,
  USD: 1 / 608.50,
  CAD: 1 / 448.20,
  GBP: 1 / 774.30,
  CHF: 1 / 692.10,
  AED: 1 / 165.70,
  SAR: 1 / 162.25,
  CNY: 1 / 84.10,
  XAF: 1.0,
  GNF: 14.25,
  NGN: 2.65,
  GHS: 0.026,
  GMD: 0.118,
  MAD: 0.0165,
  DZD: 0.221,
  TND: 0.0051,
  EGP: 0.082,
  ZAR: 0.030,
  KES: 0.215,
  RWF: 2.28,
  CDF: 4.70,
  CVE: 0.168,
  MRU: 0.065,
  SLL: 36.8,
  LRD: 0.315,
  UGX: 6.08,
  TZS: 4.25,
  MZN: 0.105,
  AOA: 1.48,
  ETB: 0.20,
  MUR: 0.076,
  QAR: 1 / 167.15,
  KWD: 1 / 1980.50,
  BHD: 1 / 1614.00,
  OMR: 1 / 1580.00,
  JOD: 1 / 858.00,
  LBP: 147.5,
  TRY: 0.057,
  ILS: 0.0061,
  JPY: 0.252,
  INR: 0.141,
  SGD: 0.00223,
  HKD: 0.0128,
  AUD: 0.00251,
  NZD: 0.00275,
  KRW: 2.29,
  MYR: 0.0073,
  THB: 0.059,
  IDR: 26.5,
  PHP: 0.096,
  VND: 41.5,
  PKR: 0.46,
  BDT: 0.20,
  BRL: 0.0094,
  MXN: 0.033,
  ARS: 1.68,
  COP: 6.85,
  CLP: 1.58,
  PEN: 0.0062,
  SEK: 0.0175,
  NOK: 0.0178,
  DKK: 0.0114,
  PLN: 0.0066,
  CZK: 0.0385,
  HUF: 0.615,
  RON: 0.0076,
  BGN: 0.0030,
  RUB: 0.152,
  UAH: 0.068,
  ISK: 0.228,
};

const STORAGE_CACHE_KEY = 'annoir_finance_world_currency_rates_v1';

class CurrencyService {
  private ratesCache: Record<string, number> = { ...FALLBACK_RATES_FROM_XOF };
  private lastUpdated: string = '';
  private baseCurrency: string = 'XOF';
  private source: 'live' | 'cache' | 'fallback' = 'fallback';

  constructor() {
    this.initFromLocalStorage();
  }

  private initFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.rates && Object.keys(parsed.rates).length > 0) {
          this.ratesCache = { ...FALLBACK_RATES_FROM_XOF, ...parsed.rates };
          this.lastUpdated = parsed.lastUpdated || '';
          this.source = 'cache';
        }
      }
    } catch (e) {
      console.warn('Impossible de charger le cache local des devises:', e);
    }
  }

  public getCachedRates(): CurrencyRatesState {
    return {
      base: this.baseCurrency,
      rates: this.ratesCache,
      lastUpdated: this.lastUpdated || new Date().toISOString(),
      source: this.source,
      isLoading: false,
      error: null,
    };
  }

  /**
   * Récupère en direct les cours du marché mondial via des endpoints ouverts haute disponibilité (CORS friendly)
   */
  public async fetchLiveRates(): Promise<CurrencyRatesState> {
    const endpoints = [
      // 1. Endpoint principal ExchangeRate-API (fournit 160+ devises mondiales à jour contre XOF)
      'https://open.er-api.com/v6/latest/XOF',
      // 2. Endpoint alternatif open rate
      'https://api.exchangerate-api.com/v4/latest/XOF',
      // 3. Fallback via USD si le base XOF est indisponible
      'https://open.er-api.com/v6/latest/USD',
    ];

    let lastError: string | null = null;

    for (const url of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000); // 7s timeout

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data: LiveRatesResponse = await response.json();
        
        if (data && data.rates && Object.keys(data.rates).length > 0) {
          let computedRates: Record<string, number> = {};

          if (data.base_code === 'XOF') {
            computedRates = { ...FALLBACK_RATES_FROM_XOF, ...data.rates };
          } else if (data.base_code === 'USD' && data.rates['XOF']) {
            // Re-baser sur XOF: si 1 USD = R_usd_xof XOF, alors 1 XOF = 1 / R_usd_xof USD
            const xofPerUsd = data.rates['XOF'];
            for (const [code, rateToUsd] of Object.entries(data.rates)) {
              computedRates[code] = rateToUsd / xofPerUsd;
            }
            computedRates['XOF'] = 1;
          }

          // Forcer le taux officiel fixe EUR/CFA si l'écart est négligeable pour conformité stricte UEMOA
          computedRates['EUR'] = 1 / 655.957;

          this.ratesCache = computedRates;
          this.lastUpdated = data.time_last_update_utc || new Date().toISOString();
          this.source = 'live';

          // Sauvegarde en cache local
          try {
            localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify({
              rates: computedRates,
              lastUpdated: this.lastUpdated,
              timestamp: Date.now(),
            }));
          } catch (storageErr) {
            console.warn('Erreur stockage cache devises:', storageErr);
          }

          return {
            base: 'XOF',
            rates: this.ratesCache,
            lastUpdated: this.lastUpdated,
            source: 'live',
            isLoading: false,
            error: null,
          };
        }
      } catch (err: any) {
        lastError = err?.message || 'Erreur réseau';
        console.warn(`Tentative fetch devises (${url}) échouée:`, err);
      }
    }

    // Si tous les endpoints ont échoué, on utilise le cache ou le fallback sans bloquer l'opérateur
    return {
      base: 'XOF',
      rates: this.ratesCache,
      lastUpdated: this.lastUpdated || new Date().toISOString(),
      source: this.source === 'live' ? 'cache' : this.source,
      isLoading: false,
      error: `Connexion marché mondial indisponible (${lastError}). Cours de référence appliqués.`,
    };
  }

  /**
   * Effectue la conversion instantanée entre n'importe quelles devises mondiales
   * Formule : (Montant / TauxBaseVersSource) * TauxBaseVersCible
   */
  public convert(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    rates: Record<string, number>,
    marginPercent: number = 0,
    marginType: 'deduct' | 'add' = 'deduct'
  ): {
    grossResult: number;
    marginAmount: number;
    netResult: number;
    directRate: number; // 1 From = X To
    inverseRate: number; // 1 To = X From
  } {
    if (amount <= 0 || isNaN(amount)) {
      return {
        grossResult: 0,
        marginAmount: 0,
        netResult: 0,
        directRate: 1,
        inverseRate: 1,
      };
    }

    if (fromCurrency === toCurrency) {
      return {
        grossResult: amount,
        marginAmount: 0,
        netResult: amount,
        directRate: 1,
        inverseRate: 1,
      };
    }

    // Taux par rapport à la base (XOF)
    const rateFrom = rates[fromCurrency] || FALLBACK_RATES_FROM_XOF[fromCurrency] || 1;
    const rateTo = rates[toCurrency] || FALLBACK_RATES_FROM_XOF[toCurrency] || 1;

    // 1 From = (rateTo / rateFrom) To
    const directRate = rateTo / rateFrom;
    const inverseRate = directRate > 0 ? 1 / directRate : 0;

    const grossResult = amount * directRate;
    const marginAmount = (grossResult * Math.abs(marginPercent)) / 100;
    const netResult = marginType === 'deduct' 
      ? Math.max(0, grossResult - marginAmount) 
      : grossResult + marginAmount;

    return {
      grossResult,
      marginAmount,
      netResult,
      directRate,
      inverseRate,
    };
  }

  /**
   * Récupère la liste fusionnée de toutes les devises disponibles (connues + API)
   */
  public getAllAvailableCurrencies(rates: Record<string, number>): CurrencyInfo[] {
    const knownMap = new Map<string, CurrencyInfo>();
    WORLD_CURRENCIES.forEach(c => knownMap.set(c.code, c));

    // Si l'API retourne d'autres devises ISO mondiales non listées explicitement
    const result: CurrencyInfo[] = [...WORLD_CURRENCIES];
    const existingCodes = new Set(WORLD_CURRENCIES.map(c => c.code));

    Object.keys(rates).forEach(code => {
      if (!existingCodes.has(code) && code.length === 3) {
        result.push({
          code,
          name: `Devise ${code}`,
          symbol: code,
          flag: '🌐',
          country: 'International',
          category: 'other',
        });
      }
    });

    return result;
  }
}

export const currencyService = new CurrencyService();
