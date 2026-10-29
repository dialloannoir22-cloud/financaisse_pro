import React from 'react';
import { DailyRecord } from '../types/finance';
import { calculateDailyMetrics, formatCurrency, formatDateFr } from '../utils/financeCalculations';

interface PrintableDailySheetProps {
  record: DailyRecord;
  previousRecord?: DailyRecord | null;
}

export const PrintableDailySheet: React.FC<PrintableDailySheetProps> = ({ record, previousRecord }) => {
  const metrics = calculateDailyMetrics(record, previousRecord);

  return (
    <div className="hidden print:block print-daily-sheet p-8 bg-white text-black font-sans text-xs">
      
      {/* En-tête du document officiel */}
      <div className="border-b-2 border-black pb-4 mb-4 flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wider">
            AnnoirFinancePro — Bordereau Journalier de Clôture de Caisse
          </h1>
          <p className="text-xs text-gray-600 mt-1">
            Agence Multiservices &amp; Transferts d'Argent (RIA, Western Union, MoneyGram, Wave, Orange Money, Seddo, Banques, Liquidités)
          </p>
          {previousRecord && (
            <p className="text-xs font-bold text-gray-800 mt-1">
              Report Reliquat Veille (à 00h00) : {metrics.previousDayReliquat > 0 ? `+${formatCurrency(metrics.previousDayReliquat)}` : formatCurrency(metrics.previousDayReliquat)}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="font-bold text-sm">{formatDateFr(record.date, 'full')}</p>
          <p className="text-[10px] text-gray-500">Date technique : {record.date}</p>
          <p className="text-[10px] text-gray-500">Imprimé le : {new Date().toLocaleString('fr-FR')}</p>
        </div>
      </div>

      {/* 1. TABLEAU DES COMPARTIMENTS (DEBUT & FIN DE JOURNEE) */}
      <div className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wider mb-2 border-b border-gray-400 pb-1">
          1. Situation des Caisses &amp; Comptes (Compartiment Début vs Fin de Journée)
        </h2>
        <table className="w-full border-collapse border border-black text-[11px]">
          <thead>
            <tr className="bg-gray-100 font-bold border-b border-black">
              <th className="p-1.5 border-r border-black text-left">Paiement / Service</th>
              <th className="p-1.5 border-r border-black text-right">Compartiment Début</th>
              <th className="p-1.5 border-r border-black text-right">Compartiment Fin</th>
              <th className="p-1.5 border-r border-black text-right font-black">Colonne Reliquat (Fin − Début)</th>
            </tr>
          </thead>
          <tbody>
            {record.compartments.map(c => {
              const diff = (c.endOfDay || 0) - (c.startOfDay || 0);
              return (
                <tr key={c.id} className="border-b border-gray-300">
                  <td className="p-1.5 border-r border-black font-semibold">{c.name}</td>
                  <td className="p-1.5 border-r border-black text-right font-mono">{formatCurrency(c.startOfDay)}</td>
                  <td className="p-1.5 border-r border-black text-right font-mono font-bold">{formatCurrency(c.endOfDay)}</td>
                  <td className="p-1.5 text-right font-mono font-black">
                    {diff > 0 ? `+${formatCurrency(diff)}` : formatCurrency(diff)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="font-bold bg-gray-200 border-t-2 border-black">
              <td className="p-1.5 border-r border-black uppercase">TOTAL GENERAL DES CAISSES</td>
              <td className="p-1.5 border-r border-black text-right font-mono">{formatCurrency(metrics.totalStart)}</td>
              <td className="p-1.5 border-r border-black text-right font-mono">{formatCurrency(metrics.totalEnd)}</td>
              <td className="p-1.5 text-right font-mono font-black">
                {metrics.reliquat > 0 ? `+${formatCurrency(metrics.reliquat)}` : formatCurrency(metrics.reliquat)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Encadré officiel du Reliquat */}
        <div className="mt-3 p-3 border-2 border-black bg-gray-50 flex justify-between items-center text-xs">
          <div>
            <span className="font-black uppercase tracking-wider block">RELIQUAT JOURNALIER (Différence Fins − Débuts) :</span>
            <span className="text-[10px] text-gray-600 block">
              Formule : Somme Fins ({formatCurrency(metrics.totalEnd)}) − Somme Débuts ({formatCurrency(metrics.totalStart)})
            </span>
            {metrics.previousDayReliquat !== 0 && (
              <span className="text-[10px] font-bold block text-gray-800 mt-0.5">
                * Report du Reliquat Strict de Veille à 00h00 : {metrics.previousDayReliquat > 0 ? `+${formatCurrency(metrics.previousDayReliquat)}` : formatCurrency(metrics.previousDayReliquat)} (Règle stricte : seul le reliquat est reporté, les soldes de compartiments ne sont jamais reportés).
              </span>
            )}
          </div>
          <div className="text-right">
            <span className="font-mono text-base font-black">
              {metrics.reliquat > 0 ? `+${formatCurrency(metrics.reliquat)}` : formatCurrency(metrics.reliquat)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. TRANSACTIONS OPERATEURS SÉPARÉES : RETRAITS & ENVOIS */}
      <div className="mb-6 space-y-4">
        
        {/* 2.A : RETRAITS (PAIEMENTS EFFECTUÉS AUX CLIENTS) */}
        <div>
          <div className="flex justify-between items-center mb-1.5 border-b border-gray-400 pb-1">
            <h2 className="text-xs font-bold uppercase tracking-wider">
              2.A. Retraits Opérateurs (Paiements effectués aux clients — Décaissements)
            </h2>
            <span className="font-bold text-[10px]">
              Total Hors Taxe Client : {formatCurrency(metrics.totalRetraitsM2)}
            </span>
          </div>

          {record.transfers.filter(t => t.type === 'retrait').length === 0 ? (
            <p className="text-gray-500 italic text-[10px]">Aucun retrait enregistré pour cette journée.</p>
          ) : (
            <table className="w-full border-collapse border border-black text-[10px]">
              <thead>
                <tr className="bg-gray-100 font-bold border-b border-black">
                  <th className="p-1 border-r border-black text-left">Heure</th>
                  <th className="p-1 border-r border-black text-left">Opérateur</th>
                  <th className="p-1 border-r border-black text-left">Bénéficiaire &amp; Réf</th>
                  <th className="p-1 border-r border-black text-right font-bold">Prix Hors Taxe (M2 - Net Client) *</th>
                  <th className="p-1 border-r border-black text-right">Montant Avec Taxe (M1)</th>
                  <th className="p-1 text-right">Taxe Retrait (M1 - M2)</th>
                </tr>
              </thead>
              <tbody>
                {record.transfers.filter(t => t.type === 'retrait').map(tx => (
                  <tr key={tx.id} className="border-b border-gray-300">
                    <td className="p-1 border-r border-black font-mono">{tx.time}</td>
                    <td className="p-1 border-r border-black font-semibold">{tx.operator}</td>
                    <td className="p-1 border-r border-black">{tx.clientName} {tx.referenceNumber ? `(${tx.referenceNumber})` : ''}</td>
                    <td className="p-1 border-r border-black text-right font-mono font-black">{formatCurrency(tx.m2)}</td>
                    <td className="p-1 border-r border-black text-right font-mono">{formatCurrency(tx.m1)}</td>
                    <td className="p-1 text-right font-mono font-bold text-gray-900">+{formatCurrency(tx.tax)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold bg-gray-200 border-t border-black">
                  <td colSpan={3} className="p-1 text-right border-r border-black uppercase">Total Retraits ({record.transfers.filter(t => t.type === 'retrait').length}) :</td>
                  <td className="p-1 text-right border-r border-black font-mono font-black">{formatCurrency(metrics.totalRetraitsM2)}</td>
                  <td className="p-1 text-right border-r border-black font-mono">{formatCurrency(metrics.totalRetraitsM1)}</td>
                  <td className="p-1 text-right font-mono font-bold">+{formatCurrency(metrics.totalRetraitsTax)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* 2.B : ENVOIS (TRANSFERTS ENCAISSÉS DES CLIENTS) */}
        <div>
          <div className="flex justify-between items-center mb-1.5 border-b border-gray-400 pb-1">
            <h2 className="text-xs font-bold uppercase tracking-wider">
              2.B. Envois Opérateurs (Transferts vers l'extérieur — Encaissements)
            </h2>
            <span className="font-bold text-[10px]">
              Total : {formatCurrency(metrics.totalEnvoisM1)}
            </span>
          </div>

          {record.transfers.filter(t => t.type === 'envoi').length === 0 ? (
            <p className="text-gray-500 italic text-[10px]">Aucun envoi enregistré pour cette journée.</p>
          ) : (
            <table className="w-full border-collapse border border-black text-[10px]">
              <thead>
                <tr className="bg-gray-100 font-bold border-b border-black">
                  <th className="p-1 border-r border-black text-left">Heure</th>
                  <th className="p-1 border-r border-black text-left">Opérateur</th>
                  <th className="p-1 border-r border-black text-left">Expéditeur &amp; Réf</th>
                  <th className="p-1 text-right">Montant Avec Taxe Uniquement (M1)</th>
                </tr>
              </thead>
              <tbody>
                {record.transfers.filter(t => t.type === 'envoi').map(tx => (
                  <tr key={tx.id} className="border-b border-gray-300">
                    <td className="p-1 border-r border-black font-mono">{tx.time}</td>
                    <td className="p-1 border-r border-black font-semibold">{tx.operator}</td>
                    <td className="p-1 border-r border-black">{tx.clientName} {tx.referenceNumber ? `(${tx.referenceNumber})` : ''}</td>
                    <td className="p-1 text-right font-mono font-bold">{formatCurrency(tx.m1)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold bg-gray-200 border-t border-black">
                  <td colSpan={3} className="p-1 text-right border-r border-black uppercase">Total Envois ({record.transfers.filter(t => t.type === 'envoi').length}) :</td>
                  <td className="p-1 text-right font-mono">{formatCurrency(metrics.totalEnvoisM1)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

      </div>

      {/* 3. PARTENAIRES LIBRES SEDDO */}
      <div className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wider mb-2 border-b border-gray-400 pb-1">
          3. Partenaires Libres — Ventes &amp; Règlements Seddo
        </h2>
        {record.seddoPartners.length === 0 ? (
          <p className="text-gray-500 italic text-[10px]">Aucun partenaire libre enregistré.</p>
        ) : (
          <table className="w-full border-collapse border border-black text-[10px]">
            <thead>
              <tr className="bg-gray-100 font-bold border-b border-black">
                <th className="p-1 border-r border-black text-left">#</th>
                <th className="p-1 border-r border-black text-left">Nom du Client / Partenaire</th>
                <th className="p-1 border-r border-black text-right">Somme Versée</th>
                <th className="p-1 border-r border-black text-left">Mode de Règlement</th>
                <th className="p-1 text-left">Heure</th>
              </tr>
            </thead>
            <tbody>
              {record.seddoPartners.map((p, i) => (
                <tr key={p.id} className="border-b border-gray-300">
                  <td className="p-1 border-r border-black">{i + 1}</td>
                  <td className="p-1 border-r border-black font-semibold">{p.partnerName}</td>
                  <td className="p-1 border-r border-black text-right font-mono font-bold">{formatCurrency(p.amount)}</td>
                  <td className="p-1 border-r border-black">{p.paymentMode}</td>
                  <td className="p-1">{p.time}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold bg-gray-200 border-t border-black">
                <td colSpan={2} className="p-1 text-right border-r border-black uppercase">Total Partenaires Seddo :</td>
                <td className="p-1 text-right font-mono border-r border-black">{formatCurrency(metrics.totalSeddoPartnersAmount)}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* 4. VISAS & SIGNATURES */}
      <div className="grid grid-cols-2 gap-8 pt-8 mt-8 border-t border-gray-300 text-center">
        <div>
          <p className="font-bold uppercase text-[11px] mb-12">Signature du Caissier / Opérateur</p>
          <div className="border-t border-black w-48 mx-auto"></div>
        </div>
        <div>
          <p className="font-bold uppercase text-[11px] mb-12">Visa du Gérant / Superviseur</p>
          <div className="border-t border-black w-48 mx-auto"></div>
        </div>
      </div>

    </div>
  );
};
