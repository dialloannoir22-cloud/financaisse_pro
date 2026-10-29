import React, { useState } from 'react';
import { 
  CompartmentEntry, 
  DailyRecord 
} from '../types/finance';
import { 
  formatCurrency, 
  parseNumber 
} from '../utils/financeCalculations';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus, 
  Plus, 
  Trash2, 
  History, 
  Coins, 
  Layers, 
  Check, 
  Building2, 
  Banknote, 
  RotateCcw,
  Scale,
  Clock,
  LayoutGrid,
  Table as TableIcon,
  CreditCard,
  Sparkles
} from 'lucide-react';

interface CompartmentsTableProps {
  compartments: CompartmentEntry[];
  onUpdateCompartment: (id: string, field: 'startOfDay' | 'endOfDay' | 'notes', value: any) => void;
  onAddCompartment: (name: string, category: CompartmentEntry['category']) => void;
  onDeleteCompartment: (id: string) => void;
  onRefreshYesterdayReliquat: () => void;
  onResetStartToZero: () => void;
  onOpenCashCounter: () => void;
  yesterdayAvailable: boolean;
  dailyReliquat?: number;
  previousDayReliquat?: number;
  previousRecord?: DailyRecord | null;
}

export const CompartmentsTable: React.FC<CompartmentsTableProps> = ({
  compartments,
  onUpdateCompartment,
  onAddCompartment,
  onDeleteCompartment,
  onRefreshYesterdayReliquat,
  onResetStartToZero,
  onOpenCashCounter,
  yesterdayAvailable,
  dailyReliquat = 0,
  previousDayReliquat = 0,
  previousRecord,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCompName, setNewCompName] = useState('');
  const [newCompCategory, setNewCompCategory] = useState<CompartmentEntry['category']>('mobile_money');
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(() => 
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'cards' : 'table'
  );

  // Totaux calculés
  const totalStart = compartments.reduce((acc, c) => acc + (c.startOfDay || 0), 0);
  const totalEnd = compartments.reduce((acc, c) => acc + (c.endOfDay || 0), 0);
  const totalNet = totalEnd - totalStart; // Reliquat calculé du jour

  const handleRefresh = () => {
    onRefreshYesterdayReliquat();
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCompName.trim()) {
      onAddCompartment(newCompName.trim(), newCompCategory);
      setNewCompName('');
      setShowAddModal(false);
    }
  };

  // Helper d'icône et badge de catégorie
  const getCategoryBadge = (category: CompartmentEntry['category']) => {
    switch (category) {
      case 'transfert_international':
        return { label: 'Transfert Intl', bg: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' };
      case 'mobile_money':
        return { label: 'Mobile Money', bg: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' };
      case 'telecom_uv':
        return { label: 'UV / Télécom', bg: 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' };
      case 'banque':
        return { label: 'Banque', bg: 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800' };
      case 'especes':
        return { label: 'Espèces / Caisse', bg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' };
      default:
        return { label: 'Service', bg: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700' };
    }
  };

  const getOperatorIcon = (name: string, category: CompartmentEntry['category']) => {
    const lower = name.toLowerCase();
    if (lower.includes('ria')) {
      return <span className="font-extrabold text-xs text-orange-600 bg-orange-100 dark:bg-orange-950/80 dark:text-orange-400 px-2 py-0.5 rounded">RIA</span>;
    }
    if (lower.includes('western')) {
      return <span className="font-extrabold text-xs text-amber-900 bg-amber-300 dark:bg-amber-400 dark:text-slate-950 px-2 py-0.5 rounded">WU</span>;
    }
    if (lower.includes('moneygram')) {
      return <span className="font-extrabold text-xs text-red-600 bg-red-100 dark:bg-red-950/80 dark:text-red-400 px-2 py-0.5 rounded">MG</span>;
    }
    if (lower.includes('wave')) {
      return <span className="font-extrabold text-xs text-cyan-600 bg-cyan-100 dark:bg-cyan-950/80 dark:text-cyan-400 px-2 py-0.5 rounded">WAVE</span>;
    }
    if (lower.includes('orange')) {
      return <span className="font-extrabold text-xs text-amber-600 bg-orange-100 dark:bg-amber-950/80 dark:text-amber-400 px-2 py-0.5 rounded">OM</span>;
    }
    if (lower.includes('seddo')) {
      return <span className="font-extrabold text-xs text-emerald-700 bg-emerald-100 dark:bg-emerald-950/80 dark:text-emerald-300 px-2 py-0.5 rounded">SEDDO</span>;
    }
    if (lower.includes('liquidit')) {
      return <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    }
    if (category === 'banque') {
      return <Building2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
    }
    return <CreditCard className="w-4 h-4 text-slate-500 dark:text-slate-400" />;
  };

  // Helper pour trouver le reliquat de la veille d'un compartiment donné
  const getYesterdayCompartmentReliquat = (compId: string): number | null => {
    if (!previousRecord) return null;
    const prev = previousRecord.compartments.find(c => c.id === compId);
    if (!prev) return null;
    return (prev.endOfDay || 0) - (prev.startOfDay || 0);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. CARTE MAÎTRESSE : COLONNE DÉDIÉE AU RELIQUAT SYNCHRONISÉE AVEC LE DASHBOARD (00H00) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-amber-950 text-white rounded-2xl p-5 shadow-sm border border-slate-800 transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-2xs">
                <Scale className="w-3.5 h-3.5" />
                <span>Colonne Dédiée au Reliquat</span>
              </span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-md border border-amber-400/30">
                <Clock className="w-3.5 h-3.5" />
                Reporté &amp; Rempli automatiquement à 00h00
              </span>
              <span className="text-xs text-slate-400">
                ● Synchronisé en direct avec le Dashboard
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-white flex flex-wrap items-center gap-2">
              <span>Reliquat Strict Reporté de la Veille :</span>
              <span className="font-mono text-2xl font-black text-amber-300 tabular-nums">
                {previousDayReliquat > 0 && '+'}{formatCurrency(previousDayReliquat)}
              </span>
            </h3>

            <p className="text-xs text-slate-300">
              Règle stricte appliquée : <strong>seul et uniquement le reliquat strict de la veille</strong> (différence nette globale) est reporté à 00h00. Les soldes de fin de journées de chaque compartiment ne sont <strong>jamais</strong> reportés.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
            {/* Boîte Reliquat du Jour */}
            <div className="px-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-right shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Reliquat en Cours (Fins − Débuts)
              </span>
              <span className={`text-base font-black font-mono tabular-nums ${
                totalNet >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {totalNet > 0 && '+'}{formatCurrency(totalNet)}
              </span>
            </div>

            {/* Bascule de vue : Tableau complet en colonnes ou Grille de cartes */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                title="Afficher le tableau avec colonne dédiée au Reliquat"
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  viewMode === 'table'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Tableau Colonnes</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                title="Afficher la vue cartes compartiments"
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  viewMode === 'cards'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cartes</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Barre d'actions rapides & gestion de caisse */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Compartiments de Caisse (Débuts &amp; Fins Manuels · Reliquat Automatique)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Vous remplissez manuellement le début et la fin de chaque compartiment. La <strong>colonne du Reliquat</strong> calcule la différence nette et s'aligne automatiquement sur le Dashboard.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onResetStartToZero}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-xl transition-colors"
            title="Réinitialise tous les compartiments début de journée à zéro"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Débuts à Zéro</span>
          </button>

          {yesterdayAvailable && (
            <button
              onClick={handleRefresh}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
                copiedNotification
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60'
              }`}
              title="Vérifie et actualise le report strict du reliquat de la veille à 00h00 (sans jamais modifier les compartiments)"
            >
              {copiedNotification ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Reliquat Strict Actualisé !</span>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4" />
                  <span>Actualiser Reliquat Strict Veille</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={onOpenCashCounter}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-800 rounded-xl transition-colors"
          >
            <Coins className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <span>Billetterie Espèces</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter Service</span>
          </button>
        </div>
      </div>

      {/* 3. VUE TABLEAU EN COLONNES (AVEC COLONNE DÉDIÉE AU RELIQUAT ET REPORT DU DASHBOARD) */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs transition-colors">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Bordereau Centralisé des Compartiments avec Colonne du Reliquat</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Saisissez les montants dans les colonnes Début et Fin. La <strong>colonne du Reliquat</strong> calcule la différence nette et concorde à 00h00 avec le Dashboard.
              </p>
            </div>

            <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800">
              ★ Concordance Dashboard Active
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Paiement / Service</th>
                  <th className="py-3 px-4 text-right">1. Compartiment Début (FCFA) *</th>
                  <th className="py-3 px-4 text-right">2. Compartiment Fin (FCFA) *</th>
                  <th className="py-3 px-4 text-right text-amber-900 dark:text-amber-300 bg-amber-50/60 dark:bg-amber-950/30 border-x border-amber-200/70 dark:border-amber-800/50">
                    ★ Colonne Reliquat (Fin − Début)
                  </th>
                  <th className="py-3 px-4 text-right text-slate-500 dark:text-slate-400">
                    Reliquat Veille (à 00h00)
                  </th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {compartments.map((comp) => {
                  const start = comp.startOfDay || 0;
                  const end = comp.endOfDay || 0;
                  const net = end - start;
                  const badge = getCategoryBadge(comp.category);
                  const isLiquidites = comp.id === 'liquidites';
                  const yesterdayReliquat = getYesterdayCompartmentReliquat(comp.id);

                  return (
                    <tr 
                      key={comp.id} 
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                        isLiquidites ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : ''
                      }`}
                    >
                      {/* Nom & Service */}
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                        <div className="shrink-0">
                          {getOperatorIcon(comp.name, comp.category)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span>{comp.name}</span>
                            {comp.isCustom && (
                              <span className="text-[9px] text-slate-400 font-normal">(Perso)</span>
                            )}
                          </div>
                          <span className={`text-[9px] font-medium px-1.5 py-0.2 rounded border ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </div>
                      </td>

                      {/* Colonne 1 : Compartiment Début (Manuel) */}
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        <input
                          type="number"
                          inputMode="decimal"
                          pattern="[0-9]*"
                          step="any"
                          min="0"
                          value={start === 0 ? '' : start}
                          placeholder="0"
                          onChange={(e) => onUpdateCompartment(comp.id, 'startOfDay', parseNumber(e.target.value))}
                          className="w-32 text-right font-mono font-bold bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-emerald-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>

                      {/* Colonne 2 : Compartiment Fin (Manuel) */}
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        <input
                          type="number"
                          inputMode="decimal"
                          pattern="[0-9]*"
                          step="any"
                          min="0"
                          value={end === 0 ? '' : end}
                          placeholder="0"
                          onChange={(e) => onUpdateCompartment(comp.id, 'endOfDay', parseNumber(e.target.value))}
                          className="w-32 text-right font-mono font-bold bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-emerald-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>

                      {/* Colonne 3 : COLONNE DÉDIÉE AU RELIQUAT (Calcul automatique : Fin - Début) */}
                      <td className="py-3 px-4 text-right font-mono font-black tabular-nums bg-amber-50/50 dark:bg-amber-950/20 border-x border-amber-200/60 dark:border-amber-800/40">
                        {net > 0 ? (
                          <span className="inline-flex items-center gap-0.5 text-emerald-800 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-300 dark:border-emerald-800 font-extrabold text-xs">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            +{formatCurrency(net)}
                          </span>
                        ) : net < 0 ? (
                          <span className="inline-flex items-center gap-0.5 text-rose-800 dark:text-rose-300 bg-rose-100/80 dark:bg-rose-950/80 px-2.5 py-1 rounded-md border border-rose-300 dark:border-rose-800 font-extrabold text-xs">
                            <ArrowDownRight className="w-3.5 h-3.5" />
                            {formatCurrency(net)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md font-bold text-xs">
                            <Minus className="w-3 h-3" />
                            0 F CFA
                          </span>
                        )}
                      </td>

                      {/* Colonne 4 : Reliquat Veille Reporté à 00h00 */}
                      <td className="py-3 px-4 text-right font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                        {yesterdayReliquat !== null ? (
                          <span className={yesterdayReliquat > 0 ? 'text-amber-700 dark:text-amber-300 font-semibold' : ''}>
                            {yesterdayReliquat > 0 && '+'}{formatCurrency(yesterdayReliquat)}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isLiquidites && (
                            <button
                              onClick={onOpenCashCounter}
                              title="Comptage des billets et pièces"
                              className="p-1 rounded-md text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Coins className="w-4 h-4" />
                            </button>
                          )}
                          {comp.isCustom && (
                            <button
                              onClick={() => onDeleteCompartment(comp.id)}
                              title="Supprimer ce service personnalisé"
                              className="p-1 text-slate-400 hover:text-red-600 rounded-md transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* LIGNE DE TOTAUX CONSOLIDÉS DU TABLEAU */}
              <tfoot className="border-t-2 border-slate-300 dark:border-slate-700 font-bold bg-slate-100/80 dark:bg-slate-850">
                <tr>
                  <td className="py-3 px-4 uppercase text-[11px] font-black text-slate-900 dark:text-white">
                    TOTAL GÉNÉRAL :
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-900 dark:text-white text-sm tabular-nums font-black">
                    {formatCurrency(totalStart)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-900 dark:text-white text-sm tabular-nums font-black">
                    {formatCurrency(totalEnd)}
                  </td>
                  {/* TOTAL COLONNE RELIQUAT */}
                  <td className="py-3 px-4 text-right font-mono text-sm tabular-nums font-black bg-amber-100/80 dark:bg-amber-950/60 border-x border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200">
                    {totalNet > 0 && '+'}{formatCurrency(totalNet)}
                  </td>
                  {/* TOTAL RELIQUAT VEILLE REPORTÉ À 00H00 */}
                  <td className="py-3 px-4 text-right font-mono text-xs tabular-nums font-bold text-amber-800 dark:text-amber-400">
                    {previousDayReliquat > 0 && '+'}{formatCurrency(previousDayReliquat)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* 4. VUE GRILLE DE CARTES (3 COLONNES DÉDIÉES : DÉBUT, FIN & RELIQUAT) */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {compartments.map((comp) => {
            const start = comp.startOfDay || 0;
            const end = comp.endOfDay || 0;
            const net = end - start;
            const badge = getCategoryBadge(comp.category);
            const isLiquidites = comp.id === 'liquidites';
            const yesterdayReliquat = getYesterdayCompartmentReliquat(comp.id);

            return (
              <div
                key={comp.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-150 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                  isLiquidites 
                    ? 'border-emerald-300 dark:border-emerald-700/80 ring-1 ring-emerald-400/20' 
                    : 'border-slate-200/90 dark:border-slate-800'
                }`}
              >
                {/* En-tête de la case de paiement */}
                <div className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-850">
                  <div className="flex items-center gap-2.5">
                    <div className="shrink-0">
                      {getOperatorIcon(comp.name, comp.category)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                        {comp.name}
                        {comp.isCustom && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">(Perso)</span>
                        )}
                      </h3>
                      <span className={`text-[10px] font-medium px-2 py-0.2 rounded-md border ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {isLiquidites && (
                      <button
                        onClick={onOpenCashCounter}
                        title="Comptage des billets et pièces"
                        className="p-1 rounded-md text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Coins className="w-4 h-4" />
                      </button>
                    )}
                    {comp.isCustom && (
                      <button
                        onClick={() => onDeleteCompartment(comp.id)}
                        title="Supprimer ce service personnalisé"
                        className="p-1 text-slate-400 hover:text-red-600 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* LES 3 COLONNES DÉDIÉES : Début, Fin et Reliquat */}
                <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white dark:bg-slate-900">
                  
                  {/* Colonne 1 : Début de Journée (Manuel) */}
                  <div className="bg-slate-50/90 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700/80">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tight block mb-1">
                      1. Début (Manuel)
                    </span>
                    <input
                      type="number"
                      inputMode="decimal"
                      pattern="[0-9]*"
                      step="any"
                      min="0"
                      value={comp.startOfDay === 0 ? '' : comp.startOfDay}
                      placeholder="0"
                      onChange={(e) => onUpdateCompartment(comp.id, 'startOfDay', parseNumber(e.target.value))}
                      className="w-full text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-2 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 tabular-nums text-right"
                    />
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 text-right mt-1 font-mono truncate">
                      {formatCurrency(start, false)} F
                    </div>
                  </div>

                  {/* Colonne 2 : Fin de Journée (Manuel) */}
                  <div className="bg-slate-50/90 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700/80">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tight block mb-1">
                      2. Fin (Manuel)
                    </span>
                    <input
                      type="number"
                      inputMode="decimal"
                      pattern="[0-9]*"
                      step="any"
                      min="0"
                      value={comp.endOfDay === 0 ? '' : comp.endOfDay}
                      placeholder="0"
                      onChange={(e) => onUpdateCompartment(comp.id, 'endOfDay', parseNumber(e.target.value))}
                      className="w-full text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-2 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 tabular-nums text-right"
                    />
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 text-right mt-1 font-mono truncate">
                      {formatCurrency(end, false)} F
                    </div>
                  </div>

                  {/* Colonne 3 : Colonne Dédiée Reliquat (Automatique) */}
                  <div className="bg-amber-50/70 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800/60 flex flex-col justify-between">
                    <span className="text-[10px] font-extrabold text-amber-900 dark:text-amber-200 uppercase tracking-tight block">
                      3. Reliquat (Auto)
                    </span>
                    <div className="font-mono font-black text-xs tabular-nums text-right py-1">
                      {net > 0 ? (
                        <span className="text-emerald-700 dark:text-emerald-400">+{formatCurrency(net, false)} F</span>
                      ) : net < 0 ? (
                        <span className="text-rose-700 dark:text-rose-400">{formatCurrency(net, false)} F</span>
                      ) : (
                        <span className="text-slate-400">0 F</span>
                      )}
                    </div>
                    <div className="text-[9px] text-slate-400 dark:text-slate-500 text-right truncate">
                      {yesterdayReliquat !== null ? `Veille: ${formatCurrency(yesterdayReliquat, false)} F` : 'Différence nette'}
                    </div>
                  </div>

                </div>

                {/* Bandeau de bas de carte avec concordance Dashboard */}
                <div className="px-4 py-2 bg-slate-50/80 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">Reliquat du Compartiment :</span>
                  <div className="flex items-center gap-1 font-mono font-bold tabular-nums">
                    {net > 0 ? (
                      <span className="flex items-center gap-0.5 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        +{formatCurrency(net)}
                      </span>
                    ) : net < 0 ? (
                      <span className="flex items-center gap-0.5 text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800">
                        <ArrowDownRight className="w-3.5 h-3.5" />
                        {formatCurrency(net)}
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        <Minus className="w-3 h-3" />
                        0 F CFA
                      </span>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* 5. Synthèse consolidée de trésorerie globale */}
      <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-2xl p-5 shadow-sm border border-slate-800 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider block">
              Total Consolidé des Compartiments &amp; Reliquat
            </span>
            <div className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
              <span>Bilan Global de Trésorerie du Jour</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block font-medium uppercase">1. Total Début</span>
              <span className="text-base font-bold font-mono text-slate-100 tabular-nums">
                {formatCurrency(totalStart)}
              </span>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block font-medium uppercase">2. Total Fin</span>
              <span className="text-base font-bold font-mono text-slate-100 tabular-nums">
                {formatCurrency(totalEnd)}
              </span>
            </div>

            {/* Total Reliquat du Jour */}
            <div className={`p-3 rounded-xl border ${
              totalNet > 0 
                ? 'bg-emerald-950/60 border-emerald-600/50 text-emerald-300' 
                : totalNet < 0 
                ? 'bg-rose-950/60 border-rose-600/50 text-rose-300' 
                : 'bg-slate-800/80 border-slate-700/60 text-slate-200'
            }`}>
              <span className="text-[10px] opacity-80 block font-bold uppercase">★ Reliquat du Jour</span>
              <span className="text-base font-extrabold font-mono tabular-nums flex items-center gap-1">
                {totalNet > 0 && '+'}{formatCurrency(totalNet)}
              </span>
            </div>

            {/* Reliquat Veille Reporté à 00h00 */}
            <div className="p-3 rounded-xl border border-amber-500/40 bg-amber-950/40 text-amber-300">
              <span className="text-[10px] text-amber-400 block font-bold uppercase">Reliquat Veille (00h00)</span>
              <span className="text-base font-extrabold font-mono tabular-nums">
                {previousDayReliquat > 0 && '+'}{formatCurrency(previousDayReliquat)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal d'ajout d'un service personnalisé */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 transition-colors">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Ajouter un nouveau type de paiement
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Ajoutez un nouveau compte ou service qui bénéficiera des compartiments début / fin et de la colonne dédiée au reliquat automatique.
            </p>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Nom du service / paiement
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Free Money, Wizall, Wari, etc."
                  value={newCompName}
                  onChange={(e) => setNewCompName(e.target.value)}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Catégorie
                </label>
                <select
                  value={newCompCategory}
                  onChange={(e) => setNewCompCategory(e.target.value as any)}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="mobile_money">Mobile Money (Wave, OM, Free...)</option>
                  <option value="transfert_international">Transfert International (RIA, WU, MG...)</option>
                  <option value="telecom_uv">Télécom / UV Master / Seddo</option>
                  <option value="banque">Compte Bancaire</option>
                  <option value="especes">Espèces / Caisse</option>
                  <option value="autre">Autre Service</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-lg transition-colors shadow-xs"
                >
                  Ajouter le Compartiment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
