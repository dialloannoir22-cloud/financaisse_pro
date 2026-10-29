import React, { useState } from 'react';
import { 
  OperatorTransferTransaction, 
  InternationalOperator 
} from '../types/finance';
import { 
  formatCurrency, 
  parseNumber 
} from '../utils/financeCalculations';
import { 
  Plus, 
  Trash2, 
  ArrowLeftRight, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Calculator, 
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  Receipt,
  Printer
} from 'lucide-react';
import { ReceiptData } from './ReceiptModal';

interface TransferOperatorsSectionProps {
  transfers: OperatorTransferTransaction[];
  currentDate?: string;
  onAddTransfer: (tx: Omit<OperatorTransferTransaction, 'id' | 'tax'>) => void;
  onDeleteTransfer: (id: string) => void;
  onOpenReceipt?: (receipt: ReceiptData) => void;
}

export const TransferOperatorsSection: React.FC<TransferOperatorsSectionProps> = ({
  transfers,
  currentDate = new Date().toISOString().split('T')[0],
  onAddTransfer,
  onDeleteTransfer,
  onOpenReceipt,
}) => {
  // État du formulaire de saisie rapide
  const [selectedOperator, setSelectedOperator] = useState<InternationalOperator>('Western Union');
  const [operationType, setOperationType] = useState<'retrait' | 'envoi'>('retrait');
  const [m1Input, setM1Input] = useState<string>('');
  const [m2Input, setM2Input] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [filterOperator, setFilterOperator] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // Heure actuelle format HH:mm
  const getCurrentTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  const [timeInput, setTimeInput] = useState<string>(getCurrentTime());

  // Calcul automatique de la taxe en temps réel pendant la saisie (pour les retraits)
  const numM1 = parseNumber(m1Input);
  const numM2 = parseNumber(m2Input);
  const calculatedTax = operationType === 'retrait' ? Math.max(0, numM1 - numM2) : 0;

  const handleProcessSubmit = (openReceiptAfter: boolean = false) => {
    if (numM1 <= 0) return;

    const txTime = timeInput || getCurrentTime();
    const client = clientName.trim() || 'Client Guichet';
    const ref = referenceNumber.trim() || undefined;

    if (operationType === 'retrait') {
      const finalM2 = numM2 > 0 ? numM2 : numM1;
      const finalTax = Math.max(0, numM1 - finalM2);
      
      onAddTransfer({
        operator: selectedOperator,
        type: 'retrait',
        m1: numM1,
        m2: finalM2,
        clientName: client,
        referenceNumber: ref,
        time: txTime,
      });

      if (openReceiptAfter && onOpenReceipt) {
        onOpenReceipt({
          id: `TX-${Date.now().toString().slice(-6)}`,
          date: currentDate,
          time: txTime,
          operator: selectedOperator,
          type: 'retrait',
          clientName: client,
          referenceNumber: ref,
          m1: numM1,
          m2: finalM2,
          tax: finalTax,
        });
      }
    } else {
      // Pour l'envoi : SEULEMENT le montant avec taxe (M1), hors taxe supprimé
      onAddTransfer({
        operator: selectedOperator,
        type: 'envoi',
        m1: numM1,
        clientName: client,
        referenceNumber: ref,
        time: txTime,
      });

      if (openReceiptAfter && onOpenReceipt) {
        onOpenReceipt({
          id: `TX-${Date.now().toString().slice(-6)}`,
          date: currentDate,
          time: txTime,
          operator: selectedOperator,
          type: 'envoi',
          clientName: client,
          referenceNumber: ref,
          m1: numM1,
        });
      }
    }

    // Réinitialiser les montants pour la saisie suivante tout en gardant l'opérateur
    setM1Input('');
    setM2Input('');
    setClientName('');
    setReferenceNumber('');
    setTimeInput(getCurrentTime());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleProcessSubmit(false);
  };

  // CALCULS SÉPARÉS DES RETRAITS ET DES ENVOIS
  const retraitsList = transfers.filter(t => t.type === 'retrait');
  const envoisList = transfers.filter(t => t.type === 'envoi');

  // Totaux Retraits
  const totalRetraitsM1 = retraitsList.reduce((acc, t) => acc + (t.m1 || 0), 0);
  const totalRetraitsM2 = retraitsList.reduce((acc, t) => acc + (t.m2 || 0), 0);
  const totalRetraitsTax = retraitsList.reduce((acc, t) => acc + (t.tax || 0), 0);

  // Totaux Envois (M1 avec taxe uniquement)
  const totalEnvoisM1 = envoisList.reduce((acc, t) => acc + (t.m1 || 0), 0);

  // Solde net de transfert (Envois reçus - Retraits décaissés)
  const netTransfersCashFlow = totalEnvoisM1 - totalRetraitsM1;

  // Filtrage pour le tableau
  const filteredTransfers = transfers.filter(t => {
    if (filterOperator !== 'all' && t.operator !== filterOperator) return false;
    if (filterType !== 'all' && t.type !== filterType) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* BANDEAU SUPÉRIEUR AVEC CALCUL SÉPARÉ DES RETRAITS ET ENVOIS */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Opérateurs de Transfert d'Argent (RIA, Western Union, MoneyGram)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Les totaux des <strong>Retraits</strong> et des <strong>Envois</strong> sont calculés séparément. 
              Pour les envois, seule la colonne <span className="font-semibold text-slate-700 dark:text-slate-300">Montant avec Taxe</span> est utilisée.
            </p>
          </div>
        </div>

        {/* 2 GRANDES CARTES SÉPARÉES : TOTAL RETRAITS & TOTAL ENVOIS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          
          {/* CARTE 1 : TOTAL RETRAITS (Paiements effectués aux clients) */}
          <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-2xs flex flex-col justify-between transition-colors">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-extrabold text-xs text-emerald-950 dark:text-emerald-300 bg-emerald-200/80 dark:bg-emerald-900/60 px-2.5 py-1 rounded-md">
                  <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-800 dark:text-emerald-300" />
                  <span>TOTAL PAIEMENTS RETRAITS ({retraitsList.length})</span>
                </span>
                <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                  Décaissements
                </span>
              </div>

              <div className="mt-3">
                <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-extrabold block uppercase tracking-tight">
                  Prix Principal Hors Taxe (M2 - Reçu par les Clients)
                </span>
                <span className="text-2xl font-black font-mono text-emerald-950 dark:text-emerald-200 tabular-nums">
                  {formatCurrency(totalRetraitsM2)}
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium block">
                  Montant net total déboursé et remis aux bénéficiaires
                </span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-emerald-200/80 dark:border-emerald-800/60 text-xs space-y-1">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Total Avec Taxe (M1) :</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100 tabular-nums">{formatCurrency(totalRetraitsM1)}</span>
              </div>
              <div className="flex justify-between text-emerald-900 dark:text-emerald-300 font-bold">
                <span>Taxe Retraits (M1 - M2) :</span>
                <span className="font-mono tabular-nums">+{formatCurrency(totalRetraitsTax)}</span>
              </div>
            </div>
          </div>

          {/* CARTE 2 : TOTAL ENVOIS (Transferts reçus / Encaissés des clients) */}
          <div className="p-4 rounded-xl border border-blue-300 dark:border-blue-800/80 bg-blue-50/50 dark:bg-blue-950/20 shadow-2xs flex flex-col justify-between transition-colors">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-extrabold text-xs text-blue-950 dark:text-blue-300 bg-blue-200/80 dark:bg-blue-900/60 px-2.5 py-1 rounded-md">
                  <ArrowUpRight className="w-3.5 h-3.5 text-blue-800 dark:text-blue-300" />
                  <span>TOTAL PAIEMENTS ENVOIS ({envoisList.length})</span>
                </span>
                <span className="text-[11px] font-semibold text-blue-800 dark:text-blue-300">
                  Encaissements
                </span>
              </div>

              <div className="mt-3">
                <span className="text-[11px] text-blue-800 dark:text-blue-300 font-medium block">Total Avec Taxe Uniquement (M1)</span>
                <span className="text-xl font-black font-mono text-blue-950 dark:text-blue-200 tabular-nums">
                  {formatCurrency(totalEnvoisM1)}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-blue-200/80 dark:border-blue-800/60 text-xs">
              <div className="text-[11px] text-blue-900 dark:text-blue-300 font-medium">
                Colonne Hors Taxe supprimée sur les envois. Montant net collecté en caisse.
              </div>
            </div>
          </div>

          {/* CARTE 3 : FLUX NET DE CAISSE DES TRANSFERTS */}
          <div className={`p-4 rounded-xl border shadow-2xs flex flex-col justify-between transition-colors ${
            netTransfersCashFlow > 0 
              ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/30 dark:bg-emerald-950/20' 
              : netTransfersCashFlow < 0 
              ? 'border-amber-300 dark:border-amber-800/80 bg-amber-50/30 dark:bg-amber-950/20' 
              : 'border-slate-300 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/60'
          }`}>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Flux Net de Caisse Transferts
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">Envois - Retraits</span>
              </div>

              <div className="mt-3">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Impact net sur le tiroir-caisse</span>
                <span className={`text-xl font-black font-mono tabular-nums ${
                  netTransfersCashFlow > 0 ? 'text-emerald-700 dark:text-emerald-400' : netTransfersCashFlow < 0 ? 'text-amber-800 dark:text-amber-300' : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {netTransfersCashFlow > 0 && '+'}{formatCurrency(netTransfersCashFlow)}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
              {netTransfersCashFlow > 0 
                ? 'Les envois dépassent les retraits (Entrée nette d’espèces)' 
                : netTransfersCashFlow < 0 
                ? 'Les retraits dépassent les envois (Sortie nette d’espèces)' 
                : 'Équilibre parfait entre envois et retraits'}
            </div>
          </div>

        </div>
      </div>

      {/* FORMULAIRE DE SAISIE RAPIDE AU GUICHET */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Saisie Rapide Transaction Guichet</span>
          </span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {operationType === 'retrait' 
              ? 'Mode Retrait : Saisir Montant Avec Taxe (M1) et Hors Taxe (M2)' 
              : 'Mode Envoi : Saisir uniquement le Montant Avec Taxe (M1)'}
          </span>
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Sélection rapide de l'opérateur */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              1. Sélectionner l'opérateur :
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              
              <button
                type="button"
                onClick={() => setSelectedOperator('Western Union')}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                  selectedOperator === 'Western Union'
                    ? 'bg-amber-300 text-amber-950 border-amber-400 shadow-xs ring-2 ring-amber-400/30'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                }`}
              >
                <span>Western Union</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOperator('RIA')}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                  selectedOperator === 'RIA'
                    ? 'bg-orange-600 text-white border-orange-700 shadow-xs ring-2 ring-orange-500/30'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                }`}
              >
                <span>RIA</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOperator('MoneyGram')}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                  selectedOperator === 'MoneyGram'
                    ? 'bg-rose-600 text-white border-rose-700 shadow-xs ring-2 ring-rose-500/30'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                }`}
              >
                <span>MoneyGram</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOperator('Autre')}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                  selectedOperator === 'Autre'
                    ? 'bg-slate-800 text-white border-slate-900 shadow-xs ring-2 ring-slate-800/30'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                }`}
              >
                <span>Autre Opérateur</span>
              </button>

            </div>
          </div>

          {/* Type d'opération (Retrait ou Envoi) */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">2. Type d'opération :</span>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setOperationType('retrait')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5 ${
                  operationType === 'retrait'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>Retrait (Pay-Out avec M1 et M2)</span>
              </button>
              <button
                type="button"
                onClick={() => setOperationType('envoi')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5 ${
                  operationType === 'envoi'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Envoi (Pay-In - Avec taxe uniquement)</span>
              </button>
            </div>
          </div>

          {/* GRILLE DES CHAMPS DYNAMIQUES SELON RETRAIT OU ENVOI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            
            {/* Si RETRAIT : Le Prix Hors Taxe (M2) est LE PRIX PRINCIPAL perçu par le client */}
            {operationType === 'retrait' ? (
              <div className="bg-emerald-50/90 dark:bg-emerald-950/40 p-2.5 rounded-xl border-2 border-emerald-400 dark:border-emerald-600">
                <label className="text-[11px] font-black text-emerald-950 dark:text-emerald-200 block mb-1">
                  1. Prix Hors Taxe (M2) — Principal Client *
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  step="any"
                  min="0"
                  required
                  value={m2Input}
                  onChange={(e) => setM2Input(e.target.value)}
                  placeholder="Ex: 100 000"
                  className="w-full text-sm font-bold bg-white dark:bg-slate-850 border border-emerald-300 dark:border-emerald-700 rounded-lg px-2.5 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono tabular-nums"
                />
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold mt-1 block">
                  ★ C'est ce prix-là que le client reçoit
                </span>
              </div>
            ) : null}

            {/* Colonne Montant avec taxe (M1) */}
            <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {operationType === 'retrait' 
                  ? '2. Montant Avec Taxe (M1) *' 
                  : 'Montant Avec Taxe de l’Envoi (M1) *'}
              </label>
              <input
                type="number"
                inputMode="decimal"
                pattern="[0-9]*"
                step="any"
                min="1"
                required
                value={m1Input}
                onChange={(e) => setM1Input(e.target.value)}
                placeholder={operationType === 'retrait' ? "Ex: 105 000" : "Ex: 50 000"}
                className="w-full text-sm font-bold bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono tabular-nums"
              />
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                {operationType === 'retrait' ? 'Montant brut comptabilisé (TTC)' : 'Montant total encaissé du client'}
              </span>
            </div>

            {/* Taxe calculée automatiquement pour les retraits */}
            {operationType === 'retrait' && (
              <div className="bg-emerald-50/80 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 flex flex-col justify-between">
                <label className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 block">
                  Taxe Retrait (M1 - M2)
                </label>
                <div className="text-base font-extrabold text-emerald-800 dark:text-emerald-300 font-mono tabular-nums py-1">
                  {formatCurrency(calculatedTax)}
                </div>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400">Calcul automatique</span>
              </div>
            )}

            {/* Nom du Client */}
            <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Nom du Client
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ex: Amadou Diallo"
                className="w-full text-sm bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">Bénéficiaire / Émetteur</span>
            </div>

            {/* Référence / Code MTCN */}
            <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Code MTCN / Référence
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Ex: WU-92841"
                className="w-full text-sm bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">Optionnel</span>
            </div>

          </div>

          {/* Boutons d'enregistrement : Simple et avec Reçu direct */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleProcessSubmit(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-300 dark:border-slate-700 transition-colors shadow-2xs"
              title="Valider et ouvrir immédiatement le ticket de caisse à imprimer ou partager"
            >
              <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Valider &amp; Ouvrir Reçu</span>
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Valider {operationType === 'retrait' ? 'le Retrait' : 'l’Envoi'}</span>
            </button>
          </div>

        </form>
      </div>

      {/* TABLEAU DES OPÉRATIONS DU JOUR AVEC TOTAUX SÉPARÉS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs transition-colors">
        
        {/* Barre de filtrage du tableau */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-850">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Journal des Opérations ({filteredTransfers.length})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            
            {/* Filtre type */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="all">Tous (Retraits &amp; Envois)</option>
              <option value="retrait">Retraits uniquement ({retraitsList.length})</option>
              <option value="envoi">Envois uniquement ({envoisList.length})</option>
            </select>

            {/* Filtre opérateur */}
            <select
              value={filterOperator}
              onChange={(e) => setFilterOperator(e.target.value)}
              className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="all">Tous les opérateurs</option>
              <option value="Western Union">Western Union</option>
              <option value="RIA">RIA</option>
              <option value="MoneyGram">MoneyGram</option>
            </select>
          </div>
        </div>

        {/* 1. LISTE DE CARTES SUR TÉLÉPHONE MOBILE (Expérience Smartphone Native - sans défilement horizontal pénible) */}
        <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredTransfers.length === 0 ? (
            <div className="py-8 px-4 text-center text-slate-400 dark:text-slate-500 italic text-xs">
              Aucune opération enregistrée pour aujourd'hui. Utilisez le formulaire ci-dessus pour ajouter des retraits ou envois.
            </div>
          ) : (
            filteredTransfers.map((tx) => (
              <div key={tx.id} className="p-4 space-y-3 bg-white dark:bg-slate-900 transition-colors">
                {/* Ligne 1 : Opérateur, Sens, Heure */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {tx.operator === 'Western Union' ? (
                      <span className="font-bold text-[10px] text-amber-950 bg-amber-300 dark:bg-amber-400 px-2 py-0.5 rounded">WU</span>
                    ) : tx.operator === 'RIA' ? (
                      <span className="font-bold text-[10px] text-white bg-orange-600 px-2 py-0.5 rounded">RIA</span>
                    ) : tx.operator === 'MoneyGram' ? (
                      <span className="font-bold text-[10px] text-white bg-rose-600 px-2 py-0.5 rounded">MG</span>
                    ) : (
                      <span className="font-bold text-[10px] text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">{tx.operator}</span>
                    )}
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{tx.operator}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {tx.type === 'retrait' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                        <ArrowDownLeft className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                        Retrait
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-800 dark:text-blue-300 bg-blue-100/80 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                        <ArrowUpRight className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                        Envoi
                      </span>
                    )}
                    <span className="font-mono text-xs text-slate-400 dark:text-slate-500">{tx.time}</span>
                  </div>
                </div>

                {/* Ligne 2 : Client & Code Référence */}
                <div className="flex items-center justify-between text-xs">
                  <div className="font-bold text-slate-800 dark:text-slate-100 truncate pr-2">
                    {tx.clientName}
                  </div>
                  {tx.referenceNumber && (
                    <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400 shrink-0">
                      {tx.referenceNumber}
                    </span>
                  )}
                </div>

                {/* Ligne 3 : Bloc Montants avec Priorité au Prix Hors Taxe */}
                {tx.type === 'retrait' ? (
                  <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-300 block">
                        Prix Hors Taxe (Reçu Client) :
                      </span>
                      <span className="text-lg font-black font-mono text-emerald-950 dark:text-emerald-200 tabular-nums">
                        {formatCurrency(tx.m2)}
                      </span>
                    </div>

                    <div className="text-right text-[11px] space-y-0.5">
                      <div className="text-slate-500 dark:text-slate-400">
                        Total TTC: <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(tx.m1)}</span>
                      </div>
                      <div className="text-emerald-700 dark:text-emerald-400 font-bold">
                        Taxe: <span className="font-mono">+{formatCurrency(tx.tax || 0)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-blue-800 dark:text-blue-300 block">
                        Montant Total Encaissé (M1) :
                      </span>
                      <span className="text-lg font-black font-mono text-blue-950 dark:text-blue-200 tabular-nums">
                        {formatCurrency(tx.m1)}
                      </span>
                    </div>
                    <span className="text-[10px] text-blue-700 dark:text-blue-400 font-medium">
                      Encaissement caisse
                    </span>
                  </div>
                )}

                {/* Ligne 4 : Boutons d'action adaptés aux pouces (touch targets) */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  {onOpenReceipt && (
                    <button
                      onClick={() => onOpenReceipt({
                        id: tx.id,
                        date: currentDate,
                        time: tx.time,
                        operator: tx.operator,
                        type: tx.type,
                        clientName: tx.clientName,
                        referenceNumber: tx.referenceNumber,
                        m1: tx.m1,
                        m2: tx.m2,
                        tax: tx.tax,
                      })}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300/80 dark:border-emerald-700 rounded-xl active:bg-emerald-100"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Reçu / Ticket Client</span>
                    </button>
                  )}

                  <button
                    onClick={() => onDeleteTransfer(tx.id)}
                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors"
                    title="Supprimer la transaction"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 2. TABLEAU POUR ÉCRANS MOYENS ET GRANDS (TABLETTE & PC) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Heure</th>
                <th className="py-3 px-4">Opérateur</th>
                <th className="py-3 px-4">Sens</th>
                <th className="py-3 px-4">Client / Référence</th>
                <th className="py-3 px-4 text-right text-emerald-800 dark:text-emerald-300">Prix Hors Taxe (M2 - Net Client) *</th>
                <th className="py-3 px-4 text-right">Montant Avec Taxe (M1)</th>
                <th className="py-3 px-4 text-right text-emerald-800 dark:text-emerald-400">Taxe Retrait</th>
                <th className="py-3 px-4 text-center">Actions &amp; Reçu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 dark:text-slate-500 italic">
                    Aucune opération de transfert enregistrée pour cette journée. Utilisez le formulaire ci-dessus pour ajouter vos retraits et envois RIA, Western Union ou MoneyGram.
                  </td>
                </tr>
              ) : (
                filteredTransfers.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {tx.time}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      {tx.operator === 'Western Union' ? (
                        <span className="font-bold text-[10px] text-amber-950 bg-amber-300 dark:bg-amber-400 dark:text-slate-950 px-2 py-0.5 rounded">WU</span>
                      ) : tx.operator === 'RIA' ? (
                        <span className="font-bold text-[10px] text-white bg-orange-600 px-2 py-0.5 rounded">RIA</span>
                      ) : tx.operator === 'MoneyGram' ? (
                        <span className="font-bold text-[10px] text-white bg-rose-600 px-2 py-0.5 rounded">MG</span>
                      ) : (
                        <span className="font-bold text-[10px] text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">{tx.operator}</span>
                      )}
                      <span className="ml-2 font-medium text-slate-800 dark:text-slate-200">{tx.operator}</span>
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      {tx.type === 'retrait' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
                          <ArrowDownLeft className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                          Retrait
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-800 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-950/50 px-2 py-0.5 rounded-md">
                          <ArrowUpRight className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                          Envoi
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{tx.clientName}</div>
                      {tx.referenceNumber && (
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{tx.referenceNumber}</div>
                      )}
                    </td>
                    {/* Colonne 1 : Prix Hors Taxe (M2 - Principal reçu par le client) */}
                    <td className="py-2.5 px-4 text-right font-mono font-extrabold text-slate-900 dark:text-white tabular-nums">
                      {tx.type === 'retrait' ? (
                        <span className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60">
                          {formatCurrency(tx.m2)}
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600 font-sans text-xs" title="Hors taxe non applicable pour les envois">
                          —
                        </span>
                      )}
                    </td>
                    {/* Colonne 2 : Montant Avec Taxe (M1) */}
                    <td className="py-2.5 px-4 text-right font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                      {formatCurrency(tx.m1)}
                    </td>
                    {/* Colonne 3 : Taxe Retrait */}
                    <td className="py-2.5 px-4 text-right font-mono font-bold tabular-nums">
                      {tx.type === 'retrait' && (tx.tax || 0) > 0 ? (
                        <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                          +{formatCurrency(tx.tax)}
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600 font-sans text-xs">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {onOpenReceipt && (
                          <button
                            onClick={() => onOpenReceipt({
                              id: tx.id,
                              date: currentDate,
                              time: tx.time,
                              operator: tx.operator,
                              type: tx.type,
                              clientName: tx.clientName,
                              referenceNumber: tx.referenceNumber,
                              m1: tx.m1,
                              m2: tx.m2,
                              tax: tx.tax,
                            })}
                            title="Ouvrir le Ticket / Reçu client (Imprimer / Télécharger / Partager)"
                            className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-md border border-emerald-200/60 dark:border-emerald-800/60 transition-colors"
                          >
                            <Receipt className="w-3 h-3" />
                            <span>Ticket</span>
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteTransfer(tx.id)}
                          title="Supprimer la transaction"
                          className="p-1 text-slate-400 hover:text-red-600 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            
            {/* LIGNES DE TOTAUX SÉPARÉS DANS LE PIED DE TABLEAU */}
            {filteredTransfers.length > 0 && (
              <tfoot className="border-t-2 border-slate-300 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-800">
                
                {/* LIGNE 1 : SOUS-TOTAL RETRAITS */}
                <tr className="bg-emerald-50/70 dark:bg-emerald-950/40 font-bold">
                  <td colSpan={4} className="py-2.5 px-4 text-right uppercase text-[10px] text-emerald-900 dark:text-emerald-300 tracking-wider">
                    Total Paiements Retraits ({filteredTransfers.filter(t => t.type === 'retrait').length}) :
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-emerald-950 dark:text-emerald-200 tabular-nums font-black">
                    {formatCurrency(filteredTransfers.filter(t => t.type === 'retrait').reduce((a, b) => a + (b.m2 || 0), 0))}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                    {formatCurrency(filteredTransfers.filter(t => t.type === 'retrait').reduce((a, b) => a + (b.m1 || 0), 0))}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-emerald-800 dark:text-emerald-400 tabular-nums font-extrabold">
                    +{formatCurrency(filteredTransfers.filter(t => t.type === 'retrait').reduce((a, b) => a + (b.tax || 0), 0))}
                  </td>
                  <td></td>
                </tr>

                {/* LIGNE 2 : SOUS-TOTAL ENVOIS (COLONNES CORRIGÉES ET ALIGNÉES) */}
                <tr className="bg-blue-50/70 dark:bg-blue-950/40 font-bold">
                  <td colSpan={4} className="py-2.5 px-4 text-right uppercase text-[10px] text-blue-900 dark:text-blue-300 tracking-wider">
                    Total Paiements Envois ({filteredTransfers.filter(t => t.type === 'envoi').length}) :
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-400 dark:text-slate-500 tabular-nums italic text-[11px]">
                    —
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-blue-950 dark:text-blue-200 tabular-nums font-extrabold">
                    {formatCurrency(filteredTransfers.filter(t => t.type === 'envoi').reduce((a, b) => a + (b.m1 || 0), 0))}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-400 dark:text-slate-500 tabular-nums">
                    —
                  </td>
                  <td></td>
                </tr>

              </tfoot>
            )}
          </table>
        </div>

      </div>

    </div>
  );
};
