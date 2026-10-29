import React, { useState } from 'react';
import { DailyRecord, CompartmentEntry } from '../types/finance';
import { calculateDailyMetrics, formatCurrency, formatDateFr, parseNumber } from '../utils/financeCalculations';
import { DateSelector } from './DateSelector';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowLeftRight, 
  Users, 
  Wallet, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  Calendar,
  Printer,
  FileSpreadsheet,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  Minus,
  Clock,
  History,
  ShieldCheck,
  Scale,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Banknote
} from 'lucide-react';

interface DashboardViewProps {
  record: DailyRecord;
  previousRecord?: DailyRecord | null;
  currentDate: string;
  onDateChange: (date: string) => void;
  onUpdateCompartment?: (id: string, field: 'startOfDay' | 'endOfDay' | 'notes', value: any) => void;
  onPrint: () => void;
  onExportCSV: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  record,
  previousRecord,
  currentDate,
  onDateChange,
  onUpdateCompartment,
  onPrint,
  onExportCSV,
}) => {
  const [showPrevDetails, setShowPrevDetails] = useState(false);
  const metrics = calculateDailyMetrics(record, previousRecord);

  // Reliquat de la journée précédente reporté à 00h00
  const prevReliquat = metrics.previousDayReliquat;

  return (
    <div className="space-y-6">
      
      {/* 1. Sélecteur de date en tête du Dashboard */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Dashboard Centralisé — Calculs en Temps Réel</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tous les flux financiers (Compartiments, Transferts RIA/WU/MG, Partenaires Seddo, Caisse, Reliquat) sont interconnectés en direct.
          </p>
        </div>

        <div className="w-full sm:w-auto">
          <DateSelector currentDate={currentDate} onDateChange={onDateChange} />
        </div>
      </div>

      {/* 2. CARTE MAÎTRESSE : REPORT DU RELIQUAT DE LA JOURNÉE PRÉCÉDENTE (À 00H00) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 text-white p-5 rounded-2xl shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold uppercase tracking-wider">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Report Automatique à 00h00</span>
              </span>
              <span className="text-xs text-slate-400">
                {metrics.previousDayDate ? `(Veille du ${formatDateFr(metrics.previousDayDate, 'day-month')})` : '(Aucune journée antérieure)'}
              </span>
            </div>
            
            <h3 className="text-lg font-bold text-white flex flex-wrap items-center gap-2">
              <span>Reliquat Strict de la Journée Précédente :</span>
              <span className="font-mono text-2xl font-black text-amber-300 tabular-nums">
                {prevReliquat > 0 && '+'}{formatCurrency(prevReliquat)}
              </span>
            </h3>
            <p className="text-xs text-slate-300">
              Règle stricte appliquée : c’est <strong>seulement et uniquement le reliquat strict de la veille</strong> (Fins − Débuts) qui a été reporté à 00h00. Les soldes de fin de journées ne sont <strong>jamais</strong> reportés dans les compartiments.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {previousRecord && (
              <button
                onClick={() => setShowPrevDetails(!showPrevDetails)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                <span>Détail Veille</span>
                {showPrevDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}

            <div className="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-right">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Report Veille à 00h00</span>
              <span className="text-xs font-bold text-emerald-400 font-mono">
                {prevReliquat !== 0 ? (
                  <span>{prevReliquat > 0 && '+'}{formatCurrency(prevReliquat)}</span>
                ) : (
                  <span>0 F CFA</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Détail accordéon du reliquat de la veille */}
        {showPrevDetails && previousRecord && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3">
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/50">
              <span>Somme Débuts Veille : <strong className="text-white font-mono">{formatCurrency(metrics.previousDayTotalStart)}</strong></span>
              <span>Somme Fins Veille : <strong className="text-white font-mono">{formatCurrency(metrics.previousDayTotalEnd)}</strong></span>
              <span className="text-amber-300 font-bold">Reliquat Veille (Fins − Débuts) : <strong className="font-mono">{formatCurrency(metrics.previousDayReliquat)}</strong></span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs">
              {previousRecord.compartments.map(c => (
                <div key={c.id} className="bg-slate-800/50 p-2 rounded-lg border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block truncate">{c.name}</span>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>D: {formatCurrency(c.startOfDay, false)}</span>
                    <span className="text-white font-bold">F: {formatCurrency(c.endOfDay, false)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. CASE DU RELIQUAT JOURNALIER (EN VEDETTE CENTRALE) */}
      <div className="p-5 rounded-2xl border-2 border-amber-300 dark:border-amber-500/50 bg-gradient-to-br from-amber-50/90 via-white to-amber-100/50 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20 shadow-xs relative overflow-hidden transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-[11px] font-black uppercase tracking-wider shadow-2xs flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5" />
                <span>Case du Reliquat</span>
              </span>
              <span className="text-xs font-bold text-amber-900 dark:text-amber-300 bg-amber-200/60 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                Calcul en Temps Réel
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400 hidden md:inline">
                Différence entre la somme des fins et celle des débuts de journée
              </span>
            </div>

            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                Reliquat Journalier Consolidé
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Calcul automatique : <span className="font-semibold text-slate-800 dark:text-slate-200">Somme des Fins de Journée</span> moins <span className="font-semibold text-slate-800 dark:text-slate-200">Somme des Débuts de Journée</span>.
              </p>
            </div>

            {/* Formule interactive dynamique */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 pt-1">
              <div className="bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center gap-1.5">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Somme Fins :</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(metrics.totalEnd)}</span>
              </div>
              <span className="font-black text-slate-400 dark:text-slate-500 text-sm">−</span>
              <div className="bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center gap-1.5">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Somme Débuts :</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(metrics.totalStart)}</span>
              </div>
              <span className="font-black text-slate-400 dark:text-slate-500 text-sm">=</span>
              <div className="bg-amber-100/90 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-600/80 font-bold flex items-center gap-1.5">
                <span>Reliquat Net :</span>
                <span className="font-mono font-black">{metrics.reliquat > 0 && '+'}{formatCurrency(metrics.reliquat)}</span>
              </div>
            </div>
          </div>

          {/* Montant imposant du Reliquat + Règle de report à 00h00 */}
          <div className="flex flex-col items-start lg:items-end justify-center bg-white dark:bg-slate-800/90 p-4 sm:p-5 rounded-xl border border-amber-200/90 dark:border-amber-500/30 shadow-2xs min-w-[280px]">
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
                Reliquat Net du Jour
              </span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                metrics.reliquat > 0 ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' :
                metrics.reliquat < 0 ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300' :
                'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {metrics.reliquat > 0 ? 'Excédent (+)' : metrics.reliquat < 0 ? 'Déficit (-)' : 'Neutre'}
              </span>
            </div>

            <div className={`font-mono text-3xl sm:text-4xl font-black tabular-nums tracking-tight ${
              metrics.reliquat > 0 ? 'text-emerald-700 dark:text-emerald-400' : metrics.reliquat < 0 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-900 dark:text-white'
            }`}>
              {metrics.reliquat > 0 && '+'}{formatCurrency(metrics.reliquat)}
            </div>

            <div className="mt-3 w-full pt-2.5 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2 text-[11px] font-bold text-indigo-900 dark:text-indigo-300 bg-indigo-50/70 dark:bg-indigo-950/50 px-3 py-1.5 rounded-lg border border-indigo-200/60 dark:border-indigo-800/60">
              <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>C’est ce reliquat qui est reporté le jour suivant à 00h00</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. LES 4 GRANDS BLOCS DE SYNTHÈSE LIÉS EN TEMPS RÉEL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* BLOC 1 : Compartiments Début (Saisis manuellement, commence à zéro) */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>1. Total Début Saisi</span>
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black font-mono text-slate-900 dark:text-white tabular-nums">
            {formatCurrency(metrics.totalStart)}
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-1">
            Démarre à 0 F CFA · Rempli manuellement
          </span>
        </div>

        {/* BLOC 2 : Compartiments Fin (Saisis manuellement) */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>2. Total Fin Saisi</span>
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black font-mono text-slate-900 dark:text-white tabular-nums">
            {formatCurrency(metrics.totalEnd)}
          </div>
          <div className="flex items-center justify-between text-[11px] mt-1 font-semibold">
            <span className="text-slate-400 dark:text-slate-500">Reliquat Net :</span>
            <span className={`font-mono ${metrics.reliquat >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
              {metrics.reliquat > 0 && '+'}{formatCurrency(metrics.reliquat)}
            </span>
          </div>
        </div>

        {/* BLOC 3 : Retraits Opérateurs (Paiements effectués aux clients) */}
        <div className="bg-emerald-50/40 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-300 dark:border-emerald-800/80 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-emerald-900 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
            <span>3. Retraits Hors Taxe ({metrics.retraitsCount})</span>
            <div className="p-1.5 rounded-lg bg-emerald-200/70 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-300">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black font-mono text-emerald-950 dark:text-emerald-200 tabular-nums">
            {formatCurrency(metrics.totalRetraitsM2)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-emerald-800 dark:text-emerald-300 mt-1">
            <span>Avec Taxe : {formatCurrency(metrics.totalRetraitsM1)}</span>
            <span className="font-bold">Taxe : +{formatCurrency(metrics.totalRetraitsTax)}</span>
          </div>
        </div>

        {/* BLOC 4 : Envois Opérateurs (Uniquement montant avec taxe) */}
        <div className="bg-blue-50/40 dark:bg-blue-950/20 p-4 rounded-2xl border border-blue-300 dark:border-blue-800/80 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-blue-900 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">
            <span>4. Total Envois ({metrics.envoisCount})</span>
            <div className="p-1.5 rounded-lg bg-blue-200/70 dark:bg-blue-900/60 text-blue-900 dark:text-blue-300">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black font-mono text-blue-950 dark:text-blue-200 tabular-nums">
            {formatCurrency(metrics.totalEnvoisM1)}
          </div>
          <span className="text-[11px] text-blue-800 dark:text-blue-300 block mt-1">
            Montant avec taxe uniquement (encaissé)
          </span>
        </div>

      </div>

      {/* 4. CONTRÔLE DE RÉCONCILIATION DU TIROIR-CAISSE & CALCULS INTERCONNECTÉS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* VOLET A : CONTRÔLE DU TIROIR-CAISSE PHYSIQUE (LIQUIDITÉS) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Contrôle &amp; Réconciliation Caisse Espèces (Tiroir)
              </h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              Calcul en Direct
            </span>
          </div>

          {/* Formule de calcul en cascade */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs space-y-2">
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
              <span>Caisse Début de Journée (Espèces d'ouverture) :</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{formatCurrency(metrics.cashStart)}</span>
            </div>

            <div className="flex justify-between items-center text-blue-800 dark:text-blue-300">
              <span>(+) Envois transferts reçus en espèces :</span>
              <span className="font-mono font-bold">+{formatCurrency(metrics.totalEnvoisM1)}</span>
            </div>

            <div className="flex justify-between items-center text-emerald-800 dark:text-emerald-300">
              <span>(+) Ventes Seddo encaissées en espèces (Partenaires) :</span>
              <span className="font-mono font-bold">+{formatCurrency(metrics.totalSeddoPartnersAmount)}</span>
            </div>

            <div className="flex justify-between items-center text-rose-800 dark:text-rose-300">
              <span>(-) Retraits transferts payés aux clients (Sorties) :</span>
              <span className="font-mono font-bold">-{formatCurrency(metrics.totalRetraitsM1)}</span>
            </div>

            <div className="pt-2 border-t border-slate-300 dark:border-slate-700 flex justify-between items-center font-bold text-slate-900 dark:text-white text-sm">
              <span>(=) Caisse Espèces Théorique Attendue :</span>
              <span className="font-mono font-black text-indigo-700 dark:text-indigo-400">{formatCurrency(metrics.theoreticalCashDrawer)}</span>
            </div>
          </div>

          {/* Comparaison avec la caisse réelle saisie */}
          <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/30 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-950 dark:text-emerald-300 uppercase block">Caisse Espèces Réelle Fin Saisie :</span>
              <span className="font-mono font-black text-emerald-900 dark:text-emerald-200 text-lg tabular-nums">
                {formatCurrency(metrics.cashEnd)}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Écart de Caisse :</span>
              <span className={`font-mono font-extrabold text-sm tabular-nums ${
                metrics.cashDrawerDiscrepancy === 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-800 dark:text-amber-300'
              }`}>
                {metrics.cashDrawerDiscrepancy > 0 && '+'}{formatCurrency(metrics.cashDrawerDiscrepancy)}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {metrics.cashEnd === 0 ? (
              <span className="italic text-slate-400 dark:text-slate-500">Renseignez le compartiment Fin de Journée de Liquidités pour vérifier l'écart.</span>
            ) : metrics.cashDrawerDiscrepancy === 0 ? (
              <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Tiroir-caisse parfaitement équilibré (Zéro écart)
              </span>
            ) : (
              <span className="text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> Écart détecté entre la caisse physique et les flux enregistrés.
              </span>
            )}
          </div>
        </div>

        {/* VOLET B : SYNTHÈSE OPÉRATEURS & PARTENAIRES SEDDO */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Opérateurs (RIA, WU, MG) &amp; Partenaires Seddo
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
              Taxes Retraits: +{formatCurrency(metrics.totalRetraitsTax)}
            </span>
          </div>

          {/* Synthèse par opérateur */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            {(['Western Union', 'RIA', 'MoneyGram'] as const).map(op => {
              const stat = metrics.transfersByOp[op] || { 
                count: 0, 
                retraitsCount: 0, 
                envoisCount: 0, 
                retraitsM1: 0, 
                retraitsM2: 0, 
                retraitsTax: 0, 
                envoisM1: 0, 
                totalM1: 0 
              };

              const badgeColor = op === 'Western Union' ? 'bg-amber-300 text-amber-950' :
                                 op === 'RIA' ? 'bg-orange-600 text-white' :
                                 'bg-rose-600 text-white';

              return (
                <div key={op} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/50 space-y-1">
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${badgeColor} inline-block`}>
                    {op === 'Western Union' ? 'WU' : op === 'MoneyGram' ? 'MG' : 'RIA'}
                  </span>
                  <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{stat.count} tx</div>
                  <div className="text-[10px] text-emerald-800 dark:text-emerald-400">Retr: {formatCurrency(stat.retraitsM1)}</div>
                  <div className="text-[10px] text-blue-800 dark:text-blue-400">Env: {formatCurrency(stat.envoisM1)}</div>
                  <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                    Taxe: +{formatCurrency(stat.retraitsTax)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Synthèse Partenaires Libres Seddo */}
          <div className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/40 dark:bg-purple-950/30 text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-purple-950 dark:text-purple-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-purple-700 dark:text-purple-400" />
                <span>Partenaires Libres Seddo ({metrics.seddoPartnersCount} clients) :</span>
              </span>
              <span className="font-mono font-bold text-purple-900 dark:text-purple-200 text-sm">
                {formatCurrency(metrics.totalSeddoPartnersAmount)}
              </span>
            </div>
            
            <div className="flex justify-between text-[11px] text-purple-800 dark:text-purple-300">
              <span>Stock Seddo consommé (Début - Fin) : {formatCurrency(Math.max(0, -metrics.seddoNetDifference))}</span>
              <span className="font-semibold">
                {metrics.seddoGap === 0 ? 'Concordance totale' : `Écart : ${formatCurrency(metrics.seddoGap)}`}
              </span>
            </div>
          </div>

          {/* Bilan des flux de transferts */}
          <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Flux net transferts (Envois - Retraits) :</span>
            <span className={`font-mono font-bold tabular-nums ${metrics.transfersNetFlow >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
              {metrics.transfersNetFlow > 0 && '+'}{formatCurrency(metrics.transfersNetFlow)}
            </span>
          </div>

        </div>

      </div>

      {/* 5. TABLEAU CENTRAL DES COMPARTIMENTS DU JOUR (SAISIE & VISUALISATION DIRECTE) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs transition-colors">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/60">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Bordereau Central des Caisses &amp; Comptes — {formatDateFr(currentDate, 'full')}</span>
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Tout commence à 0 F CFA par défaut. Les valeurs saisies manuellement se répercutent en temps réel sur tous les calculs ci-dessus.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Exporter CSV</span>
            </button>
            <button
              onClick={onPrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Paiement / Service</th>
                <th className="py-3 px-4 text-right">Compartiment Début (FCFA)</th>
                <th className="py-3 px-4 text-right">Compartiment Fin (FCFA)</th>
                <th className="py-3 px-4 text-right">Différence Nette (Fin - Début)</th>
                <th className="py-3 px-4 text-center">Part du Total Fin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {record.compartments.map(comp => {
                const start = comp.startOfDay || 0;
                const end = comp.endOfDay || 0;
                const diff = end - start;
                const percent = metrics.totalEnd > 0 ? ((end / metrics.totalEnd) * 100).toFixed(1) : '0';

                return (
                  <tr key={comp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                      {comp.name}
                    </td>
                    
                    {/* Colonne Début modifiable directement si handler fourni */}
                    <td className="py-2.5 px-4 text-right font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                      {onUpdateCompartment ? (
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={start === 0 ? '' : start}
                          placeholder="0"
                          onChange={(e) => onUpdateCompartment(comp.id, 'startOfDay', parseNumber(e.target.value))}
                          className="w-32 text-right font-mono font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-emerald-500 rounded px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                        />
                      ) : (
                        formatCurrency(start)
                      )}
                    </td>

                    {/* Colonne Fin modifiable directement si handler fourni */}
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      {onUpdateCompartment ? (
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={end === 0 ? '' : end}
                          placeholder="0"
                          onChange={(e) => onUpdateCompartment(comp.id, 'endOfDay', parseNumber(e.target.value))}
                          className="w-32 text-right font-mono font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-emerald-500 rounded px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                        />
                      ) : (
                        formatCurrency(end)
                      )}
                    </td>

                    {/* Différence Nette automatique */}
                    <td className="py-2.5 px-4 text-right font-mono font-bold tabular-nums">
                      {diff > 0 ? (
                        <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                          +{formatCurrency(diff)}
                        </span>
                      ) : diff < 0 ? (
                        <span className="text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                          {formatCurrency(diff)}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">0 F CFA</span>
                      )}
                    </td>

                    <td className="py-2.5 px-4 text-center font-mono text-slate-500 dark:text-slate-400">
                      {percent}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-900 dark:bg-slate-950 text-white font-bold border-t border-slate-700">
              <tr>
                <td className="py-3.5 px-4 uppercase text-xs tracking-wider">
                  Total Consolidé de la Journée :
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-slate-300 text-sm tabular-nums">
                  {formatCurrency(metrics.totalStart)}
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-white text-sm tabular-nums">
                  {formatCurrency(metrics.totalEnd)}
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-emerald-400 text-sm tabular-nums">
                  {metrics.totalNetDifference > 0 && '+'}{formatCurrency(metrics.totalNetDifference)}
                </td>
                <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                  100%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </div>
  );
};
