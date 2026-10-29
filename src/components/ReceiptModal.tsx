import React, { useRef, useState, useEffect } from 'react';
import { 
  Printer, 
  Download, 
  Share2, 
  Copy, 
  Check, 
  X, 
  Receipt, 
  ArrowDownLeft, 
  ArrowUpRight, 
  FileText,
  Clock,
  Building2,
  Phone
} from 'lucide-react';
import { formatCurrency, formatDateFr } from '../utils/financeCalculations';

export interface ReceiptData {
  id: string;
  date: string;
  time: string;
  operator: string;
  type: 'retrait' | 'envoi' | 'seddo';
  clientName: string;
  referenceNumber?: string;
  m1: number; // Montant total TTC versé ou encaissé
  m2?: number; // Montant hors taxe (pour retrait)
  tax?: number; // Taxe calculée (pour retrait)
  paymentMode?: string;
  note?: string;
}

interface ReceiptModalProps {
  receipt: ReceiptData | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receipt, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  if (!receipt) return null;

  const isRetrait = receipt.type === 'retrait';
  const isEnvoi = receipt.type === 'envoi';
  const isSeddo = receipt.type === 'seddo';

  const typeLabel = isRetrait 
    ? 'RETRAIT D\'ESPÈCES (DÉCAISSEMENT)' 
    : isEnvoi 
    ? 'ENVOI DE FONDS (ENCAISSEMENT)' 
    : 'RÈGLEMENT PARTENAIRE SEDDO';

  // Copier le texte du reçu pour partage WhatsApp / SMS
  const handleCopyText = async () => {
    const text = `🧾 *REÇU ANNOIRFINANCEPRO*
📅 Date: ${receipt.date} à ${receipt.time}
🏢 Service: ${receipt.operator}
📌 Type: ${typeLabel}
👤 Client: ${receipt.clientName}
${receipt.referenceNumber ? `🔢 Réf / MTCN: ${receipt.referenceNumber}\n` : ''}${
  isRetrait 
    ? `💵 *PRIX HORS TAXE (MONTANT REÇU PAR LE CLIENT)*: *${formatCurrency(receipt.m2 || receipt.m1)}*\n➕ Taxe opérateur (M1 - M2): ${formatCurrency(receipt.tax || 0)}\n📋 Montant avec taxe (M1): ${formatCurrency(receipt.m1)}`
    : `💰 *MONTANT TOTAL ENCAISSÉ*: *${formatCurrency(receipt.m1)}*`
}
${receipt.paymentMode ? `💳 Mode de paiement: ${receipt.paymentMode}\n` : ''}
ID Transaction: ${receipt.id}
Merci de votre confiance !`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Erreur copie presse-papier', e);
    }
  };

  // Télécharger le ticket sous forme d'image PNG haute résolution
  const handleDownloadImage = () => {
    setDownloading(true);

    const canvas = document.createElement('canvas');
    const width = 600;
    const height = isRetrait ? 880 : 800;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setDownloading(false);
      return;
    }

    // Fond blanc avec texture thermique
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Cadre extérieur
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    // En-tête
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AnnoirFinancePro', width / 2, 60);

    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#64748B';
    ctx.fillText('Transferts Financiers & Services Multiservices', width / 2, 88);
    ctx.fillText('Guichet Agréé — Service Continu', width / 2, 108);

    // Ligne tiretée
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(30, 130);
    ctx.lineTo(width - 30, 130);
    ctx.stroke();
    ctx.setLineDash([]);

    // Badge Opérateur & Type
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(30, 145, width - 60, 60);
    ctx.strokeStyle = '#CBD5E1';
    ctx.strokeRect(30, 145, width - 60, 60);

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${receipt.operator.toUpperCase()} — ${typeLabel}`, width / 2, 182);

    // Date & Heure
    ctx.textAlign = 'left';
    ctx.font = '14px monospace';
    ctx.fillStyle = '#475569';
    ctx.fillText(`Date : ${formatDateFr(receipt.date, 'full')} à ${receipt.time}`, 35, 235);
    ctx.fillText(`Réf Transaction : ${receipt.id}`, 35, 260);

    // Ligne tiretée
    ctx.beginPath();
    ctx.moveTo(30, 275);
    ctx.lineTo(width - 30, 275);
    ctx.stroke();

    // Détails client & référence
    let y = 305;
    ctx.font = '15px sans-serif';
    ctx.fillStyle = '#64748B';
    ctx.fillText('Client / Bénéficiaire :', 35, y);
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(receipt.clientName, 220, y);

    if (receipt.referenceNumber) {
      y += 30;
      ctx.font = '15px sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.fillText('Code MTCN / Réf :', 35, y);
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(receipt.referenceNumber, 220, y);
    }

    if (receipt.paymentMode) {
      y += 30;
      ctx.font = '15px sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.fillText('Mode de règlement :', 35, y);
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(receipt.paymentMode, 220, y);
    }

    // Ligne de séparation des montants
    y += 25;
    ctx.beginPath();
    ctx.moveTo(30, y);
    ctx.lineTo(width - 30, y);
    ctx.stroke();

    // Montants détaillés
    y += 35;
    if (isRetrait) {
      // Grand encadré : PRIX HORS TAXE (MONTANT REÇU PAR LE CLIENT)
      ctx.fillStyle = '#ECFDF5';
      ctx.fillRect(30, y - 25, width - 60, 65);
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 2;
      ctx.strokeRect(30, y - 25, width - 60, 65);

      ctx.textAlign = 'left';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillStyle = '#065F46';
      ctx.fillText('PRIX HORS TAXE (NET REÇU PAR LE CLIENT) :', 45, y + 2);
      ctx.textAlign = 'right';
      ctx.font = 'black 24px monospace';
      ctx.fillText(formatCurrency(receipt.m2 || receipt.m1), width - 45, y + 5);

      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#047857';
      ctx.textAlign = 'left';
      ctx.fillText('Montant principal remis entre les mains du client', 45, y + 24);

      y += 65;
      // Lignes secondaires : Taxe et Montant avec taxe
      ctx.textAlign = 'left';
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText('Taxe de Retrait opérateur (M1 − M2) :', 35, y);
      ctx.textAlign = 'right';
      ctx.font = 'bold 15px monospace';
      ctx.fillStyle = '#047857';
      ctx.fillText(`+${formatCurrency(receipt.tax || 0)}`, width - 35, y);

      y += 28;
      ctx.textAlign = 'left';
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.fillText('Montant total avec taxe (M1) :', 35, y);
      ctx.textAlign = 'right';
      ctx.font = 'bold 15px monospace';
      ctx.fillStyle = '#334155';
      ctx.fillText(formatCurrency(receipt.m1), width - 35, y);
    } else {
      // Pour envoi ou Seddo
      ctx.fillStyle = '#EFF6FF';
      ctx.fillRect(30, y - 25, width - 60, 55);
      ctx.strokeStyle = '#3B82F6';
      ctx.strokeRect(30, y - 25, width - 60, 55);

      ctx.textAlign = 'left';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = '#1E40AF';
      ctx.fillText('MONTANT TOTAL ENCAISSÉ (M1) :', 45, y + 10);
      ctx.textAlign = 'right';
      ctx.font = 'black 22px monospace';
      ctx.fillText(formatCurrency(receipt.m1), width - 45, y + 12);
    }

    // Code-barres simulé esthétique
    y += 70;
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2;
    for (let x = 60; x < width - 60; x += (x % 7 === 0 ? 8 : 4)) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 40);
      ctx.stroke();
    }

    y += 55;
    ctx.font = '11px monospace';
    ctx.fillStyle = '#64748B';
    ctx.fillText(`*${receipt.id.toUpperCase()}*`, width / 2, y);

    // Pied de ticket
    y += 35;
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText('Ce ticket certifie la bonne exécution de votre transaction au guichet.', width / 2, y);
    y += 18;
    ctx.fillText('Conservez ce reçu — Merci de votre fidélité !', width / 2, y);

    // Exporter en PNG et télécharger
    const imgData = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = imgData;
    link.download = `Ticket_${receipt.operator.replace(/\s+/g, '_')}_${receipt.clientName.replace(/\s+/g, '_')}_${receipt.date}.png`;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    }, 100);

    setDownloading(false);
  };

  // Déclencher l'impression du ticket thermique
  const handlePrint = () => {
    // Marquer le body pour impression thermique
    document.body.classList.add('printing-receipt-mode');
    window.print();
    // Nettoyer après l'impression
    setTimeout(() => {
      document.body.classList.remove('printing-receipt-mode');
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto no-print">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] transition-colors">
        
        {/* Barre d'en-tête du modal */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-850 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Ticket Reçu Client Officiel
              </h3>
              <span className="text-[11px] text-slate-400">
                Format Thermique 80mm &amp; Numérique Partageable
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aperçu visuel réaliste du ticket thermique (défilable si écran mobile compact) */}
        <div className="p-3 sm:p-6 bg-slate-100 dark:bg-slate-950/70 flex justify-center overflow-y-auto flex-1">
          
          <div 
            id="thermal-receipt-preview"
            className="w-full max-w-sm bg-white text-slate-900 p-5 rounded-2xl shadow-md border border-slate-200 font-sans text-xs space-y-3 relative overflow-hidden"
          >
            {/* Dentelure supérieure décorative */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500"></div>

            {/* Titre & Logo Agence */}
            <div className="text-center space-y-0.5 pt-1">
              <h2 className="text-base font-extrabold tracking-tight text-slate-900">
                AnnoirFinancePro
              </h2>
              <p className="text-[10px] text-slate-500 font-medium">
                Agence Multiservices &amp; Transferts Financiers
              </p>
              <p className="text-[9px] text-slate-400">
                Guichet Agréé · Reçu Client Authentique
              </p>
            </div>

            {/* Ligne tiretée thermique */}
            <div className="border-t border-dashed border-slate-300 my-2"></div>

            {/* Badge de transaction */}
            <div className={`p-2 rounded-xl text-center border font-bold text-xs ${
              isRetrait 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : isEnvoi 
                ? 'bg-blue-50 border-blue-200 text-blue-800' 
                : 'bg-purple-50 border-purple-200 text-purple-800'
            }`}>
              <div className="uppercase tracking-wider text-[10px]">
                {receipt.operator}
              </div>
              <div className="text-xs font-black flex items-center justify-center gap-1 mt-0.5">
                {isRetrait ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                <span>{typeLabel}</span>
              </div>
            </div>

            {/* Métadonnées de l'opération */}
            <div className="space-y-1 text-[11px] pt-1">
              <div className="flex justify-between text-slate-500">
                <span>Date &amp; Heure :</span>
                <span className="font-mono font-bold text-slate-800">{receipt.date} à {receipt.time}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Client / Bénéficiaire :</span>
                <span className="font-bold text-slate-900 truncate max-w-[170px]">{receipt.clientName}</span>
              </div>
              {receipt.referenceNumber && (
                <div className="flex justify-between text-slate-500">
                  <span>Code MTCN / Réf :</span>
                  <span className="font-mono font-bold text-slate-900">{receipt.referenceNumber}</span>
                </div>
              )}
              {receipt.paymentMode && (
                <div className="flex justify-between text-slate-500">
                  <span>Mode de paiement :</span>
                  <span className="font-medium text-slate-800">{receipt.paymentMode}</span>
                </div>
              )}
            </div>

            {/* Ligne tiretée thermique */}
            <div className="border-t border-dashed border-slate-300 my-2"></div>

            {/* Montants comptables */}
            <div className="space-y-2 text-xs">
              {isRetrait ? (
                <>
                  {/* PRIX PRINCIPAL HORS TAXE REÇU PAR LE CLIENT */}
                  <div className="p-3 rounded-xl border-2 border-emerald-400 bg-emerald-50 text-emerald-950 space-y-1">
                    <div className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                      Prix Hors Taxe (Montant Reçu par le Client) :
                    </div>
                    <div className="font-mono text-xl sm:text-2xl font-black text-emerald-900 tabular-nums">
                      {formatCurrency(receipt.m2 || receipt.m1)}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-medium">
                      Prix principal effectivement remis entre les mains du client
                    </div>
                  </div>

                  {/* Lignes secondaires : taxe et montant avec taxe */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex justify-between text-emerald-700 font-semibold text-[11px]">
                      <span>Taxe de Retrait opérateur (M1 − M2) :</span>
                      <span className="font-mono font-bold">+{formatCurrency(receipt.tax || 0)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>Montant total comptable avec taxe (M1) :</span>
                      <span className="font-mono font-medium text-slate-700">{formatCurrency(receipt.m1)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-3 rounded-xl border-2 border-blue-400 bg-blue-50 text-blue-950 space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-wide text-blue-800">
                    Montant Total Encaissé :
                  </div>
                  <div className="font-mono text-xl sm:text-2xl font-black text-blue-950 tabular-nums">
                    {formatCurrency(receipt.m1)}
                  </div>
                </div>
              )}
            </div>

            {/* Code-barres simulé */}
            <div className="pt-2 text-center space-y-1">
              <div className="h-7 w-48 mx-auto bg-slate-900/90 flex items-center justify-around px-2 rounded-xs">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-full bg-white ${i % 3 === 0 ? 'w-1' : i % 2 === 0 ? 'w-0.5' : 'w-1.5'}`}
                  />
                ))}
              </div>
              <span className="font-mono text-[9px] text-slate-400 block tracking-widest">
                *{receipt.id.slice(-10).toUpperCase()}*
              </span>
            </div>

            {/* Mentions légales */}
            <div className="pt-2 border-t border-slate-100 text-center text-[10px] text-slate-400 space-y-0.5">
              <p>Conservez ce ticket comme justificatif officiel.</p>
              <p className="font-semibold text-slate-500">Merci de votre confiance !</p>
            </div>

          </div>

        </div>

        {/* Barre d'actions du modal (Impression, Téléchargement Image, Copie WhatsApp) */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          
          <button
            onClick={handleCopyText}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${
              copied 
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 text-emerald-700 dark:text-emerald-400' 
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
            }`}
            title="Copier le texte formaté pour l'envoyer par WhatsApp ou SMS"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copié !' : 'Texte WhatsApp'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadImage}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 transition-colors shadow-2xs"
              title="Télécharger l'image numérique du ticket (PNG haute résolution)"
            >
              <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{downloading ? 'Génération...' : 'Télécharger Image'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white transition-colors shadow-xs"
              title="Imprimer directement sur imprimante thermique ou standard"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer Ticket</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
