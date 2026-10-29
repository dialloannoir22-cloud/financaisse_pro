import React, { useState } from 'react';
import { SeddoPartnerEntry, CompartmentEntry } from '../types/finance';
import { formatCurrency, parseNumber } from '../utils/financeCalculations';
import { 
  Users, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Smartphone, 
  Coins, 
  ArrowRight,
  TrendingDown,
  Receipt
} from 'lucide-react';
import { ReceiptData } from './ReceiptModal';

interface SeddoPartnersSectionProps {
  seddoPartners: SeddoPartnerEntry[];
  seddoCompartment?: CompartmentEntry;
  currentDate?: string;
  onAddPartner: (partner: Omit<SeddoPartnerEntry, 'id'>) => void;
  onDeletePartner: (id: string) => void;
  onUpdatePartner: (id: string, field: 'partnerName' | 'amount' | 'paymentMode', value: any) => void;
  onOpenReceipt?: (receipt: ReceiptData) => void;
}

export const SeddoPartnersSection: React.FC<SeddoPartnersSectionProps> = ({
  seddoPartners,
  seddoCompartment,
  currentDate = new Date().toISOString().split('T')[0],
  onAddPartner,
  onDeletePartner,
  onUpdatePartner,
  onOpenReceipt,
}) => {
  const [partnerName, setPartnerName] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [paymentMode, setPaymentMode] = useState<SeddoPartnerEntry['paymentMode']>('Espèces');
  const [noteInput, setNoteInput] = useState('');

  const getCurrentTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseNumber(amountInput);
    if (!partnerName.trim() || amount <= 0) return;

    onAddPartner({
      partnerName: partnerName.trim(),
      amount,
      paymentMode,
      time: getCurrentTime(),
      note: noteInput.trim() || undefined,
    });

    setPartnerName('');
    setAmountInput('');
    setNoteInput('');
  };

  // Somme totale des clients ayant payé le Seddo
  const totalSeddoPartners = seddoPartners.reduce((acc, p) => acc + (p.amount || 0), 0);

  // Analyse du stock Seddo du compartiment général
  const seddoStart = seddoCompartment?.startOfDay || 0;
  const seddoEnd = seddoCompartment?.endOfDay || 0;
  const seddoStockConsumed = Math.max(0, seddoStart - seddoEnd); // Consommation / ventes d'unités Seddo
  const reconciliationGap = totalSeddoPartners - seddoStockConsumed;

  return (
    <div className="space-y-6">
      
      {/* En-tête de la section Partenaire Libre */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Partenaire Libre — Ventes &amp; Règlements Seddo</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Enregistrez nominativement chaque client ou partenaire ayant payé le Seddo avec la somme correspondante pour le suivi des encaissements.
            </p>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-4 py-2.5 rounded-xl shrink-0">
            <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide block">
              Total Encaissé Partenaires Seddo
            </span>
            <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">
              {formatCurrency(totalSeddoPartners)}
            </span>
          </div>
        </div>

        {/* Tableau de contrôle & Rapprochement Stock Seddo vs Règlements */}
        <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span>Rapprochement avec le Compartiment Seddo :</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Déstockage Seddo Journalier (Début - Fin) :</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm tabular-nums">
                {formatCurrency(seddoStockConsumed)}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                (Solde Début: {formatCurrency(seddoStart)} | Fin: {formatCurrency(seddoEnd)})
              </span>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Somme Collectée Partenaires :</span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm tabular-nums">
                {formatCurrency(totalSeddoPartners)}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                ({seddoPartners.length} client{seddoPartners.length > 1 ? 's' : ''} enregistré{seddoPartners.length > 1 ? 's' : ''})
              </span>
            </div>

            <div className={`p-3 rounded-lg border ${
              reconciliationGap === 0 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
                : reconciliationGap > 0 
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300' 
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
            }`}>
              <span className="block text-[11px] font-semibold">Écart de Rapprochement :</span>
              <span className="font-mono font-extrabold text-sm tabular-nums block">
                {reconciliationGap > 0 && '+'}{formatCurrency(reconciliationGap)}
              </span>
              <span className="text-[10px] block mt-0.5">
                {reconciliationGap === 0
                  ? 'Équilibre parfait (100% encaissé)'
                  : reconciliationGap > 0
                  ? 'Surplus encaissé / Avance'
                  : 'Reste à recouvrer / Crédits en cours'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FORMULAIRE D'AJOUT RAPIDE D'UN PARTENAIRE */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-1.5">
          <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Ajouter un client ayant payé le Seddo</span>
        </h3>

        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          
          {/* Colonne 1: Nom du client / partenaire */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Nom de celui qui a payé le Seddo *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Boutique Diallo, Mamadou Sow, Aliou..."
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Colonne 2: Somme de chaque client */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Somme du Client (FCFA) *
            </label>
            <input
              type="number"
              inputMode="decimal"
              pattern="[0-9]*"
              step="any"
              min="1"
              required
              placeholder="Ex: 50 000"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="w-full text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono tabular-nums"
            />
          </div>

          {/* Mode de règlement */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Mode de paiement
            </label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as any)}
              className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="Espèces">Espèces (Cash)</option>
              <option value="Wave">Wave</option>
              <option value="Orange Money">Orange Money</option>
              <option value="Virement">Virement / Chèque</option>
              <option value="Autre">Autre</option>
            </select>
          </div>

          {/* Bouton de validation */}
          <div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Enregistrer Partenaire</span>
            </button>
          </div>

        </form>
      </div>

      {/* LISTE DES CLIENTS PARTENAIRES SEDDO (MOBILE & TABLEAU) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs transition-colors">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Liste des Partenaires &amp; Règlements Seddo ({seddoPartners.length})
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-lg">
            Total : {formatCurrency(totalSeddoPartners)}
          </span>
        </div>

        {/* 1. VUE MOBILE (CARTES TOUCH-FRIENDLY POUR SMARTPHONES) */}
        <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {seddoPartners.length === 0 ? (
            <div className="py-8 px-4 text-center text-slate-400 dark:text-slate-500 italic text-xs">
              Aucun partenaire enregistré pour aujourd'hui. Remplissez le formulaire ci-dessus pour ajouter ceux qui ont payé le Seddo.
            </div>
          ) : (
            seddoPartners.map((partner, index) => (
              <div key={partner.id} className="p-4 space-y-2.5 bg-white dark:bg-slate-900 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-400 dark:text-slate-500 font-bold">#{index + 1}</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {partner.paymentMode}
                  </span>
                  <span className="font-mono text-xs text-slate-400">{partner.time}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {partner.partnerName}
                  </span>
                  <span className="font-mono font-black text-sm text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {formatCurrency(partner.amount)}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-50 dark:border-slate-800/80">
                  {onOpenReceipt && (
                    <button
                      onClick={() => onOpenReceipt({
                        id: partner.id,
                        date: currentDate,
                        time: partner.time,
                        operator: 'Seddo Express',
                        type: 'seddo',
                        clientName: partner.partnerName,
                        m1: partner.amount,
                        paymentMode: partner.paymentMode,
                      })}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 rounded-xl"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Reçu Seddo</span>
                    </button>
                  )}

                  <button
                    onClick={() => onDeletePartner(partner.id)}
                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors"
                    title="Supprimer ce règlement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 2. VUE TABLEAU POUR ÉCRANS MOYENS ET GRANDS (TABLETTES & PC) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Nom de celui qui a payé (Partenaire)</th>
                <th className="py-3 px-4 text-right">Somme du Client (FCFA)</th>
                <th className="py-3 px-4">Mode de Paiement</th>
                <th className="py-3 px-4">Heure</th>
                <th className="py-3 px-4 text-center">Actions &amp; Reçu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {seddoPartners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-slate-500 italic">
                    Aucun partenaire libre enregistré pour aujourd'hui. Remplissez le formulaire ci-dessus pour ajouter ceux qui ont payé le Seddo.
                  </td>
                </tr>
              ) : (
                seddoPartners.map((partner, index) => (
                  <tr key={partner.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-slate-400 dark:text-slate-500">
                      {index + 1}
                    </td>
                    <td className="py-2.5 px-4">
                      <input
                        type="text"
                        value={partner.partnerName}
                        onChange={(e) => onUpdatePartner(partner.id, 'partnerName', e.target.value)}
                        className="font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 px-1 py-0.5 rounded focus:outline-hidden text-xs w-full max-w-xs"
                      />
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-extrabold text-slate-900 dark:text-white tabular-nums">
                      <input
                        type="number"
                        inputMode="decimal"
                        pattern="[0-9]*"
                        step="any"
                        value={partner.amount}
                        onChange={(e) => onUpdatePartner(partner.id, 'amount', parseNumber(e.target.value))}
                        className="text-right font-mono font-bold text-emerald-800 dark:text-emerald-400 bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 px-1 py-0.5 rounded focus:outline-hidden text-xs w-28"
                      />
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-1">F CFA</span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {partner.paymentMode}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-500 dark:text-slate-400">
                      {partner.time}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {onOpenReceipt && (
                          <button
                            onClick={() => onOpenReceipt({
                              id: partner.id,
                              date: currentDate,
                              time: partner.time,
                              operator: 'Seddo Express',
                              type: 'seddo',
                              clientName: partner.partnerName,
                              m1: partner.amount,
                              paymentMode: partner.paymentMode,
                            })}
                            title="Ouvrir le Reçu Client Seddo (Imprimer / Télécharger / WhatsApp)"
                            className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 rounded-md border border-purple-200/60 dark:border-purple-800/60 transition-colors"
                          >
                            <Receipt className="w-3 h-3" />
                            <span>Ticket</span>
                          </button>
                        )}
                        <button
                          onClick={() => onDeletePartner(partner.id)}
                          title="Supprimer ce règlement"
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
            {seddoPartners.length > 0 && (
              <tfoot className="bg-slate-50 dark:bg-slate-850 font-bold border-t-2 border-slate-300 dark:border-slate-700">
                <tr>
                  <td colSpan={2} className="py-3 px-4 text-right uppercase text-[10px] text-slate-600 dark:text-slate-300 tracking-wider">
                    Total Partenaires Libres ({seddoPartners.length} clients) :
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-700 dark:text-emerald-400 tabular-nums text-sm">
                    {formatCurrency(totalSeddoPartners)}
                  </td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

    </div>
  );
};
