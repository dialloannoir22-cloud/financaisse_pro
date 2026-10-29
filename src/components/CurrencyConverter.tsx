import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ArrowLeftRight, 
  RefreshCw, 
  Search, 
  Copy, 
  Check, 
  Globe, 
  Percent, 
  TrendingUp, 
  SlidersHorizontal,
  Coins,
  Clock,
  Sparkles,
  X,
  ChevronDown
} from 'lucide-react';
import { 
  currencyService, 
  CurrencyInfo, 
  WORLD_CURRENCIES, 
  CurrencyRatesState 
} from '../services/currencyService';

const PRESET_PAIRS = [
  { from: 'EUR', to: 'XOF', label: 'EUR / FCFA', desc: 'Taux officiel BCEAO' },
  { from: 'USD', to: 'XOF', label: 'USD / FCFA', desc: 'Dollar Américain' },
  { from: 'CAD', to: 'XOF', label: 'CAD / FCFA', desc: 'Dollar Canadien' },
  { from: 'GBP', to: 'XOF', label: 'GBP / FCFA', desc: 'Livre Sterling' },
  { from: 'SAR', to: 'XOF', label: 'SAR / FCFA', desc: 'Riyal (Hajj & Omra)' },
  { from: 'AED', to: 'XOF', label: 'AED / FCFA', desc: 'Dubaï / Émirats' },
  { from: 'MAD', to: 'XOF', label: 'MAD / FCFA', desc: 'Dirham Marocain' },
  { from: 'GNF', to: 'XOF', label: 'GNF / FCFA', desc: 'Franc Guinéen' },
  { from: 'NGN', to: 'XOF', label: 'NGN / FCFA', desc: 'Naira Nigérian' },
  { from: 'CNY', to: 'XOF', label: 'CNY / FCFA', desc: 'Yuan Chinois' },
];

const PRESET_AMOUNTS = [100, 500, 1000, 5000, 10000, 50000, 100000];

export const CurrencyConverter: React.FC = () => {
  const [ratesState, setRatesState] = useState<CurrencyRatesState>(() => currencyService.getCachedRates());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [amount, setAmount] = useState<number>(100);
  const [fromCurrency, setFromCurrency] = useState<string>('EUR');
  const [toCurrency, setToCurrency] = useState<string>('XOF');
  
  // Paramètres de marge/commission de bureau de change
  const [enableMargin, setEnableMargin] = useState<boolean>(false);
  const [marginPercent, setMarginPercent] = useState<number>(1.5);
  const [marginType, setMarginType] = useState<'deduct' | 'add'>('deduct'); // deduct = achat, add = vente

  // Recherche dans le tableau des devises
  const [tableSearch, setTableSearch] = useState<string>('');
  const [tableCategory, setTableCategory] = useState<string>('all');

  // Sélecteur modal de devise
  const [selectorTarget, setSelectorTarget] = useState<'from' | 'to' | null>(null);
  const [modalSearch, setModalSearch] = useState<string>('');

  // État de copie
  const [copied, setCopied] = useState<boolean>(false);

  // Charger les cours en direct dès le montage
  const handleRefreshRates = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const updated = await currencyService.fetchLiveRates();
      setRatesState(updated);
    } catch (err) {
      console.error('Erreur refresh rates:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Si les données proviennent du fallback ou cache ancien, rafraîchir en direct
    if (ratesState.source === 'fallback' || !ratesState.lastUpdated) {
      handleRefreshRates();
    }
  }, [handleRefreshRates, ratesState.source, ratesState.lastUpdated]);

  // Liste de toutes les devises disponibles fusionnées
  const allCurrencies = useMemo(() => {
    return currencyService.getAllAvailableCurrencies(ratesState.rates);
  }, [ratesState.rates]);

  const currencyMap = useMemo(() => {
    const map = new Map<string, CurrencyInfo>();
    allCurrencies.forEach(c => map.set(c.code, c));
    return map;
  }, [allCurrencies]);

  const fromInfo = currencyMap.get(fromCurrency) || {
    code: fromCurrency,
    name: fromCurrency,
    symbol: fromCurrency,
    flag: '🌐',
    country: 'International',
  };

  const toInfo = currencyMap.get(toCurrency) || {
    code: toCurrency,
    name: toCurrency,
    symbol: toCurrency,
    flag: '🌐',
    country: 'International',
  };

  // Calcul du résultat de conversion
  const conversionResult = useMemo(() => {
    return currencyService.convert(
      amount,
      fromCurrency,
      toCurrency,
      ratesState.rates,
      enableMargin ? marginPercent : 0,
      marginType
    );
  }, [amount, fromCurrency, toCurrency, ratesState.rates, enableMargin, marginPercent, marginType]);

  // Inverser les devises
  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  // Copier le résultat
  const handleCopyResult = () => {
    const textToCopy = `${amount.toLocaleString('fr-FR')} ${fromCurrency} = ${conversionResult.netResult.toLocaleString('fr-FR', {
      maximumFractionDigits: 2,
    })} ${toCurrency} (Taux: 1 ${fromCurrency} = ${conversionResult.directRate.toFixed(4)} ${toCurrency})`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filtrage du tableau mondial des cours
  const filteredCurrencies = useMemo(() => {
    const q = tableSearch.toLowerCase().trim();
    return allCurrencies.filter(c => {
      const matchesCategory = 
        tableCategory === 'all' || 
        c.category === tableCategory || 
        (tableCategory === 'popular' && c.category === 'popular');

      if (!matchesCategory) return false;

      if (!q) return true;
      return (
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q)
      );
    });
  }, [allCurrencies, tableSearch, tableCategory]);

  // Filtrage du modal sélecteur
  const modalCurrencies = useMemo(() => {
    const q = modalSearch.toLowerCase().trim();
    if (!q) return allCurrencies;
    return allCurrencies.filter(c =>
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q)
    );
  }, [allCurrencies, modalSearch]);

  const formatRate = (rate: number): string => {
    if (rate >= 1000) return rate.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
    if (rate >= 1) return rate.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    if (rate >= 0.0001) return rate.toFixed(6);
    return rate.toExponential(4);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Bandeau supérieur d'état du marché mondial */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-5 shadow-sm border border-slate-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Globe className="w-5 h-5 animate-pulse" />
            </span>
            <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Calculateur &amp; Marché Mondial des Devises
              <span className="text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                160+ Devises
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-300 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Dernière mise à jour mondiale :{' '}
            <span className="font-medium text-slate-200">
              {ratesState.lastUpdated 
                ? new Date(ratesState.lastUpdated).toLocaleString('fr-FR', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit'
                  })
                : 'En attente de connexion...'}
            </span>
            <span className={`inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-bold ${
              ratesState.source === 'live'
                ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                : 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
            }`}>
              {ratesState.source === 'live' ? 'En Direct' : 'Mode Cache / Référence'}
            </span>
          </p>
        </div>

        {/* Bouton de mise à jour manuelle des cours à tout moment */}
        <button
          onClick={handleRefreshRates}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-semibold rounded-xl text-xs transition-all shadow-md disabled:opacity-50 whitespace-nowrap"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Mise à jour mondiale...' : 'Actualiser les cours en direct'}</span>
        </button>
      </div>

      {ratesState.error && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 px-4 py-3 rounded-xl text-xs flex items-center justify-between">
          <span>{ratesState.error}</span>
          <button 
            onClick={handleRefreshRates}
            className="underline font-semibold hover:text-amber-900 ml-2"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* 2. Raccourcis de paires de devises à haute fréquence */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Paires Clés de l'Agence
          </span>
          <span className="text-[11px] text-slate-400">Cliquez pour appliquer immédiatement</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {PRESET_PAIRS.map(pair => {
            const isSelected = fromCurrency === pair.from && toCurrency === pair.to;
            const fromC = currencyMap.get(pair.from);
            const toC = currencyMap.get(pair.to);
            return (
              <button
                key={`${pair.from}-${pair.to}`}
                onClick={() => {
                  setFromCurrency(pair.from);
                  setToCurrency(pair.to);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600'
                }`}
              >
                <span>{fromC?.flag}</span>
                <span className="font-bold">{pair.label}</span>
                <span>{toC?.flag}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Carte Principale du Convertisseur de Devises */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Bloc Montant Source */}
          <div className="lg:col-span-5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Montant à convertir
              </label>
              <span className="text-xs text-slate-400">Devise source</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  min="0"
                  step="any"
                  value={amount || ''}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full pl-4 pr-10 py-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-750 rounded-xl text-lg font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
                {amount > 0 && (
                  <button
                    onClick={() => setAmount(0)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Bouton sélecteur devise source */}
              <button
                type="button"
                onClick={() => setSelectorTarget('from')}
                className="flex items-center gap-2 px-3.5 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-all font-semibold text-slate-900 dark:text-white shrink-0 shadow-xs"
              >
                <span className="text-xl">{fromInfo.flag}</span>
                <span className="text-sm font-bold">{fromInfo.code}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Presets rapides de montant */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold shrink-0">Montants :</span>
              {PRESET_AMOUNTS.map(preset => (
                <button
                  key={preset}
                  onClick={() => setAmount(preset)}
                  className={`text-[11px] px-2 py-0.5 rounded-md font-medium transition-colors ${
                    amount === preset
                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {preset.toLocaleString('fr-FR')}
                </button>
              ))}
            </div>
          </div>

          {/* Bouton d'inversion central */}
          <div className="lg:col-span-2 flex justify-center py-2 lg:py-0">
            <button
              onClick={handleSwapCurrencies}
              title="Inverser les devises"
              className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95 shadow-xs"
            >
              <ArrowLeftRight className="w-5 h-5" />
            </button>
          </div>

          {/* Bloc Devise Cible */}
          <div className="lg:col-span-5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Devise de destination
              </label>
              <span className="text-xs text-slate-400">Devise reçue</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 py-3.5 px-4 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-lg font-bold text-emerald-900 dark:text-emerald-300 overflow-hidden text-ellipsis whitespace-nowrap">
                {conversionResult.netResult.toLocaleString('fr-FR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 4,
                })}
              </div>

              {/* Bouton sélecteur devise cible */}
              <button
                type="button"
                onClick={() => setSelectorTarget('to')}
                className="flex items-center gap-2 px-3.5 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-all font-semibold text-slate-900 dark:text-white shrink-0 shadow-xs"
              >
                <span className="text-xl">{toInfo.flag}</span>
                <span className="text-sm font-bold">{toInfo.code}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
              <span>{toInfo.name}</span>
              <button
                onClick={handleCopyResult}
                className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copié !' : 'Copier'}</span>
              </button>
            </div>
          </div>

        </div>

        {/* 4. Carte Récapitulative du Cours Appliqué & Taux Inverses */}
        <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="text-xs text-slate-500 dark:text-slate-400">Cours du marché mondial appliqué :</div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
              1 {fromInfo.code} = <span className="text-emerald-600 dark:text-emerald-400">{formatRate(conversionResult.directRate)}</span> {toInfo.code}
            </div>
            <div className="text-[11px] text-slate-400">
              Taux inverse : 1 {toInfo.code} = {formatRate(conversionResult.inverseRate)} {fromInfo.code}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setEnableMargin(!enableMargin)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                enableMargin
                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Marge de Guichet {enableMargin ? `(${marginPercent}%)` : '(Désactivée)'}</span>
            </button>
          </div>
        </div>

        {/* 5. Tiroir Optionnel de Marge Bureau de Change */}
        {enableMargin && (
          <div className="p-4 bg-amber-50/70 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/60 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-amber-600" />
                  Calculateur de Commission de Change Agence
                </span>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-400">
                  Définissez la commission du bureau de change appliquée sur la transaction.
                </p>
              </div>

              {/* Type d'opération */}
              <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-lg border border-amber-200 dark:border-amber-900 text-xs font-medium">
                <button
                  onClick={() => setMarginType('deduct')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    marginType === 'deduct'
                      ? 'bg-amber-600 text-white font-bold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Achat (Déduire commission)
                </button>
                <button
                  onClick={() => setMarginType('add')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    marginType === 'add'
                      ? 'bg-amber-600 text-white font-bold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Vente (Facturer marge)
                </button>
              </div>
            </div>

            {/* Presets de marge */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">Taux de marge :</span>
              {[0.5, 1.0, 1.5, 2.0, 2.5, 3.0].map(p => (
                <button
                  key={p}
                  onClick={() => setMarginPercent(p)}
                  className={`px-2.5 py-1 text-xs rounded-md font-semibold border ${
                    marginPercent === p
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-amber-200 dark:border-amber-800'
                  }`}
                >
                  {p}%
                </button>
              ))}
            </div>

            {/* Décomposition Financière */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Montant Brut Marché</div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {conversionResult.grossResult.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} {toInfo.code}
                </div>
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="text-amber-500 text-[10px] uppercase font-bold">Commission Agence ({marginPercent}%)</div>
                <div className="text-sm font-bold text-amber-600 dark:text-amber-400">
                  {conversionResult.marginAmount.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} {toInfo.code}
                </div>
              </div>
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-300 dark:border-emerald-800">
                <div className="text-emerald-700 dark:text-emerald-400 text-[10px] uppercase font-bold">Montant Net Client</div>
                <div className="text-sm font-black text-emerald-900 dark:text-emerald-300">
                  {conversionResult.netResult.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} {toInfo.code}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 6. Grand Tableau Mondial des Cours de Référence (160+ Devises) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Tableau des Cours Mondiaux du Jour (Base : FCFA XOF)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tous les taux sont actualisés en temps réel depuis le marché financier mondial.
            </p>
          </div>

          {/* Filtres & Recherche */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Champ de recherche */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Rechercher une devise, pays..."
                className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Filtre catégorie */}
            <select
              value={tableCategory}
              onChange={(e) => setTableCategory(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden"
            >
              <option value="all">Toutes les zones ({allCurrencies.length})</option>
              <option value="popular">Principales &amp; Populaires</option>
              <option value="africa">Afrique (CEDEAO / CEMAC)</option>
              <option value="europe">Europe</option>
              <option value="americas">Amériques</option>
              <option value="middle_east">Moyen-Orient / Golfe</option>
              <option value="asia">Asie &amp; Océanie</option>
            </select>
          </div>
        </div>

        {/* Tableau */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Devise</th>
                <th className="py-3 px-4">Pays / Zone</th>
                <th className="py-3 px-4 text-right">Valeur de 1 unité en FCFA (XOF)</th>
                <th className="py-3 px-4 text-right">100 unités en FCFA</th>
                <th className="py-3 px-4 text-right">Valeur de 1 000 FCFA</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCurrencies.slice(0, 50).map((curr) => {
                const rateFromXof = ratesState.rates[curr.code] || 1;
                // Valeur de 1 Curr en FCFA = 1 / rateFromXof
                const valueOfOneInXof = rateFromXof > 0 ? (1 / rateFromXof) : 0;
                const valueOfHundredInXof = valueOfOneInXof * 100;
                const valueOfThousandXofInCurr = 1000 * rateFromXof;

                return (
                  <tr 
                    key={curr.code} 
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="text-base">{curr.flag}</span>
                      <span>{curr.code}</span>
                      <span className="text-[11px] font-normal text-slate-400">({curr.symbol})</span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                      {curr.name} <span className="text-slate-400 text-[10px]">({curr.country})</span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900 dark:text-emerald-400">
                      {valueOfOneInXof.toLocaleString('fr-FR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 4,
                      })} FCFA
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-700 dark:text-slate-300 font-semibold">
                      {valueOfHundredInXof.toLocaleString('fr-FR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} FCFA
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-500 dark:text-slate-400">
                      {formatRate(valueOfThousandXofInCurr)} {curr.code}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => {
                          setFromCurrency(curr.code);
                          setToCurrency('XOF');
                          window.scrollTo({ top: 120, behavior: 'smooth' });
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-md transition-colors"
                      >
                        Convertir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredCurrencies.length === 0 && (
            <div className="py-8 text-center text-slate-400 text-xs">
              Aucune devise trouvée pour votre recherche "{tableSearch}".
            </div>
          )}
        </div>

      </div>

      {/* 7. Modal de Sélection de Devise (Recherche ergonomique rapide) */}
      {selectorTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800">
            
            {/* Header du modal */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-600" />
                  Sélectionner la devise {selectorTarget === 'from' ? 'source (De)' : 'cible (Vers)'}
                </h3>
                <p className="text-xs text-slate-400">160+ devises mondiales disponibles</p>
              </div>
              <button
                onClick={() => {
                  setSelectorTarget(null);
                  setModalSearch('');
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Champ de recherche du modal */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  placeholder="Tapez un nom, un pays ou un code (ex: CAD, Maroc, Dollar)..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Liste scrollable des devises */}
            <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800">
              {modalCurrencies.map(curr => {
                const isCurrent = selectorTarget === 'from' 
                  ? fromCurrency === curr.code 
                  : toCurrency === curr.code;

                return (
                  <button
                    key={curr.code}
                    onClick={() => {
                      if (selectorTarget === 'from') {
                        setFromCurrency(curr.code);
                      } else {
                        setToCurrency(curr.code);
                      }
                      setSelectorTarget(null);
                      setModalSearch('');
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left ${
                      isCurrent
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{curr.flag}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">{curr.code}</span>
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">· {curr.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">{curr.country}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{curr.symbol}</span>
                      {isCurrent && (
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Sélectionné</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
