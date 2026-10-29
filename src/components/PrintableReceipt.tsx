import React from 'react';
import { ReceiptData } from './ReceiptModal';
import { formatCurrency, formatDateFr } from '../utils/financeCalculations';

interface PrintableReceiptProps {
  receipt: ReceiptData | null;
}

export const PrintableReceipt: React.FC<PrintableReceiptProps> = ({ receipt }) => {
  if (!receipt) return null;

  const isRetrait = receipt.type === 'retrait';
  const isEnvoi = receipt.type === 'envoi';

  const typeLabel = isRetrait 
    ? 'RETRAIT D\'ESPÈCES (DÉCAISSEMENT)' 
    : isEnvoi 
    ? 'ENVOI DE FONDS (ENCAISSEMENT)' 
    : 'RÈGLEMENT PARTENAIRE SEDDO';

  return (
    <div className="hidden print-receipt-only p-4 bg-white text-black font-mono text-[11px] leading-tight max-w-[80mm] mx-auto">
      {/* En-tête thermique */}
      <div className="text-center pb-2 border-b border-dashed border-black">
        <h1 className="text-sm font-black uppercase tracking-wider">
          AnnoirFinancePro
        </h1>
        <p className="text-[9px]">Transferts &amp; Services Multiservices</p>
        <p className="text-[8px] text-gray-700">Guichet Agréé — Service Continu</p>
      </div>

      {/* Titre Opération */}
      <div className="py-2 text-center border-b border-dashed border-black my-1 font-bold">
        <div className="text-xs uppercase">{receipt.operator}</div>
        <div className="text-[10px]">{typeLabel}</div>
      </div>

      {/* Détails de la transaction */}
      <div className="py-2 border-b border-dashed border-black space-y-1 text-[10px]">
        <div className="flex justify-between">
          <span>Date :</span>
          <span>{receipt.date} {receipt.time}</span>
        </div>
        <div className="flex justify-between">
          <span>Client :</span>
          <span className="font-bold">{receipt.clientName}</span>
        </div>
        {receipt.referenceNumber && (
          <div className="flex justify-between">
            <span>Réf/MTCN :</span>
            <span className="font-bold">{receipt.referenceNumber}</span>
          </div>
        )}
        {receipt.paymentMode && (
          <div className="flex justify-between">
            <span>Mode :</span>
            <span>{receipt.paymentMode}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>ID Op :</span>
          <span>{receipt.id.slice(-8).toUpperCase()}</span>
        </div>
      </div>

      {/* Montants */}
      <div className="py-2 border-b border-black space-y-1 text-[11px]">
        {isRetrait ? (
          <>
            {/* PRIX PRINCIPAL HORS TAXE ENCADRÉ */}
            <div className="p-2 border-2 border-black bg-gray-100 text-center my-1 space-y-0.5">
              <div className="text-[9px] font-black uppercase tracking-wider">
                PRIX HORS TAXE (REÇU PAR LE CLIENT)
              </div>
              <div className="text-base font-black">
                {formatCurrency(receipt.m2 || receipt.m1)}
              </div>
              <div className="text-[8px] text-gray-700">
                Montant principal net remis au client
              </div>
            </div>

            <div className="flex justify-between text-[10px] text-gray-750">
              <span>Taxe opérateur (M1 - M2) :</span>
              <span className="font-bold">+{formatCurrency(receipt.tax || 0)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-gray-600">
              <span>Total comptable avec taxe (M1) :</span>
              <span>{formatCurrency(receipt.m1)}</span>
            </div>
          </>
        ) : (
          <div className="flex justify-between font-black text-xs pt-1 border-t border-dashed border-black">
            <span>TOTAL ENCAISSÉ :</span>
            <span>{formatCurrency(receipt.m1)}</span>
          </div>
        )}
      </div>

      {/* Code barre & Clôture */}
      <div className="pt-3 text-center space-y-1">
        <div className="text-[9px] tracking-widest font-mono">
          *{receipt.id.slice(-10).toUpperCase()}*
        </div>
        <p className="text-[8px] text-gray-800">Conservez ce reçu comme justificatif officiel.</p>
        <p className="text-[9px] font-bold">Merci de votre confiance !</p>
      </div>
    </div>
  );
};
